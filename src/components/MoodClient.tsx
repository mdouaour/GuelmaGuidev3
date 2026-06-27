'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Sparkles, Heart, Compass, Users, Baby, Waves, Zap } from 'lucide-react'
import FadeInSection from '@/components/FadeInSection'
import { getMoodSuggestions, type MoodSuggestion } from '@/lib/api'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'

interface MoodOption {
  id: string
  key: string
  emoji: string
  gradient: string
  icon: React.ReactNode
}

const moodOptions: MoodOption[] = [
  { id: 'stressed', key: 'mood_stressed', emoji: '😰', gradient: 'from-rose-400 to-pink-500', icon: <Zap size={28} /> },
  { id: 'bored', key: 'mood_bored', emoji: '😐', gradient: 'from-amber-400 to-orange-500', icon: <Sparkles size={28} /> },
  { id: 'lonely', key: 'mood_lonely', emoji: '🥺', gradient: 'from-indigo-400 to-purple-500', icon: <Heart size={28} /> },
  { id: 'adventurous', key: 'mood_adventurous', emoji: '🤠', gradient: 'from-emerald-400 to-teal-500', icon: <Compass size={28} /> },
  { id: 'peaceful', key: 'mood_peaceful', emoji: '😌', gradient: 'from-sky-400 to-blue-500', icon: <Waves size={28} /> },
  { id: 'with-kids', key: 'mood_with_kids', emoji: '👨‍👧‍👦', gradient: 'from-yellow-400 to-amber-500', icon: <Baby size={28} /> },
]

export default function MoodClient() {
  const t = useTranslations('mood')
  const locale = useLocale()
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<MoodSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [animationPhase, setAnimationPhase] = useState(0)

  const handleMoodSelect = async (mood: string) => {
    setSelectedMood(mood)
    setIsLoading(true)
    setAnimationPhase(1)
    try {
      const data = await getMoodSuggestions(mood)
      setSuggestions(data)
    } catch (err) {
      console.error('Failed to fetch mood suggestions:', err)
      setSuggestions([])
    } finally {
      setIsLoading(false)
      setAnimationPhase(2)
    }
  }

  const handleReset = () => {
    setSelectedMood(null)
    setSuggestions([])
    setAnimationPhase(0)
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8">
      <FadeInSection>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">
            {t('title')}
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
      </FadeInSection>

      {/* Mood Picker */}
      <FadeInSection>
        <section className="mb-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {moodOptions.map((mood, index) => (
              <motion.button
                key={mood.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, type: 'spring', stiffness: 200 }}
                whileHover={{ scale: 1.08, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleMoodSelect(mood.id)}
                className={`relative flex flex-col items-center justify-center gap-3 rounded-3xl p-6 transition-shadow duration-300 ${
                  selectedMood === mood.id
                    ? `bg-gradient-to-br ${mood.gradient} text-white shadow-xl shadow-${mood.id}/30 ring-4 ring-white`
                    : 'bg-white border border-slate-100 hover:shadow-lg text-slate-700'
                }`}
              >
                <span className="text-4xl">{mood.emoji}</span>
                <span className="text-xs font-bold uppercase tracking-wider">
                  {t(mood.key)}
                </span>
                {selectedMood === mood.id && (
                  <motion.div
                    layoutId="mood-indicator"
                    className="absolute -bottom-1 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-white"
                  />
                )}
              </motion.button>
            ))}
          </div>
        </section>
      </FadeInSection>

      {/* Results */}
      <AnimatePresence mode="wait">
        {selectedMood && animationPhase === 2 && (
          <motion.section
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                {t('suggestions_for', { mood: t(moodOptions.find(m => m.id === selectedMood)?.key || '') })}
              </h2>
              <button
                onClick={handleReset}
                className="text-sm text-slate-400 hover:text-slate-600 underline"
              >
                {t('pick_another')}
              </button>
            </div>

            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="animate-pulse rounded-2xl bg-slate-100 h-48" />
                ))}
              </div>
            ) : suggestions.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="tour-card overflow-hidden"
                  >
                    {suggestion.image_url && (
                      <div className="relative h-40 w-full bg-slate-100">
                        <img
                          src={suggestion.image_url}
                          alt={suggestion.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-[#2E7D32] mb-2">
                        {suggestion.category}
                      </span>
                      <h3 className="font-bold text-slate-900">
                        {locale === 'ar' && suggestion.title_ar
                          ? suggestion.title_ar
                          : locale === 'en' && suggestion.title_en
                          ? suggestion.title_en
                          : suggestion.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                        {locale === 'ar' && suggestion.description_ar
                          ? suggestion.description_ar
                          : locale === 'en' && suggestion.description_en
                          ? suggestion.description_en
                          : suggestion.description}
                      </p>
                      {suggestion.place_name && (
                        <p className="mt-2 text-xs text-slate-400">
                          📍 {suggestion.place_name}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <p className="text-5xl mb-4">🔍</p>
                <p className="font-medium">{t('no_suggestions')}</p>
                <p className="text-sm mt-1">{t('try_different_mood')}</p>
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
