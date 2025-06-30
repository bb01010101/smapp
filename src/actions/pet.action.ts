import prisma from '@/lib/prisma';

export async function getPetById(petId: string) {
  try {
    return await prisma.pet.findUnique({
      where: { id: petId },
    });
  } catch (error) {
    console.error('Error fetching pet by ID:', error);
    return null;
  }
}

export async function getPetPosts(petId: string) {
  try {
    return await prisma.post.findMany({
      where: { petId },
      orderBy: { createdAt: 'desc' },
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
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        likes: {
          select: { userId: true },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching pet posts:', error);
    return [];
  }
} 