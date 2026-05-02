import { MetadataRoute } from 'next'
import { serverGetPlaces, serverGetActivities } from '@/lib/server-api'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ['en', 'ar', 'fr']
  const publicUrl = 'https://guelma.guide'

  // Static routes
  const staticRoutes = ['', '/discover', '/activities']
  const sitemapEntries: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    for (const route of staticRoutes) {
      sitemapEntries.push({
        url: `${publicUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'daily' : 'weekly',
        priority: route === '' ? 1 : 0.8,
      })
    }
  }

  // Dynamic Place routes
  try {
    const placesResponse = await serverGetPlaces(new URLSearchParams({ limit: '100' }))
    for (const place of placesResponse.results) {
      const slug = `${place.id}-${place.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
      for (const locale of locales) {
        sitemapEntries.push({
          url: `${publicUrl}/${locale}/place/${slug}`,
          lastModified: new Date(place.updated_at || new Date()),
          changeFrequency: 'monthly',
          priority: 0.6,
        })
      }
    }
  } catch (error) {
    console.error('Error generating place sitemap entries:', error)
  }

  return sitemapEntries
}
