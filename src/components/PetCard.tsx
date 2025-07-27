'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { PrestigeKey, prestigeLevels } from '@/lib/petLeveling';
import { getPetDisplayImage } from '@/lib/petImageUtils';
import { getEvolutionStageName } from '@/lib/petEvolution';
import { getPrestigeByLevel } from '@/lib/petLeveling';

interface PetCardProps {
  imageUrl: string;
  name: string;
  level: number;
  xp: number;
  prestige: PrestigeKey;
  evolutionImageUrl?: string | null;
  breed?: string | null;
  useEvolutionImages?: boolean;
  // Animation props
  previousLevel?: number;
  previousXp?: number;
  petId: string; // For tracking animation state
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

export const PetCard: React.FC<PetCardProps> = ({ 
  imageUrl, 
  name, 
  level, 
  xp, 
  prestige, 
  evolutionImageUrl, 
  breed, 
  useEvolutionImages = false,
  previousLevel,
  previousXp,
  petId
}) => {
  const safeLevel = typeof level === 'number' && !isNaN(level) ? 12 : 12; // DEMO: Force Silver tier (young)
  const safeXp = typeof xp === 'number' && !isNaN(xp) ? xp : 1200; // Silver tier XP
  // DEMO: Simulate Bronze->Silver evolution (baby->young)
  const safePreviousLevel = 9; // Bronze tier (baby)
  const safePreviousXp = 900; // Previous XP
  // Real code would use:
  // const safePreviousLevel = typeof previousLevel === 'number' && !isNaN(previousLevel) ? previousLevel : safeLevel;
  // const safePreviousXp = typeof previousXp === 'number' && !isNaN(previousXp) ? previousXp : safeXp;
  
  const prestigeConfig = prestigeLevels.find(p => p.key === prestige);
  const prestigeLabel = prestigeConfig ? prestigeConfig.label : prestige;
  const xpForLevel = 100;
  const style = prestigeStyles[prestige] || prestigeStyles.BRONZE;

  // DEMO: Force prestige based on our demo levels
  const demoPrestige = getPrestigeByLevel(safeLevel); // Silver for level 12
  const demoPrestigeConfig = prestigeLevels.find(p => p.key === demoPrestige.key);
  const demoPrestigeLabel = demoPrestigeConfig ? demoPrestigeConfig.label : demoPrestige.key;

  // Animation states
  const [showLevelUpAnimation, setShowLevelUpAnimation] = useState(false);
  const [showEvolutionAnimation, setShowEvolutionAnimation] = useState(false);
  const [animationPlayed, setAnimationPlayed] = useState(false);
  const [evolutionPhase, setEvolutionPhase] = useState<'start' | 'glowing' | 'end'>('start');

  // Calculate XP progress based on animation phase (after animation states are declared)
  let displayXp = safeXp;
  if (showEvolutionAnimation && evolutionPhase === 'start') {
    displayXp = safePreviousXp;
  }
  const xpThisLevel = displayXp % xpForLevel;
  const xpPercent = Math.min(100, (xpThisLevel / xpForLevel) * 100);
  
  // Determine which images to display based on user preference
  const petData = { id: '', imageUrl, breed, level, name, species: 'dog' };

  // Check for level up or evolution
  const hasLeveledUp = safeLevel > safePreviousLevel;
  const previousEvolutionStage = getEvolutionStageName(safePreviousLevel);
  const currentEvolutionStage = getEvolutionStageName(safeLevel);
  const hasEvolved = currentEvolutionStage !== previousEvolutionStage;

  // Get prestige tiers for animation
  const previousPrestige = getPrestigeByLevel(safePreviousLevel);
  const currentPrestige = getPrestigeByLevel(safeLevel);
  const hasPrestigeChanged = previousPrestige.key !== currentPrestige.key;
  
  // For evolution animation, we need to handle image transitions
  let displayImage: string;
  let displayPrestige = demoPrestige.key; // Use demo prestige (Silver)
  
  if (showEvolutionAnimation) {
    if (evolutionPhase === 'start') {
      // Show previous evolution stage and tier (Bronze + baby)
      const previousEvolutionData = { ...petData, level: safePreviousLevel };
      displayImage = useEvolutionImages 
        ? getPetDisplayImage(previousEvolutionData, true)
        : getPetDisplayImage(previousEvolutionData, false);
      displayPrestige = previousPrestige.key; // Bronze
    } else if (evolutionPhase === 'glowing') {
      // White orb phase - transition to new tier styling
      displayImage = ''; // Will show white orb instead
      displayPrestige = currentPrestige.key; // Silver (start showing new tier styling)
    } else {
      // Show new evolution stage and tier (Silver + young)
      const currentEvolutionData = { ...petData, level: safeLevel };
      displayImage = useEvolutionImages 
        ? getPetDisplayImage(currentEvolutionData, true)
        : getPetDisplayImage(currentEvolutionData, false);
      displayPrestige = currentPrestige.key; // Silver
    }
  } else {
    // Normal display - use current level
    const currentEvolutionData = { ...petData, level: safeLevel };
    displayImage = useEvolutionImages 
      ? getPetDisplayImage(currentEvolutionData, true)
      : getPetDisplayImage(currentEvolutionData, false);
    displayPrestige = demoPrestige.key; // Use demo prestige when not animating
  }

  const displayPrestigeConfig = prestigeLevels.find(p => p.key === displayPrestige);
  const displayPrestigeLabel = displayPrestigeConfig ? displayPrestigeConfig.label : displayPrestige;
  const displayStyle = prestigeStyles[displayPrestige] || prestigeStyles.BRONZE;

  const frontImage = useEvolutionImages 
    ? getPetDisplayImage(petData, true)  // Evolution image
    : getPetDisplayImage(petData, false); // Real photo (with evolution fallback)
  
  const backImage = useEvolutionImages
    ? (imageUrl || evolutionImageUrl)
    : (evolutionImageUrl || getPetDisplayImage(petData, true));

  // Animation detection and triggering - show evolution when prestige changes
  useEffect(() => {
    const animationKey = `petcard-animation-${petId}-${safeLevel}-${safeXp}`;
    const hasPlayedAnimation = localStorage.getItem(animationKey) === 'true';

    // TEMPORARY DEMO: Show evolution animation with tier progression
    if (!animationPlayed) {
      setTimeout(() => {
        setShowEvolutionAnimation(true);
        setEvolutionPhase('start');
        
        // Phase 1: Start with previous evolution/tier (1 second)
        setTimeout(() => {
          setEvolutionPhase('glowing');
          
          // Phase 2: White glowing orb (2 seconds)
          setTimeout(() => {
            setEvolutionPhase('end');
            
            // Phase 3: New evolution/tier revealed (1 second)
            setTimeout(() => {
              setShowEvolutionAnimation(false);
              setAnimationPlayed(true);
              setEvolutionPhase('start');
            }, 1000);
          }, 2000);
        }, 1000);
      }, 1000); // Initial delay
    }
  }, [hasLeveledUp, hasEvolved, petId, safeLevel, safeXp, animationPlayed]);

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
    <div className="relative">
      <Card
        className={`relative overflow-hidden shadow-2xl ${displayStyle.border} border-4 rounded-2xl transition-all duration-300 ${
          showEvolutionAnimation ? 'scale-105' : ''
        }`}
        style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
      >
        {/* Metallic/gradient background */}
        <div className={`absolute inset-0 z-0 bg-gradient-to-br ${displayStyle.bg} opacity-95`} aria-hidden="true" />
        
        {/* Shine overlays */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute left-0 top-0 w-full h-1/3 bg-white/20 blur-lg" />
          <div className="absolute right-0 bottom-0 w-1/2 h-1/2 bg-white/10 blur-md rounded-full" />
          <div className="absolute left-1/4 top-0 w-1/2 h-1/6 bg-white/30 opacity-40 rounded-full blur-xl rotate-12" />
        </div>

        {/* Evolution Animation Overlay */}
        {showEvolutionAnimation && (
          <div className="absolute inset-0 z-50 pointer-events-none">
            {/* Colorful energy waves */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 opacity-30 animate-pulse rounded-2xl" />
            <div className="absolute inset-0 bg-gradient-to-l from-yellow-400 via-red-400 to-pink-400 opacity-20 animate-ping rounded-2xl" />
            
            {/* Energy particles */}
            <div className="absolute top-2 left-2 w-4 h-4 bg-blue-400 rounded-full animate-ping" />
            <div className="absolute top-6 right-2 w-3 h-3 bg-purple-400 rounded-full animate-ping animation-delay-100" />
            <div className="absolute top-12 left-6 w-2 h-2 bg-green-400 rounded-full animate-ping animation-delay-200" />
            <div className="absolute top-2 right-8 w-5 h-5 bg-yellow-400 rounded-full animate-ping animation-delay-300" />
            <div className="absolute bottom-2 left-4 w-3 h-3 bg-red-400 rounded-full animate-ping animation-delay-400" />
            <div className="absolute bottom-6 right-2 w-4 h-4 bg-pink-400 rounded-full animate-ping animation-delay-500" />
            <div className="absolute bottom-2 left-12 w-2 h-2 bg-cyan-400 rounded-full animate-ping animation-delay-600" />
            <div className="absolute bottom-8 right-6 w-3 h-3 bg-indigo-400 rounded-full animate-ping animation-delay-700" />
            
            {/* White flash during glowing phase */}
            {evolutionPhase === 'glowing' && (
              <div className="absolute inset-0 bg-white/90 animate-pulse rounded-2xl" />
            )}
          </div>
        )}

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
                <div className="absolute top-0 left-0 w-full h-full backface-hidden" style={{ backfaceVisibility: 'hidden', zIndex: 2 }}>
                  {evolutionPhase === 'glowing' ? (
                    // White glowing orb during evolution
                    <div className={`w-28 h-28 rounded-full border-4 border-white shadow-xl bg-white animate-pulse ${
                      showEvolutionAnimation ? 'animate-expand-shake' : ''
                    }`} />
                  ) : (
                    <img
                      src={displayImage}
                      alt={name}
                      className={`w-28 h-28 rounded-full border-4 border-white shadow-xl object-cover bg-white/40 ${
                        showEvolutionAnimation ? 'animate-expand-shake' : ''
                      } ${showEvolutionAnimation && (evolutionPhase === 'start' || evolutionPhase === 'end') ? 'ring-8 ring-white ring-opacity-90' : ''}`}
                    />
                  )}
                </div>
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
            {displayPrestigeLabel}
          </div>
        </CardHeader>
        <CardContent className="relative z-20 flex flex-col items-center pt-2 pb-7">
          {/* Level display */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-bold text-white/80 drop-shadow">Lvl</span>
            <span className={`text-5xl font-black text-white drop-shadow-lg tracking-tight ${
              showEvolutionAnimation ? 'animate-pulse text-cyan-300' : ''
            }`} 
            style={{ WebkitTextStroke: '1px #fff8', letterSpacing: 2 }}>
              {showEvolutionAnimation && evolutionPhase === 'start' ? safePreviousLevel : safeLevel}
            </span>
          </div>
          {/* Total XP Display */}
          <div className="mb-2 text-center">
            <div className="text-xs text-white/70 font-medium tracking-wide mb-1">
              TOTAL XP
            </div>
            <div className={`text-xl font-bold text-white drop-shadow ${
              showEvolutionAnimation ? 'animate-pulse' : ''
            }`}>
              {showEvolutionAnimation && evolutionPhase === 'start' ? safePreviousXp.toLocaleString() : safeXp.toLocaleString()}
            </div>
          </div>

          {/* Single XP Progress Bar */}
          <div className="w-48 h-4 bg-white/30 rounded-full overflow-hidden shadow-inner border border-white/40 mb-2">
            <div
              className={`h-full rounded-full bg-gradient-to-r transition-all ${
                showEvolutionAnimation ? 'from-purple-300 via-blue-300 to-green-300 animate-pulse' : 'from-yellow-200 via-yellow-400 to-yellow-600'
              }`}
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
          
          /* Custom expand and shake animation */
          @keyframes expand-shake {
            0% { transform: scale(1) rotate(0deg); }
            25% { transform: scale(1.1) rotate(-2deg); }
            50% { transform: scale(1.2) rotate(2deg); }
            75% { transform: scale(1.1) rotate(-1deg); }
            100% { transform: scale(1) rotate(0deg); }
          }
          .animate-expand-shake {
            animation: expand-shake 0.8s ease-in-out infinite;
          }
          
          /* Animation delays for particles */
          .animation-delay-100 { animation-delay: 0.1s; }
          .animation-delay-200 { animation-delay: 0.2s; }
          .animation-delay-300 { animation-delay: 0.3s; }
          .animation-delay-400 { animation-delay: 0.4s; }
          .animation-delay-500 { animation-delay: 0.5s; }
          .animation-delay-600 { animation-delay: 0.6s; }
          .animation-delay-700 { animation-delay: 0.7s; }
        `}</style>
      </Card>
    </div>
  );
};

export default PetCard; 