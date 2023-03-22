const allLocales = ['en', 'nl', 'de', 'fr', 'it', 'sv', 'no', 'es', 'da', 'ru', 'pl'];

export function parseLocales(locales: string[]): string[] {
  if (locales.includes('all')) {
    return allLocales;
  }

  return locales.filter(locale => allLocales.includes(locale));
}
