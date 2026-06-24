import { getRequestConfig } from 'next-intl/server';

const locales = ['ar', 'en', 'fr'];

export default getRequestConfig(async ({ locale }) => {
  // Locale might be undefined in Next.js 16 proxy context
  // Fall back to 'en' if not provided
  const resolvedLocale = locale && locales.includes(locale as string) ? locale : 'en';

  try {
    const module = await import(`../../messages/${resolvedLocale}.json`);
    return {
      locale: resolvedLocale,
      messages: module.default
    };
  } catch {
    return {
      locale: resolvedLocale,
      messages: {}
    };
  }
});
