import { ALL_GAMES } from '@/data/mockGames';
import GameDetailClient from './GameDetailClient';

export function generateStaticParams() {
  // Generate a static page for every game ID in our mock data
  return ALL_GAMES.map((game) => ({
    id: game.id,
  }));
}

export default function GameDetailPage({ params }: { params: { id: string } }) {
  return <GameDetailClient params={params} />;
}
