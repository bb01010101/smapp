import { NextResponse } from 'next/server';
import { getRandomPetPostsWithImages } from '@/actions/post.action';

export async function GET() {
  try {
    const posts = await getRandomPetPostsWithImages(10);
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching random pet posts:', error);
    return NextResponse.json({ error: 'Failed to fetch random pet posts.' }, { status: 500 });
  }
} 