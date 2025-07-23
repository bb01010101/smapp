// Evolution image mapping based on breed and level
interface EvolutionImageMap {
  [breed: string]: {
    baby: string;    // Levels 1-9 (bronze)
    yung: string;    // Levels 10-19 (silver)
    big: string;     // Levels 20-29 (gold)
    evolved: string; // Levels 30-39 (diamond)
  };
}

const EVOLUTION_IMAGES: EvolutionImageMap = {
  "Golden Retriever": {
    baby: "/avatars/dogs/goldenretriever/babygolden.jpeg",
    yung: "/avatars/dogs/goldenretriever/yunggolden.png",
    big: "/avatars/dogs/goldenretriever/biggolden.jpeg",
    evolved: "/avatars/dogs/goldenretriever/evolvedgolden.jpeg"
  },
  "German Shepherd": {
    baby: "/avatars/dogs/germanshepherd/babygerman.png",
    yung: "/avatars/dogs/germanshepherd/yunggerman.png",
    big: "/avatars/dogs/germanshepherd/biggerman.png",
    evolved: "/avatars/dogs/germanshepherd/evolvedgerman.png"
  },
  "Poodle": {
    baby: "/avatars/dogs/poodle/babypoodle.png",
    yung: "/avatars/dogs/poodle/yungpoodle.png",
    big: "/avatars/dogs/poodle/bigpoodle.png",
    evolved: "/avatars/dogs/poodle/evolvedpoodle.png"
  },
  "French Bulldog": {
    baby: "/avatars/dogs/frenchbulldog/babyfrench.png",
    yung: "/avatars/dogs/frenchbulldog/yungfrench.png",
    big: "/avatars/dogs/frenchbulldog/adultfrench.png",
    evolved: "/avatars/dogs/frenchbulldog/evolvedfrench.png"
  },
  "Collie": {
    baby: "/avatars/dogs/collee/babycollee.jpeg",
    yung: "/avatars/dogs/collee/yungcollee.jpeg",
    big: "/avatars/dogs/collee/bigcollee.png",
    evolved: "/avatars/dogs/collee/evolvedcollee.jpeg"
  }
};

// Breed name aliases and variations
const BREED_ALIASES: { [key: string]: string } = {
  "golden retriever": "Golden Retriever",
  "german shepherd": "German Shepherd", 
  "poodle": "Poodle",
  "french bulldog": "French Bulldog",
  "frenchie": "French Bulldog",
  "collie": "Collie",
  "border collie": "Collie",
  "rough collie": "Collie"
};

/**
 * Get the evolution image URL based on pet breed and level
 * @param breed - The breed of the pet
 * @param level - The current level of the pet
 * @returns The URL of the evolution image
 */
export function getEvolutionImageUrl(breed: string | null | undefined, level: number): string {
  // Log for debugging
  if (typeof window !== 'undefined') {
    console.log('Evolution Debug:', { breed, level });
  }
  
  // Normalize breed name (handle case variations and aliases)
  const normalizedBreed = breed?.trim();
  
  // Check breed aliases first, then exact matches
  let petBreed = "Golden Retriever"; // Default
  if (normalizedBreed) {
    // Try exact match first
    if (EVOLUTION_IMAGES[normalizedBreed]) {
      petBreed = normalizedBreed;
    } 
    // Try case-insensitive alias match
    else if (BREED_ALIASES[normalizedBreed.toLowerCase()]) {
      petBreed = BREED_ALIASES[normalizedBreed.toLowerCase()];
    }
  }
  
  if (typeof window !== 'undefined' && petBreed === "Golden Retriever" && normalizedBreed !== "Golden Retriever") {
    console.log(`No evolution images found for breed: "${normalizedBreed}", defaulting to Golden Retriever`);
  }
  
  const evolutionImages = EVOLUTION_IMAGES[petBreed];
  
  // Determine evolution stage based on level
  let imageUrl: string;
  if (level >= 30) {
    imageUrl = evolutionImages.evolved; // Diamond (30-39)
  } else if (level >= 20) {
    imageUrl = evolutionImages.big;     // Gold (20-29)
  } else if (level >= 10) {
    imageUrl = evolutionImages.yung;    // Silver (10-19)
  } else {
    imageUrl = evolutionImages.baby;    // Bronze (1-9)
  }
  
  if (typeof window !== 'undefined') {
    console.log(`Evolution image URL: ${imageUrl}`);
  }
  
  return imageUrl;
}

/**
 * Get the evolution stage name based on level
 * @param level - The current level of the pet
 * @returns The name of the evolution stage
 */
export function getEvolutionStageName(level: number): string {
  if (level >= 30) {
    return "Evolved"; // Diamond
  } else if (level >= 20) {
    return "Adult";   // Gold
  } else if (level >= 10) {
    return "Young";   // Silver
  } else {
    return "Baby";    // Bronze
  }
} 