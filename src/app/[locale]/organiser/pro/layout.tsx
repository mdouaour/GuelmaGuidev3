import { type Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })

  return {
    title: t('organiser_pro_title'),
    description: t('organiser_pro_desc'),
  }
}

export default function OrganiserProLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
