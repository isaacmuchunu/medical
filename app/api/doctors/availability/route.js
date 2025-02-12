import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import Doctor from '@/backend/models/Doctor';
import { authMiddleware, requireRole } from '@/backend/middleware/auth';

export async function POST(req) {
  try {
    await connectDB();
    await requireRole('doctor')(req);

    const body = await req.json();
    const { availability } = body;

    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { availability } },
      { new: true }
    );

    return NextResponse.json(
      { message: 'Availability updated successfully', doctor },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update Availability Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date');

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Get day of week from date
    const dayOfWeek = new Date(date).toLocaleString('en-us', { weekday: 'long' });
    
    // Find available slots for the given day
    const dayAvailability = doctor.availability.find(a => a.day === dayOfWeek);
    
    if (!dayAvailability) {
      return NextResponse.json({ slots: [] });
    }

    return NextResponse.json({ slots: dayAvailability.slots });
  } catch (error) {
    console.error('Fetch Availability Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 