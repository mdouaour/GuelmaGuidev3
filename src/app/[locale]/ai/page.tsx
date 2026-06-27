'use client'

import { useMemo, useState, useEffect } from 'react'
import FadeInSection from '@/components/FadeInSection'
import MapClient from '@/components/MapClient'
import { buildPlacePath, getRecommendations, getPlaces, getActivities, type RecommendationsResponse, type RecommendationPlace, type RecommendationActivity, type Place, type Activity } from '@/lib/api'
import { getCategoryImage } from '@/lib/visuals'
import PageSkeleton from '@/components/skeletons/PageSkeleton'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { getLocalizedName } from '@/lib/localization'
import { GoogleGenAI, Type } from "@google/genai"
import { Search, Sparkles, MessageSquare } from 'lucide-react'

const DEFAULT_COORDINATES = { lat: 36.4621, lng: 7.4247 }

function AIActivitySkeleton() {
  return (
    <div className="tour-card p-3 animate-pulse space-y-2">
      <div className="h-5 w-1/2 rounded bg-slate-200" />
      <div className="h-3 w-1/3 rounded bg-slate-200" />
      <div className="h-3 w-1/4 rounded bg-slate-200" />
    </div>
  )
}

interface AIRecommendationExplanation {
  id: string; // "place-1" or "activity-1"
  explanation: string;
}

