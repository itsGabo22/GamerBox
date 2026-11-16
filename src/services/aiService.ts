import { GLOBAL_GAMES_CATALOG, getGameCatalogData, type CatalogGame } from '@/data/globalGamesCatalog';
import { translate } from '@/i18n/useTranslation';
import { searchGlobalGames, type ApiGameDeal } from './gameApiService';
import type { Game } from '@/store/useGameStore';

export interface AiRecommendation {
  id: string;
  title: string;
  genre: string;
  platform: string;
  coverUrl: string;
  matchScore: number;
  reason: string;
}

export interface TacticalBreakdown {
  synopsis: string;
  matchReason: string;
  tips: string[];
  timeToBeat: string;
  difficulty: string;
}

/**
 * The Oracle / Advisor. With a Gemini key it asks the model; without one, offline, or on any
 * failure it answers from the built-in catalog. Callers never see an error state.
 *
 * NOTE: NEXT_PUBLIC_* values are inlined into the bundle, so the key ships inside the APK.
 * Use a low-quota key and rotate it after the exhibition (see README > Security).
 */
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
// "-latest" aliases follow Google's current Flash model; override with NEXT_PUBLIC_GEMINI_MODEL.
const MODELS = Array.from(
  new Set([process.env.NEXT_PUBLIC_GEMINI_MODEL, 'gemini-flash-latest', 'gemini-2.5-flash'].filter(Boolean) as string[])
);

const online = () => typeof navigator === 'undefined' || navigator.onLine !== false;

async function askGemini<T>(prompt: string, timeoutMs: number): Promise<T | null> {
  if (!API_KEY || !online()) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    for (const model of MODELS) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
          }),
          signal: controller.signal,
        });
        if (!response.ok) continue;
        const data = await response.json();
        const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) continue;
        return JSON.parse(text.replace(/```json|```/g, '').trim()) as T;
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') return null;
      }
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const langName = (language: string) => (language === 'es' ? 'Spanish' : 'English');
const str = (value: unknown, max = 600) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

// ── Local answers ────────────────────────────────────────────────────────

const catalogFacts = (g: CatalogGame) =>
  `${g.title} · ${g.developer} (${g.releaseYear}) · Metacritic ${g.metacritic}`;

const localReason = (g: CatalogGame, language: string) => (language === 'es' ? g.whyYouWillLikeIt : catalogFacts(g));

const localRecommendations = (library: Game[], language: string): AiRecommendation[] => {
  const owned = new Set(library.map((g) => g.title.toLowerCase()));
  const taste = new Set(
    library.filter((g) => g.isFavorite || g.status === 'COMPLETED').map((g) => (g.genre || '').toUpperCase())
  );
  return GLOBAL_GAMES_CATALOG.filter((g) => !owned.has(g.title.toLowerCase()))
    .map((g) => {
      const affinity = taste.has(g.genre.toUpperCase()) ? 6 : 0;
      return { game: g, score: Math.min(99, Math.round(g.metacritic * 0.9 + affinity + 4)) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ game, score }) => ({
      id: `local-${game.id}`,
      title: game.title,
      genre: game.genre,
      platform: game.platform.split(',')[0].trim(),
      coverUrl: game.cover,
      matchScore: score,
      reason: localReason(game, language),
    }));
};

const localBreakdown = (title: string, language: string): TacticalBreakdown => {
  const entry = getGameCatalogData(title);
  if (entry) {
    const spanish = language === 'es';
    return {
      synopsis: spanish ? entry.synopsis : catalogFacts(entry),
      matchReason: localReason(entry, language),
      tips: spanish
        ? [entry.proTip, translate('game.catalogTip2'), translate('game.catalogTip3')]
        : [translate('game.fallbackTip1'), translate('game.catalogTip2'), translate('game.catalogTip3')],
      timeToBeat: entry.timeToBeat.replace(/Campaña/g, spanish ? 'Campaña' : 'Story').replace(/Completista/g, spanish ? 'Completista' : 'Completionist').replace(/Infinita/g, '∞'),
      difficulty: translate('game.catalogDifficulty'),
    };
  }
  return {
    synopsis: translate('game.fallbackSynopsis', { title }),
    matchReason: translate('game.fallbackReason'),
    tips: [translate('game.fallbackTip1'), translate('game.fallbackTip2'), translate('game.fallbackTip3')],
    timeToBeat: translate('game.fallbackTime'),
    difficulty: translate('game.fallbackDifficulty'),
  };
};

// ── Public API ───────────────────────────────────────────────────────────

