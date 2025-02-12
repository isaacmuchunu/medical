import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import Department from '@/backend/models/Department';
import { authMiddleware, requireRole } from '@/backend/middleware/auth';

export async function GET(req, { params }) {
  try {
    await connectDB();
    await authMiddleware(req);

    const department = await Department.findById(params.id)
      .populate('headDoctor', 'profile specialization')
      .populate('doctors', 'profile specialization');

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json(department);
  } catch (error) {
    console.error('Fetch Department Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectDB();
    await requireRole('admin')(req);

    const department = await Department.findById(params.id);
    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    const body = await req.json();
    const updatedDepartment = await Department.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true }
    )
    .populate('headDoctor', 'profile specialization')
    .populate('doctors', 'profile specialization');

    return NextResponse.json(updatedDepartment);
  } catch (error) {
    console.error('Update Department Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    await requireRole('admin')(req);

    const department = await Department.findById(params.id);
    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    await Department.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete Department Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 