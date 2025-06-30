import { getPetById, getPetPosts } from '@/actions/pet.action';
import { getProfileByUserId } from '@/actions/profile.action';
import { notFound } from 'next/navigation';
import PetProfileClient from './PetProfileClient';

export default async function PetProfilePage({ params }: { params: { petId: string } }) {
  const pet = await getPetById(params.petId);
  if (!pet) return notFound();
  const posts = await getPetPosts(params.petId);
  const owner = pet.userId ? await getProfileByUserId(pet.userId) : null;

  return <PetProfileClient pet={pet} posts={posts} owner={owner} />;
} 