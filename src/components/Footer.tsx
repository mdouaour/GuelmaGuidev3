'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export default function Footer() {
  const t = useTranslations('footer')
  const navT = useTranslations('nav')

  return (
    <footer className="border-t border-emerald-100 bg-[#FAF7F2]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between rtl:text-right">
        <p className="rtl:text-right">{t('tagline')}</p>
        <div className="flex items-center gap-2">
          <Link href="/discover" className="rounded-lg px-2 py-1 hover:bg-[#eaf6ef] hover:text-slate-900">{navT('discover')}</Link>
          <Link href="/activities" className="rounded-lg px-2 py-1 hover:bg-[#eaf6ef] hover:text-slate-900">{navT('activities')}</Link>
          <Link href="/ai" className="rounded-lg px-2 py-1 hover:bg-[#eaf6ef] hover:text-slate-900">{navT('ai_guide')}</Link>
        </div>
      </div>
    </footer>
  )
}
