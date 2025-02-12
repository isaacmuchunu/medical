import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import Doctor from '@/backend/models/Doctor';
import { authMiddleware } from '@/backend/middleware/auth';

export async function GET(req, { params }) {
  try {
    await connectDB();
    await authMiddleware(req);

    const doctor = await Doctor.findById(params.id)
      .populate('userId', 'email profile')
      .populate('departmentId', 'name description');

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json(doctor);
  } catch (error) {
    console.error('Fetch Doctor Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectDB();
    await authMiddleware(req);

    const doctor = await Doctor.findById(params.id);
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Only allow self-update or admin update
    if (req.user.role !== 'admin' && doctor.userId.toString() !== req.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true }
    ).populate('userId', 'email profile');

    return NextResponse.json(updatedDoctor);
  } catch (error) {
    console.error('Update Doctor Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 