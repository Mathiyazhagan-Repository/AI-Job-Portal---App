import * as React from 'react'
import { Link } from 'react-router'
import { BellRing, Pause, Play, Pencil, Trash2, Plus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { jobAlerts as seed, type JobAlert } from '@/data/console'
import { jobById } from '@/data/mock'
import { relativeTime, salaryLPA, shortDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/controls'
import { Input, Field, Label } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/overlay'
import { PageHeader, EmptyState, DataTable, type Column } from '@/components/common'
import { Stagger, StaggerItem, Reveal } from '@/components/motion'

/** C8 — Job alerts (PRD Part 27). */

const FREQ_LABEL: Record<JobAlert['frequency'], string> = {
  instant: 'as soon as it appears',
  daily: 'once a day',
  weekly: 'once a week',
}

/** Criteria as a sentence — nobody wants to decode a filter object. */
function criteriaSentence(a: JobAlert): string {
  const bits = [
    `${a.keywords} roles`,
    a.location === 'Anywhere' ? 'anywhere' : `in ${a.location}`,
    `above ${salaryLPA(a.salaryMin, undefined, true).replace('+', '')}`,
    a.workMode.toLowerCase(),
  ]
  return bits.join(', ') + ` — ${FREQ_LABEL[a.frequency]}`
}

function useAlerts() {
  const [list, setList] = React.useState<JobAlert[]>(seed)
  const toggle = (id: string) =>
    setList((l) => l.map((a) => (a.id === id ? { ...a, active: !a.active } : a)))
  const remove = (id: string) => setList((l) => l.filter((a) => a.id !== id))
  return { list, toggle, remove }
}

type A = ReturnType<typeof useAlerts>

export function Component() {
  const variant = useVariant()
  const a = useAlerts()
  const Views = { a: AlertsA, b: AlertsB, c: AlertsC }
  const View = Views[variant] ?? AlertsA
  return <View a={a} />
}
Component.displayName = 'JobAlertsPage'

/* ══════════════════ shared ══════════════════ */

function CreateAlertSheet({ trigger }: { trigger: React.ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="overflow-y-auto p-5">
        <h2 className="text-lg font-semibold text-ink">New job alert</h2>
        <p className="mt-1 text-sm text-ink-2">
          Prefilled from your last search. We only send when something genuinely new matches — never
          the same job twice.
        </p>
        <div className="mt-5 space-y-4">
          <Field label="Keywords" htmlFor="al-kw" required>
            <Input defaultValue="React" />
          </Field>
          <Field label="Location" htmlFor="al-loc">
            <Input defaultValue="Bengaluru" />
          </Field>
          <Field label="Minimum salary" htmlFor="al-sal" hint="Lakhs per annum">
            <Input type="number" defaultValue={18} />
          </Field>
          <div>
            <Label>How often?</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {(['instant', 'daily', 'weekly'] as const).map((f, i) => (
                <button
                  key={f}
                  type="button"
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-sm font-medium capitalize transition-v',
                    i === 1
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-line bg-paper text-ink-2 hover:border-brand-300',
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <Button className="w-full">Create alert</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Empty() {
  return (
    <EmptyState
      icon={BellRing}
      title="No alerts yet"
      description="An alert watches for new roles matching your criteria and tells you once — deduplicated, so the same job never arrives twice."
      action={{ label: 'Create your first alert' }}
    />
  )
}

/* ══════════════════ A · prose cards ══════════════════ */

function AlertsA({ a }: { a: A }) {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
      <PageHeader
        icon={BellRing}
        tone="amber"
        title="Job alerts"
        description={`${a.list.filter((x) => x.active).length} active · ${a.list.reduce((n, x) => n + x.newMatches, 0)} new matches this week`}
        actions={
          <CreateAlertSheet
            trigger={
              <Button>
                <Plus className="size-4" />
                New alert
              </Button>
            }
          />
        }
      />

      {a.list.length === 0 ? (
        <Empty />
      ) : (
        <Stagger className="mt-6 space-y-3" whenVisible={false}>
          {a.list.map((al) => (
            <StaggerItem key={al.id}>
              <article
                className={cn(
                  'rounded-v border-[length:var(--v-card-border)] bg-paper p-v-card shadow-v-card transition-v',
                  al.active ? 'border-line' : 'border-line opacity-65',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-ink">{al.keywords}</h2>
                      {al.newMatches > 0 && al.active && (
                        <Badge tone="brand" size="sm">
                          {al.newMatches} new this week
                        </Badge>
                      )}
                      {!al.active && <Badge tone="neutral" size="sm">paused</Badge>}
                    </div>
                    {/* the sentence, not a filter dump */}
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
                      {criteriaSentence(al)}
                    </p>
                    <p className="mt-1 font-mono text-xs text-ink-3">
                      last checked {relativeTime(al.lastRun)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Switch
                      checked={al.active}
                      onCheckedChange={() => a.toggle(al.id)}
                      aria-label={al.active ? 'Pause alert' : 'Resume alert'}
                    />
                    <Button variant="ghost" size="icon-sm" aria-label="Edit alert">
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => a.remove(al.id)}
                      aria-label="Delete alert"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                {al.hits.length > 0 && (
                  <div className="mt-3 border-t border-line pt-3">
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-3">
                      Recently caught
                    </p>
                    <ul className="space-y-1">
                      {al.hits.map((h) => {
                        const job = jobById(h.jobId)
                        return (
                          <li key={h.jobId} className="flex items-center justify-between gap-3 text-sm">
                            <Link to={`/jobs/${h.jobId}`} className="truncate text-brand-600 hover:underline">
                              {job?.title}
                            </Link>
                            <span className="shrink-0 font-mono text-xs text-ink-3">
                              {relativeTime(h.at)}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  )
}

/* ══════════════════ B · table with inline edit ══════════════════ */

function AlertsB({ a }: { a: A }) {
  const columns: Column<JobAlert>[] = [
    {
      key: 'kw', header: 'Keywords', primary: true, sortable: true, sortValue: (x) => x.keywords,
      cell: (x) => <span className="font-medium text-ink">{x.keywords}</span>,
    },
    { key: 'loc', header: 'Location', cell: (x) => <span className="text-ink-2">{x.location}</span> },
    {
      key: 'sal', header: 'Min salary', align: 'right', hideBelow: 'md', sortable: true, sortValue: (x) => x.salaryMin,
      cell: (x) => <span className="font-mono tnum text-xs">{salaryLPA(x.salaryMin, undefined, true)}</span>,
    },
    { key: 'mode', header: 'Mode', hideBelow: 'lg', cell: (x) => <span className="text-xs text-ink-3">{x.workMode}</span> },
    {
      key: 'freq', header: 'Frequency',
      cell: (x) => <Badge tone="neutral" size="sm">{x.frequency}</Badge>,
    },
    {
      key: 'new', header: 'New', align: 'right', sortable: true, sortValue: (x) => x.newMatches,
      cell: (x) => (
        <span className={cn('font-mono tnum text-xs font-semibold', x.newMatches > 0 ? 'text-brand-600' : 'text-ink-3')}>
          {x.newMatches}
        </span>
      ),
    },
    {
      key: 'run', header: 'Last run', align: 'right', hideBelow: 'md',
      cell: (x) => <span className="font-mono text-xs text-ink-3">{relativeTime(x.lastRun)}</span>,
    },
    {
      key: 'on', header: 'Active', align: 'center',
      cell: (x) => (
        <Switch checked={x.active} onCheckedChange={() => a.toggle(x.id)} aria-label="Toggle alert" />
      ),
    },
    {
      key: 'actions', header: '', align: 'right',
      cell: (x) => (
        <Button variant="ghost" size="icon-sm" onClick={() => a.remove(x.id)} aria-label="Delete">
          <Trash2 className="size-4" />
        </Button>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
        <div>
          <h1 className="text-base font-semibold text-ink">Job alerts</h1>
          <p className="font-mono text-xs text-ink-3">
            {a.list.filter((x) => x.active).length} active / {a.list.length} total
          </p>
        </div>
        <CreateAlertSheet
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              New alert
            </Button>
          }
        />
      </div>

      <DataTable
        rows={a.list}
        columns={columns}
        rowKey={(x) => x.id}
        searchable={(x) => `${x.keywords} ${x.location}`}
        searchPlaceholder="Search alerts…"
        empty={{ title: 'No alerts', description: 'Create one from any search.' }}
      />
    </div>
  )
}

/* ══════════════════ C · timeline of what each caught ══════════════════ */

function AlertsC({ a }: { a: A }) {
  const events = a.list
    .flatMap((al) => al.hits.map((h) => ({ ...h, alert: al })))
    .sort((x, y) => +new Date(y.at) - +new Date(x.at))

  return (
    <div className="mx-auto max-w-[1040px] px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">
            Your alerts
          </h1>
          <p className="mt-3 text-lg text-ink-2">
            What each one has caught for you, newest first.
          </p>
        </div>
        <CreateAlertSheet
          trigger={
            <Button size="lg">
              <Plus className="size-4" />
              New alert
            </Button>
          }
        />
      </div>

      {/* the alerts themselves */}
      <Stagger className="mt-10 space-y-4">
        {a.list.map((al) => (
          <StaggerItem key={al.id}>
            <div
              className={cn(
                'rounded-v bg-paper p-6 shadow-v-card transition-v',
                !al.active && 'opacity-60',
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-display tracking-tight text-xl font-semibold text-ink">
                    {al.keywords}
                  </h2>
                  <p className="mt-1 text-ink-2">{criteriaSentence(al)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {al.newMatches > 0 && al.active && (
                    <Badge tone="brand" size="lg">{al.newMatches} new</Badge>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => a.toggle(al.id)}
                  >
                    {al.active ? <Pause className="size-4" /> : <Play className="size-4" />}
                    {al.active ? 'Pause' : 'Resume'}
                  </Button>
                </div>
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      {/* what they caught */}
      <Reveal className="mt-14">
        <h2 className="font-display tracking-tight text-2xl font-semibold text-ink">
          Recently caught
        </h2>
        {events.length === 0 ? (
          <p className="mt-4 text-ink-3">Nothing yet — your alerts are watching.</p>
        ) : (
          <ol className="mt-6 space-y-5 border-l-2 border-line pl-6">
            {events.map((e) => {
              const job = jobById(e.jobId)
              return (
                <li key={`${e.alert.id}-${e.jobId}`} className="relative">
                  <span className="absolute -left-[31px] top-1.5 size-3 rounded-full bg-brand-600 ring-4 ring-canvas" />
                  <p className="font-mono text-xs text-ink-3">{shortDate(e.at)}</p>
                  <Link
                    to={`/jobs/${e.jobId}`}
                    className="mt-0.5 block text-lg font-semibold text-ink hover:text-brand-700"
                  >
                    {job?.title}
                  </Link>
                  <p className="text-sm text-ink-2">
                    caught by <span className="font-medium">{e.alert.keywords}</span>
                  </p>
                </li>
              )
            })}
          </ol>
        )}
      </Reveal>
    </div>
  )
}
