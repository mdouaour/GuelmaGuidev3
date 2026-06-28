'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export default function PlaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('error_boundary')

  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-10 w-10">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-foreground">{t('title')}</h2>
      <p className="mt-2 max-w-md text-muted">{t('description')}</p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {t('retry')}
        </button>
        <Link
          href="/discover"
          className="rounded-xl border border-emerald-200 dark:border-emerald-800 px-6 py-2.5 text-sm font-semibold text-foreground transition-opacity hover:opacity-90"
        >
          {t('back')}
        </Link>
      </div>
    </div>
  )
}
