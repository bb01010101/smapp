import { useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { trackChallenge } from './xpSystem';
import { XpToast } from '@/components/XpToast';
import toast from 'react-hot-toast';

export function useXpTracking() {
  const { user } = useUser();

  const trackProgress = useCallback(async (
    challengeId: string,
    increment: number = 1
  ) => {
    if (!user) return;

    try {
      const result = await trackChallenge(challengeId, increment);
      
      if (result.success && result.xpGained) {
        // Show custom XP toast
        toast.custom(
          <XpToast xpGained={result.xpGained} />, { duration: 3000 }
        );
      }

      // Dispatch event to trigger immediate UI update
      if (result.success && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('xp-updated', {
          detail: { challengeId, xpGained: result.xpGained }
        }));
      }
      
      return result;
    } catch (error) {
      console.error('Failed to track XP progress:', error);
      return null;
    }
  }, [user]);

  return { trackProgress };
}

// Convenience functions for common actions
export function useXpActions() {
  const { trackProgress } = useXpTracking();

  const trackLogin = useCallback(() => {
    return trackProgress('daily_login');
  }, [trackProgress]);

  const trackLike = useCallback(() => {
    return trackProgress('daily_like_3_posts');
  }, [trackProgress]);

  const trackPost = useCallback(() => {
    return trackProgress('daily_post_photo');
  }, [trackProgress]);

  const trackFollow = useCallback(() => {
    return trackProgress('weekly_gain_10_followers');
  }, [trackProgress]);

  const trackComment = useCallback(() => {
    return trackProgress('weekly_comment_20_posts');
  }, [trackProgress]);

  return {
    trackLogin,
    trackLike,
    trackPost,
    trackFollow,
    trackComment,
  };
} 