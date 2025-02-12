import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function authMiddleware(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      throw new Error('Not authenticated');
    }
    req.user = token;
  } catch (error) {
    throw new Error('Authentication failed');
  }
}

export function requireRole(roles) {
  return async function(req) {
    await authMiddleware(req);
    
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(req.user.role)) {
      throw new Error('Unauthorized');
    }
  };
}

export function withAuth(handler) {
  return async function(req, ...args) {
    try {
      await authMiddleware(req);
      return handler(req, ...args);
    } catch (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Not authenticated' ? 401 : 403 }
      );
    }
  };
} 