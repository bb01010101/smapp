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

    // Get the pet and increment its love count
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
      pet: updatedPet,
      message: 'Pet loved successfully!' 
    });

  } catch (error) {
    console.error('Error liking pet:', error);
    return NextResponse.json(
      { error: 'Failed to like pet' }, 
      { status: 500 }
    );
  }
} 