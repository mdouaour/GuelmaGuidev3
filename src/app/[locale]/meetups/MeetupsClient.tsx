'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/context/AuthContext'
import FadeInSection from '@/components/FadeInSection'
import { Link } from '@/i18n/navigation'
import { Calendar, MapPin, Users, Clock, ChevronRight, Plus, Sparkles } from 'lucide-react'
import type { Meetup } from '@/lib/api'

const mockMeetups: Meetup[] = [
  {
    id: 1,
    title: 'Sunset at Théâtre Romain',
    description: 'Watch the sunset together at the Roman theater. Bring your camera!',
    date_time: new Date(Date.now() + 3600000 * 4).toISOString(),
    location: 'Théâtre Romain de Guelma',
    latitude: 36.4672,
    longitude: 7.43,
    max_participants: 8,
    participants_count: 5,
    is_joined: false,
    organizer_name: 'Amina K.',
    mood: 'peaceful',
    created_at: new Date().toISOString(),
    tags: ['photography', 'sunset', 'history'],
  },
  {
    id: 2,
    title: 'Maouna Hike — Saturday Morning',
    description: 'Early morning hike to the viewpoint. Moderate difficulty. bring water!',
    date_time: new Date(Date.now() + 86400000).toISOString(),
    location: 'Mont Maouna Trailhead',
    latitude: 36.48,
    longitude: 7.38,
    max_participants: 12,
    participants_count: 7,
    is_joined: false,
    organizer_name: 'Yacine B.',
    mood: 'adventurous',
    created_at: new Date().toISOString(),
    tags: ['hiking', 'nature', 'morning'],
  },
  {
    id: 3,
    title: 'Coffee & Conversation at Central Café',
    description: 'Casual Saturday afternoon meetup. Everyone welcome!',
    date_time: new Date(Date.now() + 86400000 + 3600000 * 14).toISOString(),
    location: 'Café Central, Guelma',
    latitude: 36.45,
    longitude: 7.433,
    max_participants: 6,
    participants_count: 3,
    is_joined: true,
    organizer_name: 'Sara M.',
    mood: 'social',
    created_at: new Date().toISOString(),
    tags: ['coffee', 'social', 'casual'],
  },
]

export default function MeetupsClient() {
  const t = useTranslations('meetups')
  const { user } = useAuth()
  const [meetups] = useState<Meetup[]>(mockMeetups)

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8">
      <FadeInSection>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">{t('title')}</h1>
            <p className="mt-1 text-muted-foreground">{t('subtitle')}</p>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700">
            <Plus className="h-4 w-4" />
            {t('create')}
          </button>
        </div>
      </FadeInSection>

      <FadeInSection>
        <div className="mt-8 space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'today', 'this_week', 'hiking', 'social', 'wellness'].map((filter) => (
              <button
                key={filter}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t(`filters.${filter}`)}
              </button>
            ))}
          </div>

          {meetups.map((meetup) => (
            <div
              key={meetup.id}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${
                        meetup.is_joined ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} />
                      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        {meetup.tags[0]}
                      </span>
                    </div>
                    <h3 className="mt-1.5 text-lg font-semibold">{meetup.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {meetup.participants_count}/{meetup.max_participants}
                    </span>
                  </div>
                </div>

                <p className="mt-2 text-sm text-gray-600">{meetup.description}</p>

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(meetup.date_time)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {meetup.location}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                      {meetup.organizer_name.charAt(0)}
                    </div>
                    <span className="text-sm text-gray-600">{meetup.organizer_name}</span>
                  </div>

                  {meetup.is_joined ? (
                    <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
                      {t('joined')}
                    </span>
                  ) : (
                    <button
                      disabled={!user}
                      className="flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {t('join')}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {meetups.length === 0 && (
            <div className="rounded-2xl bg-gray-50 p-12 text-center">
              <Sparkles className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">{t('no_meetups')}</p>
              <button className="mt-4 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white">
                {t('be_first')}
              </button>
            </div>
          )}
        </div>
      </FadeInSection>
    </div>
  )
}
