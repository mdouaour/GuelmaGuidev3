import { NextResponse } from 'next/server'
import { BACKEND_URL, getAuthToken, proxyJson } from '@/lib/server-api'

export async function GET(): Promise<NextResponse> {
  const token = await getAuthToken()
  if (!token) {
    return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 })
  }

  const backendRes = await fetch(`${BACKEND_URL}/organiser/analytics`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  return proxyJson(backendRes)
}
