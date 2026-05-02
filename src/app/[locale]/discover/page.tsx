import { type Metadata } from 'next'
import { serverGetPlaces } from '@/lib/server-api'
import DiscoverClient from '@/components/DiscoverClient'

export const metadata: Metadata = {
  title: 'Discover Places in Guelma | GuelmaGuide',
  description: 'Search and filter historical sites, natural wonders, and local favorites in Guelma. Use our interactive map to find your next destination.',
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
