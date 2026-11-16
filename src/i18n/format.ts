import type { Language } from './dictionary';

export type Currency = 'COP' | 'USD' | 'EUR' | 'MXN';

const LOCALE: Record<Language, string> = { es: 'es-CO', en: 'en-US' };

/** Static reference rates from USD (prices are indicative; the store sets the final price). */
const USD_RATE: Record<Currency, number> = { USD: 1, COP: 3751.32, EUR: 0.92, MXN: 18.5 };

export const formatPrice = (usdAmount: number | string, currency: Currency, language: Language = 'es'): string => {
  const parsed = typeof usdAmount === 'string' ? parseFloat(usdAmount.replace(/[^0-9.]/g, '')) : usdAmount;
  const usd = Number.isFinite(parsed) ? parsed : 0;
  const zeroDecimals = currency === 'COP' || currency === 'MXN';
  return new Intl.NumberFormat(LOCALE[language], {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: zeroDecimals ? 0 : 2,
    minimumFractionDigits: zeroDecimals ? 0 : 2,
  }).format(usd * USD_RATE[currency]) + (currency === 'USD' || currency === 'EUR' ? '' : ` ${currency}`);
};

export const formatNumber = (value: number, language: Language = 'es') =>
  new Intl.NumberFormat(LOCALE[language]).format(value);

export const formatDate = (iso: string, language: Language = 'es') => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(LOCALE[language], { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
};

/** "hace 5 min" / "5 min ago" */
export const formatRelative = (iso: string, language: Language = 'es', nowLabel = '') => {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  if (Number.isNaN(diff)) return '';
  const abs = Math.abs(diff);
  if (abs < 45) return nowLabel;
  const rtf = new Intl.RelativeTimeFormat(LOCALE[language], { numeric: 'auto', style: 'short' });
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day');
  return formatDate(iso, language);
};
