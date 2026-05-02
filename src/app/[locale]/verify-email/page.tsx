'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import FadeInSection from '@/components/FadeInSection'
import { verifyEmail } from '@/lib/api'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

function VerifyEmailContent() {
  const t = useTranslations('verify_email')
  const authT = useTranslations('auth')
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage(t('missing_token'))
      return
    }

    verifyEmail(token)
      .then((data) => {
        setMessage(data.message)
        setStatus('success')
      })
      .catch((err) => {
        setMessage(err instanceof Error ? err.message : 'Verification failed.')
        setStatus('error')
      })
    // Run only on mount; token is stable for this page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          {t('title')}
        </h1>
      </header>

      <section className="tour-card mt-6 p-5 text-sm">
        {status === 'loading' ? (
          <p className="text-slate-600">
            {t('loading')}
          </p>
        ) : status === 'success' ? (
          <>
            <p className="font-medium text-emerald-700">
              {t('success')}
            </p>
            {message ? <p className="mt-1 text-slate-600">{message}</p> : null}
            <Link
              href="/auth"
              className="mt-3 inline-block rounded-xl bg-[#2E7D32] px-4 py-2 text-white tour-hover"
            >
              {authT('sign_in')}
            </Link>
          </>
        ) : (
          <>
            <p className="font-medium text-rose-600">
              {t('failed')}
            </p>
            {message ? <p className="mt-1 text-slate-600">{message}</p> : null}
            <Link
              href="/verify-email-sent"
              className="mt-3 inline-block rounded-xl border border-emerald-200 px-4 py-2 text-slate-700 hover:border-[#2E7D32]"
            >
              {t('resend')}
            </Link>
          </>
        )}
      </section>
    </>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8">
      <FadeInSection>
        <Suspense>
          <VerifyEmailContent />
        </Suspense>
      </FadeInSection>
    </div>
  )
}
