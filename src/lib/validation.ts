/** Small input validators shared by the server actions. */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function clean(value: unknown, max = 200): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export type FieldErrors = Record<string, string>

export function requireFields(
  data: Record<string, string>,
  required: string[],
  messages: { required: string; email: string },
): FieldErrors {
  const errors: FieldErrors = {}
  for (const key of required) if (!data[key]) errors[key] = messages.required
  if (data.email && !EMAIL_RE.test(data.email)) errors.email = messages.email
  return errors
}
