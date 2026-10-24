import { GLOBAL_GAMES_CATALOG } from '@/data/globalGamesCatalog';

export interface ApiGameDeal {
  internalName: string;
  title: string;
  metacriticLink: string;
  dealID: string;
  storeID: string;
  gameID: string;
  salePrice: string;
  normalPrice: string;
  isOnSale: string;
  savings: string;
  metacriticScore: string;
  steamRatingText: string;
  steamRatingPercent: string;
  steamRatingCount: string;
  steamAppID: string;
  releaseDate: number;
  lastChange: number;
  dealRating: string;
  thumb: string;
}

export interface ApiGameSearchResult {
  gameID: string;
  steamAppID: string;
  cheapest: string;
  cheapestDealID: string;
  external: string;
  internalName: string;
  thumb: string;
}

/**
 * Fetch live Steam Deals using CheapShark API (Store 1 = Steam)
 */
export const fetchSteamDeals = async (): Promise<ApiGameDeal[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 seconds timeout for real mobile!

  const fallbackDeals = GLOBAL_GAMES_CATALOG.filter(g => g.savingsPercent > 0).map(g => ({
    internalName: g.title,
    title: g.title,
    metacriticLink: '',
    dealID: `local-${g.id}`,
    storeID: '1',
    gameID: g.id,
    salePrice: g.salePrice.toString(),
    normalPrice: g.normalPrice.toString(),
    isOnSale: '1',
    savings: g.savingsPercent.toString(),
    metacriticScore: g.metacritic.toString(),
    steamRatingText: '',
    steamRatingPercent: '90',
    steamRatingCount: '0',
    steamAppID: '',
    releaseDate: 0,
    lastChange: 0,
    dealRating: '9.0',
    thumb: g.cover
  }));

  try {
    const response = await fetch('https://www.cheapshark.com/api/1.0/deals?storeID=1&upperPrice=50&pageSize=15&sortBy=Deal Rating', {
      signal: controller.signal
    });
    if (!response.ok) throw new Error('Network response was not ok');
    const data: ApiGameDeal[] = await response.json();
    clearTimeout(timeoutId);
    return data.map(deal => ({
      ...deal,
      // Upgrade CheapShark low-res thumbs to high-res Steam headers if possible
      cover: deal.steamAppID
        ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${deal.steamAppID}/header.jpg`
        : deal.thumb,
      thumb: deal.thumb,
      salePrice: deal.salePrice,
      normalPrice: deal.normalPrice,
      savings: Math.round(parseFloat(deal.savings)).toString()
    }));
  } catch (error) {
    console.warn('Error fetching Steam deals (using fallback):', error);
    clearTimeout(timeoutId);
    return fallbackDeals.slice(0, 10);
  }
};

/**
 * Search global games using CheapShark API (free, reliable, covers Steam/Epic/GOG)
 */
export const searchGlobalGames = async (query: string): Promise<ApiGameSearchResult[]> => {
  if (!query || query.trim() === '') return [];
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(query)}&limit=15`, {
      signal: controller.signal
    });
    if (!response.ok) throw new Error('Network response was not ok');
    const data: ApiGameSearchResult[] = await response.json();
    clearTimeout(timeoutId);
    return data.map(game => ({
      ...game,
      thumb: game.steamAppID
        ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.steamAppID}/header.jpg`
        : game.thumb
    }));
  } catch (error) {
    console.warn('Error searching games (falling back to local catalog):', error);
    clearTimeout(timeoutId);
    const localResults = GLOBAL_GAMES_CATALOG.filter(g => g.title.toLowerCase().includes(query.toLowerCase()));
    return localResults.map(g => ({
      gameID: g.id,
      steamAppID: '',
      cheapest: g.salePrice.toString(),
      cheapestDealID: '',
      external: g.title,
      internalName: g.title,
      thumb: g.cover
    }));
  }
};
