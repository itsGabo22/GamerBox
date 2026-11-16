'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useTranslation } from '@/i18n/useTranslation';

/** Skeleton shown while this account's library is read from storage. */
export function HydrationGuard({ children }: { children: React.ReactNode }) {
  const hasHydrated = useGameStore((state) => state.hasHydrated);
  const { t } = useTranslation();

  if (!hasHydrated) {
    return (
      <div className="flex w-full flex-col gap-6 px-4 pt-6" role="status" aria-label={t('common.opening')}>
        <div className="skeleton h-8 w-40 rounded-lg" />
        <div className="skeleton h-44 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-3">
          <div className="skeleton aspect-[2/3]" />
          <div className="skeleton aspect-[2/3]" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
