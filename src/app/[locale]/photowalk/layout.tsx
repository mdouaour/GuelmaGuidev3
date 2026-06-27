import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })
  return {
    title: t('photowalk_title'),
    description: t('photowalk_desc'),
  }
}

export default function PhotoWalkLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
