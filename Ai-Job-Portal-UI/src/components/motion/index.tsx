import * as React from 'react'
import {
  LazyMotion, domAnimation, m, useInView, useReducedMotion,
  useMotionValue, useSpring, useTransform, animate, type Variants,
} from 'motion/react'
import { cn } from '@/lib/utils'
import { useVariant, type Variant } from '@/hooks'

/**
 * Motion primitives — DESIGN.md §19.
 *
 * ONE animation engine (motion/react). GSAP and react-spring would
 * duplicate what this already does; Remotion renders videos, not UI.
 *
 * Everything here reads the ACTIVE DIRECTION and animates at its tempo,
 * so a single <Reveal> behaves correctly in all three:
 *
 *   A · Editorial   — 1.0× · soft ease · 8px rise
 *   B · Console     — 0.55× · sharp ease · 4px slide, no bounce
 *   C · Expressive  — 1.15× · spring · 16px rise + slight scale
 *
 * Uses LazyMotion + `m` so the initial bundle stays ~4.6kb rather
 * than pulling the full 34kb motion component.
 */

/* ══════════════════ tempo ══════════════════ */

export interface Tempo {
  duration: number
  ease: [number, number, number, number] | 'linear'
  rise: number
  scale: number
  stagger: number
  spring: boolean
}

const TEMPO: Record<Variant, Tempo> = {
  a: { duration: 0.42, ease: [0.2, 0.8, 0.2, 1], rise: 8, scale: 1, stagger: 0.05, spring: false },
  b: { duration: 0.2, ease: [0.3, 0.9, 0.3, 1], rise: 4, scale: 1, stagger: 0.022, spring: false },
  c: { duration: 0.6, ease: [0.34, 1.3, 0.64, 1], rise: 16, scale: 0.97, stagger: 0.07, spring: true },
}

/** The tempo for the active direction, already reduced-motion aware. */
export function useTempo(): Tempo & { reduced: boolean } {
  const variant = useVariant()
  const reduced = useReducedMotion() ?? false
  const t = TEMPO[variant]
  if (reduced) return { ...t, duration: 0.001, rise: 0, scale: 1, stagger: 0, spring: false, reduced }
  return { ...t, reduced }
}

/** Wraps the app once. Everything below uses `m.*`, never `motion.*`. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>
}

/* ══════════════════ Reveal ══════════════════ */

/**
 * Entrance / scroll reveal. Direction C gets scroll-driven reveals;
 * A and B animate immediately on mount (a console must not wait).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  whenVisible,
  as = 'div',
  ...rest
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  /** Wait until scrolled into view. Defaults on for C, off for A and B.
   *  Named `whenVisible`, not `onScroll`, to avoid colliding with the
   *  native React scroll handler on the spread HTML attributes. */
  whenVisible?: boolean
  as?: 'div' | 'section' | 'li' | 'article' | 'header'
} & React.HTMLAttributes<HTMLElement>) {
  const t = useTempo()
  const variant = useVariant()
  const ref = React.useRef<HTMLDivElement>(null)
  const scrollGated = whenVisible ?? variant === 'c'
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const show = !scrollGated || inView

  const Tag = m[as] as typeof m.div

  return (
    <Tag
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: t.rise, scale: t.scale }}
      animate={show ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={
        t.spring
          ? { type: 'spring', stiffness: 260, damping: 26, delay }
          : { duration: t.duration, ease: t.ease, delay }
      }
      {...(rest as object)}
    >
      {children}
    </Tag>
  )
}

/* ══════════════════ Stagger ══════════════════ */

/**
 * Cascading list entrance. In B this is the "rows landing in a terminal"
 * effect — fast and tight; in C it is a slow, springy cascade.
 */
export function Stagger({
  children,
  className,
  as = 'div',
  whenVisible,
}: {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'ul' | 'ol' | 'tbody'
  whenVisible?: boolean
}) {
  const t = useTempo()
  const variant = useVariant()
  const ref = React.useRef<HTMLDivElement>(null)
  const scrollGated = whenVisible ?? variant === 'c'
  const inView = useInView(ref, { once: true, margin: '-40px' })

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: t.stagger, delayChildren: 0.02 } },
  }

  const Tag = m[as] as typeof m.div

  return (
    <Tag
      ref={ref}
      className={className}
      variants={container}
      initial="hidden"
      animate={!scrollGated || inView ? 'show' : 'hidden'}
    >
      {children}
    </Tag>
  )
}

export function StaggerItem({
  children,
  className,
  as = 'div',
}: {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'li' | 'tr' | 'article'
}) {
  const t = useTempo()
  const item: Variants = {
    hidden: { opacity: 0, y: t.rise, scale: t.scale },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: t.spring
        ? { type: 'spring', stiffness: 280, damping: 24 }
        : { duration: t.duration, ease: t.ease },
    },
  }
  const Tag = m[as] as typeof m.div
  return (
    <Tag className={className} variants={item}>
      {children}
    </Tag>
  )
}

/* ══════════════════ Numbers ══════════════════ */

