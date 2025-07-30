import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// GET /api/admin/weekly-challenges/[id] - Get specific weekly challenge
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const challenge = await prisma.weeklyChallenge.findUnique({
      where: { id: params.id },
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
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error('Error fetching weekly challenge:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weekly challenge' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/weekly-challenges/[id] - Update weekly challenge
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { title, description, hashtag, startDate, endDate, isActive } = body;

    // Check if challenge exists
    const existingChallenge = await prisma.weeklyChallenge.findUnique({
      where: { id: params.id }
    });

    if (!existingChallenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // If setting this as active, deactivate all other challenges
    if (isActive && !existingChallenge.isActive) {
      await prisma.weeklyChallenge.updateMany({
        where: { 
          isActive: true,
          id: { not: params.id }
        },
        data: { isActive: false }
      });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (hashtag !== undefined) updateData.hashtag = hashtag.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (isActive !== undefined) updateData.isActive = isActive;

    const challenge = await prisma.weeklyChallenge.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error('Error updating weekly challenge:', error);
    return NextResponse.json(
      { error: 'Failed to update weekly challenge' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/weekly-challenges/[id] - Delete weekly challenge
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if challenge exists
    const existingChallenge = await prisma.weeklyChallenge.findUnique({
      where: { id: params.id }
    });

    if (!existingChallenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Delete the challenge (cascade deletes will handle related records)
    await prisma.weeklyChallenge.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    console.error('Error deleting weekly challenge:', error);
    return NextResponse.json(
      { error: 'Failed to delete weekly challenge' },
      { status: 500 }
    );
  }
} 