export const getGameTacticalBreakdown = async (gameTitle: string, language: string = 'es'): Promise<TacticalBreakdown> => {
  const fallback = localBreakdown(gameTitle, language);
  const result = await askGemini<Partial<TacticalBreakdown>>(
    `You are the GamerBox Oracle, a seasoned game analyst. Give a tactical briefing for the video game "${gameTitle.slice(0, 120)}".
Return ONLY a JSON object with keys: "synopsis" (2 sentences, no spoilers), "matchReason" (1 sentence: who will enjoy it),
"tips" (array of exactly 3 short strings: early-game, combat/positioning, mastery), "timeToBeat" (e.g. "45 h story / 90 h completionist"),
"difficulty" (one or two words). If you do not know the game, say so honestly in "synopsis". Write everything in ${langName(language)}.`,
    7000
  );
  if (!result || !str(result.synopsis)) return fallback;
  const tips = Array.isArray(result.tips) ? result.tips.map((tip) => str(tip, 300)).filter(Boolean).slice(0, 3) : [];
  return {
    synopsis: str(result.synopsis, 900),
    matchReason: str(result.matchReason) || fallback.matchReason,
    tips: tips.length === 3 ? tips : fallback.tips,
    timeToBeat: str(result.timeToBeat, 60) || fallback.timeToBeat,
    difficulty: str(result.difficulty, 40) || fallback.difficulty,
  };
};

export const analyzeSteamDeals = async (
  deals: ApiGameDeal[],
  favorites: string[],
  language: string = 'es'
): Promise<{ recommendedDealId: string; analysis: string } | null> => {
  if (deals.length === 0) return null;

  // Local pick: biggest discount weighted by review score.
  const best = [...deals].sort(
    (a, b) =>
      parseFloat(b.savings) * (50 + parseFloat(b.steamRatingPercent || b.metacriticScore || '0')) -
      parseFloat(a.savings) * (50 + parseFloat(a.steamRatingPercent || a.metacriticScore || '0'))
  )[0];
  const fallback = {
    recommendedDealId: best.dealID,
    analysis: translate('discover.advisorFallback', { title: best.title, n: Math.round(parseFloat(best.savings) || 0) }),
  };

  const shortlist = deals.slice(0, 10).map((d) => ({ id: d.dealID, title: d.title, price: d.salePrice, discount: `${d.savings}%` }));
  const result = await askGemini<{ recommendedDealId?: string; analysis?: string }>(
    `You are the GamerBox Advisor. Live Steam deals: ${JSON.stringify(shortlist)}.
The player's favorite games: ${favorites.slice(0, 8).join(', ') || 'unknown'}.
Pick the single best-value deal. Return ONLY a JSON object: {"recommendedDealId": "<exact id from the list>", "analysis": "<2 short sentences, no invented facts or prices>"}.
Write the analysis in ${langName(language)}.`,
    7000
  );
  if (!result || !deals.some((d) => d.dealID === result.recommendedDealId) || !str(result.analysis)) return fallback;
  return { recommendedDealId: result.recommendedDealId as string, analysis: str(result.analysis, 400) };
};

export const getOracleRecommendations = async (library: Game[], language: string = 'es'): Promise<AiRecommendation[]> => {
  const fallback = localRecommendations(library, language);
  const favorites = library.filter((g) => g.isFavorite).map((g) => g.title);
  const completed = library.filter((g) => g.status === 'COMPLETED').map((g) => g.title);
  const owned = library.map((g) => g.title);

  const result = await askGemini<{ title?: string; genre?: string; platform?: string; matchScore?: number; reason?: string }[]>(
    `You are the GamerBox Oracle. The player's favorites: [${favorites.slice(0, 10).join(', ')}]. Completed: [${completed.slice(0, 10).join(', ')}].
Already owned (do not recommend): [${owned.slice(0, 30).join(', ')}].
Recommend exactly 3 real, released video games to play next. Return ONLY a JSON array of objects with keys:
"title", "genre" (one of RPG, ACTION, SHOOTER, RACING, STRATEGY, HORROR, SPORTS, ADVENTURE), "platform" (PC, PS5, Xbox or Switch),
"matchScore" (integer 80-99), "reason" (one sentence in ${langName(language)}).`,
    9000
  );
  if (!Array.isArray(result)) return fallback;

  const ownedSet = new Set(owned.map((title) => title.toLowerCase()));
  const picks = result.filter((r) => str(r?.title) && !ownedSet.has(str(r.title).toLowerCase())).slice(0, 3);
  if (picks.length === 0) return fallback;

  // Covers come from the catalog or a title search — never from a model-invented URL.
  return Promise.all(
    picks.map(async (pick, index) => {
      const title = str(pick.title, 120);
      const known = getGameCatalogData(title);
      const cover = known?.cover || (await searchGlobalGames(title).then((found) => found[0]?.cover || '').catch(() => ''));
      return {
        id: `oracle-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index}`,
        title,
        genre: str(pick.genre, 20).toUpperCase() || 'UNKNOWN',
        platform: str(pick.platform, 20) || 'PC',
        coverUrl: cover,
        matchScore: Math.min(99, Math.max(80, Math.round(Number(pick.matchScore) || 88))),
        reason: str(pick.reason, 300),
      };
    })
  );
};
