const defaultPlaceImage =
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80&auto=format&fit=crop'

const categoryImageMap: Record<string, string> = {
  forest:
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80&auto=format&fit=crop',
  nature:
    'https://images.unsplash.com/photo-1511497584788-876760111969?w=1200&q=80&auto=format&fit=crop',
  culture:
    'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&q=80&auto=format&fit=crop',
  sports:
    'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=1200&q=80&auto=format&fit=crop',
  sport:
    'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=1200&q=80&auto=format&fit=crop',
  relaxation:
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80&auto=format&fit=crop',
  thermal_baths:
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=80&auto=format&fit=crop',
}

export function getCategoryImage(category?: string | null) {
  if (!category) return defaultPlaceImage
  return categoryImageMap[category.toLowerCase()] ?? defaultPlaceImage
}

export function firstImageOrCategory(images: string[] | undefined, category?: string | null) {
  if (images?.[0]) return images[0]
  return getCategoryImage(category)
}

export function getActivityImage(title: string) {
  const normalized = title.toLowerCase()
  if (normalized.includes('football')) {
    return 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1200&q=80&auto=format&fit=crop'
  }
  if (normalized.includes('hiking') || normalized.includes('trail')) {
    return 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=1200&q=80&auto=format&fit=crop'
  }
  if (normalized.includes('coffee') || normalized.includes('meetup')) {
    return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&q=80&auto=format&fit=crop'
  }
  return 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=1200&q=80&auto=format&fit=crop'
}
