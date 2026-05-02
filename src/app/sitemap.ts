import { MetadataRoute } from 'next'
import { landmarks } from '@/lib/landmarks'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://guelma.guide'
  const now = new Date()

  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/discover`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/activities`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${base}/ai`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    ...landmarks.map((landmark) => ({
      url: `${base}/place/${landmark.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]
}
