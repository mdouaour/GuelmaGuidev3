import { type Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
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

    if (!place?.id) return null

    const activitiesResponse = await serverGetActivities(
      new URLSearchParams({ place: String(place.id), page: '1', limit: '6', availability: 'true' }),
      locale
    )

    return {
      place,
      activities: activitiesResponse?.results ?? []
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
    const t = await getTranslations({ locale, namespace: 'metadata' })
    return {
      title: t('place_not_found'),
    }
  }

  const title = `${data.place.name} | GuelmaGuide`
  const description = data.place.description?.slice(0, 160) ?? ''
  const image = data.place.images?.length > 0 ? data.place.images[0] : '/og-image.png'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://guelma.guide/${locale}/place/${slug}`,
      siteName: 'GuelmaGuide',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: data.place.name,
        },
      ],
      locale: locale === 'ar' ? 'ar_DZ' : locale === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    "name": data.place.name,
    "description": data.place.description,
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": data.place.latitude,
      "longitude": data.place.longitude,
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Guelma",
      "addressCountry": "DZ",
    },
    "image": data.place.images,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PlaceDetailsClient 
        initialPlace={data.place} 
        initialActivities={data.activities} 
      />
    </>
  )
}
