'use client'

import { useEffect, useMemo, useState } from 'react'
import FadeInSection from '@/components/FadeInSection'
import { getMyActivities, type ActivityTicket } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Ticket, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

function MyActivitySkeleton() {
  return (
    <div className="tour-card p-4 animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="h-5 w-1/2 rounded bg-slate-200" />
        <div className="h-5 w-16 rounded-full bg-slate-200" />
      </div>
      <div className="h-4 w-1/3 rounded bg-slate-200" />
    </div>
  )
}

const TWO_HOURS_IN_MS = 2 * 60 * 60 * 1000

export default function MyActivitiesPage() {
  const t = useTranslations('my_activities')
  const authT = useTranslations('auth')
  const { user } = useAuth()
  const [tickets, setTickets] = useState<ActivityTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const loadMyActivities = async () => {
      if (!user) {
        setTickets([])
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        const response = await getMyActivities()
        if (!isMounted) return
        const sorted = [...response].sort(
          (left, right) => new Date(left.activity.date_time).getTime() - new Date(right.activity.date_time).getTime(),
        )
        setTickets(sorted)
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Failed to load your activities')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadMyActivities()
    return () => {
      isMounted = false
    }
  }, [user])

  const hasSoonActivity = useMemo(() => {
    const now = Date.now()
    return tickets.some(({ activity }) => {
      const eventTime = new Date(activity.date_time).getTime()
      return eventTime > now && eventTime - now <= TWO_HOURS_IN_MS
    })
  }, [tickets])

  return (
    <div className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8">
      <FadeInSection>
        <header className="space-y-2 rtl:text-right">
          <h1 className="text-2xl font-semibold text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-600">
            {t('desc')}
          </p>
        </header>

        {!user ? (
          <section className="tour-card mt-4 p-4 text-sm text-slate-700 rtl:text-right">
            <p>{t('login_required')}</p>
            <Link href="/auth" className="mt-2 inline-flex rounded-xl bg-[#2E7D32] px-3 py-2 text-white">
              {authT('login')}
            </Link>
          </section>
        ) : null}

        {user && hasSoonActivity ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 rtl:text-right">
            {t('coming_soon')}
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-5 space-y-3">
            {[...Array(3)].map((_, i) => (
              <MyActivitySkeleton key={i} />
            ))}
          </div>
        ) : null}
        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

        {user && !isLoading && !error ? (
          <section className="mt-5 space-y-4">
            {tickets.map(({ activity, registration }) => {
              const isUpcoming = new Date(activity.date_time).getTime() > Date.now()
              const isPaid = registration.payment_status === 'paid' || registration.payment_status === 'free'
              
              return (
                <article key={activity.id} className="tour-card p-5 rtl:text-right bg-white relative overflow-hidden group">
                  {isPaid && (
                    <div className="absolute right-0 top-0 h-1 w-full bg-emerald-500" />
                  )}
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                         <h2 className="text-lg font-bold text-slate-900">{activity.title}</h2>
                         {isPaid ? (
                           <CheckCircle2 size={16} className="text-emerald-500" />
                         ) : (
                           <AlertCircle size={16} className="text-amber-500" />
                         )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock size={14} />
                        <span>{new Date(activity.date_time).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 uppercase font-medium tracking-wider">
                         {activity.place_name}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                       <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          isUpcoming ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {isUpcoming ? t('status_upcoming') : t('status_past')}
                      </span>
                      
                      <div className="flex items-center gap-2">
                         {registration.payment_status === 'paid' && (
                           <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                             <Ticket size={12} />
                             {t('ticket_paid')}
                           </div>
                         )}
                         {registration.payment_status === 'pending' && (
                           <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 border border-amber-100">
                             <AlertCircle size={12} />
                             {t('ticket_payment_pending')}
                           </div>
                         )}
                         {registration.payment_status === 'free' && (
                           <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600 border border-slate-200">
                             {t('ticket_free')}
                           </div>
                         )}
                      </div>
                    </div>
                  </div>
                  
                  {!isPaid && registration.payment_status === 'pending' && (
                    <div className="mt-4 pt-4 border-t border-slate-50">
                       <Link 
                        href={`/activities`}
                        className="text-xs font-bold text-[#2E7D32] hover:underline flex items-center gap-1"
                       >
                         {t('complete_payment')} &rarr;
                       </Link>
                    </div>
                  )}
                </article>
              )
            })}
            {tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 rounded-3xl border-2 border-dashed border-slate-100 bg-white">
                 <Ticket size={48} className="text-slate-200 mb-4" />
                 <p className="text-sm font-medium text-slate-500">
                   {t('no_activities')}
                 </p>
                 <Link href="/activities" className="mt-4 text-xs font-bold text-[#2E7D32] bg-emerald-50 px-4 py-2 rounded-xl">
                    {t('browse_activities')}
                 </Link>
              </div>
            ) : null}
          </section>
        ) : null}
      </FadeInSection>
    </div>
  )
}
