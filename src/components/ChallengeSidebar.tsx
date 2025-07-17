'use client';

import { useEffect, useState, useRef } from 'react';
import { ChevronDownIcon, ChevronRightIcon, TrophyIcon, StarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Challenge, UserProgress, DAILY_CHALLENGES, SEASONAL_CHALLENGES } from '@/lib/xpSystem';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';

interface ChallengeSidebarProps {
  className?: string;
}

export default function ChallengeSidebar({ className = '' }: ChallengeSidebarProps) {
  const { user } = useUser();
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const [expandedSections, setExpandedSections] = useState({
    daily: true,
    seasonal: true,
  });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (!user) return;
    fetchUserProgress(true); // Initial load
  }, [user]);

  // Listen for XP update events
  useEffect(() => {
    const handleXpUpdate = () => {
      fetchUserProgress(false); // Silent refresh
    };
    window.addEventListener('xp-updated', handleXpUpdate);
    return () => window.removeEventListener('xp-updated', handleXpUpdate);
  }, []);

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
        // Don't reset to loading state on error, keep current data
      }
    } catch (error) {
      console.error('Failed to fetch user progress:', error);
      // Don't reset to loading state on error, keep current data
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

  const renderChallenge = (challenge: Omit<Challenge, 'progress' | 'completed'>, type: 'daily' | 'seasonal') => {
    const userChallenge = getChallengeProgress(challenge.id);
    const progress = userChallenge?.progress || 0;
    const completed = userChallenge?.completed || false;
    const percentage = Math.min(100, (progress / challenge.goal) * 100);
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
    <Card className={`${className} bg-white/90 backdrop-blur-sm border-gray-200`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <TrophyIcon className="w-5 h-5 text-yellow-500" />
          XP Challenges
        </CardTitle>
        {/* Total XP and Level */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Total XP</span>
            <span className="text-lg font-bold text-gray-900">{userProgress?.totalXp || 0}</span>
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
  );
} 