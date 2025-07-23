"use server";

import prisma from "@/lib/prisma";
import { getDbUserId, syncUser } from "./user.action";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { DAILY_CHALLENGES, WEEKLY_CHALLENGES } from "@/lib/xpSystem";

// Server-side XP tracking function
async function trackChallengeProgress(challengeId: string, increment: number = 1) {
  try {
    const { userId } = await auth();
    if (!userId) return;

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) return;

    // Find the challenge definition
    const allChallenges = [...DAILY_CHALLENGES, ...WEEKLY_CHALLENGES];
    const challengeDef = allChallenges.find(c => c.id === challengeId);
    
    if (!challengeDef) return;

    // Get or create user challenge progress
    let userChallenge = await prisma.userChallenge.findFirst({
      where: {
        userId: dbUser.id,
        challengeName: challengeId,
        type: challengeDef.type === 'daily' ? 'DAILY' : 'WEEKLY',
      },
    });

    if (!userChallenge) {
      userChallenge = await prisma.userChallenge.create({
        data: {
          userId: dbUser.id,
          challengeName: challengeId,
          type: challengeDef.type === 'daily' ? 'DAILY' : 'WEEKLY',
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
        // Get user's pets
        const pets = await prisma.pet.findMany({ where: { userId: dbUser.id } });
        
        // Award XP to all pets
        for (const pet of pets) {
          await prisma.pet.update({
            where: { id: pet.id },
            data: {
              xp: {
                increment: challengeDef.xp
              }
            }
          });
        }

        // Update user's total XP
        await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            totalXp: {
              increment: challengeDef.xp
            }
          }
        });
      }
    }
  } catch (error) {
    console.error('Error tracking challenge progress:', error);
  }
}

export async function createPost(content: string, image: string, petId?: string | null, mediaType?: string) {
    try {
        // Ensure user is synced first
        await syncUser();
        
        const userId = await getDbUserId();
        const { userId: clerkId } = await auth();
        if (!userId || !clerkId) {
            return { success: false, error: "User not authenticated" };
        }

        // If posting for a pet, validate ownership using Clerk ID
        if (petId) {
            const pet = await prisma.pet.findUnique({
                where: { id: petId },
                select: { userId: true }
            });

            console.log("DEBUG: Clerk userId:", clerkId, "pet.userId:", pet?.userId); // Debug log

            if (!pet) {
                return { success: false, error: "Pet not found" };
            }

            if (pet.userId !== clerkId) {
                return { success: false, error: "You can only post for your own pets" };
            }
        }

        // Create the post
        const post = await prisma.post.create({
            data:{
                content,  
                image,
                mediaType: mediaType || null,
                authorId: userId,
                petId: petId || null,
            }
        })

        // --- Pet streak logic ---
        if (petId) {
            // Find the most recent post for this pet (excluding the new one)
            const lastPost = await prisma.post.findFirst({
                where: {
                    petId,
                    id: { not: post.id },
                    mediaType: { not: "video" }, // Only count image posts for streak
                },
                orderBy: { createdAt: "desc" },
            });

            let newStreak = 1; // Default to 1 for first post
            if (lastPost) {
                const lastDate = new Date(lastPost.createdAt);
                const now = new Date(post.createdAt);
                const diffMs = now.getTime() - lastDate.getTime();
                const diffHours = diffMs / (1000 * 60 * 60);
                
                if (diffHours > 24) {
                    // More than 24 hours passed, start new streak at 1
                    newStreak = 1;
                } else if (diffHours > 0) {
                    // Within 24 hours, increment the existing streak
                    const pet = await prisma.pet.findUnique({ where: { id: petId }, select: { streak: true } });
                    newStreak = (pet?.streak || 0) + 1;
                } else {
                    // Same time (within same hour), keep streak unchanged
                    const pet = await prisma.pet.findUnique({ where: { id: petId }, select: { streak: true } });
                    newStreak = pet?.streak || 1;
                }
            }
            // Update the pet's streak
            await prisma.pet.update({
                where: { id: petId },
                data: { streak: newStreak },
            });
        }

        revalidatePath("/"); // Purge the cache for the home page
        
        // Track XP for posting a photo
        if (image && mediaType?.startsWith('image')) {
          await trackChallengeProgress('daily_post_photo', 1);
          await trackChallengeProgress('weekly_post_7_photos', 1);
        }
        
        return { success:true, post }
    } catch (error) {
        console.error("Failed to create post:", error);
        return { success: false, error: "Failed to create post" };
    }
}

