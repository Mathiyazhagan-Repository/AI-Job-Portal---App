import * as React from 'react'
import { Link } from 'react-router'
import {
  Gavel, AlertTriangle, Check, X, MessageSquareWarning, ChevronLeft, ChevronRight,
  BadgeCheck, ShieldAlert, FileText, Globe,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant, useKeyboardShortcut, useAnnounce } from '@/hooks'
import { type ModerationItem } from '@/data/console'
import { jobById, companies, companyById } from '@/data/mock'
import { relativeTime, salaryLPA, experienceRange } from '@/lib/format'
import { useAuth } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/overlay'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/controls'
import { PageHeader, EmptyState, Kbd } from '@/components/common'
import { Stagger, StaggerItem, Reveal, ScrambleText } from '@/components/motion'
import { CompanyMark } from '@/features/jobs/JobCard'

/**
 * A5 / A6 — Job moderation and company verification.
 *
 * The flag strip is the point: an admin should see *why* something was
 * surfaced before reading the posting. Rejection always needs a reason,
 * because that reason becomes the notification the company receives.
 */

const FLAG_META = {
  language: { label: 'Language', tone: 'danger' as const, icon: MessageSquareWarning },
  salary: { label: 'Salary anomaly', tone: 'warning' as const, icon: AlertTriangle },
  duplicate: { label: 'Possible duplicate', tone: 'warning' as const, icon: FileText },
}

