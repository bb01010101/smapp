import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// GET /api/weekly-challenges/current - Get the current active weekly challenge
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    let userVote = null;

    // Get the current active challenge
    const challenge = await prisma.weeklyChallenge.findFirst({
      where: { isActive: true },
      include: {
        challengeOptions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            _count: {
              select: { challengeVotes: true }
            }
          }
        },
        creator: {
          select: { username: true, name: true }
        },
        _count: {
          select: {
            challengeVotes: true,
            challengePosts: true
          }
        }
      }
    });

    if (!challenge) {
      return NextResponse.json({ challenge: null });
    }

    // If user is authenticated, check if they've voted
    if (user) {
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: user.id },
      });

      if (dbUser) {
        userVote = await prisma.challengeVote.findUnique({
          where: {
            userId_challengeId: {
              userId: dbUser.id,
              challengeId: challenge.id
            }
          },
          include: {
            challengeOption: {
              select: { id: true, title: true }
            }
          }
        });
      }
    }

    // Calculate voting percentages
    const challengeWithPercentages = {
      ...challenge,
      challengeOptions: challenge.challengeOptions.map(option => {
        const totalVotes = challenge._count.challengeVotes;
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
      challenge: challengeWithPercentages,
      userVote: userVote ? {
        optionId: userVote.optionId,
        optionTitle: userVote.challengeOption.title
      } : null
    });
  } catch (error) {
    console.error('Error fetching current weekly challenge:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current weekly challenge' },
      { status: 500 }
    );
  }
} 