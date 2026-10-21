export const dictionary = {
  es: {
    nav: {
      home: 'INICIO',
      discover: 'DESCUBRIR',
      backlog: 'BIBLIOTECA',
      community: 'COMUNIDAD',
      profile: 'PERFIL'
    },
    settings: {
      title: 'AJUSTES DEL SISTEMA',
      language: 'IDIOMA',
      theme: 'TEMA VISUAL',
      dark: 'OSCURO (OBSIDIAN)',
      light: 'CLARO (STITCH)',
      close: 'CERRAR',
      version: 'GamerBox v1.0.0-PROD • Gemini 1.5 Flash',
      credit: 'Diseño original por Stitch',
      logout: 'CERRAR SESIÓN'
    },
    common: {
      searchPlaceholder: 'Buscar juegos...',
      playing: 'JUGANDO',
      completed: 'COMPLETADO',
      pending: 'PENDIENTE',
      all: 'TODOS',
      results: 'Resultados',
      found: 'encontrados'
    },
    home: {
      yourGames: 'TUS JUEGOS',
      trending: 'TENDENCIAS ESTA SEMANA',
      viewAll: 'VER TODOS',
      explore: 'EXPLORAR'
    },
    discover: {
      title: 'DESCUBRIR',
      subtitle: 'Encuentra tu próximo juego.',
      releases: 'LANZAMIENTOS',
      genres: 'EXPLORAR GÉNEROS',
      mightLike: 'PODRÍA GUSTARTE',
      noResults: 'NO ENCONTRAMOS ESE JUEGO',
      noResultsSub: 'Prueba con otro título, género o plataforma.',
      analyzeProfile: 'ANALIZAR MI PERFIL CON IA',
      analyzing: 'Sincronizando red neuronal con tu biblioteca...',
      reset: 'RESETEAR'
    },
    backlog: {
      title: 'MI BACKLOG',
      subtitle: 'VAULT // v2.4'
    },
    gameDetail: {
      synopsis: 'SINOPSIS',
      timePlayed: 'TIEMPO JUGADO',
      trophies: 'TROFEOS',
      currentMission: 'MISIÓN ACTUAL',
      progress: 'PROGRESO',
      communityLog: 'REGISTRO DE LA COMUNIDAD',
      playNow: 'JUGAR AHORA - PS5 REMOTE',
      establishing: 'Estableciendo Enlace Seguro',
      connecting: 'Conectando a PS5...',
      established: 'Conexión Establecida',
      launching: 'Iniciando',
      unknownDev: 'Desarrollador Desconocido'
    },
    profile: {
      progress: 'PROGRESO',
      daysStreak: 'Racha (Días)',
      platinums: 'Platinos',
      totalTime: 'Tiempo Total',
      favorites: 'FAVORITOS HISTÓRICOS',
      genreDist: 'DISTRIBUCIÓN POR GÉNEROS',
      logout: 'Cerrar Sesión'
    }
  },
  en: {
    nav: {
      home: 'HOME',
      discover: 'DISCOVER',
      backlog: 'VAULT',
      community: 'COMMUNITY',
      profile: 'PROFILE'
    },
    settings: {
      title: 'SYSTEM SETTINGS',
      language: 'LANGUAGE',
      theme: 'VISUAL THEME',
      dark: 'DARK (OBSIDIAN)',
      light: 'LIGHT (STITCH)',
      close: 'CLOSE',
      version: 'GamerBox v1.0.0-PROD • Gemini 1.5 Flash',
      credit: 'Original design by Stitch',
      logout: 'SIGN OUT'
    },
    common: {
      searchPlaceholder: 'Search games...',
      playing: 'PLAYING',
      completed: 'COMPLETED',
      pending: 'PENDING',
      all: 'ALL',
      results: 'Results',
      found: 'found'
    },
    home: {
      yourGames: 'YOUR GAMES',
      trending: 'TRENDING THIS WEEK',
      viewAll: 'VIEW ALL',
      explore: 'EXPLORE'
    },
    discover: {
      title: 'DISCOVER',
      subtitle: 'Find your next game.',
      releases: 'NEW RELEASES',
      genres: 'EXPLORE GENRES',
      mightLike: 'YOU MIGHT LIKE',
      noResults: 'GAME NOT FOUND',
      noResultsSub: 'Try another title, genre, or platform.',
      analyzeProfile: 'ANALYZE MY PROFILE WITH AI',
      analyzing: 'Synchronizing neural network with your vault...',
      reset: 'RESET'
    },
    backlog: {
      title: 'MY BACKLOG',
      subtitle: 'VAULT // v2.4'
    },
    gameDetail: {
      synopsis: 'SYNOPSIS',
      timePlayed: 'TIME PLAYED',
      trophies: 'TROPHIES',
      currentMission: 'CURRENT MISSION',
      progress: 'PROGRESS',
      communityLog: 'COMMUNITY LOG',
      playNow: 'PLAY NOW - PS5 REMOTE',
      establishing: 'Establishing Secure Link',
      connecting: 'Connecting to PS5...',
      established: 'Connection Established',
      launching: 'Launching',
      unknownDev: 'Unknown Developer'
    },
    profile: {
      progress: 'PROGRESS',
      daysStreak: 'Days Streak',
      platinums: 'Platinums',
      totalTime: 'Total Time',
      favorites: 'ALL-TIME FAVORITES',
      genreDist: 'GENRE DISTRIBUTION',
      logout: 'Sign Out'
    }
  }
};

export type Language = keyof typeof dictionary;
export type DictionaryPath = string; // Using simple string typing for rapid implementation

export const getTranslation = (lang: Language, path: string): string => {
  const keys = path.split('.');
  let current: Record<string, unknown> | string = dictionary[lang] as Record<string, unknown>;

  for (const key of keys) {
    if (typeof current === 'object' && current !== null && key in current) {
      current = (current as Record<string, unknown>)[key] as Record<string, unknown> | string;
    } else {
      console.warn(`Translation missing for key: ${path} in lang: ${lang}`);
      return path;
    }
  }

  return typeof current === 'string' ? current : path;
};
