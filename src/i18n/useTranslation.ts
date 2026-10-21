import { useSettingsStore } from '@/store/useSettingsStore';
import { getTranslation, Language } from './dictionary';

export const useTranslation = () => {
  const language = useSettingsStore((state) => state.language) as Language;

  const t = (path: string) => getTranslation(language, path);

  return { t, language };
};
