import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import Prescription from '@/backend/models/Prescription';
import { authMiddleware, requireRole } from '@/backend/middleware/auth';

export async function POST(req) {
  try {
    await connectDB();
    await requireRole('doctor')(req);

    const body = await req.json();
    const { 
      patientId,
      appointmentId,
      medications,
      diagnosis,
      notes,
      validUntil,
      refills 
    } = body;

    const prescription = await Prescription.create({
      patientId,
      doctorId: req.user.id,
      appointmentId,
      medications,
      diagnosis,
      notes,
      validUntil,
      refills,
    });

    return NextResponse.json(
      { message: 'Prescription created successfully', prescription },
      { status: 201 }
    );
  } catch (error) {
    console.error('Prescription Creation Error:', error);
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

    const prescriptions = await Prescription.find(query)
      .populate('patientId', 'profile')
      .populate('doctorId', 'profile specialization')
      .populate('appointmentId')
      .sort({ issuedDate: -1 });

    return NextResponse.json(prescriptions);
  } catch (error) {
    console.error('Fetch Prescriptions Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 