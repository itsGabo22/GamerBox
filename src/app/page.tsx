'use client';

import { Hero } from '@/components/dashboard/Hero';
import { GameCard } from '@/components/dashboard/GameCard';
import { useGameStore } from '@/store/useGameStore';
import { useTranslation } from '@/i18n/useTranslation';

export default function Home() {
  const games = useGameStore(state => state.games);
  const { t } = useTranslation();

  const yourGames = games.slice(0, 4);
  const trendingGames = games.slice(4, 9);

  return (
    <div className="flex flex-col gap-12 pb-12 w-full overflow-hidden">
      <Hero />

      <section className="px-4 md:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-heading font-bold">{t('home.yourGames')}</h2>
          <button className="text-neon-red hover:text-neon-red-bright font-mono text-sm tracking-wider uppercase transition-colors">
            {t('home.viewAll')}
          </button>
        </div>
        
        {/* Horizontal Scroll Container */}
        <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {yourGames.map((game) => (
            <div key={game.id} className="snap-start shrink-0 w-[160px] md:w-[200px]">
              <GameCard game={game} />
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 md:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-heading font-bold">{t('home.trending')}</h2>
          <button className="text-neon-red hover:text-neon-red-bright font-mono text-sm tracking-wider uppercase transition-colors">
            {t('home.explore')}
          </button>
        </div>
        
        {/* Horizontal Scroll Container */}
        <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {trendingGames.map((game) => (
            <div key={game.id} className="snap-start shrink-0 w-[160px] md:w-[200px]">
              <GameCard game={game} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
