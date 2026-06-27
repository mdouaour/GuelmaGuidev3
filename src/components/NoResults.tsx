'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Search, MapPin, RefreshCw } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getPopularSearches } from '@/lib/search-history'

const categories = ['forest', 'culture', 'nature', 'sports', 'relaxation', 'thermal_baths'] as const

interface NoResultsProps {
  query: string
  onCategoryClick: (category: string) => void
  onClearFilters: () => void
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1
    }
  }
  return dp[m][n]
}

export default function NoResults({ query, onCategoryClick, onClearFilters }: NoResultsProps) {
  const t = useTranslations('discover')
  const popularSearches = useMemo(() => getPopularSearches(), [])

  const didYouMean = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase().trim()
    const suggestions: { key: string; label: string; dist: number }[] = []

    for (const cat of categories) {
      const catLabel = t(`filter_${cat}`).toLowerCase()
      const dist = levenshtein(q, cat) < 3 ? levenshtein(q, cat) :
                   levenshtein(q, catLabel) < 4 ? levenshtein(q, catLabel) : Infinity
      if (dist < 4) {
        suggestions.push({ key: cat, label: t(`filter_${cat}`), dist })
      }
    }

    return suggestions.sort((a, b) => a.dist - b.dist).slice(0, 3)
  }, [query, t])

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
        <Search size={28} className="text-slate-300" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{t('no_results_title')}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {query.trim()
          ? t('no_results_for', { keyword: query })
          : t('no_results_desc')}
      </p>

      {didYouMean.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-slate-500">{t('did_you_mean')}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {didYouMean.map((s) => (
              <button
                key={s.key}
                onClick={() => onCategoryClick(s.key)}
                className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-[#2E7D32] transition-colors hover:bg-emerald-100"
                type="button"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        <p className="mb-2 text-xs font-medium text-slate-500">{t('suggested_categories')}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryClick(cat)}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-[#2E7D32] hover:text-[#2E7D32]"
              type="button"
            >
              <MapPin size={12} />
              {t(`filter_${cat}`)}
            </button>
          ))}
        </div>
      </div>

      {popularSearches.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-slate-500">{t('popular_searches')}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {popularSearches.map((search) => (
              <span
                key={search}
                className="rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-500"
              >
                {search}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onClearFilters}
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#2E7D32] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-[#256b28] active:scale-95"
        type="button"
      >
        <RefreshCw size={16} />
        {t('explore_all')}
      </button>
    </div>
  )
}
