'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { MapPin, Users, Calendar, Search, Plus, CheckCircle, X } from 'lucide-react'
import FadeInSection from '@/components/FadeInSection'
import { getMeetups, joinMeetup, leaveMeetup, type Meetup } from '@/lib/api'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/context/AuthContext'

const MOOD_FILTERS = ['all', 'stressed', 'bored', 'lonely', 'adventurous', 'peaceful', 'with-kids']

export default function MeetupsClient() {
  const t = useTranslations('meetups')
  const { user } = useAuth()
  const [meetups, setMeetups] = useState<Meetup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [joiningId, setJoiningId] = useState<number | null>(null)

  const fetchMeetups = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (activeFilter !== 'all') params.set('mood', activeFilter)
      if (searchQuery) params.set('search', searchQuery)
      const data = await getMeetups(params)
      setMeetups(data.results)
    } catch (err) {
      console.error('Failed to fetch meetups:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMeetups()
  }, [activeFilter, searchQuery])

  const handleJoin = async (meetupId: number) => {
    setJoiningId(meetupId)
    try {
      const result = await joinMeetup(meetupId)
      setMeetups(prev =>
        prev.map(m =>
          m.id === meetupId
            ? { ...m, is_joined: true, participants_count: result.participants_count }
            : m
        )
      )
    } catch (err) {
      console.error('Failed to join meetup:', err)
    } finally {
      setJoiningId(null)
    }
  }

  const handleLeave = async (meetupId: number) => {
    setJoiningId(meetupId)
    try {
      const result = await leaveMeetup(meetupId)
      setMeetups(prev =>
        prev.map(m =>
          m.id === meetupId
            ? { ...m, is_joined: false, participants_count: result.participants_count }
            : m
        )
      )
    } catch (err) {
      console.error('Failed to leave meetup:', err)
    } finally {
      setJoiningId(null)
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8">
      <FadeInSection>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
              {t('title')}
            </h1>
            <p className="text-slate-500">{t('subtitle')}</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-2xl bg-[#2E7D32] px-5 py-3 text-sm font-bold text-white transition-all hover:bg-[#286a2b] active:scale-95 shadow-lg shadow-emerald-900/20">
            <Plus size={18} />
            {t('create_meetup')}
          </button>
        </div>
      </FadeInSection>

      {/* Filters */}
      <FadeInSection>
        <section className="mb-8 space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('search_placeholder')}
              className="w-full rounded-2xl border border-slate-100 bg-white ps-11 pe-4 py-3 text-sm focus:border-[#2E7D32] focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {MOOD_FILTERS.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  activeFilter === filter
                    ? 'bg-[#2E7D32] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t(`filter_${filter}`)}
              </button>
            ))}
          </div>
        </section>
      </FadeInSection>

      {/* Meetups List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse rounded-2xl bg-slate-100 h-32" />
          ))}
        </div>
      ) : meetups.length > 0 ? (
        <section className="space-y-4">
          {meetups.map((meetup, index) => (
            <motion.article
              key={meetup.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="tour-card overflow-hidden p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-[#2E7D32]">
                      {meetup.mood}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {meetup.tags?.slice(0, 2).join(' · ')}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{meetup.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2">{meetup.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(meetup.date_time).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={14} />
                      {meetup.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users size={14} />
                      {meetup.participants_count}/{meetup.max_participants}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {t('organized_by', { name: meetup.organizer_name })}
                  </p>
                </div>
                <div className="flex sm:flex-col items-center gap-2">
                  {meetup.is_joined ? (
                    <button
                      onClick={() => handleLeave(meetup.id)}
                      disabled={joiningId === meetup.id}
                      className="inline-flex items-center gap-2 rounded-xl border-2 border-[#2E7D32] px-4 py-2 text-xs font-bold text-[#2E7D32] transition-all hover:bg-red-50 hover:border-red-300 hover:text-red-600 active:scale-95 disabled:opacity-50"
                    >
                      <CheckCircle size={14} />
                      {t('joined')}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoin(meetup.id)}
                      disabled={joiningId === meetup.id || meetup.participants_count >= meetup.max_participants}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#2E7D32] px-4 py-2 text-xs font-bold text-white transition-all hover:bg-[#286a2b] active:scale-95 disabled:opacity-50"
                    >
                      {t('join')}
                    </button>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </section>
      ) : (
        <div className="text-center py-16 text-slate-400">
          <p className="text-5xl mb-4">🤝</p>
          <p className="font-medium">{t('no_meetups')}</p>
          <p className="text-sm mt-1">{t('be_first_to_create')}</p>
        </div>
      )}
    </div>
  )
}
