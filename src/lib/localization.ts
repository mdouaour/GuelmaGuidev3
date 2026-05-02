import { Place, RecommendationPlace } from './api'

export function getLocalizedName(place: Place | RecommendationPlace, locale: string): string {
  if (locale === 'ar' && place.name_ar) return place.name_ar
  if (locale === 'en' && place.name_en) return place.name_en
  return place.name
}

export function getLocalizedDescription(place: Place, locale: string): string {
  if (locale === 'ar' && place.description_ar) return place.description_ar
  if (locale === 'en' && place.description_en) return place.description_en
  return place.description
}
