import { createHash } from 'crypto';

const rateLimitStore = new Map();

export function rateLimit({ windowMs, max }) {
  return async function rateLimiter(req) {
    const key = createHash('sha256')
      .update(req.headers['x-forwarded-for'] || req.socket.remoteAddress)
      .digest('hex');

    const now = Date.now();
    const windowStart = now - windowMs;

    const requestTimestamps = rateLimitStore.get(key) || [];
    const requestsInWindow = requestTimestamps.filter(timestamp => timestamp > windowStart);

    if (requestsInWindow.length >= max) {
      throw new Error('Too many requests, please try again later.');
    }

    requestsInWindow.push(now);
    rateLimitStore.set(key, requestsInWindow);

    // Cleanup old entries
    setTimeout(() => {
      const timestamps = rateLimitStore.get(key) || [];
      rateLimitStore.set(
        key,
        timestamps.filter(timestamp => timestamp > now - windowMs)
      );
    }, windowMs);
  };
} 