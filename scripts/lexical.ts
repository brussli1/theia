/** Minimal builders for Lexical rich-text JSON, used by the content seed. */

type Node = Record<string, unknown>

const base = { direction: 'ltr', format: '', indent: 0, version: 1 }

export const text = (value: string, bold = false): Node => ({
  type: 'text',
  text: value,
  format: bold ? 1 : 0,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
})

/** Paragraph; "**bold**" segments become bold text. */
export const p = (value: string): Node => ({
  ...base,
  type: 'paragraph',
  textFormat: 0,
  textStyle: '',
  children: value
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((part) => (part.startsWith('**') ? text(part.slice(2, -2), true) : text(part))),
})

export const h = (tag: 'h2' | 'h3', value: string): Node => ({ ...base, type: 'heading', tag, children: [text(value)] })

export const ul = (...items: string[]): Node => ({
  ...base,
  type: 'list',
  listType: 'bullet',
  tag: 'ul',
  start: 1,
  children: items.map((item, i) => ({ ...base, type: 'listitem', value: i + 1, children: p(item).children })),
})

export const doc = (...children: Node[]) => ({ root: { ...base, type: 'root', children } })
