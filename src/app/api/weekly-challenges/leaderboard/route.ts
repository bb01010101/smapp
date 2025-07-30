import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/weekly-challenges/leaderboard - Get leaderboard for current weekly challenge
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get the current active challenge
    const challenge = await prisma.weeklyChallenge.findFirst({
      where: { isActive: true }
    });

    // Get Pet Celebs (ranked by total bone count / loveCount)
    const petCelebs = await prisma.pet.findMany({
      orderBy: { loveCount: 'desc' },
      take: limit
    });

    // Get user data for each pet
    const userIds = petCelebs.map(pet => pet.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { 
        id: true, 
        username: true, 
        name: true, 
        image: true 
      }
    });
    const userMap = new Map(users.map(user => [user.id, user]));

    let challengers: any[] = [];

    if (challenge) {
      // Get challenge participants (users with posts in this challenge) ranked by upvotes
      const challengePostStats = await prisma.challengePost.findMany({
        where: { challengeId: challenge.id },
        include: {
          post: {
            include: {
              author: {
                select: { 
                  id: true, 
                  username: true, 
                  name: true, 
                  image: true 
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
              }
            }
          },
          challengePostVotes: true
        }
      });

      // Calculate vote scores for each user
      const userScores = new Map<string, {
        user: any;
        pet: any;
        totalUpvotes: number;
        totalDownvotes: number;
        netVotes: number;
        postCount: number;
      }>();

      challengePostStats.forEach(challengePost => {
        const userId = challengePost.post.authorId;
        const upvotes = challengePost.challengePostVotes.filter(v => v.value === 1).length;
        const downvotes = challengePost.challengePostVotes.filter(v => v.value === -1).length;
        
        if (userScores.has(userId)) {
          const existing = userScores.get(userId)!;
          existing.totalUpvotes += upvotes;
          existing.totalDownvotes += downvotes;
          existing.netVotes += (upvotes - downvotes);
          existing.postCount += 1;
        } else {
          userScores.set(userId, {
            user: challengePost.post.author,
            pet: challengePost.post.pet,
            totalUpvotes: upvotes,
            totalDownvotes: downvotes,
            netVotes: upvotes - downvotes,
            postCount: 1
          });
        }
      });

      // Convert to array and sort by net votes
      challengers = Array.from(userScores.values())
        .sort((a, b) => b.netVotes - a.netVotes)
        .slice(0, limit)
        .map((challenger, index) => ({
          rank: index + 1,
          user: challenger.user,
          pet: challenger.pet,
          totalUpvotes: challenger.totalUpvotes,
          totalDownvotes: challenger.totalDownvotes,
          netVotes: challenger.netVotes,
          postCount: challenger.postCount,
          boneCount: challenger.pet?.loveCount || 0
        }));
    }

    // Format Pet Celebs
    const formattedPetCelebs = petCelebs.map((pet, index) => ({
      rank: index + 1,
      pet: {
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        imageUrl: pet.imageUrl,
        loveCount: pet.loveCount
      },
      user: userMap.get(pet.userId),
      boneCount: pet.loveCount
    }));

    return NextResponse.json({ 
      petCelebs: formattedPetCelebs,
      challengers,
      challenge,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
} 