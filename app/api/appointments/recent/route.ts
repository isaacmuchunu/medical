import { NextResponse } from "next/server";
import { authMiddleware } from "@/backend/middleware/auth";
import connectDB from "@/backend/config/db";
import Appointment from "@/backend/models/Appointment";

export async function GET(req: Request) {
  try {
    await connectDB();
    await authMiddleware(req);

    const appointments = await Appointment.find({
      dateTime: { $gte: new Date() }
    })
      .sort({ dateTime: 1 })
      .limit(5)
      .populate('patientId', 'profile')
      .populate('doctorId', 'profile specialization');

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Recent Appointments Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 