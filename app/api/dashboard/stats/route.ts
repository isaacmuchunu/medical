import { NextResponse } from "next/server";
import { authMiddleware } from "@/backend/middleware/auth";
import connectDB from "@/backend/config/db";
import Appointment from "@/backend/models/Appointment";
import Patient from "@/backend/models/Patient";

export async function GET(req: Request) {
  try {
    await connectDB();
    await authMiddleware(req);

    const [
      totalPatients,
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      monthlyStats
    ] = await Promise.all([
      Patient.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
      Appointment.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$dateTime" } },
            appointments: { $sum: 1 }
          }
        },
        { $sort: { "_id": 1 } },
        { $limit: 6 }
      ])
    ]);

    return NextResponse.json({
      totalPatients,
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      monthlyStats: monthlyStats.map(stat => ({
        name: stat._id,
        appointments: stat.appointments
      }))
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 