'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export default function PWAPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Check if the prompt was already shown or dismissed
    const isDismissed = localStorage.getItem('pwa_prompt_dismissed')
    const visitCount = Number(localStorage.getItem('visit_count') || '0')
    const newVisitCount = visitCount + 1
    localStorage.setItem('visit_count', String(newVisitCount))

    if (isDismissed) return

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Only show after 2nd visit
      if (newVisitCount >= 2) {
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem('pwa_prompt_dismissed', 'true')
    }
    setShowPrompt(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa_prompt_dismissed', 'true')
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-20 left-4 right-4 z-[100] sm:bottom-6 sm:left-auto sm:right-6 sm:w-96"
        >
          <div className="relative overflow-hidden rounded-3xl bg-[#2E7D32] p-6 text-white shadow-2xl">
            <button
              onClick={handleDismiss}
              className="absolute right-4 top-4 rounded-full bg-black/10 p-1 transition-colors hover:bg-black/20"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                <Download size={24} />
              </div>
              <div>
                <h3 className="font-bold">Add to Home Screen</h3>
                <p className="text-xs text-emerald-50/80">
                  Install GuelmaGuide for a faster, offline experience.
                </p>
              </div>
            </div>
            <button
              onClick={handleInstall}
              className="mt-4 w-full rounded-xl bg-white py-2 text-sm font-bold text-[#2E7D32] transition-transform active:scale-95"
            >
              Install Now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
