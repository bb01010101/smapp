import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// GET /api/weekly-challenges/posts - Get posts for current weekly challenge
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const user = await currentUser();
    let dbUser = null;

    if (user) {
      dbUser = await prisma.user.findUnique({
        where: { clerkId: user.id },
      });
    }

    // Get the current active challenge
    const challenge = await prisma.weeklyChallenge.findFirst({
      where: { isActive: true }
    });

    if (!challenge) {
      return NextResponse.json({ posts: [], challenge: null, totalCount: 0 });
    }

    // Get posts tagged with the current challenge hashtag
    const posts = await prisma.post.findMany({
      where: {
        challengeHashtag: challenge.hashtag
      },
      include: {
        author: {
          select: { 
            id: true, 
            name: true, 
            username: true, 
            image: true,
            isFirst1000: true
          }
        },
        pet: {
          select: { 
            id: true, 
            name: true, 
            species: true, 
            breed: true,
            imageUrl: true,
            loveCount: true
          }
        },
        challengePosts: {
          include: {
            challengePostVotes: true,
            _count: {
              select: {
                challengePostVotes: true
              }
            }
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.post.count({
      where: {
        challengeHashtag: challenge.hashtag
      }
    });

    // Calculate upvote/downvote counts and user votes for each post
    const postsWithVotes = posts.map(post => {
      const challengePost = post.challengePosts[0]; // Should only be one per challenge
      let upvotes = 0;
      let downvotes = 0;
      let userVote = null;

      if (challengePost) {
        challengePost.challengePostVotes.forEach(vote => {
          if (vote.value === 1) upvotes++;
          else if (vote.value === -1) downvotes++;

          if (dbUser && vote.userId === dbUser.id) {
            userVote = vote.value;
          }
        });
      }

      return {
        ...post,
        challengePosts: undefined, // Remove raw data
        upvotes,
        downvotes,
        netVotes: upvotes - downvotes,
        userVote,
        challengePostId: challengePost?.id || null
      };
    });

    // Sort by net votes (upvotes - downvotes) descending
    postsWithVotes.sort((a, b) => b.netVotes - a.netVotes);

    return NextResponse.json({ 
      posts: postsWithVotes,
      challenge,
      totalCount,
      page,
      hasMore: (page * limit) < totalCount
    });
  } catch (error) {
    console.error('Error fetching challenge posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenge posts' },
      { status: 500 }
    );
  }
}

// POST /api/weekly-challenges/posts - Tag a post with current weekly challenge
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
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Check if post exists and belongs to user
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.authorId !== dbUser.id) {
      return NextResponse.json({ error: 'Not authorized to modify this post' }, { status: 403 });
    }

    // Get current active challenge
    const challenge = await prisma.weeklyChallenge.findFirst({
      where: { isActive: true }
    });

    if (!challenge) {
      return NextResponse.json({ error: 'No active challenge found' }, { status: 404 });
    }

    // Update post with challenge hashtag
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { challengeHashtag: challenge.hashtag }
    });

    // Create challenge post entry
    await prisma.challengePost.create({
      data: {
        postId: postId,
        challengeId: challenge.id
      }
    });

    return NextResponse.json({ 
      message: 'Post tagged with challenge successfully',
      post: updatedPost,
      challenge
    });
  } catch (error) {
    console.error('Error tagging post with challenge:', error);
    return NextResponse.json(
      { error: 'Failed to tag post with challenge' },
      { status: 500 }
    );
  }
} 