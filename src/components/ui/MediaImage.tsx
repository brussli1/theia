import Image from 'next/image'

import { cn } from '@/lib/cn'
import { isMedia, mediaSrc } from '@/lib/media'
import type { Media } from '@/payload-types'

type Props = {
  media: Media | number | null | undefined
  /** Smallest generated size that is still sharp enough. */
  size?: 'thumbnail' | 'card' | 'large' | 'original'
  alt?: string
  className?: string
  imgClassName?: string
  sizes?: string
  priority?: boolean
  fill?: boolean
}

export function MediaImage({
  media,
  size = 'large',
  alt,
  className,
  imgClassName,
  sizes = '100vw',
  priority,
  fill = true,
}: Props) {
  if (!isMedia(media)) return null
  const variant = size !== 'original' ? media.sizes?.[size] : undefined
  const src = mediaSrc(variant?.url || media.url)
  if (!src) return null
  const description = alt ?? media.alt ?? ''
  if (fill) {
    return (
      <div className={cn('relative overflow-hidden', className)}>
        <Image src={src} alt={description} fill sizes={sizes} priority={priority} className={cn('object-cover', imgClassName)} />
      </div>
    )
  }
  return (
    <Image
      src={src}
      alt={description}
      width={variant?.width || media.width || 800}
      height={variant?.height || media.height || 600}
      sizes={sizes}
      priority={priority}
      className={cn(imgClassName, className)}
    />
  )
}
