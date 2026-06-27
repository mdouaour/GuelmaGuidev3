import { type Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { serverGetPlaces } from '@/lib/server-api'
import DiscoverClient from '@/components/DiscoverClient'

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const sParams = await searchParams
  const t = await getTranslations({ locale, namespace: 'metadata' })
  
  const title = sParams.keyword 
    ? t('discover_search_title', { keyword: sParams.keyword }) 
    : t('discover_title')
  
  const description = t('discover_desc')

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://guelma.guide/${locale}/discover`,
      siteName: 'GuelmaGuide',
      images: [
        {
          url: '/discover-og.png',
          width: 1200,
          height: 630,
          alt: 'Discover Guelma',
        },
      ],
      locale: locale === 'ar' ? 'ar_DZ' : locale === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/discover-og.png'],
    },
  }
}

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    keyword?: string
    theme?: string
    category?: string
    page?: string
  }>
}

export default async function DiscoverPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const sParams = await searchParams
  
  const queryParams = new URLSearchParams({
    page: sParams.page ?? '1',
    limit: '12',
  })
  
  if (sParams.keyword) queryParams.set('keyword', sParams.keyword)
  if (sParams.theme) queryParams.set('theme', sParams.theme)
  if (sParams.category && sParams.category !== 'all') queryParams.set('category', sParams.category)

  const initialData = await serverGetPlaces(queryParams, locale).catch(err => {
    console.warn('Silent discover fetch error:', err)
    return { results: [], total: 0, page: 1, limit: 12 }
  })

  return <DiscoverClient initialData={initialData} />
}
