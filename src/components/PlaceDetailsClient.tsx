'use client'

import { useMemo, useState, useEffect } from 'react'
import Image from 'next/image'
import FadeInSection from '@/components/FadeInSection'
import MapClient from '@/components/MapClient'
import {
  type Activity,
  type Place,
} from '@/lib/api'
import { firstImageOrCategory } from '@/lib/visuals'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { getLocalizedName, getLocalizedDescription } from '@/lib/localization'
import { Heart, Star, Clock, MapPin, StarHalf } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import ReviewForm from '@/components/ReviewForm'
import { formatDistanceToNow } from 'date-fns'
import { arDZ, fr, enUS } from 'date-fns/locale'

interface Review {
  id: number
  user_name: string
  user_avatar: string | null
  rating: number
  text: string | null
  created_at: string
}

interface PlaceDetailsClientProps {
  initialPlace: Place
  initialActivities: Activity[]
}

export default function PlaceDetailsClient({ initialPlace, initialActivities }: PlaceDetailsClientProps) {
  const t = useTranslations('place_details')
  const commonT = useTranslations('discover')
  const placesT = useTranslations('places')
  const locale = useLocale()
  const { user } = useAuth()
  
  const [place, setPlace] = useState(initialPlace)
  const [isSaved, setIsSaved] = useState(initialPlace.is_saved)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const [isWishlistLoading, setIsWishlistLoading] = useState(false)

  const dateLocale = locale === 'ar' ? arDZ : locale === 'fr' ? fr : enUS

  useEffect(() => {
    // Save to recently viewed for offline access
    const saved = localStorage.getItem('recently_viewed_places')
    let places = saved ? JSON.parse(saved) : []
    // Remove if exists
    places = places.filter((p: any) => p.id !== initialPlace.id)
    // Add to start
    places.unshift(initialPlace)
    // Keep 10
    localStorage.setItem('recently_viewed_places', JSON.stringify(places.slice(0, 10)))
  }, [initialPlace])

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/places/${initialPlace.id}/reviews`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data.items)
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setIsLoadingReviews(false)
    }
  }

  const fetchPlace = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/places/${initialPlace.id}`)
      if (response.ok) {
        const data = await response.json()
        setPlace(data)
        setIsSaved(data.is_saved)
      }
    } catch (error) {
      console.error('Failed to fetch place:', error)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [initialPlace.id])

  const toggleWishlist = async () => {
    if (!user || isWishlistLoading) return
    setIsWishlistLoading(true)
    const method = isSaved ? 'DELETE' : 'POST'
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/wishlists/${place.id}`, {
        method,
      })
      if (response.ok) {
        setIsSaved(!isSaved)
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error)
    } finally {
      setIsWishlistLoading(false)
    }
  }

  const onReviewSubmitted = () => {
    fetchReviews()
    fetchPlace()
  }

  const markers = useMemo(
    () => [
      {
        id: String(initialPlace.id),
        title: getLocalizedName(initialPlace, locale),
        imageUrl: firstImageOrCategory(initialPlace.images, initialPlace.category),
        category: initialPlace.category,
        description: initialPlace.theme,
        coordinates: { lat: initialPlace.latitude, lng: initialPlace.longitude },
        mapsUrl: `https://maps.google.com/?q=${initialPlace.latitude},${initialPlace.longitude}`,
      },
    ],
    [initialPlace, locale],
  )

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8">
      <Link href="/discover" className="text-sm text-slate-600 hover:text-slate-900">
        {t('back')}
      </Link>

      <FadeInSection>
      <section className="tour-card mt-4 overflow-hidden">
        <div className="relative h-56 w-full">
          <Image
            src={firstImageOrCategory(initialPlace.images, initialPlace.category)}
            alt={initialPlace.name}
            fill
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="p-6 rtl:text-right">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs uppercase font-bold text-[#2E7D32]">{place.category}</p>
              <h1 className="mt-1 text-3xl font-extrabold text-slate-900">{getLocalizedName(place, locale)}</h1>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star size={18} className="fill-amber-400 text-amber-400" />
                  <span className="text-lg font-bold text-slate-900">{(place.rating_avg || 0).toFixed(1)}</span>
                </div>
                <span className="text-sm text-slate-400">• {place.rating_count || 0} {placesT('reviews')}</span>
              </div>
            </div>
            
            {user && (
              <button
                onClick={toggleWishlist}
                disabled={isWishlistLoading}
                className={`rounded-full p-4 transition-all shadow-md ${
                  isSaved 
                    ? 'bg-[#2E7D32] text-white' 
                    : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Heart size={24} fill={isSaved ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>

          <p className="mt-4 text-slate-600 leading-relaxed">{getLocalizedDescription(place, locale)}</p>
          
          <div className="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-3">
            <div className="flex items-center gap-2">
               <div className="rounded-lg bg-white p-2 text-emerald-600 shadow-sm">
                 <MapPin size={16} />
               </div>
               <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">{t('coordinates')}</p>
                  <p className="font-medium">{place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}</p>
               </div>
            </div>
            <div className="flex items-center gap-2">
               <div className="rounded-lg bg-white p-2 text-emerald-600 shadow-sm">
                 <Clock size={16} />
               </div>
               <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">{t('theme')}</p>
                  <p className="font-medium">{place.theme}</p>
               </div>
            </div>
            <div className="flex items-center gap-2">
               <div className="rounded-lg bg-white p-2 text-emerald-600 shadow-sm">
                 <MapPin size={16} />
               </div>
               <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">{t('category')}</p>
                  <p className="font-medium capitalize">{place.category}</p>
               </div>
            </div>
          </div>
        </div>
      </section>
      </FadeInSection>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <article className="lg:col-span-2 space-y-6">
          <div className="tour-card p-4 rtl:text-right">
            <h2 className="text-lg font-semibold text-slate-900">{commonT('map')}</h2>
            <div className="mt-3 h-[320px] overflow-hidden rounded-xl border border-emerald-100">
              <MapClient markers={markers} zoom={14} />
            </div>
          </div>

          <div className="space-y-6 rtl:text-right">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">{placesT('reviews')}</h2>
                <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
                   <Star size={16} className="fill-amber-400 text-amber-400" />
                   <span className="text-sm font-bold text-amber-900">{place.rating_avg.toFixed(1)}</span>
                </div>
             </div>

             <ReviewForm placeId={place.id} onReviewSubmitted={onReviewSubmitted} />

             <div className="space-y-4">
                {isLoadingReviews ? (
                  <div className="flex justify-center py-8">
                     <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2E7D32] border-t-transparent" />
                  </div>
                ) : reviews.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    {placesT('no_reviews')}
                  </p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                       <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                             <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm overflow-hidden border border-emerald-50">
                                {review.user_avatar ? (
                                  <img src={review.user_avatar} alt={review.user_name} className="h-full w-full object-cover" />
                                ) : (
                                  review.user_name[0].toUpperCase()
                                )}
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-900 leading-none">{review.user_name}</p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                   {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: dateLocale })}
                                </p>
                             </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                             {[1, 2, 3, 4, 5].map((s) => (
                               <Star
                                 key={s}
                                 size={12}
                                 className={s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                               />
                             ))}
                          </div>
                       </div>
                       {review.text && (
                         <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-xl">
                           {review.text}
                         </p>
                       )}
                    </div>
                  ))
                )}
             </div>
          </div>
        </article>

        <article className="tour-card p-4 rtl:text-right">
          <h2 className="text-lg font-semibold text-slate-900">{t('related_activities')}</h2>
          <div className="mt-3 space-y-3">
            {initialActivities.length > 0 ? (
              initialActivities.map((activity) => (
                <div key={activity.id} className="rounded-xl border border-emerald-100 bg-white p-3 rtl:text-right">
                  <h3 className="text-sm font-semibold text-slate-900">{activity.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{new Date(activity.date_time).toLocaleString()}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {activity.participants_count}/{activity.max_participants}
                  </p>
                </div>
              ))
            ) : (
               <p className="rounded-xl border border-emerald-100 p-3 text-sm text-slate-600 rtl:text-right">
                 {t('no_activities')}
               </p>
            )}
          </div>
          <Link href="/activities" className="mt-4 inline-block text-sm font-medium text-[#2E7D32]">
            {t('see_all')}
          </Link>
        </article>
      </section>
    </div>
  )
}
