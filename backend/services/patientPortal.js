import Patient from '../models/Patient';
import Appointment from '../models/Appointment';
import MedicalRecord from '../models/MedicalRecord';
import { createAuditLog } from './audit';

export async function getPatientDashboard(patientId) {
  const [
    upcomingAppointments,
    recentRecords,
    prescriptions,
    bills
  ] = await Promise.all([
    Appointment.find({
      patientId,
      dateTime: { $gte: new Date() },
      status: { $nin: ['cancelled', 'completed'] }
    })
      .populate('doctorId', 'profile specialization')
      .sort({ dateTime: 1 })
      .limit(5),

    MedicalRecord.find({ patientId })
      .sort({ createdAt: -1 })
      .limit(5),

    MedicalRecord.find({
      patientId,
      type: 'prescription',
      'prescription.endDate': { $gte: new Date() }
    }).sort({ createdAt: -1 }),

    Payment.find({
      patientId,
      status: 'pending'
    }).populate('appointmentId')
  ]);

  return {
    upcomingAppointments,
    recentRecords,
    activePrescriptions: prescriptions,
    pendingBills: bills
  };
}

export async function updatePatientProfile(patientId, data, user) {
  // Validate and sanitize data
  const sanitizedData = {
    'profile.name': data.name,
    'profile.phone': data.phone,
    'profile.address': data.address,
    'profile.emergencyContact': data.emergencyContact,
    notificationPreferences: data.notificationPreferences
  };

  const patient = await Patient.findByIdAndUpdate(
    patientId,
    { $set: sanitizedData },
    { new: true }
  );

  // Audit log
  await createAuditLog({
    userId: user.id,
    action: 'update_profile',
    entityType: 'patient',
    entityId: patientId,
    details: { updates: Object.keys(data) }
  });

  return patient;
} 