import Doctor from '../models/Doctor';
import { createAuditLog } from './audit';

export async function setRecurringAvailability(doctorId, pattern, user) {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw new Error('Doctor not found');

  // Validate pattern
  validateAvailabilityPattern(pattern);

  // Update availability
  doctor.availability = pattern;
  await doctor.save();

  // Audit log
  await createAuditLog({
    userId: user.id,
    action: 'update_availability',
    entityType: 'doctor',
    entityId: doctorId,
    details: { pattern }
  });
}

export async function setLeave(doctorId, leaveData, user) {
  const { startDate, endDate, reason } = leaveData;

  // Validate dates
  if (new Date(startDate) >= new Date(endDate)) {
    throw new Error('Invalid date range');
  }

  // Update doctor's leave schedule
  await Doctor.findByIdAndUpdate(doctorId, {
    $push: {
      leaves: {
        startDate,
        endDate,
        reason,
        status: 'pending'
      }
    }
  });

  // Handle existing appointments
  const appointments = await Appointment.find({
    doctorId,
    dateTime: { $gte: startDate, $lte: endDate },
    status: 'scheduled'
  });

  // Process affected appointments
  for (const appointment of appointments) {
    // Notify patient
    await sendNotification({
      userId: appointment.patientId,
      title: 'Appointment Rescheduling Required',
      message: `Your appointment on ${appointment.dateTime} needs to be rescheduled.`,
      type: 'appointment',
      priority: 'high'
    });
  }

  // Audit log
  await createAuditLog({
    userId: user.id,
    action: 'set_leave',
    entityType: 'doctor',
    entityId: doctorId,
    details: leaveData
  });
} 