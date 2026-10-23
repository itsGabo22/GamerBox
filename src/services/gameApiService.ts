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
  try {
    const response = await fetch('https://www.cheapshark.com/api/1.0/deals?storeID=1&upperPrice=50&pageSize=12&sortBy=Deal Rating');
    if (!response.ok) throw new Error('Network response was not ok');
    const data: ApiGameDeal[] = await response.json();
    return data.map(deal => ({
      ...deal,
      // Upgrade CheapShark low-res thumbs to high-res Steam headers if possible
      thumb: deal.steamAppID
        ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${deal.steamAppID}/header.jpg`
        : deal.thumb
    }));
  } catch (error) {
    console.error('Error fetching Steam deals:', error);
    return [];
  }
};

/**
 * Search global games using CheapShark API (free, reliable, covers Steam/Epic/GOG)
 */
export const searchGlobalGames = async (query: string): Promise<ApiGameSearchResult[]> => {
  if (!query || query.trim() === '') return [];
  try {
    const response = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(query)}&limit=15`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data: ApiGameSearchResult[] = await response.json();
    return data.map(game => ({
      ...game,
      thumb: game.steamAppID
        ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.steamAppID}/header.jpg`
        : game.thumb
    }));
  } catch (error) {
    console.error('Error searching games:', error);
    return [];
  }
};
