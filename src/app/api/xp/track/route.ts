import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { DAILY_CHALLENGES, SEASONAL_CHALLENGES, shouldResetDailyChallenges } from '@/lib/xpSystem';
import { awardXpToPet } from '@/actions/pet.action';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { challengeId, increment = 1, recipient } = await request.json();

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
    });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the challenge definition (universal: just add to challenge lists)
    const allChallenges = [...DAILY_CHALLENGES, ...SEASONAL_CHALLENGES];
    const challengeDef = allChallenges.find(c => c.id === challengeId);
    if (!challengeDef) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Get or create user challenge progress
    let userChallenge = await prisma.userChallenge.findFirst({
      where: {
        userId: dbUser.id,
        challengeName: challengeId,
        type: challengeDef.type === 'daily' ? 'DAILY' : 'SEASONAL',
      },
    });

    let wasCompleted = false;
    let isNowCompleted = false;
    let newProgress = increment;
    let xpGained = 0;
    let showToast = false;
    let message = null;
    let updatedUser = dbUser;

    if (!userChallenge) {
      isNowCompleted = increment >= challengeDef.goal;
      userChallenge = await prisma.userChallenge.create({
        data: {
          userId: dbUser.id,
          challengeName: challengeId,
          type: challengeDef.type === 'daily' ? 'DAILY' : 'SEASONAL',
          progress: newProgress,
          goal: challengeDef.goal,
          completed: isNowCompleted,
        },
      });
    } else {
      // Check if daily challenges should be reset
      if (challengeDef.type === 'daily' && shouldResetDailyChallenges(userChallenge.lastUpdated)) {
        isNowCompleted = increment >= challengeDef.goal;
        userChallenge = await prisma.userChallenge.update({
          where: { id: userChallenge.id },
          data: {
            progress: increment,
            completed: isNowCompleted,
            lastUpdated: new Date(),
          },
        });
        newProgress = increment;
        wasCompleted = false;
      } else {
        newProgress = Math.min(userChallenge.progress + increment, challengeDef.goal);
        wasCompleted = userChallenge.completed;
        isNowCompleted = newProgress >= challengeDef.goal;
      userChallenge = await prisma.userChallenge.update({
        where: { id: userChallenge.id },
        data: {
          progress: newProgress,
          completed: isNowCompleted,
          lastUpdated: new Date(),
        },
      });
      }
    }

    // Special logic for daily_expand_petnet: only award XP if recipient is unique for the user for the day
    if (challengeId === 'daily_expand_petnet' && recipient) {
      // Check if this recipient has already been sent a link today
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const alreadyShared = await prisma.petNetShare.findFirst({
        where: {
          senderId: dbUser.id,
          recipient,
          sentAt: { gte: startOfDay },
        },
      });
      if (alreadyShared) {
        return NextResponse.json({
          success: false,
          error: 'You have already sent a link to this recipient today.',
        });
      }
      // Record the share
      await prisma.petNetShare.create({
        data: {
          senderId: dbUser.id,
          recipient,
        },
      });
    }

    // Award XP if challenge was just completed
    if (isNowCompleted && !wasCompleted) {
      // Award XP to all pets (optional, can be removed for pure user XP)
      const pets = await prisma.pet.findMany({ where: { userId: dbUser.id } });
      for (const pet of pets) {
        await awardXpToPet(pet.id, challengeDef.xp);
      }
      // Update user's total XP
      updatedUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          totalXp: {
            increment: challengeDef.xp
          }
        }
      });
      xpGained = challengeDef.xp;
      showToast = true;
      message = `🎉 ${challengeDef.type === 'daily' ? 'Daily' : 'Seasonal'} challenge complete! +${challengeDef.xp} XP`;
    }

    return NextResponse.json({
      success: true,
      progress: userChallenge.progress,
      completed: userChallenge.completed,
      xpGained,
      userTotalXp: updatedUser.totalXp,
      challenge: {
        id: challengeId,
        name: challengeDef.name,
        completed: userChallenge.completed,
        xp: challengeDef.xp,
      },
      message,
      showToast,
    });
  } catch (error) {
    console.error('Error tracking challenge progress:', error);
    return NextResponse.json(
      { error: 'Failed to track challenge progress' },
      { status: 500 }
    );
  }
} 