'use client'

import { AlertTriangle } from 'lucide-react'
import { useEffect } from 'react'

import { useSite } from '@/components/providers/LocaleProvider'
import { Button, LinkButton } from '@/components/ui/Button'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t, href } = useSite()
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <AlertTriangle className="h-14 w-14 text-amber-500" aria-hidden="true" />
      <h1 className="mt-6 text-3xl font-bold">{t.error.title}</h1>
      <p className="mt-3 max-w-md text-slate-600">{t.error.text}</p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>{t.error.retry}</Button>
        <LinkButton href={href('/')} variant="outline">
          {t.notFound.home}
        </LinkButton>
      </div>
    </div>
  )
}
