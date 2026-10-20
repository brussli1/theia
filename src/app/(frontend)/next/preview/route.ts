import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import type { PayloadRequest } from 'payload'

import { getPayloadClient } from '@/lib/payload'

/** Admin "Vista previa": checks the editor's session, then shows drafts. */
export async function GET(request: NextRequest): Promise<Response> {
  const path = request.nextUrl.searchParams.get('path') || '/'
  const secret = request.nextUrl.searchParams.get('previewSecret')
  if (!process.env.PREVIEW_SECRET || secret !== process.env.PREVIEW_SECRET) {
    return new Response('Not allowed', { status: 403 })
  }
  if (!path.startsWith('/') || path.startsWith('//')) return new Response('Invalid path', { status: 400 })

  const payload = await getPayloadClient()
  const { user } = await payload.auth({ req: request as unknown as PayloadRequest, headers: request.headers })
  const draft = await draftMode()
  if (!user || user.collection !== 'users') {
    draft.disable()
    return new Response('Not allowed', { status: 403 })
  }
  draft.enable()
  redirect(path)
}
