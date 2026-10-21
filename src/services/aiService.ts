export interface AiRecommendation {
  id: string;
  title: string;
  genre: string;
  platform: string;
  coverUrl: string;
  matchPercentage: number;
  synopsis: string;
}

const FALLBACK_RECOMMENDATIONS: AiRecommendation[] = [
  {
    id: 'ai-1',
    title: 'Neon White',
    genre: 'ACTION',
    platform: 'PC',
    coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop',
    matchPercentage: 96,
    synopsis: 'A lightning-fast first-person action game about exterminating demons in Heaven.'
  },
  {
    id: 'ai-2',
    title: 'Hades II',
    genre: 'RPG',
    platform: 'PC',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop',
    matchPercentage: 92,
    synopsis: 'Battle beyond the Underworld using dark sorcery to take on the Titan of Time in this bewitching sequel.'
  },
  {
    id: 'ai-3',
    title: 'Armored Core VI',
    genre: 'ACTION',
    platform: 'PS5',
    coverUrl: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?q=80&w=1000&auto=format&fit=crop',
    matchPercentage: 88,
    synopsis: 'Assemble and pilot your own mech with 3D maneuverability to move freely through three-dimensional fast-paced missions.'
  }
];

export const getOracleRecommendations = async (
  favorites: string[],
  completed: string[],
  language: string = 'es'
): Promise<AiRecommendation[]> => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('🤖 [GamerBox AI] No Gemini API key found, returning fallback recommendations.');
    return FALLBACK_RECOMMENDATIONS;
  } else {
    console.log(`🤖 [GamerBox AI] API Key verificada. Inicia con: ${apiKey.substring(0, 5)}...`);
  }

  const prompt = `You are the GamerBox Oracle. Analyze these favorite games: [${favorites.join(', ')}], and completed games: [${completed.join(', ')}]. Recommend exactly 3 new games. Respond ONLY with a valid JSON array of objects. Do not use Markdown formatting like \`\`\`json. Each object must have: \`id\` (uuid), \`title\`, \`genre\`, \`platform\`, \`coverUrl\` (use a generic placeholder URL like 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&q=80' if unknown), \`matchPercentage\` (integer between 85 and 99), and \`synopsis\` (WRITE THE SYNOPSIS IN ${language === 'es' ? 'SPANISH' : 'ENGLISH'}).`;

  try {
    console.log('🤖 [GamerBox AI] Iniciando solicitud a Gemini API...');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    console.log('🤖 [GamerBox AI] HTTP Status:', response.status);

    if (!response.ok) {
      const errorPayload = await response.text();
      console.error('🤖 [GamerBox AI] Error payload de Gemini:', errorPayload);
      throw new Error(`Failed to fetch from Gemini API. Status: ${response.status}`);
    }

    const data = await response.json();
    let textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResult) {
      throw new Error('Invalid response structure from Gemini API');
    }

    // Sanitize response by removing potential markdown formatting
    textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsed: AiRecommendation[] = JSON.parse(textResult);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Parsed response is not a valid array');
    }

    console.log('🤖 [GamerBox AI] Respuesta recibida y procesada con éxito.');
    return parsed.slice(0, 3);
  } catch (error) {
    console.error('🤖 [GamerBox AI] Error fetching Oracle recommendations:', error);
    return FALLBACK_RECOMMENDATIONS;
  }
};
