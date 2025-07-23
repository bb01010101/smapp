import { useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { XpToast } from '@/components/XpToast';

// Universal optimistic XP hook
export function useOptimisticXp() {
  // Store rollback state in a ref
  const rollbackRef = useRef<any>(null);

  // Optimistically update challenge progress and XP
  const incrementXp = useCallback(async (challengeId: string, increment: number = 1, meta?: any) => {
    // 1. Optimistically update UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('challenge-progress', {
        detail: { challengeId, increment, optimistic: true }
      }));
    }

    // 2. Call backend in background
    let result;
    try {
      result = await fetch('/api/xp/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, increment, ...(meta ? meta : {}) }),
      }).then(res => res.json());

      if (result.success) {
        // Confirm UI with actual backend result
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('challenge-progress', {
            detail: {
              challengeId,
              increment: result.progress, // absolute progress
              completed: result.completed,
              totalXp: result.userTotalXp,
              optimistic: false
            }
          }));
        }
        // Show toast if challenge completed
        if (result.showToast && result.message) {
          toast.custom(
            <XpToast 
              xpGained={result.xpGained} 
              challengeName={result.challenge?.name}
              totalXpGained={result.userTotalXp}
            />, 
            { duration: 4000 }
          );
        }
        return result;
      } else {
        throw new Error(result.error || 'XP API error');
      }
    } catch (error) {
      // 3. Rollback optimistic update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('challenge-progress-rollback', {
          detail: { challengeId, increment }
        }));
      }
      toast.error('Failed to update XP. Please try again.');
      return null;
    }
  }, []);

  return { incrementXp };
} 