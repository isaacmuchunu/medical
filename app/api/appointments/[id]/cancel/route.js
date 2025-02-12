import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import Appointment from '@/backend/models/Appointment';
import Doctor from '@/backend/models/Doctor';
import { authMiddleware } from '@/backend/middleware/auth';

export async function POST(req, { params }) {
  try {
    await connectDB();
    await authMiddleware(req);

    const appointment = await Appointment.findById(params.id);
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (
      req.user.role === 'patient' && 
      appointment.patientId.toString() !== req.user.id
    ) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if appointment can be cancelled
    const appointmentTime = new Date(appointment.dateTime);
    const now = new Date();
    const hoursDifference = (appointmentTime - now) / (1000 * 60 * 60);

    if (hoursDifference < 24) {
      return NextResponse.json(
        { error: 'Appointments can only be cancelled 24 hours in advance' },
        { status: 400 }
      );
    }

    // Update appointment status
    appointment.status = 'cancelled';
    if (appointment.paymentStatus === 'completed') {
      appointment.paymentStatus = 'refunded';
      // TODO: Process refund through Stripe
    }
    await appointment.save();

    // Free up the doctor's time slot
    const dayOfWeek = appointmentTime.toLocaleString('en-us', { weekday: 'long' });
    const timeSlot = appointmentTime.toTimeString().slice(0, 5);

    await Doctor.updateOne(
      { 
        _id: appointment.doctorId,
        'availability.day': dayOfWeek,
        'availability.slots.startTime': { $lte: timeSlot },
        'availability.slots.endTime': { $gt: timeSlot }
      },
      { 
        $set: { 
          'availability.$.slots.$[slot].isBooked': false 
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

    return NextResponse.json({ 
      message: 'Appointment cancelled successfully',
      appointment 
    });
  } catch (error) {
    console.error('Cancel Appointment Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 