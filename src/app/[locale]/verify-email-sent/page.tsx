'use client'

import { type FormEvent, Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import FadeInSection from '@/components/FadeInSection'
import { resendVerificationEmail } from '@/lib/api'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

function VerifyEmailSentContent() {
  const t = useTranslations('verify_email')
  const authT = useTranslations('auth')
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const [resendEmail, setResendEmail] = useState(email)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onResend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!resendEmail) return
    setStatus('sending')
    setErrorMessage(null)
    try {
      await resendVerificationEmail(resendEmail)
      setStatus('sent')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unexpected error')
      setStatus('error')
    }
  }

  return (
    <>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          {t('sent_title')}
        </h1>
        <p className="text-sm text-slate-600">
          {t('sent_desc', { email })}
        </p>
      </header>

      <section className="tour-card mt-6 p-5 text-sm text-slate-700">
        <p className="font-medium text-slate-900">
          {authT('btn_resend')}
        </p>
        <p className="mt-1 text-slate-600">
          {t('resend')}
        </p>

        {status === 'sent' ? (
          <p className="mt-3 text-emerald-700">
            {authT('resent_success')}
          </p>
        ) : (
          <form onSubmit={onResend} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="email@example.com"
              required
              className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#2E7D32] sm:flex-1"
            />
            <button
              type="submit"
              disabled={status === 'sending'}
              className="rounded-xl bg-[#2E7D32] px-4 py-3 text-sm font-medium text-white tour-hover disabled:opacity-50"
            >
              {status === 'sending'
                ? authT('btn_sending')
                : authT('btn_resend')}
            </button>
          </form>
        )}

        {errorMessage ? <p className="mt-2 text-sm text-rose-600">{errorMessage}</p> : null}
      </section>

      <div className="mt-4 text-sm text-slate-600">
        <Link href="/auth" className="text-[#2E7D32] hover:underline">
          {t('back_to_auth')}
        </Link>
      </div>
    </>
  )
}

export default function VerifyEmailSentPage() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8">
      <FadeInSection>
        <Suspense>
          <VerifyEmailSentContent />
        </Suspense>
      </FadeInSection>
    </div>
  )
}
