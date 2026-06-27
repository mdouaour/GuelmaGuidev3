import { type Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import CommunityClient from '@/components/CommunityClient'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })
  const title = t('community_title')
  const description = t('community_desc')

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://guelma.guide/${locale}/community`,
      siteName: 'GuelmaGuide',
      images: [
        {
          url: '/community-og.png',
          width: 1200,
          height: 630,
          alt: 'Guelma Community',
        },
      ],
      locale: locale === 'ar' ? 'ar_DZ' : locale === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
    },
  }
}

export default function CommunityPage() {
  return <CommunityClient />
}
