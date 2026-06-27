import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })
  return {
    title: t('explore_title'),
    description: t('explore_desc'),
  }
}

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
