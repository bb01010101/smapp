import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// POST /api/weekly-challenges/vote - Vote on a weekly challenge option
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { challengeId, optionId } = body;

    if (!challengeId || !optionId) {
      return NextResponse.json(
        { error: 'Challenge ID and Option ID are required' },
        { status: 400 }
      );
    }

    // Check if challenge exists and is active
    const challenge = await prisma.weeklyChallenge.findUnique({
      where: { id: challengeId }
    });

    if (!challenge || !challenge.isActive) {
      return NextResponse.json(
        { error: 'Challenge not found or not active' },
        { status: 404 }
      );
    }

    // Check if challenge option exists
    const challengeOption = await prisma.challengeOption.findFirst({
      where: { 
        id: optionId,
        challengeId: challengeId
      }
    });

    if (!challengeOption) {
      return NextResponse.json(
        { error: 'Challenge option not found' },
        { status: 404 }
      );
    }

    // Check if voting period is valid
    const now = new Date();
    if (now > challenge.endDate) {
      return NextResponse.json(
        { error: 'Voting period has ended' },
        { status: 400 }
      );
    }

    // Check if user has already voted
    const existingVote = await prisma.challengeVote.findUnique({
      where: {
        userId_challengeId: {
          userId: dbUser.id,
          challengeId: challengeId
        }
      }
    });

    if (existingVote) {
      // Update existing vote
      await prisma.challengeVote.update({
        where: { id: existingVote.id },
        data: { optionId: optionId }
      });
    } else {
      // Create new vote
      await prisma.challengeVote.create({
        data: {
          userId: dbUser.id,
          challengeId: challengeId,
          optionId: optionId
        }
      });
    }

    // Get updated vote counts
    const updatedChallenge = await prisma.weeklyChallenge.findUnique({
      where: { id: challengeId },
      include: {
        challengeOptions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            _count: {
              select: { challengeVotes: true }
            }
          }
        },
        _count: {
          select: { challengeVotes: true }
        }
      }
    });

    // Calculate voting percentages
    const challengeWithPercentages = {
      ...updatedChallenge,
      challengeOptions: updatedChallenge!.challengeOptions.map(option => {
        const totalVotes = updatedChallenge!._count.challengeVotes;
        const optionVotes = option._count.challengeVotes;
        const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
        
        return {
          ...option,
          voteCount: optionVotes,
          percentage
        };
      })
    };

    return NextResponse.json({ 
      message: 'Vote recorded successfully',
      challenge: challengeWithPercentages
    });
  } catch (error) {
    console.error('Error recording vote:', error);
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    );
  }
} 