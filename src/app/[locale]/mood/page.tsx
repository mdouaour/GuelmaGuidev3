import { type Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import MoodClient from './MoodClient'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })
  return {
    title: t('mood_title'),
    description: t('mood_desc'),
  }
}

export default function MoodPage() {
  return <MoodClient />
}
