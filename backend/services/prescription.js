import MedicalRecord from '../models/MedicalRecord';
import { sendNotification } from './notification';
import { createAuditLog } from './audit';

export async function createPrescription(data, doctorId) {
  const prescription = await MedicalRecord.create({
    ...data,
    type: 'prescription',
    doctorId
  });

  // Send notification to patient
  await sendNotification({
    userId: data.patientId,
    title: 'New Prescription',
    message: 'Your doctor has prescribed new medications',
    type: 'prescription',
    priority: 'high'
  });

  // Create audit log
  await createAuditLog({
    userId: doctorId,
    action: 'create_prescription',
    entityType: 'medical_record',
    entityId: prescription._id
  });

  return prescription;
} 