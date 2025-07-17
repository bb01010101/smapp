'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { trackChallengeProgress } from '@/lib/xpSystem';

export default function DailyLoginTracker() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const trackDailyLogin = async () => {
      try {
        // Check if we've already tracked login today
        const today = new Date().toDateString();
        const lastLoginKey = `daily_login_${user.id}_${today}`;
        const hasLoggedInToday = localStorage.getItem(lastLoginKey);

        if (!hasLoggedInToday) {
          // Track the daily login challenge
          const result = await trackChallengeProgress('daily_login', 1, user.id);
          
          if (result.success) {
            // Mark as logged in today
            localStorage.setItem(lastLoginKey, 'true');
            
            // Dispatch XP update event if XP was gained
            if (result.xpGained) {
              window.dispatchEvent(new CustomEvent('xp-updated'));
            }
          }
        }
      } catch (error) {
        console.error('Failed to track daily login:', error);
      }
    };

    // Track login after a short delay to ensure user is fully loaded
    const timer = setTimeout(trackDailyLogin, 100);
    return () => clearTimeout(timer);
  }, [user, isLoaded]);

  // This component doesnt render anything
  return null;
} 