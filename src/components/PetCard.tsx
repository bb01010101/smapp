'use client';

import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { PrestigeKey, prestigeLevels } from '@/lib/petLeveling';
import { getPetDisplayImage } from '@/lib/petImageUtils';

interface PetCardProps {
  imageUrl: string;
  name: string;
  level: number;
  xp: number;
  prestige: PrestigeKey;
  evolutionImageUrl?: string | null;
  breed?: string | null;
  useEvolutionImages?: boolean;
}

// Map prestige to metallic/gradient backgrounds and border colors
const prestigeStyles: Record<PrestigeKey, { bg: string; border: string; badge: string }> = {
  BRONZE: {
    bg: 'from-amber-900 via-amber-700 to-orange-400', // more bronze/copper
    border: 'border-amber-800',
    badge: 'bg-gradient-to-r from-amber-900 via-amber-700 to-orange-400 text-amber-100',
  },
  SILVER: {
    bg: 'from-gray-400 via-gray-200 to-white',
    border: 'border-gray-300',
    badge: 'bg-gradient-to-r from-gray-400 via-gray-200 to-white text-gray-700',
  },
  GOLD: {
    bg: 'from-yellow-400 via-yellow-200 to-white',
    border: 'border-yellow-400',
    badge: 'bg-gradient-to-r from-yellow-400 via-yellow-200 to-white text-yellow-800',
  },
  LAPIS_LAZULI: {
    bg: 'from-blue-900 via-blue-500 to-blue-200',
    border: 'border-blue-700',
    badge: 'bg-gradient-to-r from-blue-900 via-blue-500 to-blue-200 text-blue-100',
  },
  EMERALD: {
    bg: 'from-green-700 via-green-400 to-green-200',
    border: 'border-green-500',
    badge: 'bg-gradient-to-r from-green-700 via-green-400 to-green-200 text-green-100',
  },
  PURPLE_AMETHYST: {
    bg: 'from-purple-800 via-purple-400 to-purple-200',
    border: 'border-purple-500',
    badge: 'bg-gradient-to-r from-purple-800 via-purple-400 to-purple-200 text-purple-100',
  },
  RUBY: {
    bg: 'from-red-700 via-red-400 to-red-200',
    border: 'border-red-500',
    badge: 'bg-gradient-to-r from-red-700 via-red-400 to-red-200 text-red-100',
  },
  DIAMOND: {
    bg: 'from-cyan-300 via-white to-blue-100',
    border: 'border-cyan-300',
    badge: 'bg-gradient-to-r from-cyan-300 via-white to-blue-100 text-cyan-900',
  },
};

