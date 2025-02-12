import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import Doctor from '@/backend/models/Doctor';
import { authMiddleware } from '@/backend/middleware/auth';

export async function GET(req) {
  try {
    await connectDB();
    await authMiddleware(req);

    const { searchParams } = new URL(req.url);
    const specialization = searchParams.get('specialization');
    const departmentId = searchParams.get('departmentId');
    const search = searchParams.get('search');

    let query = {};
    
    if (specialization) {
      query.specialization = specialization;
    }
    
    if (departmentId) {
      query.departmentId = departmentId;
    }

    if (search) {
      query['$or'] = [
        { 'profile.name': { $regex: search, $options: 'i' } },
        { 'specialization': { $regex: search, $options: 'i' } }
      ];
    }

    const doctors = await Doctor.find(query)
      .populate('userId', 'email profile')
      .populate('departmentId', 'name')
      .sort({ 'profile.name': 1 });

    return NextResponse.json(doctors);
  } catch (error) {
    console.error('Fetch Doctors Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 