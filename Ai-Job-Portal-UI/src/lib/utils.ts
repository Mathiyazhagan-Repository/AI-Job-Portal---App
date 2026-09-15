import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge has to be taught our custom scales, otherwise it
 * guesses. Without this, `text-display-1` looks like a colour to it and
 * gets silently dropped by a neighbouring `text-ink` — which is exactly
 * how the hero headline lost its size the first time.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // Display sizes from @theme (--text-display-1 / -2)
      'font-size': [{ text: ['display-1', 'display-2'] }],
      // Variant shape utilities from styles/variants.css
      rounded: [{ rounded: ['v', 'v-control'] }],
      p: ['p-v-card'],
      gap: ['gap-v'],
      h: ['h-v-row'],
      'shadow': ['shadow-v-card'],
      // Gradient text/background pair — one gradient in the whole product
      'bg-image': ['bg-signal'],
      'text-color': ['text-signal'],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Deterministic hue from a string — avatars get colour without photos (PRD Part 16.7). */
export function hueFromId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360
  return h
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}
