'use client'

import { useMemo, useSyncExternalStore } from 'react'

/**
 * The cart and the quote list live in the visitor's browser (localStorage),
 * so they survive reloads without an account. Only product ids and
 * quantities are stored; names and prices are always re-read from the server.
 */

export type ListKind = 'cart' | 'quote'
export type Line = { id: number; qty: number }

const KEYS: Record<ListKind, string> = { cart: 'theia-cart', quote: 'theia-quote' }
const EVENT = 'theia-store'
const MAX_QTY = 99

function read(kind: ListKind): string {
  try {
    return window.localStorage.getItem(KEYS[kind]) || '[]'
  } catch {
    return '[]'
  }
}

function parse(raw: string): Line[] {
  try {
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data
      .filter((l) => Number.isInteger(l?.id) && Number.isInteger(l?.qty) && l.qty > 0)
      .map((l) => ({ id: l.id, qty: Math.min(l.qty, MAX_QTY) }))
  } catch {
    return []
  }
}

function write(kind: ListKind, lines: Line[]) {
  try {
    window.localStorage.setItem(KEYS[kind], JSON.stringify(lines))
  } catch {
    // Private mode / storage full: the list just won't persist.
  }
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(callback: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (!e.key || Object.values(KEYS).includes(e.key)) callback()
  }
  window.addEventListener(EVENT, callback)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(EVENT, callback)
    window.removeEventListener('storage', onStorage)
  }
}

export function useLines(kind: ListKind): { lines: Line[]; ready: boolean } {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(kind),
    () => '__server__',
  )
  return useMemo(
    () => (raw === '__server__' ? { lines: [], ready: false } : { lines: parse(raw), ready: true }),
    [raw],
  )
}

export const lists = {
  add(kind: ListKind, id: number, qty = 1) {
    const lines = parse(read(kind))
    const existing = lines.find((l) => l.id === id)
    if (existing) existing.qty = Math.min(existing.qty + qty, MAX_QTY)
    else lines.push({ id, qty: Math.min(qty, MAX_QTY) })
    write(kind, lines)
  },
  setQty(kind: ListKind, id: number, qty: number) {
    const lines = parse(read(kind))
      .map((l) => (l.id === id ? { ...l, qty: Math.min(Math.max(1, qty), MAX_QTY) } : l))
    write(kind, lines)
  },
  remove(kind: ListKind, id: number) {
    write(kind, parse(read(kind)).filter((l) => l.id !== id))
  },
  removeMany(kind: ListKind, ids: number[]) {
    write(kind, parse(read(kind)).filter((l) => !ids.includes(l.id)))
  },
  clear(kind: ListKind) {
    write(kind, [])
  },
}
