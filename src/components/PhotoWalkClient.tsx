'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { Camera, Upload, Heart, Trophy, Clock, ImagePlus } from 'lucide-react'
import FadeInSection from '@/components/FadeInSection'
import { getPhotoChallenges, submitPhoto, type PhotoChallenge, type PhotoSubmission } from '@/lib/api'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/context/AuthContext'

export default function PhotoWalkClient() {
  const t = useTranslations('photowalk')
  const { user } = useAuth()
  const [challenges, setChallenges] = useState<PhotoChallenge[]>([])
  const [activeChallenge, setActiveChallenge] = useState<PhotoChallenge | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submissions, setSubmissions] = useState<PhotoSubmission[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getPhotoChallenges()
      .then(data => {
        setChallenges(data)
        const active = data.find(c => c.is_active)
        setActiveChallenge(active || data[0] || null)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setSubmitSuccess(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeChallenge || !selectedFile || !caption) return

    setIsSubmitting(true)
    try {
      const result = await submitPhoto(activeChallenge.id, selectedFile, caption)
      setSubmitSuccess(true)
      setCaption('')
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setSubmissions(prev => [result, ...prev])
    } catch (err) {
      console.error('Failed to submit photo:', err)
    } finally {
      setIsSubmitting(false)
    }
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

      {isLoading ? (
        <div className="animate-pulse rounded-2xl bg-slate-100 h-96" />
      ) : activeChallenge ? (
        <>
          {/* Active Challenge */}
          <FadeInSection>
            <section className="tour-card overflow-hidden mb-8">
              <div className="relative h-48 w-full bg-gradient-to-br from-orange-200 to-pink-200">
                {activeChallenge.winner_photo_url && (
                  <img
                    src={activeChallenge.winner_photo_url}
                    alt="Featured"
                    className="h-full w-full object-cover"
                  />
                )}
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase text-orange-600">
                    <Clock size={12} />
                    {t('active_challenge')}
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <h2 className="text-2xl font-bold text-slate-900">
                  {t('current_theme', { theme: activeChallenge.theme })}
                </h2>
                <p className="text-sm text-slate-600">{activeChallenge.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Camera size={14} />
                    {activeChallenge.submissions_count} {t('submissions')}
                  </span>
                  {activeChallenge.end_date && (
                    <span className="inline-flex items-center gap-1">
                      <Clock size={14} />
                      {t('ends')}: {new Date(activeChallenge.end_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </section>
          </FadeInSection>

          {/* Upload Section */}
          <FadeInSection>
            <section className="tour-card p-6 mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4 inline-flex items-center gap-2">
                <Camera size={20} />
                {t('submit_your_photo')}
              </h3>
              {submitSuccess && (
                <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-700">
                  {t('submit_success')}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 cursor-pointer hover:border-[#2E7D32] hover:bg-emerald-50/30 transition-all"
                >
                  {selectedFile ? (
                    <div className="text-center">
                      <ImagePlus size={32} className="mx-auto text-[#2E7D32] mb-2" />
                      <p className="text-sm font-medium text-slate-700">{selectedFile.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{t('click_to_change')}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-medium text-slate-600">{t('upload_prompt')}</p>
                      <p className="text-xs text-slate-400 mt-1">{t('upload_formats')}</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                    {t('caption_label')}
                  </label>
                  <textarea
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder={t('caption_placeholder')}
                    rows={2}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm focus:border-[#2E7D32] focus:outline-none resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!selectedFile || !caption || isSubmitting || !user}
                  className="w-full py-3 bg-[#2E7D32] text-white rounded-2xl font-bold transition-all hover:bg-[#286a2b] active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? t('submitting') : user ? t('submit') : t('login_to_submit')}
                </button>
              </form>
            </section>
          </FadeInSection>

          {/* Recent Submissions */}
          {activeChallenge.my_submission && (
            <FadeInSection>
              <section className="mb-8">
                <h3 className="text-lg font-bold text-slate-900 mb-4 inline-flex items-center gap-2">
                  <Trophy size={20} />
                  {t('my_submission')}
                </h3>
                <div className="tour-card overflow-hidden max-w-md">
                  <div className="relative h-64 w-full bg-slate-100">
                    <img
                      src={activeChallenge.my_submission.photo_url}
                      alt="My submission"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-slate-700">{activeChallenge.my_submission.caption}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                      <Heart size={12} className={activeChallenge.my_submission.is_liked ? 'fill-red-500 text-red-500' : ''} />
                      {activeChallenge.my_submission.likes_count}
                    </div>
                  </div>
                </div>
              </section>
            </FadeInSection>
          )}
        </>
      ) : (
        <div className="text-center py-16 text-slate-400">
          <p className="text-5xl mb-4">📸</p>
          <p className="font-medium">{t('no_challenges')}</p>
        </div>
      )}
    </div>
  )
}
