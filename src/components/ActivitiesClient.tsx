'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import FadeInSection from '@/components/FadeInSection'
import {
  createActivity,
  getActivities,
  getMyActivities,
  getPlaces,
  joinActivity,
  leaveActivity,
  type Activity,
  type JoinResponse,
  type Place,
} from '@/lib/api'
import { getActivityImage } from '@/lib/visuals'
import { useAuth } from '@/context/AuthContext'
import { Crown } from 'lucide-react'
import ActivitySkeleton from '@/components/skeletons/ActivitySkeleton'
import { useTranslations, useLocale } from 'next-intl'
import { getLocalizedName } from '@/lib/localization'
import { Link } from '@/i18n/navigation'

const limit = 10

function toIsoDateTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString()
}

export default function ActivitiesClient({ initialActivities, initialTotal }: { initialActivities: Activity[], initialTotal: number }) {
  const t = useTranslations('activities')
  const authT = useTranslations('auth')
  const discoverT = useTranslations('discover')
  const locale = useLocale()
  const { user } = useAuth()
  const [dateFilter, setDateFilter] = useState('')
  const [placeFilter, setPlaceFilter] = useState('')
  const [availabilityOnly, setAvailabilityOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [activities, setActivities] = useState<Activity[]>(initialActivities)
  const [total, setTotal] = useState(initialTotal)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [joinedIds, setJoinedIds] = useState<number[]>([])
  const [isSyncingJoined, setIsSyncingJoined] = useState(false)
  const [joiningActivityId, setJoiningActivityId] = useState<number | null>(null)
  const [joinErrorId, setJoinErrorId] = useState<number | null>(null)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [availablePlaces, setAvailablePlaces] = useState<Place[]>([])
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createPlaceId, setCreatePlaceId] = useState('')
  const [createDateTime, setCreateDateTime] = useState('')
  const [createMaxParticipants, setCreateMaxParticipants] = useState('10')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    let isMounted = true
    const loadPlaces = async () => {
      setIsLoadingPlaces(true)
      try {
        const response = await getPlaces(new URLSearchParams({ limit: '100' }))
        if (!isMounted) return
        setAvailablePlaces(response.results)
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Failed to load places')
      } finally {
        if (isMounted) setIsLoadingPlaces(false)
      }
    }
    loadPlaces()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const loadActivities = async () => {
      setIsLoading(true)
      setError(null)
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (dateFilter) params.set('date', dateFilter)
      if (placeFilter.trim()) params.set('place', placeFilter.trim())
      if (availabilityOnly) params.set('availability', 'true')

      try {
        const response = await getActivities(params)
        if (!isMounted) return
        setActivities(response.results)
        setTotal(response.total)
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Failed to load activities')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    if (page !== 1 || dateFilter || placeFilter || availabilityOnly) {
        loadActivities()
    }

    return () => {
      isMounted = false
    }
  }, [availabilityOnly, dateFilter, page, placeFilter])

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const joinedSet = useMemo(() => new Set(joinedIds), [joinedIds])

  useEffect(() => {
    let isMounted = true
    const syncJoinedActivities = async () => {
      if (!user) {
        setJoinedIds([])
        return
      }
      setIsSyncingJoined(true)
      try {
        const joinedActivities = await getMyActivities()
        if (!isMounted) return
        setJoinedIds(joinedActivities.map((ticket) => ticket.activity.id))
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Failed to sync joined activities')
      } finally {
        if (isMounted) setIsSyncingJoined(false)
      }
    }
    syncJoinedActivities()
    return () => {
      isMounted = false
    }
  }, [user])

  const toggleJoin = async (activityId: number) => {
    setJoinErrorId(null)
    if (!user) {
      setJoinErrorId(activityId)
      return
    }
    try {
      const currentlyJoined = joinedSet.has(activityId)
      setJoiningActivityId(activityId)
      
      if (currentlyJoined) {
        await leaveActivity(activityId)
        setJoinedIds((previous) => previous.filter((id) => id !== activityId))
        setActivities((previous) =>
          previous.map((activity) =>
            activity.id === activityId
              ? {
                  ...activity,
                  participants_count: Math.max(0, activity.participants_count - 1),
                }
              : activity,
          ),
        )
      } else {
        const response: JoinResponse = await joinActivity(activityId)
        
        if (response.is_paid && response.checkout_url) {
          window.location.href = response.checkout_url
          return // Redirecting to Stripe
        }
        
        setJoinedIds((previous) =>
          previous.includes(activityId) ? previous : [...previous, activityId],
        )
        setActivities((previous) =>
          previous.map((activity) =>
            activity.id === activityId
              ? {
                  ...activity,
                  participants_count: activity.participants_count + 1,
                }
              : activity,
          ),
        )
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update registration')
    } finally {
      setJoiningActivityId(null)
    }
  }

  const onCreateActivity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) {
      setError(t('login_first'))
      return
    }
    const placeId = Number(createPlaceId)
    const maxParticipants = Number(createMaxParticipants)
    const isoDateTime = toIsoDateTime(createDateTime)
    if (!placeId || !maxParticipants || !isoDateTime) {
      setError(t('check_details'))
      return
    }

    setIsCreating(true)
    setError(null)
    try {
      const created = await createActivity({
        title: createTitle.trim(),
        description: createDescription.trim(),
        place_id: placeId,
        date_time: isoDateTime,
        max_participants: maxParticipants,
      })
      setActivities((previous) => [created, ...previous].slice(0, limit))
      setTotal((previous) => previous + 1)
      setShowCreateForm(false)
      setCreateTitle('')
      setCreateDescription('')
      setCreatePlaceId('')
      setCreateDateTime('')
      setCreateMaxParticipants('10')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create activity')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8">
      <FadeInSection>
        <header className="space-y-2 rtl:text-right">
          <h1 className="text-2xl font-semibold text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-600">
            {t('desc')}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm rtl:flex-row-reverse">
            <Link href="/my-activities" className="rounded-xl border border-emerald-200 px-3 py-2 hover:border-[#2E7D32]">
              {t('my_activities')}
            </Link>
            {!user ? (
              <Link href="/auth" className="rounded-xl bg-[#2E7D32] px-3 py-2 text-white">
                {authT('login')}
              </Link>
            ) : null}
            <button
              onClick={() => {
                if (!user) {
                  setError(t('login_first'))
                  return
                }
                setShowCreateForm((previous) => !previous)
              }}
              className="rounded-xl border border-emerald-200 px-3 py-2 hover:border-[#2E7D32]"
            >
              {t('create_activity')}
            </button>
          </div>
        </header>

        {showCreateForm ? (
          <form onSubmit={onCreateActivity} className="tour-card mt-4 grid gap-3 p-4 sm:grid-cols-2 rtl:text-right">
            <input
              value={createTitle}
              onChange={(event) => setCreateTitle(event.target.value)}
              required
              minLength={3}
              placeholder={t('form_title')}
              className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#2E7D32] rtl:text-right"
            />
            <select
              value={createPlaceId}
              onChange={(event) => setCreatePlaceId(event.target.value)}
              required
              disabled={isLoadingPlaces}
              className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#2E7D32] disabled:opacity-50 rtl:text-right"
            >
              <option value="">
                {isLoadingPlaces
                  ? t('form_loading_places')
                  : t('form_select_place')}
              </option>
              {availablePlaces.map((place) => (
                <option key={place.id} value={String(place.id)}>
                  {getLocalizedName(place, locale)}
                </option>
              ))}
            </select>
            <textarea
              value={createDescription}
              onChange={(event) => setCreateDescription(event.target.value)}
              required
              minLength={10}
              placeholder={t('form_desc')}
              className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#2E7D32] sm:col-span-2 rtl:text-right"
            />
            <input
              type="datetime-local"
              value={createDateTime}
              onChange={(event) => setCreateDateTime(event.target.value)}
              required
              className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#2E7D32] rtl:text-right"
            />
            <input
              type="number"
              min={1}
              value={createMaxParticipants}
              onChange={(event) => setCreateMaxParticipants(event.target.value)}
              required
              placeholder={t('form_max_participants')}
              className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#2E7D32] rtl:text-right"
            />
            <button
              type="submit"
              disabled={isCreating}
              className="rounded-xl bg-[#2E7D32] px-4 py-3 text-sm font-medium text-white tour-hover disabled:opacity-50 sm:col-span-2"
            >
              {isCreating ? t('form_creating') : t('form_save')}
            </button>
          </form>
        ) : null}

        <div className="tour-card mt-4 grid gap-3 p-4 sm:grid-cols-4 rtl:text-right">
          <input
            type="date"
            value={dateFilter}
            onChange={(event) => {
              setPage(1)
              setDateFilter(event.target.value)
            }}
            className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#2E7D32] rtl:text-right"
          />
          <select
            value={placeFilter}
            onChange={(event) => {
              setPage(1)
              setPlaceFilter(event.target.value)
            }}
            disabled={isLoadingPlaces}
            className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#2E7D32] disabled:opacity-50 rtl:text-right"
          >
            <option value="">
              {t('filter_all_places')}
            </option>
            {availablePlaces.map((place) => (
              <option key={place.id} value={String(place.id)}>
                {getLocalizedName(place, locale)}
              </option>
            ))}
          </select>
          <label className="flex min-h-[48px] items-center gap-2 rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-700 rtl:flex-row-reverse">
            <input
              type="checkbox"
              checked={availabilityOnly}
              onChange={(event) => {
                setPage(1)
                setAvailabilityOnly(event.target.checked)
              }}
            />
            {t('filter_available')}
          </label>
        </div>
      </FadeInSection>

      {isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[...Array(6)].map((_, i) => (
            <ActivitySkeleton key={i} />
          ))}
        </div>
      ) : null}
      
      {isSyncingJoined ? (
        <p className="mt-2 text-xs text-slate-500">
          {t('syncing_joined')}
        </p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        {!isLoading && activities.map((activity) => {
          const isJoined = joinedSet.has(activity.id)
          const isFull = activity.participants_count >= activity.max_participants && !isJoined
          return (
            <FadeInSection key={activity.id}>
              <article className={`tour-card tour-hover overflow-hidden ${activity.is_featured ? 'ring-2 ring-amber-400' : ''}`}>
                <div className="relative h-40 w-full">
                  <Image
                    src={getActivityImage(activity.title)}
                    alt={activity.title}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {activity.is_featured && (
                    <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full bg-slate-900 px-2 py-1 text-[10px] font-bold text-amber-500 shadow-lg ring-1 ring-amber-500/50">
                       <Crown size={12} fill="currentColor" />
                       PRO
                    </div>
                  )}
                </div>
                <div className="p-4 rtl:text-right">
                  <h2 className="text-lg font-semibold text-slate-900">{activity.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{activity.description}</p>
                  <p className="mt-2 text-xs text-slate-500">{new Date(activity.date_time).toLocaleString()}</p>
                  <p className="text-xs text-slate-500">
                    {t('label_place')} #{activity.place_id}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {activity.participants_count}/{activity.max_participants} {t('label_participants')}
                  </p>
                  
                  {activity.price_per_ticket && activity.price_per_ticket > 0 ? (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-[#2E7D32]">
                        {activity.price_per_ticket} {activity.currency}
                      </span>
                    </div>
                  ) : (
                    <span className="mt-2 text-xs font-bold text-emerald-600">
                      {t('free')}
                    </span>
                  )}

                  <button
                    onClick={() => toggleJoin(activity.id)}
                    disabled={isFull || joiningActivityId === activity.id}
                    className={`mt-3 w-full min-h-[44px] rounded-xl px-3 py-2 text-sm font-bold shadow-sm transition-all ${
                      isJoined 
                        ? 'border-2 border-[#FF7043] text-[#FF7043] hover:bg-[#FF7043] hover:text-white' 
                        : (activity.price_per_ticket && activity.price_per_ticket > 0)
                          ? 'bg-[#2E7D32] text-white tour-hover ring-1 ring-emerald-600'
                          : 'bg-[#2E7D32] text-white tour-hover'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {joiningActivityId === activity.id
                      ? t('btn_updating')
                      : isJoined
                        ? t('btn_leave')
                        : (activity.price_per_ticket && activity.price_per_ticket > 0)
                          ? `${t('btn_get_ticket')} — ${activity.price_per_ticket} ${activity.currency}`
                          : t('btn_join')}
                  </button>
                  {joinErrorId === activity.id && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">
                      {t('login_to_join')}
                    </p>
                  )}
                </div>
              </article>
            </FadeInSection>
          )
        })}
      </section>

      <div className="tour-card mt-6 flex items-center justify-between p-4 text-sm text-slate-700">
        <p>
          {discoverT('page')} {page} / {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((previous) => Math.max(1, previous - 1))}
            className="rounded-xl border border-emerald-200 px-3 py-2 disabled:opacity-50"
          >
            {discoverT('prev')}
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
            className="rounded-xl border border-emerald-200 px-3 py-2 disabled:opacity-50"
          >
            {discoverT('next')}
          </button>
        </div>
      </div>
    </div>
  )
}
