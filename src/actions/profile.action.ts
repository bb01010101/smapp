"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getDbUserId } from "./user.action";

export async function getProfileByUsername(username: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { username: username },
        select: {
          id: true,
          clerkId: true,
          name: true,
          username: true,
          bio: true,
          image: true,
          location: true,
          website: true,
          createdAt: true,
          isFirst1000: true,
          _count: {
            select: {
              followers: true,
              following: true,
              posts: true,
            },
          },
        },
      });
  
      return user;
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw new Error("Failed to fetch profile");
    }
  }

  export async function getUserPosts(userId: string) {
    try {
      const posts = await prisma.post.findMany({
        where: {
          authorId: userId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              isFirst1000: true,
            },
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
            },
          },
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                  isFirst1000: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          likes: {
            select: {
              userId: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
  
      return posts;
    } catch (error) {
      console.error("Error fetching user posts:", error);
      throw new Error("Failed to fetch user posts");
    }
  }

  export async function getUserLikedPosts(userId: string) {
    try {
      const likedPosts = await prisma.post.findMany({
        where: {
          likes: {
            some: {
              userId,
            },
          },
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
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
            },
          },
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                  isFirst1000: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          likes: {
            select: {
              userId: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
  
      return likedPosts;
    } catch (error) {
      console.error("Error fetching liked posts:", error);
      throw new Error("Failed to fetch liked posts");
    }
  }

  export async function updateProfile(formData: FormData) {
    try {
      const { userId: clerkId } = await auth();
      if (!clerkId) throw new Error("Unauthorized");
  
      const name = formData.get("name") as string;
      const bio = formData.get("bio") as string;
      const location = formData.get("location") as string;
      const website = formData.get("website") as string;
      const image = formData.get("image") as string;
  
      const user = await prisma.user.update({
        where: { clerkId },
        data: {
          name,
          bio,
          location,
          website,
          ...(image && { image }),
        },
      });
  
      revalidatePath("/profile");
      return { success: true, user };
    } catch (error) {
      console.error("Error updating profile:", error);
      return { success: false, error: "Failed to update profile" };
    }
  }

  export async function isFollowing(userId: string) {
    try {
      const currentUserId = await getDbUserId();
      if (!currentUserId) return false;
  
      const follow = await prisma.follows.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: userId,
          },
        },
      });
  
      return !!follow;
    } catch (error) {
      console.error("Error checking follow status:", error);
      return false;
    }
  }

  export async function getUserPets(userId: string) {
    try {
      const pets = await prisma.pet.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      return pets;
    } catch (error) {
      console.error("Error fetching user pets:", error);
      throw new Error("Failed to fetch user pets");
    }
  }

  export async function getProfileByUserId(userId: string) {
    try {
      return await prisma.user.findUnique({
        where: { clerkId: userId },
        select: {
          id: true,
          clerkId: true,
          name: true,
          username: true,
          image: true,
          bio: true,
          location: true,
          website: true,
          createdAt: true,
          _count: {
            select: {
              followers: true,
              following: true,
              posts: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error fetching user by Clerk ID:', error);
      return null;
    }
  }

  // Returns true if the user is in the top 1,000 earliest registered users
  export async function isFoundingPackUser(userId: string): Promise<boolean> {
    // Get the createdAt of this user
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } });
    if (!user) return false;
    // Find the createdAt of the 1,000th user
    const thousandthUser = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
      take: 1000,
      skip: 999
    });
    if (!thousandthUser.length) return false;
    // If this user's createdAt is less than or equal to the 1,000th user's, they're a founding pack user
    return user.createdAt <= thousandthUser[0].createdAt;
  }

  export async function getUserEvolutionImagePreference(): Promise<boolean> {
    try {
      const { userId: clerkId } = await auth();
      if (!clerkId) return false;

      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { useEvolutionImages: true },
      });

      return user?.useEvolutionImages || false;
    } catch (error) {
      console.error('Error getting evolution image preference:', error);
      return false;
    }
  }

  export async function updateEvolutionImagePreference(useEvolutionImages: boolean) {
    try {
      const { userId: clerkId } = await auth();
      if (!clerkId) throw new Error("Unauthorized");

      await prisma.user.update({
        where: { clerkId },
        data: { useEvolutionImages },
      });

      revalidatePath("/settings");
      revalidatePath("/");
      return { success: true };
    } catch (error) {
      console.error("Error updating evolution image preference:", error);
      return { success: false, error: "Failed to update preference" };
    }
  }

  