function useModeration() {
  const { token } = useAuth()
  const [tab, setTab] = React.useState<'jobs' | 'companies'>('jobs')
  const [queue, setQueue] = React.useState<ModerationItem[]>([])
  const [verificationQueue, setVerificationQueue] = React.useState<any[]>([])
  const [cursor, setCursor] = React.useState(0)
  const [rejecting, setRejecting] = React.useState<ModerationItem | null>(null)
  const announce = useAnnounce()

  React.useEffect(() => {
    let isActive = true
    if (!token) return
    
    Promise.all([
      fetch('http://localhost:8000/api/admin/moderation/jobs', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch('http://localhost:8000/api/admin/moderation/companies', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : [])
    ]).then(([jobsData, companiesData]) => {
      if (!isActive) return
      setQueue(jobsData)
      setVerificationQueue(companiesData)
    }).catch(console.error)
    
    return () => { isActive = false }
  }, [token])

  const current = queue[cursor]

  const approve = async (id: string) => {
    const item = queue.find((q) => q.id === id)
    if (token) {
      await fetch(`http://localhost:8000/api/admin/moderation/jobs/${id}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(console.error)
    }
    setQueue((q) => q.filter((x) => x.id !== id))
    setCursor((c) => Math.max(0, Math.min(queue.length - 2, c)))
    announce(`${jobById(item?.jobId ?? '')?.title ?? 'Job'} approved and published`)
  }
  const reject = async (id: string, reason: string) => {
    if (token) {
      await fetch(`http://localhost:8000/api/admin/moderation/jobs/${id}/reject`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      }).catch(console.error)
    }
    setQueue((q) => q.filter((x) => x.id !== id))
    setCursor((c) => Math.max(0, Math.min(queue.length - 2, c)))
    setRejecting(null)
    announce('Job rejected, and the company has been told why')
  }
  const move = (d: number) =>
    setCursor((c) => Math.max(0, Math.min(queue.length - 1, c + d)))

  const verifyCompany = async (companyId: string) => {
    if (token) {
      await fetch(`http://localhost:8000/api/admin/moderation/companies/${companyId}/verify`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(console.error)
    }
    setVerificationQueue((q) => q.filter((x) => x.companyId !== companyId))
    announce('Company verified successfully')
  }

  return { tab, setTab, queue, verificationQueue, cursor, setCursor, current, approve, reject, verifyCompany, rejecting, setRejecting, move }
}

type M = ReturnType<typeof useModeration>

export function Component() {
  const variant = useVariant()
  const m = useModeration()

  useKeyboardShortcut({
    a: () => m.current && m.approve(m.current.id),
    r: () => m.current && m.setRejecting(m.current),
    j: () => m.move(1),
    k: () => m.move(-1),
  })

  const Views = { a: ModA, b: ModB, c: ModC }
  const View = Views[variant] ?? ModA
  return (
    <>
      <View m={m} />
      <RejectDialog m={m} />
    </>
  )
}
Component.displayName = 'AdminModeration'

/* ══════════════════ shared ══════════════════ */

function FlagStrip({ item, large }: { item: ModerationItem; large?: boolean }) {
  if (item.flags.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-v-control bg-score-elite-bg px-3 py-2">
        <Check className="size-4 shrink-0 text-score-elite" aria-hidden />
        <p className="text-sm font-medium text-score-elite">
          No automated flags — nothing suspicious found
        </p>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      {item.flags.map((f) => {
        const meta = FLAG_META[f.kind]
        const Icon = meta.icon
        return (
          <div
            key={f.kind}
            className={cn(
              'flex items-start gap-2.5 rounded-v-control px-3 py-2',
              meta.tone === 'danger' ? 'bg-danger-bg' : 'bg-warning-bg',
            )}
          >
            <Icon
              className={cn(
                'mt-0.5 size-4 shrink-0',
                meta.tone === 'danger' ? 'text-danger' : 'text-warning',
              )}
              aria-hidden
            />
            <div className="min-w-0">
              <p
                className={cn(
                  'text-sm font-semibold',
                  meta.tone === 'danger' ? 'text-danger' : 'text-warning',
                )}
              >
                {meta.label}
              </p>
              <p className={cn('text-ink-2', large ? 'text-sm' : 'text-xs')}>{f.detail}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function JobPreview({ item, large }: { item: ModerationItem; large?: boolean }) {
  const job = jobById(item.jobId)
  if (!job) return null
  const company = companyById(job.companyId)

  return (
    <div>
      <div className="flex flex-wrap items-start gap-3">
        <CompanyMark company={company} size={large ? 48 : 40} />
        <div className="min-w-0 flex-1">
          <h3 className={cn('font-semibold text-ink', large ? 'text-2xl' : 'text-lg')}>
            {job.title}
          </h3>
          <p className="text-sm text-ink-2">
            {company.name} · {job.location} · submitted {relativeTime(item.submitted)}
          </p>
        </div>
        {!company.verified && (
          <Badge tone="warning" size="sm">
            <ShieldAlert className="size-3" aria-hidden />
            unverified company
          </Badge>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        {[
          ['Salary', salaryLPA(job.salaryMin, job.salaryMax, job.salaryVisible)],
          ['Experience', experienceRange(job.experienceMin, job.experienceMax)],
          ['Work mode', job.workMode],
          ['Openings', String(job.openings)],
          ['Department', job.department],
          ['Applicants', String(job.applicants)],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-ink-3">{k}</dt>
            <dd className="font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 rounded-v border border-line bg-canvas p-4">
        <p className={cn('leading-relaxed text-ink-2', large ? 'text-base' : 'text-sm')}>
          {job.description}
        </p>
        <ul className="mt-3 space-y-1">
          {job.responsibilities.slice(0, 3).map((r) => (
            <li key={r} className={cn('text-ink-2', large ? 'text-sm' : 'text-xs')}>
              · {r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Decision({ m, item, large }: { m: M; item: ModerationItem; large?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size={large ? 'lg' : 'md'} onClick={() => m.approve(item.id)}>
        <Check className="size-4" />
        Approve
        <Kbd className="ml-1 border-white/30 bg-white/20 text-white">A</Kbd>
      </Button>
      <Button size={large ? 'lg' : 'md'} variant="secondary" onClick={() => m.setRejecting(item)}>
        <X className="size-4" />
        Reject
        <Kbd className="ml-1">R</Kbd>
      </Button>
      <Button size={large ? 'lg' : 'md'} variant="ghost">
        Request changes
      </Button>
    </div>
  )
}

function RejectDialog({ m }: { m: M }) {
  const [reason, setReason] = React.useState('')
  const item = m.rejecting

  const presets = [
    'Salary range appears misleading for this title and location',
    'Wording may indicate an age or gender preference',
    'Duplicate of an existing live posting',
    'Company verification incomplete',
  ]

  React.useEffect(() => setReason(''), [item])

  return (
    <Dialog open={Boolean(item)} onOpenChange={(o) => !o && m.setRejecting(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject this posting?</DialogTitle>
          <DialogDescription>
            A reason is required — it is sent to the company verbatim and written to the audit log.
          </DialogDescription>
        </DialogHeader>
        {item && (
          <div className="px-5 pb-5">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setReason(p)}
                  className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-2 transition-v hover:border-brand-300 hover:bg-brand-50"
                >
                  {p}
                </button>
              ))}
            </div>
            <Textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain what needs to change so they can fix it."
              aria-label="Rejection reason"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => m.setRejecting(null)}>
                Cancel
              </Button>
              <Button variant="danger" disabled={reason.trim().length < 8} onClick={() => m.reject(item.id, reason)}>
                Reject and notify
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ══════════════════ verification queue ══════════════════ */

function VerificationList({ m, large }: { m: M, large?: boolean }) {
  return (
    <Stagger className="space-y-3" whenVisible={false}>
      {m.verificationQueue.map((v) => {
        const company = companies.find((c) => c.id === v.companyId)!
        return (
          <StaggerItem key={v.id}>
            <div
              className={cn(
                'rounded-v border border-line bg-paper shadow-v-card',
                large ? 'p-6' : 'p-v-card',
              )}
            >
              <div className="flex flex-wrap items-start gap-3">
                <CompanyMark company={company} size={40} />
                <div className="min-w-0 flex-1">
                  <h3 className={cn('font-semibold text-ink', large && 'text-lg')}>
                    {company.name}
                  </h3>
                  <p className="text-sm text-ink-3">
                    submitted {relativeTime(v.submitted)} · {company.industry}
                  </p>
                </div>
              </div>

              <ul className="mt-4 space-y-1.5 text-sm">
                {[
                  ['Email domain matches website', v.domainMatch, v.domain],
                  ['Registration document uploaded', true, v.documentName],
                  ['GST registration present', v.gstPresent, ''],
                ].map(([label, ok, extra]) => (
                  <li key={String(label)} className="flex items-center gap-2">
                    <span
                      className={cn(
                        'grid size-4 shrink-0 place-items-center rounded-full',
                        ok ? 'bg-score-elite text-white' : 'bg-danger text-white',
                      )}
                    >
                      {ok ? <Check className="size-2.5 stroke-[3]" aria-hidden /> : <X className="size-2.5 stroke-[3]" aria-hidden />}
                    </span>
                    <span className={ok ? 'text-ink-2' : 'text-danger'}>{String(label)}</span>
                    {extra ? <span className="font-mono text-xs text-ink-3">{String(extra)}</span> : null}
                  </li>
                ))}
              </ul>

              {!v.domainMatch && (
                <p className="mt-3 flex items-start gap-2 rounded-v-control bg-warning-bg p-2.5 text-xs text-warning">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  The submitting email domain does not match the stated website. Verify manually
                  before approving — this is the main signal for a fake employer.
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => m.verifyCompany(v.companyId)}>
                  <BadgeCheck className="size-4" />
                  Verify company
                </Button>
                <Button size="sm" variant="secondary">
                  Reject with reason
                </Button>
                <Button size="sm" variant="ghost">
                  <FileText className="size-4" />
                  View document
                </Button>
              </div>
            </div>
          </StaggerItem>
        )
      })}
    </Stagger>
  )
}

function QueueTabs({ m }: { m: M }) {
  return (
    <Tabs value={m.tab} onValueChange={(v) => m.setTab(v as typeof m.tab)}>
      <TabsList>
        <TabsTrigger value="jobs">Jobs ({m.queue.length})</TabsTrigger>
        <TabsTrigger value="companies">Companies ({m.verificationQueue.length})</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

function AllClear() {
  return (
    <EmptyState
      icon={Check}
      title="Queue is empty"
      description="Every submitted posting has been reviewed. New submissions appear here immediately."
      action={{ label: 'Back to dashboard', to: '/admin' }}
    />
  )
}

/* ══════════════════ A · triage list ══════════════════ */

function ModA({ m }: { m: M }) {
  return (
    <div className="mx-auto max-w-[1300px] px-4 py-6 sm:px-6">
      <PageHeader
        icon={Gavel}
        tone="amber"
        title="Moderation"
        description="Postings and companies waiting on a human decision."
        actions={<QueueTabs m={m} />}
      />

      {m.tab === 'companies' ? (
        <div className="mt-6 max-w-3xl">
          <VerificationList m={m} />
        </div>
      ) : m.queue.length === 0 ? (
        <AllClear />
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-[300px_1fr]">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-3">Queue</h2>
              <span className="flex items-center gap-1 text-xs text-ink-3">
                <Kbd>J</Kbd>
                <Kbd>K</Kbd>
              </span>
            </div>
            <Stagger className="space-y-2" whenVisible={false}>
              {m.queue.map((item, i) => {
                const job = jobById(item.jobId)
                return (
                  <StaggerItem key={item.id}>
                    <button
                      type="button"
                      onClick={() => m.setCursor(i)}
                      aria-current={i === m.cursor ? 'true' : undefined}
                      className={cn(
                        'w-full rounded-v border p-3 text-left transition-v',
                        i === m.cursor
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-line bg-paper hover:border-line-strong',
                      )}
                    >
                      <p className="truncate font-medium text-ink">{job?.title}</p>
                      <p className="truncate text-xs text-ink-3">{item.company}</p>
                      {item.flags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {item.flags.map((f) => (
                            <Badge key={f.kind} tone={FLAG_META[f.kind].tone} size="sm">
                              {FLAG_META[f.kind].label}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </button>
                  </StaggerItem>
                )
              })}
            </Stagger>
          </div>

          {m.current && (
            <Reveal key={m.current.id} className="rounded-v border border-line bg-paper p-v-card shadow-v-card">
              <FlagStrip item={m.current} />
              <div className="mt-5">
                <JobPreview item={m.current} />
              </div>
              <div className="mt-6 border-t border-line pt-4">
                <Decision m={m} item={m.current} />
              </div>
            </Reveal>
          )}
        </div>
      )}
    </div>
  )
}

/* ══════════════════ B · table with inline expansion ══════════════════ */

function ModB({ m }: { m: M }) {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
        <div>
          <h1 className="text-base font-semibold text-ink">Moderation</h1>
          <ScrambleText
            as="p"
            className="font-mono text-xs text-ink-3"
            duration={460}
            text={`${m.queue.length} jobs / ${m.verificationQueue.length} companies pending`}
          />
        </div>
        <div className="flex items-center gap-2">
          <QueueTabs m={m} />
          <span className="flex items-center gap-1 text-xs text-ink-3">
            <Kbd>A</Kbd> approve <Kbd>R</Kbd> reject
          </span>
        </div>
      </div>

      {m.tab === 'companies' ? (
        <div className="max-w-3xl">
          <VerificationList m={m} />
        </div>
      ) : m.queue.length === 0 ? (
        <AllClear />
      ) : (
        <div className="divide-y divide-line border-y border-line">
          {m.queue.map((item, i) => {
            const job = jobById(item.jobId)
            const open = i === m.cursor
            return (
              <div key={item.id}>
                <button
                  type="button"
                  onClick={() => m.setCursor(i)}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2 text-left transition-v',
                    open ? 'bg-brand-50' : 'hover:bg-hover',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{job?.title}</span>
                    <span className="block truncate text-xs text-ink-3">{item.company}</span>
                  </span>
                  <span className="hidden shrink-0 gap-1 sm:flex">
                    {item.flags.length === 0 ? (
                      <Badge tone="success" size="sm">clean</Badge>
                    ) : (
                      item.flags.map((f) => (
                        <Badge key={f.kind} tone={FLAG_META[f.kind].tone} size="sm">
                          {FLAG_META[f.kind].label}
                        </Badge>
                      ))
                    )}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-ink-3">
                    {relativeTime(item.submitted)}
                  </span>
                </button>

                {open && (
                  <div className="border-t border-line bg-canvas px-3 py-3">
                    <FlagStrip item={item} />
                    <div className="mt-4">
                      <JobPreview item={item} />
                    </div>
                    <div className="mt-4">
                      <Decision m={m} item={item} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ══════════════════ C · one at a time ══════════════════ */

function ModC({ m }: { m: M }) {
  if (m.tab === 'companies') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">
          Company verification
        </h1>
        <div className="mt-6">
          <QueueTabs m={m} />
        </div>
        <div className="mt-8">
          <VerificationList m={m} large />
        </div>
      </div>
    )
  }

  if (m.queue.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <AllClear />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">
            Moderation
          </h1>
          <p className="mt-3 text-lg text-ink-2">One posting at a time, decided by a person.</p>
        </div>
        <QueueTabs m={m} />
      </div>

      <div className="mt-8 flex items-center gap-3">
        <Button variant="secondary" size="icon" onClick={() => m.move(-1)} disabled={m.cursor === 0} aria-label="Previous">
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <div className="flex h-1.5 gap-0.5">
            {m.queue.map((q, i) => (
              <span
                key={q.id}
                className={cn(
                  'flex-1 rounded-full',
                  i === m.cursor ? 'bg-brand-600' : i < m.cursor ? 'bg-brand-200' : 'bg-line',
                )}
              />
            ))}
          </div>
          <p className="mt-1.5 text-center text-xs text-ink-3">
            {m.cursor + 1} of {m.queue.length}
          </p>
        </div>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => m.move(1)}
          disabled={m.cursor >= m.queue.length - 1}
          aria-label="Next"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {m.current && (
        <Reveal key={m.current.id} whenVisible={false} className="mt-6 rounded-v bg-paper p-8 shadow-xl">
          <FlagStrip item={m.current} large />
          <div className="mt-6">
            <JobPreview item={m.current} large />
          </div>
          <div className="mt-8 border-t border-line pt-6">
            <Decision m={m} item={m.current} large />
          </div>
        </Reveal>
      )}
    </div>
  )
}
