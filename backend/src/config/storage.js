import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: process.env.S3_ENDPOINT ? true : false
});

const BUCKET = process.env.S3_BUCKET_NAME;

export async function uploadFile(buffer, key, contentType) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType
  });

  await s3Client.send(command);
  return key;
}

export async function getPresignedUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}

export function generateStorageKey(organizationId, projectId, fileName) {
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `org-${organizationId}/proj-${projectId}/${timestamp}-${sanitizedName}`;
}