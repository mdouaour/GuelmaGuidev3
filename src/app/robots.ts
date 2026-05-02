import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/profile/', '/my-activities/', '/onboarding/'],
    },
    sitemap: 'https://guelma.guide/sitemap.xml',
  }
}
