import { getPetById } from '@/actions/pet.action';
import PetCard from '@/components/PetCard';
import { getEvolutionImageUrl } from '@/lib/petEvolution';
import { getUserEvolutionImagePreference } from '@/actions/profile.action';
import { getCurrentUserTotalXp, getUserTotalXpByClerkId } from '@/actions/user.action';
import { getLevelFromXp } from '@/lib/petLeveling';
import { auth } from '@clerk/nextjs/server';
import { ReactNode } from 'react';

export default async function PetProfileLayout({ children, params }: { children: ReactNode; params: { petId: string } }) {
  const pet = await getPetById(params.petId);
  const useEvolutionImages = await getUserEvolutionImagePreference();
  const currentUserTotalXp = await getCurrentUserTotalXp();
  
  // Get current user's clerk ID to check ownership
  const { userId: currentUserClerkId } = await auth();
  
  // Determine if current user owns this pet and get appropriate XP
  const isOwnPet = pet && currentUserClerkId && pet.userId === currentUserClerkId;
  const petOwnerTotalXp = pet && !isOwnPet ? await getUserTotalXpByClerkId(pet.userId) : currentUserTotalXp;
  const displayXp = isOwnPet ? currentUserTotalXp : petOwnerTotalXp;
  
  // Calculate level from XP to match the sidebar (155 XP = Level 2)
  const calculatedLevel = getLevelFromXp(displayXp);

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="hidden lg:block lg:col-span-3">
          {pet ? (
            <div className="sticky top-24">
              <PetCard
                imageUrl={pet.imageUrl || '/avatar.png'}
                name={pet.name}
                level={calculatedLevel}
                xp={displayXp}
                prestige={pet.prestige}
                evolutionImageUrl={getEvolutionImageUrl(pet.breed, calculatedLevel)}
                breed={pet.breed}
                useEvolutionImages={useEvolutionImages}
                petId={pet.id}
                // Note: previousLevel and previousXp are optional
                // They would need to be tracked separately to enable animations
                // For now, animations will only trigger for pets that level up
                // after this update is deployed
              />
            </div>
          ) : null}
        </div>
        <div className="lg:col-span-9">{children}</div>
      </div>
    </div>
  );
} 