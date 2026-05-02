'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { 
  Trees, 
  Landmark, 
  Waves, 
  Dumbbell, 
  Utensils, 
  Palette, 
  Compass, 
  Users,
  Check,
  MapPin,
  Globe
} from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import map to avoid SSR issues
const LeafletMap = dynamic(() => import('@/components/LeafletMap'), { 
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-xl bg-slate-100" />
})

const GUELMA_COORDS = { lat: 36.4621, lng: 7.4247 }

const interestOptions = [
  { id: 'nature', icon: Trees, color: 'bg-emerald-100 text-emerald-700' },
  { id: 'history', icon: Landmark, color: 'bg-amber-100 text-amber-700' },
  { id: 'thermal_baths', icon: Waves, color: 'bg-blue-100 text-blue-700' },
  { id: 'sport', icon: Dumbbell, color: 'bg-red-100 text-red-700' },
  { id: 'food', icon: Utensils, color: 'bg-orange-100 text-orange-700' },
  { id: 'culture', icon: Palette, color: 'bg-purple-100 text-purple-700' },
  { id: 'adventure', icon: Compass, color: 'bg-indigo-100 text-indigo-700' },
  { id: 'family', icon: Users, color: 'bg-pink-100 text-pink-700' },
]

export default function OnboardingPage() {
  const t = useTranslations('onboarding')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  
  const [step, setStep] = useState(1)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [locationPermission, setLocationPermission] = useState<'pending' | 'granted' | 'denied'>('pending')
  const [userLocation, setUserLocation] = useState(GUELMA_COORDS)

  // Step 1: Language set on locale change from URL
  useEffect(() => {
    const storedLang = localStorage.getItem('preferred_language')
    if (storedLang && storedLang !== locale && step === 1) {
      // If we land here but have a preference, we still show step 1 to confirm or move on
    }
  }, [locale, step])

  const handleLanguageSelect = (newLocale: string) => {
    localStorage.setItem('preferred_language', newLocale)
    // Redirecting to the same page but with new locale
    router.replace('/onboarding', { locale: newLocale })
    setStep(2)
  }

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleInterestsNext = () => {
    if (selectedInterests.length >= 3) {
      localStorage.setItem('user_interests', JSON.stringify(selectedInterests))
      setStep(3)
    }
  }

  const requestLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setUserLocation(newCoords)
          setLocationPermission('granted')
          localStorage.setItem('user_location', JSON.stringify(newCoords))
        },
        () => setLocationPermission('denied')
      )
    } else {
      setLocationPermission('denied')
    }
  }

  const finishOnboarding = () => {
    localStorage.setItem('onboarding_complete', 'true')
    router.push('/')
  }

  const markers = useMemo(() => [
    {
      id: 'user-location',
      title: locationPermission === 'granted' ? 'You' : 'Guelma Center',
      coordinates: userLocation,
      category: 'other'
    }
  ], [userLocation, locationPermission])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-inter">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-200">
        <div className="p-8">
          {/* Progress bar */}
          <div className="mb-8 flex gap-2">
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  i <= step ? 'bg-[#2E7D32]' : 'bg-slate-100'
                }`} 
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-[#2E7D32]">
                    <Globe size={32} />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">{t('step_language')}</h1>
                </div>

                <div className="grid gap-3">
                  <button
                    onClick={() => handleLanguageSelect('ar')}
                    className={`flex items-center justify-between rounded-xl border p-4 transition-all ${
                      locale === 'ar' ? 'border-[#2E7D32] bg-emerald-50' : 'border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-2xl">🇩🇿</span>
                      <span className="font-semibold text-slate-900">العربية</span>
                    </span>
                    {locale === 'ar' && <Check size={20} className="text-[#2E7D32]" />}
                  </button>
                  <button
                    onClick={() => handleLanguageSelect('en')}
                    className={`flex items-center justify-between rounded-xl border p-4 transition-all ${
                      locale === 'en' ? 'border-[#2E7D32] bg-emerald-50' : 'border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-2xl">🇬🇧</span>
                      <span className="font-semibold text-slate-900">English</span>
                    </span>
                    {locale === 'en' && <Check size={20} className="text-[#2E7D32]" />}
                  </button>
                  <button
                    onClick={() => handleLanguageSelect('fr')}
                    className={`flex items-center justify-between rounded-xl border p-4 transition-all ${
                      locale === 'fr' ? 'border-[#2E7D32] bg-emerald-50' : 'border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-2xl">🇫🇷</span>
                      <span className="font-semibold text-slate-900">Français</span>
                    </span>
                    {locale === 'fr' && <Check size={20} className="text-[#2E7D32]" />}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-slate-900">{t('step_interests')}</h1>
                  <p className="mt-2 text-sm text-slate-500">{t('step_interests_desc')}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {interestOptions.map((opt) => {
                    const isSelected = selectedInterests.includes(opt.id)
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleInterest(opt.id)}
                        className={`flex flex-col items-center gap-3 rounded-2xl border p-4 transition-all ${
                          isSelected 
                            ? 'border-[#2E7D32] bg-emerald-50 ring-1 ring-[#2E7D32]' 
                            : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isSelected ? 'bg-[#2E7D32] text-white' : opt.color}`}>
                          <opt.icon size={24} />
                        </div>
                        <span className={`text-xs font-semibold ${isSelected ? 'text-[#2E7D32]' : 'text-slate-700'}`}>
                          {t(`interests.${opt.id}`)}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={handleInterestsNext}
                  disabled={selectedInterests.length < 3}
                  className={`w-full rounded-xl py-4 font-bold text-white transition-all ${
                    selectedInterests.length >= 3 ? 'bg-[#2E7D32] shadow-lg shadow-emerald-200' : 'cursor-not-allowed bg-slate-200'
                  }`}
                >
                  {t('next')} ({selectedInterests.length}/3)
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-slate-900">{t('step_location')}</h1>
                  <p className="mt-2 text-sm text-slate-500">{t('step_location_desc')}</p>
                </div>

                <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-100">
                  <LeafletMap markers={markers} zoom={13} />
                  <div className="absolute top-4 right-4 z-[1000]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-600 shadow-lg">
                      <MapPin size={20} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={requestLocation}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E7D32] py-4 font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-[#1B5E20]"
                  >
                    <MapPin size={20} />
                    {t('allow_location')}
                  </button>
                  <button
                    onClick={finishOnboarding}
                    className="w-full rounded-xl py-4 font-semibold text-slate-500 transition-all hover:bg-slate-50"
                  >
                    {locationPermission === 'granted' ? t('finish') : t('skip')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
