import { type Metadata } from 'next'
import CommunityClient from '@/components/CommunityClient'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const title = 'Evolution & Community | GuelmaGuide'
  const description = 'Join the team building the future of Guelma digital heritage. See top contributors and provide your feedback.'

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
