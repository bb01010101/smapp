import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// GET /api/admin/weekly-challenges - Get all weekly challenges
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database and check admin status
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser || !dbUser.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const challenges = await prisma.weeklyChallenge.findMany({
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
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ challenges });
  } catch (error) {
    console.error('Error fetching weekly challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weekly challenges' },
      { status: 500 }
    );
  }
}

// POST /api/admin/weekly-challenges - Create a new weekly challenge
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database and check admin status
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser || !dbUser.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, hashtag, startDate, endDate, challengeOptions, isActive } = body;

    // Validate required fields
    if (!title || !description || !hashtag || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate week number and year
    const start = new Date(startDate);
    const year = start.getFullYear();
    const oneJan = new Date(year, 0, 1);
    const numberOfDays = Math.floor((start.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((start.getDay() + 1 + numberOfDays) / 7);

    // Check if challenge for this week already exists
    const existingChallenge = await prisma.weeklyChallenge.findFirst({
      where: { weekNumber, year }
    });

    if (existingChallenge) {
      return NextResponse.json(
        { error: 'Challenge for this week already exists' },
        { status: 400 }
      );
    }

    // If setting this as active, deactivate all other challenges
    if (isActive) {
      await prisma.weeklyChallenge.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
    }

    // Create the weekly challenge
    const challenge = await prisma.weeklyChallenge.create({
      data: {
        title,
        description,
        hashtag: hashtag.toLowerCase().replace(/[^a-z0-9]/g, ''),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        weekNumber,
        year,
        isActive: isActive || false,
        createdBy: dbUser.id,
        challengeOptions: challengeOptions ? {
          create: challengeOptions.map((option: any, index: number) => ({
            title: option.title,
            description: option.description || null,
            orderIndex: index + 1
          }))
        } : undefined
      },
      include: {
        challengeOptions: {
          orderBy: { orderIndex: 'asc' }
        },
        creator: {
          select: { username: true, name: true }
        }
      }
    });

    return NextResponse.json({ challenge }, { status: 201 });
  } catch (error) {
    console.error('Error creating weekly challenge:', error);
    return NextResponse.json(
      { error: 'Failed to create weekly challenge' },
      { status: 500 }
    );
  }
} 