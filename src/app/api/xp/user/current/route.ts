import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { DAILY_CHALLENGES, WEEKLY_CHALLENGES, getLevelFromXp } from '@/lib/xpSystem';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch pets for this user
    const pets = await prisma.pet.findMany({ where: { userId: dbUser.id } });
    // Calculate total XP from all pets
    const totalXp = pets.reduce((sum, pet) => sum + (pet.xp || 0), 0);
    const level = getLevelFromXp(totalXp);

    // Get user's challenge progress
    const userChallenges = await prisma.userChallenge.findMany({
      where: { userId: dbUser.id },
    });

    // Map challenges with progress
    const challenges = [
      ...DAILY_CHALLENGES,
      ...WEEKLY_CHALLENGES,
    ].map(challenge => {
      const userChallenge = userChallenges.find(
        uc => uc.challengeName === challenge.id
      );
      return {
        id: challenge.id,
        name: challenge.name,
        description: challenge.description,
        type: challenge.type,
        xp: challenge.xp,
        goal: challenge.goal,
        progress: userChallenge?.progress || 0,
        completed: userChallenge?.completed || false,
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