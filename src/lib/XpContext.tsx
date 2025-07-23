'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { UserProgress } from './xpSystem';

interface XpContextType {
  userProgress: UserProgress | null;
  updateUserProgress: (progress: UserProgress) => void;
  refreshProgress: () => void;
  triggerXpUpdate: (challengeId: string, xpGained?: number) => void;
}

const XpContext = createContext<XpContextType | undefined>(undefined);

export function XpProvider({ children }: { children: React.ReactNode }) {
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);

  const updateUserProgress = useCallback((progress: UserProgress) => {
    setUserProgress(progress);
  }, []);

  const refreshProgress = useCallback(async () => {
    try {
      const response = await fetch('/api/xp/user/current');
      if (response.ok) {
        const data = await response.json();
        setUserProgress(data);
      }
    } catch (error) {
      console.error('Failed to refresh XP progress:', error);
    }
  }, []);

  const triggerXpUpdate = useCallback((challengeId: string, xpGained?: number) => {
    // Immediately update the UI with optimistic updates
    if (userProgress) {
      const updatedChallenges = userProgress.challenges.map(challenge => {
        if (challenge.id === challengeId) {
          const newProgress = challenge.progress + 1;
          return {
            ...challenge,
            progress: newProgress,
            completed: newProgress >= challenge.goal,
          };
        }
        return challenge;
      });

      const newTotalXp = userProgress.totalXp + (xpGained || 0);
      const newLevel = Math.floor(newTotalXp / 100 + 1);
      
      setUserProgress({
        ...userProgress,
        totalXp: newTotalXp,
        level: newLevel,
        challenges: updatedChallenges,
      });
    }
  }, [userProgress]);

  return (
    <XpContext.Provider value={{
      userProgress,
      updateUserProgress,
      refreshProgress,
      triggerXpUpdate,
    }}>
      {children}
    </XpContext.Provider>
  );
}

export function useXpContext() {
  const context = useContext(XpContext);
  if (context === undefined) {
    throw new Error('useXpContext must be used within an XpProvider');
  }
  return context;
} 