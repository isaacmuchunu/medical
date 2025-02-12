import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import Doctor from '@/backend/models/Doctor';
import Department from '@/backend/models/Department';
import { authMiddleware } from '@/backend/middleware/auth';

export async function GET(req) {
  try {
    await connectDB();
    await authMiddleware(req);

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type');
    const specialization = searchParams.get('specialization');
    const department = searchParams.get('department');

    let results = {};

    switch (type) {
      case 'doctor':
        results = await searchDoctors(query, specialization, department);
        break;
      case 'department':
        results = await searchDepartments(query);
        break;
      default:
        // Search all
        const [doctors, departments] = await Promise.all([
          searchDoctors(query, specialization, department),
          searchDepartments(query)
        ]);
        results = { doctors, departments };
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function searchDoctors(query, specialization, department) {
  let searchQuery = {};

  if (query) {
    searchQuery['$or'] = [
      { 'profile.name': { $regex: query, $options: 'i' } },
      { specialization: { $regex: query, $options: 'i' } }
    ];
  }

  if (specialization) {
    searchQuery.specialization = specialization;
  }

  if (department) {
    searchQuery.departmentId = department;
  }

  return Doctor.find(searchQuery)
    .populate('userId', 'profile')
    .populate('departmentId', 'name')
    .sort({ 'ratings.average': -1 });
}

async function searchDepartments(query) {
  let searchQuery = {};

  if (query) {
    searchQuery['$or'] = [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { specializations: { $regex: query, $options: 'i' } }
    ];
  }

  return Department.find(searchQuery)
    .populate('headDoctor', 'profile specialization')
    .sort({ name: 1 });
} 