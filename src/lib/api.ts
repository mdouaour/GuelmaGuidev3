import { getCsrfToken } from '@/lib/csrf'

function getBrowserLocale(): string {
  if (typeof document === 'undefined') return 'en'
  return document.documentElement.lang || 'en'
}

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
  if (!headers.has('Accept-Language')) {
    headers.set('Accept-Language', getBrowserLocale())
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
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

  let response = await fetch(path, { ...init, headers })

  // Handle Unauthorized - Attempt silent refresh
  // Skip refresh for auth-check endpoints: /me and /logout are expected to 401 for anonymous users
  const isAuthEndpoint =
    path.includes('/api/auth/refresh') ||
    path.includes('/api/auth/login') ||
    path.includes('/api/auth/me') ||
    path.includes('/api/auth/logout')
  if (response.status === 401 && !isAuthEndpoint) {
    if (!isRefreshing) {
      isRefreshing = true
      refreshPromise = fetch('/api/auth/refresh', { method: 'POST' })
        .then(async (res) => {
          isRefreshing = false
          refreshPromise = null
          if (!res.ok) throw new Error('Refresh failed')
          return res.json()
        })
        .catch((err) => {
          isRefreshing = false
          refreshPromise = null
          throw err
        })
    }

    try {
      await refreshPromise
      // Retry the original request
      response = await fetch(path, { ...init, headers })
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
  points: number
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
  status: 'pending' | 'approved' | 'rejected'
  suggested_by_id?: number
  suggested_by_name?: string
  rejection_reason?: string
}

export interface PlaceCreatePayload {
  name: string
  description: string
  latitude: number
  longitude: number
  category: string
  theme: string
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

export function createPlace(payload: PlaceCreatePayload) {
  return localApiRequest<Place>('/api/places', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}


export function getWishlist() {
  return localApiRequest<Place[]>('/api/wishlists')
}

export function toggleWishlist(placeId: number, action: 'add' | 'remove') {
  return localApiRequest<{ success: boolean }>(`/api/wishlists/${placeId}`, {
    method: action === 'add' ? 'POST' : 'DELETE',
  })
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
  return localApiRequest<{ message: string }>(
    `/api/auth/verify-email?token=${encodeURIComponent(token)}`,
  )
}

export function resendVerificationEmail(email: string) {
  return localApiRequest<{ message: string }>('/api/auth/resend-verification', {
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

export interface LeaderboardEntry {
  id: number
  name: string
  points: number
  role: string
}

export interface FeedbackPayload {
  subject: string
  message: string
}

export function getLeaderboard() {
  return localApiRequest<LeaderboardEntry[]>('/api/community/leaderboard')
}

export function sendFeedback(payload: FeedbackPayload) {
  return localApiRequest<{ success: boolean }>('/api/community/feedback', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
export function adminGetPendingPlaces() {
  return localApiRequest<PaginatedResponse<Place>>('/api/admin/places?status=pending')
}

export function adminApprovePlace(placeId: number) {
  return localApiRequest<Place>(`/api/admin/places/${placeId}/approve`, {
    method: 'PATCH',
  })
}

export function adminRejectPlace(placeId: number, reason: string) {
  return localApiRequest<Place>(`/api/admin/places/${placeId}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  })
}

// ─── Life Improvement Types ───────────────────────────────────────────────────

export interface MoodSuggestion {
  id: number
  mood: string
  title: string
  title_ar?: string
  title_en?: string
  description: string
  description_ar?: string
  description_en?: string
  image_url?: string
  place_id?: number
  place_name?: string
  category: string
}

export interface Meetup {
  id: number
  title: string
  description: string
  date_time: string
  location: string
  latitude: number
  longitude: number
  max_participants: number
  participants_count: number
  is_joined: boolean
  organizer_name: string
  organizer_avatar?: string
  mood: string
  created_at: string
  tags: string[]
}

export interface Experience {
  id: number
  title: string
  title_ar?: string
  title_en?: string
  description: string
  description_ar?: string
  description_en?: string
  duration_minutes: number
  difficulty: 'easy' | 'medium' | 'hard'
  mood: string
  category: string
  image_url?: string
  steps: string[]
  tips: string[]
  place_id?: number
  place_name?: string
}

export interface PhotoChallenge {
  id: number
  theme: string
  theme_ar?: string
  theme_en?: string
  description: string
  description_ar?: string
  description_en?: string
  start_date: string
  end_date: string
  submissions_count: number
  winner_name?: string
  winner_photo_url?: string
  is_active: boolean
  my_submission?: PhotoSubmission
}

export interface PhotoSubmission {
  id: number
  photo_url: string
  caption: string
  submitted_at: string
  user_name: string
  user_avatar?: string
  likes_count: number
  is_liked: boolean
}

export interface WellnessTip {
  id: number
  type: 'breathing' | 'meditation' | 'stretching' | 'gratitude' | 'mindfulness' | 'hydration'
  title: string
  title_ar?: string
  title_en?: string
  description: string
  description_ar?: string
  description_en?: string
  duration_seconds: number
  instructions: string[]
  benefits: string[]
  icon: string
  date: string
}

export interface LocalQuestion {
  id: number
  question: string
  asked_by: string
  asked_by_avatar?: string
  asked_at: string
  answers_count: number
  answers: LocalAnswer[]
  is_resolved: boolean
  category: string
}

export interface LocalAnswer {
  id: number
  answer: string
  answered_by: string
  answered_by_avatar?: string
  answered_at: string
  is_local: boolean
  likes_count: number
  is_liked: boolean
  is_best: boolean
}

// ─── Life Improvement API Functions ───────────────────────────────────────────

export function getMoodSuggestions(mood: string) {
  return apiRequest<MoodSuggestion[]>(`/mood/${mood}`)
}

export function getMeetups(params?: URLSearchParams) {
  const query = params ? `?${params.toString()}` : ''
  return apiRequest<PaginatedResponse<Meetup>>(`/meetups${query}`)
}

export function joinMeetup(meetupId: number) {
  return localApiRequest<{ success: boolean; participants_count: number }>(
    `/api/meetups/${meetupId}/join`,
    { method: 'POST' },
  )
}

export function leaveMeetup(meetupId: number) {
  return localApiRequest<{ success: boolean; participants_count: number }>(
    `/api/meetups/${meetupId}/leave`,
    { method: 'DELETE' },
  )
}

export function getExperiences(mood?: string) {
  const params = new URLSearchParams()
  if (mood) params.set('mood', mood)
  const query = params.toString() ? `?${params.toString()}` : ''
  return apiRequest<Experience[]>(`/experiences${query}`)
}

export function submitPhoto(challengeId: number, file: File, caption: string) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('caption', caption)
  return localApiRequest<PhotoSubmission>(`/api/photowalk/${challengeId}/submit`, {
    method: 'POST',
    body: formData,
  })
}

export function getPhotoChallenges() {
  return apiRequest<PhotoChallenge[]>('/photowalk')
}

export function getDailyWellness() {
  return apiRequest<WellnessTip>('/wellness/daily')
}

export function askLocal(question: string, category: string) {
  return localApiRequest<{ success: boolean }>('/api/tourist/ask', {
    method: 'POST',
    body: JSON.stringify({ question, category }),
  })
}

export function getLocalAnswers(questionId?: number) {
  const params = new URLSearchParams()
  if (questionId) params.set('question_id', String(questionId))
  const query = params.toString() ? `?${params.toString()}` : ''
  return apiRequest<LocalQuestion[]>(`/tourist/questions${query}`)
}
