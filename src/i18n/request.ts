import { getRequestConfig } from 'next-intl/server';

const locales = ['ar', 'en', 'fr'];

export default getRequestConfig(async ({ locale }) => {
  // Locale might be undefined in Next.js 16 proxy context
  // Fall back to 'ar' (Arabic) since GuelmaGuide targets Algerian/Arabic users
  const resolvedLocale = locale && locales.includes(locale as string) ? locale : 'ar';

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
