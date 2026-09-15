import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/overlay'

/**
 * ⭐ DESIGN.md §7.7 — PRD Part 45 rendered as a UI primitive.
 *
 * This is the ONE component that is identical in all three design
 * directions. It's a compliance surface, not a style choice: every
 * AI-touched surface states what the AI did and — critically — what
 * it cannot do. AI never auto-rejects, never auto-hires, never
 * auto-publishes. Humans decide.
 */
export function AIProvenanceChip({
  what,
  cannot = 'It never auto-rejects, auto-hires or hides its reasoning — every decision stays yours.',
  className,
}: {
  /** e.g. "ranked and explained this match", "drafted this description" */
  what: string
  cannot?: string
  className?: string
}) {
  return (
    <Tooltip
      content={
        <span className="block leading-relaxed">
          <strong className="block font-semibold mb-0.5">AI {what}.</strong>
          {cannot}
        </span>
      }
    >
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
          'bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-600/15',
          'text-[11px] font-medium cursor-help select-none',
          className,
        )}
        tabIndex={0}
        role="note"
      >
        <Sparkles className="size-3" aria-hidden />
        AI-assisted · you decide
      </span>
    </Tooltip>
  )
}
