import { randomBytes } from 'crypto'

// No 0/O/1/I/L to keep references easy to read over the phone.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function randomCode(length: number): string {
  const bytes = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length]
  return out
}

/** "TH-261014-7KQ2" */
export function newOrderNumber(now = new Date()): string {
  const yy = String(now.getUTCFullYear()).slice(2)
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(now.getUTCDate()).padStart(2, '0')
  return `TH-${yy}${mm}${dd}-${randomCode(4)}`
}

/** "QT-8HM4RZ" */
export function newQuoteReference(): string {
  return `QT-${randomCode(6)}`
}

/** Unguessable token that lets a guest open their own order page. */
export function newAccessToken(): string {
  return randomBytes(18).toString('base64url')
}
