import { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import enMessages from '../../../messages/en.json'

type Props = {
  children: ReactNode
}

export default function OfflineLayout({ children }: Props) {
  return (
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {children}
    </NextIntlClientProvider>
  )
}
