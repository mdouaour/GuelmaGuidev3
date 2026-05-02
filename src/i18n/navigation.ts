import { createNavigation } from 'next-intl/navigation';

export const locales = ['en', 'ar', 'fr'] as const;
export const localePrefix = 'always'; // Default

export const { Link, redirect, usePathname, useRouter } =
  createNavigation({ locales, localePrefix });
