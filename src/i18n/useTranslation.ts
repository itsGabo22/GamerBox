import { useCallback } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { dictionary, getTranslation, Language, TParams } from './dictionary';

export type TFn = (path: string, params?: TParams) => string;

export const useTranslation = () => {
  const language = useSettingsStore((state) => state.language) as Language;
  const t: TFn = useCallback((path, params) => getTranslation(language, path, params), [language]);
  return { t, language };
};

/** For stores/services that run outside React. */
export const translate: TFn = (path, params) =>
  getTranslation(useSettingsStore.getState().language as Language, path, params);

const hasKey = (group: 'status' | 'genre', key: string) => key in dictionary.es[group];

/** Status / genre codes are stored in English caps; show them localized when known. */
export const statusLabel = (t: TFn, status: string) => {
  const key = (status || '').toUpperCase();
  return hasKey('status', key) ? t(`status.${key}`) : status;
};

export const genreLabel = (t: TFn, genre?: string) => {
  const key = (genre || 'UNKNOWN').toUpperCase();
  return hasKey('genre', key) ? t(`genre.${key}`) : genre || t('genre.UNKNOWN');
};
