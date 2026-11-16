import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useGameStore, type Game } from '@/store/useGameStore';

const ACTIVE_KEY = 'gamerbox_active_game';

interface ExternalLike {
  gameID: string;
  title: string;
  cover: string;
  genre: string;
  platform: string;
}

/** Opens the detail page for a game that may not be in the vault yet. */
export const openExternalGame = (item: ExternalLike, router: AppRouterInstance) => {
  const owned = useGameStore.getState().games.find((g) => g.title.trim().toLowerCase() === item.title.trim().toLowerCase());
  if (owned) {
    router.push(`/game/view?id=${encodeURIComponent(owned.id)}`);
    return;
  }
  const game: Game = {
    id: item.gameID,
    title: item.title,
    coverUrl: item.cover,
    genre: item.genre,
    platform: item.platform,
    status: 'PENDING',
    isFavorite: false,
    timePlayed: '0 h',
    hoursPlayed: 0,
    rating: 0,
  };
  useGameStore.getState().setSelectedGame(game);
  try {
    sessionStorage.setItem(ACTIVE_KEY, JSON.stringify(game));
  } catch {
    /* private mode: the in-memory copy is enough */
  }
  router.push(`/game/view?id=${encodeURIComponent(item.gameID)}`);
};

/** The not-yet-owned game being viewed, surviving a reload of the detail page. */
export const readActiveGame = (id: string | null): Game | null => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(ACTIVE_KEY) || 'null') as Game | null;
    return saved && saved.id === id ? saved : null;
  } catch {
    return null;
  }
};
