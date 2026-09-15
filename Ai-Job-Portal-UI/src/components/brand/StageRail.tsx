import { cn } from '@/lib/utils'
import { ACTIVE_STAGES, STAGES, stageIndex, type Stage } from '@/lib/pipeline'
import { Tooltip } from '@/components/ui/overlay'

/**
 * ⭐ DESIGN.md §7 — a 9-dot progress track for the ATS pipeline.
 * Terminal states (rejected / withdrawn) render as a struck rail.
 */
export function StageRail({
  stage,
  size = 'md',
  showLabel = false,
  className,
}: {
  stage: Stage
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}) {
  const meta = STAGES[stage]
  const terminal = Boolean(meta.terminal)
  const current = terminal ? -1 : stageIndex(stage)

  const dot = size === 'sm' ? 'size-1.5' : 'size-2'
  const bar = size === 'sm' ? 'h-0.5' : 'h-1'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn('flex items-center gap-0.5', terminal && 'opacity-40')}
        role="img"
        aria-label={`Pipeline stage: ${meta.label}`}
      >
        {ACTIVE_STAGES.map((s, i) => {
          const done = !terminal && i < current
          const isCurrent = !terminal && i === current
          return (
            <Tooltip key={s} content={STAGES[s].label}>
              <span className="flex items-center gap-0.5">
                <span
                  className={cn(
                    'rounded-full transition-colors',
                    isCurrent ? `${dot} scale-150` : dot,
                    done && 'bg-brand-600',
                    isCurrent && 'bg-brand-600 ring-2 ring-brand-600/20',
                    !done && !isCurrent && 'bg-line-strong',
                  )}
                />
                {i < ACTIVE_STAGES.length - 1 && (
                  <span
                    className={cn(
                      'w-2 rounded-full transition-colors',
                      bar,
                      done ? 'bg-brand-600' : 'bg-line',
                    )}
                  />
                )}
              </span>
            </Tooltip>
          )
        })}
      </div>
      {showLabel && (
        <span className={cn('text-xs font-medium whitespace-nowrap', meta.text)}>{meta.label}</span>
      )}
    </div>
  )
}

/** Stage pill — the compact form used in tables and cards. */
export function StagePill({
  stage,
  className,
  size = 'md',
}: {
  stage: Stage
  className?: string
  size?: 'sm' | 'md'
}) {
  const meta = STAGES[stage]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap ring-1 ring-inset ring-current/15',
        meta.bg,
        meta.text,
        size === 'sm' ? 'h-5 px-1.5 text-[11px]' : 'h-6 px-2 text-xs',
        className,
      )}
    >
      <i className="size-1.5 rounded-full bg-current" aria-hidden />
      {meta.label}
    </span>
  )
}
