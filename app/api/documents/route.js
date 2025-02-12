import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import Document from '@/backend/models/Document';
import { authMiddleware } from '@/backend/middleware/auth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(req) {
  try {
    await connectDB();
    await authMiddleware(req);

    const body = await req.json();
    const { 
      patientId, 
      type, 
      title, 
      description,
      fileType,
      fileSize,
      originalName 
    } = body;

    // Generate unique file key
    const fileKey = `documents/${patientId}/${Date.now()}-${originalName}`;

    // Create presigned URL for direct upload
    const putCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: 3600 });
    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    // Create document record
    const document = await Document.create({
      patientId,
      uploadedBy: req.user.id,
      type,
      title,
      description,
      fileUrl,
      fileType,
      fileSize,
      metadata: {
        originalName,
        contentType: fileType,
        lastModified: new Date(),
      }
    });

    return NextResponse.json({
      message: 'Document created successfully',
      document,
      uploadUrl
    }, { status: 201 });
  } catch (error) {
    console.error('Document Creation Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectDB();
    await authMiddleware(req);

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');
    const type = searchParams.get('type');

    let query = {};
    
    // Access control
    if (req.user.role === 'patient') {
      query.patientId = req.user.id;
    } else if (req.user.role === 'doctor' && patientId) {
      query.patientId = patientId;
    }

    if (type) {
      query.type = type;
    }

    const documents = await Document.find(query)
      .populate('patientId', 'profile')
      .populate('uploadedBy', 'profile role')
      .sort({ createdAt: -1 });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Fetch Documents Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 