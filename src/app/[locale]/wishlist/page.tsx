'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { motion } from 'motion/react'
import { useAuth } from '@/context/AuthContext'
import { getWishlist, buildPlacePath, type Place } from '@/lib/api'
import { Link } from '@/i18n/navigation'
import { Heart, ArrowLeft, Star, MapPin, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { firstImageOrCategory } from '@/lib/visuals'
import { getLocalizedName } from '@/lib/localization'

export default function WishlistPage() {
  const t = useTranslations('wishlist')
  const placesT = useTranslations('places')
  const { user, isAuthLoading } = useAuth()
  const [places, setPlaces] = useState<Place[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthLoading && !user) {
      setIsLoading(false)
      return
    }
    if (!user) return

    setIsLoading(true)
    setError(null)
    getWishlist()
      .then(setPlaces)
      .catch((err) => {
        console.error('Failed to load wishlist:', err)
        setError(err.message || 'Failed to load wishlist')
      })
      .finally(() => setIsLoading(false))
  }, [user, isAuthLoading])

  if (isAuthLoading || (user && isLoading)) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2E7D32]" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-6 px-4 py-24 text-center">
        <div className="rounded-full bg-slate-100 p-6 shadow-inner">
          <Heart size={48} className="text-slate-300" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{placesT('save')}</h1>
        <p className="text-slate-500">{t('empty_desc')}</p>
        <Link
          href="/auth"
          className="rounded-2xl bg-[#2E7D32] px-12 py-4 font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          {t('login')}
        </Link>
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8">
        <Link
          href="/discover"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={16} />
          {t('back_to_discover')}
        </Link>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">{placesT('saved')}</h1>
        <p className="mt-2 text-slate-500">
          {t('saved_count', { count: places.length })}
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!error && places.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="rounded-full bg-slate-100 p-8 shadow-inner">
            <Heart size={48} className="text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-700">{t('empty')}</h2>
          <p className="max-w-md text-slate-500">
            {t('empty_desc')}
          </p>
          <Link
            href="/discover"
            className="rounded-2xl bg-[#2E7D32] px-8 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            {t('explore_places')}
          </Link>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {places.map((place, i) => (
          <motion.div
            key={place.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
          >
            <Link
              href={buildPlacePath(place)}
              className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <Image
                  src={firstImageOrCategory(place.images, place.category)}
                  alt={getLocalizedName(place, 'en')}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <span className="inline-block rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-700 backdrop-blur-sm shadow-sm">
                    {place.category}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-900 group-hover:text-[#2E7D32] transition-colors line-clamp-1">
                  {getLocalizedName(place, 'en')}
                </h3>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Star size={12} className="text-amber-400" fill="currentColor" />
                    {place.rating_avg ? place.rating_avg.toFixed(1) : '-'}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {place.theme}
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </main>
  )
}
