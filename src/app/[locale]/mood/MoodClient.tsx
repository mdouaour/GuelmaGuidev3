'use client'

import { useState } from 'react'
import FadeInSection from '@/components/FadeInSection'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Brain, Users, Compass, Moon, TreePalm, Baby, Flame, Heart } from 'lucide-react'
import type { MoodSuggestion } from '@/lib/api'

interface MoodOption {
  id: string
  icon: React.ReactNode
  color: string
  gradient: string
}

const moods: MoodOption[] = [
  { id: 'stressed', icon: <Brain className="h-8 w-8" />, color: 'text-rose-600', gradient: 'from-rose-500 to-pink-500' },
  { id: 'bored', icon: <Flame className="h-8 w-8" />, color: 'text-orange-600', gradient: 'from-orange-500 to-amber-500' },
  { id: 'lonely', icon: <Users className="h-8 w-8" />, color: 'text-blue-600', gradient: 'from-blue-500 to-cyan-500' },
  { id: 'adventurous', icon: <Compass className="h-8 w-8" />, color: 'text-emerald-600', gradient: 'from-emerald-500 to-green-500' },
  { id: 'peaceful', icon: <Moon className="h-8 w-8" />, color: 'text-violet-600', gradient: 'from-violet-500 to-purple-500' },
  { id: 'family', icon: <Baby className="h-8 w-8" />, color: 'text-teal-600', gradient: 'from-teal-500 to-cyan-500' },
  { id: 'nature', icon: <TreePalm className="h-8 w-8" />, color: 'text-green-600', gradient: 'from-green-500 to-lime-500' },
  { id: 'romantic', icon: <Heart className="h-8 w-8" />, color: 'text-pink-600', gradient: 'from-pink-500 to-rose-500' },
]

export default function MoodClient() {
  const t = useTranslations('mood')
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [results, setResults] = useState<MoodSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleMoodSelect = async (mood: string) => {
    setSelectedMood(mood)
    setIsLoading(true)
    setError(null)
    try {
      const { getMoodSuggestions } = await import('@/lib/api')
      const data = await getMoodSuggestions(mood)
      setResults(data)
    } catch {
      setError(t('error_loading'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8">
      <FadeInSection>
        <h1 className="mb-2 text-3xl font-semibold">{t('title')}</h1>
        <p className="mb-8 text-muted-foreground">{t('subtitle')}</p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {moods.map((mood) => (
            <button
              key={mood.id}
              onClick={() => handleMoodSelect(mood.id)}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all hover:scale-105 ${
                selectedMood === mood.id
                  ? `border-current ${mood.color} bg-gradient-to-br ${mood.gradient} text-white shadow-lg`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <span className={selectedMood === mood.id ? 'text-white' : mood.color}>
                {mood.icon}
              </span>
              <span className={`text-sm font-medium ${selectedMood === mood.id ? 'text-white' : 'text-gray-700'}`}>
                {t(`moods.${mood.id}`)}
              </span>
            </button>
          ))}
        </div>
      </FadeInSection>

      {isLoading && (
        <div className="mt-8 flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-xl bg-red-50 p-4 text-center text-red-700">
          {error}
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <FadeInSection>
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">{t('suggestions_for_you')}</h2>
            {results.map((item) => (
              <Link
                key={item.id}
                href={item.place_id ? `/place/${item.place_id}` : '#'}
                className="block rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  {item.image_url && (
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                      <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                    {item.place_name && (
                      <span className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                        {item.place_name}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </FadeInSection>
      )}

      {!isLoading && selectedMood && results.length === 0 && !error && (
        <FadeInSection>
          <div className="mt-8 rounded-2xl bg-gray-50 p-8 text-center">
            <p className="text-gray-500">{t('no_results')}</p>
            <Link
              href="/discover"
              className="mt-4 inline-block rounded-xl bg-emerald-600 px-6 py-3 text-white transition hover:bg-emerald-700"
            >
              {t('browse_all')}
            </Link>
          </div>
        </FadeInSection>
      )}
    </div>
  )
}
