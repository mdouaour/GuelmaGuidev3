'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { User, Mail, ShieldCheck, ExternalLink, Crown, BarChart3, Settings, LogOut, Calendar } from 'lucide-react'

export default function ProfilePage() {
  const t = useTranslations('profile')
  const { user, logout, isAuthLoading } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } catch {
      setIsLoggingOut(false)
    }
  }

  if (isAuthLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2E7D32] border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-6 px-4 py-24 text-center">
        <div className="rounded-full bg-slate-100 p-6 shadow-inner">
          <User size={48} className="text-slate-300" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('login_required')}</h1>
          <p className="mt-2 text-slate-500">{t('login_desc')}</p>
        </div>
        <Link
          href="/auth"
          className="rounded-2xl bg-[#2E7D32] px-12 py-4 font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          {t('login_btn')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center text-center">
          <div className="relative group">
            <div className="h-32 w-32 overflow-hidden rounded-[40px] border-4 border-white bg-slate-100 shadow-2xl transition-transform group-hover:scale-105">
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt={user.full_name || ''} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400 bg-slate-50">
                  <User size={48} strokeWidth={1} />
                </div>
              )}
            </div>
            {user.organiser_pro && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-amber-500 shadow-xl ring-4 ring-white"
              >
                 <Crown size={20} fill="currentColor" />
              </motion.div>
            )}
          </div>
          
          <div className="mt-6 flex flex-col items-center">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{user.full_name || user.email.split('@')[0]}</h1>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-200">
                {user.role}
              </span>
              {user.organizer_verified && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 border border-emerald-100">
                  <ShieldCheck size={12} /> {t('verified_badge')}
                </span>
              )}
              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700 border border-amber-100">
                <BarChart3 size={12} /> {t('points_label', { points: user.points })}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mt-16 grid gap-8 md:grid-cols-2">
        <div className="space-y-8">
          <section className="tour-card p-8 bg-white">
            <h2 className="mb-6 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('account_info')}</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                   <Mail size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">{t('email')}</p>
                  <p className="text-sm font-bold text-slate-700">{user.email}</p>
                </div>
              </div>
            </div>
          </section>

          {(user.role === 'organizer' || user.role === 'admin') && (
            <section className="tour-card overflow-hidden border-0 shadow-xl">
               <div className={`p-8 ${user.organiser_pro ? 'bg-slate-900 text-white' : 'bg-emerald-600 text-white'}`}>
                  <div className="flex items-center justify-between gap-4 mb-6">
                     <h2 className={`text-[10px] font-black uppercase tracking-widest ${user.organiser_pro ? 'text-amber-400' : 'text-emerald-100'}`}>
                        {user.organiser_pro ? t('organiser_pro_label') : t('organiser_pro_desc')}
                     </h2>
                     <Crown size={24} className={user.organiser_pro ? 'text-amber-500' : 'text-emerald-300'} />
                  </div>
                  
                  <div className="space-y-4">
                     {user.organiser_pro ? (
                       <>
                          <div className="mb-6">
                           <p className="text-2xl font-black mb-1">{t('status_active')}</p>
                              <p className="text-xs text-slate-400">{t('benefits_until', { date: new Date(user.pro_expires_at!).toLocaleDateString() })}</p>
                          </div>
                          <Link href="/organiser/analytics" className="flex items-center justify-between rounded-2xl bg-white/10 p-4 font-bold transition-all hover:bg-white/20 active:scale-95">
                              <span className="flex items-center gap-3"><BarChart3 size={20} /> {t('view_insights')}</span>
                             <ExternalLink size={16} />
                          </Link>
                           <Link href="/organiser/pro" className="flex items-center justify-center p-3 text-xs font-bold text-slate-400 hover:text-white transition-colors">
                              {t('manage_subscription')}
                           </Link>
                       </>
                     ) : (
                       <>
                           <p className="text-lg font-bold leading-tight mb-6">{t('upgrade_pro_desc')}</p>
                           <Link href="/organiser/pro" className="flex items-center justify-between rounded-2xl bg-white p-4 font-bold text-emerald-700 shadow-lg shadow-emerald-900/20 transition-all hover:translate-y-[-2px] active:scale-95">
                              <span className="flex items-center gap-3"><Crown size={20} /> {t('upgrade_pro')}</span>
                             <ExternalLink size={16} />
                          </Link>
                       </>
                     )}
                  </div>
               </div>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Link href="/my-activities" className="tour-card group flex items-center justify-between p-8 transition-all hover:translate-y-[-4px] hover:shadow-xl hover:border-emerald-200">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-orange-50 p-4 text-orange-600 transition-colors group-hover:bg-orange-100">
                <Calendar size={28} />
              </div>
              <div>
                <p className="font-black text-slate-900 group-hover:text-[#2E7D32] transition-colors">{t('my_activities_link')}</p>
                <p className="text-xs text-slate-500">{t('my_activities_desc')}</p>
              </div>
            </div>
            <ExternalLink size={18} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </Link>

          <Link href="/activities" className="tour-card group flex items-center justify-between p-8 transition-all hover:translate-y-[-4px] hover:shadow-xl hover:border-emerald-200">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-[#2E7D32]/10 p-4 text-[#2E7D32] transition-colors group-hover:bg-[#2E7D32]/20">
                <Settings size={28} />
              </div>
              <div>
                <p className="font-black text-slate-900 group-hover:text-[#2E7D32] transition-colors">{t('manage_events_link')}</p>
                <p className="text-xs text-slate-500">{t('manage_events_desc')}</p>
              </div>
            </div>
            <ExternalLink size={18} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </Link>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="mt-4 flex w-full items-center justify-center gap-3 p-6 text-sm font-black uppercase tracking-widest text-rose-500 transition-all hover:bg-rose-50 rounded-[32px] disabled:opacity-50 group"
          >
            {isLoggingOut ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
            ) : (
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            )}
            {t('logout_btn')}
          </button>
        </div>
      </div>
    </div>
  )
}
