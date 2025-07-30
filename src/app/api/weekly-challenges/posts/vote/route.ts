import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// POST /api/weekly-challenges/posts/vote - Vote on a challenge post
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
    const { postId, vote } = body; // vote: 1 for upvote, -1 for downvote, 0 to remove vote

    if (!postId || vote === undefined) {
      return NextResponse.json(
        { error: 'Post ID and vote value are required' },
        { status: 400 }
      );
    }

    if (![1, -1, 0].includes(vote)) {
      return NextResponse.json(
        { error: 'Vote must be 1 (upvote), -1 (downvote), or 0 (remove vote)' },
        { status: 400 }
      );
    }

    // Check if post exists and is part of an active challenge
    const challengePost = await prisma.challengePost.findFirst({
      where: { 
        postId: postId,
        weeklyChallenge: { isActive: true }
      },
      include: {
        post: true,
        weeklyChallenge: true
      }
    });

    if (!challengePost) {
      return NextResponse.json(
        { error: 'Post not found in active challenge' },
        { status: 404 }
      );
    }

    // Check if user has already voted on this post
    const existingVote = await prisma.challengePostVote.findUnique({
      where: {
        userId_challengePostId: {
          userId: dbUser.id,
          challengePostId: challengePost.id
        }
      }
    });

    if (vote === 0) {
      // Remove vote if it exists
      if (existingVote) {
        await prisma.challengePostVote.delete({
          where: { id: existingVote.id }
        });
      }
    } else {
      if (existingVote) {
        // Update existing vote
        await prisma.challengePostVote.update({
          where: { id: existingVote.id },
          data: { value: vote }
        });
      } else {
        // Create new vote
        await prisma.challengePostVote.create({
          data: {
            userId: dbUser.id,
            challengePostId: challengePost.id,
            value: vote
          }
        });
      }
    }

    // Get updated vote counts
    const votes = await prisma.challengePostVote.findMany({
      where: { challengePostId: challengePost.id }
    });

    const upvotes = votes.filter(v => v.value === 1).length;
    const downvotes = votes.filter(v => v.value === -1).length;
    const netVotes = upvotes - downvotes;

    // Get user's current vote
    const userVote = votes.find(v => v.userId === dbUser.id)?.value || null;

    return NextResponse.json({ 
      message: 'Vote recorded successfully',
      upvotes,
      downvotes,
      netVotes,
      userVote
    });
  } catch (error) {
    console.error('Error recording challenge post vote:', error);
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    );
  }
} 