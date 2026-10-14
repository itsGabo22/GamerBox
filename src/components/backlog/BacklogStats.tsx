import React from 'react';
import { KpiCard, KpiData } from './KpiCard';
import { useGameStore } from '@/store/useGameStore';

export const BacklogStats = () => {
  const games = useGameStore(state => state.games);
  const total = games.length;
  const pending = games.filter(g => g.status === 'PENDING').length;
  const playing = games.filter(g => g.status === 'PLAYING').length;
  const completed = games.filter(g => g.status === 'COMPLETED').length;

  const stats: KpiData[] = [
    { label: 'TOTAL', value: total, accent: 'default' },
    { label: 'PENDING', value: pending, accent: 'neon' },
    { label: 'PLAYING', value: playing, accent: 'default' },
    { label: 'COMPLETED', value: completed, accent: 'mint' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-8">
      {stats.map((stat) => (
        <KpiCard key={stat.label} data={stat} />
      ))}
    </div>
  );
};
