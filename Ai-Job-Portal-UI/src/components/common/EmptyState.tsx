import type * as React from 'react'
import { Link } from 'react-router'
import { Inbox, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/* Lives in its own module rather than the barrel because DataTable needs
   it, and the barrel re-exports DataTable — importing it from there made
   the two modules circular. */

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  compact,
  className,
}: {
  icon?: React.ElementType
  title: string
  description?: string
  action?: { label: string; onClick?: () => void; to?: string }
  secondaryAction?: { label: string; onClick?: () => void }
  compact?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        className,
      )}
    >
      <span
        className={cn(
          'grid place-items-center rounded-full bg-brand-50 text-brand-600 mb-4',
          compact ? 'size-10' : 'size-14',
        )}
      >
        <Icon className={compact ? 'size-5' : 'size-7'} aria-hidden />
      </span>
      <h3 className="font-semibold text-ink">{title}</h3>
      {description && (
        <p className="text-sm text-ink-2 mt-1.5 max-w-sm leading-relaxed">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
          {action &&
            (action.to ? (
              <Button asChild size="sm">
                <Link to={action.to}>
                  {action.label}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <Button size="sm" onClick={action.onClick}>
                {action.label}
              </Button>
            ))}
          {secondaryAction && (
            <Button size="sm" variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Filtered-empty is a DIFFERENT state from empty (PRD Part 38).
 * It names the specific filters to loosen — computed, not generic copy.
 */
