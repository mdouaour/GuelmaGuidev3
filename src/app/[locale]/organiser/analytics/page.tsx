'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { BarChart3, Users, Eye, TrendingUp, AlertCircle, Crown, ArrowLeft } from 'lucide-react'
import { getOrganiserAnalytics, type OrganiserAnalytics } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import FadeInSection from '@/components/FadeInSection'

export default function OrganiserAnalyticsPage() {
  const t = useTranslations('organiser_analytics')
  const { user, isAuthLoading } = useAuth()
  const [data, setData] = useState<OrganiserAnalytics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (isAuthLoading) return
      if (!user) {
        setIsLoading(false)
        return
      }

      if (!user.organiser_pro && user.role !== 'admin') {
        setError('Pro subscription required')
        setIsLoading(false)
        return
      }

      try {
        const stats = await getOrganiserAnalytics()
        setData(stats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [user, isAuthLoading])

  if (isLoading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2E7D32] border-t-transparent" />
    </div>
  )

  if (!user || (!user.organiser_pro && user.role !== 'admin')) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-32 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-[#2E7D32]">
           <Crown size={40} />
        </div>
        <h1 className="mb-4 text-3xl font-black text-slate-900">{t('restricted_title')}</h1>
        <p className="mb-8 text-slate-500">{t('restricted_desc')}</p>
        <Link href="/organiser/pro" className="inline-block rounded-2xl bg-[#2E7D32] px-8 py-4 font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95">
          {t('upgrade_cta')}
        </Link>
      </div>
    )
  }

  const totals = data.reduce((acc, curr) => ({
    views: acc.views + curr.views,
    registrations: acc.registrations + curr.registrations
  }), { views: 0, registrations: 0 })

  const overallConversion = totals.views > 0 ? (totals.registrations / totals.views) * 100 : 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
         <div>
            <Link href="/profile" className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-[#2E7D32]">
              <ArrowLeft size={16} /> {t('back_to_profile')}
            </Link>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <BarChart3 className="text-[#2E7D32]" />
              {t('title')}
            </h1>
         </div>
         <div className="hidden md:block">
            <div className="flex items-center gap-2 rounded-2xl bg-white p-2 pr-4 shadow-sm border border-slate-100">
               <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <Crown size={20} />
               </div>
               <div className="text-xs">
                  <p className="font-bold text-slate-900">PRO Organiser</p>
                  <p className="text-slate-400">Active membership</p>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
         {[
           { label: t('total_views'), value: totals.views.toLocaleString(), icon: <Eye size={20} />, color: 'blue' },
           { label: t('total_registrations'), value: totals.registrations.toLocaleString(), icon: <Users size={20} />, color: 'emerald' },
           { label: t('conversion_rate'), value: `${overallConversion.toFixed(1)}%`, icon: <TrendingUp size={20} />, color: 'purple' },
         ].map((stat, i) => (
           <motion.div
             key={i}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.1 }}
             className="p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm"
           >
              <div className={`p-3 rounded-2xl w-fit mb-4 bg-${stat.color}-50 text-${stat.color}-600`}>
                 {stat.icon}
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900">{stat.value}</p>
           </motion.div>
         ))}
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-6">{t('activity_breakdown')}</h2>
      
      {data.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-slate-100 p-12 text-center">
           <BarChart3 className="mx-auto text-slate-200 mb-4" size={48} />
           <p className="text-slate-500 font-medium">{t('no_activities_yet')}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {data.map((item, idx) => (
            <motion.div
              key={item.activity_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group p-6 rounded-3xl bg-white border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all flex flex-wrap items-center justify-between gap-6"
            >
               <div className="flex-1 min-w-[200px]">
                  <h3 className="font-bold text-slate-900 group-hover:text-[#2E7D32] transition-colors">{item.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">ID: {item.activity_id}</p>
               </div>
               
               <div className="flex items-center gap-8">
                  <div className="text-center">
                     <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">{t('views')}</p>
                     <p className="font-bold text-slate-900">{item.views}</p>
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">{t('joins')}</p>
                     <p className="font-bold text-slate-900">{item.registrations}</p>
                  </div>
                  <div className="text-center bg-slate-50 px-4 py-2 rounded-2xl min-w-[100px]">
                     <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">{t('conversion')}</p>
                     <p className="font-black text-emerald-600">{item.conversion_rate}%</p>
                  </div>
               </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
