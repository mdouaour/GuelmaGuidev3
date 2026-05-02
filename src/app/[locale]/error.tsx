'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-12 w-12"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.731 0 2.814-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Application Error</h1>
      <p className="mt-4 max-w-lg text-lg text-slate-600">
        We&apos;re sorry, but something went wrong while loading this page.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={() => reset()}
          className="rounded-xl bg-[#2E7D32] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1B5E20] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7D32]"
        >
          Try again
          <span className="ml-2">↻</span>
        </button>
        <Link
          href="/"
          className="rounded-xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
        >
          Go back home
        </Link>
      </div>
      {error.digest && (
        <p className="mt-8 text-xs font-mono text-slate-400">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  )
}
