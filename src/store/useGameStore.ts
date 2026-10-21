import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ALL_GAMES } from '@/data/mockGames';
import { syncGamesToCloud } from '@/services/firestoreService';
import { useAuthStore } from './useAuthStore';

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
  setGames: (games: Game[]) => void;
  resetToDefault: () => void;
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

// Helper to trigger background sync without breaking UI thread
const syncToCloud = (games: Game[]) => {
  const uid = useAuthStore.getState().user?.uid;
  if (uid) {
    syncGamesToCloud(uid, games);
  }
};

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set) => ({
      games: initialGames,
      isLoading: false,
      hasHydrated: false,

      addGame: (game) => set((state) => {
        const newGames = [...state.games, game];
        syncToCloud(newGames);
        return { games: newGames };
      }),

      updateGameStatus: (id, status) => set((state) => {
        const newGames = state.games.map((g) => g.id === id ? { ...g, status } : g);
        syncToCloud(newGames);
        return { games: newGames };
      }),

      toggleFavorite: (id) => set((state) => {
        const newGames = state.games.map((g) => g.id === id ? { ...g, isFavorite: !g.isFavorite } : g);
        syncToCloud(newGames);
        return { games: newGames };
      }),

      setHydrated: () => set({ hasHydrated: true }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setGames: (games) => set({ games }),
      resetToDefault: () => set({ games: initialGames }),
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
