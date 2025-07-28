import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generatePresignedUrlFromS3Url, isPrivateS3Url } from '@/lib/s3';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.log('Presigned URL request: No user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      console.log('Presigned URL request: No URL parameter provided');
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    console.log('Presigned URL request for:', imageUrl);

    // If it's not a private S3 URL, return the original URL
    if (!isPrivateS3Url(imageUrl)) {
      console.log('URL is not a private S3 URL, returning original');
      return NextResponse.json({ url: imageUrl });
    }

    // Check environment variables
    const hasAccessKey = !!process.env.AWS_ACCESS_KEY_ID;
    const hasSecretKey = !!process.env.AWS_SECRET_ACCESS_KEY;
    const hasBucketName = !!process.env.AWS_S3_BUCKET_NAME;
    
    console.log('AWS Config:', {
      hasAccessKey,
      hasSecretKey,
      hasBucketName,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    // Generate presigned URL for private S3 images
    const presignedUrl = await generatePresignedUrlFromS3Url(imageUrl, 3600); // 1 hour expiry
    
    console.log('Successfully generated presigned URL');
    return NextResponse.json({ url: presignedUrl });

  } catch (error) {
    console.error('Error generating presigned URL:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' }, 
      { status: 500 }
    );
  }
} 