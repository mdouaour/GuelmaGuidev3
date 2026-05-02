'use client'

import { usePathname, Link } from '@/i18n/navigation'
import { Home, Compass, Calendar, Sparkles, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/context/AuthContext'

const navItems = [
  { key: 'home', path: '/', icon: Home },
  { key: 'discover', path: '/discover', icon: Compass },
  { key: 'activities', path: '/activities', icon: Calendar },
  { key: 'ai_guide', path: '/ai', icon: Sparkles },
  { key: 'profile', path: '/profile', icon: User },
]

export default function BottomNav() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const { user } = useAuth()

  const dynamicNavItems = navItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/80 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around">
        {dynamicNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path))
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex h-16 w-full flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'border-t-2 border-[#2E7D32] text-[#2E7D32]' : 'text-slate-500'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium leading-none">
                {t(item.key)}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
