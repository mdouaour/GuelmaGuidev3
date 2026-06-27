     'use client'

import { useState } from 'react'
import FadeInSection from '@/components/FadeInSection'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Sparkles, Clock, MapPin, ChevronRight, RotateCcw, Mountain } from 'lucide-react'
import type { Experience } from '@/lib/api'

const mockExperiences: Experience[] = [
  {
    id: 1,
    title: 'The Roman Ring',
    title_ar: 'حلقة الرومان',
    description: 'Walk through 2,000 years of history: Theater → Héliopolis Pool → Museum → Old Town.',
    description_ar: 'امشِ عبر 2000 سنة من التاريخ',
    duration_minutes: 45,
    difficulty: 'easy',
    mood: 'history',
    category: 'heritage',
    steps: ['Start at Théâtre Romain', 'Walk 5 min to Héliopolis', 'Continue to the Museum', 'End at Old Town Café'],
    tips: ['Best at golden hour', 'Bring water', 'The museum is free on weekends'],
    place_id: 1,
    place_name: 'Théâtre Romain',
  },
  {
    id: 2,
    title: 'Thermal Trail',
    title_ar: 'المسار الحراري',
    description: 'From the Roman baths to the legendary Hammam Maskhoutine. Discover why Guelma was called Aquae Thiblitanae.',
    duration_minutes: 120,
    difficulty: 'medium',
    mood: 'wellness',
    category: 'wellness',
    steps: ['Pick up thermal pass', 'Start at Hammam Bradaa', 'Drive to Hammam Maskhoutine', 'Finish with local tea'],
    tips: ['Bring a towel', 'Water temperature 98°C — do not touch!', 'Open early morning'],
    place_id: 2, 
    place_name: 'Hammam Maskhoutine',
  },
  {
    id: 3,
    title: 'Crush Maouna',
    title_ar: 'قمة مونة',
    description: 'Conquer Guelma\'s highest viewpoint. Moderate hike with panoramic reward.',
    duration_minutes: 180,
    difficulty: 'hard',
    mood: 'adventure',
    category: 'nature',
    steps: ['Park at trailhead', 'Follow ridge trail', 'Reach summit — 360° view', 'Descend via valley path'],
    tips: ['Start before 7am in summer', '3L water minimum', 'Check weather first'],
    place_id: 3,
    place_name: 'Mont Maouna',
  },
  {
    id: 4,
    title: 'Dolmens & Legends',
    title_ar: 'دولمنز و أساطير',
    description: '4,000-year-old megalithic tombs. A mysterious walk through pre-history.',
    duration_minutes: 60,
    difficulty: 'easy',
    mood: 'mystery',
    category: 'heritage',
    steps: ['Enter Roknia site', 'Find the Grand Dolmen', 'Follow the stone circle path', 'Read the legend of the ancients'],
    tips: ['Sunset is magical', 'Respect the site — do not climb'],
    place_id: 4,
    place_name: 'Roknia Necropolis',
  },
]

export default function ExploreClient() {
  const t = useTranslations('explore')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)

  const current = mockExperiences[currentIndex]

  const handleSurprise = () => {
    setIsSpinning(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % mockExperiences.length)
      setIsSpinning(false)
    }, 500)
  }

  const difficultyColor = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-amber-100 text-amber-700',
    hard: 'bg-red-100 text-red-700',
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8">
      <FadeInSection>
        <div className="text-center">
          <h1 className="text-3xl font-semibold">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
          
          <button
            onClick={handleSurprise}
            disabled={isSpinning}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50"
          >
            <Sparkles className={`h-5 w-5 ${isSpinning ? 'animate-spin' : ''}`} />
            {t('surprise_me')}
          </button>
        </div>
      </FadeInSection>

      <div className={`mt-8 transition-opacity duration-300 ${isSpinning ? 'opacity-0' : 'opacity-100'}`}>
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5">
          <div className="h-48 bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
            <Mountain className="h-16 w-16 text-white/80" />
          </div>
          
          <div className="p-6">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${difficultyColor[current.difficulty]}`}>
                {t(`difficulty.${current.difficulty}`)}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                {current.duration_minutes} {t('minutes')}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5" />
                {current.place_name}
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-bold">{current.title}</h2>
            <p className="mt-2 text-gray-600">{current.description}</p>

            <div className="mt-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t('steps')}</h3>
              <div className="mt-2 space-y-2">
                {current.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-800">💡 {current.tips[0]}</p>
            </div>

            {current.place_id && (
              <Link
                href={`/place/${current.place_id}`}
                className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-white transition hover:bg-emerald-700"
              >
                {t('view_place')}
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {mockExperiences.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-2 rounded-full transition-all ${
              i === currentIndex ? 'w-8 bg-emerald-600' : 'w-2 bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
