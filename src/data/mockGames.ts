import { Game } from '@/components/dashboard/GameCard';

export const YOUR_GAMES: Game[] = [
  {
    id: 'g1',
    title: 'Neon Drift: Tokyo',
    image: 'https://images.unsplash.com/photo-1547394765-185e1e68f34e?q=80&w=1000&auto=format&fit=crop',
    rating: 9.4,
    status: 'COMPLETED',
    playTime: '124 hrs',
    platform: 'PC',
    genre: 'RACING',
    progress: 100
  },
  {
    id: 'g2',
    title: 'Apex Legends',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop',
    rating: 8.9,
    status: 'PLAYING',
    playTime: '890 hrs',
    platform: 'PS5',
    genre: 'ACTION'
  },
  {
    id: 'g3',
    title: 'Cyberpunk Redux',
    image: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=1000&auto=format&fit=crop',
    rating: 9.7,
    status: 'PENDING',
    playTime: '45 hrs',
    platform: 'PC',
    genre: 'RPG',
    progress: 30,
    developer: 'CD Projekt Red',
    year: 2024,
    synopsis: 'Return to Night City in this massive overhaul. A fully immersive dystopian adventure awaits as you rise through the ranks of the criminal underworld in a visually stunning megalopolis.',
    trophies: { earned: 12, total: 60 },
    mission: { title: 'Meet Hanako at Embers', progress: 30 },
    community: { user: 'V_Legend', rating: 9.5, review: 'The redux update completely changes everything. It is breathtaking.' }
  },
  {
    id: 'g4',
    title: 'Stellaris: Void',
    image: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=1000&auto=format&fit=crop',
    rating: 8.5,
    status: 'PLAYING',
    playTime: '200 hrs',
    platform: 'XBOX',
    genre: 'STRATEGY',
    progress: 65,
    developer: 'Paradox',
    year: 2025,
    synopsis: 'Explore the unknown void. Build your galactic empire and decide the fate of trillions across a massively procedurally generated universe.',
    trophies: { earned: 44, total: 50 },
    mission: { title: 'Construct the Dyson Sphere', progress: 65 },
    community: { user: 'StarGazer', rating: 9.0, review: 'Infinite replayability.' }
  }
];

export const TRENDING_GAMES: Game[] = [
  {
    id: 't1',
    title: 'Valorant',
    image: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=1000&auto=format&fit=crop',
    rating: 9.1,
    status: 'PLAYING',
    platform: 'PC',
    genre: 'ACTION'
  },
  {
    id: 't2',
    title: 'Elden Ring',
    image: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=1000&auto=format&fit=crop',
    rating: 9.8,
    status: 'COMPLETED',
    platform: 'PS5',
    genre: 'RPG',
    progress: 100,
    playTime: '145 hrs',
    developer: 'FromSoftware',
    year: 2022,
    synopsis: 'Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord in the Lands Between.',
    trophies: { earned: 50, total: 50 },
    community: { user: 'Maidenless', rating: 10, review: 'A masterpiece of world design.' }
  },
  {
    id: 't3',
    title: 'Ghost of Tsushima',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop',
    rating: 9.5,
    status: 'PENDING',
    platform: 'PS5',
    genre: 'ACTION',
    progress: 0
  },
  {
    id: 't4',
    title: 'Hollow Knight: Silksong',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop',
    rating: 9.9,
    status: 'PENDING',
    platform: 'SWITCH',
    genre: 'RPG'
  },
  {
    id: 't5',
    title: 'Helldivers 2',
    image: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?q=80&w=1000&auto=format&fit=crop',
    rating: 9.2,
    status: 'PLAYING',
    platform: 'PC',
    genre: 'ACTION',
    progress: 55
  }
];

export const ALL_GAMES = [...YOUR_GAMES, ...TRENDING_GAMES];
