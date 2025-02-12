import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import Appointment from '@/backend/models/Appointment';
import { authMiddleware } from '@/backend/middleware/auth';

export async function POST(req) {
  try {
    await connectDB();
    await authMiddleware(req);

    const body = await req.json();
    const { 
      doctorId, 
      dateTime, 
      type, 
      symptoms 
    } = body;

    // Create appointment
    const appointment = await Appointment.create({
      patientId: req.user.id,
      doctorId,
      dateTime,
      type,
      symptoms,
      status: 'scheduled'
    });

    return NextResponse.json(
      { message: 'Appointment scheduled successfully', appointment },
      { status: 201 }
    );
  } catch (error) {
    console.error('Appointment Creation Error:', error);
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
    const status = searchParams.get('status');
    const role = req.user.role;
    
    let query = {};
    
    // Filter appointments based on user role
    if (role === 'patient') {
      query.patientId = req.user.id;
    } else if (role === 'doctor') {
      query.doctorId = req.user.id;
    }
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'profile')
      .populate('doctorId', 'profile specialization')
      .sort({ dateTime: -1 });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Fetch Appointments Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 