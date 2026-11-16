'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Hero } from '@/components/dashboard/Hero';
import { GameCard, GameCardSkeleton } from '@/components/dashboard/GameCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useGameStore } from '@/store/useGameStore';
import { useTranslation } from '@/i18n/useTranslation';
import { fetchTrendingGames, type ExternalGameResult, type Sourced } from '@/services/gameApiService';
import { openExternalGame } from '@/lib/openGame';
import { fadeUp, stagger } from '@/lib/motion';

const SectionHeader = ({ title, action, href, note }: { title: string; action: string; href: string; note?: string }) => (
  <div className="mb-4 flex items-end justify-between gap-3">
    <div className="min-w-0">
      <h2 className="font-heading text-xl font-bold uppercase leading-none text-white">{title}</h2>
      {note && <p className="eyebrow mt-1.5 text-[9px]">{note}</p>}
    </div>
    <Link
      href={href}
      className="-my-3 -mr-2 flex h-11 shrink-0 items-center px-2 font-mono text-[11px] font-bold uppercase tracking-wider text-neon-red-bright"
    >
      {action}
    </Link>
  </div>
);

const Rail = ({ children }: { children: React.ReactNode }) => (
  <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">{children}</div>
);

export default function Home() {
  const games = useGameStore((state) => state.games);
  const { t } = useTranslation();
  const router = useRouter();
  const [trending, setTrending] = useState<Sourced<ExternalGameResult> | null>(null);

  useEffect(() => {
    let alive = true;
    // Never rejects: offline or on error it resolves with the local catalog.
    fetchTrendingGames().then((result) => alive && setTrending(result));
    return () => {
      alive = false;
    };
  }, []);

  const yourGames = games.slice(0, 8);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="pb-nav flex w-full flex-col gap-9">
      <motion.div variants={fadeUp}>
        <Hero />
      </motion.div>

      <motion.section variants={fadeUp} className="px-4">
        <SectionHeader title={t('home.yourGames')} action={t('home.viewAll')} href="/backlog" />
        {yourGames.length > 0 ? (
          <Rail>
            {yourGames.map((game) => (
              <div key={game.id} className="w-[150px] shrink-0 snap-start">
                <GameCard game={game} />
              </div>
            ))}
          </Rail>
        ) : (
          <EmptyState
            art="vault"
            title={t('home.emptyTitle')}
            body={t('home.emptyBody')}
            actionLabel={t('home.emptyCta')}
            onAction={() => router.push('/discover')}
          />
        )}
      </motion.section>

      <motion.section variants={fadeUp} className="px-4" aria-busy={!trending}>
        <SectionHeader
          title={t('home.trending')}
          action={t('home.explore')}
          href="/discover"
          note={trending && !trending.live ? t('home.trendingLocal') : undefined}
        />
        <Rail>
          {!trending
            ? Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="w-[150px] shrink-0">
                  <GameCardSkeleton />
                </div>
              ))
            : trending.items.map((item) => (
                <div key={item.gameID} className="w-[150px] shrink-0 snap-start">
                  <GameCard
                    game={{
                      id: item.gameID,
                      title: item.title,
                      coverUrl: item.cover,
                      genre: item.genre,
                      platform: item.platform,
                      status: 'TRENDING',
                      isFavorite: false,
                      timePlayed: '',
                      rating: 0,
                    }}
                    onOpen={() => openExternalGame(item, router)}
                  />
                </div>
              ))}
        </Rail>
      </motion.section>
    </motion.div>
  );
}
