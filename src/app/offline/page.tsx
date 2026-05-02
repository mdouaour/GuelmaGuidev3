'use client'

import { useEffect, useState } from 'react'
import { WifiOff, MapPin, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import FadeInSection from '@/components/FadeInSection'
import { type Place } from '@/lib/api'

export default function OfflinePage() {
  const [cachedPlaces, setCachedPlaces] = useState<Place[]>([])

  useEffect(() => {
    const initOffline = () => {
      const saved = localStorage.getItem('recently_viewed_places')
      if (saved) {
        try {
          setCachedPlaces(JSON.parse(saved).slice(0, 5))
        } catch (e) {
          console.error(e)
        }
      }
    }
    initOffline()
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-12 text-center">
      <FadeInSection>
        <div className="mb-6 rounded-full bg-slate-100 p-8 text-slate-400">
          <WifiOff size={64} />
        </div>
        <h1 className="text-3xl font-black text-slate-900">You&apos;re Offline</h1>
        <p className="mt-2 text-slate-500">
          We couldn&apos;t connect to the internet, but here&apos;s what we have saved for you.
        </p>

        {cachedPlaces.length > 0 ? (
          <div className="mt-12 w-full max-w-md space-y-4">
            <h2 className="text-left text-sm font-bold uppercase tracking-wider text-slate-400">
              Recently Visited
            </h2>
            {cachedPlaces.map((place) => (
              <div
                key={place.id}
                className="group flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-sm transition-all active:scale-95"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#2E7D32]">
                  <MapPin size={24} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="truncate font-bold text-slate-900">{place.name_en || place.name}</h3>
                  <p className="truncate text-xs text-slate-500">{place.category}</p>
                </div>
                <ChevronRight className="text-slate-300" size={20} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex rounded-full bg-[#2E7D32] px-8 py-3 font-bold text-white shadow-lg transition-transform active:scale-95"
            >
              Try Homepage
            </Link>
          </div>
        )}
      </FadeInSection>
    </main>
  )
}
