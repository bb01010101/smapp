import { getEvolutionImageUrl } from './petEvolution';

interface Pet {
  id: string;
  imageUrl?: string | null;
  breed?: string | null;
  level: number;
  name: string;
  species: string;
}

/**
 * Get the appropriate pet image URL based on user preference
 * @param pet - The pet object
 * @param useEvolutionImages - Whether the user prefers evolution images over real photos
 * @returns The URL of the image to display
 */
export function getPetDisplayImage(pet: Pet, useEvolutionImages: boolean = false): string {
  if (useEvolutionImages) {
    // Use evolution image based on breed and level
    return getEvolutionImageUrl(pet.breed, pet.level);
  } else {
    // Use real pet photo, fallback to evolution image if no real photo
    return pet.imageUrl || getEvolutionImageUrl(pet.breed, pet.level);
  }
}

/**
 * Get the appropriate pet image URL for a specific context (avatar, card, etc.)
 * This is a convenience function that handles null/undefined pet objects
 * @param pet - The pet object (can be null/undefined)
 * @param useEvolutionImages - Whether the user prefers evolution images
 * @param defaultImage - Fallback image if pet is null/undefined
 * @returns The URL of the image to display
 */
export function getPetAvatarImage(
  pet: Pet | null | undefined, 
  useEvolutionImages: boolean = false, 
  defaultImage: string = '/avatar.png'
): string {
  if (!pet) {
    return defaultImage;
  }
  
  return getPetDisplayImage(pet, useEvolutionImages);
} 