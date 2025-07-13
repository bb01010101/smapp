// Pet leveling and prestige configuration and utilities

export type PrestigeKey =
  | 'BRONZE'
  | 'SILVER'
  | 'GOLD'
  | 'LAPIS_LAZULI'
  | 'EMERALD'
  | 'PURPLE_AMETHYST'
  | 'RUBY'
  | 'DIAMOND';

export interface PrestigeConfig {
  key: PrestigeKey;
  label: string;
  minLevel: number;
  maxLevel: number;
}

export const prestigeLevels: PrestigeConfig[] = [
  { key: 'BRONZE', label: 'Bronze', minLevel: 0,  maxLevel: 9 },
  { key: 'SILVER', label: 'Silver', minLevel: 10, maxLevel: 19 },
  { key: 'GOLD', label: 'Gold', minLevel: 20, maxLevel: 29 },
  { key: 'LAPIS_LAZULI', label: 'Lapis Lazuli', minLevel: 30, maxLevel: 39 },
  { key: 'EMERALD', label: 'Emerald', minLevel: 40, maxLevel: 49 },
  { key: 'PURPLE_AMETHYST', label: 'Purple Amethyst', minLevel: 50, maxLevel: 59 },
  { key: 'RUBY', label: 'Ruby', minLevel: 60, maxLevel: 69 },
  { key: 'DIAMOND', label: 'Diamond', minLevel: 70, maxLevel: 79 },
];

export function getPrestigeByLevel(level: number): PrestigeConfig {
  return (
    prestigeLevels.find(
      (p) => level >= p.minLevel && level <= p.maxLevel
    ) || prestigeLevels[0]
  );
}

// Example XP curve: 100 XP per level (can be made more complex later)
export function getXpForLevel(level: number): number {
  return level * 100;
}

export function getLevelFromXp(xp: number): number {
  return Math.floor(xp / 100);
} 