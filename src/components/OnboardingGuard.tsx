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
    return null // or a loading splash screen
  }

  return <>{children}</>
}
