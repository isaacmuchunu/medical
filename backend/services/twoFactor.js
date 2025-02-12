import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import User from '../models/User';
import { createAuditLog } from './audit';
import { rateLimit } from '../utils/rateLimit';

const verifyLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});

export async function setupTwoFactor(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(
    user.email,
    'Medical App',
    secret
  );

  // Store secret temporarily
  user.twoFactorSecret = secret;
  user.twoFactorPending = true;
  await user.save();

  // Generate QR code
  const qrCodeUrl = await qrcode.toDataURL(otpauth);

  return {
    secret,
    qrCodeUrl
  };
}

export async function verifyAndEnableTwoFactor(userId, token, req) {
  await verifyLimit(req);

  const user = await User.findById(userId);
  if (!user?.twoFactorSecret || !user.twoFactorPending) {
    throw new Error('Two-factor setup not initiated');
  }

  const isValid = authenticator.verify({
    token,
    secret: user.twoFactorSecret
  });

  if (!isValid) {
    throw new Error('Invalid verification code');
  }

  user.twoFactorEnabled = true;
  user.twoFactorPending = false;
  await user.save();

  await createAuditLog({
    userId,
    action: 'enable_2fa',
    entityType: 'user',
    details: { method: 'totp' }
  });

  return true;
}

export async function verifyTwoFactor(userId, token) {
  const user = await User.findById(userId);
  if (!user?.twoFactorSecret || !user.twoFactorEnabled) {
    throw new Error('Two-factor not enabled');
  }

  return authenticator.verify({
    token,
    secret: user.twoFactorSecret
  });
} 