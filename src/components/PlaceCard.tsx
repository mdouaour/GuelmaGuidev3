'use client'

import { MapPin, Heart, Star } from 'lucide-react'
import { motion } from 'motion/react'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { firstImageOrCategory } from '@/lib/visuals'
import { getLocalizedName, getLocalizedDescription } from '@/lib/localization'
import { useLocale, useTranslations } from 'next-intl'
import { buildPlacePath, type Place } from '@/lib/api'

export default function PlaceCard({ place }: { place: Place }) {
  const locale = useLocale()
  const t = useTranslations('discover')
  const { user } = useAuth()
  const [isSaved, setIsSaved] = useState(place.is_saved)
  const [isLoading, setIsLoading] = useState(false)

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user || isLoading) return

    setIsLoading(true)
    const method = isSaved ? 'DELETE' : 'POST'
    try {
      const response = await fetch(`/api/wishlists/${place.id}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        setIsSaved(!isSaved)
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="tour-card tour-hover overflow-hidden h-full flex flex-col"
      id={`place-card-${place.id}`}
    >
      <Link href={buildPlacePath(place)} className="relative h-48 w-full block overflow-hidden">
        <Image
          src={firstImageOrCategory(place.images, place.category)}
          alt={place.name_en || ''}
          fill
          className="object-cover transition-transform duration-500 hover:scale-110"
          referrerPolicy="no-referrer"
        />
        {user && (
          <button
            onClick={toggleWishlist}
            disabled={isLoading}
            className={`absolute top-3 right-3 z-10 rounded-full p-2.5 transition-all shadow-sm ${
              isSaved 
                ? 'bg-[#2E7D32] text-white' 
                : 'bg-white/80 text-slate-600 backdrop-blur-sm hover:bg-white'
            }`}
          >
            <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        )}
      </Link>

      <div className="p-4 rtl:text-right flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2 overflow-hidden">
           <p className="inline-flex rounded-full bg-[#eaf6ef] px-2 py-0.5 text-[10px] uppercase font-bold text-[#2E7D32] whitespace-nowrap">
             {place.category}
           </p>
           <div className="flex items-center gap-1 shrink-0">
             <Star size={12} className="fill-amber-400 text-amber-400" />
             <span className="text-xs font-bold text-slate-700">{(place.rating_avg || 0).toFixed(1)}</span>
             <span className="text-[10px] text-slate-400">({place.rating_count || 0})</span>
           </div>
        </div>
        
        <h2 className="mt-2 text-lg font-semibold text-slate-900 group-hover:text-[#2E7D32] transition-colors line-clamp-1">
          {getLocalizedName(place, locale)}
        </h2>
        
        <p className="mt-1 text-sm text-slate-600 line-clamp-2 flex-1">
          {getLocalizedDescription(place, locale)}
        </p>
        
        <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-50">
           <p className="text-xs font-medium text-slate-400 truncate max-w-[150px]">
             {place.theme}
           </p>
           <Link href={buildPlacePath(place)} className="text-sm font-bold text-[#2E7D32] hover:underline">
             {t('view_details')}
           </Link>
        </div>
      </div>
    </motion.div>
  )
}
