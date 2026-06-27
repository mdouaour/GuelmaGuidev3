import { type Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import WellnessClient from './WellnessClient'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })
  return {
    title: t('wellness_title'),
    description: t('wellness_desc'),
  }
}

export default function WellnessPage() {
  return <WellnessClient />
}
