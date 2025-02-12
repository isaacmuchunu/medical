import { withIronSessionApiRoute } from 'iron-session/next';
import { createAuditLog } from '../services/audit';

const sessionConfig = {
  cookieName: 'medical_session',
  password: process.env.SESSION_PASSWORD,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    httpOnly: true
  }
};

export function withSession(handler) {
  return withIronSessionApiRoute(async (req, res) => {
    try {
      // Check session expiry
      if (req.session.user && req.session.expiresAt < Date.now()) {
        await createAuditLog({
          userId: req.session.user.id,
          action: 'session_expired',
          entityType: 'session'
        });
        req.session.destroy();
        throw new Error('Session expired');
      }

      return handler(req, res);
    } catch (error) {
      await createAuditLog({
        userId: req.session?.user?.id,
        action: 'session_error',
        entityType: 'session',
        details: { error: error.message }
      });
      throw error;
    }
  }, sessionConfig);
}

export function extendSession(req) {
  if (req.session.user) {
    req.session.expiresAt = Date.now() + (60 * 60 * 1000); // Extend by 1 hour
  }
} 