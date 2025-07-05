import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  if (!q) {
    return NextResponse.json({ results: [] });
  }

  // Search users (by username or name)
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
    },
    take: 5,
  });

  // Search pets (by name or species)
  const pets = await prisma.pet.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { species: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      species: true,
    },
    take: 5,
  });

  // Search posts (by content or title)
  const posts = await prisma.post.findMany({
    where: {
      OR: [
        { content: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      content: true,
      title: true,
      image: true,
    },
    take: 5,
  });

  // Add type field for grouping
  const userResults = users.map(u => ({ ...u, type: 'user' }));
  const petResults = pets.map(p => ({ ...p, type: 'pet' }));
  const postResults = posts.map(p => ({ ...p, type: 'post' }));

  return NextResponse.json({
    results: [...userResults, ...petResults, ...postResults],
  });
} 