import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ALL_GAMES } from '@/data/mockGames';

export interface Game {
  id: string;
  title: string;
  coverUrl: string;
  genre: string;
  platform: string;
  status: string; // 'PENDING', 'PLAYING', 'COMPLETED'
  isFavorite: boolean;
  timePlayed: string;
  trophies?: { earned: number; total: number };
  rating: number; // preserving some fields from mock for UI
  progress?: number;
  synopsis?: string;
  developer?: string;
  year?: number;
  mission?: { title: string; progress: number };
  community?: { user: string; rating: number; review: string };
  matchPercentage?: number;
  releaseDate?: string;
}

export interface GameState {
  games: Game[];
  isLoading: boolean;
  hasHydrated: boolean;
}

export interface GameActions {
  addGame: (game: Game) => void;
  updateGameStatus: (id: string, status: string) => void;
  toggleFavorite: (id: string) => void;
  setHydrated: () => void;
  setIsLoading: (loading: boolean) => void;
}

// Map mock games to our new strict schema
const initialGames: Game[] = ALL_GAMES.map((g) => ({
  id: g.id,
  title: g.title,
  coverUrl: g.image || '', // map image -> coverUrl
  genre: g.genre || 'UNKNOWN',
  platform: g.platform || 'UNKNOWN',
  status: g.status,
  isFavorite: false, // Defaulting to false, will be overridden by Profile favorites if we wanted, but we'll start with 0 favorites or some predefined.
  timePlayed: g.playTime || '0 hrs',
  trophies: g.trophies,
  rating: g.rating,
  progress: g.progress,
  synopsis: g.synopsis,
  developer: g.developer,
  year: g.year,
  mission: g.mission,
  community: g.community,
  matchPercentage: g.matchPercentage,
  releaseDate: g.releaseDate,
}));

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set) => ({
      games: initialGames,
      isLoading: false,
      hasHydrated: false,

      addGame: (game) => set((state) => ({ games: [...state.games, game] })),

      updateGameStatus: (id, status) => set((state) => ({
        games: state.games.map((g) => g.id === id ? { ...g, status } : g)
      })),

      toggleFavorite: (id) => set((state) => ({
        games: state.games.map((g) => g.id === id ? { ...g, isFavorite: !g.isFavorite } : g)
      })),

      setHydrated: () => set({ hasHydrated: true }),
      setIsLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'gamerbox-storage',
      storage: createJSONStorage(() => typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated();
        }
      },
    }
  )
);