export const PetCard: React.FC<PetCardProps> = ({ imageUrl, name, level, xp, prestige, evolutionImageUrl, breed, useEvolutionImages = false }) => {
  const safeLevel = typeof level === 'number' && !isNaN(level) ? level : 0;
  const safeXp = typeof xp === 'number' && !isNaN(xp) ? xp : 0;
  
  const prestigeConfig = prestigeLevels.find(p => p.key === prestige);
  const prestigeLabel = prestigeConfig ? prestigeConfig.label : prestige;
  const xpForLevel = 100;
  const xpThisLevel = safeXp % xpForLevel;
  const xpPercent = Math.min(100, (xpThisLevel / xpForLevel) * 100);
  const style = prestigeStyles[prestige] || prestigeStyles.BRONZE;

  // Determine which images to display based on user preference
  const petData = { id: '', imageUrl, breed, level, name, species: 'dog' };
  const frontImage = useEvolutionImages 
    ? getPetDisplayImage(petData, true)  // Evolution image
    : getPetDisplayImage(petData, false); // Real photo (with evolution fallback)
  
  const backImage = useEvolutionImages
    ? (imageUrl || evolutionImageUrl) // Real photo as back when evolution is front
    : (evolutionImageUrl || getPetDisplayImage(petData, true)); // Evolution as back when real is front

  // Flip state and double-tap logic
  const [flipped, setFlipped] = useState(false);
  const lastTapRef = useRef<number>(0);

  const handleImageDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const lastTap = lastTapRef.current;
    if (now - lastTap < 300 && now - lastTap > 0) {
      // Double tap/click detected
      if (e) e.preventDefault();
      setFlipped(f => !f);
    }
    lastTapRef.current = now;
  };

  return (
    <Card
      className={`relative overflow-hidden shadow-2xl ${style.border} border-4 rounded-2xl`}
      style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
    >
      {/* Metallic/gradient background */}
      <div className={`absolute inset-0 z-0 bg-gradient-to-br ${style.bg} opacity-95`} aria-hidden="true" />
      {/* Shine overlays */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute left-0 top-0 w-full h-1/3 bg-white/20 blur-lg" />
        <div className="absolute right-0 bottom-0 w-1/2 h-1/2 bg-white/10 blur-md rounded-full" />
        <div className="absolute left-1/4 top-0 w-1/2 h-1/6 bg-white/30 opacity-40 rounded-full blur-xl rotate-12" />
      </div>
      <CardHeader className="relative z-20 flex flex-col items-center p-7 pb-2">
        <div className="relative mb-2">
          {/* 3D flip animation container */}
          <div
            className={`flip-container w-28 h-28`}
            onClick={handleImageDoubleTap}
            onTouchEnd={handleImageDoubleTap}
            style={{ perspective: 800, cursor: backImage ? 'pointer' : 'default' }}
            title={backImage ? 'Double-tap to flip' : undefined}
          >
            <div className={`flip-inner w-full h-full transition-transform duration-500 ${flipped ? 'rotate-y-180' : ''}`}
              style={{ transformStyle: 'preserve-3d' }}>
              {/* Front image */}
              <img
                src={frontImage}
                alt={name}
                className="w-28 h-28 rounded-full border-4 border-white shadow-xl object-cover bg-white/40 absolute top-0 left-0 backface-hidden"
                style={{ backfaceVisibility: 'hidden', zIndex: 2 }}
              />
              {/* Back image */}
              {backImage && (
                <img
                  src={backImage}
                  alt={name + ' Alternate'}
                  className="w-28 h-28 rounded-full border-4 border-white shadow-xl object-cover bg-white/40 absolute top-0 left-0 backface-hidden"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', zIndex: 1 }}
                />
              )}
            </div>
          </div>
        </div>
        <CardTitle className="mt-2 text-3xl font-extrabold text-white drop-shadow-lg tracking-wide">
          {name}
        </CardTitle>
        {/* Explicit prestige label under name as simple bold text */}
        <div className="mt-1 text-base font-bold uppercase tracking-wider text-white drop-shadow">
          {prestigeLabel}
        </div>
      </CardHeader>
      <CardContent className="relative z-20 flex flex-col items-center pt-2 pb-7">
        {/* Level display */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg font-bold text-white/80 drop-shadow">Lvl</span>
          <span className="text-5xl font-black text-white drop-shadow-lg tracking-tight" style={{ WebkitTextStroke: '1px #fff8', letterSpacing: 2 }}>{safeLevel}</span>
        </div>
        {/* Total XP Display */}
        <div className="mb-2 text-center">
          <div className="text-xs text-white/70 font-medium tracking-wide mb-1">
            TOTAL XP
          </div>
          <div className="text-xl font-bold text-white drop-shadow">
            {safeXp.toLocaleString()}
          </div>
        </div>

        {/* Single XP Progress Bar */}
        <div className="w-48 h-4 bg-white/30 rounded-full overflow-hidden shadow-inner border border-white/40 mb-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 transition-all"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
        
        {/* XP Progress Text */}
        <div className="text-xs text-white/90 font-semibold tracking-wide text-center">
          {xpThisLevel} / {xpForLevel} XP to next level
        </div>
      </CardContent>
      {/* Flip animation styles */}
      <style>{`
        .flip-container { position: relative; }
        .flip-inner { position: relative; width: 100%; height: 100%; transition: transform 0.5s cubic-bezier(.4,2,.6,1); }
        .rotate-y-180 { transform: rotateY(180deg); }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
    </Card>
  );
};

export default PetCard; 