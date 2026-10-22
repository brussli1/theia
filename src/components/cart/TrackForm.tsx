'use client'

import { useActionState } from 'react'

import { Field, FormAlert } from '@/components/forms/Field'
import { useSite } from '@/components/providers/LocaleProvider'
import { Button } from '@/components/ui/Button'
import { trackOrder } from '@/lib/actions/checkout'

export function TrackForm() {
  const { t, locale } = useSite()
  const [state, action, pending] = useActionState(trackOrder, {})
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {state.error && <FormAlert>{state.error}</FormAlert>}
      <Field label={t.track.number} name="number" required placeholder="TH-000000-XXXX" autoCapitalize="characters" />
      <Field label={t.track.email} name="email" type="email" required autoComplete="email" />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {t.track.submit}
      </Button>
    </form>
  )
}
