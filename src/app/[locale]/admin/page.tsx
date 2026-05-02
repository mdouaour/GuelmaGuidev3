'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Search, 
  BadgeCheck, 
  BarChart3, 
  AlertTriangle,
  FileText,
  MapPin,
  Pencil,
  Plus
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import FadeInSection from '@/components/FadeInSection'
import { format } from 'date-fns'
import ImageUpload from '@/components/ImageUpload'
import { getPlaces, type Place } from '@/lib/api'

// Import localApiRequest
// import { API_BASE_URL } from '@/lib/api' 
// actually the relative fetch doesn't need API_BASE_URL if it's hitting Next.js routes

// We can define a local fetcher that uses fetch directly for relative paths which goes through Next.js proxy
const localFetch = async (path: string, init?: RequestInit) => {
   const headers = new Headers(init?.headers)
   headers.set('Content-Type', 'application/json')
   
   // Get CSRF token from cookies
   const getCsrfToken = () => {
      if (typeof document === 'undefined') return ''
      const match = document.cookie.match(/csrf_token=([^;]+)/)
      return match ? match[1] : ''
   }
   
   const method = (init?.method ?? 'GET').toUpperCase()
   if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
     const csrfToken = getCsrfToken()
     if (csrfToken) headers.set('X-CSRF-Token', csrfToken)
   }

   const res = await fetch(path, { ...init, headers })
   if (!res.ok) {
     const data = await res.json().catch(() => ({}))
     throw new Error(data.detail || 'Request failed')
   }
   return res.json()
}

type Tab = 'pending' | 'users' | 'places' | 'reported' | 'stats'

interface AdminStats {
  total_users: number
  total_places: number
  total_activities: number
  activities_this_month: number
}

interface PendingActivity {
  id: number
  title: string
  organizer_name: string
  place_name: string
  date_time: string
  approval_status: string
}

interface AdminUser {
  id: number
  full_name: string | null
  email: string
  role: string
  created_at: string
  avatar_url: string | null
  organizer_verified: boolean
}

