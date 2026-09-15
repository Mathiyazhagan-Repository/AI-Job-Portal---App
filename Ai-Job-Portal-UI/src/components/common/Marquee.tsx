import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * A continuously scrolling rail.
 *
 * The children are rendered twice and the track translates by exactly -50%,
 * so the second copy lands where the first began and the loop has no seam.
 * The duplicate is `aria-hidden` and made unfocusable, or every item would be
 * announced and tabbed through twice.
 *
 * By default it pauses on hover and on keyboard focus — a rail that keeps
 * moving while you are trying to read or tab through it is the exact failure
 * WCAG 2.2.2 is about. `pauseOnHover={false}` trades that mitigation away
 * deliberately, for a rail whose brief must be constant, uninterrupted
 * motion even over focusable content — use it only where that trade was a
 * conscious call, not the default. Reduced motion always stops it outright
 * regardless, leaving the row static and scrollable by hand.
 *
 * `speed` is seconds for one full pass, fixed for the life of the rail — the
 * animation is a plain linear loop, so it never speeds up or slows down.
 * Longer lists need proportionally more time or they whip past, so callers
 * pass a value scaled to their item count.
 *
 * `direction="vertical"` runs the same loop along the cross axis for a
 * scrolling column instead of a rail. The parent must give the marquee a
 * bounded height (the track's own height is unbounded — two copies of the
 * list stacked) or there is nothing to clip and no scroll is visible.
 */
export function Marquee({
  children,
  speed = 40,
  gap = 'gap-5',
  fade = true,
  fadeFrom = 'from-canvas',
  direction = 'horizontal',
  pauseOnHover = true,
  className,
  style,
}: {
  children: React.ReactNode
  speed?: number
  gap?: string
  /** Soften the edges so items enter and leave rather than being cut off. */
  fade?: boolean
  /** Must match the section background for the fade to be invisible. */
  fadeFrom?: string
  direction?: 'horizontal' | 'vertical'
  /** Off only for a decorative rail with nothing inside it to read or tab to. */
  pauseOnHover?: boolean
  className?: string
  /** Escape hatch for a caller-computed size, e.g. a CSS custom property from a ResizeObserver. */
  style?: React.CSSProperties
}) {
  const vertical = direction === 'vertical'

  const track = (clone: boolean) => (
    <div
      className={cn('flex shrink-0 items-stretch', vertical ? 'flex-col' : 'flex-row', gap)}
      aria-hidden={clone || undefined}
      // React 19 takes `inert` as a real boolean; passing '' makes it warn.
      // The clone is decorative, so this keeps it out of the tab order.
      inert={clone || undefined}
    >
      {children}
    </div>
  )

  return (
    <div className={cn('group relative overflow-hidden', className)} style={style}>
      {fade && (
        <>
          <div
            className={cn(
              'pointer-events-none absolute z-10 bg-gradient-to-r to-transparent',
              vertical
                ? 'inset-x-0 top-0 h-12 bg-gradient-to-b sm:h-20'
                : 'inset-y-0 left-0 w-12 sm:w-20',
              fadeFrom,
            )}
            aria-hidden
          />
          <div
            className={cn(
              'pointer-events-none absolute z-10 bg-gradient-to-l to-transparent',
              vertical
                ? 'inset-x-0 bottom-0 h-12 bg-gradient-to-t sm:h-20'
                : 'inset-y-0 right-0 w-12 sm:w-20',
              fadeFrom,
            )}
            aria-hidden
          />
        </>
      )}

      <div
        className={cn(
          'flex',
          vertical ? 'h-max flex-col animate-marquee-y' : 'w-max flex-row animate-marquee',
          gap,
          pauseOnHover &&
            'group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]',
          'motion-reduce:animate-none',
        )}
        style={{ animationDuration: `${speed}s` }}
      >
        {track(false)}
        {track(true)}
      </div>
    </div>
  )
}
