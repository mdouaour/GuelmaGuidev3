'use client'

import Image from 'next/image'
import { useMemo } from 'react'
import FadeInSection from '@/components/FadeInSection'
import { buildPlacePath, type Activity, type Place } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { getActivityImage, getCategoryImage } from '@/lib/visuals'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { getLocalizedName } from '@/lib/localization'

interface HomeClientProps {
  initialPlaces: Place[]
  initialActivities: Activity[]
}

export default function HomeClient({ initialPlaces, initialActivities }: HomeClientProps) {
  const t = useTranslations('home')
  const locale = useLocale()
  const { user } = useAuth()

  const isLoggedIn = useMemo(() => Boolean(user), [user])

  const userInterests = useMemo(() => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem('user_interests') || '[]') as string[]
    } catch {
      return []
    }
  }, [])

  const personalizedPlaces = useMemo(() => {
    if (userInterests.length === 0) return []
    return initialPlaces.filter(place => 
      userInterests.some(interest => 
        place.category.toLowerCase().includes(interest.toLowerCase()) || 
        place.theme.toLowerCase().includes(interest.toLowerCase())
      )
    ).slice(0, 4)
  }, [initialPlaces, userInterests])

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8">
      <FadeInSection>
        <section className="relative overflow-hidden rounded-3xl border border-emerald-100">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(46,125,50,0.74), rgba(79,195,247,0.58)), url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1800&q=80&auto=format&fit=crop')",
            }}
          />
          <div className="relative p-7 sm:p-10 rtl:text-right">
            <p className="mb-3 text-xs uppercase tracking-[0.22em] text-white/85">
              {t('welcome')}
            </p>
            <h1 className="text-4xl font-semibold text-white sm:text-5xl">{t('hero_title')}</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/90 sm:text-base rtl:ms-auto rtl:me-0">
              {t('hero_desc')}
            </p>
            <div className="mt-5 flex flex-wrap gap-3 rtl:flex-row-reverse">
              <Link
                href="/discover"
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-[#2E7D32] tour-hover"
              >
                {t('explore_places')}
              </Link>
              <Link
                href="/activities"
                className="rounded-xl border border-white/80 px-4 py-2.5 text-sm font-medium text-white tour-hover"
              >
                {t('view_activities')}
              </Link>
            </div>
          </div>
        </section>
      </FadeInSection>

      {!isLoggedIn ? (
        <FadeInSection className="mt-5">
          <section className="rounded-2xl border border-emerald-100 bg-white p-4 text-sm text-slate-700 rtl:text-right">
            {t('login_info')}
            <Link href="/auth" className="ms-2 text-[#2E7D32] underline rtl:ms-2 rtl:me-0">
              {t('login_info').includes('Login') || t('login_info').includes('تسجيل') ? '' : ''} {isLoggedIn ? '' : (t('explore_places').includes('Places') ? 'Login' : t('explore_places').includes('الأماكن') ? 'تسجيل الدخول' : 'Connexion')}
            </Link>
          </section>
        </FadeInSection>
      ) : null}

      {userInterests.length > 0 && personalizedPlaces.length > 0 && (
        <FadeInSection className="mt-8">
          <section className="rtl:text-right">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
                {locale === 'ar' ? 'من أجلك ✨' : locale === 'fr' ? 'Pour vous ✨' : 'For you ✨'}
              </h2>
              <div className="flex gap-1">
                {userInterests.slice(0, 3).map(interest => (
                  <span key={interest} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-[#2E7D32]">
                    #{interest}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-4 overflow-x-auto pb-2 scrollbar-hide sm:grid-cols-4">
              {personalizedPlaces.map(place => (
                <Link key={place.id} href={buildPlacePath(place)} className="tour-card tour-hover block min-w-[200px] overflow-hidden sm:min-w-0">
                  <div className="relative h-24 w-full">
                    <Image
                      src={getCategoryImage(place.category)}
                      alt={place.name}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-slate-900">{getLocalizedName(place, locale)}</p>
                    <p className="text-[10px] text-slate-500">{place.category}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </FadeInSection>
      )}

      <section className="mt-8 rtl:text-right">
        <h2 className="text-xl font-semibold text-slate-900">{t('preview')}</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <article>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#2E7D32] rtl:text-right">
              {t('places_title')}
            </h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {initialPlaces.map((place) => (
                <Link key={place.id} href={buildPlacePath(place)} className="tour-card tour-hover block overflow-hidden">
                  <div className="relative h-28 w-full">
                    <Image
                      src={getCategoryImage(place.category)}
                      alt={place.name}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-3 rtl:text-right">
                    <p className="inline-flex rounded-full bg-[#eaf6ef] px-2 py-0.5 text-[10px] uppercase text-[#2E7D32]">{place.category}</p>
                    <p className="mt-1 font-medium text-slate-900">{getLocalizedName(place, locale)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </article>
          <article>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#FF7043] rtl:text-right">
              {t('activities_title')}
            </h3>
            <div className="mt-3 space-y-3">
              {initialActivities.map((activity) => (
                <article key={activity.id} className="tour-card overflow-hidden">
                  <div className="relative h-24 w-full">
                    <Image
                      src={getActivityImage(activity.title)}
                      alt={activity.title}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-3 rtl:text-right">
                    <p className="font-medium text-slate-900">{activity.title}</p>
                    <p className="text-xs text-slate-600">{new Date(activity.date_time).toLocaleString()}</p>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>

      <FadeInSection className="mt-8">
        <section className="tour-card p-5 rtl:text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-[#2E7D32]">{t('ai_guide_title')}</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            {t('ai_guide_subtitle')}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {t('ai_guide_desc')}
          </p>
          <Link href="/ai" className="mt-4 inline-flex rounded-xl bg-[#2E7D32] px-4 py-2 text-sm font-medium text-white tour-hover">
            {t('try_ai')}
          </Link>
        </section>
      </FadeInSection>
    </div>
  )
}
