import type { Metadata } from 'next'
import { Inter, Cairo } from 'next/font/google'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import UnverifiedBanner from '@/components/UnverifiedBanner'
import BottomNav from '@/components/BottomNav'
import PWAPrompt from '@/components/PWAPrompt'
import { AuthProvider } from '@/context/AuthContext'
import OnboardingGuard from '@/components/OnboardingGuard'
import ErrorBoundary from '@/components/ErrorBoundary'
import RegisterSW from '@/components/RegisterSW'
import ThemeProvider from '@/components/ThemeProvider'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const cairo = Cairo({
  subsets: ['arabic'],
  variable: '--font-cairo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s | GuelmaGuide',
    default: 'GuelmaGuide | دليل قالمة الذكي',
  },
  description: 'استكشف المعالم التاريخية والجواهر المخفية والأنشطة المجتمعية في قالمة. مدعوم برؤى محلية وذكاء اصطناعي.',
  keywords: ['قالمة', 'الجزائر', 'المسرح الروماني كالاما', 'حمام دباغ', 'السياحة الجزائرية', 'دليل قالمة', 'Guelma', 'Algeria'],
  authors: [{ name: 'Guelma Community' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://guelma.guide'),
  alternates: {
    canonical: '/',
    languages: {
      'ar': '/ar',
      'fr': '/fr',
      'en': '/en',
    },
  },
  openGraph: {
    title: 'GuelmaGuide | دليل قالمة الذكي',
    description: 'استكشف الأماكن والأنشطة في قالمة مع دليل ذكي خفيف.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://guelma.guide',
    siteName: 'GuelmaGuide',
    locale: 'ar_DZ',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GuelmaGuide',
  },
  formatDetection: {
    telephone: false,
  },
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  
  if (!['ar', 'en', 'fr'].includes(locale)) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} className={`${inter.variable} ${cairo.variable}`}>
      <body className={`antialiased ${locale === 'ar' ? 'font-cairo' : 'font-inter'}`}>
        <ThemeProvider>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <OnboardingGuard>
              <ErrorBoundary>
                <Navbar />
                <UnverifiedBanner />
                <main className="pb-16 md:pb-0">{children}</main>
                <Footer />
                <BottomNav />
                <PWAPrompt />
                <RegisterSW />
              </ErrorBoundary>
            </OnboardingGuard>
          </AuthProvider>
        </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
