import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Organiser Pro | GuelmaGuide',
  description: 'Upgrade to GuelmaGuide Pro to unlock unlimited activities, priority listing, and advanced analytics for your events in Guelma.',
}

export default function OrganiserProLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
