import React from 'react';
import { KpiCard, KpiData } from './KpiCard';

const stats: KpiData[] = [
  { label: 'TOTAL', value: 68, accent: 'default' },
  { label: 'PENDING', value: 24, accent: 'neon' },
  { label: 'PLAYING', value: 3, accent: 'default' },
  { label: 'COMPLETED', value: 41, accent: 'mint' },
];

export const BacklogStats = () => {
  return (
    <div className="grid grid-cols-2 gap-3 mb-8">
      {stats.map((stat) => (
        <KpiCard key={stat.label} data={stat} />
      ))}
    </div>
  );
};
