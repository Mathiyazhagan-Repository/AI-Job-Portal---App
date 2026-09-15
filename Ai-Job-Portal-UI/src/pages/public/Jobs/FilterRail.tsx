import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/controls'
import { Button } from '@/components/ui/button'
import { HistogramRangeSlider } from '@/components/common'
import { facets } from '@/data/mock'
import type { JobSearchState } from './useJobSearch'

const lpa = (n: number) => `₹${(n / 100000).toFixed(0)}L`

/** Shared by all three Jobs variants — only its container changes. */
export function FilterRail({
  state,
  className,
}: {
  state: JobSearchState
  className?: string
}) {
  const { filters, toggle, setFilters, histogram, salaryBounds, activeChips, clearAll } = state

  return (
    <div className={cn('space-y-6', className)}>
      {activeChips.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Active filters</h3>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Clear all
            </button>
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {activeChips.map((c) => (
              <li key={c.key}>
                <button
                  type="button"
                  onClick={() => state.clearChip(c.key)}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-xs font-medium capitalize text-brand-700 transition-colors hover:bg-brand-100"
                >
                  {c.label}
                  <X className="size-3" aria-hidden />
                  <span className="sr-only">Remove filter</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <HistogramRangeSlider
        label="Salary"
        histogram={histogram}
        min={salaryBounds[0]}
        max={salaryBounds[1]}
        step={100000}
        value={filters.salary}
        onChange={(salary) => setFilters((f) => ({ ...f, salary }))}
        format={lpa}
      />

      <FacetGroup
        title="Work mode"
        options={facets.workMode}
        selected={filters.workMode}
        onToggle={(v) => toggle('workMode', v)}
      />

      <FacetGroup
        title="Job type"
        options={facets.jobType}
        selected={filters.jobType}
        onToggle={(v) => toggle('jobType', v)}
      />

      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink">Skills</h3>
        <ul className="flex flex-wrap gap-1.5">
          {facets.topSkills.map((s) => {
            const on = filters.skills.includes(s)
            return (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => toggle('skills', s)}
                  aria-pressed={on}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                    on
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-line bg-paper text-ink-2 hover:border-brand-300 hover:text-brand-700',
                  )}
                >
                  {s}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <FacetGroup
        title="Date posted"
        options={facets.datePosted}
        selected={[]}
        onToggle={() => {}}
      />

      <Button variant="ghost" size="sm" className="w-full" onClick={clearAll}>
        Reset all filters
      </Button>
    </div>
  )
}

function FacetGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string
  options: { value: string; label: string; count: number }[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-ink">{title}</legend>
      <ul className="space-y-1.5">
        {options.map((o) => (
          <li key={o.value}>
            <label className="flex cursor-pointer items-center gap-2.5 py-0.5 text-sm">
              <Checkbox
                checked={selected.includes(o.value)}
                onCheckedChange={() => onToggle(o.value)}
              />
              <span className="flex-1 text-ink-2">{o.label}</span>
              <span className="font-mono tnum text-xs text-ink-3">{o.count}</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  )
}
