import { Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Variant } from '@/hooks'

/**
 * ⭐ DESIGN.md §7.12
 *
 * Every recommended card carries one line saying WHY it's here.
 * Recommendations you can argue with are recommendations you trust.
 * Dismiss writes to job_recommendations.dismissed — the personalization
 * loop from PRD Part 17.
 */
export function RecommendationReason({
  reason,
  variant = 'a',
  onDismiss,
  className,
}: {
  reason: string
  variant?: Variant
  onDismiss?: () => void
  className?: string
}) {
  if (variant === 'b') {
    return (
      <span
        className={cn('inline-flex items-center gap-1 text-xs text-ink-3', className)}
        title={reason}
      >
        <Sparkles className="size-3 text-accent-600" aria-hidden />
        <span className="truncate max-w-56">{reason}</span>
      </span>
    )
  }

  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-v-control bg-accent-50/70 px-2.5 py-1.5',
        variant === 'c' && 'text-[15px]',
        className,
      )}
    >
      <Sparkles className="size-3.5 shrink-0 mt-0.5 text-accent-600" aria-hidden />
      <p className="flex-1 text-xs leading-relaxed text-accent-700">{reason}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Not interested — show fewer like this"
          className="shrink-0 rounded p-0.5 text-accent-700/60 hover:bg-accent-100 hover:text-accent-700 transition-colors"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
