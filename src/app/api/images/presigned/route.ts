import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedUrlFromS3Url, isPrivateS3Url } from '@/lib/s3';

export async function GET(request: NextRequest) {
  try {
    // Public API: Allows anyone to get presigned URLs for S3 images
    // This enables public viewing of images without requiring authentication
    // Note: The S3 bucket remains private, we're just providing temporary access URLs

    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // If it's not a private S3 URL, return the original URL
    if (!isPrivateS3Url(imageUrl)) {
      return NextResponse.json({ url: imageUrl });
    }

    // Generate presigned URL for private S3 images (1 hour expiry)
    const presignedUrl = await generatePresignedUrlFromS3Url(imageUrl, 3600);
    
    return NextResponse.json({ url: presignedUrl });

  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' }, 
      { status: 500 }
    );
  }
} 