export default function AIPage() {
  const t = useTranslations('ai')
  const commonT = useTranslations('discover')
  const locale = useLocale()
  
  // Heuristic Filter State
  const [category, setCategory] = useState('')
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | ''>('')
  
  // Natural Language State
  const [query, setQuery] = useState('')
  const [explanations, setExplanations] = useState<Record<string, string>>({})
  
  // Common State
  const [data, setData] = useState<RecommendationsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Context Data for AI
  const [placesContext, setPlacesContext] = useState<Place[]>([])
  const [activitiesContext, setActivitiesContext] = useState<Activity[]>([])

  useEffect(() => {
    // Pre-fetch some data for AI context or heuristic fallback if needed
    fetchContext()
  }, [])

  const fetchContext = async () => {
    try {
      const p = await getPlaces(new URLSearchParams({ limit: '50' }))
      const a = await getActivities(new URLSearchParams({ limit: '50' }))
      setPlacesContext(p.results)
      setActivitiesContext(a.results)
    } catch (e) {
      console.error("Failed to fetch context for AI", e)
    }
  }

  const submitHeuristic = async () => {
    setIsLoading(true)
    setError(null)
    setExplanations({})
    const params = new URLSearchParams({
      latitude: String(DEFAULT_COORDINATES.lat),
      longitude: String(DEFAULT_COORDINATES.lng),
    })
    if (category.trim()) params.set('category', category.trim())
    if (timeOfDay) params.set('time_of_day', timeOfDay)

    try {
      const response = await getRecommendations(params)
      setData(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations')
    } finally {
      setIsLoading(false)
    }
  }

  const submitNL = async () => {
    if (!query.trim()) return
    setIsLoading(true)
    setError(null)
    setExplanations({})

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
      if (!apiKey) throw new Error("AI configuration missing")

      const ai = new GoogleGenAI({ apiKey })
      
      // Building context string
      const placesStr = placesContext.map(p => `- [Place ID: ${p.id}] Name: ${p.name}, Category: ${p.category}, Theme: ${p.theme}, Description: ${p.description}`).join('\n')
      const activitiesStr = activitiesContext.map(a => `- [Activity ID: ${a.id}] Title: ${a.title}, Place: ${a.place_name}, Description: ${a.description}, Time: ${a.date_time}`).join('\n')

      const prompt = `
        User Request: "${query}"
        
        Available Places:
        ${placesStr}
        
        Available Activities:
        ${activitiesStr}
        
        Task: 
        Select the most relevant places (up to 4) and activities (up to 4) from the lists above that match the user's request.
        For each selection, provide a brief explanation why it matches.
        
        Return the result in JSON format with two keys: "place_ids" (list of objects with id and explanation) and "activity_ids" (list of objects with id and explanation).
      `

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              place_ids: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.NUMBER },
                    explanation: { type: Type.STRING }
                  },
                  required: ["id", "explanation"]
                }
              },
              activity_ids: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.NUMBER },
                    explanation: { type: Type.STRING }
                  },
                  required: ["id", "explanation"]
                }
              }
            },
            required: ["place_ids", "activity_ids"]
          }
        }
      })

      const rawJson = response.text;
      if (!rawJson) throw new Error('No response from AI')
      const result = JSON.parse(rawJson) as { place_ids: Array<{ id: number; explanation: string }>; activity_ids: Array<{ id: number; explanation: string }> }
      
      // Transform into data format
      const recPlaces = result.place_ids
        .map((item: { id: number; explanation: string }) => {
          const p = placesContext.find(pc => pc.id === item.id)
          if (!p) return null
          return { ...p, score: 1, distance_km: 0 } // mock score/distance for UI consistency
        })
        .filter(Boolean) as RecommendationPlace[]

      const recActivities = result.activity_ids
        .map((item: { id: number; explanation: string }) => {
          const a = activitiesContext.find(ac => ac.id === item.id)
          if (!a) return null
          return { ...a, score: 1, distance_km: 0, available_slots: a.max_participants - (a.participants_count || 0), is_joined: false, place_category: 'culture' }
        })
        .filter(Boolean) as RecommendationActivity[]

      setData({
        recommended_places: recPlaces,
        recommended_activities: recActivities
      })

      // Map explanations
      const explMap: Record<string, string> = {}
      result.place_ids.forEach((i: { id: number; explanation: string }) => explMap[`place-${i.id}`] = i.explanation)
      result.activity_ids.forEach((i: { id: number; explanation: string }) => explMap[`activity-${i.id}`] = i.explanation)
      setExplanations(explMap)

    } catch (err) {
      console.error(err)
      setError(t('error_timeout'))
      await submitHeuristic()
    } finally {
      setIsLoading(false)
    }
  }

  const markers = useMemo(
    () =>
      data
        ? [
            ...data.recommended_places.map((place) => ({
              id: `place-${place.id}`,
              title: getLocalizedName(place, locale),
              imageUrl: getCategoryImage(place.category),
              category: place.category,
              description: `${place.category} · ${place.distance_km}km`,
              coordinates: { lat: place.latitude, lng: place.longitude },
              mapsUrl: `https://maps.google.com/?q=${place.latitude},${place.longitude}`,
              detailsUrl: buildPlacePath(place),
            })),
            ...data.recommended_activities.map((activity) => ({
              id: `activity-${activity.id}`,
              title: activity.title,
              imageUrl: getCategoryImage(activity.place_category),
              category: activity.place_category,
              description: `${activity.place_name} · ${activity.available_slots}`,
              coordinates:
                data.recommended_places.find((place) => place.id === activity.place_id)?.latitude !==
                undefined
                  ? {
                      lat: data.recommended_places.find((place) => place.id === activity.place_id)!.latitude,
                      lng: data.recommended_places.find((place) => place.id === activity.place_id)!.longitude,
                    }
                  : DEFAULT_COORDINATES,
            })),
          ]
        : [],
    [data, locale],
  )

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8">
      <FadeInSection>
        <header className="rtl:text-right">
          <div className="flex items-center gap-2 mb-2">
             <div className="rounded-lg bg-emerald-100 p-2 text-[#2E7D32]">
                <Sparkles size={20} />
             </div>
             <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
          </div>
          <p className="text-sm text-slate-600">
            {t('desc')}
          </p>
        </header>

        {/* Natural Language Input */}
        <div className="tour-card mt-6 p-1 overflow-hidden focus-within:ring-2 focus-within:ring-[#2E7D32] transition-shadow">
          <div className="flex items-center gap-3 px-4 py-1">
             <MessageSquare className="text-slate-400 shrink-0" size={20} />
             <textarea
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitNL(); } }}
               placeholder={t('natural_placeholder')}
               rows={1}
               className="w-full resize-none bg-transparent py-4 text-sm text-slate-900 outline-none scrollbar-hide"
             />
             <button 
               onClick={submitNL} 
               disabled={isLoading || !query.trim()}
               className="rounded-xl bg-[#2E7D32] px-6 py-2.5 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
             >
               {isLoading ? t('thinking') : t('ask_btn')}
             </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 rtl:text-right">
          <div className="flex grow items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-1 shadow-sm">
             <Search size={14} className="text-slate-400" />
             <input
               value={category}
               onChange={(event) => setCategory(event.target.value)}
               placeholder={t('cat_placeholder')}
               className="bg-transparent py-2 text-xs outline-none"
             />
          </div>
          <select
            value={timeOfDay}
            onChange={(event) => setTimeOfDay(event.target.value as 'morning' | 'afternoon' | 'evening' | '')}
            className="rounded-xl border border-slate-100 bg-white px-4 py-2 text-xs font-medium outline-none shadow-sm focus:border-[#2E7D32] rtl:text-right"
          >
            <option value="">{t('all_day')}</option>
            <option value="morning">{t('morning')}</option>
            <option value="afternoon">{t('afternoon')}</option>
            <option value="evening">{t('evening')}</option>
          </select>
          <button 
            onClick={submitHeuristic} 
            disabled={isLoading} 
            className="rounded-xl border border-[#2E7D32]/20 bg-emerald-50 px-6 py-2 text-xs font-bold text-[#2E7D32] transition-colors hover:bg-emerald-100 disabled:opacity-50"
          >
            {t('btn_recommend')}
          </button>
        </div>
      </FadeInSection>

      {error ? <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{error}</p> : null}

      {isLoading ? (
        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="tour-card p-6">
              <div className="h-6 w-32 rounded bg-slate-200 mb-6" />
              <div className="grid gap-4 sm:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                  <PageSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
          <div className="tour-card p-6">
            <div className="h-6 w-16 rounded bg-slate-200 mb-4" />
            <div className="h-[360px] rounded-xl bg-slate-100 animate-pulse" />
          </div>
        </section>
      ) : data ? (
        <section className="mt-8 grid gap-6 lg:grid-cols-3 rtl:text-right">
          <div className="lg:col-span-2 space-y-6">
            <article className="tour-card p-6 rtl:text-right">
              <h2 className="text-xl font-bold text-slate-900 border-b border-slate-50 pb-4 rtl:text-right">
                {t('recommendations')}
              </h2>
              
              <div className="mt-6 rtl:text-right">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[#2E7D32] rtl:text-right">
                   <div className="h-2 w-2 rounded-full bg-[#2E7D32]" />
                   {t('places')}
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {data.recommended_places.map((place) => (
                    <div key={place.id} className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:shadow-lg rtl:text-right">
                      <div>
                        <h4 className="font-bold text-slate-900">{getLocalizedName(place, locale)}</h4>
                        <p className="mt-1 text-xs text-slate-500">{place.category} · {place.theme}</p>
                        
                        {explanations[`place-${place.id}`] && (
                          <div className="mt-3 rounded-lg bg-emerald-50/50 p-2.5 text-[11px] text-slate-700 leading-relaxed border border-emerald-100/30">
                            <span className="block font-bold text-[#2E7D32] mb-1">{t('explanation')}</span>
                            {explanations[`place-${place.id}`]}
                          </div>
                        )}
                      </div>
                      <Link href={buildPlacePath(place)} className="mt-4 inline-flex items-center text-xs font-bold text-[#2E7D32] hover:underline">
                        {commonT('view_details')}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 rtl:text-right">
                <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-600 rtl:text-right">
                   <div className="h-2 w-2 rounded-full bg-emerald-600" />
                   {t('activities')}
                </h3>
                <div className="mt-4 space-y-4">
                  {data.recommended_activities.map((activity) => (
                    <div key={activity.id} className="group relative rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:shadow-lg rtl:text-right">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-slate-900">{activity.title}</h4>
                          <p className="mt-1 text-xs text-slate-500">{activity.place_name} · {new Date(activity.date_time).toLocaleString(locale)}</p>
                          
                          {explanations[`activity-${activity.id}`] && (
                            <div className="mt-3 rounded-lg bg-emerald-50/50 p-2.5 text-[11px] text-slate-700 leading-relaxed border border-emerald-100/30">
                              <span className="block font-bold text-[#2E7D32] mb-1">{t('explanation')}</span>
                              {explanations[`activity-${activity.id}`]}
                            </div>
                          )}
                        </div>
                        <Link
                          href={buildPlacePath({ id: activity.place_id, name: activity.place_name })}
                          className="shrink-0 rounded-xl bg-slate-50 px-4 py-2 text-center text-xs font-bold text-slate-600 transition-colors hover:bg-[#2E7D32] hover:text-white"
                        >
                          {commonT('view_details')}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>

          <article className="tour-card h-fit p-6 sticky top-24 rtl:text-right">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 rtl:text-right">{commonT('map')}</h2>
            </div>
            <div className="h-[400px] overflow-hidden rounded-2xl border border-emerald-100 shadow-inner">
              <MapClient markers={markers} zoom={12} />
            </div>
          </article>
        </section>
      ) : (
        <FadeInSection>
          <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white p-16 text-center">
             <div className="mb-4 rounded-2xl bg-slate-50 p-6 text-slate-300">
                <Sparkles size={48} />
             </div>
             <h3 className="text-lg font-bold text-slate-900">{t('empty')}</h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                {t('empty_desc')}
              </p>
          </div>
        </FadeInSection>
      )}
    </div>
  )
}
