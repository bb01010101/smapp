import { NextResponse } from 'next/server';
import { getRandomPetPostsWithImages } from '@/actions/post.action';

export async function GET() {
  try {
    const posts = await getRandomPetPostsWithImages(3);
    return NextResponse.json({ posts });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch random pet posts.' }, { status: 500 });
  }
} 