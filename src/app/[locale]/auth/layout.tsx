import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In | GuelmaGuide',
  description: 'Login to your account to manage your event registrations, bookmarks, and organiser settings in Guelma.',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
