import 'server-only'

import type { Redirect } from '@/payload-types'
import { resolveHref } from './links'
import { getPayloadClient } from './payload'

/** Looks up an editor-defined redirect for a missing address. */
export async function findRedirect(path: string): Promise<string | null> {
  const payload = await getPayloadClient()
  const candidates = [path, path.replace(/\/$/, ''), `${path}/`]
  const { docs } = await payload.find({
    collection: 'redirects',
    depth: 1,
    limit: 1,
    where: { from: { in: candidates } },
  })
  const redirect = docs[0] as Redirect | undefined
  if (!redirect?.to) return null
  if (redirect.to.type === 'custom') return redirect.to.url || null
  const ref = redirect.to.reference
  // Resolve without locale prefix; the caller localizes.
  return ref ? resolveHref({ type: 'internal', reference: ref as never }, 'es') : null
}
