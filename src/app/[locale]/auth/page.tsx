'use client'

import { type FormEvent, useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import FadeInSection from '@/components/FadeInSection'
import { useAuth } from '@/context/AuthContext'
import { resendVerificationEmail } from '@/lib/api'
import PasswordStrengthBar from '@/components/PasswordStrengthBar'
import { zxcvbn } from 'zxcvbn-typescript'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'

const DEMO_USER_EMAIL = process.env.NEXT_PUBLIC_DEMO_USER_EMAIL
const DEMO_USER_PASSWORD = process.env.NEXT_PUBLIC_DEMO_USER_PASSWORD

function AuthLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-1/4 rounded bg-slate-200" />
        <div className="h-4 w-3/4 rounded bg-slate-200" />
      </div>
      <div className="tour-card h-40 w-full bg-slate-100" />
    </div>
  )
}

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path
      fill="#4285F4"
      d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.8 2.7v2.24h2.91c1.7-1.57 2.69-3.89 2.69-6.57z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.24c-.8.54-1.84.87-3.05.87-2.34 0-4.32-1.58-5.03-3.71H.95v2.3C2.43 15.89 5.5 18 9 18z"
    />
    <path
      fill="#FBBC05"
      d="M3.97 10.74c-.18-.54-.28-1.12-.28-1.74s.1-1.2.28-1.74V4.96H.95C.35 6.17 0 7.55 0 9s.35 2.83.95 4.04l3.02-2.3z"
    />
    <path
      fill="#EA4335"
      d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0 5.5 0 2.43 2.11.95 4.96l3.02 2.3c.71-2.13 2.69-3.71 5.03-3.71z"
    />
  </svg>
)

function AuthContent() {
  const t = useTranslations('auth')
  const { user, loginUser, registerUser, isAuthLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  
  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      setAuthError(t('session_expired'))
    }
  }, [searchParams, t])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const passwordScore = useMemo(() => {
    if (mode !== 'register' || !password) return 0
    return zxcvbn(password).score
  }, [password, mode])

  const canSubmit = useMemo(() => {
    if (isSubmitting) return false
    if (mode === 'register') {
      return passwordScore >= 2
    }
    return true
  }, [isSubmitting, mode, passwordScore])

  const onSubmitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthError(null)
    setIsSubmitting(true)
    try {
      if (mode === 'login') {
        await loginUser(email, password)
      } else {
        const result = await registerUser(email, password)
        if (result.needsVerification) {
          router.push(`/verify-email-sent?email=${encodeURIComponent(email)}`)
          return
        }
      }
      setPassword('')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unexpected error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onResendVerification = async () => {
    if (!user) return
    setResendStatus('sending')
    try {
      await resendVerificationEmail(user.email)
      setResendStatus('sent')
    } catch {
      setResendStatus('error')
    }
  }

  return (
    <FadeInSection>
      <header className="space-y-2 rtl:text-right">
        <h1 className="text-2xl font-semibold text-slate-900">{t('page_title')}</h1>
        <p className="text-sm text-slate-600">
          {t('page_desc')}
        </p>
      </header>

      {DEMO_USER_EMAIL && DEMO_USER_PASSWORD ? (
        <section className="tour-card mt-4 p-4 text-sm text-slate-700 rtl:text-right">
          <p className="font-semibold text-slate-900">{t('demo_title')}</p>
          <p className="mt-1">
            Email: <span className="font-mono">{DEMO_USER_EMAIL}</span>
          </p>
          <button
            onClick={() => {
              setMode('login')
              setEmail(DEMO_USER_EMAIL)
              setPassword(DEMO_USER_PASSWORD)
            }}
            className="mt-2 rounded-xl border border-emerald-200 px-3 py-2 text-xs hover:border-[#2E7D32]"
          >
            {t('demo_btn')}
          </button>
        </section>
      ) : null}

      {isAuthLoading ? (
        <section className="tour-card mt-6 p-5 space-y-4 animate-pulse">
          <div className="h-4 w-1/3 rounded bg-slate-200" />
          <div className="h-10 w-full rounded-xl bg-slate-100" />
        </section>
      ) : user ? (
        <section className="tour-card mt-6 p-5 text-sm text-slate-700 rtl:text-right">
          <p className="font-medium text-slate-900">
            {t('logged_in_as', { email: user.email })}
          </p>
          {!user.email_verified ? (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 rtl:text-right">
              <p className="font-medium">
                {t('email_not_verified')}
              </p>
              <p className="mt-1">
                {t('verification_sent')}
              </p>
              {resendStatus === 'sent' ? (
                <p className="mt-2 text-emerald-700">
                  {t('resent_success')}
                </p>
              ) : (
                <button
                  onClick={onResendVerification}
                  disabled={resendStatus === 'sending'}
                  className="mt-2 rounded-xl border border-amber-300 px-3 py-1.5 text-xs hover:border-amber-500 disabled:opacity-50"
                >
                  {resendStatus === 'sending'
                    ? t('btn_sending')
                    : t('btn_resend')}
                </button>
              )}
              {resendStatus === 'error' ? (
                <p className="mt-1 text-rose-600">
                  {t('resend_error')}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2 rtl:flex-row-reverse">
            <Link href="/activities" className="rounded-xl bg-[#2E7D32] px-3 py-2 text-white">
              {t('go_to_activities')}
            </Link>
            <Link href="/my-activities" className="rounded-xl border border-emerald-200 px-3 py-2 hover:border-[#2E7D32]">
              {t('my_activities')}
            </Link>
          </div>
        </section>
      ) : (
        <section className="tour-card mt-6 p-5 rtl:text-right">
          <div className="mb-3 flex gap-2 text-sm rtl:flex-row-reverse">
            <button
              onClick={() => setMode('login')}
              className={`rounded-xl px-3 py-2 ${mode === 'login' ? 'bg-[#2E7D32] text-white' : 'border border-emerald-200 text-slate-700'}`}
            >
              {t('login')}
            </button>
            <button
              onClick={() => setMode('register')}
              className={`rounded-xl px-3 py-2 ${mode === 'register' ? 'bg-[#2E7D32] text-white' : 'border border-emerald-200 text-slate-700'}`}
            >
              {t('register')}
            </button>
          </div>
          <form onSubmit={onSubmitAuth} className="grid gap-3 sm:grid-cols-3">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@example.com"
              required
              className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#2E7D32] rtl:text-right"
            />
            <div className="flex flex-col gap-1 sm:col-span-1">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t('password')}
                required
                className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#2E7D32] rtl:text-right"
              />
              {mode === 'register' && <PasswordStrengthBar password={password} />}
            </div>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-xl bg-[#2E7D32] px-4 py-3 text-sm font-medium text-white tour-hover disabled:opacity-50"
            >
              {mode === 'login' ? t('sign_in') : t('create_account')}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">Or</span>
            </div>
          </div>

          <a
            href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google`}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50"
          >
            <GoogleLogo />
            {t('continue_with_google')}
          </a>

          {authError ? <p className="mt-2 text-sm text-rose-600 rtl:text-right">{authError}</p> : null}
        </section>
      ) }
    </FadeInSection>
  )
}

export default function AuthPage() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8">
      <Suspense fallback={<AuthLoadingSkeleton />}>
        <AuthContent />
      </Suspense>
    </div>
  )
}
