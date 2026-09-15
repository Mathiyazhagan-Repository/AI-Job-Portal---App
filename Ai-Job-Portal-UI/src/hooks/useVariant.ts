import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

/**
 * DESIGN.md §6.6c — the variant switch.
 *
 * Resolution order: ?v= URL param → localStorage → 'a'.
 * Writes data-variant onto <html> so the CSS shape layer applies globally.
 *
 * Switching is shareable: /recruiter/jobs/123/applicants?v=b sends a
 * teammate the exact screen you mean.
 */

export type Variant = 'a' | 'b' | 'c'

export const VARIANTS: Variant[] = ['a', 'b', 'c']

export const VARIANT_META: Record<Variant, { name: string; tagline: string; note: string }> = {
  a: {
    name: 'Editorial Clarity',
    tagline: 'A well-set document',
    note: 'Bento, cards, medium density. Optimised for legibility and first-time comprehension.',
  },
  b: {
    name: 'Command Console',
    tagline: 'Every pixel earns its place',
    note: 'Tables, split panes, no shadow, no motion, keyboard-first. Optimised for throughput.',
  },
  c: {
    name: 'Expressive Canvas',
    tagline: 'A product with a pulse',
    note: 'Full-bleed, decks, display type, generous motion. Optimised for emotional pull and mobile.',
  },
}

const KEY = 'kairo.variant'

function isVariant(v: string | null): v is Variant {
  return v === 'a' || v === 'b' || v === 'c'
}

function read(param: string | null): Variant {
  if (isVariant(param)) return param
  try {
    const stored = localStorage.getItem(KEY)
    if (isVariant(stored)) return stored
  } catch {
    /* private mode — fall through */
  }
  return 'a'
}

export function useVariant(): Variant {
  const [params] = useSearchParams()
  const param = params.get('v')
  const [variant, setVariant] = useState<Variant>(() => read(param))

  useEffect(() => {
    const next = read(param)
    setVariant(next)
    document.documentElement.dataset.variant = next
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* ignore */
    }
  }, [param])

  return variant
}

/** Read + write. Used by the VariantSwitcher and the gallery. */
export function useVariantControl() {
  const variant = useVariant()
  const [params, setParams] = useSearchParams()

  const set = useCallback(
    (next: Variant) => {
      const p = new URLSearchParams(params)
      p.set('v', next)
      setParams(p, { replace: true })
    },
    [params, setParams],
  )

  return { variant, set }
}

/** Pick a value per direction — the escape hatch for one-off differences. */
export function byVariant<T>(variant: Variant, options: Record<Variant, T>): T {
  return options[variant]
}
