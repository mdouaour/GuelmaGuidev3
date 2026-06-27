'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { MessageCircle, MapPin, ThumbsUp, Star, Send, User, CheckCircle } from 'lucide-react'
import FadeInSection from '@/components/FadeInSection'
import { askLocal, getLocalAnswers, type LocalQuestion, type LocalAnswer } from '@/lib/api'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/context/AuthContext'

const QUESTION_CATEGORIES = ['food', 'places', 'culture', 'transport', 'safety', 'general']

export default function TouristClient() {
  const t = useTranslations('tourist')
  const { user } = useAuth()
  const [questions, setQuestions] = useState<LocalQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newQuestion, setNewQuestion] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('general')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'ask' | 'browse'>('browse')

  useEffect(() => {
    getLocalAnswers()
      .then(setQuestions)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestion.trim()) return

    setIsSubmitting(true)
    try {
      await askLocal(newQuestion, selectedCategory)
      setSubmitSuccess(true)
      setNewQuestion('')
      // Refresh questions
      const updated = await getLocalAnswers()
      setQuestions(updated)
      setTimeout(() => setSubmitSuccess(false), 5000)
    } catch (err) {
      console.error('Failed to submit question:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLikeAnswer = (questionId: number, answerId: number) => {
    setQuestions(prev =>
      prev.map(q =>
        q.id === questionId
          ? {
              ...q,
              answers: q.answers.map(a =>
                a.id === answerId
                  ? { ...a, is_liked: !a.is_liked, likes_count: a.is_liked ? a.likes_count - 1 : a.likes_count + 1 }
                  : a
              ),
            }
          : q
      )
    )
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

      {/* Tabs */}
      <FadeInSection>
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex-1 rounded-2xl py-3 text-sm font-bold transition-all ${
              activeTab === 'browse'
                ? 'bg-[#2E7D32] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t('browse_questions')}
          </button>
          <button
            onClick={() => setActiveTab('ask')}
            className={`flex-1 rounded-2xl py-3 text-sm font-bold transition-all ${
              activeTab === 'ask'
                ? 'bg-[#2E7D32] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t('ask_a_local')}
          </button>
        </div>
      </FadeInSection>

      <AnimatePresence mode="wait">
        {activeTab === 'ask' ? (
          <motion.section
            key="ask"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="tour-card p-6"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-6 inline-flex items-center gap-2">
              <MapPin size={20} />
              {t('be_my_local')}
            </h2>
            <p className="text-sm text-slate-500 mb-6">{t('ask_desc')}</p>

            {submitSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-700"
              >
                <CheckCircle size={16} className="inline me-2" />
                {t('question_submitted')}
              </motion.div>
            )}

            <form onSubmit={handleSubmitQuestion} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                  {t('category_label')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {QUESTION_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider transition-all ${
                        selectedCategory === cat
                          ? 'bg-[#2E7D32] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t(`category_${cat}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                  {t('question_label')}
                </label>
                <textarea
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  placeholder={t('question_placeholder')}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm focus:border-[#2E7D32] focus:outline-none resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={!newQuestion.trim() || isSubmitting || !user}
                className="w-full py-3 bg-[#2E7D32] text-white rounded-2xl font-bold transition-all hover:bg-[#286a2b] active:scale-[0.98] disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                <Send size={16} />
                {isSubmitting ? t('submitting') : user ? t('submit_question') : t('login_to_ask')}
              </button>
            </form>
          </motion.section>
        ) : (
          <motion.section
            key="browse"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse rounded-2xl bg-slate-100 h-40" />
                ))}
              </div>
            ) : questions.length > 0 ? (
              questions.map((question, qIndex) => (
                <motion.article
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: qIndex * 0.05 }}
                  className="tour-card p-6"
                >
                  {/* Question */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[#2E7D32]">
                      <MessageCircle size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{question.question}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                        <User size={12} />
                        <span>{question.asked_by}</span>
                        <span>·</span>
                        <span>{new Date(question.asked_at).toLocaleDateString()}</span>
                        <span>·</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase">
                          {question.category}
                        </span>
                      </div>
                    </div>
                    {question.is_resolved && (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                        ✓ {t('resolved')}
                      </span>
                    )}
                  </div>

                  {/* Answers */}
                  {question.answers.length > 0 && (
                    <div className="ms-13 space-y-3 border-slate-100 border-s ps-4">
                      {question.answers.map(answer => (
                        <div key={answer.id} className="rounded-xl bg-slate-50 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-slate-700">{answer.answer}</p>
                            {answer.is_best && (
                              <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 inline-flex items-center gap-1">
                                <Star size={10} className="fill-amber-500" />
                                {t('best_answer')}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <span className="font-medium text-slate-600">{answer.answered_by}</span>
                              {answer.is_local && (
                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                                  🏠 {t('local')}
                                </span>
                              )}
                              <span>·</span>
                              <span>{new Date(answer.answered_at).toLocaleDateString()}</span>
                            </div>
                            <button
                              onClick={() => handleLikeAnswer(question.id, answer.id)}
                              className={`inline-flex items-center gap-1 text-xs transition-all ${
                                answer.is_liked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'
                              }`}
                            >
                              <ThumbsUp size={12} className={answer.is_liked ? 'fill-red-500' : ''} />
                              {answer.likes_count}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.answers.length === 0 && (
                    <p className="ms-13 text-xs text-slate-400 italic">
                      {t('no_answers_yet')}
                    </p>
                  )}
                </motion.article>
              ))
            ) : (
              <div className="text-center py-16 text-slate-400">
                <p className="text-5xl mb-4">💬</p>
                <p className="font-medium">{t('no_questions')}</p>
                <p className="text-sm mt-1">{t('be_first_to_ask')}</p>
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
