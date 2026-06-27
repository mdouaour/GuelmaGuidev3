const STORAGE_KEY = 'guelma-search-history'
const MAX_ITEMS = 10

export interface SearchHistoryItem {
  query: string
  timestamp: number
}

export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SearchHistoryItem[]
  } catch {
    return []
  }
}

export function getPopularSearches(): string[] {
  const history = getSearchHistory()
  const freq = new Map<string, number>()
  for (const item of history) {
    freq.set(item.query, (freq.get(item.query) || 0) + 1)
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([query]) => query)
}

export function addToSearchHistory(query: string): void {
  if (typeof window === 'undefined') return
  const trimmed = query.trim()
  if (!trimmed || trimmed.length <= 1) return
  const history = getSearchHistory()
  const filtered = history.filter(item => item.query.toLowerCase() !== trimmed.toLowerCase())
  const updated = [{ query: trimmed, timestamp: Date.now() }, ...filtered].slice(0, MAX_ITEMS)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

export function removeSearchHistoryItem(query: string): void {
  if (typeof window === 'undefined') return
  const history = getSearchHistory()
  const updated = history.filter(item => item.query !== query)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
