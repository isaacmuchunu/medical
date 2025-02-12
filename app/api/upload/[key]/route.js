import { NextResponse } from 'next/server';
import { authMiddleware } from '@/backend/middleware/auth';
import { generateDownloadUrl, deleteFile } from '@/backend/services/storage';
import { rateLimit } from '@/backend/utils/rateLimit';

const downloadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 download requests per 15 minutes
});

export async function GET(req, { params }) {
  try {
    await authMiddleware(req);
    await downloadRateLimit(req);

    const downloadUrl = await generateDownloadUrl(params.key, req.user.id);
    return NextResponse.json({ downloadUrl });
  } catch (error) {
    console.error('Download URL Generation Error:', error);
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

export async function DELETE(req, { params }) {
  try {
    await authMiddleware(req);

    // Additional authorization check could be added here
    // to ensure user has permission to delete this file

    await deleteFile(params.key, req.user.id);
    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('File Deletion Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 