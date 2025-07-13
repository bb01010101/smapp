import prisma from '@/lib/prisma';
import { getLevelFromXp, getPrestigeByLevel } from '@/lib/petLeveling';

export async function getPetById(petId: string) {
  try {
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
    });
    if (!pet) return null;
    // Find the most recent post for this pet
    const lastPost = await prisma.post.findFirst({
      where: {
        petId,
        mediaType: { not: "video" },
      },
      orderBy: { createdAt: "desc" },
    });
    if (lastPost) {
      const lastDate = new Date(lastPost.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - lastDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours > 24 && pet.streak !== 0) {
        await prisma.pet.update({
          where: { id: petId },
          data: { streak: 0 },
        });
        pet.streak = 0;
      }
    }
    return pet;
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

/**
 * Awards XP to a pet, recalculates level and prestige, and updates the pet if needed.
 * Returns the updated pet object.
 */
export async function awardXpToPet(petId: string, amount: number) {
  try {
    const pet = await prisma.pet.findUnique({ where: { id: petId } });
    if (!pet) return null;

    const newXp = (pet.xp || 0) + amount;
    const newLevel = getLevelFromXp(newXp);
    const prestigeConfig = getPrestigeByLevel(newLevel);
    const newPrestige = prestigeConfig.key;

    // Only update if something changed
    if (newXp !== pet.xp || newLevel !== pet.level || newPrestige !== pet.prestige) {
      const updatedPet = await prisma.pet.update({
        where: { id: petId },
        data: {
          xp: newXp,
          level: newLevel,
          prestige: newPrestige,
        },
      });
      return updatedPet;
    }
    return pet;
  } catch (error) {
    console.error('Error awarding XP to pet:', error);
    return null;
  }
} 