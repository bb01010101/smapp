import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ friends: [] }, { status: 401 });

    // Get the current user from our database
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser) return NextResponse.json({ friends: [] }, { status: 404 });

    // Get users the current user follows
    const following = await prisma.follows.findMany({
      where: { followerId: dbUser.id },
      select: { followingId: true }
    });
    const followingIds = following.map(f => f.followingId);

    // Get users who follow the current user
    const followers = await prisma.follows.findMany({
      where: { followingId: dbUser.id },
      select: { followerId: true }
    });
    const followerIds = followers.map(f => f.followerId);

    // Mutuals: users who are both in following and followers
    const mutualIds = followingIds.filter(id => followerIds.includes(id));
    if (mutualIds.length === 0) return NextResponse.json({ friends: [] });

    // Get user info for mutuals
    const mutuals = await prisma.user.findMany({
      where: { id: { in: mutualIds } },
      select: { id: true, name: true, username: true, image: true }
    });

    return NextResponse.json({ friends: mutuals });
  } catch (error) {
    console.error('Error fetching mutual friends:', error);
    return NextResponse.json({ friends: [] }, { status: 500 });
  }
} 