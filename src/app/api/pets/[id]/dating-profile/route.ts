import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/pets/[id]/dating-profile - Get pet's dating profile
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pet = await prisma.pet.findUnique({
      where: { id: params.id },
      include: {
        posts: {
          where: { image: { not: null } },
          orderBy: { createdAt: 'desc' },
          select: { id: true, image: true, createdAt: true }
        }
      }
    });

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }

    // Check if user owns the pet
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user || pet.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      pet: {
        id: pet.id,
        name: pet.name,
        datingProfileEnabled: pet.datingProfileEnabled,
        datingProfilePhotos: pet.datingProfilePhotos,
        location: pet.location,
        posts: pet.posts
      }
    });
  } catch (error) {
    console.error('Error fetching pet dating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/pets/[id]/dating-profile - Update pet's dating profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { datingProfileEnabled, datingProfilePhotos, location } = body;

    // Validate the input
    if (datingProfileEnabled !== undefined && typeof datingProfileEnabled !== 'boolean') {
      return NextResponse.json({ error: 'datingProfileEnabled must be a boolean' }, { status: 400 });
    }

    if (datingProfilePhotos !== undefined && !Array.isArray(datingProfilePhotos)) {
      return NextResponse.json({ error: 'datingProfilePhotos must be an array' }, { status: 400 });
    }

    if (location !== undefined && typeof location !== 'string' && location !== null) {
      return NextResponse.json({ error: 'location must be a string or null' }, { status: 400 });
    }

    const pet = await prisma.pet.findUnique({
      where: { id: params.id }
    });

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }

    // Check if user owns the pet
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user || pet.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update the pet's dating profile
    const updatedPet = await prisma.pet.update({
      where: { id: params.id },
      data: {
        ...(datingProfileEnabled !== undefined && { datingProfileEnabled }),
        ...(datingProfilePhotos !== undefined && { datingProfilePhotos }),
        ...(location !== undefined && { location }),
      }
    });

    return NextResponse.json({
      success: true,
      pet: {
        id: updatedPet.id,
        name: updatedPet.name,
        datingProfileEnabled: updatedPet.datingProfileEnabled,
        datingProfilePhotos: updatedPet.datingProfilePhotos,
        location: updatedPet.location
      }
    });
  } catch (error) {
    console.error('Error updating pet dating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 