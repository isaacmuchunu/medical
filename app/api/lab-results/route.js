import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import LabResult from '@/backend/models/LabResult';
import { authMiddleware, requireRole } from '@/backend/middleware/auth';

export async function POST(req) {
  try {
    await connectDB();
    await requireRole('doctor')(req);

    const body = await req.json();
    const { 
      patientId,
      testType,
      results,
      labTechnician,
      comments,
      date,
      attachments 
    } = body;

    const labResult = await LabResult.create({
      patientId,
      doctorId: req.user.id,
      testType,
      results,
      labTechnician,
      comments,
      date,
      attachments,
    });

    return NextResponse.json(
      { message: 'Lab result created successfully', labResult },
      { status: 201 }
    );
  } catch (error) {
    console.error('Lab Result Creation Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await connectDB();
    await authMiddleware(req);

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');
    
    let query = {};
    
    // Access control based on role
    if (req.user.role === 'patient') {
      query.patientId = req.user.id;
    } else if (req.user.role === 'doctor') {
      if (patientId) {
        query.patientId = patientId;
      } else {
        query.doctorId = req.user.id;
      }
    }

    if (status) {
      query.status = status;
    }

    const labResults = await LabResult.find(query)
      .populate('patientId', 'profile')
      .populate('doctorId', 'profile specialization')
      .sort({ date: -1 });

    return NextResponse.json(labResults);
  } catch (error) {
    console.error('Fetch Lab Results Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 