import { NextResponse } from 'next/server'
import { BACKEND_URL, csrfError, getAuthToken, proxyJson, validateCsrfToken } from '@/lib/server-api'

export async function POST(request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  if (!(await validateCsrfToken(request))) {
    return csrfError()
  }

  const token = await getAuthToken()
  if (!token) {
    return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 })
  }

  const resolvedParams = await params
  const path = resolvedParams.slug.join('/')

  const backendRes = await fetch(`${BACKEND_URL}/wishlists/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return proxyJson(backendRes)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  if (!(await validateCsrfToken(request))) {
    return csrfError()
  }

  const token = await getAuthToken()
  if (!token) {
    return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 })
  }

  const resolvedParams = await params
  const path = resolvedParams.slug.join('/')

  const backendRes = await fetch(`${BACKEND_URL}/wishlists/${path}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return proxyJson(backendRes)
}
