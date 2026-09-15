import * as React from 'react'
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/controls'

/**
 * ⭐ DESIGN.md §7.8
 *
 * Salary / experience filters sit on a histogram of actually-matching
 * jobs — so you SEE that dragging to ₹40L leaves 3 results before you
 * commit to the filter.
 */
export function HistogramRangeSlider({
  label,
  histogram,
  min,
  max,
  step = 1,
  value,
  onChange,
  format,
  className,
}: {
  label: string
  histogram: number[]
  min: number
  max: number
  step?: number
  value: [number, number]
  onChange: (v: [number, number]) => void
  format: (n: number) => string
  className?: string
}) {
  const peak = Math.max(...histogram)
  const span = max - min

  const inRange = (i: number) => {
    const bucketStart = min + (i / histogram.length) * span
    const bucketEnd = min + ((i + 1) / histogram.length) * span
    return bucketEnd > value[0] && bucketStart < value[1]
  }

  const matching = React.useMemo(
    () => histogram.reduce((sum, n, i) => (inRange(i) ? sum + n : sum), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [histogram, value],
  )

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="font-mono tnum text-xs text-ink-2">
          {format(value[0])} – {format(value[1])}
        </span>
      </div>

      {/* the histogram — bars outside the range fade back */}
      <div className="flex h-12 items-end gap-px" aria-hidden>
        {histogram.map((n, i) => (
          <div
            key={i}
            className={cn(
              'flex-1 rounded-t-sm transition-colors duration-200',
              inRange(i) ? 'bg-brand-500' : 'bg-line',
            )}
            style={{ height: `${Math.max(6, (n / peak) * 100)}%` }}
          />
        ))}
      </div>

      <Slider
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={(v) => onChange([v[0], v[1]] as [number, number])}
        aria-label={label}
        minStepsBetweenThumbs={1}
      />

      <p className="text-xs text-ink-3" role="status">
        <span className="font-mono tnum font-medium text-ink-2">{matching}</span> jobs in this range
      </p>
    </div>
  )
}
