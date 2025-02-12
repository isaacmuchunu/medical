import { NextResponse } from "next/server"
import { authMiddleware } from "@/backend/middleware/auth"
import connectDB from "@/backend/config/db"
import Patient from "@/backend/models/Patient"
import { createAuditLog } from "@/backend/services/audit"

export async function GET(req: Request) {
  try {
    await connectDB()
    const user = await authMiddleware(req)

    // Get query parameters
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const search = url.searchParams.get('search') || ''

    // Build query
    const query = search
      ? {
          $or: [
            { 'profile.name': { $regex: search, $options: 'i' } },
            { 'profile.email': { $regex: search, $options: 'i' } },
            { medicalId: { $regex: search, $options: 'i' } },
          ],
        }
      : {}

    // Execute query with pagination
    const [patients, total] = await Promise.all([
      Patient.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ 'profile.name': 1 }),
      Patient.countDocuments(query),
    ])

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'view_patients',
      entityType: 'patient',
    })

    return NextResponse.json({
      patients,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    })
  } catch (error) {
    console.error('Patients API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 