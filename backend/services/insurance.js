import axios from 'axios';
import { createAuditLog } from './audit';

export async function verifyInsurance(patientId, insuranceDetails) {
  try {
    const response = await axios.post(
      process.env.INSURANCE_API_URL + '/verify',
      {
        patientId,
        ...insuranceDetails
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.INSURANCE_API_KEY}`
        }
      }
    );

    await createAuditLog({
      userId: patientId,
      action: 'verify_insurance',
      entityType: 'insurance',
      details: insuranceDetails
    });

    return response.data;
  } catch (error) {
    console.error('Insurance Verification Error:', error);
    throw error;
  }
}

export async function submitClaim(appointmentId, services) {
  // Implementation for submitting insurance claims
} 