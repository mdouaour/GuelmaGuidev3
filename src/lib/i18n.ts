export const languages = ['en', 'ar'] as const

export type Language = (typeof languages)[number]

export interface LocalizedText {
  en: string
  ar: string
}

export function getText(field: LocalizedText | undefined, lang: Language): string {
  if (!field) return ''
  if (lang === 'ar') return field.ar
  return field.en
}

export function isArabicLanguage(locale: string | undefined): boolean {
  if (!locale) return false
  return locale.toLowerCase().startsWith('ar')
}
