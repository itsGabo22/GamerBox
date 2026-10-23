import React from 'react';
import { KpiCard, KpiData } from './KpiCard';
import { useGameStore } from '@/store/useGameStore';
import { useTranslation } from '@/i18n/useTranslation';

export const BacklogStats = () => {
  const games = useGameStore(state => state.games);
  const { t } = useTranslation();
  const total = games.length;
  const pending = games.filter(g => g.status === 'PENDING').length;
  const playing = games.filter(g => g.status === 'PLAYING').length;
  const completed = games.filter(g => g.status === 'COMPLETED').length;

  const stats: KpiData[] = [
    { label: t('backlog.total'), value: total, accent: 'default' },
    { label: t('backlog.pending'), value: pending, accent: 'neon' },
    { label: t('backlog.playing'), value: playing, accent: 'default' },
    { label: t('backlog.completed'), value: completed, accent: 'mint' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-8">
      {stats.map((stat) => (
        <KpiCard key={stat.label} data={stat} />
      ))}
    </div>
  );
};
