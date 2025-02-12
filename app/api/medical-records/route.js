import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import MedicalRecord from '@/backend/models/MedicalRecord';
import { authMiddleware } from '@/backend/middleware/auth';

export async function GET(req) {
  try {
    await connectDB();
    await authMiddleware(req);

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');
    const type = searchParams.get('type');

    let query = {};
    
    if (req.user.role === 'patient') {
      query.patientId = req.user.id;
    } else if (req.user.role === 'doctor' && patientId) {
      query.patientId = patientId;
    }

    if (type) {
      query.type = type;
    }

    const records = await MedicalRecord.find(query)
      .populate('patientId', 'profile')
      .populate('doctorId', 'profile specialization')
      .sort({ date: -1 });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Fetch Medical Records Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 