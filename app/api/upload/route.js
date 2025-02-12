import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import { authMiddleware } from '@/backend/middleware/auth';
import { generateUploadUrl } from '@/backend/services/storage';
import { rateLimit } from '@/backend/utils/rateLimit';

// Rate limiting for file uploads
const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20 // limit each IP to 20 upload requests per 15 minutes
});

export async function POST(req) {
  try {
    await connectDB();
    await authMiddleware(req);
    await uploadRateLimit(req);

    const body = await req.json();
    const { fileType, fileName, category } = body;

    // Additional validation
    if (!fileType || !fileName || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { uploadUrl, key } = await generateUploadUrl(
      fileType,
      fileName,
      req.user.id,
      category
    );

    return NextResponse.json({ uploadUrl, key });
  } catch (error) {
    console.error('Upload URL Generation Error:', error);
    if (error.message === 'Invalid file type') {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }
    if (error.message === 'Too many requests') {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 