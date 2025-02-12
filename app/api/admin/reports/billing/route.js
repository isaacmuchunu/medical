import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import { authMiddleware, requireRole } from '@/backend/middleware/auth';
import { generateBillingReport } from '@/backend/services/billing';
import { validateDateRange } from '@/backend/utils/validation';

export async function GET(req) {
  try {
    await connectDB();
    await requireRole(['admin', 'finance'])(req);

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    // Validate date range
    if (!validateDateRange(startDate, endDate)) {
      return NextResponse.json(
        { error: 'Invalid date range' },
        { status: 400 }
      );
    }

    const report = await generateBillingReport(
      { startDate, endDate, status },
      req.user
    );

    return NextResponse.json(report);
  } catch (error) {
    console.error('Billing Report Error:', error);
    if (error.message === 'Too many requests') {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 