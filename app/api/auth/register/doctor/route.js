import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import User from '@/backend/models/User';
import Doctor from '@/backend/models/Doctor';

export async function POST(req) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { 
      email, 
      password, 
      name, 
      specialization, 
      license, 
      experience,
      education,
      certifications,
      consultationFee 
    } = body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Create user
    const user = await User.create({
      email,
      password,
      role: 'doctor',
      profile: { name },
    });

    // Create doctor profile
    const doctor = await Doctor.create({
      userId: user._id,
      specialization,
      license,
      experience,
      education,
      certifications,
      consultationFee
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return NextResponse.json(
      { 
        message: 'Doctor registered successfully', 
        user: userResponse,
        doctor 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Doctor Registration Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 