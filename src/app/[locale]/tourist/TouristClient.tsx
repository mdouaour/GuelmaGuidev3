'use client'

import { useState } from 'react'
import FadeInSection from '@/components/FadeInSection'
import { useTranslations } from 'next-intl'
import { Globe, MessageCircle, UserPlus, MapPin, Send, ChevronDown, ChevronUp, ThumbsUp } from 'lucide-react'
import type { LocalQuestion, LocalAnswer } from '@/lib/api'

const mockQuestions: LocalQuestion[] = [
  {
    id: 1,
    asked_by: 'Marco T.',
    asked_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    answers_count: 3,
    is_resolved: false,
    category: 'history',
    question: 'Hi! I\'m visiting from Italy next week. What\'s the best way to explore the Roman theater? Is a guide worth it?',
    answers: [
      { id: 1, answer: 'Go at sunset! The light is magical. A guide is not necessary — the plaques are in French and Arabic. But bring water.', answered_by: 'Fatima G.', answered_at: new Date(Date.now() - 3600000).toISOString(), is_local: true, likes_count: 5, is_best: true, is_liked: false },
      { id: 2, answer: 'The museum next door has amazing Roman artifacts. Highly recommend both!', answered_by: 'Karim B.', answered_at: new Date(Date.now() - 1800000).toISOString(), is_local: true, likes_count: 3, is_best: false, is_liked: false },
    ],
  },
  {
    id: 2,
    asked_by: 'Julie R.',
    asked_at: new Date(Date.now() - 86400000).toISOString(),
    answers_count: 2,
    is_resolved: true,
    category: 'food',
    question: 'Where can I try traditional Guelma food? I want to eat like a local!',
    answers: [
      { id: 3, answer: 'Try Chez Ali near the market. Best tchenika in town — Guelma\'s traditional pastry!', answered_by: 'Yacine M.', answered_at: new Date(Date.now() - 82800000).toISOString(), is_local: true, likes_count: 8, is_best: true, is_liked: false },
    ],
  },
]

export default function TouristClient() {
  const t = useTranslations('tourist')
  const [questions] = useState<LocalQuestion[]>(mockQuestions)
  const [expandedId, setExpandedId] = useState<number | null>(1)
  const [newQuestion, setNewQuestion] = useState('')

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8">
      <FadeInSection>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100">
            <Globe className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>
      </FadeInSection>

      <FadeInSection>
        <div className="mt-6">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
            <h3 className="text-lg font-bold">{t('be_my_local')}</h3>
            <p className="mt-1 text-sm opacity-90">{t('be_my_local_desc')}</p>
            <button className="mt-4 flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-600 transition hover:bg-gray-100">
              <UserPlus className="h-4 w-4" />
              {t('offer_time')}
            </button>
          </div>
        </div>
      </FadeInSection>

      <FadeInSection>
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">{t('ask_local')}</h2>

          <div className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder={t('ask_placeholder')}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
              <button className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700">
                <Send className="h-4 w-4" />
                {t('ask')}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((q) => (
              <div
                key={q.id}
                className="rounded-2xl border border-gray-100 bg-white shadow-sm"
              >
                <button
                  onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                  className="flex w-full items-start gap-3 p-5 text-left"
                >
                  <MessageCircle className="h-5 w-5 flex-shrink-0 text-blue-500" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{q.asked_by}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{q.category}</span>
                      {q.is_resolved && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">✓</span>}
                    </div>
                    <p className="mt-1 text-sm text-gray-800">{q.question}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <span>{q.answers_count}</span>
                    {expandedId === q.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {expandedId === q.id && (
                  <div className="border-t border-gray-100 px-5 pb-5">
                    {q.answers.map((a) => (
                      <div key={a.id} className="mt-3 flex gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {a.answered_by.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{a.answered_by}</span>
                            {a.is_local && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">{t('local')}</span>}
                            {a.is_best && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">⭐ {t('best')}</span>}
                          </div>
                          <p className="mt-1 text-sm text-gray-700">{a.answer}</p>
                          <button className="mt-2 flex items-center gap-1 text-xs text-gray-400 transition hover:text-blue-500">
                            <ThumbsUp className="h-3 w-3" />
                            {a.likes_count}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </FadeInSection>
    </div>
  )
}
