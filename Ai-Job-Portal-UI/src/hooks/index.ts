import { useCallback, useEffect, useRef, useState } from 'react'

export { useVariant, useVariantControl, byVariant, VARIANTS, VARIANT_META } from './useVariant'
export type { Variant } from './useVariant'

/** Media query hook — for behavioural (not cosmetic) branching. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )
  useEffect(() => {
    const mql = window.matchMedia(query)
    const on = () => setMatches(mql.matches)
    on()
    mql.addEventListener('change', on)
    return () => mql.removeEventListener('change', on)
  }, [query])
  return matches
}

export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)')
export const useIsMobile = () => useMediaQuery('(max-width: 767px)')

/** Open/close state with a stable API — used by every sheet, dialog and drawer. */
export function useDisclosure(initial = false) {
  const [isOpen, setIsOpen] = useState(initial)
  return {
    isOpen,
    open: useCallback(() => setIsOpen(true), []),
    close: useCallback(() => setIsOpen(false), []),
    toggle: useCallback(() => setIsOpen((v) => !v), []),
    setIsOpen,
  }
}

export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

type KeyHandler = (e: KeyboardEvent) => void

/**
 * Keyboard shortcuts — Direction B's primary interaction model.
 * Ignores keystrokes while an input/textarea/contenteditable has focus.
 */
export function useKeyboardShortcut(keys: Record<string, KeyHandler>, enabled = true) {
  const ref = useRef(keys)
  ref.current = keys

  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable)

      const combo = [e.metaKey || e.ctrlKey ? 'mod+' : '', e.shiftKey ? 'shift+' : '', e.key.toLowerCase()].join('')

      const handler = ref.current[combo] ?? ref.current[e.key.toLowerCase()]
      if (!handler) return
      // Modifier combos still fire while typing (⌘K); bare keys do not.
      if (typing && !combo.startsWith('mod+')) return
      e.preventDefault()
      handler(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}

/**
 * Screen-reader announcements.
 * PRD Part 39–40 requires stage changes and score updates to announce.
 */
export function useAnnounce() {
  return useCallback((message: string) => {
    let region = document.getElementById('kairo-live-region')
    if (!region) {
      region = document.createElement('div')
      region.id = 'kairo-live-region'
      region.setAttribute('role', 'status')
      region.setAttribute('aria-live', 'polite')
      region.className = 'sr-only'
      document.body.appendChild(region)
    }
    region.textContent = ''
    window.setTimeout(() => {
      region!.textContent = message
    }, 60)
  }, [])
}

/** Count-up used by the score ring and stat tiles. Respects --v-motion. */
export function useCountUp(target: number, duration = 900, trigger = true): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!trigger) return
    const motion = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--v-motion') || '1',
    )
    if (motion < 0.01) {
      setValue(target)
      return
    }
    const ms = duration * motion
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, trigger])
  return value
}

/** Reveal-on-scroll — Direction C's scroll storytelling. */
export function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold: 0.15, ...options },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [options])
  return { ref, inView }
}
