export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface ReviewPost {
  id: string;
  type: 'review';
  user: User;
  gameId: string;
  rating: number;
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface PollPost {
  id: string;
  type: 'poll';
  user: User;
  question: string;
  options: PollOption[];
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
}

export type CommunityFeedItem = ReviewPost | PollPost;

const USERS: Record<string, User> = {
  u1: { id: 'u1', name: 'AlexGhost', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' },
  u2: { id: 'u2', name: 'CyberSamurai', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop' },
  u3: { id: 'u3', name: 'Maidenless', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop' },
};

export const MOCK_FEED: CommunityFeedItem[] = [
  {
    id: 'post-1',
    type: 'review',
    user: USERS.u1,
    gameId: 't2', // Elden Ring
    rating: 5.0,
    content: 'Just finished the DLC. FromSoftware never misses. The level design in the Shadow Realm is some of the best they have ever done.',
    image: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&aspect-video&fit=crop',
    timestamp: 'Hace 2 horas',
    likes: 128,
    comments: 24,
    shares: 8
  },
  {
    id: 'post-2',
    type: 'poll',
    user: USERS.u2,
    question: '¿Cuál es tu GOTY 2026?',
    options: [
      { id: 'o1', label: 'Elden Ring 2', votes: 62 },
      { id: 'o2', label: 'Resident Evil 9', votes: 28 },
      { id: 'o3', label: 'Other', votes: 10 }
    ],
    timestamp: 'Hace 5 horas',
    likes: 45,
    comments: 112,
    shares: 3
  },
  {
    id: 'post-3',
    type: 'review',
    user: USERS.u3,
    gameId: 't5', // Helldivers 2
    rating: 4.8,
    content: 'FOR DEMOCRACY! The new mechs are absolutely incredible, though the automatons are getting way too aggressive on level 9.',
    timestamp: 'Hace 1 día',
    likes: 890,
    comments: 156,
    shares: 45
  }
];
