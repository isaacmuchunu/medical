import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import { authMiddleware, requireRole } from '@/backend/middleware/auth';
import Appointment from '@/backend/models/Appointment';
import Patient from '@/backend/models/Patient';
import Doctor from '@/backend/models/Doctor';
import Department from '@/backend/models/Department';

export async function GET(req) {
  try {
    await connectDB();
    await requireRole('admin')(req);

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get dashboard metrics
    const [
      todayAppointments,
      totalPatients,
      totalDoctors,
      totalDepartments,
      recentAppointments,
      pendingPayments
    ] = await Promise.all([
      // Today's appointments
      Appointment.countDocuments({
        dateTime: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }),

      // Total patients
      Patient.countDocuments(),

      // Total doctors
      Doctor.countDocuments(),

      // Total departments
      Department.countDocuments(),

      // Recent appointments
      Appointment.find()
        .sort({ dateTime: -1 })
        .limit(5)
        .populate('patientId', 'profile')
        .populate('doctorId', 'profile specialization'),

      // Pending payments
      Appointment.find({
        paymentStatus: 'pending'
      })
        .sort({ dateTime: 1 })
        .limit(5)
        .populate('patientId', 'profile')
        .populate('doctorId', 'profile')
    ]);

    return NextResponse.json({
      metrics: {
        todayAppointments,
        totalPatients,
        totalDoctors,
        totalDepartments
      },
      recentActivity: {
        appointments: recentAppointments,
        pendingPayments
      }
    });
  } catch (error) {
    console.error('Fetch Dashboard Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 