'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/context/AuthContext'

interface ReviewFormProps {
  placeId: number
  onReviewSubmitted: () => void
}

export default function ReviewForm({ placeId, onReviewSubmitted }: ReviewFormProps) {
  const t = useTranslations('places')
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || rating === 0 || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/places/${placeId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating, text }),
      })
      if (response.ok) {
        setRating(0)
        setText('')
        onReviewSubmitted()
      }
    } catch (error) {
      console.error('Failed to submit review:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
        <p className="text-sm text-slate-500">{t('not_logged_in')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">{t('add_review')}</h3>
      
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">{t('rating')}</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                size={28}
                className={
                  (hoverRating || rating) >= star
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-slate-100 text-slate-200'
                }
              />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('reviews')}
          rows={3}
          className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
        />
      </div>

      <button
        type="submit"
        disabled={rating === 0 || isSubmitting}
        className="w-full rounded-xl bg-[#2E7D32] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? '...' : t('submit')}
      </button>
    </form>
  )
}
