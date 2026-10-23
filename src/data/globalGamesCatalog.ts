export interface CatalogGame {
  id: string;
  title: string;
  genre: string;
  platform: string;
  releaseYear: number;
  developer: string;
  metacritic: number;
  normalPrice: number;
  salePrice: number;
  savingsPercent: number;
  cover: string;
  synopsis: string;
  timeToBeat: string;
  proTip: string;
  whyYouWillLikeIt: string;
}

export const GLOBAL_GAMES_CATALOG: CatalogGame[] = [
  {
    id: "rdr2",
    title: "Red Dead Redemption 2",
    genre: "ACTION",
    platform: "PC, PS5, Xbox",
    releaseYear: 2018,
    developer: "Rockstar Games",
    metacritic: 97,
    normalPrice: 59.99,
    salePrice: 19.79,
    savingsPercent: 67,
    cover: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1174180/header.jpg",
    synopsis: "América, 1899. Arthur Morgan y la banda de Van der Linde huyen por el salvaje oeste mientras el fin de la era de los forajidos se acerca.",
    timeToBeat: "50h Campaña / 180h Completista",
    proTip: "No te apresures. Acampa, caza, escucha las conversaciones en el campamento. El juego premia la inmersión lenta.",
    whyYouWillLikeIt: "Su mundo abierto es el más vivo, reactivo y hermoso jamás creado, con una historia inolvidable."
  },
  {
    id: "eldenring",
    title: "Elden Ring",
    genre: "RPG",
    platform: "PC, PS5, Xbox",
    releaseYear: 2022,
    developer: "FromSoftware",
    metacritic: 96,
    normalPrice: 59.99,
    salePrice: 35.99,
    savingsPercent: 40,
    cover: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg",
    synopsis: "Álzate, Sin Luz, y déjate guiar por la gracia para esgrimir el poder del Círculo de Elden y convertirte en el Señor del Círculo en las Tierras Intermedias.",
    timeToBeat: "60h Campaña / 130h Completista",
    proTip: "Si un jefe te destruye, date la vuelta. El mundo abierto está diseñado para que explores, subas de nivel y regreses más fuerte.",
    whyYouWillLikeIt: "Combate desafiante, lore críptico y un mundo abierto que no te lleva de la mano."
  },
  {
    id: "cp2077",
    title: "Cyberpunk 2077",
    genre: "RPG",
    platform: "PC, PS5, Xbox",
    releaseYear: 2020,
    developer: "CD Projekt Red",
    metacritic: 86,
    normalPrice: 59.99,
    salePrice: 29.99,
    savingsPercent: 50,
    cover: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg",
    synopsis: "Juego de rol de acción y aventura en mundo abierto ambientado en Night City, una megalópolis obsesionada con el poder, el glamur y la modificación corporal.",
    timeToBeat: "25h Campaña / 105h Completista",
    proTip: "Invierte en los ciberware de piernas (Doble Salto o Salto Cargado) lo antes posible; cambia por completo la exploración y el combate.",
    whyYouWillLikeIt: "Una narrativa profunda en una ciudad distópica impresionante con infinitas formas de afrontar las misiones."
  },
  {
    id: "hollowknight",
    title: "Hollow Knight",
    genre: "ACTION",
    platform: "PC, Switch, PS4, Xbox",
    releaseYear: 2017,
    developer: "Team Cherry",
    metacritic: 90,
    normalPrice: 14.99,
    salePrice: 7.49,
    savingsPercent: 50,
    cover: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/367520/header.jpg",
    synopsis: "Forja tu propio camino en Hollow Knight, una aventura épica de acción a través de un vasto reino en ruinas de insectos y héroes.",
    timeToBeat: "27h Campaña / 60h Completista",
    proTip: "Aprende a usar el 'pogo' (atacar hacia abajo mientras saltas) sobre los enemigos y picos para alcanzar zonas secretas y ganar movilidad.",
    whyYouWillLikeIt: "Es el metroidvania moderno perfecto: exploración laberíntica, atmósfera melancólica y combates precisos."
  },
  {
    id: "fc25",
    title: "EA SPORTS FC 25",
    genre: "SPORTS",
    platform: "PC, PS5, Xbox",
    releaseYear: 2024,
    developer: "EA Sports",
    metacritic: 76,
    normalPrice: 69.99,
    salePrice: 34.99,
    savingsPercent: 50,
    cover: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2669320/header.jpg",
    synopsis: "EA SPORTS FC™ 25 te da más formas de ganar por el club. Juega con tus colegas en tus modos favoritos con el nuevo Rush 5 contra 5 y controla a tu equipo hasta la victoria con FC IQ.",
    timeToBeat: "Infinita",
    proTip: "Acostúmbrate a usar los Roles de Jugador de FC IQ en tu táctica personalizada; afectan dramáticamente cómo se mueven los jugadores sin balón.",
    whyYouWillLikeIt: "La mejor simulación de fútbol actual, con modos competitivos y cooperativos para jugar meses."
  },
  {
    id: "silenthill2",
    title: "Silent Hill 2",
    genre: "HORROR",
    platform: "PC, PS5",
    releaseYear: 2024,
    developer: "Bloober Team",
    metacritic: 86,
    normalPrice: 69.99,
    salePrice: 69.99,
    savingsPercent: 0,
    cover: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2124490/header.jpg",
    synopsis: "Tras recibir una carta de su difunta esposa, James se dirige al lugar donde compartieron tantos recuerdos, con la esperanza de verla una vez más: Silent Hill.",
    timeToBeat: "15h Campaña / 25h Completista",
    proTip: "Revisa bien tu mapa a menudo. El juego no marca los objetivos claramente en pantalla, debes prestar atención a las pistas ambientales.",
    whyYouWillLikeIt: "Un remake magistral que respeta el terror psicológico original pero lo moderniza a nivel gráfico y jugable."
  }
];

export const getGameCatalogData = (titleOrId: string): CatalogGame | undefined => {
  const query = titleOrId.toLowerCase().trim();
  return GLOBAL_GAMES_CATALOG.find(g =>
    g.id.toLowerCase() === query ||
    g.title.toLowerCase() === query ||
    g.title.toLowerCase().includes(query)
  );
};
