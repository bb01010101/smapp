import { getAuth } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/pets/[id] - get pet and up to 6 recent posts with images
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const pet = await prisma.pet.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        userId: true,
        bio: true,
        breed: true,
        species: true,
        age: true,
        posts: {
          where: { image: { not: null } },
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: { image: true }
        }
      }
    });
    if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    return NextResponse.json({ pet, posts: pet.posts });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch pet posts' }, { status: 500 });
  }
}

// PUT /api/pets/[id] - update a pet
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const data = await req.json();
  const pet = await prisma.pet.update({
    where: { id: params.id, userId },
    data: {
      name: data.name,
      species: data.species,
      breed: data.breed,
      age: data.age,
      bio: data.bio,
      imageUrl: data.imageUrl,
    },
  });
  return NextResponse.json(pet);
}

// DELETE /api/pets/[id] - delete a pet
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await prisma.pet.delete({
    where: { id: params.id, userId },
  });
  return NextResponse.json({ success: true });
} 