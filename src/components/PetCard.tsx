'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { PrestigeKey, prestigeLevels } from '@/lib/petLeveling';
import { getPetDisplayImage } from '@/lib/petImageUtils';
import { getEvolutionStageName } from '@/lib/petEvolution';
import { getPrestigeByLevel } from '@/lib/petLeveling';
import { SecureImage } from '@/lib/useSecureImage';
import { createPortal } from 'react-dom';

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
    bg: 'from-amber-900 via-orange-700 via-amber-600 to-orange-400',
    border: 'border-amber-800',
    badge: 'bg-gradient-to-r from-amber-900 via-orange-700 via-amber-600 to-orange-400 text-amber-100',
  },
  SILVER: {
    bg: 'from-slate-500 via-slate-300 to-gray-100',
    border: 'border-slate-400',
    badge: 'bg-gradient-to-r from-slate-500 via-slate-300 to-gray-100 text-slate-800',
  },
  GOLD: {
    bg: 'from-yellow-600 via-yellow-400 to-yellow-200',
    border: 'border-yellow-500',
    badge: 'bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-200 text-yellow-900',
  },
  LAPIS_LAZULI: {
    bg: 'from-blue-900 via-blue-500 to-blue-200',
    border: 'border-blue-700',
    badge: 'bg-gradient-to-r from-blue-900 via-blue-500 to-blue-200 text-blue-100',
  },
  EMERALD: {
    bg: 'from-emerald-700 via-emerald-500 to-emerald-200',
    border: 'border-emerald-600',
    badge: 'bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-200 text-emerald-900',
  },
  PURPLE_AMETHYST: {
    bg: 'from-purple-700 via-purple-500 to-purple-200',
    border: 'border-purple-600',
    badge: 'bg-gradient-to-r from-purple-700 via-purple-500 to-purple-200 text-purple-900',
  },
  RUBY: {
    bg: 'from-red-800 via-red-500 to-red-200',
    border: 'border-red-600',
    badge: 'bg-gradient-to-r from-red-800 via-red-500 to-red-200 text-red-900',
  },
  DIAMOND: {
    bg: 'from-cyan-500 via-blue-300 via-white via-cyan-200 to-blue-100',
    border: 'border-cyan-500 shadow-cyan-300 shadow-lg',
    badge: 'bg-gradient-to-r from-cyan-500 via-blue-300 via-white via-cyan-200 to-blue-100 text-cyan-900',
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
  // 🎭 SHOWCASE SETUP: For client demos, temporarily replace these lines with:
  // const safeLevel = 20; // or 70 for Diamond showcase  
  // const safePreviousLevel = 19; // or 29 for Gold→Diamond
  const safeLevel = typeof level === 'number' && !isNaN(level) ? level : 1;
  const safeXp = typeof xp === 'number' && !isNaN(xp) ? xp : 0;
  // Real evolution logic: Use actual previous levels or current levels
  const safePreviousLevel = typeof previousLevel === 'number' && !isNaN(previousLevel) ? previousLevel : safeLevel;
  const safePreviousXp = typeof previousXp === 'number' && !isNaN(previousXp) ? previousXp : safeXp;
  
  const prestigeConfig = prestigeLevels.find(p => p.key === prestige);
  const prestigeLabel = prestigeConfig ? prestigeConfig.label : prestige;
  const xpForLevel = 100;
  const style = prestigeStyles[prestige] || prestigeStyles.BRONZE;

  // Calculate prestige based on actual level
  const currentPrestigeFromLevel = getPrestigeByLevel(safeLevel);
  const currentPrestigeConfig = prestigeLevels.find(p => p.key === currentPrestigeFromLevel.key);
  const currentPrestigeLabel = currentPrestigeConfig ? currentPrestigeConfig.label : currentPrestigeFromLevel.key;

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
  let displayPrestige = currentPrestigeFromLevel.key;
  
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
    displayPrestige = currentPrestigeFromLevel.key; // Use calculated prestige when not animating
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

    // Real evolution logic: Only trigger when there's actual level up/evolution
    if (!animationPlayed && (hasLeveledUp || hasEvolved)) {
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
              // Store in localStorage to prevent re-playing
              localStorage.setItem(animationKey, 'true');
            }, 1000);
          }, 2000);
        }, 1000);
      }, 1000); // Initial delay
    }

    // 🎭 CLIENT DEMO MODE: Uncomment the lines below to show evolution animation every time
    // Perfect for showcasing the spotlight evolution effect to clients!
    // 
    // 📋 SHOWCASE SCRIPT OPTIONS:
    // Silver→Gold + Young→Big:   safePreviousLevel = 19, safeLevel = 20
    // Gold→Diamond + Big→Evolved: safePreviousLevel = 29, safeLevel = 70
    // Bronze→Silver + Baby→Young: safePreviousLevel = 9, safeLevel = 12
    /*
    setTimeout(() => {
      setShowEvolutionAnimation(true);
      setEvolutionPhase('start');
      
      setTimeout(() => {
        setEvolutionPhase('glowing');
        
        setTimeout(() => {
          setEvolutionPhase('end');
          
          setTimeout(() => {
            setShowEvolutionAnimation(false);
            setAnimationPlayed(true);
            setEvolutionPhase('start');
          }, 1000);
        }, 2000);
      }, 1000);
    }, 1000);
    */
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
    <>
      <div className="relative">
        <Card
          className={`relative overflow-hidden shadow-2xl ${displayStyle.border} border-4 rounded-2xl transition-all duration-300 ${
            showEvolutionAnimation ? 'scale-105' : ''
          } ${displayPrestige === 'DIAMOND' ? 'shadow-cyan-300/50 shadow-2xl animate-diamond-pulse' : ''}`}
          style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
        >
          {/* Metallic/gradient background */}
          <div className={`absolute inset-0 z-0 bg-gradient-to-br ${displayStyle.bg} opacity-95`} aria-hidden="true" />
          
                     {/* Shine overlays */}
           <div className="absolute inset-0 z-10 pointer-events-none">
             <div className="absolute left-0 top-0 w-full h-1/3 bg-white/20 blur-lg" />
             <div className="absolute right-0 bottom-0 w-1/2 h-1/2 bg-white/10 blur-md rounded-full" />
             <div className="absolute left-1/4 top-0 w-1/2 h-1/6 bg-white/30 opacity-40 rounded-full blur-xl rotate-12" />
             {/* Enhanced metallic shine for all prestiges */}
             {['BRONZE', 'SILVER', 'GOLD', 'DIAMOND', 'EMERALD', 'RUBY', 'PURPLE_AMETHYST'].includes(displayPrestige) && (
               <>
                 <div className="absolute top-0 left-1/3 w-1/3 h-full bg-gradient-to-b from-white/40 via-transparent to-transparent blur-sm" />
                 <div className="absolute top-1/4 right-1/4 w-1/4 h-1/2 bg-white/25 blur-md rounded-full" />
                 {/* Extra metallic streak for higher tiers */}
                 {(displayPrestige === 'GOLD' || displayPrestige === 'DIAMOND') && (
                   <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-1/5 h-1/3 bg-white/30 blur-lg rounded-full" />
                 )}
                 {/* Diamond brilliance effects */}
                 {displayPrestige === 'DIAMOND' && (
                   <>
                     <div className="absolute inset-0 bg-gradient-to-tr from-cyan-300/20 via-white/30 to-blue-300/20 animate-pulse" />
                     <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-white/40 to-transparent animate-ping opacity-75" />
                     <div className="absolute top-1/4 left-1/4 w-1/6 h-1/6 bg-white rounded-full blur-sm animate-ping animation-delay-200" />
                     <div className="absolute top-3/4 right-1/4 w-1/8 h-1/8 bg-cyan-200 rounded-full blur-sm animate-ping animation-delay-400" />
                     <div className="absolute top-1/2 right-1/6 w-1/12 h-1/12 bg-blue-200 rounded-full blur-sm animate-ping animation-delay-600" />
                     <div className="absolute bottom-1/4 left-1/3 w-1/10 h-1/10 bg-white rounded-full blur-sm animate-ping animation-delay-800" />
                   </>
                 )}
               </>
             )}
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
                      <SecureImage
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
                    <SecureImage
                      src={backImage}
                      alt={name + ' Alternate'}
                      className="w-28 h-28 rounded-full border-4 border-white shadow-xl object-cover bg-white/40 absolute top-0 left-0 backface-hidden"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', zIndex: 1 }}
                    />
                  )}
                </div>
              </div>
            </div>
                         <CardTitle className={`mt-2 text-3xl font-extrabold text-white tracking-wide ${
               displayPrestige === 'DIAMOND' ? 'drop-shadow-2xl' : ['BRONZE', 'SILVER', 'GOLD', 'EMERALD', 'RUBY', 'PURPLE_AMETHYST'].includes(displayPrestige) ? 'drop-shadow-2xl' : 'drop-shadow-lg'
             }`} style={
               displayPrestige === 'DIAMOND' 
                 ? { textShadow: '3px 3px 6px rgba(0,0,0,0.9), 0 0 12px rgba(6,182,212,0.6), 0 0 20px rgba(6,182,212,0.4), 0 0 30px rgba(6,182,212,0.2)' }
                 : ['BRONZE', 'SILVER', 'GOLD', 'EMERALD', 'RUBY', 'PURPLE_AMETHYST'].includes(displayPrestige) 
                   ? { textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.3)' } 
                   : {}
             }>
               {name}
             </CardTitle>
             {/* Explicit prestige label under name as simple bold text */}
             <div className={`mt-1 text-base font-bold uppercase tracking-wider text-white ${
               displayPrestige === 'DIAMOND' ? 'drop-shadow-2xl' : ['BRONZE', 'SILVER', 'GOLD', 'EMERALD', 'RUBY', 'PURPLE_AMETHYST'].includes(displayPrestige) ? 'drop-shadow-xl' : 'drop-shadow'
             }`} style={
               displayPrestige === 'DIAMOND'
                 ? { textShadow: '2px 2px 4px rgba(0,0,0,0.9), 0 0 8px rgba(6,182,212,0.6), 0 0 16px rgba(6,182,212,0.4)' }
                 : ['BRONZE', 'SILVER', 'GOLD', 'EMERALD', 'RUBY', 'PURPLE_AMETHYST'].includes(displayPrestige) 
                   ? { textShadow: '1px 1px 3px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.3)' } 
                   : {}
             }>
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
             .animation-delay-800 { animation-delay: 0.8s; }
             .animation-delay-900 { animation-delay: 0.9s; }
             .animation-delay-1000 { animation-delay: 1.0s; }
             .animation-delay-1100 { animation-delay: 1.1s; }
             .animation-delay-200 { animation-delay: 0.2s; }
             .animation-delay-300 { animation-delay: 0.3s; }
             .animation-delay-500 { animation-delay: 0.5s; }
             .animation-delay-700 { animation-delay: 0.7s; }

                         /* Spotlight evolution animations */
             @keyframes spotlight-zoom-in {
               0% { 
                 opacity: 0; 
                 transform: scale(0.3); 
               }
               100% { 
                 opacity: 1; 
                 transform: scale(1.5); 
               }
             }
            @keyframes spotlight-fade-in {
              0% { opacity: 0; }
              100% { opacity: 1; }
            }
            .animate-spotlight-zoom-in {
              animation: spotlight-zoom-in 0.5s ease-out forwards;
            }
                         .animate-spotlight-fade-in {
               animation: spotlight-fade-in 0.3s ease-out forwards;
             }
             
             /* Diamond brilliance animations */
             @keyframes diamond-pulse {
               0%, 100% { filter: brightness(1) saturate(1); }
               50% { filter: brightness(1.1) saturate(1.2); }
             }
             .animate-diamond-pulse {
               animation: diamond-pulse 2s ease-in-out infinite;
             }
          `}</style>
        </Card>
      </div>
      
             {/* Spotlight Evolution Modal */}
       {showEvolutionAnimation && typeof window !== 'undefined' && createPortal(
         <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-spotlight-fade-in">
           {/* Black backdrop with spotlight effect */}
           <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
           
           {/* Spotlight gradient */}
           <div className="absolute inset-0" style={{
             background: 'radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.8) 100%)'
           }} />
           
           {/* Centered evolution card */}
           <div className="relative animate-spotlight-zoom-in">
                         <Card
               className={`relative overflow-hidden shadow-2xl ${displayStyle.border} border-4 rounded-2xl transition-all duration-300 ${
                 displayPrestige === 'DIAMOND' ? 'shadow-cyan-300/60 shadow-2xl ring-2 ring-cyan-300/30 animate-diamond-pulse' : ''
               }`}
               style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
             >
              {/* Metallic/gradient background */}
              <div className={`absolute inset-0 z-0 bg-gradient-to-br ${displayStyle.bg} opacity-95`} aria-hidden="true" />
              
                             {/* Enhanced shine overlays for spotlight */}
               <div className="absolute inset-0 z-10 pointer-events-none">
                 <div className="absolute left-0 top-0 w-full h-1/3 bg-white/30 blur-lg" />
                 <div className="absolute right-0 bottom-0 w-1/2 h-1/2 bg-white/20 blur-md rounded-full" />
                 <div className="absolute left-1/4 top-0 w-1/2 h-1/6 bg-white/40 opacity-50 rounded-full blur-xl rotate-12" />
                 <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 animate-pulse" />
                 {/* Enhanced metallic shine for all prestiges spotlight */}
                 {['BRONZE', 'SILVER', 'GOLD', 'DIAMOND', 'EMERALD', 'RUBY', 'PURPLE_AMETHYST'].includes(displayPrestige) && (
                   <>
                     <div className="absolute top-0 left-1/3 w-1/3 h-full bg-gradient-to-b from-white/50 via-transparent to-transparent blur-sm animate-pulse" />
                     <div className="absolute top-1/4 right-1/4 w-1/4 h-1/2 bg-white/35 blur-md rounded-full animate-pulse" />
                     <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/4 bg-gradient-to-r from-transparent via-white/20 to-transparent blur-lg" />
                     {/* Extra dramatic effects for higher tiers */}
                     {(displayPrestige === 'GOLD' || displayPrestige === 'DIAMOND') && (
                       <>
                         <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-1/5 h-1/3 bg-white/40 blur-lg rounded-full animate-pulse" />
                         <div className="absolute top-2/3 left-1/3 w-1/6 h-1/6 bg-white/30 blur-md rounded-full animate-ping" />
                       </>
                     )}
                     {/* Diamond brilliance spotlight effects */}
                     {displayPrestige === 'DIAMOND' && (
                       <>
                         <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/30 via-white/50 to-blue-400/30 animate-pulse" />
                         <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-white/60 to-transparent animate-ping opacity-75" />
                         <div className="absolute top-1/6 left-1/6 w-1/5 h-1/5 bg-white rounded-full blur-md animate-ping animation-delay-100" />
                         <div className="absolute top-2/3 right-1/5 w-1/6 h-1/6 bg-cyan-300 rounded-full blur-md animate-ping animation-delay-300" />
                         <div className="absolute top-1/2 right-1/8 w-1/8 h-1/8 bg-blue-300 rounded-full blur-md animate-ping animation-delay-500" />
                         <div className="absolute bottom-1/5 left-2/5 w-1/7 h-1/7 bg-white rounded-full blur-md animate-ping animation-delay-700" />
                         <div className="absolute top-1/8 right-1/3 w-1/9 h-1/9 bg-cyan-200 rounded-full blur-sm animate-ping animation-delay-900" />
                         <div className="absolute bottom-1/3 right-1/6 w-1/10 h-1/10 bg-blue-200 rounded-full blur-sm animate-ping animation-delay-1100" />
                       </>
                     )}
                   </>
                 )}
               </div>

              {/* Intense Evolution Animation Overlay */}
              <div className="absolute inset-0 z-50 pointer-events-none">
                {/* Enhanced colorful energy waves */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 opacity-40 animate-pulse rounded-2xl" />
                <div className="absolute inset-0 bg-gradient-to-l from-yellow-400 via-red-400 to-pink-400 opacity-30 animate-ping rounded-2xl" />
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-400 via-purple-400 to-blue-400 opacity-25 animate-bounce rounded-2xl" />
                
                {/* Enhanced energy particles */}
                <div className="absolute top-2 left-2 w-6 h-6 bg-blue-400 rounded-full animate-ping shadow-lg" />
                <div className="absolute top-6 right-2 w-5 h-5 bg-purple-400 rounded-full animate-ping animation-delay-100 shadow-lg" />
                <div className="absolute top-12 left-6 w-4 h-4 bg-green-400 rounded-full animate-ping animation-delay-200 shadow-lg" />
                <div className="absolute top-2 right-8 w-7 h-7 bg-yellow-400 rounded-full animate-ping animation-delay-300 shadow-lg" />
                <div className="absolute bottom-2 left-4 w-5 h-5 bg-red-400 rounded-full animate-ping animation-delay-400 shadow-lg" />
                <div className="absolute bottom-6 right-2 w-6 h-6 bg-pink-400 rounded-full animate-ping animation-delay-500 shadow-lg" />
                <div className="absolute bottom-2 left-12 w-4 h-4 bg-cyan-400 rounded-full animate-ping animation-delay-600 shadow-lg" />
                <div className="absolute bottom-8 right-6 w-5 h-5 bg-indigo-400 rounded-full animate-ping animation-delay-700 shadow-lg" />
                
                {/* Additional mystical particles for spotlight effect */}
                <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-white rounded-full animate-ping animation-delay-800 shadow-lg" />
                <div className="absolute top-3/4 right-1/4 w-4 h-4 bg-gold-400 rounded-full animate-ping animation-delay-900 shadow-lg" />
                <div className="absolute top-1/2 left-8 w-2 h-2 bg-emerald-400 rounded-full animate-ping animation-delay-1000 shadow-lg" />
                <div className="absolute top-1/3 right-8 w-5 h-5 bg-violet-400 rounded-full animate-ping animation-delay-1100 shadow-lg" />
                
                {/* Enhanced white flash during glowing phase */}
                {evolutionPhase === 'glowing' && (
                  <>
                    <div className="absolute inset-0 bg-white/95 animate-pulse rounded-2xl" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-yellow-200 to-white opacity-80 animate-ping rounded-2xl" />
                  </>
                )}
              </div>

              <CardHeader className="relative z-20 flex flex-col items-center p-7 pb-2">
                <div className="relative mb-2">
                  {/* 3D flip animation container */}
                                     <div
                     className={`flip-container w-40 h-40`}
                     style={{ perspective: 800 }}
                   >
                    <div className={`flip-inner w-full h-full transition-transform duration-500 ${flipped ? 'rotate-y-180' : ''}`}
                      style={{ transformStyle: 'preserve-3d' }}>
                      {/* Front image */}
                      <div className="absolute top-0 left-0 w-full h-full backface-hidden" style={{ backfaceVisibility: 'hidden', zIndex: 2 }}>
                                                 {evolutionPhase === 'glowing' ? (
                           // Enhanced white glowing orb during evolution
                           <div className={`w-40 h-40 rounded-full border-4 border-white shadow-2xl bg-white animate-pulse ring-8 ring-white/50 ring-opacity-90 ${
                             showEvolutionAnimation ? 'animate-expand-shake' : ''
                           }`} />
                         ) : (
                           <SecureImage
                             src={displayImage}
                             alt={name}
                             className={`w-40 h-40 rounded-full border-4 border-white shadow-2xl object-cover bg-white/40 ${
                               showEvolutionAnimation ? 'animate-expand-shake' : ''
                             } ${showEvolutionAnimation && (evolutionPhase === 'start' || evolutionPhase === 'end') ? 'ring-8 ring-white ring-opacity-90' : ''}`}
                           />
                         )}
                      </div>
                    </div>
                  </div>
                </div>
                                 <CardTitle className={`mt-2 text-5xl font-extrabold text-white tracking-wide ${
                   displayPrestige === 'DIAMOND' ? 'drop-shadow-2xl' : ['BRONZE', 'SILVER', 'GOLD', 'EMERALD', 'RUBY', 'PURPLE_AMETHYST'].includes(displayPrestige) ? 'drop-shadow-2xl' : 'drop-shadow-lg'
                 }`} style={
                   displayPrestige === 'DIAMOND' 
                     ? { textShadow: '4px 4px 8px rgba(0,0,0,0.9), 0 0 16px rgba(6,182,212,0.8), 0 0 24px rgba(6,182,212,0.6), 0 0 36px rgba(6,182,212,0.4), 0 0 48px rgba(6,182,212,0.2)' }
                     : ['BRONZE', 'SILVER', 'GOLD', 'EMERALD', 'RUBY', 'PURPLE_AMETHYST'].includes(displayPrestige) 
                       ? { textShadow: '3px 3px 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.4)' } 
                       : {}
                 }>
                   {name}
                 </CardTitle>
                 {/* Enhanced prestige label */}
                 <div className={`mt-1 text-xl font-bold uppercase tracking-wider text-white ${
                   displayPrestige === 'DIAMOND' ? 'drop-shadow-2xl' : ['BRONZE', 'SILVER', 'GOLD', 'EMERALD', 'RUBY', 'PURPLE_AMETHYST'].includes(displayPrestige) ? 'drop-shadow-2xl' : 'drop-shadow-lg'
                 }`} style={
                   displayPrestige === 'DIAMOND'
                     ? { textShadow: '3px 3px 6px rgba(0,0,0,0.9), 0 0 12px rgba(6,182,212,0.8), 0 0 20px rgba(6,182,212,0.6), 0 0 28px rgba(6,182,212,0.4)' }
                     : ['BRONZE', 'SILVER', 'GOLD', 'EMERALD', 'RUBY', 'PURPLE_AMETHYST'].includes(displayPrestige) 
                       ? { textShadow: '2px 2px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.4)' } 
                       : {}
                 }>
                   {displayPrestigeLabel}
                 </div>
              </CardHeader>
              <CardContent className="relative z-20 flex flex-col items-center pt-2 pb-7">
                                 {/* Enhanced level display */}
                 <div className="flex items-center gap-3 mb-3">
                   <span className="text-2xl font-bold text-white/80 drop-shadow">Lvl</span>
                   <span className={`text-7xl font-black text-white drop-shadow-lg tracking-tight ${
                     showEvolutionAnimation ? 'animate-pulse text-cyan-300' : ''
                   }`} 
                   style={{ WebkitTextStroke: '1px #fff8', letterSpacing: 2 }}>
                     {showEvolutionAnimation && evolutionPhase === 'start' ? safePreviousLevel : safeLevel}
                   </span>
                 </div>
                                 {/* Enhanced Total XP Display */}
                 <div className="mb-3 text-center">
                   <div className="text-base text-white/70 font-medium tracking-wide mb-1">
                     TOTAL XP
                   </div>
                   <div className={`text-3xl font-bold text-white drop-shadow-lg ${
                     showEvolutionAnimation ? 'animate-pulse' : ''
                   }`}>
                     {showEvolutionAnimation && evolutionPhase === 'start' ? safePreviousXp.toLocaleString() : safeXp.toLocaleString()}
                   </div>
                 </div>

                                 {/* Enhanced XP Progress Bar */}
                 <div className="w-64 h-6 bg-white/30 rounded-full overflow-hidden shadow-inner border border-white/40 mb-3">
                   <div
                     className={`h-full rounded-full bg-gradient-to-r transition-all ${
                       showEvolutionAnimation ? 'from-purple-300 via-blue-300 to-green-300 animate-pulse' : 'from-yellow-200 via-yellow-400 to-yellow-600'
                     }`}
                     style={{ width: `${xpPercent}%` }}
                   />
                 </div>
                 
                 {/* Enhanced XP Progress Text */}
                 <div className="text-base text-white/90 font-semibold tracking-wide text-center drop-shadow">
                   {xpThisLevel} / {xpForLevel} XP to next level
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default PetCard; 