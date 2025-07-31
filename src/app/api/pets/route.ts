import { auth } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/pets - get all pets for current user
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    
    const pets = await prisma.pet.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ pets });
  } catch (error) {
    console.error('Error fetching pets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/pets - create a new pet
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const data = await req.json();

  // Validate required fields
  const requiredFields = ['name', 'species'];
  for (const field of requiredFields) {
    if (!data[field] || typeof data[field] !== 'string' || data[field].trim() === '') {
      return NextResponse.json({ error: `Missing or empty required field: ${field}` }, { status: 400 });
    }
  }

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