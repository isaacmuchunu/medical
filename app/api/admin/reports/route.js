import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import { authMiddleware, requireRole } from '@/backend/middleware/auth';
import Appointment from '@/backend/models/Appointment';
import Doctor from '@/backend/models/Doctor';
import Department from '@/backend/models/Department';

export async function GET(req) {
  try {
    await connectDB();
    await requireRole('admin')(req);

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let report;
    const dateRange = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };

    switch (type) {
      case 'revenue':
        report = await Appointment.aggregate([
          {
            $match: {
              dateTime: dateRange,
              paymentStatus: 'completed'
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$dateTime' }
              },
              totalRevenue: { $sum: '$paymentAmount' },
              appointmentCount: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]);
        break;

      case 'doctor-performance':
        report = await Appointment.aggregate([
          {
            $match: { dateTime: dateRange }
          },
          {
            $group: {
              _id: '$doctorId',
              appointmentCount: { $sum: 1 },
              completedAppointments: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
              },
              cancelledAppointments: {
                $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
              },
              totalRevenue: {
                $sum: { 
                  $cond: [
                    { $eq: ['$paymentStatus', 'completed'] },
                    '$paymentAmount',
                    0
                  ]
                }
              }
            }
          },
          {
            $lookup: {
              from: 'doctors',
              localField: '_id',
              foreignField: '_id',
              as: 'doctor'
            }
          },
          { $unwind: '$doctor' },
          {
            $project: {
              doctor: {
                profile: 1,
                specialization: 1,
                ratings: 1
              },
              metrics: {
                appointmentCount: 1,
                completedAppointments: 1,
                cancelledAppointments: 1,
                totalRevenue: 1
              }
            }
          }
        ]);
        break;

      case 'department-performance':
        report = await Department.aggregate([
          {
            $lookup: {
              from: 'appointments',
              localField: '_id',
              foreignField: 'departmentId',
              as: 'appointments'
            }
          },
          {
            $project: {
              name: 1,
              metrics: {
                appointmentCount: { $size: '$appointments' },
                revenue: {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: '$appointments',
                          as: 'apt',
                          cond: {
                            $and: [
                              { $eq: ['$$apt.paymentStatus', 'completed'] },
                              { $gte: ['$$apt.dateTime', dateRange.$gte] },
                              { $lte: ['$$apt.dateTime', dateRange.$lte] }
                            ]
                          }
                        }
                      },
                      as: 'apt',
                      in: '$$apt.paymentAmount'
                    }
                  }
                }
              }
            }
          }
        ]);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Generate Report Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 