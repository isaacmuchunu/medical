import { rateLimit } from '../utils/rateLimit';
import Payment from '../models/Payment';
import { createAuditLog } from './audit';
import { sendNotification } from './notification';

const paymentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 // limit each IP to 10 payment attempts per windowMs
});

export async function processPayment(data, user, req) {
  // Apply rate limiting
  await paymentRateLimit(req);

  try {
    const payment = await Payment.create({
      ...data,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    // Audit log for security tracking
    await createAuditLog({
      userId: user.id,
      action: 'process_payment',
      entityType: 'payment',
      entityId: payment._id,
      details: {
        amount: payment.amount,
        status: payment.status,
        appointmentId: payment.appointmentId
      },
      ipAddress: payment.ipAddress,
      userAgent: payment.userAgent
    });

    // Notify relevant parties
    await sendNotification({
      userId: payment.patientId,
      title: 'Payment Processed',
      message: `Your payment of ${payment.amount} ${payment.currency} has been processed.`,
      type: 'payment',
      priority: 'high'
    });

    return payment;
  } catch (error) {
    console.error('Payment Processing Error:', error);
    throw error;
  }
}

export async function generateBillingReport(filters, user) {
  try {
    const query = {};
    
    // Security: Ensure users can only access their own data
    if (user.role === 'patient') {
      query.patientId = user.id;
    } else if (user.role === 'doctor') {
      query.doctorId = user.id;
    }

    if (filters.startDate && filters.endDate) {
      query.createdAt = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    if (filters.status) {
      query.status = filters.status;
    }

    const aggregation = [
      { $match: query },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            status: '$status'
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ];

    const report = await Payment.aggregate(aggregation);

    // Audit log for report generation
    await createAuditLog({
      userId: user.id,
      action: 'generate_billing_report',
      entityType: 'report',
      details: { filters }
    });

    return report;
  } catch (error) {
    console.error('Generate Billing Report Error:', error);
    throw error;
  }
} 