import type { Game } from '@/store/useGameStore';

export const XP_PER_LEVEL = 1000;
export const XP_RULES = { completed: 500, playing: 200, favorite: 150, owned: 50 } as const;

export interface Progression {
  xp: number;
  level: number;
  /** XP earned inside the current level (0..999). */
  xpIntoLevel: number;
  /** Total XP needed to reach the next level. */
  nextLevelXp: number;
  percent: number;
  completed: number;
  playing: number;
  favorites: number;
  totalHours: number;
  totalGames: number;
}

export function getProgression(games: Game[]): Progression {
  const completed = games.filter((g) => g.status === 'COMPLETED').length;
  const playing = games.filter((g) => g.status === 'PLAYING').length;
  const favorites = games.filter((g) => g.isFavorite).length;
  const totalHours = Math.round(games.reduce((acc, g) => acc + (g.hoursPlayed || 0), 0) * 10) / 10;
  const xp =
    completed * XP_RULES.completed +
    playing * XP_RULES.playing +
    favorites * XP_RULES.favorite +
    games.length * XP_RULES.owned;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = xp % XP_PER_LEVEL;
  return {
    xp,
    level,
    xpIntoLevel,
    nextLevelXp: level * XP_PER_LEVEL,
    percent: Math.round((xpIntoLevel / XP_PER_LEVEL) * 100),
    completed,
    playing,
    favorites,
    totalHours,
    totalGames: games.length,
  };
}
