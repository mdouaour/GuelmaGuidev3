'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import MapClient from '@/components/MapClient'
import FadeInSection from '@/components/FadeInSection'
import { buildPlacePath, getPlaces, createPlace, type Place, type PaginatedResponse } from '@/lib/api'
import { firstImageOrCategory } from '@/lib/visuals'
import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter, Link } from '@/i18n/navigation'
import PageSkeleton from '@/components/skeletons/PageSkeleton'
import { getLocalizedName, getLocalizedDescription } from '@/lib/localization'
import PlaceCard from '@/components/PlaceCard'
import { PlusCircle, MapPin, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { motion, AnimatePresence } from 'motion/react'

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
  const { user } = useAuth()

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

  // Suggest Place Form State
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false)
  const [suggestName, setSuggestName] = useState('')
  const [suggestDesc, setSuggestDesc] = useState('')
  const [suggestLat, setSuggestLat] = useState('')
  const [suggestLng, setSuggestLng] = useState('')
  const [suggestCategory, setSuggestCategory] = useState('nature')
  const [suggestTheme, setSuggestTheme] = useState('')
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false)
  const [suggestionSuccess, setSuggestionSuccess] = useState(false)

  const handleSuggestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
        setError(t('suggest_login_required'))
        return
    }
    setIsSubmittingSuggestion(true)
    setError(null)
    try {
        await createPlace({
            name: suggestName,
            description: suggestDesc,
            latitude: Number(suggestLat),
            longitude: Number(suggestLng),
            category: suggestCategory,
            theme: suggestTheme
        })
        setSuggestionSuccess(true)
        setSuggestName('')
        setSuggestDesc('')
        setSuggestLat('')
        setSuggestLng('')
        setSuggestTheme('')
        setTimeout(() => {
            setIsSuggestModalOpen(false)
            setSuggestionSuccess(false)
        }, 3000)
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit suggestion')
    } finally {
        setIsSubmittingSuggestion(false)
    }
  }
  
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
          limit: '5',
          status: 'approved'
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
        status: 'approved'
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
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between rtl:text-right">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{t('title')}</h1>
            <p className="mt-1 text-sm text-slate-600">{t('desc')}</p>
          </div>
          <button 
            onClick={() => setIsSuggestModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-6 py-3 text-sm font-bold text-[#2E7D32] transition-all hover:bg-emerald-100 active:scale-95 shadow-sm"
          >
            <PlusCircle size={20} />
            {t('suggest_place')}
          </button>
        </header>

        <div className="tour-card mt-6 grid gap-3 p-4 sm:grid-cols-3">
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
          {error ? <p className="text-sm text-rose-600 mb-4">{error}</p> : null}
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

      {/* Suggest Place Modal */}
      <AnimatePresence>
        {isSuggestModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSuggestModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl overflow-hidden rounded-[40px] bg-white shadow-2xl"
            >
               <div className="bg-[#2E7D32] p-8 text-white">
                  <button 
                    onClick={() => setIsSuggestModalOpen(false)}
                    className="absolute right-6 top-6 text-white/60 hover:text-white"
                  >
                    <X size={24} />
                  </button>
                  <h2 className="text-2xl font-black">{t('suggest_modal_title')}</h2>
                  <p className="mt-2 text-sm text-emerald-100">{t('suggest_desc')}</p>
               </div>

               <div className="p-8">
                  {suggestionSuccess ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center py-8 text-center"
                    >
                      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-[#2E7D32]">
                         <MapPin size={40} />
                      </div>
                      <p className="font-bold text-slate-900">{t('suggest_success')}</p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSuggestSubmit} className="space-y-4">
                       <div className="grid gap-4 sm:grid-cols-2">
                          <div className="flex flex-col gap-1.5">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('suggest_form_name')}</label>
                             <input 
                                required
                                value={suggestName}
                                onChange={e => setSuggestName(e.target.value)}
                                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm focus:border-[#2E7D32] focus:outline-none"
                             />
                          </div>
                          <div className="flex flex-col gap-1.5">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('suggest_form_category')}</label>
                             <select 
                                value={suggestCategory}
                                onChange={e => setSuggestCategory(e.target.value)}
                                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm focus:border-[#2E7D32] focus:outline-none"
                             >
                                <option value="nature">Nature</option>
                                <option value="culture">Culture/History</option>
                                <option value="thermal_baths">Thermal Baths</option>
                                <option value="sports">Sports</option>
                                <option value="relaxation">Relaxation</option>
                             </select>
                          </div>
                       </div>

                       <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('suggest_form_desc')}</label>
                          <textarea 
                            required
                            value={suggestDesc}
                            onChange={e => setSuggestDesc(e.target.value)}
                            rows={3}
                            className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm focus:border-[#2E7D32] focus:outline-none resize-none"
                          />
                       </div>

                       <div className="grid gap-4 sm:grid-cols-3">
                          <div className="flex flex-col gap-1.5">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Lat</label>
                             <input 
                                required
                                type="number"
                                step="any"
                                value={suggestLat}
                                onChange={e => setSuggestLat(e.target.value)}
                                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm focus:border-[#2E7D32] focus:outline-none"
                             />
                          </div>
                          <div className="flex flex-col gap-1.5">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Lng</label>
                             <input 
                                required
                                type="number"
                                step="any"
                                value={suggestLng}
                                onChange={e => setSuggestLng(e.target.value)}
                                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm focus:border-[#2E7D32] focus:outline-none"
                             />
                          </div>
                          <div className="flex flex-col gap-1.5">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('suggest_form_theme')}</label>
                             <input 
                                value={suggestTheme}
                                onChange={e => setSuggestTheme(e.target.value)}
                                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm focus:border-[#2E7D32] focus:outline-none"
                                placeholder="e.g. Roman Art"
                             />
                          </div>
                       </div>

                       <button 
                         type="submit"
                         disabled={isSubmittingSuggestion}
                         className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
                       >
                          {isSubmittingSuggestion ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <>
                              <PlusCircle size={20} />
                              {t('suggest_form_submit')}
                            </>
                          )}
                       </button>
                    </form>
                  )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
