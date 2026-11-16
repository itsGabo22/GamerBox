import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { publishPublicProfile, syncGamesToCloud } from '@/services/firestoreService';
import { perUserStorage } from '@/lib/accountVault';
import { getProgression } from '@/lib/progression';
import { translate } from '@/i18n/useTranslation';
import { useAuthStore } from './useAuthStore';
import { notify } from './useNotificationStore';

export type GameStatus = 'PENDING' | 'PLAYING' | 'COMPLETED';

export interface Game {
  id: string;
  title: string;
  coverUrl: string;
  genre: string;
  platform: string;
  status: string; // GameStatus for library games; display-only tags elsewhere
  isFavorite: boolean;
  timePlayed: string;
  hoursPlayed?: number;
  rating: number;
  progress?: number;
}

export interface GameState {
  games: Game[];
  hasHydrated: boolean;
  selectedGame: Game | null;
}

export interface GameActions {
  /** Returns false when the game (same id or same title) is already in the vault. */
  addGame: (game: Game) => boolean;
  removeGame: (id: string) => void;
  updateGameStatus: (id: string, status: GameStatus) => void;
  updateGameProgress: (id: string, progress: number) => void;
  toggleFavorite: (id: string) => void;
  logPlaySession: (id: string, hours: number) => void;
  setSelectedGame: (game: Game | null) => void;
  setGames: (games: Game[]) => void;
}

const sameTitle = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
const round1 = (n: number) => Math.round(n * 10) / 10;

const normalize = (g: Game): Game => {
  const hours = round1(Math.max(0, g.hoursPlayed ?? (parseFloat(g.timePlayed) || 0)));
  return {
    id: g.id,
    title: g.title,
    coverUrl: g.coverUrl || '',
    genre: g.genre || 'UNKNOWN',
    platform: g.platform || 'PC',
    status: ['PENDING', 'PLAYING', 'COMPLETED'].includes(g.status) ? g.status : 'PENDING',
    isFavorite: Boolean(g.isFavorite),
    hoursPlayed: hours,
    timePlayed: `${hours} h`,
    rating: g.rating || 0,
    progress: g.status === 'COMPLETED' ? 100 : Math.min(100, Math.max(0, g.progress || 0)),
  };
};

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => {
      /** Single write path: updates state, mirrors to the cloud and reports level-ups. */
      const commit = (games: Game[]) => {
        const before = getProgression(get().games);
        const after = getProgression(games);
        set({ games });

        const user = useAuthStore.getState().user;
        if (user?.uid) {
          syncGamesToCloud(user.uid, games);
          if (user.displayName) {
            publishPublicProfile(user.uid, {
              gamertag: user.displayName,
              title: user.title || translate('profile.defaultTitle'),
              level: after.level,
              platinums: after.completed,
              totalHours: after.totalHours,
            });
          }
        }
        if (after.level > before.level) {
          notify({ type: 'LEVEL', titleKey: 'notifications.levelUpTitle', bodyKey: 'notifications.levelUpBody', params: { level: after.level } });
        }
      };

      const patch = (id: string, change: (g: Game) => Game) =>
        commit(get().games.map((g) => (g.id === id ? normalize(change(g)) : g)));

      return {
        games: [],
        hasHydrated: false,
        selectedGame: null,

        addGame: (game) => {
          const { games } = get();
          if (games.some((g) => g.id === game.id || sameTitle(g.title, game.title))) return false;
          const clean = normalize(game);
          commit([clean, ...games]);
          notify({ type: 'GAME', titleKey: 'notifications.gameAddedTitle', bodyKey: 'notifications.gameAddedBody', params: { title: clean.title } });
          return true;
        },

        removeGame: (id) => commit(get().games.filter((g) => g.id !== id)),

        updateGameStatus: (id, status) => {
          const game = get().games.find((g) => g.id === id);
          if (!game || game.status === status) return;
          patch(id, (g) => ({ ...g, status, progress: status === 'COMPLETED' ? 100 : g.progress === 100 ? 90 : g.progress }));
          if (status === 'COMPLETED') {
            notify({ type: 'COMPLETED', titleKey: 'notifications.completedTitle', bodyKey: 'notifications.completedBody', params: { title: game.title } });
          }
        },

        updateGameProgress: (id, progress) => patch(id, (g) => ({ ...g, progress: g.status === 'COMPLETED' ? 100 : Math.min(99, progress) })),

        toggleFavorite: (id) => patch(id, (g) => ({ ...g, isFavorite: !g.isFavorite })),

        logPlaySession: (id, hours) => {
          if (!Number.isFinite(hours) || hours <= 0) return;
          patch(id, (g) => ({ ...g, hoursPlayed: (g.hoursPlayed || 0) + Math.min(hours, 24) }));
        },

        setSelectedGame: (game) => set({ selectedGame: game }),
        setGames: (games) => set({ games: games.map(normalize) }),
      };
    },
    {
      name: 'gamerbox-storage',
      // Per-user key resolved on every read/write; rehydrated by AuthGuard when the user changes.
      storage: createJSONStorage(perUserStorage),
      skipHydration: true,
      partialize: (state) => ({ games: state.games }),
      merge: (persisted, current) => ({
        ...current,
        games: ((persisted as Partial<GameState> | undefined)?.games || []).map(normalize),
        selectedGame: null,
        hasHydrated: true,
      }),
    }
  )
);
