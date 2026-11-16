import { GLOBAL_GAMES_CATALOG, type CatalogGame } from '@/data/globalGamesCatalog';

export interface ApiGameDeal {
  title: string;
  dealID: string;
  gameID: string;
  salePrice: string;
  normalPrice: string;
  savings: string;
  steamAppID: string;
  metacriticScore: string;
  steamRatingPercent: string;
  /** Any image URL for the game; GameCover upgrades Steam URLs to portrait art by itself. */
  thumb: string;
}

export interface ExternalGameResult {
  gameID: string;
  steamAppID: string;
  title: string;
  cover: string;
  cheapestPrice: string;
  genre: string;
  platform: string;
}

/** `live` is false when the network failed and the built-in catalog answered instead. */
export interface Sourced<T> {
  items: T[];
  live: boolean;
}

const CHEAPSHARK = 'https://www.cheapshark.com/api/1.0';

const steamHeader = (appId?: string | null) =>
  appId ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg` : '';

const bestImage = (steamAppID?: string | null, thumb?: string) => steamHeader(steamAppID) || thumb || '';

async function getJson<T>(url: string, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

const catalogToResult = (g: CatalogGame): ExternalGameResult => ({
  gameID: `local-${g.id}`,
  steamAppID: '',
  title: g.title,
  cover: g.cover,
  cheapestPrice: g.salePrice.toString(),
  genre: g.genre,
  platform: g.platform,
});

const catalogToDeal = (g: CatalogGame): ApiGameDeal => ({
  title: g.title,
  dealID: `local-${g.id}`,
  gameID: `local-${g.id}`,
  salePrice: g.salePrice.toString(),
  normalPrice: g.normalPrice.toString(),
  savings: g.savingsPercent.toString(),
  steamAppID: '',
  metacriticScore: g.metacritic.toString(),
  steamRatingPercent: '0',
  thumb: g.cover,
});

type RawDeal = {
  title: string; dealID: string; gameID: string; salePrice: string; normalPrice: string; savings: string;
  steamAppID: string | null; metacriticScore: string; steamRatingPercent: string; thumb: string;
};

const mapDeal = (d: RawDeal): ApiGameDeal => ({
  title: d.title,
  dealID: d.dealID,
  gameID: d.gameID,
  salePrice: d.salePrice,
  normalPrice: d.normalPrice,
  savings: Math.round(parseFloat(d.savings) || 0).toString(),
  steamAppID: d.steamAppID || '',
  metacriticScore: d.metacriticScore || '0',
  steamRatingPercent: d.steamRatingPercent || '0',
  thumb: bestImage(d.steamAppID, d.thumb),
});

const uniqueByTitle = <T extends { title: string }>(items: T[]) =>
  Array.from(new Map(items.map((item) => [item.title.toLowerCase(), item])).values());

/** Live Steam deals (CheapShark). Falls back to discounted games from the local catalog. */
export const fetchSteamDeals = async (): Promise<Sourced<ApiGameDeal>> => {
  try {
    const data = await getJson<RawDeal[]>(`${CHEAPSHARK}/deals?storeID=1&upperPrice=50&pageSize=15&sortBy=Deal%20Rating`, 9000);
    const items = uniqueByTitle(data.map(mapDeal));
    if (items.length === 0) throw new Error('empty');
    return { items, live: true };
  } catch {
    return { items: GLOBAL_GAMES_CATALOG.filter((g) => g.savingsPercent > 0).map(catalogToDeal), live: false };
  }
};

/** Most-reviewed games on Steam right now. Falls back to the catalog ranked by Metacritic. */
export const fetchTrendingGames = async (): Promise<Sourced<ExternalGameResult>> => {
  try {
    const data = await getJson<RawDeal[]>(`${CHEAPSHARK}/deals?storeID=1&sortBy=Reviews&pageSize=12`, 7000);
    const items = uniqueByTitle(data.map(mapDeal))
      .slice(0, 10)
      .map((d) => ({ gameID: d.gameID, steamAppID: d.steamAppID, title: d.title, cover: d.thumb, cheapestPrice: d.salePrice, genre: 'PC', platform: 'PC' }));
    if (items.length === 0) throw new Error('empty');
    return { items, live: true };
  } catch {
    return { items: [...GLOBAL_GAMES_CATALOG].sort((a, b) => b.metacritic - a.metacritic).map(catalogToResult), live: false };
  }
};

type RawSearch = { gameID: string; steamAppID: string | null; cheapest: string; external: string; thumb: string };

/** Global title search. Local catalog matches come first; offline returns only those. */
export const searchGlobalGames = async (query: string): Promise<ExternalGameResult[]> => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const local = GLOBAL_GAMES_CATALOG.filter((g) => g.title.toLowerCase().includes(q)).map(catalogToResult);
  try {
    const data = await getJson<RawSearch[]>(`${CHEAPSHARK}/games?title=${encodeURIComponent(query.trim())}&limit=12`, 5000);
    const remote = data.map((g) => ({
      gameID: g.gameID,
      steamAppID: g.steamAppID || '',
      title: g.external,
      cover: bestImage(g.steamAppID, g.thumb),
      cheapestPrice: g.cheapest,
      genre: 'PC',
      platform: 'PC',
    }));
    // Local entries win on duplicates because they carry genre/platform.
    return uniqueByTitle([...remote, ...local]).slice(0, 12);
  } catch {
    return local;
  }
};
