import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generatePresignedUrlFromS3Url, isPrivateS3Url } from '@/lib/s3';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // If it's not a private S3 URL, return the original URL
    if (!isPrivateS3Url(imageUrl)) {
      return NextResponse.json({ url: imageUrl });
    }

    // Generate presigned URL for private S3 images
    const presignedUrl = await generatePresignedUrlFromS3Url(imageUrl, 3600); // 1 hour expiry

    return NextResponse.json({ url: presignedUrl });

  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' }, 
      { status: 500 }
    );
  }
} 