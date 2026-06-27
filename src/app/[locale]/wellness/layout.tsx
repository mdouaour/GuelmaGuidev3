import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })
  return {
    title: t('wellness_title'),
    description: t('wellness_desc'),
  }
}

export default function WellnessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