export async function getPosts() {
    try {
        const posts = await prisma.post.findMany({
            where: {
                NOT: {
                    type: { in: ["PRODUCT", "SERVICE"] }
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            include:{
                author:{
                    select:{
                        id: true,
                        name: true,
                        image: true,
                        username: true
                    }
                },
                pet: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        species: true,
                        breed: true,
                        age: true,
                        bio: true,
                    }
                },
                comments:{
                    include:{
                        author:{
                            select:{
                                id: true,
                                username: true,
                                image: true,
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt:"asc"
                    }
                },
                likes:{
                    select:{
                        userId:true
                    }

                },
                _count:{
                    select:{
                        likes:true,
                        comments:true
                    }
                }
            },
        });

        return posts;
    } catch (error) {
        console.log("Error in getPosts", error);
        throw new Error("Failed to fetch posts");
    }
}

export async function toggleLike(postId: string) {
    try {
      const userId = await getDbUserId();
      if (!userId) return;
  
      // check if like exists
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
  
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      });
  
      if (!post) throw new Error("Post not found");
  
      if (existingLike) {
        // unlike
        await prisma.like.delete({
          where: {
            userId_postId: {
              userId,
              postId,
            },
          },
        });
      } else {
        // like and create notification (only if liking someone else's post)
        await prisma.$transaction([
          prisma.like.create({
            data: {
              userId,
              postId,
            },
          }),
          ...(post.authorId !== userId
            ? [
                prisma.notification.create({
                  data: {
                    type: "LIKE",
                    userId: post.authorId, // recipient (post author)
                    creatorId: userId, // person who liked
                    postId,
                  },
                }),
              ]
            : []),
        ]);
      }
  
      revalidatePath("/");
      
      // Track XP for liking posts (only when liking, not unliking)
      if (!existingLike) {
        try {
          const { userId: clerkId } = await auth();
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/xp/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              challengeId: 'daily_like_3_posts',
              increment: 1,
              userId: clerkId,
            }),
          });
        } catch (error) {
          console.error('Failed to track XP for liking:', error);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error("Failed to toggle like:", error);
      return { success: false, error: "Failed to toggle like" };
    }
  }

  export async function createComment(postId: string, content: string) {
    try {
      const userId = await getDbUserId();
  
      if (!userId) return;
      if (!content) throw new Error("Content is required");
  
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      });
  
      if (!post) throw new Error("Post not found");
  
      // Create comment and notification in a transaction
      const [comment] = await prisma.$transaction(async (tx) => {
        // Create comment first
        const newComment = await tx.comment.create({
          data: {
            content,
            authorId: userId,
            postId,
          },
        });
  
        // Create notification if commenting on someone else's post
        if (post.authorId !== userId) {
          await tx.notification.create({
            data: {
              type: "COMMENT",
              userId: post.authorId,
              creatorId: userId,
              postId,
              commentId: newComment.id,
            },
          });
        }
  
        return [newComment];
      });
  
      revalidatePath(`/`);
      
      // Track XP for commenting
      try {
        const { userId: clerkId } = await auth();
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/xp/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            challengeId: 'weekly_comment_20_posts',
            increment: 1,
            userId: clerkId,
          }),
        });
      } catch (error) {
        console.error('Failed to track XP for commenting:', error);
      }
      
      return { success: true, comment };
    } catch (error) {
      console.error("Failed to create comment:", error);
      return { success: false, error: "Failed to create comment" };
    }
  }

  export async function deletePost(postId: string) {
    try {
      const userId = await getDbUserId();

      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true, petId: true },
      });

      if (!post) throw new Error("Post not found");

      // If post is associated with a pet, allow the pet's owner to delete
      if (post.petId) {
        const pet = await prisma.pet.findUnique({ where: { id: post.petId }, select: { userId: true } });
        if (!pet) throw new Error("Pet not found");
        if (pet.userId !== userId && post.authorId !== userId) {
          throw new Error("Unauthorized - no delete permission");
        }
      } else {
        // Only allow the post author to delete
        if (post.authorId !== userId) throw new Error("Unauthorized - no delete permission");
      }

      await prisma.post.delete({
        where: { id: postId },
      });

      revalidatePath("/"); // purge the cache
      return { success: true };
    } catch (error) {
      console.error("Failed to delete post:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete post";
      return { success: false, error: errorMessage };
    }
  }

