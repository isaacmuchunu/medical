import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import Department from '@/backend/models/Department';
import { authMiddleware, requireRole } from '@/backend/middleware/auth';

export async function GET(req) {
  try {
    await connectDB();
    await authMiddleware(req);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    
    let query = {};
    if (search) {
      query['$or'] = [
        { name: { $regex: search, $options: 'i' } },
        { specializations: { $regex: search, $options: 'i' } }
      ];
    }

    const departments = await Department.find(query)
      .populate('headDoctor', 'profile specialization')
      .populate('doctors', 'profile specialization')
      .sort({ name: 1 });

    return NextResponse.json(departments);
  } catch (error) {
    console.error('Fetch Departments Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    await requireRole('admin')(req);

    const body = await req.json();
    const department = await Department.create(body);

    return NextResponse.json(
      { message: 'Department created successfully', department },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create Department Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 