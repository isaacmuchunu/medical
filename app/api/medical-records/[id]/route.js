import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import MedicalRecord from '@/backend/models/MedicalRecord';
import { authMiddleware } from '@/backend/middleware/auth';
import { createAuditLog } from '@/backend/services/audit';

export async function GET(req, { params }) {
  try {
    await connectDB();
    await authMiddleware(req);

    const record = await MedicalRecord.findById(params.id)
      .populate('doctorId', 'profile specialization')
      .populate('patientId', 'profile')
      .populate('appointmentId', 'dateTime');

    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Access control
    if (
      req.user.role === 'patient' && 
      record.patientId._id.toString() !== req.user.id
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Fetch Medical Record Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectDB();
    await authMiddleware(req);

    const record = await MedicalRecord.findById(params.id);
    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Only the creating doctor can update the record
    if (record.doctorId.toString() !== req.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true }
    );

    // Create audit log
    await createAuditLog({
      userId: req.user.id,
      action: 'update_medical_record',
      entityType: 'medical_record',
      entityId: params.id,
      details: { updates: body }
    });

    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error('Update Medical Record Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    await authMiddleware(req);

    const record = await MedicalRecord.findById(params.id);
    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Only the creating doctor or admin can delete the record
    if (
      req.user.role !== 'admin' && 
      record.doctorId.toString() !== req.user.id
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await MedicalRecord.findByIdAndDelete(params.id);

    // Create audit log
    await createAuditLog({
      userId: req.user.id,
      action: 'delete_medical_record',
      entityType: 'medical_record',
      entityId: params.id,
      details: { recordType: record.type }
    });

    return NextResponse.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Delete Medical Record Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 