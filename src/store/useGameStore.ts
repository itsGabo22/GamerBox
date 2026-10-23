import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { syncGamesToCloud } from '@/services/firestoreService';
import { useAuthStore } from './useAuthStore';

export interface Game {
  id: string;
  title: string;
  coverUrl: string;
  genre: string;
  platform: string;
  status: string; // 'PENDING', 'PLAYING', 'COMPLETED', 'WISHLIST'
  isFavorite: boolean;
  timePlayed: string;
  hoursPlayed?: number;
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
  selectedGame: Game | null;
}

export interface GameActions {
  addGame: (game: Game) => void;
  updateGameStatus: (id: string, status: string) => void;
  toggleFavorite: (id: string) => void;
  logPlaySession: (id: string, hours: number) => void;
  clearLibrary: () => void;
  setSelectedGame: (game: Game | null) => void;
  setHydrated: () => void;
  setIsLoading: (loading: boolean) => void;
  setGames: (games: Game[]) => void;
  resetToDefault: () => void;
}

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
      games: [],
      isLoading: false,
      hasHydrated: false,
      selectedGame: null,

      addGame: (game) => set((state) => {
        // Prevent duplicate IDs
        if (state.games.some(g => g.id === game.id)) return state;
        const newGames = [...state.games, { ...game, hoursPlayed: game.hoursPlayed || 0 }];
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

      logPlaySession: (id, hours) => set((state) => {
        const newGames = state.games.map(g =>
          g.id === id ? { ...g, hoursPlayed: (g.hoursPlayed || 0) + hours, timePlayed: `${(g.hoursPlayed || 0) + hours} hrs` } : g
        );
        syncToCloud(newGames);
        return { games: newGames };
      }),

      clearLibrary: () => set(() => {
        syncToCloud([]);
        return { games: [] };
      }),

      setSelectedGame: (game) => set({ selectedGame: game }),
      setHydrated: () => set({ hasHydrated: true }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setGames: (games) => set({ games: games.map(g => ({ ...g, hoursPlayed: g.hoursPlayed || parseInt(g.timePlayed) || 0 })) }),
      resetToDefault: () => set({ games: [] }),
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
