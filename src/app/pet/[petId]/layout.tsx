import { getPetById } from '@/actions/pet.action';
import PetCard from '@/components/PetCard';
import { getEvolutionImageUrl } from '@/lib/petEvolution';
import { getUserEvolutionImagePreference } from '@/actions/profile.action';
import { getCurrentUserTotalXp } from '@/actions/user.action';
import { ReactNode } from 'react';

export default async function PetProfileLayout({ children, params }: { children: ReactNode; params: { petId: string } }) {
  const pet = await getPetById(params.petId);
  const useEvolutionImages = await getUserEvolutionImagePreference();
  const userTotalXp = await getCurrentUserTotalXp();

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="hidden lg:block lg:col-span-3">
          {pet ? (
            <div className="sticky top-24">
              <PetCard
                imageUrl={pet.imageUrl || '/avatar.png'}
                name={pet.name}
                level={pet.level}
                xp={userTotalXp}
                prestige={pet.prestige}
                evolutionImageUrl={getEvolutionImageUrl(pet.breed, pet.level)}
                breed={pet.breed}
                useEvolutionImages={useEvolutionImages}
              />
            </div>
          ) : null}
        </div>
        <div className="lg:col-span-9">{children}</div>
      </div>
    </div>
  );
} 