'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Check, Zap, BarChart3, Star, Crown } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { subscribeToPro } from '@/lib/api'
import { useTranslations } from 'next-intl'
import FadeInSection from '@/components/FadeInSection'

export default function OrganiserProPage() {
  const t = useTranslations('organiser_pro')
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await subscribeToPro()
      window.location.href = response.checkout_url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start subscription')
      setIsLoading(false)
    }
  }

  const features = [
    {
      icon: <Zap className="text-amber-500" size={24} />,
      title: t('feature_limit_title'),
      desc: t('feature_limit_desc'),
      pro: true,
      free: t('feature_limit_free'),
    },
    {
      icon: <Star className="text-emerald-500" size={24} />,
      title: t('feature_priority_title'),
      desc: t('feature_priority_desc'),
      pro: true,
      free: false,
    },
    {
      icon: <BarChart3 className="text-blue-500" size={24} />,
      title: t('feature_analytics_title'),
      desc: t('feature_analytics_desc'),
      pro: true,
      free: false,
    },
    {
      icon: <Crown className="text-purple-500" size={24} />,
      title: t('feature_badge_title'),
      desc: t('feature_badge_desc'),
      pro: true,
      free: false,
    },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <FadeInSection>
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-[#2E7D32] mb-6 border border-emerald-100 uppercase tracking-widest">
            <Crown size={14} />
            {t('badge')}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
      </FadeInSection>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Comparison Table */}
        <div className="space-y-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex gap-4 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm"
            >
              <div className="shrink-0 h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-slate-500 mb-2">{feature.desc}</p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#2E7D32]">
                    <Check size={12} /> Pro
                  </div>
                  {feature.free && (
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Free: {feature.free}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pricing Card */}
        <div className="sticky top-24">
          <div className="p-8 rounded-[40px] bg-slate-900 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-8">{t('pricing_title')}</h2>
              
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-6xl font-black tracking-tighter">500</span>
                <span className="text-xl font-bold text-slate-400">DZD / {t('month')}</span>
              </div>

              <ul className="space-y-4 mb-10">
                {features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    {f.title}
                  </li>
                ))}
              </ul>

              <button
                onClick={handleSubscribe}
                disabled={isLoading || user?.organiser_pro}
                className="w-full py-4 rounded-2xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/50"
              >
                {isLoading ? t('button_loading') : user?.organiser_pro ? t('button_already_pro') : t('button_upgrade')}
              </button>
              
              {error && <p className="mt-4 text-xs text-rose-400 text-center">{error}</p>}
              
              <p className="mt-6 text-[10px] text-center text-slate-500 uppercase tracking-widest font-medium">
                {t('cancel_anytime')}
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-6 rounded-3xl bg-emerald-50 border border-emerald-100 text-center">
            <p className="text-sm text-emerald-800 font-medium leading-relaxed">
               {t('support_text')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
