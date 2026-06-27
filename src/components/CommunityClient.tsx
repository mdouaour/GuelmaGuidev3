'use client'

import { Trophy, Users, MessageSquare, Award } from 'lucide-react'
import { motion } from 'motion/react'
import { useState, useEffect } from 'react'
import { getLeaderboard, type LeaderboardEntry, sendFeedback } from '@/lib/api'
import FadeInSection from '@/components/FadeInSection'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/context/AuthContext'

export default function CommunityClient() {
  const t = useTranslations('community')
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)

  useEffect(() => {
    getLeaderboard()
      .then(setLeaderboard)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)
    try {
      await sendFeedback({ subject, message })
      setFeedbackSuccess(true)
      setSubject('')
      setMessage('')
      setTimeout(() => setFeedbackSuccess(false), 5000)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <FadeInSection>
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">{t('title')}</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">{t('hero_desc')}</p>
        </div>
      </FadeInSection>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Leaderboard Section */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
               <Award size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{t('leaderboard')}</h2>
          </div>

          <div className="tour-card overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center animate-pulse text-slate-400">{t('loading')}</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {leaderboard.map((entry, index) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={entry.id} 
                    className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                        index === 0 ? 'bg-amber-100 text-amber-700' : 
                        index === 1 ? 'bg-slate-100 text-slate-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">{entry.name}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{entry.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-[#2E7D32]">{entry.points}</p>
                       <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{t('points')}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Feedback Section */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
               <MessageSquare size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{t('feedback_title')}</h2>
          </div>

          <div className="tour-card p-8 bg-white">
            <p className="text-sm text-slate-600 mb-8">{t('feedback_desc')}</p>
            
            {feedbackSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl text-center"
              >
                <p className="text-emerald-700 font-bold mb-1">{t('feedback_received')}</p>
                <p className="text-emerald-600 text-xs">{t('feedback_received_desc')}</p>
              </motion.div>
            ) : (
              <form onSubmit={handleFeedback} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">{t('subject_label')}</label>
                  <input 
                    required
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder={t('subject_placeholder')}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm focus:border-[#2E7D32] focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">{t('message_label')}</label>
                  <textarea 
                    required
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={t('message_placeholder')}
                    rows={5}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm focus:border-[#2E7D32] focus:outline-none resize-none"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSending || !user}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
                >
                  {isSending ? t('sending') : user ? t('send_feedback') : t('login_to_send')}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>

      {/* Roadmap Section */}
      <section className="mt-20">
         <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
               <Trophy size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{t('roadmap_title')}</h2>
         </div>
         <div className="grid gap-6 sm:grid-cols-3">
            {[
              { title: 'Digital Souvenirs', desc: 'NFT-based 3D models of Guelma landmarks for top contributors.', status: 'Research' },
              { title: 'Local Marketplace', desc: 'Space for Guelma artisans to sell traditional crafts directly.', status: 'Developing' },
              { title: 'AR History', desc: 'Augmented reality view to see ancient Roman Calama through your phone.', status: 'Planned' }
            ].map((item, i) => (
              <div key={i} className="tour-card p-6 bg-white border-l-4 border-emerald-500">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#2E7D32] bg-emerald-50 px-2 py-1 rounded inline-block mb-3">
                  {item.status}
                </span>
                <h4 className="font-bold text-slate-900 mb-2">{item.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
         </div>
      </section>

      {/* Ads Placeholder */}
      <section className="mt-20">
         <div className="tour-card overflow-hidden bg-slate-900 text-white relative">
            <div className="absolute inset-0 opacity-10 bg-[url('https://picsum.photos/seed/guelma_market/1200/400')] bg-cover bg-center" />
            <div className="relative p-12 text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-8">
               <div className="max-w-xl">
                   <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">{t('partner_title')}</p>
                   <h3 className="text-3xl font-black mb-4">{t('partner_heading')}</h3>
                   <p className="text-slate-400 text-sm leading-relaxed">{t('partner_desc')}</p>
               </div>
               <button 
                 onClick={() => {
                   setSubject('Partnership Inquiry')
                   window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
                 }}
                 className="whitespace-nowrap px-8 py-4 bg-[#2E7D32] hover:bg-[#286a2b] text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-emerald-900/40"
               >
                 {t('partner_cta')}
               </button>
            </div>
         </div>
      </section>
    </div>
  )
}
