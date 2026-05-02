'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface FadeInSectionProps {
  children: ReactNode
  className?: string
}

export default function FadeInSection({ children, className = '' }: FadeInSectionProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setVisible(true)
        observer.disconnect()
      },
      { threshold: 0.12 },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={`fade-in-section ${visible ? 'is-visible' : ''} ${className}`.trim()}>
      {children}
    </div>
  )
}
