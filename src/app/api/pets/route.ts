import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/pets - get all pets for current user
export async function GET(req) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const pets = await prisma.pet.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(pets);
}

// POST /api/pets - create a new pet
export async function POST(req) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const data = await req.json();
  const pet = await prisma.pet.create({
    data: {
      userId,
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