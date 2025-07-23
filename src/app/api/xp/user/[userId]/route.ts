import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { DAILY_CHALLENGES, SEASONAL_CHALLENGES, getLevelFromXp, shouldResetDailyChallenges } from '@/lib/xpSystem';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    console.log('XP API: userId param:', params.userId);
    // Get user from database using the userId from params
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: params.userId },
    });

    if (!dbUser) {
      console.error('XP API: No user found for clerkId', params.userId);
      return NextResponse.json({ error: 'User not found for clerkId: ' + params.userId }, { status: 404 });
    }

    // Use the user's totalXp field
    const totalXp = dbUser.totalXp || 0;
    const level = getLevelFromXp(totalXp);

    // Get user's challenge progress
    const userChallenges = await prisma.userChallenge.findMany({
      where: { userId: dbUser.id },
    });
    console.log('XP API: userChallenges:', userChallenges);

    // Map challenges with progress
    const challenges = [
      ...DAILY_CHALLENGES,
      ...SEASONAL_CHALLENGES,
    ].map(challenge => {
      const userChallenge = userChallenges.find(
        uc => uc.challengeName === challenge.id
      );
      
      // Check if daily challenges should be reset
      let progress = userChallenge?.progress || 0;
      let completed = userChallenge?.completed || false;
      
      if (challenge.type === 'daily' && userChallenge && shouldResetDailyChallenges(userChallenge.lastUpdated)) {
        progress = 0;
        completed = false;
      }
      
      return {
        id: challenge.id,
        name: challenge.name,
        description: challenge.description,
        type: challenge.type,
        xp: challenge.xp,
        goal: challenge.goal,
        progress: progress,
        completed: completed,
      };
    });

    return NextResponse.json({
      totalXp,
      level,
      challenges,
    });
  } catch (error) {
    console.error('Error fetching user XP:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user XP', details: String(error) },
      { status: 500 }
    );
  }
} 