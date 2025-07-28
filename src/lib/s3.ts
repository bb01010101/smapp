import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Create S3 client dynamically to ensure environment variables are loaded
const getS3Client = () => {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'us-east-1';

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials not found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
  }

  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

const getBucketName = () => {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
  }
  return bucketName;
};

export interface UploadResult {
  url: string;
  key: string;
}

export async function uploadToS3(
  file: Buffer,
  fileName: string,
  contentType: string,
  folder: string = 'uploads'
): Promise<UploadResult> {
  const key = `${folder}/${Date.now()}-${fileName}`;
  
  const bucketName = getBucketName();
  const s3Client = getS3Client();
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: contentType,
    // Removed ACL: 'public-read' for private bucket
  });

  await s3Client.send(command);

  // For private buckets, we return the S3 URL that will be accessed via presigned URLs
  const url = `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  
  return { url, key };
}

export async function deleteFromS3(key: string): Promise<void> {
  const bucketName = getBucketName();
  const s3Client = getS3Client();
  
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
}

export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  folder: string = 'uploads'
): Promise<{ uploadUrl: string; key: string; url: string }> {
  const key = `${folder}/${Date.now()}-${fileName}`;
  const bucketName = getBucketName();
  const s3Client = getS3Client();
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
    // No public ACL for private bucket
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  const url = `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  
  return { uploadUrl, key, url };
}

/**
 * Generate a presigned URL for reading/downloading a private S3 object
 * @param key - The S3 object key
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Presigned URL for secure access
 */
export async function generatePresignedReadUrl(
  key: string, 
  expiresIn: number = 3600
): Promise<string> {
  const bucketName = getBucketName();
  const s3Client = getS3Client();
  
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate presigned read URL from full S3 URL
 * @param s3Url - Full S3 URL 
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Presigned URL for secure access
 */
export async function generatePresignedUrlFromS3Url(
  s3Url: string,
  expiresIn: number = 3600
): Promise<string> {
  const key = extractS3KeyFromUrl(s3Url);
  if (!key) {
    throw new Error('Invalid S3 URL format');
  }
  return generatePresignedReadUrl(key, expiresIn);
}

export function extractS3KeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Handle both bucket.s3.region.amazonaws.com and s3.region.amazonaws.com/bucket formats
    if (urlObj.hostname.includes('amazonaws.com') && urlObj.hostname.includes('s3')) {
      if (urlObj.hostname.startsWith('s3.')) {
        // Format: https://s3.region.amazonaws.com/bucket/key
        const pathParts = urlObj.pathname.substring(1).split('/');
        return pathParts.slice(1).join('/'); // Remove bucket name, keep key
      } else {
        // Format: https://bucket.s3.region.amazonaws.com/key
        return urlObj.pathname.substring(1); // Remove leading slash
      }
    }
    // Handle s3://bucket/key format
    if (url.startsWith('s3://')) {
      const parts = url.replace('s3://', '').split('/');
      return parts.slice(1).join('/'); // Remove bucket name, keep key
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if URL is an S3 URL that needs presigned access
 * @param url - URL to check
 * @returns true if it's a private S3 URL
 */
export function isPrivateS3Url(url: string): boolean {
  if (!url) return false;
  
  // Client-safe detection - look for general S3 patterns
  // This will work on both client and server
  return (
    url.includes('.s3.') &&
    url.includes('amazonaws.com') &&
    !url.includes('X-Amz-Signature') &&
    !url.includes('X-Amz-Algorithm')
  );
}

// Legacy function name for backwards compatibility
export const generatePresignedUrl = generatePresignedUploadUrl; 