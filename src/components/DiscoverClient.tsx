'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import MapClient from '@/components/MapClient'
import FadeInSection from '@/components/FadeInSection'
import { buildPlacePath, getPlaces, type Place, type PaginatedResponse } from '@/lib/api'
import { firstImageOrCategory } from '@/lib/visuals'
import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter, Link } from '@/i18n/navigation'
import PageSkeleton from '@/components/skeletons/PageSkeleton'
import { getLocalizedName, getLocalizedDescription } from '@/lib/localization'
import PlaceCard from '@/components/PlaceCard'

const categories = ['all', 'forest', 'culture', 'nature', 'sports', 'relaxation', 'thermal_baths'] as const
const limit = 12

interface DiscoverClientProps {
  initialData: PaginatedResponse<Place>
}

export default function DiscoverClient({ initialData }: DiscoverClientProps) {
  const t = useTranslations('discover')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('keyword') ?? '')
  const [suggestions, setSuggestions] = useState<Place[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [theme, setTheme] = useState(searchParams.get('theme') ?? '')
  const [category, setCategory] = useState<(typeof categories)[number]>((searchParams.get('category') as (typeof categories)[number]) ?? 'all')
  const [page, setPage] = useState(Number(searchParams.get('page') ?? '1'))
  
  const [places, setPlaces] = useState<Place[]>(initialData.results)
  const [total, setTotal] = useState(initialData.total)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Debounced suggestions
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSuggesting(true)
      try {
        const params = new URLSearchParams({
          keyword: query.trim(),
          limit: '5'
        })
        const response = await getPlaces(params)
        setSuggestions(response.results)
      } catch (e) {
        console.error(e)
      } finally {
        setIsSuggesting(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (query.trim()) params.set('keyword', query.trim())
    if (theme.trim()) params.set('theme', theme.trim())
    if (category !== 'all') params.set('category', category)
    if (page > 1) params.set('page', String(page))
    
    const queryString = params.toString()
    router.push(`/discover${queryString ? `?${queryString}` : ''}`, { scroll: false })
  }, [category, page, query, theme, router])

  // Fetch data when filters change (client-side transitions)
  useEffect(() => {
    let isMounted = true
    // Skip first load since we have initialData
    const currentParams = {
        page: searchParams.get('page') ?? '1',
        keyword: searchParams.get('keyword') ?? '',
        category: searchParams.get('category') ?? 'all',
        theme: searchParams.get('theme') ?? ''
    }

    if (String(page) === currentParams.page && 
        query === currentParams.keyword &&
        category === currentParams.category &&
        theme === currentParams.theme) {
       return
    }

    const loadPlaces = async () => {
      setIsLoading(true)
      setError(null)
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })
      if (query.trim()) params.set('keyword', query.trim())
      if (theme.trim()) params.set('theme', theme.trim())
      if (category !== 'all') params.set('category', category)

      try {
        const response = await getPlaces(params)
        if (!isMounted) return
        setPlaces(response.results)
        setTotal(response.total)
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Failed to load places')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadPlaces()
    return () => { isMounted = false }
  }, [category, page, query, theme, searchParams])

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const mapMarkers = useMemo(
    () =>
      places.map((place) => ({
        id: String(place.id),
        title: getLocalizedName(place, locale),
        imageUrl: firstImageOrCategory(place.images, place.category),
        category: place.category,
        description: `${place.category} · ${place.theme}`,
        coordinates: { lat: place.latitude, lng: place.longitude },
        mapsUrl: `https://maps.google.com/?q=${place.latitude},${place.longitude}`,
        detailsUrl: buildPlacePath(place),
      })),
    [places, locale],
  )

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8">
      <FadeInSection>
        <header className="rtl:text-right">
          <h1 className="text-2xl font-semibold text-slate-900">{t('title')}</h1>
          <p className="mt-1 text-sm text-slate-600">{t('desc')}</p>
        </header>

        <div className="tour-card mt-4 grid gap-3 p-4 sm:grid-cols-3">
          <div className="relative">
            <input
              value={query}
              onChange={(event) => {
                setPage(1)
                setQuery(event.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                // Delay so click on suggestion registers
                setTimeout(() => setShowSuggestions(false), 200)
              }}
              placeholder={t('search_keyword')}
              className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#2E7D32] rtl:text-right"
            />
            {showSuggestions && (suggestions.length > 0 || isSuggesting) && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-emerald-100 bg-white shadow-xl">
                 {isSuggesting && query.length >= 2 && (
                    <div className="flex items-center justify-center p-4">
                       <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2E7D32] border-t-transparent" />
                    </div>
                 )}
                 {!isSuggesting && suggestions.map(s => (
                   <button
                     key={s.id}
                     onClick={() => {
                       setQuery(s.name_en || s.name || '')
                       setPage(1)
                       setShowSuggestions(false)
                     }}
                     className="flex w-full flex-col p-3 text-left hover:bg-slate-50 rtl:text-right"
                   >
                     <span className="text-sm font-bold text-slate-900">{getLocalizedName(s, locale)}</span>
                     <span className="text-xs text-slate-500 capitalize">{s.category} · {s.theme}</span>
                   </button>
                 ))}
              </div>
            )}
          </div>
          <input
            value={theme}
            onChange={(event) => {
              setPage(1)
              setTheme(event.target.value)
            }}
            placeholder={t('search_theme')}
            className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#2E7D32] rtl:text-right"
          />
          <select
            value={category}
            onChange={(event) => {
              setPage(1)
              setCategory(event.target.value as (typeof categories)[number])
            }}
            className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#2E7D32] rtl:text-right"
          >
            {categories.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </FadeInSection>

      <section className="mt-5 grid gap-6 lg:grid-cols-3">
        <FadeInSection className="lg:col-span-1">
          <article className="tour-card p-3 rtl:text-right">
            <h2 className="text-sm font-semibold text-[#2E7D32]">{t('map')}</h2>
            <div className="mt-2 h-[420px] overflow-hidden rounded-xl border border-emerald-100">
              <MapClient markers={mapMarkers} zoom={12} />
            </div>
          </article>
        </FadeInSection>

        <article className="lg:col-span-2">
          {isLoading ? <PageSkeleton /> : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {!isLoading && (
            <div className="grid gap-4 sm:grid-cols-2">
              {places.map((place) => (
                <FadeInSection key={place.id}>
                  <PlaceCard place={place} />
                </FadeInSection>
              ))}
            </div>
          )}
          {places.length === 0 && !isLoading ? (
            <p className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              {t('no_results')}
            </p>
          ) : null}
        </article>
      </section>

      <div className="tour-card mt-6 flex items-center justify-between p-4 text-sm text-slate-700">
        <p>
          {t('page')} {page} / {totalPages} · {t('total')} {total}
        </p>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((previous) => Math.max(1, previous - 1))}
            className="rounded-xl border border-emerald-200 px-3 py-2 disabled:opacity-50"
          >
            {t('prev')}
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
            className="rounded-xl border border-emerald-200 px-3 py-2 disabled:opacity-50"
          >
            {t('next')}
          </button>
        </div>
      </div>
    </div>
  )
}
