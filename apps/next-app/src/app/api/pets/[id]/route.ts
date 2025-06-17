import { getAuth } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

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