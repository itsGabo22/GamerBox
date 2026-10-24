import { getGameCatalogData } from '@/data/globalGamesCatalog';

export interface AiRecommendation {
  id: string;
  title: string;
  genre: string;
  platform: string;
  coverUrl: string;
  matchScore: number;
  reason: string;
}

const FALLBACK_RECOMMENDATIONS: AiRecommendation[] = [
  {
    id: 'ai-1',
    title: 'Neon White',
    genre: 'ACTION',
    platform: 'PC',
    coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop',
    matchScore: 96,
    reason: 'Un shooter increíblemente rápido donde exterminarás demonios contrarreloj usando cartas de habilidades únicas.'
  },
  {
    id: 'ai-2',
    title: 'Hades II',
    genre: 'RPG',
    platform: 'PC',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop',
    matchScore: 92,
    reason: 'Explora y lucha más allá del Inframundo utilizando brujería oscura para enfrentar al Titán del Tiempo en esta aclamada secuela.'
  },
  {
    id: 'ai-3',
    title: 'Armored Core VI',
    genre: 'ACTION',
    platform: 'PS5',
    coverUrl: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?q=80&w=1000&auto=format&fit=crop',
    matchScore: 88,
    reason: 'Ensambla y pilota tu propio mecha con maniobrabilidad 3D absoluta en combates espectaculares de FromSoftware.'
  }
];

export const getGameTacticalBreakdown = async (
  gameTitle: string,
  language: string = 'es'
): Promise<{ synopsis: string; matchReason: string; tips: string[]; timeToBeat: string; difficulty: string }> => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  const fallbackData = () => {
    const catalogData = getGameCatalogData(gameTitle);
    if (catalogData) {
      return {
        synopsis: catalogData.synopsis,
        matchReason: catalogData.whyYouWillLikeIt,
        tips: [catalogData.proTip, 'Explora todos los rincones del mapa.', 'Domina las mecánicas defensivas.'],
        timeToBeat: catalogData.timeToBeat,
        difficulty: 'Media / Alta'
      };
    }
    return {
      synopsis: 'Explora un mundo increíble lleno de desafíos tácticos y una narrativa profunda.',
      matchReason: 'Combate dinámico y excelente progresión que se adapta a tu estilo.',
      tips: ['Revisa tu equipamiento y recursos antes de cada misión.', 'Aprende los patrones de los enemigos.', 'No dudes en retroceder si la situación lo requiere.'],
      timeToBeat: '20h - 40h',
      difficulty: 'Media'
    };
  };

  if (!apiKey) return fallbackData();

  const prompt = `You are a hardcore gamer AI. Provide a tactical breakdown for the game "${gameTitle}".
  Respond ONLY with a valid JSON object. Do not use markdown like \`\`\`json.
  Keys required:
  "synopsis" (Brief lore/overview),
  "matchReason" (Why a hardcore gamer would like it),
  "tips" (Array of exactly 3 distinct strings: Tip 1: Early-game resource/build optimization, Tip 2: Combat/tactical positioning mechanic, Tip 3: Secret/Endgame/Mastery progression advice),
  "timeToBeat" (Estimated hours, e.g. "45h Campaña / 90h Completista"),
  "difficulty" (e.g. "Alta", "Media").
  WRITE EVERYTHING IN ${language === 'es' ? 'SPANISH' : 'ENGLISH'}.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    let response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: controller.signal
      }
    ).catch(() => null);

    if (!response || !response.ok) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          signal: controller.signal
        }
      );
    }

    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    let textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(textResult);
  } catch {
    return fallbackData();
  } finally {
    clearTimeout(timeoutId);
  }
};
export const analyzeSteamDeals = async (
  deals: { dealID: string; title: string; salePrice: string; savings?: string }[],
  favorites: string[],
  language: string = 'es'
): Promise<{ recommendedDealId: string; analysis: string }> => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey || !deals || deals.length === 0) return { recommendedDealId: deals?.[0]?.dealID || '', analysis: 'Oferta destacada' };

  const prompt = `You are a savvy Game Deal Advisor. I have these live Steam Deals: ${JSON.stringify(deals.slice(0, 10).map(d => ({id: d.dealID, title: d.title, price: d.salePrice})))}.
  My favorite games are: ${favorites.join(', ') || 'Action/RPGs'}.
  Pick the absolute best value deal for me.
  Respond ONLY with a valid JSON object. Do not use markdown like \`\`\`json.
  Keys required:
  "recommendedDealId" (The exact dealID string from the list),
  "analysis" (A short, punchy 2-sentence explanation of why this is a steal for me. WRITE IN ${language === 'es' ? 'SPANISH' : 'ENGLISH'}).`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    let response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: controller.signal
      }
    ).catch(() => null);

    if (!response || !response.ok) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          signal: controller.signal
        }
      );
    }

    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    let textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(textResult);
  } catch {
    const bestDeal = deals[0];
    const discount = Math.round(parseFloat(bestDeal.savings || '0'));
    const analysisES = `Recomendación Óptima: ${bestDeal.title} con -${discount}% de descuento es una compra maestra hoy. Basado en tu afinidad por juegos de Acción y Mundo Abierto, te ofrece más de 40 horas de contenido al precio más bajo del trimestre.`;
    const analysisEN = `Optimal Recommendation: ${bestDeal.title} at -${discount}% off is a steal today. Based on your affinity for Action/RPGs, it offers over 40 hours of content at the lowest price of the quarter.`;
    return { recommendedDealId: bestDeal.dealID as string, analysis: language === 'es' ? analysisES : analysisEN };
  } finally {
    clearTimeout(timeoutId);
  }
};

