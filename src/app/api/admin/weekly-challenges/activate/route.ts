import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// POST /api/admin/weekly-challenges/activate - Activate a specific challenge (deactivates others)
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser || !dbUser.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { challengeId } = body;

    if (!challengeId) {
      return NextResponse.json(
        { error: 'Challenge ID is required' },
        { status: 400 }
      );
    }

    // Check if challenge exists
    const challenge = await prisma.weeklyChallenge.findUnique({
      where: { id: challengeId }
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Transaction to deactivate all challenges and activate the selected one
    await prisma.$transaction([
      // Deactivate all challenges
      prisma.weeklyChallenge.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      }),
      // Activate the selected challenge
      prisma.weeklyChallenge.update({
        where: { id: challengeId },
        data: { isActive: true }
      })
    ]);

    // Get the updated challenge with full details
    const activatedChallenge = await prisma.weeklyChallenge.findUnique({
      where: { id: challengeId },
      include: {
        challengeOptions: {
          orderBy: { orderIndex: 'asc' }
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

    return NextResponse.json({ 
      message: 'Challenge activated successfully',
      challenge: activatedChallenge 
    });
  } catch (error) {
    console.error('Error activating weekly challenge:', error);
    return NextResponse.json(
      { error: 'Failed to activate weekly challenge' },
      { status: 500 }
    );
  }
} 