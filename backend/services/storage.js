import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { createAuditLog } from './audit';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Allowed file types and their corresponding MIME types
const ALLOWED_FILE_TYPES = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'application/pdf': ['pdf'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx']
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function generateUploadUrl(fileType, fileName, userId, category) {
  // Validate file type
  if (!ALLOWED_FILE_TYPES[fileType]) {
    throw new Error('Invalid file type');
  }

  // Generate secure random key
  const randomBytes = crypto.randomBytes(16);
  const extension = ALLOWED_FILE_TYPES[fileType][0];
  const key = `${category}/${userId}/${randomBytes.toString('hex')}.${extension}`;

  const putCommand = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    ContentType: fileType,
    Metadata: {
      userId,
      originalName: fileName,
      category
    }
  });

  // Generate presigned URL with short expiration
  const uploadUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: 300 }); // 5 minutes

  // Audit log
  await createAuditLog({
    userId,
    action: 'generate_upload_url',
    entityType: 'file',
    details: {
      fileType,
      fileName,
      category,
      key
    }
  });

  return { uploadUrl, key };
}

export async function generateDownloadUrl(key, userId) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
  });

  // Generate short-lived download URL
  const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  // Audit log
  await createAuditLog({
    userId,
    action: 'generate_download_url',
    entityType: 'file',
    details: { key }
  });

  return downloadUrl;
}

export async function deleteFile(key, userId) {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    })
  );

  // Audit log
  await createAuditLog({
    userId,
    action: 'delete_file',
    entityType: 'file',
    details: { key }
  });
} 