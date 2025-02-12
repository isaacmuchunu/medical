import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import Patient from '@/backend/models/Patient';
import { authMiddleware } from '@/backend/middleware/auth';

export async function GET(req, { params }) {
  try {
    await connectDB();
    await authMiddleware(req);

    const patient = await Patient.findById(params.id)
      .populate('userId', 'email profile');

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Access control
    if (req.user.role === 'patient' && patient.userId.toString() !== req.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Fetch Patient Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectDB();
    await authMiddleware(req);

    const patient = await Patient.findById(params.id);
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Only allow self-update or doctor update
    if (req.user.role === 'patient' && patient.userId.toString() !== req.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const updatedPatient = await Patient.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true }
    );

    return NextResponse.json(updatedPatient);
  } catch (error) {
    console.error('Update Patient Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 