import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import Review from '@/backend/models/Review';
import Doctor from '@/backend/models/Doctor';
import { authMiddleware } from '@/backend/middleware/auth';

export async function GET(req, { params }) {
  try {
    await connectDB();
    await authMiddleware(req);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;

    const reviews = await Review.find({
      doctorId: params.id,
      status: 'published'
    })
      .populate('patientId', 'profile')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Review.countDocuments({
      doctorId: params.id,
      status: 'published'
    });

    return NextResponse.json({
      reviews,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Fetch Reviews Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    await connectDB();
    await authMiddleware(req);

    const body = await req.json();
    const { appointmentId, rating, comment, isAnonymous, tags } = body;

    // Verify appointment belongs to patient
    const existingReview = await Review.findOne({ appointmentId });
    if (existingReview) {
      return NextResponse.json(
        { error: 'Review already exists for this appointment' },
        { status: 400 }
      );
    }

    const review = await Review.create({
      patientId: req.user.id,
      doctorId: params.id,
      appointmentId,
      rating,
      comment,
      isAnonymous,
      tags,
      status: 'published'
    });

    // Update doctor's rating
    const allReviews = await Review.find({
      doctorId: params.id,
      status: 'published'
    });

    const averageRating = allReviews.reduce((acc, curr) => acc + curr.rating, 0) / allReviews.length;

    await Doctor.findByIdAndUpdate(params.id, {
      'ratings.average': averageRating,
      'ratings.count': allReviews.length
    });

    return NextResponse.json(
      { message: 'Review submitted successfully', review },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create Review Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 