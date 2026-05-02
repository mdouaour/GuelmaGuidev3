import { NextResponse } from 'next/server'
import { BACKEND_URL, csrfError, getAuthToken, proxyJson, validateCsrfToken } from '@/lib/server-api'

export async function GET(request: Request, { params }: { params: Promise<{ slug: string[] }> }): Promise<NextResponse> {
  const token = await getAuthToken()
  if (!token) {
    return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 })
  }

  const resolvedParams = await params
  const path = resolvedParams.slug.join('/')
  const url = new URL(request.url)
  const backendRes = await fetch(`${BACKEND_URL}/admin/${path}${url.search}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return proxyJson(backendRes)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string[] }> }): Promise<NextResponse> {
  if (!(await validateCsrfToken(request))) {
    return csrfError()
  }

  const token = await getAuthToken()
  if (!token) {
    return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 })
  }

  const resolvedParams = await params
  const path = resolvedParams.slug.join('/')
  
  let body: unknown = undefined
  try {
    const text = await request.text()
    if (text) body = JSON.parse(text)
  } catch {
    // ignore
  }

  const backendRes = await fetch(`${BACKEND_URL}/admin/${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  return proxyJson(backendRes)
}
