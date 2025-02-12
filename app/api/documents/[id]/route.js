import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/db';
import Document from '@/backend/models/Document';
import { authMiddleware } from '@/backend/middleware/auth';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function GET(req, { params }) {
  try {
    await connectDB();
    await authMiddleware(req);

    const document = await Document.findById(params.id)
      .populate('patientId', 'profile')
      .populate('uploadedBy', 'profile role');

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Access control
    if (
      req.user.role === 'patient' && 
      document.patientId._id.toString() !== req.user.id
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('Fetch Document Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    await authMiddleware(req);

    const document = await Document.findById(params.id);
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Only allow document deletion by uploading user or admin
    if (
      req.user.role !== 'admin' && 
      document.uploadedBy.toString() !== req.user.id
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete from S3
    const fileKey = document.fileUrl.split('.com/')[1];
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileKey,
      })
    );

    // Delete document record
    await Document.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete Document Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 