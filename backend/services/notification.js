import Notification from '../models/Notification';
import { getIO } from './websocket';
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import { rateLimit } from '../utils/rateLimit';
import { createAuditLog } from './audit';
import { sanitizeInput } from '../utils/validation';
import User from '../models/User';

// Initialize email and SMS clients
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Rate limiting for notifications
const notificationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50 // limit each user to 50 notifications per hour
});

export async function createNotification(data) {
  try {
    const notification = await Notification.create(data);
    
    // Send real-time notification
    const io = getIO();
    io.to(`user:${data.userId}`).emit('notification', notification);

    return notification;
  } catch (error) {
    console.error('Create Notification Error:', error);
    throw error;
  }
}

export async function markNotificationsAsRead(userId, notificationIds) {
  try {
    await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        userId
      },
      {
        $set: { read: true }
      }
    );
  } catch (error) {
    console.error('Mark Notifications Read Error:', error);
    throw error;
  }
}

export async function sendEmail(to, subject, html, user, req) {
  try {
    // Apply rate limiting
    await notificationRateLimit(req);

    // Sanitize inputs
    subject = sanitizeInput(subject);
    html = sanitizeInput(html);

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject,
      html,
      trackingSettings: {
        clickTracking: { enable: false },
        openTracking: { enable: false }
      }
    };

    await sgMail.send(msg);

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'send_email',
      entityType: 'notification',
      details: { to, subject },
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress
    });
  } catch (error) {
    console.error('Send Email Error:', error);
    throw error;
  }
}

export async function sendSMS(to, message, user, req) {
  try {
    // Apply rate limiting
    await notificationRateLimit(req);

    // Sanitize message
    message = sanitizeInput(message);

    await twilioClient.messages.create({
      body: message,
      to,
      from: process.env.TWILIO_PHONE_NUMBER
    });

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'send_sms',
      entityType: 'notification',
      details: { to, message: message.substring(0, 50) },
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress
    });
  } catch (error) {
    console.error('Send SMS Error:', error);
    throw error;
  }
}

export async function sendNotification(data) {
  const { userId, title, message, type, priority, emailTemplate, smsTemplate } = data;

  // Get user's notification preferences
  const user = await User.findById(userId).select('profile notificationPreferences');
  
  if (user.notificationPreferences.email && emailTemplate) {
    await sendEmail(
      user.profile.email,
      title,
      emailTemplate,
      { id: userId },
      { headers: {} } // System-generated notification
    );
  }

  if (user.notificationPreferences.sms && smsTemplate) {
    await sendSMS(
      user.profile.phone,
      smsTemplate,
      { id: userId },
      { headers: {} } // System-generated notification
    );
  }

  // Create in-app notification
  await Notification.create({
    userId,
    title: sanitizeInput(title),
    message: sanitizeInput(message),
    type,
    priority
  });
} 