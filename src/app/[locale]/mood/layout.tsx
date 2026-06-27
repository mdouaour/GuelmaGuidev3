import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })
  const title = t('mood_title')
  const description = t('mood_desc')

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://guelma.guide/${locale}/mood`,
      siteName: 'GuelmaGuide',
      images: [
        {
          url: '/mood-og.png',
          width: 1200,
          height: 630,
          alt: 'Mood Discovery - GuelmaGuide',
        },
      ],
      locale: locale === 'ar' ? 'ar_DZ' : locale === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
    },
  }
}

export default function MoodLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
