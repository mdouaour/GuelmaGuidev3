import { getCsrfToken } from '@/lib/csrf'

function normalizeApiBaseUrl(value: string) {
  const withoutTrailingSlashes = value.replace(/\/+$/, '')
  return withoutTrailingSlashes.endsWith('/api/v1')
    ? withoutTrailingSlashes
    : `${withoutTrailingSlashes}/api/v1`
}

export const API_BASE_URL = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1',
)

export interface ApiErrorPayload {
  detail?: string
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function apiRequest<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, cache: 'no-store' })
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const payload = (await response.json()) as ApiErrorPayload
      if (payload.detail) message = payload.detail
    } catch {
      // no-op
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

let isRefreshing = false
let refreshPromise: Promise<{ success: boolean }> | null = null

async function localApiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')

  const method = (init.method ?? 'GET').toUpperCase()
  // Attach the CSRF double-submit token for all state-mutating methods.
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken)
    }
  }

  let response = await fetch(path, { ...init, headers, cache: 'no-store' })

  // Handle Unauthorized - Attempt silent refresh
  if (response.status === 401 && !path.includes('/api/auth/refresh') && !path.includes('/api/auth/login')) {
    if (!isRefreshing) {
      isRefreshing = true
      refreshPromise = fetch('/api/auth/refresh', { method: 'POST' })
        .then(async (res) => {
          isRefreshing = false
          if (!res.ok) throw new Error('Refresh failed')
          return res.json()
        })
        .catch((err) => {
          isRefreshing = false
          throw err
        })
    }

    try {
      await refreshPromise
      // Retry the original request
      response = await fetch(path, { ...init, headers, cache: 'no-store' })
    } catch {
      // Refresh failed, user needs to re-authenticate
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth?expired=true'
      }
    }
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const payload = (await response.json()) as ApiErrorPayload
      if (payload.detail) message = payload.detail
    } catch {
      // no-op
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export interface AuthUser {
  id: number
  email: string
  full_name?: string
  avatar_url?: string
  role: 'visitor' | 'organizer' | 'admin'
  organizer_verified: boolean
  email_verified: boolean
  organiser_pro: boolean
  pro_expires_at?: string
  created_at: string
  updated_at: string
}

export interface AuthSuccessResponse {
  user: AuthUser
}

export interface RegisterSuccessResponse {
  message: string
}

export interface Place {
  id: number
  name: string
  name_ar?: string
  name_en?: string
  description: string
  description_ar?: string
  description_en?: string
  latitude: number
  longitude: number
  category: string
  theme: string
  images: string[]
  created_at: string
  updated_at: string
  rating_avg: number
  rating_count: number
  is_saved: boolean
}

function slugifyPlaceName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function buildPlacePath(place: Pick<Place, 'id' | 'name'>) {
  return `/place/${place.id}-${slugifyPlaceName(place.name)}`
}

export function resolvePlaceIdFromIdentifier(identifier: string) {
  const match = identifier.match(/^(\d+)(?:-|$)/)
  if (!match) return null
  const parsed = Number(match[1])
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function identifierToPlaceKeyword(identifier: string) {
  return identifier.replace(/^\d+-?/, '').replace(/-/g, ' ').trim()
}

export interface Activity {
  id: number
  title: string
  description: string
  place_id: number
  place_name: string
  organizer_id: number
  date_time: string
  max_participants: number
  participants_count: number
  created_at: string
  updated_at: string
  mood: string | null
  visibility: string
  approval_status: string
  is_recurring: boolean
  recurrence_rule: string | null
  organizer_verified: boolean
  price_per_ticket: number | null
  currency: string
  is_featured: boolean
}

export interface PaginatedResponse<T> {
  total: number
  page: number
  limit: number
  results: T[]
}

export interface ActivityCreatePayload {
  title: string
  description: string
  place_id: number
  date_time: string
  max_participants: number
}

export interface RecommendationPlace {
  id: number
  name: string
  name_ar?: string
  name_en?: string
  category: string
  theme: string
  latitude: number
  longitude: number
  distance_km: number
  score: number
}

export interface RecommendationActivity {
  id: number
  title: string
  description: string
  place_id: number
  place_name: string
  place_category: string
  date_time: string
  max_participants: number
  participants_count: number
  available_slots: number
  is_joined: boolean
  distance_km: number
  score: number
}

export interface ActivityRegistration {
  user_id: number
  activity_id: number
  payment_status: 'free' | 'pending' | 'paid'
  created_at: string
}

export interface JoinResponse {
  is_paid: boolean
  checkout_url?: string
  registration?: ActivityRegistration
}

export interface ActivityTicket {
  activity: Activity
  registration: ActivityRegistration
}

export interface RecommendationsResponse {
  recommended_places: RecommendationPlace[]
  recommended_activities: RecommendationActivity[]
}

export function register(payload: { email: string; password: string }) {
  return localApiRequest<RegisterSuccessResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function login(payload: { email: string; password: string }) {
  return localApiRequest<AuthSuccessResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getMe() {
  return localApiRequest<AuthUser>('/api/auth/me')
}

export function logout() {
  return localApiRequest<void>('/api/auth/logout', { method: 'POST' })
}

export function getPlaces(params: URLSearchParams) {
  return apiRequest<PaginatedResponse<Place>>(`/places?${params.toString()}`)
}

export function getPlace(placeId: number) {
  return apiRequest<Place>(`/places/${placeId}`)
}

export function uploadPlaceImage(placeId: number, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return localApiRequest<Place>(`/api/places/${placeId}/images`, {
    method: 'POST',
    body: formData,
  })
}

export function deletePlaceImage(placeId: number, imageUrl: string) {
  return localApiRequest<Place>(
    `/api/places/${placeId}/images?image_url=${encodeURIComponent(imageUrl)}`,
    { method: 'DELETE' },
  )
}

export function getActivities(params: URLSearchParams) {
  return apiRequest<PaginatedResponse<Activity>>(`/activities?${params.toString()}`)
}

export function getMyActivities() {
  return localApiRequest<ActivityTicket[]>('/api/users/me/activities')
}

export function joinActivity(activityId: number) {
  return localApiRequest<JoinResponse>(
    `/api/activities/${activityId}/join`,
    { method: 'POST' },
  )
}

export function createActivity(payload: ActivityCreatePayload) {
  return localApiRequest<Activity>('/api/activities', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function leaveActivity(activityId: number) {
  return localApiRequest<void>(`/api/activities/${activityId}/leave`, { method: 'DELETE' })
}

export function getRecommendations(params: URLSearchParams) {
  return localApiRequest<RecommendationsResponse>(`/api/ai/recommendations?${params.toString()}`)
}

export function verifyEmail(token: string) {
  return apiRequest<{ message: string }>(
    `/auth/verify-email?token=${encodeURIComponent(token)}`,
  )
}

export function resendVerificationEmail(email: string) {
  return apiRequest<{ message: string }>('/auth/resend-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
}

export function subscribeToPro() {
  return localApiRequest<{ checkout_url: string }>('/api/organiser/subscribe', {
    method: 'POST',
  })
}

export interface OrganiserAnalytics {
  activity_id: number
  title: string
  registrations: number
  views: number
  conversion_rate: number
}

export function getOrganiserAnalytics() {
  return localApiRequest<OrganiserAnalytics[]>('/api/organiser/analytics')
}
