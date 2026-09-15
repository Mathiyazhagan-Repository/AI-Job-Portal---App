import * as React from 'react'
import { cn } from '@/lib/utils'
import { photo, photoBlur, PHOTOS, type PhotoKey } from '@/lib/photos'

/**
 * A photograph that degrades well.
 *
 * Three states matter and all three are designed rather than left to the
 * browser: the blurred frame while it loads, the fade as it arrives, and a
 * tinted placeholder if the network drops it entirely. A marketing page that
 * collapses into broken-image icons offline is worse than one with no
 * photography at all.
 */
export function Photo({
  src,
  alt,
  width = 800,
  height,
  className,
  imgClassName,
  priority,
  rounded = true,
  crop,
}: {
  src: PhotoKey
  /** Overrides the description in the photo registry. */
  alt?: string
  width?: number
  height?: number
  className?: string
  imgClassName?: string
  /** Skip lazy-loading — use for anything above the fold. */
  priority?: boolean
  rounded?: boolean
  /** Let the CDN choose the crop region instead of taking the centre. */
  crop?: 'faces' | 'entropy'
}) {
  const [state, setState] = React.useState<'loading' | 'ready' | 'failed'>('loading')
  const description = alt ?? PHOTOS[src].alt

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-subtle',
        rounded && 'rounded-v',
        className,
      )}
    >
      {/* the blurred frame holds the layout and the colour while we wait */}
      {state === 'loading' && (
        <img
          src={photoBlur(src)}
          alt=""
          aria-hidden
          className="absolute inset-0 size-full scale-110 object-cover blur-xl"
        />
      )}

      {state === 'failed' ? (
        // marked so a browser check can see it — a failed image leaves
        // `document.images` entirely, so counting broken <img> misses this
        <div
          data-photo-failed={src}
          className="absolute inset-0 bg-gradient-to-br from-[var(--color-tone-indigo-bg)] via-[var(--color-tone-violet-bg)] to-[var(--color-tone-sky-bg)]"
          aria-hidden
        />
      ) : (
        <img
          src={photo(src, { w: width, h: height, crop })}
          alt={description}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setState('ready')}
          onError={() => setState('failed')}
          className={cn(
            'size-full object-cover transition-opacity duration-500',
            state === 'ready' ? 'opacity-100' : 'opacity-0',
            imgClassName,
          )}
        />
      )}
    </div>
  )
}

/** A circular face, for quotes. Decorative, so it carries no alt text. */
export function FacePhoto({
  src,
  size = 44,
  priority,
  className,
}: {
  src: PhotoKey
  size?: number
  /** Needed inside a marquee: the duplicated track sits outside the viewport,
   *  so a lazy image there never starts loading and pops in blurred as it
   *  scrolls into view. */
  priority?: boolean
  className?: string
}) {
  // the wrapper carries no intrinsic size, so the square has to be set here
  // or the circle collapses to zero height
  return (
    <div style={{ width: size, height: size }} className={cn('shrink-0', className)}>
      <Photo
        src={src}
        alt=""
        width={size * 2}
        height={size * 2}
        priority={priority}
        rounded={false}
        className="size-full rounded-full ring-2 ring-paper"
        // faces sit high in these frames, so bias the crop upward
        imgClassName="object-[center_25%]"
      />
    </div>
  )
}
