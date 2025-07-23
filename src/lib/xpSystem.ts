// Simplified XP System
export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'seasonal';
  xp: number;
  goal: number;
  progress: number;
  completed: boolean;
}

export interface UserProgress {
  totalXp: number;
  level: number;
  challenges: Challenge[];
}

// Challenge definitions
export const DAILY_CHALLENGES: Omit<Challenge, 'progress' | 'completed'>[] = [
  {
    id: 'daily_login',
    name: 'Daily Login',
    description: 'Log in today',
    type: 'daily',
    xp: 10,
    goal: 1,
  },
  {
    id: 'daily_like_3_posts',
    name: 'Like 3 Posts',
    description: 'Like 3 posts today',
    type: 'daily',
    xp: 15,
    goal: 3,
  },
  {
    id: 'daily_post_photo',
    name: 'Post a Photo',
    description: 'Post a timeline photo',
    type: 'daily',
    xp: 25,
    goal: 1,
  },
  {
    id: 'daily_expand_petnet',
    name: 'Expand your PetNet',
    description: 'Share with a friend',
    type: 'daily',
    xp: 20,
    goal: 1,
  },
];

export const SEASONAL_CHALLENGES: Omit<Challenge, 'progress' | 'completed'>[] = [
  {
    id: 'seasonal_gain_100_followers',
    name: 'Gain 100 Followers',
    description: 'Gain 100 followers',
    type: 'seasonal',
    xp: 500,
    goal: 100,
  },
  {
    id: 'seasonal_post_20_photos',
    name: 'Post 20 Photos',
    description: 'Post 20 timeline photos',
    type: 'seasonal',
    xp: 300,
    goal: 20,
  },
  {
    id: 'seasonal_comment_50_posts',
    name: 'Comment on 50 Posts',
    description: 'Comment on 50 posts',
    type: 'seasonal',
    xp: 200,
    goal: 50,
  },
  {
    id: 'seasonal_post_5_barks',
    name: 'Post 5 Barks',
    description: 'Post 5 Bark forum posts',
    type: 'seasonal',
    xp: 100,
    goal: 5,
  },
];

// Utility functions
export function getLevelFromXp(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

// Check if daily challenges should be reset (6:00 AM EST)
export function shouldResetDailyChallenges(lastUpdated: Date | null): boolean {
  if (!lastUpdated) return true;
  
  const now = new Date();
  const lastUpdate = new Date(lastUpdated);
  
  // Convert to EST (UTC-5)
  const nowEST = new Date(now.getTime() - (5 * 60 * 60 * 1000));
  const lastUpdateEST = new Date(lastUpdate.getTime() - (5 * 60 * 60 * 1000));
  
  // Check if it's a new day and past 6:00 AM EST
  const today6AM = new Date(nowEST);
  today6AM.setHours(6, 0, 0, 0);
  
  return nowEST > today6AM && lastUpdateEST < today6AM;
}

// Simple challenge tracking function
export async function trackChallenge(challengeId: string, increment: number = 1): Promise<any> {
  try {
    const response = await fetch('/api/xp/track', {
    method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, increment }),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to track challenge:', error);
    return null;
  }
} 