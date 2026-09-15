import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * ⭐ DESIGN.md §7.4 — Kinetic headline
 *
 * `Find your next ______ role` where the blank morphs between roles
 * using variable-font weight + width interpolation, not a typewriter
 * cliché. Pauses on hover. Honours prefers-reduced-motion by holding
 * the first word (the CSS layer sets --v-motion to ~0).
 */
export function KineticHeadline({
  prefix,
  words,
  suffix,
  interval = 2600,
  className,
  wordClassName,
}: {
  prefix: string
  words: string[]
  suffix?: string
  interval?: number
  className?: string
  wordClassName?: string
}) {
  const [index, setIndex] = React.useState(0)
  const [phase, setPhase] = React.useState<'in' | 'out'>('in')
  const [paused, setPaused] = React.useState(false)

  const reduced = React.useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  React.useEffect(() => {
    if (paused || reduced || words.length < 2) return
    const outAt = window.setTimeout(() => setPhase('out'), interval - 420)
    const swapAt = window.setTimeout(() => {
      setIndex((i) => (i + 1) % words.length)
      setPhase('in')
    }, interval)
    return () => {
      clearTimeout(outAt)
      clearTimeout(swapAt)
    }
  }, [index, interval, paused, reduced, words.length])

  // Reserve the width of the longest word so the layout never jumps.
  const longest = React.useMemo(
    () => words.reduce((a, b) => (b.length > a.length ? b : a), ''),
    [words],
  )

  return (
    <h1 className={cn('font-display tracking-tight text-display-1 font-bold text-ink', className)}>
      {prefix}{' '}
      {/* The pause is scoped to the rotating word, not the whole headline.
          On a wide hero the <h1> box covers most of the column, so hovering it
          held the word still and the rotation looked broken. */}
      <span
        className="relative inline-grid align-baseline"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* invisible sizer keeps the line stable */}
        <span aria-hidden className="invisible col-start-1 row-start-1 whitespace-nowrap px-1">
          {longest}
        </span>
        <span
          key={index}
          className={cn(
            'col-start-1 row-start-1 whitespace-nowrap text-signal px-1',
            'transition-[opacity,transform,font-variation-settings] duration-[420ms] ease-[var(--ease-out-soft)]',
            phase === 'in' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2',
            wordClassName,
          )}
          style={{
            fontVariationSettings: phase === 'in' ? "'wght' 800, 'wdth' 100" : "'wght' 400, 'wdth' 85",
          }}
        >
          {words[index]}
        </span>
        {/* live region so screen readers hear the change once, not on every frame */}
        <span className="sr-only" aria-live="polite">
          {words[index]}
        </span>
      </span>{' '}
      {suffix}
    </h1>
  )
}
