'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { getPlaces, type Place } from '@/lib/api'
import { getLocalizedName } from '@/lib/localization'
import {
  getSearchHistory,
  addToSearchHistory,
  removeSearchHistoryItem,
  clearSearchHistory,
  type SearchHistoryItem,
} from '@/lib/search-history'
import { Clock, History, Mic, Search, X, Loader2 } from 'lucide-react'

declare global {
  interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    onresult: ((event: unknown) => void) | null
    onerror: ((event: unknown) => void) | null
    onend: (() => void) | null
    start(): void
    stop(): void
  }

  interface Window {
    SpeechRecognition?: new () => SpeechRecognition
    webkitSpeechRecognition?: new () => SpeechRecognition
  }
}

const categories = ['forest', 'culture', 'nature', 'sports', 'relaxation', 'thermal_baths'] as const

interface SuggestionItem {
  id: string
  type: 'history' | 'place' | 'category'
  label: string
  sublabel?: string
  value: string
  payload?: unknown
}

interface SearchAutocompleteProps {
  query: string
  onQueryChange: (value: string) => void
  onSearch: (value: string) => void
  locale: string
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-emerald-100 text-[#2E7D32] rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

export default function SearchAutocomplete({
  query,
  onQueryChange,
  onSearch,
  locale,
}: SearchAutocompleteProps) {
  const t = useTranslations('discover')
  const [suggestions, setSuggestions] = useState<{ id: number; name: string; category: string; theme: string }[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    const hasSpeech = typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    setSpeechSupported(hasSpeech)
  }, [])

  useEffect(() => {
    setHistory(getSearchHistory())
  }, [])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setIsSuggesting(true)
      try {
        const params = new URLSearchParams({
          keyword: query.trim(),
          limit: '5',
          status: 'approved',
        })
        const response = await getPlaces(params)
        setSuggestions(response.results)
      } catch {
        // Silently fail
      } finally {
        setIsSuggesting(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectableItems = useMemo(() => {
    const items: SuggestionItem[] = []

    if (query.length < 2 && history.length > 0) {
      for (const h of history) {
        items.push({
          id: `history-${h.timestamp}`,
          type: 'history',
          label: h.query,
          value: h.query,
          payload: h.timestamp,
        })
      }
    }

    for (const s of suggestions) {
      items.push({
        id: `place-${s.id}`,
        type: 'place',
        label: getLocalizedName(s as Place, locale) || s.name,
        sublabel: `${s.category} · ${s.theme}`,
        value: s.name || '',
      })
    }

    const q = query.toLowerCase().trim()
    if (q.length >= 1) {
      for (const cat of categories) {
        if (cat.includes(q) || q.includes(cat)) {
          items.push({
            id: `cat-${cat}`,
            type: 'category',
            label: t(`filter_${cat}`),
            sublabel: cat,
            value: cat,
          })
        }
      }
    }

    return items
  }, [query, history, suggestions, locale, t])

  const closeDropdown = useCallback(() => {
    setShowDropdown(false)
    setActiveIndex(-1)
  }, [])

  const selectItem = useCallback(
    (item: SuggestionItem) => {
      if (item.type === 'history') {
        onQueryChange(item.value)
        addToSearchHistory(item.value)
        onSearch(item.value)
        closeDropdown()
        return
      }
      if (item.type === 'place') {
        onQueryChange(item.label)
        addToSearchHistory(item.label)
        onSearch(item.label)
        closeDropdown()
        return
      }
      if (item.type === 'category') {
        onQueryChange('')
        onSearch('')
        closeDropdown()
        const event = new CustomEvent('category-select', { detail: item.value })
        window.dispatchEvent(event)
        return
      }
    },
    [onQueryChange, onSearch, closeDropdown],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || selectableItems.length === 0) {
      if (e.key === 'Enter') {
        addToSearchHistory(query)
        onSearch(query)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(prev => (prev < selectableItems.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(prev => (prev > 0 ? prev - 1 : selectableItems.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < selectableItems.length) {
          selectItem(selectableItems[activeIndex])
        } else {
          addToSearchHistory(query)
          onSearch(query)
          closeDropdown()
        }
        break
      case 'Escape':
        e.preventDefault()
        closeDropdown()
        break
    }
  }

  const startVoiceSearch = useCallback(() => {
    if (!speechSupported) return

    const SpeechRecognitionAPI = window.SpeechRecognition ?? window.webkitSpeechRecognition

    if (!SpeechRecognitionAPI) {
      setSpeechSupported(false)
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = locale === 'ar' ? 'ar-DZ' : locale === 'fr' ? 'fr-FR' : 'en-US'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event: unknown) => {
      const speechEvent = event as {
        results: { [index: number]: { [index: number]: { transcript: string }; length: number }; length: number }
      }
      const transcript = speechEvent.results[0][0].transcript
      onQueryChange(transcript)
      addToSearchHistory(transcript)
      onSearch(transcript)
      setIsListening(false)
      setVoiceError(null)
    }

    recognition.onerror = (event: unknown) => {
      const err = event as { error: string }
      setIsListening(false)
      if (err.error === 'no-speech') {
        setVoiceError(t('voice_no_speech'))
      } else if (err.error === 'aborted') {
        // User cancelled
      } else {
        setVoiceError(t('voice_error'))
      }
      setTimeout(() => setVoiceError(null), 3000)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [speechSupported, locale, onQueryChange, onSearch, t])

  const stopVoiceSearch = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  const handleInputChange = (value: string) => {
    onQueryChange(value)
    setShowDropdown(true)
  }

  const handleClear = () => {
    onQueryChange('')
    setSuggestions([])
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  const showHistory = showDropdown && query.length < 2 && history.length > 0 && !isSuggesting
  const showSuggestions = showDropdown && (suggestions.length > 0 || selectableItems.length > 0) && query.length >= 1
  const showDropdownContent = showHistory || showSuggestions || (showDropdown && isSuggesting)

  const scrollToItem = (index: number) => {
    const el = document.getElementById(`suggestion-${index}`)
    el?.scrollIntoView({ block: 'nearest' })
  }

  useEffect(() => {
    if (activeIndex >= 0) {
      scrollToItem(activeIndex)
    }
  }, [activeIndex])

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="relative flex items-center">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={t('search_keyword')}
          className="w-full rounded-xl border border-emerald-100 bg-white py-3 pe-10 ps-9 text-sm text-slate-900 outline-none focus:border-[#2E7D32] rtl:ps-10 rtl:pe-9"
          aria-label={t('search_keyword')}
          aria-expanded={showDropdownContent}
          aria-autocomplete="list"
          role="combobox"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute end-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Clear search"
            type="button"
          >
            <X size={16} />
          </button>
        )}
        {speechSupported && (
          <button
            onClick={isListening ? stopVoiceSearch : startVoiceSearch}
            className={`absolute end-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-all ${
              isListening
                ? 'text-red-500 bg-red-50 animate-pulse'
                : 'text-slate-400 hover:text-[#2E7D32] hover:bg-emerald-50'
            }`}
            aria-label={t('voice_search')}
            title={t('voice_search')}
            type="button"
          >
            {isListening ? <Mic size={16} className="animate-pulse" /> : <Mic size={16} />}
          </button>
        )}
      </div>

      {voiceError && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-600 shadow-lg">
          {voiceError}
        </div>
      )}

      {showDropdownContent && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-emerald-100 bg-white shadow-xl">
          {isSuggesting && (
            <div className="flex items-center justify-center gap-2 p-4">
              <Loader2 size={16} className="animate-spin text-[#2E7D32]" />
              <span className="text-xs text-slate-500">{t('searching')}</span>
            </div>
          )}

          {showHistory && (
            <div>
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-50">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <History size={12} />
                  {t('recent_searches')}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    clearSearchHistory()
                    setHistory([])
                  }}
                  className="text-[10px] text-slate-400 hover:text-rose-500 transition-colors"
                  type="button"
                >
                  {t('clear_all')}
                </button>
              </div>
              {history.map((item, index) => (
                <div
                  key={item.timestamp}
                  id={`suggestion-${index}`}
                  className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors ${
                    activeIndex === index ? 'bg-emerald-50' : 'hover:bg-slate-50'
                  }`}
                  onMouseDown={() => {
                    const suggestionItem: SuggestionItem = {
                      id: `history-${item.timestamp}`,
                      type: 'history',
                      label: item.query,
                      value: item.query,
                    }
                    selectItem(suggestionItem)
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <Clock size={14} className="shrink-0 text-slate-400" />
                  <span className="flex-1 text-sm text-slate-700 truncate">{item.query}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      removeSearchHistoryItem(item.query)
                      setHistory(getSearchHistory())
                    }}
                    className="shrink-0 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                    type="button"
                    aria-label={t('remove_history_item')}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showSuggestions && (
            <div>
              {suggestions.length > 0 && (
                <div className="px-3 py-2 border-b border-slate-50">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {t('search_suggestions')}
                  </span>
                </div>
              )}
              {selectableItems
                .filter(item => item.type !== 'history' || query.length >= 2)
                .map((item, idx) => {
                  const actualIndex = showHistory ? history.length + idx : idx
                  return (
                    <button
                      key={item.id}
                      id={`suggestion-${actualIndex}`}
                      onMouseDown={() => selectItem(item)}
                      onMouseEnter={() => setActiveIndex(actualIndex)}
                      className={`flex w-full flex-col px-3 py-2.5 text-left transition-colors rtl:text-right ${
                        activeIndex === actualIndex ? 'bg-emerald-50' : 'hover:bg-slate-50'
                      }`}
                      type="button"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
                        {item.type === 'category' && <Search size={14} className="shrink-0 text-[#2E7D32]" />}
                        {highlightMatch(item.label, query)}
                      </span>
                      {item.sublabel && (
                        <span className="mt-0.5 text-xs text-slate-500 capitalize">{item.sublabel}</span>
                      )}
                    </button>
                  )
                })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
