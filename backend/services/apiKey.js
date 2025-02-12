import crypto from 'crypto';
import ApiKey from '../models/ApiKey';
import { createAuditLog } from './audit';

export async function generateApiKey(userId, data) {
  const key = crypto.randomBytes(32).toString('hex');
  
  const apiKey = await ApiKey.create({
    ...data,
    userId,
    key,
    expiresAt: data.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
  });

  await createAuditLog({
    userId,
    action: 'generate_api_key',
    entityType: 'api_key',
    entityId: apiKey._id,
    details: { name: data.name }
  });

  // Return key only once
  return {
    id: apiKey._id,
    key,
    name: apiKey.name,
    expiresAt: apiKey.expiresAt
  };
}

export async function validateApiKey(key, ipAddress) {
  const hashedKey = crypto
    .createHash('sha256')
    .update(key)
    .digest('hex');

  const apiKey = await ApiKey.findOne({
    hashedKey,
    isActive: true,
    expiresAt: { $gt: new Date() }
  });

  if (!apiKey) return null;

  // Check IP restrictions
  if (apiKey.ipRestrictions?.length > 0) {
    const isAllowedIp = apiKey.ipRestrictions.some(ip => {
      if (ip.includes('*')) {
        const pattern = ip.replace(/\*/g, '.*');
        return new RegExp(`^${pattern}$`).test(ipAddress);
      }
      return ip === ipAddress;
    });

    if (!isAllowedIp) return null;
  }

  // Update last used
  apiKey.lastUsed = new Date();
  await apiKey.save();

  return apiKey;
}

export async function revokeApiKey(keyId, userId) {
  const apiKey = await ApiKey.findById(keyId);
  if (!apiKey || apiKey.userId.toString() !== userId) {
    throw new Error('API key not found');
  }

  apiKey.isActive = false;
  await apiKey.save();

  await createAuditLog({
    userId,
    action: 'revoke_api_key',
    entityType: 'api_key',
    entityId: keyId
  });

  return true;
} 