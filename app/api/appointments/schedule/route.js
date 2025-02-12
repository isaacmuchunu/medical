import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import Appointment from '@/backend/models/Appointment';
import Doctor from '@/backend/models/Doctor';
import { authMiddleware } from '@/backend/middleware/auth';

export async function POST(req) {
  try {
    await connectDB();
    await authMiddleware(req);

    const body = await req.json();
    const { doctorId, dateTime, type, symptoms } = body;

    // Validate doctor availability
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Check if slot is available
    const dayOfWeek = new Date(dateTime).toLocaleString('en-us', { weekday: 'long' });
    const timeSlot = new Date(dateTime).toTimeString().slice(0, 5);

    const dayAvailability = doctor.availability.find(a => a.day === dayOfWeek);
    if (!dayAvailability) {
      return NextResponse.json(
        { error: 'Doctor not available on this day' },
        { status: 400 }
      );
    }

    const slotAvailable = dayAvailability.slots.some(
      slot => !slot.isBooked && 
      slot.startTime <= timeSlot && 
      slot.endTime > timeSlot
    );

    if (!slotAvailable) {
      return NextResponse.json(
        { error: 'Selected time slot is not available' },
        { status: 400 }
      );
    }

    // Create appointment
    const appointment = await Appointment.create({
      patientId: req.user.id,
      doctorId,
      dateTime,
      type,
      symptoms,
      status: 'scheduled',
      paymentStatus: 'pending',
      paymentAmount: doctor.consultationFee
    });

    // Update doctor's availability
    await Doctor.updateOne(
      { 
        _id: doctorId,
        'availability.day': dayOfWeek,
        'availability.slots.startTime': { $lte: timeSlot },
        'availability.slots.endTime': { $gt: timeSlot }
      },
      { 
        $set: { 
          'availability.$.slots.$[slot].isBooked': true 
        }
      },
      {
        arrayFilters: [
          { 
            'slot.startTime': { $lte: timeSlot },
            'slot.endTime': { $gt: timeSlot }
          }
        ]
      }
    );

    return NextResponse.json(
      { message: 'Appointment scheduled successfully', appointment },
      { status: 201 }
    );
  } catch (error) {
    console.error('Schedule Appointment Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 