import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import MedicalRecord from '@/backend/models/MedicalRecord';
import { authMiddleware } from '@/backend/middleware/auth';
import { createAuditLog } from '@/backend/services/audit';

export async function GET(req, { params }) {
  try {
    await connectDB();
    await authMiddleware(req);

    // Access control
    if (
      req.user.role === 'patient' && 
      params.id !== req.user.id
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = { patientId: params.id };
    if (type) query.type = type;
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const records = await MedicalRecord.find(query)
      .populate('doctorId', 'profile specialization')
      .populate('appointmentId', 'dateTime')
      .sort({ createdAt: -1 });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Fetch Medical Records Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    await connectDB();
    await authMiddleware(req);

    // Only doctors can create medical records
    if (req.user.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const record = await MedicalRecord.create({
      ...body,
      patientId: params.id,
      doctorId: req.user.id
    });

    // Create audit log
    await createAuditLog({
      userId: req.user.id,
      action: 'create_medical_record',
      entityType: 'medical_record',
      entityId: record._id,
      details: { type: record.type, patientId: params.id }
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Create Medical Record Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 