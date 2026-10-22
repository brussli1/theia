'use client'

import { useEffect, useState } from 'react'

import { useSite } from '@/components/providers/LocaleProvider'
import { getListProducts, type ListProduct } from '@/lib/actions/checkout'
import { lists, useLines, type ListKind } from '@/lib/store'

type Fetched = { key: string; products: Map<number, ListProduct>; removed: boolean }

/**
 * Lines from the browser list joined with fresh product data from the server.
 * For the cart, products that can no longer be bought online are moved to the
 * quote list (and `removed` becomes true so the page can say so).
 */
export function useListProducts(kind: ListKind) {
  const { locale } = useSite()
  const { lines, ready } = useLines(kind)
  const [fetched, setFetched] = useState<Fetched>({ key: '', products: new Map(), removed: false })
  const key = lines
    .map((l) => l.id)
    .sort((a, b) => a - b)
    .join(',')

  useEffect(() => {
    if (!ready || !key) return
    let cancelled = false
    const ids = key.split(',').map(Number)
    getListProducts(ids, locale)
      .then((list) => {
        if (cancelled) return
        const products = new Map(list.map((p) => [p.id, p]))
        let removed = false
        if (kind === 'cart') {
          const gone = ids.filter((id) => products.get(id)?.purchaseMode !== 'buy')
          if (gone.length) {
            removed = true
            for (const id of gone) {
              if (products.has(id)) lists.add('quote', id, 1)
              products.delete(id)
            }
            lists.removeMany('cart', gone)
          }
        }
        setFetched((prev) => ({ key, products, removed: removed || prev.removed }))
      })
      .catch(() => {
        if (!cancelled) setFetched((prev) => ({ ...prev, key }))
      })
    return () => {
      cancelled = true
    }
  }, [key, ready, locale, kind])

  const loading = !ready || (fetched.key !== key && lines.some((l) => !fetched.products.has(l.id)))
  const items = lines
    .map((l) => ({ ...l, product: fetched.products.get(l.id) }))
    .filter((i): i is typeof i & { product: ListProduct } => Boolean(i.product))
  return { items, loading, removed: fetched.removed }
}
