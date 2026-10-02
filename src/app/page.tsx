import { Hero } from '@/components/dashboard/Hero';
import { GameCard } from '@/components/dashboard/GameCard';
import { YOUR_GAMES, TRENDING_GAMES } from '@/data/mockGames';

export default function Home() {
  return (
    <div className="flex flex-col gap-12 pb-12 w-full max-w-[1600px] mx-auto overflow-hidden">
      <Hero />

      <section className="px-4 md:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-heading font-bold">Your Games</h2>
          <button className="text-neon-red hover:text-neon-red-bright font-mono text-sm tracking-wider uppercase transition-colors">
            View All
          </button>
        </div>
        
        {/* Horizontal Scroll Container */}
        <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {YOUR_GAMES.map((game) => (
            <div key={game.id} className="snap-start shrink-0">
              <GameCard game={game} />
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 md:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-heading font-bold">Trending This Week</h2>
          <button className="text-neon-red hover:text-neon-red-bright font-mono text-sm tracking-wider uppercase transition-colors">
            Explore
          </button>
        </div>
        
        {/* Horizontal Scroll Container */}
        <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {TRENDING_GAMES.map((game) => (
            <div key={game.id} className="snap-start shrink-0">
              <GameCard game={game} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
