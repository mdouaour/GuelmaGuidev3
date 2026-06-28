'use client'

import { type FormEvent, useState } from 'react'
import { MapPin, Search, UserCircle, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/context/AuthContext'
import { useTranslations, useLocale } from 'next-intl'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import NotificationDropdown from './NotificationDropdown'

const links = [
  { href: '/discover', key: 'discover' },
  { href: '/wishlist', key: 'wishlist' },
  { href: '/activities', key: 'activities' },
  { href: '/ai', key: 'ai_guide' },
  { href: '/community', key: 'community' },
]

export default function Navbar() {
  const t = useTranslations('nav')
  const authT = useTranslations('auth')
  const searchT = useTranslations('search')
  const locale = useLocale()
  const { user, logout, isAuthLoading } = useAuth()
  const { theme, setTheme } = useTheme()
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
    <header className="sticky top-0 z-40 border-b border-emerald-100/80 dark:border-emerald-900/30 bg-background/95 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold text-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          <span>GuelmaGuide 🌿</span>
        </Link>

        <div className="hidden items-center justify-start gap-1 text-sm text-muted md:flex md:flex-1 md:justify-center">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-xl px-3 py-2 hover:bg-[#eaf6ef] dark:hover:bg-emerald-900/30 hover:text-foreground text-primary font-medium">
              {t(link.key)}
            </Link>
          ))}
        </div>

        <div className="order-2 ms-auto flex items-center gap-2 text-sm text-muted md:order-3 rtl:ms-auto rtl:me-0">
          <form onSubmit={onSearch} className="hidden items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-card-bg px-2 py-1.5 sm:flex">
            <Search className="h-4 w-4 text-muted" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchT('placeholder')}
              className="w-28 bg-transparent text-sm text-foreground outline-none md:w-40 rtl:text-right"
            />
          </form>
          {!isAuthLoading ? (
            user ? (
              <>
                <NotificationDropdown locale={locale} />
                <Link href="/profile" className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 dark:border-emerald-800 px-3 py-2 hover:border-primary">
                  <UserCircle className="h-4 w-4" />
                  <span>{authT('profile')}</span>
                </Link>
                <button onClick={logout} className="rounded-xl border border-emerald-200 dark:border-emerald-800 px-3 py-2 hover:border-primary">
                  {authT('logout')}
                </button>
              </>
            ) : (
              <Link href="/auth" className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 dark:border-emerald-800 px-3 py-2 hover:border-primary">
                <UserCircle className="h-4 w-4" />
                {authT('login')}
              </Link>
            )
          ) : null}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-xl border border-emerald-200 dark:border-emerald-800 p-2 hover:border-primary"
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 hidden dark:block" />
            <Moon className="h-4 w-4 block dark:hidden" />
          </button>
          <div className="ms-1 flex items-center gap-1 rounded-full border border-emerald-200 dark:border-emerald-800 bg-card-bg p-1 text-xs rtl:ms-1 rtl:me-0">
            <button
              onClick={() => changeLocale('en')}
              className={`rounded-full px-2 py-1 ${locale === 'en' ? 'bg-primary text-white' : 'text-muted'}`}
            >
              EN
            </button>
            <button
              onClick={() => changeLocale('fr')}
              className={`rounded-full px-2 py-1 ${locale === 'fr' ? 'bg-primary text-white' : 'text-muted'}`}
            >
              FR
            </button>
            <button
              onClick={() => changeLocale('ar')}
              className={`rounded-full px-2 py-1 ${locale === 'ar' ? 'bg-primary text-white' : 'text-muted'}`}
            >
              AR
            </button>
          </div>
        </div>
      </nav>
    </header>
  )
}
