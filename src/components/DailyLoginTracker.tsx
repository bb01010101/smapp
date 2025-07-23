'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { trackChallenge } from '@/lib/xpSystem';

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
          const result = await trackChallenge('daily_login', 1);
          
          if (result.success) {
            // Mark as logged in today
            localStorage.setItem(lastLoginKey, 'true');
            
            // Trigger UI update if XP was gained
            if (result.xpGained && typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('xp-updated', {
                detail: { 
                  challengeId: 'daily_login',
                  xpGained: result.xpGained
                }
              }));
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

  // This component doesn't render anything
  return null;
} 