export default function AdminPage() {
  const { user, isAuthLoading } = useAuth()
  const router = useRouter()
  const t = useTranslations('admin')
  const [activeTab, setActiveTab] = useState<Tab>('pending')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [pendingActivities, setPendingActivities] = useState<PendingActivity[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [places, setPlaces] = useState<Place[]>([])
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [rejectionReasons, setRejectionReasons] = useState<Record<number, string>>({})

  const fetchStats = async () => {
    try {
      const data = await localFetch('/api/admin/stats')
      setStats(data)
    } catch (e) { console.error(e) }
  }

  const fetchPendingActivities = async () => {
    try {
      const data = await localFetch('/api/admin/activities')
      setPendingActivities(data.results.filter((a: PendingActivity) => a.approval_status === 'pending'))
    } catch (e) { console.error(e) }
  }

  const fetchUsers = async () => {
    try {
      const data = await localFetch('/api/admin/users')
      setUsers(data)
    } catch (e) { console.error(e) }
  }

  const fetchPlaces = async () => {
    try {
      const data = await getPlaces(new URLSearchParams({ limit: '100' }))
      setPlaces(data.results)
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    if (!isAuthLoading && (!user || user.role !== 'admin')) {
      router.push('/')
    }
  }, [user, isAuthLoading, router])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats()
      fetchPendingActivities()
      fetchUsers()
      fetchPlaces()
    }
  }, [user])

  const handleApprove = async (id: number) => {
    try {
      await localFetch(`/api/admin/activities/${id}/approve`, {
        method: 'PATCH',
      })
      fetchPendingActivities()
    } catch (e) { console.error(e) }
  }

  const handleReject = async (id: number) => {
    const reason = rejectionReasons[id]
    try {
      await localFetch(`/api/admin/activities/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      })
      fetchPendingActivities()
      setRejectionReasons(prev => {
         const next = { ...prev }
         delete next[id]
         return next
      })
    } catch (e) { console.error(e) }
  }

  const handlePromote = async (id: number) => {
    try {
      await localFetch(`/api/admin/users/${id}/promote`, {
        method: 'PATCH',
      })
      fetchUsers()
    } catch (e) { console.error(e) }
  }

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isAuthLoading || !user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2E7D32] border-t-transparent" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20 pt-24 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <FadeInSection>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">{t('title')}</h1>
              <p className="mt-1 text-slate-500">Manage your platform and operations</p>
            </div>
            <div className="hidden sm:block">
              <div className="flex gap-2 rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-100">
                {(['pending', 'users', 'places', 'reported', 'stats'] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                      activeTab === tab
                        ? 'bg-[#2E7D32] text-white shadow-md'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {t(`tabs.${tab}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </FadeInSection>

        {/* Mobile Tabs */}
        <div className="mb-6 block sm:hidden">
           <select 
             value={activeTab} 
             onChange={(e) => setActiveTab(e.target.value as Tab)}
             className="w-full rounded-xl border-slate-200 bg-white p-3 text-sm font-bold shadow-sm"
           >
              {(['pending', 'users', 'places', 'reported', 'stats'] as Tab[]).map((tab) => (
                <option key={tab} value={tab}>{t(`tabs.${tab}`)}</option>
              ))}
           </select>
        </div>

        <div className="grid gap-6">
          <AnimatePresence mode="wait">
            {activeTab === 'pending' && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {pendingActivities.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
                    <CheckCircle className="mx-auto mb-4 text-emerald-500" size={48} />
                    <h3 className="text-xl font-bold text-slate-900">{t('activities.no_pending')}</h3>
                  </div>
                ) : (
                  pendingActivities.map((activity) => (
                    <div key={activity.id} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-slate-900">{activity.title}</h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                             <div className="flex items-center gap-1">
                               <Users size={14} />
                               <span>{activity.organizer_name}</span>
                             </div>
                             <div className="flex items-center gap-1">
                               <FileText size={14} />
                               <span>{activity.place_name}</span>
                             </div>
                             <div className="flex items-center gap-1">
                               <BarChart3 size={14} />
                               <span>{format(new Date(activity.date_time), 'PPP')}</span>
                             </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder={t('activities.reason_placeholder')}
                              value={rejectionReasons[activity.id] || ''}
                              onChange={(e) => setRejectionReasons(prev => ({ ...prev, [activity.id]: e.target.value }))}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                          </div>
                          <div className="flex gap-2">
                             <button
                               onClick={() => handleReject(activity.id)}
                               className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
                             >
                               <XCircle size={18} />
                               {t('activities.reject')}
                             </button>
                             <button
                               onClick={() => handleApprove(activity.id)}
                               className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-600 transition-colors hover:bg-emerald-100"
                             >
                               <CheckCircle size={18} />
                               {t('activities.approve')}
                             </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="relative">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input
                     type="text"
                     placeholder={t('users.search')}
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full rounded-2xl border border-slate-100 bg-white py-4 pl-12 pr-4 text-sm shadow-sm focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                   />
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">{t('users.search')}</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">{t('users.role')}</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">{t('users.joined')}</th>
                        <th className="px-6 py-4 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 overflow-hidden">
                                   {u.avatar_url ? <img src={u.avatar_url} alt={u.full_name || ''} className="h-full w-full object-cover" /> : u.full_name?.[0].toUpperCase()}
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-slate-900 flex items-center gap-1">
                                     {u.full_name}
                                     {u.organizer_verified && <BadgeCheck size={14} className="text-[#2E7D32]" />}
                                   </p>
                                   <p className="text-xs text-slate-500">{u.email}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                               u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                               u.role === 'organizer' ? 'bg-blue-100 text-blue-700' :
                               'bg-slate-100 text-slate-600'
                             }`}>
                               {u.role}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
                             {format(new Date(u.created_at), 'MMM d, yyyy')}
                          </td>
                          <td className="px-6 py-4 text-right">
                             {u.role === 'visitor' && (
                               <button
                                 onClick={() => handlePromote(u.id)}
                                 className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600 transition-colors hover:bg-emerald-100"
                               >
                                 {t('users.promote')}
                               </button>
                             )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'places' && (
              <motion.div
                key="places"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                   <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        placeholder="Search places..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-2xl border border-slate-100 bg-white py-4 pl-12 pr-4 text-sm shadow-sm focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                      />
                   </div>
                </div>

                <div className="grid gap-4">
                  {places.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                    <div key={p.id} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#2E7D32]">
                                <MapPin size={24} />
                             </div>
                             <div>
                                <h3 className="font-bold text-slate-900">{p.name}</h3>
                                <p className="text-xs text-slate-500 uppercase font-medium">{p.category} · {p.theme}</p>
                             </div>
                          </div>
                          <button 
                            onClick={() => setSelectedPlace(selectedPlace?.id === p.id ? null : p)}
                            className="rounded-xl bg-slate-50 p-2 text-slate-400 hover:bg-[#2E7D32] hover:text-white transition-colors"
                          >
                             <Pencil size={18} />
                          </button>
                       </div>
                       
                       <AnimatePresence>
                          {selectedPlace?.id === p.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                               <div className="pt-6 mt-6 border-t border-slate-50">
                                  <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                     Manage Photos
                                     <span className="text-[10px] bg-emerald-100 text-[#2E7D32] px-2 py-0.5 rounded-full uppercase">Cloudflare R2</span>
                                  </h4>
                                  <ImageUpload 
                                    place={p} 
                                    onUpdate={(updated) => {
                                      setPlaces(prev => prev.map(item => item.id === updated.id ? updated : item))
                                      setSelectedPlace(updated)
                                    }} 
                                  />
                               </div>
                            </motion.div>
                          )}
                       </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'reported' && (
              <motion.div
                key="reported"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-20 text-center"
              >
                <AlertTriangle className="mb-4 text-amber-500" size={48} />
                <h3 className="text-xl font-bold text-slate-900">Coming Soon</h3>
                <p className="mt-2 text-slate-500">Reported content management is currently in development.</p>
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                   {[
                     { label: t('stats.total_users'), value: stats?.total_users, color: 'blue' },
                     { label: t('stats.total_places'), value: stats?.total_places, color: 'emerald' },
                     { label: t('stats.total_activities'), value: stats?.total_activities, color: 'purple' },
                     { label: t('stats.this_month'), value: stats?.activities_this_month, color: 'amber' },
                   ].map((item, i) => (
                     <div key={i} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{item.label}</p>
                        <p className="mt-2 text-3xl font-black text-slate-900">{item.value ?? '...'}</p>
                        <div className={`mt-4 h-1.5 w-12 rounded-full bg-${item.color}-500/20`} />
                     </div>
                   ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  )
}
