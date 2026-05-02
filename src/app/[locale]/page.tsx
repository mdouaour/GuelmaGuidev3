import { type Metadata } from 'next'
import { serverGetActivities, serverGetPlaces } from '@/lib/server-api'
import HomeClient from '@/components/HomeClient'
import { type PaginatedResponse, type Place, type Activity } from '@/lib/api'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const title = 'GuelmaGuide | Discover Guelma Heritage & Nature'
  const description = 'Explore the best local spots, thermal baths, and community activities in Guelma, Algeria. Your interactive smart guide to the city.'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://guelma.guide/${locale}`,
      siteName: 'GuelmaGuide',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'GuelmaGuide Home',
        },
      ],
      locale: locale === 'ar' ? 'ar_DZ' : locale === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
  }
}

export const revalidate = 3600

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const placesParams = new URLSearchParams({ page: '1', limit: '6' })
  const activitiesParams = new URLSearchParams({ page: '1', limit: '3' })

  // Data fetching happens on the server during request time
  const [placesResponse, activitiesResponse] = await (Promise.all([
    serverGetPlaces(placesParams, locale),
    serverGetActivities(activitiesParams, locale),
  ]) as Promise<[PaginatedResponse<Place>, PaginatedResponse<Activity>]>).catch(err => {
    console.warn('Silent home fetch error:', err)
    return [{ results: [] }, { results: [] }] as unknown as [PaginatedResponse<Place>, PaginatedResponse<Activity>]
  })

  const initialPlaces = placesResponse?.results || []
  const initialActivities = activitiesResponse?.results || []

  return (
    <HomeClient 
      initialPlaces={initialPlaces} 
      initialActivities={initialActivities} 
    />
  )
}
