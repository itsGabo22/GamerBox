import { Game } from '@/components/dashboard/GameCard';

export const YOUR_GAMES: Game[] = [
  {
    id: 'g1',
    title: 'Neon Drift: Tokyo',
    image: 'https://images.unsplash.com/photo-1547394765-185e1e68f34e?q=80&w=1000&auto=format&fit=crop',
    rating: 9.4,
    status: 'installed',
    playTime: '124 hrs'
  },
  {
    id: 'g2',
    title: 'Apex Legends',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop',
    rating: 8.9,
    status: 'live',
    playTime: '890 hrs'
  },
  {
    id: 'g3',
    title: 'Cyberpunk Redux',
    image: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=1000&auto=format&fit=crop',
    rating: 9.7,
    status: 'update',
    playTime: '45 hrs'
  },
  {
    id: 'g4',
    title: 'Stellaris: Void',
    image: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=1000&auto=format&fit=crop',
    rating: 8.5,
    status: 'installed',
    playTime: '200 hrs'
  }
];

export const TRENDING_GAMES: Game[] = [
  {
    id: 't1',
    title: 'Valorant',
    image: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=1000&auto=format&fit=crop',
    rating: 9.1,
    status: 'live',
  },
  {
    id: 't2',
    title: 'Elden Ring',
    image: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=1000&auto=format&fit=crop',
    rating: 9.8,
    status: 'hot',
  },
  {
    id: 't3',
    title: 'Ghost of Tsushima',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop',
    rating: 9.5,
    status: 'new',
  },
  {
    id: 't4',
    title: 'Hollow Knight: Silksong',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop',
    rating: 9.9,
    status: 'trending',
  },
  {
    id: 't5',
    title: 'Helldivers 2',
    image: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?q=80&w=1000&auto=format&fit=crop',
    rating: 9.2,
    status: 'live',
  }
];
