import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import { authMiddleware, requireRole } from '@/backend/middleware/auth';
import { getAnalytics } from '@/backend/services/analytics';

export async function GET(req) {
  try {
    await connectDB();
    await requireRole('admin')(req);

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'daily';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const analytics = await getAnalytics(type, startDate, endDate);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Fetch Analytics Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 