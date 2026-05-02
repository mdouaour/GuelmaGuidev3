import { NextResponse } from 'next/server'
import { BACKEND_URL, csrfError, getAuthToken, proxyJson, validateCsrfToken } from '@/lib/server-api'

export async function POST(request: Request, { params }: { params: Promise<{ slug: string[] }> }): Promise<NextResponse> {
  if (!(await validateCsrfToken(request))) {
    return csrfError()
  }

  const token = await getAuthToken()
  if (!token) {
    return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 })
  }

  const resolvedParams = await params
  const path = resolvedParams.slug.join('/')
  
  // Check if it's a multipart request (image upload)
  const contentType = request.headers.get('content-type') || ''
  let backendRes: Response

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    backendRes = await fetch(`${BACKEND_URL}/places/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
  } else {
    let body: unknown = undefined
    try {
      body = await request.json()
    } catch {}

    backendRes = await fetch(`${BACKEND_URL}/places/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  return proxyJson(backendRes)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string[] }> }): Promise<NextResponse> {
  if (!(await validateCsrfToken(request))) {
    return csrfError()
  }

  const token = await getAuthToken()
  if (!token) {
    return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 })
  }

  const resolvedParams = await params
  const path = resolvedParams.slug.join('/')
  
  const url = new URL(request.url)

  const backendRes = await fetch(`${BACKEND_URL}/places/${path}${url.search}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return proxyJson(backendRes)
}
