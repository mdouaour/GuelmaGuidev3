'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, Check, Trash2, Info, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/context/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import { arDZ, fr, enUS } from 'date-fns/locale'

interface Notification {
  id: number
  title: string
  body: string
  type: 'info' | 'success' | 'warning' | 'error' | 'activity_reminder' | 'place_update' | 'system'
  read: boolean
  created_at: string
}

export default function NotificationDropdown({ locale }: { locale: string }) {
  const t = useTranslations('notifications')
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const dateLocale = locale === 'ar' ? arDZ : locale === 'fr' ? fr : enUS

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/notifications/`, {
        headers: {
          'Accept': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.items)
        setUnreadCount(data.unread_count)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }, [user])

  useEffect(() => {
    const initNotifications = async () => {
      if (user) {
        await fetchNotifications()
      }
    }
    initNotifications()
    
    if (user) {
      const interval = setInterval(fetchNotifications, 60000) // Poll every 60s
      return () => clearInterval(interval)
    }
  }, [user, fetchNotifications])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen && unreadCount > 0) {
      // Potentially mark all as read or just let the user see them
    }
  }

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH',
      })
      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllRead = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/notifications/read-all`, {
        method: 'PATCH',
      })
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-emerald-500" size={16} />
      case 'warning': return <AlertCircle className="text-amber-500" size={16} />
      case 'error': return <AlertCircle className="text-rose-500" size={16} />
      case 'activity_reminder': return <Clock className="text-blue-500" size={16} />
      default: return <Info className="text-slate-400" size={16} />
    }
  }

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef} id="notification-dropdown">
      <button
        onClick={handleToggle}
        className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100 transition-colors"
        id="notification-bell"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl z-[1000] rtl:right-auto rtl:left-0"
          >
            <div className="flex items-center justify-between border-b border-slate-50 p-4">
              <h3 className="font-bold text-slate-900">{t('title')}</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs font-semibold text-[#2E7D32] hover:underline"
                >
                  {t('mark_all_read')}
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="mb-3 rounded-full bg-slate-50 p-3 text-slate-300">
                    <Bell size={32} />
                  </div>
                  <p className="text-sm font-medium text-slate-400">{t('empty')}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`group relative flex gap-3 p-4 transition-colors hover:bg-slate-50 ${!notification.read ? 'bg-emerald-50/30' : ''}`}
                    >
                      <div className="mt-1 flex-shrink-0">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <p className={`text-sm font-semibold text-slate-900 ${!notification.read ? 'pr-6' : ''}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="absolute top-4 right-4 text-slate-300 hover:text-[#2E7D32] transition-colors"
                              title="Mark as read"
                            >
                              <Check size={14} />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {notification.body}
                        </p>
                        <p className="text-[10px] font-medium text-slate-400">
                          {formatDistanceToNow(new Date(notification.created_at), { 
                            addSuffix: true,
                            locale: dateLocale
                          })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="absolute top-1/2 -translate-y-1/2 right-4 h-2 w-2 rounded-full bg-[#2E7D32]" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
