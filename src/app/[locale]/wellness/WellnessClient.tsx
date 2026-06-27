'use client'

import { useState, useEffect } from 'react'
import FadeInSection from '@/components/FadeInSection'
import { useTranslations } from 'next-intl'
import { Play, Pause, RotateCcw, Wind, Droplets, Sun, Mountain } from 'lucide-react'
import type { WellnessTip } from '@/lib/api'

const mockTips: WellnessTip[] = [
  {
    id: 1,
    type: 'breathing',
    title: 'Thermal Breathwork',
    title_ar: 'تمارين التنفس الحراري',
    description: 'Practice deep breathing at Hammam Maskhoutine. The warm mineral air enhances relaxation.',
    description_ar: 'مارس التنفس العميق في حمام المسخوطين',
    duration_seconds: 120,
    instructions: [
      'Sit comfortably near the spring edge',
      'Close your eyes and feel the warm steam',
      'Inhale deeply for 4 counts through your nose',
      'Hold gently for 4 counts',
      'Exhale slowly for 6 counts through your mouth',
      'Repeat until you feel the tension release',
    ],
    benefits: ['Reduces stress', 'Improves circulation', 'Opens airways'],
    icon: 'wind',
    date: new Date().toISOString(),
  },
  {
    id: 2,
    type: 'gratitude',
    title: 'Sunset Appreciation',
    title_ar: 'تقدير الغروب',
    description: 'Take 2 minutes to watch the sunset from Héliopolis. Simple presence, deep peace.',
    duration_seconds: 120,
    instructions: ['Find a clear view of the west', 'Put your phone away', 'Notice the colors changing', 'Think of 3 things you are grateful for', 'Breathe slowly and let the day end'],
    benefits: ['Improves mindfulness', 'Reduces anxiety', 'Better sleep'],
    icon: 'sun',
    date: new Date().toISOString(),
  },
]

function getIcon(type: string) {
  switch (type) {
    case 'breathing': return <Wind className="h-8 w-8" />
    case 'gratitude': return <Sun className="h-8 w-8" />
    case 'stretching': return <Mountain className="h-8 w-8" />
    case 'hydration': return <Droplets className="h-8 w-8" />
    default: return <Wind className="h-8 w-8" />
  }
}

export default function WellnessClient() {
  const t = useTranslations('wellness')
  const [tips] = useState<WellnessTip[]>(mockTips)
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [timer, setTimer] = useState(0)

  const currentTip = tips[currentTipIndex]

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1)
      setCurrentStep((step) => {
        const stepDuration = Math.floor(currentTip.duration_seconds / currentTip.instructions.length)
        const nextStep = Math.floor((timer + 1) / stepDuration)
        return Math.min(nextStep, currentTip.instructions.length - 1)
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isPlaying, timer, currentTip])

  const reset = () => {
    setIsPlaying(false)
    setTimer(0)
    setCurrentStep(0)
  }

  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % tips.length)
    reset()
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8">
      <FadeInSection>
        <h1 className="text-3xl font-semibold">{t('title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('subtitle')}</p>
      </FadeInSection>

      <FadeInSection>
        <div className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-teal-400 to-emerald-600 p-8 text-white shadow-xl">
          <div className="flex items-center gap-3 opacity-80">
            {getIcon(currentTip.type)}
            <span className="text-sm font-medium uppercase tracking-wide">{t(`types.${currentTip.type}`)}</span>
          </div>
          <h2 className="mt-3 text-2xl font-bold">{currentTip.title}</h2>
          <p className="mt-2 text-sm opacity-90">{currentTip.description}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {currentTip.benefits.map((b, i) => (
              <span key={i} className="rounded-full bg-white/20 px-3 py-1 text-xs">
                {b}
              </span>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm opacity-80">
              {t('duration')}: {currentTip.duration_seconds}s
            </div>
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="rounded-full bg-white/20 p-2 transition hover:bg-white/30"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-2 rounded-full bg-white px-5 py-2 font-medium text-emerald-700 transition hover:bg-gray-100"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? t('pause') : t('start')}
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="h-1.5 rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all duration-1000"
                style={{ width: `${Math.min(100, (timer / currentTip.duration_seconds) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t('instructions')}</h3>
          <div className="mt-3 space-y-3">
            {currentTip.instructions.map((step, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-xl p-3 transition ${
                  i === currentStep && isPlaying
                    ? 'bg-emerald-50 ring-2 ring-emerald-200'
                    : i < currentStep
                    ? 'opacity-50'
                    : ''
                }`}
              >
                <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  i < currentStep
                    ? 'bg-emerald-500 text-white'
                    : i === currentStep && isPlaying
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {i < currentStep ? '✓' : i + 1}
                </span>
                <span className={`text-sm ${i === currentStep && isPlaying ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={nextTip}
          className="mt-4 w-full rounded-xl border-2 border-dashed border-gray-200 py-4 text-sm font-medium text-gray-500 transition hover:border-emerald-300 hover:text-emerald-600"
        >
          {t('next_tip')}
        </button>
      </FadeInSection>
    </div>
  )
}
