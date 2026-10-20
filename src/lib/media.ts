import type { Media } from '@/payload-types'

/** Payload may return absolute URLs; images are always served from this site. */
export function mediaSrc(url?: string | null): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url, 'http://local')
    return parsed.pathname + parsed.search
  } catch {
    return url
  }
}

export function isMedia(value: unknown): value is Media {
  return typeof value === 'object' && value !== null && 'url' in value
}

export function firstImage(images: unknown): Media | null {
  if (!Array.isArray(images)) return null
  const found = images.find(isMedia)
  return found ?? null
}
