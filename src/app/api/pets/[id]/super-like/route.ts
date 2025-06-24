import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const petId = params.id;
    
    // Get the current user from our database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the pet
    const pet = await prisma.pet.findUnique({
      where: { id: petId }
    });

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }

    // Don't allow super liking your own pet
    if (pet.userId === dbUser.id) {
      return NextResponse.json({ error: 'Cannot super like your own pet' }, { status: 400 });
    }

    // Try to get the pet owner's information, but don't fail if not found
    let petOwner = null;
    try {
      petOwner = await prisma.user.findUnique({
        where: { id: pet.userId },
        select: {
          id: true,
          name: true,
          username: true,
          image: true
        }
      });
    } catch (error) {
      console.log('Pet owner not found, continuing without owner info');
    }

    // Increment the pet's love count for super like
    const updatedPet = await prisma.pet.update({
      where: { id: petId },
      data: {
        loveCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      petOwner: petOwner,
      pet: updatedPet,
      message: 'Super like successful! Opening DMs...' 
    });

  } catch (error) {
    console.error('Error super liking pet:', error);
    return NextResponse.json(
      { error: 'Failed to super like pet' }, 
      { status: 500 }
    );
  }
} 