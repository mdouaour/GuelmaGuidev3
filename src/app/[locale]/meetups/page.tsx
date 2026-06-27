import { type Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import MeetupsClient from './MeetupsClient'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })
  return {
    title: t('meetups_title'),
    description: t('meetups_desc'),
  }
}

export default function MeetupsPage() {
  return <MeetupsClient />
}
