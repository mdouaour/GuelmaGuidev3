'use client'

import { useState } from 'react'
import FadeInSection from '@/components/FadeInSection'
import { useTranslations } from 'next-intl'
import { Camera, Heart, Upload, Trophy, Image } from 'lucide-react'
import type { PhotoChallenge, PhotoSubmission } from '@/lib/api'

const mockChallenge: PhotoChallenge = {
  id: 1,
  theme: 'Hidden Doors of Guelma',
  theme_ar: 'الأبواب المخفية لقالمة',
  description: 'Find and photograph the most beautiful doorways in the old town. Bonus points for stories!',
  description_ar: 'ابحث عن أجمل الأبواب في المدينة القديمة وصورها',
  start_date: new Date(Date.now() - 86400000 * 3).toISOString(),
  end_date: new Date(Date.now() + 86400000 * 4).toISOString(),
  submissions_count: 12,
  is_active: true,
}

const mockSubmissions: PhotoSubmission[] = [
  { id: 1, photo_url: '/photos/door1.jpg', caption: 'Old town entrance, built 1890', submitted_at: new Date().toISOString(), user_name: 'Amina K.', likes_count: 14, is_liked: false },
  { id: 2, photo_url: '/photos/door2.jpg', caption: 'Blue door near the mosque', submitted_at: new Date().toISOString(), user_name: 'Yacine B.', likes_count: 11, is_liked: true },
  { id: 3, photo_url: '/photos/door3.jpg', caption: 'Roman doorframe reused in modern wall', submitted_at: new Date().toISOString(), user_name: 'Sara M.', likes_count: 9, is_liked: false },
]

export default function PhotowalkClient() {
  const t = useTranslations('photowalk')
  const [challenge] = useState<PhotoChallenge>(mockChallenge)
  const [submissions] = useState<PhotoSubmission[]>(mockSubmissions)

  const daysLeft = Math.max(0, Math.ceil((new Date(challenge.end_date).getTime() - Date.now()) / 86400000))

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8">
      <FadeInSection>
        <h1 className="text-3xl font-semibold">{t('title')}</h1>

        <div className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                <span className="text-sm font-medium uppercase tracking-wide opacity-80">{t('weekly_challenge')}</span>
              </div>
              <h2 className="mt-2 text-2xl font-bold">{challenge.theme}</h2>
              <p className="mt-1 text-sm opacity-90">{challenge.description}</p>
            </div>
            <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-white/20">
              <span className="text-2xl font-bold">{daysLeft}</span>
              <span className="text-[10px] uppercase opacity-80">{t('days_left')}</span>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <div className="flex-1 rounded-xl bg-white/10 p-3 text-center">
              <p className="text-xl font-bold">{challenge.submissions_count}</p>
              <p className="text-xs opacity-80">{t('submissions')}</p>
            </div>
            <div className="flex-1 rounded-xl bg-white/10 p-3 text-center">
              <p className="text-xl font-bold">🏆</p>
              <p className="text-xs opacity-80">{t('reward')}</p>
            </div>
          </div>

          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 font-semibold text-violet-700 transition hover:bg-gray-100">
            <Upload className="h-4 w-4" />
            {t('submit_photo')}
          </button>
        </div>
      </FadeInSection>

      <FadeInSection>
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">{t('gallery')}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {submissions.map((sub) => (
              <div key={sub.id} className="group relative overflow-hidden rounded-2xl">
                <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <Image className="h-12 w-12 text-gray-400" />
                </div>
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                  <p className="text-sm font-medium text-white">{sub.user_name}</p>
                  <p className="text-xs text-white/80">{sub.caption}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <Heart className={`h-3.5 w-3.5 ${sub.is_liked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                    <span className="text-xs text-white">{sub.likes_count}</span>
                  </div>
                </div>
                {true && (
                  <div className="absolute left-2 top-2 rounded-full bg-amber-400 p-1">
                    <Trophy className="h-3.5 w-3.5 text-amber-900" />
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
