import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import MapClient from './MapClient';

export default async function MapPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-background">
      <MapClient />
    </div>
  );
} 