'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Shuffle, Clock, MapPin, ChevronDown, ChevronUp, Lightbulb, Footprints } from 'lucide-react'
import FadeInSection from '@/components/FadeInSection'
import { getExperiences, type Experience } from '@/lib/api'
import { useTranslations, useLocale } from 'next-intl'

export default function ExploreClient() {
  const t = useTranslations('explore')
  const locale = useLocale()
  const [currentExperience, setCurrentExperience] = useState<Experience | null>(null)
  const [allExperiences, setAllExperiences] = useState<Experience[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [showSteps, setShowSteps] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  useEffect(() => {
    getExperiences()
      .then(setAllExperiences)
      .catch(console.error)
  }, [])

  const surpriseMe = useCallback(() => {
    if (allExperiences.length === 0) return
    setIsSpinning(true)
    setShowSteps(false)
    setCompletedSteps(new Set())

    // Simulate spinning animation
    let spinCount = 0
    const spinInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * allExperiences.length)
      setCurrentExperience(allExperiences[randomIndex])
      spinCount++
      if (spinCount >= 10) {
        clearInterval(spinInterval)
        const finalIndex = Math.floor(Math.random() * allExperiences.length)
        setCurrentExperience(allExperiences[finalIndex])
        setIsSpinning(false)
      }
    }, 150)
  }, [allExperiences])

  const toggleStep = (index: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-emerald-50 text-emerald-700'
      case 'medium': return 'bg-amber-50 text-amber-700'
      case 'hard': return 'bg-red-50 text-red-700'
      default: return 'bg-slate-50 text-slate-700'
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl px-4 py-8">
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

      {/* Surprise Me Button */}
      <FadeInSection>
        <div className="flex justify-center mb-12">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={surpriseMe}
            disabled={isSpinning || allExperiences.length === 0}
            className="relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-fuchsia-500/30 transition-all hover:shadow-2xl hover:shadow-fuchsia-500/40 active:scale-95 disabled:opacity-50"
          >
            <motion.span
              animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.5, repeat: isSpinning ? Infinity : 0, ease: 'linear' }}
            >
              <Shuffle size={24} />
            </motion.span>
            {isSpinning ? t('spinning') : t('surprise_me')}
          </motion.button>
        </div>
      </FadeInSection>

      {/* Experience Card */}
      <AnimatePresence mode="wait">
        {currentExperience && (
          <motion.div
            key={currentExperience.id}
            initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotateY: 10 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="tour-card overflow-hidden"
          >
            {currentExperience.image_url && (
              <div className="relative h-48 w-full bg-gradient-to-br from-violet-100 to-fuchsia-100">
                <img
                  src={currentExperience.image_url}
                  alt={currentExperience.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${getDifficultyColor(currentExperience.difficulty)}`}>
                    {currentExperience.difficulty}
                  </span>
                </div>
              </div>
            )}
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {locale === 'ar' && currentExperience.title_ar
                    ? currentExperience.title_ar
                    : locale === 'en' && currentExperience.title_en
                    ? currentExperience.title_en
                    : currentExperience.title}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={14} />
                    {currentExperience.duration_minutes} {t('minutes')}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} />
                    {currentExperience.place_name || t('nearby')}
                  </span>
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-700">
                    {currentExperience.category}
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                {locale === 'ar' && currentExperience.description_ar
                  ? currentExperience.description_ar
                  : locale === 'en' && currentExperience.description_en
                  ? currentExperience.description_en
                  : currentExperience.description}
              </p>

              {/* Steps Accordion */}
              <div className="border-t border-slate-100 pt-4">
                <button
                  onClick={() => setShowSteps(!showSteps)}
                  className="flex w-full items-center justify-between text-sm font-bold text-slate-700"
                >
                  <span className="inline-flex items-center gap-2">
                    <Footprints size={16} />
                    {t('steps')}
                  </span>
                  {showSteps ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <AnimatePresence>
                  {showSteps && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-2">
                        {currentExperience.steps.map((step, index) => (
                          <button
                            key={index}
                            onClick={() => toggleStep(index)}
                            className={`w-full text-start rounded-xl p-3 text-sm transition-all ${
                              completedSteps.has(index)
                                ? 'bg-emerald-50 text-emerald-700 line-through'
                                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span className="inline-flex items-center gap-3">
                              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                completedSteps.has(index)
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-200 text-slate-600'
                              }`}>
                                {completedSteps.has(index) ? '✓' : index + 1}
                              </span>
                              {step}
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tips */}
              {currentExperience.tips.length > 0 && (
                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="inline-flex items-center gap-2 text-xs font-bold uppercase text-amber-700 mb-2">
                    <Lightbulb size={14} />
                    {t('tips')}
                  </p>
                  <ul className="space-y-1">
                    {currentExperience.tips.map((tip, i) => (
                      <li key={i} className="text-xs text-amber-800">
                        • {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!currentExperience && !isSpinning && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-5xl mb-4">🎲</p>
          <p className="font-medium">{t('press_surprise')}</p>
          <p className="text-sm mt-1">{t('press_surprise_desc')}</p>
        </div>
      )}
    </div>
  )
}
