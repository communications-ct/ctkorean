import ko from './ko.json';
import en from './en.json';

type Locale = 'ko' | 'en';

const translations: Record<Locale, Record<string, string>> = { ko, en };

export const defaultLocale: Locale = 'ko';
export const locales: Locale[] = ['ko', 'en'];

export function t(locale: string, key: string, params?: Record<string, string | number>): string {
  const lang = (locale === 'en' ? 'en' : 'ko') as Locale;
  let value = translations[lang]?.[key] || translations[defaultLocale][key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(`{${k}}`, String(v));
    }
  }
  return value;
}

export function getLocaleFromUrl(url: URL): Locale {
  const segments = url.pathname.split('/').filter(Boolean);
  // Account for base path: /ctkorean/ko/... → segments = ['ctkorean', 'ko', ...]
  const localeSegment = segments.length > 1 ? segments[1] : segments[0];
  return localeSegment === 'en' ? 'en' : 'ko';
}

export function getLocalizedPath(path: string, locale: Locale): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const cleanPath = path.replace(/^\/?/, '');
  return `${base}/${locale}/${cleanPath}`;
}

export function getAbsoluteLocalizedPath(path: string, locale: Locale): string {
  const site = (import.meta.env.SITE || '').replace(/\/$/, '');
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const cleanPath = path.replace(/^\/?/, '');
  return `${site}${base}/${locale}/${cleanPath}`;
}

export function getAlternateLocale(locale: Locale): Locale {
  return locale === 'ko' ? 'en' : 'ko';
}

export function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return locale === 'en'
    ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
