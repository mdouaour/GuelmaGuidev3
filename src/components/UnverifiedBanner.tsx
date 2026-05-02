'use client'

import { Link } from '@/i18n/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from 'next-intl'

export default function UnverifiedBanner() {
  const t = useTranslations('unverified_banner')
  const { user, isAuthLoading } = useAuth()

  if (isAuthLoading || !user || user.email_verified) return null

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-800">
      {t('text')}{' '}
      <Link href="/auth" className="font-medium underline hover:text-amber-900">
        {t('link')}
      </Link>
    </div>
  )
}
