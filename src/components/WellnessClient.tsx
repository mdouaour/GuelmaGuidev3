'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Wind, Brain, Heart, Droplets, Sun, Timer, Play, Pause, RotateCcw, Check } from 'lucide-react'
import FadeInSection from '@/components/FadeInSection'
import { getDailyWellness, type WellnessTip } from '@/lib/api'
import { useTranslations } from 'next-intl'

const WELLNESS_ICONS: Record<string, React.ReactNode> = {
  breathing: <Wind size={24} />,
  meditation: <Brain size={24} />,
  stretching: <Sun size={24} />,
  gratitude: <Heart size={24} />,
  mindfulness: <Brain size={24} />,
  hydration: <Droplets size={24} />,
}

const WELLNESS_GRADIENTS: Record<string, string> = {
  breathing: 'from-sky-400 to-blue-500',
  meditation: 'from-purple-400 to-indigo-500',
  stretching: 'from-orange-400 to-red-500',
  gratitude: 'from-pink-400 to-rose-500',
  mindfulness: 'from-teal-400 to-emerald-500',
  hydration: 'from-cyan-400 to-blue-500',
}

export default function WellnessClient() {
  const t = useTranslations('wellness')
  const [tip, setTip] = useState<WellnessTip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    getDailyWellness()
      .then(data => {
        setTip(data)
        setTimerSeconds(data.duration_seconds)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    if (isTimerRunning) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isTimerRunning])

  const resetTimer = useCallback(() => {
    if (tip) {
      setTimerSeconds(tip.duration_seconds)
      setIsTimerRunning(false)
      setCurrentStepIndex(0)
      setCompletedSteps(new Set())
    }
  }, [tip])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const timerProgress = tip ? ((tip.duration_seconds - timerSeconds) / tip.duration_seconds) * 100 : 0

  const getLocalizedText = (field: string, arField?: string, enField?: string) => {
    const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'en' : 'en'
    if (locale === 'ar' && arField) return arField
    if (locale === 'en' && enField) return enField
    return field
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="animate-pulse rounded-2xl bg-slate-100 h-96" />
      </div>
    )
  }

  if (!tip) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 text-center">
        <p className="text-slate-400">{t('no_tip')}</p>
      </div>
    )
  }

  const gradient = WELLNESS_GRADIENTS[tip.type] || 'from-emerald-400 to-teal-500'
  const icon = WELLNESS_ICONS[tip.type] || <Sun size={24} />

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

      {/* Timer Card */}
      <FadeInSection>
        <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-8 text-white mb-8`}>
          <div className="absolute top-4 right-4">
            <div className="rounded-full bg-white/20 p-2">
              {icon}
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-widest font-bold text-white/70 mb-2">
              {tip.type}
            </p>
            <h2 className="text-2xl font-bold mb-2">
              {getLocalizedText(tip.title, tip.title_ar, tip.title_en)}
            </h2>
            <p className="text-sm text-white/80 mb-6">
              {getLocalizedText(tip.description, tip.description_ar, tip.description_en)}
            </p>

            {/* Circular Timer */}
            <div className="flex flex-col items-center">
              <div className="relative h-40 w-40 mb-6">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="6"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="white"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 45}
                    strokeDashoffset={2 * Math.PI * 45 * (1 - timerProgress / 100)}
                    transition={{ duration: 0.5 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Timer size={20} className="mb-1 text-white/70" />
                  <span className="text-3xl font-black tabular-nums">{formatTime(timerSeconds)}</span>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={resetTimer}
                  className="rounded-full bg-white/20 p-3 transition-all hover:bg-white/30 active:scale-95"
                >
                  <RotateCcw size={20} />
                </button>
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="rounded-full bg-white px-8 py-3 text-sm font-bold text-slate-900 transition-all hover:bg-white/90 active:scale-95"
                >
                  {isTimerRunning ? (
                    <span className="inline-flex items-center gap-2"><Pause size={16} /> {t('pause')}</span>
                  ) : (
                    <span className="inline-flex items-center gap-2"><Play size={16} /> {timerSeconds === 0 ? t('restart') : t('start')}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* Instructions */}
      <FadeInSection>
        <section className="tour-card p-6 mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">{t('instructions')}</h3>
          <div className="space-y-2">
            {tip.instructions.map((instruction, index) => (
              <button
                key={index}
                onClick={() => {
                  setCompletedSteps(prev => {
                    const next = new Set(prev)
                    if (next.has(index)) next.delete(index)
                    else next.add(index)
                    return next
                  })
                }}
                className={`w-full text-start rounded-xl p-3 text-sm transition-all flex items-center gap-3 ${
                  completedSteps.has(index)
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  completedSteps.has(index)
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {completedSteps.has(index) ? <Check size={14} /> : index + 1}
                </span>
                {instruction}
              </button>
            ))}
          </div>
        </section>
      </FadeInSection>

      {/* Benefits */}
      <FadeInSection>
        <section className="tour-card p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">{t('benefits')}</h3>
          <div className="flex flex-wrap gap-2">
            {tip.benefits.map((benefit, i) => (
              <span key={i} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                ✦ {benefit}
              </span>
            ))}
          </div>
        </section>
      </FadeInSection>
    </div>
  )
}