export async function getFollowingPosts() {
    try {
        const userId = await getDbUserId();
        if (!userId) return [];

        const posts = await prisma.post.findMany({
            where: {
                OR: [
                    { authorId: userId }, // User's own posts
                    {
                        author: {
                            followers: {
                                some: {
                                    followerId: userId
                                }
                            }
                        }
                    }
                ],
                NOT: {
                    type: { in: ["PRODUCT", "SERVICE"] }
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            include:{
                author:{
                    select:{
                        id: true,
                        name: true,
                        image: true,
                        username: true
                    }
                },
                pet: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        species: true,
                        breed: true,
                        age: true,
                        bio: true,
                    }
                },
                comments:{
                    include:{
                        author:{
                            select:{
                                id: true,
                                username: true,
                                image: true,
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt:"asc"
                    }
                },
                likes:{
                    select:{
                        userId:true
                    }
                },
                _count:{
                    select:{
                        likes:true,
                        comments:true
                    }
                }
            },
        });

        return posts;
    } catch (error) {
        console.log("Error in getFollowingPosts", error);
        throw new Error("Failed to fetch following posts");
    }
}

export async function getExplorePosts() {
    try {
        const userId = await getDbUserId();
        if (!userId) return [];

        const posts = await prisma.post.findMany({
            where: {
                NOT: {
                    OR: [
                        { authorId: userId }, // Exclude user's own posts
                        { type: { in: ["PRODUCT", "SERVICE"] } }
                    ]
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            include:{
                author:{
                    select:{
                        id: true,
                        name: true,
                        image: true,
                        username: true
                    }
                },
                pet: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        species: true,
                        breed: true,
                        age: true,
                        bio: true,
                    }
                },
                comments:{
                    include:{
                        author:{
                            select:{
                                id: true,
                                username: true,
                                image: true,
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt:"asc"
                    }
                },
                likes:{
                    select:{
                        userId:true
                    }
                },
                _count:{
                    select:{
                        likes:true,
                        comments:true
                    }
                }
            },
        });

        // Shuffle the posts array
        const shuffledPosts = [...posts].sort(() => Math.random() - 0.5);

        return shuffledPosts;
    } catch (error) {
        console.log("Error in getExplorePosts", error);
        throw new Error("Failed to fetch explore posts");
    }
}

export async function getRandomPetPostsWithImages(count: number = 3) {
  // Get random posts with images and pets
  const posts = await prisma.post.findMany({
    where: {
      image: { not: null },
      petId: { not: null },
      mediaType: { not: "video" },
    },
    include: {
      pet: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          loveCount: true,
        },
      },
      author: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
  });
  // Shuffle and return N
  for (let i = posts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [posts[i], posts[j]] = [posts[j], posts[i]];
  }
  return posts.slice(0, count);
}

export async function updatePost(postId: string, data: { content?: string; image?: string }) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    if (!post) return { success: false, error: "Post not found" };
    if (post.authorId !== userId) return { success: false, error: "Unauthorized" };

    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.image !== undefined ? { image: data.image } : {}),
      },
    });
    revalidatePath("/");
    return { success: true, post: updated };
  } catch (error) {
    console.error("Failed to update post:", error);
    return { success: false, error: "Failed to update post" };
  }
}

