import { NextResponse } from 'next/server'
import { BACKEND_URL, getAuthToken } from '@/lib/server-api'
import type { AuthUser } from '@/lib/api'

export async function GET(): Promise<NextResponse> {
  const token = await getAuthToken()
  if (!token) {
    return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 })
  }

  const backendRes = await fetch(`${BACKEND_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!backendRes.ok) {
    return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 })
  }

  const user = (await backendRes.json()) as AuthUser
  return NextResponse.json(user)
}
