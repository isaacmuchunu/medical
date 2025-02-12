import jwt from 'jsonwebtoken';
import User from '../models/User';
import { createAuditLog } from './audit';
import { sendEmail } from './notification';
import { rateLimit } from '../utils/rateLimit';
import crypto from 'crypto';

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 login attempts per window
});

export async function authenticateUser(email, password, req) {
  await loginRateLimit(req);

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new Error('Invalid credentials');
  }

  if (!user.emailVerified) {
    throw new Error('Email not verified');
  }

  if (!user.isActive) {
    throw new Error('Account is disabled');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Create audit log
  await createAuditLog({
    userId: user._id,
    action: 'login',
    entityType: 'user',
    ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  });

  return user;
}

export async function initiatePasswordReset(email) {
  const user = await User.findOne({ email });
  if (!user) return; // Don't reveal user existence

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  user.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes

  await user.save();

  // Send reset email
  await sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    template: 'password-reset',
    data: {
      resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    }
  });

  return true;
}

export async function verifyEmail(token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new Error('Invalid or expired verification token');
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  return true;
} 