/** Animated integer. Springs in C, ticks fast in B, eases in A. */
export function AnimatedNumber({
  value,
  className,
  suffix,
}: {
  value: number
  className?: string
  suffix?: string
}) {
  const t = useTempo()
  const [display, setDisplay] = React.useState(t.reduced ? value : 0)

  React.useEffect(() => {
    if (t.reduced) {
      setDisplay(value)
      return
    }
    const controls = animate(0, value, {
      duration: t.duration * 2,
      ease: t.ease,
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [value, t.duration, t.reduced])

  return (
    <span className={cn('tabular-nums', className)}>
      {display}
      {suffix}
    </span>
  )
}

/* ══════════════════ Terminal effects — Direction B ══════════════════ */

const GLYPHS = 'abcdefghijklmnopqrstuvwxyz0123456789/<>_-*#'

/**
 * Text that resolves out of noise, like a terminal settling.
 * This is Direction B's signature entrance — it reads as *fast machine*,
 * not as decoration. Falls back to plain text when motion is reduced.
 */
export function ScrambleText({
  text,
  className,
  duration = 620,
  startDelay = 0,
  as: Tag = 'span',
}: {
  text: string
  className?: string
  duration?: number
  startDelay?: number
  as?: 'span' | 'h1' | 'h2' | 'p'
}) {
  const reduced = useReducedMotion() ?? false
  const [out, setOut] = React.useState(reduced ? text : '')

  React.useEffect(() => {
    if (reduced) {
      setOut(text)
      return
    }
    let raf = 0
    let start = 0
    const timer = window.setTimeout(() => {
      const tick = (now: number) => {
        if (!start) start = now
        const p = Math.min(1, (now - start) / duration)
        // characters lock in left-to-right; the rest churn
        const locked = Math.floor(p * text.length)
        let s = text.slice(0, locked)
        for (let i = locked; i < text.length; i++) {
          s += text[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0]
        }
        setOut(s)
        if (p < 1) raf = requestAnimationFrame(tick)
        else setOut(text)
      }
      raf = requestAnimationFrame(tick)
    }, startDelay)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [text, duration, startDelay, reduced])

  return (
    <Tag className={className} aria-label={text}>
      <span aria-hidden>{out || ' '}</span>
    </Tag>
  )
}

/** A blinking block caret. Pure CSS would do, but this respects reduced motion. */
export function Caret({ className }: { className?: string }) {
  const reduced = useReducedMotion() ?? false
  if (reduced) return <span className={cn('inline-block w-[0.5em] bg-brand-600', className)} />
  return (
    <m.span
      aria-hidden
      className={cn('inline-block h-[1em] w-[0.5em] translate-y-[0.12em] bg-brand-600', className)}
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{ duration: 1.1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
    />
  )
}

/** Types a line out character by character. Used for B's console log feel. */
export function TypeLine({
  text,
  className,
  speed = 18,
  delay = 0,
}: {
  text: string
  className?: string
  speed?: number
  delay?: number
}) {
  const reduced = useReducedMotion() ?? false
  const [n, setN] = React.useState(reduced ? text.length : 0)

  React.useEffect(() => {
    if (reduced) return
    let i = 0
    let id = 0
    const start = window.setTimeout(() => {
      id = window.setInterval(() => {
        i += 1
        setN(i)
        if (i >= text.length) clearInterval(id)
      }, speed)
    }, delay)
    return () => {
      clearTimeout(start)
      clearInterval(id)
    }
  }, [text, speed, delay, reduced])

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden>{text.slice(0, n)}</span>
    </span>
  )
}

/* ══════════════════ Expressive effects — Direction C ══════════════════ */

/** Parallax on scroll. No-op in A and B, and under reduced motion. */
export function Parallax({
  children,
  className,
  strength = 40,
}: {
  children: React.ReactNode
  className?: string
  strength?: number
}) {
  const variant = useVariant()
  const reduced = useReducedMotion() ?? false
  const ref = React.useRef<HTMLDivElement>(null)
  const y = useMotionValue(0)
  const smooth = useSpring(y, { stiffness: 90, damping: 24 })

  React.useEffect(() => {
    if (variant !== 'c' || reduced) return
    const onScroll = () => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const progress = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight
      y.set(-progress * strength)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [variant, reduced, strength, y])

  if (variant !== 'c' || reduced) return <div className={className}>{children}</div>
  return (
    <m.div ref={ref} className={className} style={{ y: smooth }}>
      {children}
    </m.div>
  )
}

/** Word-by-word headline reveal. C only; A and B render plain. */
export function WordReveal({
  text,
  className,
  delay = 0,
}: {
  text: string
  className?: string
  delay?: number
}) {
  const t = useTempo()
  const variant = useVariant()

  if (variant !== 'c' || t.reduced) return <span className={className}>{text}</span>

  return (
    <span className={className}>
      {text.split(' ').map((word, i) => (
        <m.span
          key={`${word}-${i}`}
          className="inline-block"
          initial={{ opacity: 0, y: '0.4em' }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + i * 0.06, duration: 0.5, ease: t.ease }}
        >
          {word}
          {i < text.split(' ').length - 1 ? ' ' : ''}
        </m.span>
      ))}
    </span>
  )
}

export { m, useReducedMotion, useTransform, useMotionValue, useSpring }
