'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from '@/i18n/navigation'

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    const checkOnboarding = () => {
      const isComplete = localStorage.getItem('onboarding_complete') === 'true'
      const isOnboardingPage = pathname.includes('/onboarding')

      if (!isComplete && !isOnboardingPage) {
        router.replace('/onboarding')
      } else {
        setShouldRender(true)
      }
    }
    checkOnboarding()
  }, [pathname, router])

  if (!shouldRender) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return <>{children}</>
}
