'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrophyIcon, StarIcon, ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { DAILY_CHALLENGES, SEASONAL_CHALLENGES, Challenge, UserProgress } from '@/lib/xpSystem';
import toast from 'react-hot-toast';
import { Dialog, DialogTrigger, DialogContent } from './ui/dialog';
import { Input } from './ui/input';
import { useOptimisticXp } from '@/lib/useOptimisticXp';

function SharePetNetModal({ open, onOpenChange }: { open: boolean, onOpenChange: (v: boolean) => void }) {
  const [copied, setCopied] = useState(false);
  const { incrementXp } = useOptimisticXp();
  const signupLink = typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=petnet` : '/signup?ref=petnet';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(signupLink);
    setCopied(true);
    incrementXp('daily_expand_petnet', 1);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Join me on PetNet!',
        text: 'Check out PetNet and join with my invite link:',
        url: signupLink,
      });
      incrementXp('daily_expand_petnet', 1);
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <h3 className="text-lg font-bold mb-2">Share PetNet with a Friend</h3>
        <p className="mb-2 text-sm text-gray-600">Share this link with your friends to invite them to PetNet:</p>
        <div className="mb-2 flex items-center gap-2">
          <Input value={signupLink} readOnly className="flex-1" />
          <Button onClick={handleCopy} variant="outline" size="sm">{copied ? 'Copied!' : 'Copy Link'}</Button>
        </div>
        <Button onClick={handleShare} className="w-full mt-2">Share</Button>
      </DialogContent>
    </Dialog>
  );
}

interface ChallengeSidebarProps {
  className?: string;
}

export default function ChallengeSidebar({ className = '' }: ChallengeSidebarProps) {
  const { user } = useUser();
  if (!user) return null;
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const [expandedSections, setExpandedSections] = useState({
    daily: true,
    seasonal: true,
  });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [xpAnimation, setXpAnimation] = useState<{ show: boolean; amount: number }>({ show: false, amount: 0 });
  const { incrementXp } = useOptimisticXp();
  const [shareModalOpen, setShareModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchUserProgress(true); // Initial load
  }, [user]);

  // Listen for XP update events
  useEffect(() => {
    const handleXpUpdate = (event: any) => {
      fetchUserProgress(false); // Silent refresh
      
      // Show XP animation if XP was gained
      if (event.detail?.xpGained) {
        setXpAnimation({ show: true, amount: event.detail.xpGained });
        setTimeout(() => setXpAnimation({ show: false, amount: 0 }), 2000);
      }

      // Update total XP optimistically if provided
      if (event.detail?.userTotalXp && userProgress) {
        setUserProgress(prev => prev ? {
          ...prev,
          totalXp: event.detail.userTotalXp,
          level: Math.floor(event.detail.userTotalXp / 100) + 1
        } : null);
      }
    };

    // Universal challenge-progress handler
    const handleChallengeProgress = (event: any) => {
      const { challengeId, increment, optimistic, completed, totalXp } = event.detail || {};
      if (!challengeId) return;
      if (optimistic) {
        // Optimistic increment
        updateChallengeOptimistically(challengeId, increment);
      } else {
        // Backend-confirmed absolute update
        updateChallengeAbsolute(challengeId, increment, completed, totalXp);
      }
    };

    // Rollback handler
    const handleChallengeRollback = (event: any) => {
      const { challengeId, increment } = event.detail || {};
      if (!challengeId) return;
      // Rollback optimistic increment
      updateChallengeOptimistically(challengeId, -increment);
    };

    window.addEventListener('xp-updated', handleXpUpdate);
    window.addEventListener('challenge-progress', handleChallengeProgress);
    window.addEventListener('challenge-progress-rollback', handleChallengeRollback);
    
    return () => {
      window.removeEventListener('xp-updated', handleXpUpdate);
      window.removeEventListener('challenge-progress', handleChallengeProgress);
      window.removeEventListener('challenge-progress-rollback', handleChallengeRollback);
    };
  }, [userProgress]);

  const fetchUserProgress = async (showLoading = false) => {
    if (!user) return;
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await fetch(`/api/xp/user/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setUserProgress(data);
        setLastUpdate(new Date());
        hasLoadedRef.current = true;
      } else {
        console.error('Failed to fetch XP progress:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch user progress:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const toggleSection = (section: 'daily' | 'seasonal') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getChallengeProgress = (challengeId: string): Challenge | null => {
    if (!userProgress) return null;
    return userProgress.challenges.find(c => c.id === challengeId) || null;
  };

  // Optimistic challenge update
  const updateChallengeOptimistically = (challengeId: string, increment: number) => {
    if (!userProgress) return;

    let xpToAdd = 0;
    const updatedChallenges = userProgress.challenges.map(challenge => {
      if (challenge.id === challengeId) {
        const newProgress = Math.min(challenge.progress + increment, challenge.goal);
        const wasCompleted = challenge.completed;
        const isNowCompleted = newProgress >= challenge.goal;
        // If challenge was just completed, update total XP optimistically
        if (isNowCompleted && !wasCompleted) {
          const challengeDef = [...DAILY_CHALLENGES, ...SEASONAL_CHALLENGES].find(c => c.id === challengeId);
          if (challengeDef) {
            xpToAdd = challengeDef.xp;
          }
        }
        return {
          ...challenge,
          progress: newProgress,
          completed: isNowCompleted,
        };
      }
      return challenge;
    });

    setUserProgress(prev => prev ? {
      ...prev,
      challenges: updatedChallenges,
      totalXp: prev.totalXp + xpToAdd,
      level: Math.floor((prev.totalXp + xpToAdd) / 100) + 1,
    } : null);
  };

  // Absolute challenge update (from backend)
  const updateChallengeAbsolute = (challengeId: string, progress: number, completed?: boolean, totalXp?: number) => {
    if (!userProgress) return;
    const updatedChallenges = userProgress.challenges.map(challenge => {
      if (challenge.id === challengeId) {
        return {
          ...challenge,
          progress,
          completed: completed !== undefined ? completed : challenge.completed,
        };
      }
      return challenge;
    });
    setUserProgress(prev => prev ? {
      ...prev,
      challenges: updatedChallenges,
      totalXp: totalXp !== undefined ? totalXp : prev.totalXp,
      level: totalXp !== undefined ? Math.floor(totalXp / 100) + 1 : prev.level,
    } : null);
  };

  const renderChallenge = (challenge: Omit<Challenge, 'progress' | 'completed'>, type: 'daily' | 'seasonal') => {
    const userChallenge = getChallengeProgress(challenge.id);
    const progress = userChallenge?.progress || 0;
    const completed = userChallenge?.completed || false;
    const percentage = Math.min(100, (progress / challenge.goal) * 100);
    const isExpandPetNet = challenge.id === 'daily_expand_petnet';
    return (
      <div key={challenge.id} className="mb-3 p-3 rounded-lg bg-white/50 border border-gray-100">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-medium text-sm text-gray-900">{challenge.name}</h4>
            <p className="text-xs text-gray-600">{challenge.description}</p>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <StarIcon className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-semibold text-gray-700">{challenge.xp} XP</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Progress value={percentage} className="flex-1 h-2" />
          <span className="text-xs font-medium text-gray-600">
            {completed ? '✓' : `${progress}/${challenge.goal}`}
          </span>
        </div>
        {completed && (
          <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <TrophyIcon className="w-3 h-3" />
            Completed!
          </div>
        )}
        {isExpandPetNet && !completed && (
          <Button size="sm" variant="outline" className="mt-2" onClick={() => setShareModalOpen(true)}>
            Share
          </Button>
        )}
      </div>
    );
  };

  // Only show loading on initial load
  if (loading && !hasLoadedRef.current) {
    return (
      <Card className={`${className} bg-white/90 backdrop-blur-sm`}>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const levelProgress = userProgress ? (userProgress.totalXp % 100) : 0;
  const currentLevel = userProgress?.level || 1;

  return (
    <>
      <Card className={`${className} bg-white/90 backdrop-blur-sm border-gray-200`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-yellow-500" />
            XP Challenges
          </CardTitle>
          {/* Total XP and Level */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Total XP</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">{userProgress?.totalXp || 0}</span>
                {xpAnimation.show && (
                  <div className="text-sm font-bold text-green-600 animate-bounce">
                    +{xpAnimation.amount}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Level</span>
              <span className="text-lg font-bold text-gray-900">{currentLevel}</span>
            </div>
            <div className="mt-2">
              <Progress value={levelProgress} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">
                {levelProgress} / 100 XP to next level
              </div>
              <div className="text-xs text-gray-400 mt-2 text-center">
                Updated: {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Daily Challenges */}
          <div className="mb-4">
            <Button
              variant="ghost"
              className="w-full justify-between p-2 h-auto"
              onClick={() => toggleSection('daily')}
            >
              <span className="font-medium text-gray-800">Daily Challenges</span>
              {expandedSections.daily ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </Button>
            {expandedSections.daily && (
              <div className="mt-2 space-y-2">
                {DAILY_CHALLENGES.map(challenge => renderChallenge(challenge, 'daily'))}
              </div>
            )}
          </div>
          {/* Seasonal Challenges */}
          <div>
            <Button
              variant="ghost"
              className="w-full justify-between p-2 h-auto"
              onClick={() => toggleSection('seasonal')}
            >
              <span className="font-medium text-gray-800">Seasonal Challenges</span>
              {expandedSections.seasonal ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </Button>
            {expandedSections.seasonal && (
              <div className="mt-2 space-y-2">
                {SEASONAL_CHALLENGES.map(challenge => renderChallenge(challenge, 'seasonal'))}
              </div>
            )}
          </div>
          {/* Refresh and View All Challenges */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                fetchUserProgress(false);
                toast.success('Progress refreshed!');
              }}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                toast.success('Full challenges page coming soon!');
              }}
            >
              View All
            </Button>
          </div>
        </CardContent>
      </Card>
      <SharePetNetModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
      />
    </>
  );
} 