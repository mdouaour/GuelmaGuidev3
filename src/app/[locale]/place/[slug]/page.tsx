import { type Metadata } from 'next'
import { notFound } from 'next/navigation'
import PlaceDetailsClient from '@/components/PlaceDetailsClient'
import { serverGetPlace, serverGetPlaces, serverGetActivities } from '@/lib/server-api'
import { resolvePlaceIdFromIdentifier, identifierToPlaceKeyword, type Place } from '@/lib/api'

export const revalidate = 3600 // ISR: Revalidate every hour

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

async function getPlaceData(slug: string, locale: string) {
  const resolvedId = resolvePlaceIdFromIdentifier(slug)
  let place: Place

  try {
    if (resolvedId) {
      place = await serverGetPlace(resolvedId, locale)
    } else {
      const keyword = identifierToPlaceKeyword(slug)
      if (!keyword) return null
      const placeResults = await serverGetPlaces(new URLSearchParams({ keyword, page: '1', limit: '1' }), locale)
      if (!placeResults.results[0]) return null
      place = placeResults.results[0]
    }

    const activitiesResponse = await serverGetActivities(
      new URLSearchParams({ place: String(place.id), page: '1', limit: '6', availability: 'true' }),
      locale
    )

    return {
      place,
      activities: activitiesResponse.results
    }
  } catch (error) {
    console.error('Error fetching place data:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params
  const data = await getPlaceData(slug, locale)
  
  if (!data) {
    return {
      title: 'Place Not Found | GuelmaGuide',
    }
  }

  return {
    title: `${data.place.name} | GuelmaGuide`,
    description: data.place.description.slice(0, 160),
    openGraph: {
        images: data.place.images.length > 0 ? [data.place.images[0]] : [],
    }
  }
}

export async function generateStaticParams() {
  const locales = ['en', 'ar', 'fr']
  // Pre-render the top 20 places for each locale
  try {
    const response = await serverGetPlaces(new URLSearchParams({ page: '1', limit: '20' }))
    const paths = []
    for (const locale of locales) {
      for (const place of response.results) {
        paths.push({
          locale,
          slug: `${place.id}-${place.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
        })
      }
    }
    return paths
  } catch {
    return []
  }
}

export default async function PlacePage({ params }: PageProps) {
  const { slug, locale } = await params
  const data = await getPlaceData(slug, locale)

  if (!data) {
    notFound()
  }

  return (
    <PlaceDetailsClient 
      initialPlace={data.place} 
      initialActivities={data.activities} 
    />
  )
}
