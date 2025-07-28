import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== AUTH TEST DEBUG ===');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Host:', request.headers.get('host'));
    console.log('Origin:', request.headers.get('origin'));
    console.log('Referer:', request.headers.get('referer'));
    console.log('User-Agent:', request.headers.get('user-agent'));
    console.log('Authorization header:', request.headers.get('authorization') ? 'Present' : 'Missing');
    console.log('Cookie header:', request.headers.get('cookie') ? 'Present' : 'Missing');
    
    // Test Clerk environment variables
    console.log('Clerk config:', {
      hasPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      hasSecretKey: !!process.env.CLERK_SECRET_KEY,
      publishableKeyPrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 20) + '...',
      secretKeyPrefix: process.env.CLERK_SECRET_KEY?.substring(0, 20) + '...'
    });
    
    const { userId } = await auth();
    const user = await currentUser();
    
    console.log('Auth results:', {
      userId,
      userEmail: user?.emailAddresses?.[0]?.emailAddress,
      userFirstName: user?.firstName
    });
    
    return NextResponse.json({ 
      success: true,
      authenticated: !!userId,
      userId,
      userEmail: user?.emailAddresses?.[0]?.emailAddress,
      environment: process.env.NODE_ENV,
      host: request.headers.get('host'),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
} 