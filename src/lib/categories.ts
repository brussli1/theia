/** Category tree helpers (pure, shared by server code and tests). */

export type FlatCategory = {
  id: number
  name: string
  slug: string
  parent?: number | { id: number } | null
  order?: number | null
  showInMenu?: boolean | null
  image?: unknown
  description?: string | null
}

export type CategoryNode<T extends FlatCategory = FlatCategory> = T & { children: CategoryNode<T>[] }

const parentId = (c: FlatCategory): number | null =>
  c.parent == null ? null : typeof c.parent === 'object' ? c.parent.id : c.parent

const byOrder = (a: FlatCategory, b: FlatCategory) =>
  (a.order ?? 100) - (b.order ?? 100) || a.name.localeCompare(b.name)

export function buildTree<T extends FlatCategory>(flat: T[]): CategoryNode<T>[] {
  const nodes = new Map<number, CategoryNode<T>>()
  for (const c of flat) nodes.set(c.id, { ...c, children: [] })
  const roots: CategoryNode<T>[] = []
  for (const node of nodes.values()) {
    const pid = parentId(node)
    const parent = pid != null ? nodes.get(pid) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  const sortDeep = (list: CategoryNode<T>[]) => {
    list.sort(byOrder)
    list.forEach((n) => sortDeep(n.children))
  }
  sortDeep(roots)
  return roots
}

/** The category plus every category below it. */
export function descendantIds(flat: FlatCategory[], rootId: number): number[] {
  const children = new Map<number, number[]>()
  for (const c of flat) {
    const pid = parentId(c)
    if (pid != null) children.set(pid, [...(children.get(pid) ?? []), c.id])
  }
  const out: number[] = []
  const stack = [rootId]
  const seen = new Set<number>()
  while (stack.length) {
    const id = stack.pop()!
    if (seen.has(id)) continue
    seen.add(id)
    out.push(id)
    stack.push(...(children.get(id) ?? []))
  }
  return out
}

/** Root → … → category, for breadcrumbs. */
export function ancestry<T extends FlatCategory>(flat: T[], id: number): T[] {
  const byId = new Map(flat.map((c) => [c.id, c]))
  const chain: T[] = []
  let current = byId.get(id)
  const seen = new Set<number>()
  while (current && !seen.has(current.id)) {
    seen.add(current.id)
    chain.unshift(current)
    const pid = parentId(current)
    current = pid != null ? byId.get(pid) : undefined
  }
  return chain
}