export const getOracleRecommendations = async (
  favorites: string[],
  completed: string[],
  language: string = 'es'
): Promise<AiRecommendation[]> => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('🤖 [GamerBox AI] No Gemini API key found, returning fallback recommendations.');
    return FALLBACK_RECOMMENDATIONS;
  }

  const hasContext = favorites.length > 0 || completed.length > 0;
  const promptContext = hasContext
    ? `Favorite games: [${favorites.join(', ')}], Completed games: [${completed.join(', ')}].`
    : `User has an empty library. Give them 3 universally acclaimed must-play games (e.g., Elden Ring, Cyberpunk 2077, Hades).`;

  const prompt = `You are the GamerBox Oracle. ${promptContext} Recommend exactly 3 exciting games to play next. Respond ONLY with a valid JSON array of objects. Do not use Markdown formatting like \`\`\`json. Each object must have: \`id\` (uuid), \`title\`, \`genre\`, \`platform\`, \`coverUrl\` (use a generic placeholder URL like 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&q=80' if unknown), \`matchScore\` (integer between 85 and 99), and \`reason\` (WRITE THE REASON IN ${language === 'es' ? 'SPANISH' : 'ENGLISH'}).`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    console.log('🤖 [GamerBox AI] Fetching Gemini 2.5 Flash...');
    let response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: controller.signal
      }
    ).catch(() => null);

    if (!response || !response.ok) {
      console.log('🤖 [GamerBox AI] Retrying with Gemini 2.0 Flash...');
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          signal: controller.signal
        }
      );
    }

    if (!response.ok) throw new Error(`Failed to fetch from Gemini API. Status: ${response.status}`);

    const data = await response.json();
    let textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResult) throw new Error('Invalid response structure from Gemini API');

    textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed: AiRecommendation[] = JSON.parse(textResult);

    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Parsed response is not a valid array');

    console.log('🤖 [GamerBox AI] Respuesta recibida y procesada con éxito.');
    return parsed.slice(0, 3);
  } catch (error) {
    console.error('🤖 [GamerBox AI] Error fetching Oracle recommendations:', error);
    return FALLBACK_RECOMMENDATIONS;
  } finally {
    clearTimeout(timeoutId);
  }
};
