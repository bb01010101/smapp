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
  resetDate?: Date;
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
];

// XP Level System
export function getLevelFromXp(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function getXpForNextLevel(level: number): number {
  return level * 100;
}

export function getXpProgressInLevel(xp: number): { current: number; required: number; percentage: number } {
  const level = getLevelFromXp(xp);
  const xpForLevel = getXpForNextLevel(level - 1);
  const xpInLevel = xp - xpForLevel;
  const xpRequired = getXpForNextLevel(level) - xpForLevel;
  
  return {
    current: xpInLevel,
    required: xpRequired,
    percentage: Math.min(100, (xpInLevel / xpRequired) * 100)
  };
}

// Challenge tracking
export function trackChallengeProgress(
  challengeId: string,
  increment: number = 1,
  userId: string
): Promise<{ success: boolean; xpGained?: number }> {
  return fetch('/api/xp/track', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      challengeId,
      increment,
      userId,
    }),
  }).then(res => res.json());
}

// Get user's current XP and level
export async function getUserXp(userId: string): Promise<UserProgress | null> {
  try {
    const response = await fetch(`/api/xp/user/${userId}`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Failed to fetch user XP:', error);
    return null;
  }
} 