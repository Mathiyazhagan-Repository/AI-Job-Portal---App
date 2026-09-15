import { Link } from 'react-router'
import { cn } from '@/lib/utils'

/**
 * The prism mark — one beam in, a spectrum out.
 * Literally the product: one profile → many explained matches.
 */
export function PrismMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="kairo-prism" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      {/* incoming beam */}
      <path d="M1 16h7" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      {/* the prism */}
      <path d="M16 4 L28 26 H4 Z" fill="url(#kairo-prism)" />
      {/* refracted spectrum */}
      <path d="M28 12l3-3" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
      <path d="M29 17h3" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
      <path d="M28 22l3 3" stroke="#0891B2" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function Logo({
  className,
  size = 28,
  showWord = true,
  to = '/',
}: {
  className?: string
  size?: number
  showWord?: boolean
  to?: string
}) {
  return (
    <Link
      to={to}
      className={cn('group inline-flex items-center gap-2 text-ink', className)}
      aria-label="Kairo — home"
    >
      <PrismMark size={size} className="transition-transform duration-300 group-hover:rotate-6" />
      {showWord && (
        <span
          className="font-display font-bold tracking-tight text-[currentColor]"
          // scales with the mark so the two stay in proportion at any size
          style={{ fontVariationSettings: "'wght' 750", fontSize: size * 0.68 }}
        >
          Kairo
        </span>
      )}
    </Link>
  )
}
