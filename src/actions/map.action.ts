"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateUserLocation({
  latitude,
  longitude,
  locationSharingEnabled,
}: {
  latitude: number | null;
  longitude: number | null;
  locationSharingEnabled: boolean;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const updatedUser = await prisma.user.update({
      where: { clerkId: user.id },
      data: {
        latitude,
        longitude,
        locationSharingEnabled,
        lastLocationUpdate: locationSharingEnabled ? new Date() : null,
      },
    });

    revalidatePath("/map");
    return updatedUser;
  } catch (error) {
    console.error("Error updating user location:", error);
    throw error;
  }
}

export async function getUsersWithLocation() {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Optimized query with only necessary fields and better indexing
    const users = await prisma.user.findMany({
      where: {
        locationSharingEnabled: true,
        id: { not: user.id }, // Exclude current user
        latitude: { not: null },
        longitude: { not: null },
        // Only get users who updated their location in the last 24 hours
        lastLocationUpdate: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
        latitude: true,
        longitude: true,
        lastLocationUpdate: true,
        locationSharingEnabled: true,
      },
      orderBy: {
        lastLocationUpdate: "desc",
      },
      // Limit results for better performance
      take: 50,
    });

    return users;
  } catch (error) {
    console.error("Error fetching users with location:", error);
    throw error;
  }
}

export async function getUserLocation() {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const userData = await prisma.user.findUnique({
      where: { clerkId: user.id },
      select: {
        latitude: true,
        longitude: true,
        locationSharingEnabled: true,
        lastLocationUpdate: true,
      },
    });

    return userData;
  } catch (error) {
    console.error("Error fetching user location:", error);
    throw error;
  }
}

export async function getUserPets() {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const pets = await prisma.pet.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        species: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 4, // Limit to 4 pets for the marker
    });

    return pets;
  } catch (error) {
    console.error("Error fetching user pets:", error);
    throw error;
  }
} 