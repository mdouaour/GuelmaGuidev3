import { MetadataRoute } from 'next'
import { serverGetPlaces, serverGetActivities } from '@/lib/server-api'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ['en', 'ar', 'fr']
  const publicUrl = 'https://guelma.guide'

  const staticRoutes = [
    { path: '', priority: 1, changefreq: 'daily' as const },
    { path: '/discover', priority: 0.9, changefreq: 'weekly' as const },
    { path: '/activities', priority: 0.8, changefreq: 'weekly' as const },
    { path: '/ai', priority: 0.7, changefreq: 'weekly' as const },
    { path: '/community', priority: 0.7, changefreq: 'weekly' as const },
    { path: '/explore', priority: 0.6, changefreq: 'weekly' as const },
    { path: '/mood', priority: 0.5, changefreq: 'weekly' as const },
    { path: '/tourist', priority: 0.6, changefreq: 'monthly' as const },
    { path: '/wellness', priority: 0.5, changefreq: 'weekly' as const },
    { path: '/wishlist', priority: 0.4, changefreq: 'monthly' as const },
  ]
  const sitemapEntries: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    for (const route of staticRoutes) {
      sitemapEntries.push({
        url: `${publicUrl}/${locale}${route.path}`,
        lastModified: new Date(),
        changeFrequency: route.changefreq,
        priority: route.priority,
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
