'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
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
import SearchAutocomplete from '@/components/SearchAutocomplete'
import NoResults from '@/components/NoResults'
import { addToSearchHistory } from '@/lib/search-history'
import { PlusCircle, MapPin, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { motion, AnimatePresence } from 'motion/react'

const categories = ['all', 'forest', 'culture', 'nature', 'sports', 'relaxation', 'thermal_baths'] as const
const limit = 12
type SortOption = 'relevance' | 'name' | 'rating' | 'newest'

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
  const [theme, setTheme] = useState(searchParams.get('theme') ?? '')
  const [category, setCategory] = useState<(typeof categories)[number]>((searchParams.get('category') as (typeof categories)[number]) ?? 'all')
  const [page, setPage] = useState(Number(searchParams.get('page') ?? '1'))
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) ?? 'relevance')

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

  const [showMobileFilters, setShowMobileFilters] = useState(false)

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

  const handleSearch = useCallback((value: string) => {
    addToSearchHistory(value)
    setPage(1)
  }, [])

  const handleCategoryClick = useCallback((cat: string) => {
    setCategory(cat as (typeof categories)[number])
    setPage(1)
  }, [])

  const handleClearFilters = useCallback(() => {
    setQuery('')
    setTheme('')
    setCategory('all')
    setSortBy('relevance')
    setPage(1)
  }, [])

  // Listen for category-select custom event from SearchAutocomplete
  useEffect(() => {
    const handler = (e: Event) => {
      const cat = (e as CustomEvent).detail
      handleCategoryClick(cat)
    }
    window.addEventListener('category-select', handler)
    return () => window.removeEventListener('category-select', handler)
  }, [handleCategoryClick])

  const hasActiveFilters = query.trim() !== '' || theme.trim() !== '' || category !== 'all'

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (query.trim()) params.set('keyword', query.trim())
    if (theme.trim()) params.set('theme', theme.trim())
    if (category !== 'all') params.set('category', category)
    if (page > 1) params.set('page', String(page))
    if (sortBy !== 'relevance') params.set('sort', sortBy)

    const queryString = params.toString()
    router.push(`/discover${queryString ? `?${queryString}` : ''}`, { scroll: false })
  }, [category, page, query, theme, sortBy, router])

  // Fetch data when filters change (client-side transitions)
  useEffect(() => {
    let isMounted = true
    const currentParams = {
        page: searchParams.get('page') ?? '1',
        keyword: searchParams.get('keyword') ?? '',
        category: searchParams.get('category') ?? 'all',
        theme: searchParams.get('theme') ?? '',
        sort: searchParams.get('sort') ?? 'relevance',
    }

    if (String(page) === currentParams.page &&
        query === currentParams.keyword &&
        category === currentParams.category &&
        theme === currentParams.theme &&
        sortBy === currentParams.sort) {
       return
    }

    const loadPlaces = async () => {
      setIsLoading(true)
      setError(null)
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        status: 'approved',
      })
      if (query.trim()) params.set('keyword', query.trim())
      if (theme.trim()) params.set('theme', theme.trim())
      if (category !== 'all') params.set('category', category)
      if (sortBy !== 'relevance') params.set('sort', sortBy)

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
  }, [category, page, query, theme, sortBy, searchParams])

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

  const categoryChips = categories.filter(c => c !== 'all')

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

        {/* Search & Filter Bar */}
        <div className="tour-card mt-6 space-y-3 p-4">
          <div className="flex items-center gap-3">
            <SearchAutocomplete
              query={query}
              onQueryChange={setQuery}
              onSearch={handleSearch}
              locale={locale}
            />
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-emerald-100 bg-white px-3 py-3 text-xs font-medium text-slate-600 transition-colors hover:border-[#2E7D32] hover:text-[#2E7D32] lg:hidden"
              type="button"
            >
              <SlidersHorizontal size={16} />
              {t('filters')}
            </button>
          </div>

          {/* Desktop filter row */}
          <div className="hidden items-center gap-3 lg:flex">
            <input
              value={theme}
              onChange={(event) => {
                setPage(1)
                setTheme(event.target.value)
              }}
              placeholder={t('search_theme')}
              className="max-w-[200px] rounded-xl border border-emerald-100 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-[#2E7D32] rtl:text-right"
            />

            <div className="flex flex-wrap items-center gap-1.5">
              {categoryChips.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(category === cat ? 'all' : cat)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                    category === cat
                      ? 'bg-[#2E7D32] text-white shadow-sm'
                      : 'bg-white border border-emerald-100 text-slate-600 hover:border-[#2E7D32] hover:text-[#2E7D32]'
                  }`}
                  type="button"
                >
                  {t(`filter_${cat}`)}
                </button>
              ))}
            </div>

            <div className="ms-auto flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-rose-500 transition-colors whitespace-nowrap"
                  type="button"
                >
                  <X size={14} />
                  {t('clear_filters')}
                </button>
              )}

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setPage(1)
                    setSortBy(e.target.value as SortOption)
                  }}
                  className="appearance-none rounded-xl border border-emerald-100 bg-white px-8 py-2.5 pe-8 ps-3 text-xs font-medium text-slate-600 outline-none focus:border-[#2E7D32] cursor-pointer"
                >
                  <option value="relevance">{t('sort_relevance')}</option>
                  <option value="name">{t('sort_name')}</option>
                  <option value="rating">{t('sort_rating')}</option>
                  <option value="newest">{t('sort_newest')}</option>
                </select>
                <ArrowUpDown size={14} className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Mobile expanded filters */}
          {showMobileFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden lg:hidden"
            >
              <input
                value={theme}
                onChange={(event) => {
                  setPage(1)
                  setTheme(event.target.value)
                }}
                placeholder={t('search_theme')}
                className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-[#2E7D32] rtl:text-right"
              />
              <div className="flex flex-wrap items-center gap-1.5">
                {categoryChips.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(category === cat ? 'all' : cat)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                      category === cat
                        ? 'bg-[#2E7D32] text-white shadow-sm'
                        : 'bg-white border border-emerald-100 text-slate-600 hover:border-[#2E7D32] hover:text-[#2E7D32]'
                    }`}
                    type="button"
                  >
                    {t(`filter_${cat}`)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setPage(1)
                    setSortBy(e.target.value as SortOption)
                  }}
                  className="flex-1 rounded-xl border border-emerald-100 bg-white px-3 py-2.5 text-xs font-medium text-slate-600 outline-none focus:border-[#2E7D32]"
                >
                  <option value="relevance">{t('sort_relevance')}</option>
                  <option value="name">{t('sort_name')}</option>
                  <option value="rating">{t('sort_rating')}</option>
                  <option value="newest">{t('sort_newest')}</option>
                </select>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-2.5 text-xs font-medium text-rose-500 transition-colors hover:bg-rose-50 whitespace-nowrap"
                    type="button"
                  >
                    <X size={14} />
                    {t('clear_filters')}
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {query.trim() && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-[#2E7D32]">
                  {t('search_keyword')}: {query.trim()}
                  <button
                    onClick={() => { setQuery(''); setPage(1) }}
                    className="ml-0.5 hover:text-red-500 transition-colors"
                    type="button"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {category !== 'all' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-[#2E7D32]">
                  {t(`filter_${category}`)}
                  <button
                    onClick={() => { setCategory('all'); setPage(1) }}
                    className="ml-0.5 hover:text-red-500 transition-colors"
                    type="button"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {theme.trim() && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-[#2E7D32]">
                  {theme.trim()}
                  <button
                    onClick={() => { setTheme(''); setPage(1) }}
                    className="ml-0.5 hover:text-red-500 transition-colors"
                    type="button"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              <span className="text-xs text-slate-400 ms-auto">
                {!isLoading && (
                  <span className="font-medium text-slate-500">{t('results_count', { count: total })}</span>
                )}
              </span>
            </div>
          )}
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
          {!isLoading && places.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {places.map((place) => (
                <FadeInSection key={place.id}>
                  <PlaceCard place={place} />
                </FadeInSection>
              ))}
            </div>
          )}
          {places.length === 0 && !isLoading ? (
            <NoResults
              query={query}
              onCategoryClick={handleCategoryClick}
              onClearFilters={handleClearFilters}
            />
          ) : null}
        </article>
      </section>

      {places.length > 0 && (
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
      )}

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
                                 <option value="nature">{t('filter_nature')}</option>
                                 <option value="culture">{t('filter_culture')}</option>
                                 <option value="thermal_baths">{t('filter_thermal_baths')}</option>
                                 <option value="sports">{t('filter_sports')}</option>
                                 <option value="relaxation">{t('filter_relaxation')}</option>
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
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('lat_label')}</label>
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
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('lng_label')}</label>
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
                                placeholder={t('theme_placeholder')}
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
