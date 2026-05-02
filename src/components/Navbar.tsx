'use client'

import { type FormEvent, useState } from 'react'
import { MapPin, Search, UserCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations, useLocale } from 'next-intl'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import NotificationDropdown from './NotificationDropdown'

const links = [
  { href: '/discover', key: 'discover' },
  { href: '/wishlist', key: 'wishlist' },
  { href: '/activities', key: 'activities' },
  { href: '/ai', key: 'ai_guide' },
]

export default function Navbar() {
  const t = useTranslations('nav')
  const authT = useTranslations('auth')
  const searchT = useTranslations('search')
  const locale = useLocale()
  const { user, logout, isAuthLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState('')

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const keyword = search.trim()
    if (!keyword) {
      router.push('/discover')
      return
    }
    router.push(`/discover?keyword=${encodeURIComponent(keyword)}`)
    setSearch('')
  }

  const changeLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-100/80 bg-[#FAF7F2]/95 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold text-slate-900">
          <MapPin className="h-4 w-4 text-[#2E7D32]" />
          <span>GuelmaGuide 🌿</span>
        </Link>

        <div className="hidden items-center justify-start gap-1 text-sm text-slate-700 md:flex md:flex-1 md:justify-center">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-xl px-3 py-2 hover:bg-[#eaf6ef] hover:text-slate-900 text-[#2E7D32] font-medium">
              {t(link.key)}
            </Link>
          ))}
        </div>

        <div className="order-2 ms-auto flex items-center gap-2 text-sm text-slate-700 md:order-3 rtl:ms-auto rtl:me-0">
          <form onSubmit={onSearch} className="hidden items-center gap-2 rounded-xl border border-emerald-200 bg-white px-2 py-1.5 sm:flex">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchT('placeholder')}
              className="w-28 bg-transparent text-sm text-slate-900 outline-none md:w-40 rtl:text-right"
            />
          </form>
          {!isAuthLoading ? (
            user ? (
              <>
                <NotificationDropdown locale={locale} />
                <Link href="/profile" className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 px-3 py-2 hover:border-[#2E7D32]">
                  <UserCircle className="h-4 w-4" />
                  <span>{authT('profile')}</span>
                </Link>
                <button onClick={logout} className="rounded-xl border border-emerald-200 px-3 py-2 hover:border-[#2E7D32]">
                  {authT('logout')}
                </button>
              </>
            ) : (
              <Link href="/auth" className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 px-3 py-2 hover:border-[#2E7D32]">
                <UserCircle className="h-4 w-4" />
                {authT('login')}
              </Link>
            )
          ) : null}
          <div className="ms-1 flex items-center gap-1 rounded-full border border-emerald-200 bg-white p-1 text-xs rtl:ms-1 rtl:me-0">
            <button
              onClick={() => changeLocale('en')}
              className={`rounded-full px-2 py-1 ${locale === 'en' ? 'bg-[#2E7D32] text-white' : 'text-slate-600'}`}
            >
              EN
            </button>
            <button
              onClick={() => changeLocale('fr')}
              className={`rounded-full px-2 py-1 ${locale === 'fr' ? 'bg-[#2E7D32] text-white' : 'text-slate-600'}`}
            >
              FR
            </button>
            <button
              onClick={() => changeLocale('ar')}
              className={`rounded-full px-2 py-1 ${locale === 'ar' ? 'bg-[#2E7D32] text-white' : 'text-slate-600'}`}
            >
              AR
            </button>
          </div>
        </div>
      </nav>
    </header>
  )
}
