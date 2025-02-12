import Analytics from '../models/Analytics';
import Appointment from '../models/Appointment';
import Patient from '../models/Patient';
import Doctor from '../models/Doctor';
import Department from '../models/Department';
import Payment from '../models/Payment';
import { createAuditLog } from './audit';

export async function generateDailyAnalytics() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Appointment metrics
  const appointmentMetrics = await Appointment.aggregate([
    {
      $match: {
        dateTime: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    },
    {
      $group: {
        _id: null,
        totalAppointments: { $sum: 1 },
        completedAppointments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        cancelledAppointments: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        noShowAppointments: {
          $sum: { $cond: [{ $eq: ['$status', 'no-show'] }, 1, 0] }
        },
        totalRevenue: { $sum: '$paymentAmount' },
        pendingPayments: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'pending'] }, '$paymentAmount', 0]
          }
        },
        refundedAmount: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'refunded'] }, '$paymentAmount', 0]
          }
        }
      }
    }
  ]);

  // Patient metrics
  const patientMetrics = await Patient.aggregate([
    {
      $group: {
        _id: null,
        totalPatients: { $sum: 1 },
        activePatients: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        }
      }
    }
  ]);

  const newPatients = await Patient.countDocuments({
    createdAt: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
    }
  });

  // Doctor metrics
  const doctorMetrics = await Doctor.aggregate([
    {
      $group: {
        _id: null,
        activeDoctor: { $sum: 1 },
        averageRating: { $avg: '$ratings.average' }
      }
    }
  ]);

  // Department metrics
  const departmentMetrics = await Department.aggregate([
    {
      $lookup: {
        from: 'appointments',
        localField: '_id',
        foreignField: 'departmentId',
        as: 'appointments'
      }
    },
    {
      $project: {
        departmentId: '$_id',
        appointmentCount: { $size: '$appointments' },
        revenue: {
          $sum: '$appointments.paymentAmount'
        },
        patientCount: {
          $size: {
            $setUnion: '$appointments.patientId'
          }
        }
      }
    }
  ]);

  // Create analytics record
  await Analytics.create({
    type: 'daily',
    date: today,
    metrics: {
      ...appointmentMetrics[0],
      newPatients,
      ...patientMetrics[0],
      ...doctorMetrics[0],
      departmentMetrics
    }
  });
}

export async function getAnalytics(type, startDate, endDate) {
  const query = { type };
  
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  return Analytics.find(query).sort({ date: -1 });
}

export async function generateAnalytics(type, startDate, endDate, user) {
  const dateRange = {
    $gte: new Date(startDate),
    $lte: new Date(endDate)
  };

  let data;
  switch (type) {
    case 'appointments':
      data = await analyzeAppointments(dateRange, user);
      break;
    case 'revenue':
      data = await analyzeRevenue(dateRange, user);
      break;
    case 'performance':
      data = await analyzePerformance(dateRange, user);
      break;
    default:
      throw new Error('Invalid analytics type');
  }

  // Store analytics for historical tracking
  await Analytics.create({
    type,
    date: new Date(),
    data,
    generatedBy: user.id
  });

  // Audit log
  await createAuditLog({
    userId: user.id,
    action: 'generate_analytics',
    entityType: 'analytics',
    details: { type, startDate, endDate }
  });

  return data;
}

async function analyzeAppointments(dateRange, user) {
  const query = { dateTime: dateRange };
  
  // Security: Limit data access based on user role
  if (user.role === 'doctor') {
    query.doctorId = user.id;
  }

  const appointments = await Appointment.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$dateTime' }
        },
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return appointments;
}

async function analyzeRevenue(dateRange, user) {
  // Implementation of analyzeRevenue function
}

async function analyzePerformance(dateRange, user) {
  // Implementation of analyzePerformance function
} 