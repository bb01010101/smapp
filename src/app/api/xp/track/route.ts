import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { DAILY_CHALLENGES, SEASONAL_CHALLENGES } from '@/lib/xpSystem';
import { awardXpToPet } from '@/actions/pet.action';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { challengeId, increment = 1 } = await request.json();

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch pets for this user
    const pets = await prisma.pet.findMany({ where: { userId: dbUser.id } });

    // Find the challenge definition
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

    if (!userChallenge) {
      userChallenge = await prisma.userChallenge.create({
        data: {
          userId: dbUser.id,
          challengeName: challengeId,
          type: challengeDef.type === 'daily' ? 'DAILY' : 'SEASONAL',
          progress: increment,
          goal: challengeDef.goal,
          completed: increment >= challengeDef.goal,
        },
      });
    } else {
      const newProgress = Math.min(userChallenge.progress + increment, challengeDef.goal);
      const wasCompleted = userChallenge.completed;
      const isNowCompleted = newProgress >= challengeDef.goal;
      
      userChallenge = await prisma.userChallenge.update({
        where: { id: userChallenge.id },
        data: {
          progress: newProgress,
          completed: isNowCompleted,
          lastUpdated: new Date(),
        },
      });

      // Award XP if challenge was just completed
      if (isNowCompleted && !wasCompleted) {
        let xpGained = 0;
        
        // Award XP to the user's first pet (or create one if none exists)
        if (pets.length > 0) {
          const pet = pets[0];
          const updatedPet = await awardXpToPet(pet.id, challengeDef.xp);
          if (updatedPet) {
            xpGained = challengeDef.xp;
          }
        }

        return NextResponse.json({
          success: true,
          xpGained,
          challenge: {
            id: challengeId,
            name: challengeDef.name,
            completed: true,
            xp: challengeDef.xp,
          },
          message: `🎉 Challenge completed! +${challengeDef.xp} XP`,
          showToast: true,
        });
      }
    }

    return NextResponse.json({
      success: true,
      progress: userChallenge.progress,
      completed: userChallenge.completed,
    });
  } catch (error) {
    console.error('Error tracking challenge progress:', error);
    return NextResponse.json(
      { error: 'Failed to track challenge progress' },
      { status: 500 }
    );
  }
} 