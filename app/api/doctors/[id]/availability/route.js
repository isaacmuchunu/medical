import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import Doctor from '@/backend/models/Doctor';
import { authMiddleware } from '@/backend/middleware/auth';
import { createAuditLog } from '@/backend/services/audit';

export async function GET(req, { params }) {
  try {
    await connectDB();
    await authMiddleware(req);

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const doctor = await Doctor.findById(params.id);
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    let availability = doctor.availability;
    
    // Filter availability by date range if provided
    if (startDate && endDate) {
      // Implementation for date range filtering
    }

    return NextResponse.json(availability);
  } catch (error) {
    console.error('Fetch Availability Error:', error);
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
    const { availability } = body;

    // Validate availability slots
    for (const day of availability) {
      for (const slot of day.slots) {
        if (slot.startTime >= slot.endTime) {
          return NextResponse.json(
            { error: 'Invalid time slot' },
            { status: 400 }
          );
        }
      }
    }

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      params.id,
      { $set: { availability } },
      { new: true }
    );

    // Create audit log
    await createAuditLog({
      userId: req.user.id,
      action: 'update_availability',
      entityType: 'doctor',
      entityId: params.id,
      details: { availability }
    });

    return NextResponse.json(updatedDoctor);
  } catch (error) {
    console.error('Update Availability Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 