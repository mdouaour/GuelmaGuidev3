import { type Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { serverGetActivities } from '@/lib/server-api'
import ActivitiesClient from '@/components/ActivitiesClient'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })
  const title = t('activities_title')
  const description = t('activities_desc')

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://guelma.guide/${locale}/activities`,
      siteName: 'GuelmaGuide',
      images: [
        {
          url: '/activities-og.png',
          width: 1200,
          height: 630,
          alt: 'Activities in Guelma',
        },
      ],
      locale: locale === 'ar' ? 'ar_DZ' : locale === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/activities-og.png'],
    },
  }
}

export const revalidate = 3600

export default async function ActivitiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  
  const initialData = await serverGetActivities(new URLSearchParams({ page: '1', limit: '10' }), locale).catch(err => {
    console.warn('Silent activities fetch error:', err)
    return { results: [], total: 0 }
  })

  return <ActivitiesClient initialActivities={initialData.results || []} initialTotal={initialData.total || 0} />
}
