import { NextResponse } from "next/server"
import { authMiddleware } from "@/backend/middleware/auth"
import connectDB from "@/backend/config/db"
import MedicalRecord from "@/backend/models/MedicalRecord"
import { createAuditLog } from "@/backend/services/audit"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const user = await authMiddleware(req)

    const medicalHistory = await MedicalRecord.find({
      patientId: params.id,
      type: 'diagnosis'
    })
      .sort({ createdAt: -1 })
      .populate('doctorId', 'profile.name')

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'view_medical_history',
      entityType: 'patient',
      entityId: params.id
    })

    return NextResponse.json(medicalHistory)
  } catch (error) {
    console.error('Medical History API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const user = await authMiddleware(req)
    const data = await req.json()

    const medicalRecord = await MedicalRecord.create({
      ...data,
      patientId: params.id,
      doctorId: user.id,
      type: 'diagnosis'
    })

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'add_medical_condition',
      entityType: 'patient',
      entityId: params.id,
      details: data
    })

    return NextResponse.json(medicalRecord)
  } catch (error) {
    console.error('Add Medical Condition API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 