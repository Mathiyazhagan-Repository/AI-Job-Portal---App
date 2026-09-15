import * as React from 'react'
import { Link } from 'react-router'
import {
  ShieldCheck, AlertTriangle, XCircle, CheckCircle2, Sparkles, ArrowRight,
  FileSearch, Wrench, Target, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { atsReports, type AtsReport, type AtsCheck, type AtsSeverity } from '@/data/console'
import { jobs } from '@/data/mock'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadialGauge, HBarChart, StackedBar, type Tone } from '@/components/common'
import { Stagger, StaggerItem, Reveal, AnimatedNumber } from '@/components/motion'
import { AIProvenanceChip } from '@/components/brand'

/**
 * C4 — ATS score for an uploaded resume.
 *
 * An "ATS score" is a heuristic, not a verdict from any real employer's
 * system — so every number here is tied to a named, fixable check, and
 * the panel says plainly what it cannot know.
 */

const SEVERITY: Record<AtsSeverity, { icon: React.ElementType; tone: string; label: string }> = {
  pass:     { icon: CheckCircle2,  tone: 'text-tone-emerald bg-tone-emerald-bg', label: 'Passing' },
  warning:  { icon: AlertTriangle, tone: 'text-tone-amber bg-tone-amber-bg',     label: 'Could improve' },
  critical: { icon: XCircle,       tone: 'text-tone-rose bg-tone-rose-bg',       label: 'Needs fixing' },
}

const CATEGORY_TONE: Record<AtsCheck['category'], Tone> = {
  Parsing: 'indigo',
  Content: 'violet',
  Keywords: 'fuchsia',
  Formatting: 'teal',
}

function band(score: number) {
  if (score >= 85) return { tone: 'emerald' as Tone, label: 'Strong', note: 'This will parse cleanly in most applicant tracking systems.' }
  if (score >= 70) return { tone: 'amber' as Tone, label: 'Decent', note: 'It will parse, but a few fixes would meaningfully raise your keyword coverage.' }
  return { tone: 'rose' as Tone, label: 'Needs work', note: 'Several issues here commonly cause a resume to be filtered out before a person reads it.' }
}

/** Scores per category, weighted the way the overall score is computed. */
function categoryScores(report: AtsReport) {
  const cats = [...new Set(report.checks.map((c) => c.category))]
  return cats.map((cat) => {
    const items = report.checks.filter((c) => c.category === cat)
    const w = items.reduce((n, c) => n + c.weight, 0)
    const s = items.reduce((n, c) => n + c.score * c.weight, 0) / (w || 1)
    return { label: cat, value: Math.round(s), tone: CATEGORY_TONE[cat], hint: `${w}% weight` }
  })
}

export function AtsPanel({
  resumeId,
  resumeLabel,
  onClose,
}: {
  resumeId: string
  resumeLabel: string
  onClose?: () => void
}) {
  const report = atsReports[resumeId]
  const [targetJob, setTargetJob] = React.useState(jobs[0].id)
  const [scanning, setScanning] = React.useState(false)

  if (!report) {
    return (
      <div className="rounded-v border border-dashed border-line p-8 text-center">
        <FileSearch className="mx-auto size-7 text-ink-3" aria-hidden />
        <p className="mt-3 font-medium text-ink">No ATS analysis yet</p>
        <p className="mt-1 text-sm text-ink-2">
          This file has not been analysed — that usually means parsing failed.
        </p>
      </div>
    )
  }

  const b = band(report.overall)
  const cats = categoryScores(report)
  const issues = report.checks.filter((c) => c.severity !== 'pass')
  const missing = report.keywords.filter((k) => k.inJob && !k.inResume)
  const present = report.keywords.filter((k) => k.inJob && k.inResume)
  const extra = report.keywords.filter((k) => !k.inJob && k.inResume)

  const rescan = () => {
    setScanning(true)
    window.setTimeout(() => setScanning(false), 1400)
  }

  return (
    <div className="space-y-4">
      {/* ── headline score ── */}
      <div className="overflow-hidden rounded-v border border-line bg-paper shadow-v-card">
        <div
          className="h-1.5 w-full"
          style={{
            background:
              b.tone === 'emerald' ? 'linear-gradient(90deg,#10b981,#047857)'
                : b.tone === 'amber' ? 'linear-gradient(90deg,#f59e0b,#b45309)'
                  : 'linear-gradient(90deg,#f43f5e,#be123c)',
          }}
          aria-hidden
        />
        <div className="grid gap-6 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="flex items-center gap-5">
            <RadialGauge value={report.overall} tone={b.tone} size={132} sublabel="of 100" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                ATS score
              </p>
              <p className="mt-0.5 text-2xl font-semibold text-ink">{b.label}</p>
              <p className="mt-1 max-w-xs text-sm leading-relaxed text-ink-2">{b.note}</p>
            </div>
          </div>

          <div className="sm:border-l sm:border-line sm:pl-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
              Score by category
            </p>
            <div className="mt-3">
              <HBarChart data={cats} labelWidth="w-24" suffix="" />
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-3 text-center">
              {[
                ['Words', String(report.wordCount)],
                ['Pages', String(report.pages)],
                ['Reading level', report.readingLevel.split('·')[0].trim()],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] text-ink-3">{k}</dt>
                  <dd className="font-mono tnum text-sm font-semibold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-canvas px-5 py-3">
          <AIProvenanceChip
            what="ran these checks on your file"
            cannot="This is our own heuristic, not a real employer's system. No ATS publishes its scoring, so treat this as a checklist — not a verdict."
          />
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={rescan} loading={scanning}>
              {!scanning && <FileSearch className="size-4" />}
              Re-scan
            </Button>
            {onClose && (
              <Button size="sm" variant="ghost" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── keyword coverage against a chosen job ── */}
      <div className="rounded-v border border-line bg-paper p-5 shadow-v-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-ink">
              <Target className="size-4 text-tone-fuchsia" aria-hidden />
              Keyword coverage
            </h3>
            <p className="mt-0.5 text-sm text-ink-2">
              Which terms from the job actually appear in your resume.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-ink-3">Against</span>
            <select
              value={targetJob}
              onChange={(e) => setTargetJob(e.target.value)}
              className="h-9 max-w-56 rounded-v-control border border-line bg-paper px-2 text-sm font-medium text-ink outline-none focus:border-brand-500"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4">
          <StackedBar
            data={[
              { label: 'Matched', value: present.length, tone: 'emerald' },
              { label: 'Missing', value: missing.length, tone: 'rose' },
            ]}
            height={10}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-tone-rose">
              Missing — add these {missing.length}
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {missing.map((k) => (
                <li key={k.term}>
                  <span className="inline-flex items-center gap-1 rounded-full bg-tone-rose-bg px-2.5 py-1 text-xs font-medium text-tone-rose ring-1 ring-inset ring-tone-rose/20">
                    <XCircle className="size-3" aria-hidden />
                    {k.term}
                  </span>
                </li>
              ))}
              {missing.length === 0 && <li className="text-sm text-ink-3">Nothing missing.</li>}
            </ul>
            <p className="mt-2 text-xs leading-relaxed text-ink-2">
              Only add a term if it is genuinely true of your experience. Keyword-stuffing a resume
              is obvious to the person who reads it after the filter.
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-tone-emerald">
              Already covered — {present.length}
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {present.map((k) => (
                <li key={k.term}>
                  <span className="inline-flex items-center gap-1 rounded-full bg-tone-emerald-bg px-2.5 py-1 text-xs font-medium text-tone-emerald ring-1 ring-inset ring-tone-emerald/20">
                    <CheckCircle2 className="size-3" aria-hidden />
                    {k.term}
                    <span className="font-mono opacity-70">×{k.count}</span>
                  </span>
                </li>
              ))}
            </ul>
            {extra.length > 0 && (
              <p className="mt-3 text-xs text-ink-3">
                Also in your resume but not this job: {extra.map((k) => k.term).join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── fixable issues, worst first ── */}
      <div className="rounded-v border border-line bg-paper p-5 shadow-v-card">
        <h3 className="flex items-center gap-2 font-semibold text-ink">
          <Wrench className="size-4 text-tone-amber" aria-hidden />
          {issues.length} {issues.length === 1 ? 'thing' : 'things'} worth fixing
        </h3>
        <p className="mt-0.5 text-sm text-ink-2">
          Ordered by how much each one is costing your score.
        </p>

        <Stagger className="mt-4 space-y-2" whenVisible={false}>
          {[...issues]
            .sort((a, x) => (100 - a.score) * a.weight - (100 - x.score) * x.weight)
            .reverse()
            .map((c) => {
              const sev = SEVERITY[c.severity]
              const Icon = sev.icon
              const cost = Math.round(((100 - c.score) * c.weight) / 100)
              return (
                <StaggerItem key={c.id}>
                  <div className="flex items-start gap-3 rounded-v border border-line p-3.5 transition-v hover:border-line-strong">
                    <span className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg', sev.tone)}>
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-ink">{c.label}</p>
                        <Badge tone="outline" size="sm">{c.category}</Badge>
                        {cost > 0 && (
                          <span className="font-mono text-xs font-semibold text-tone-rose">
                            −{cost} pts
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-ink-2">{c.detail}</p>
                      {c.fix && (
                        <p className="mt-2 flex items-start gap-1.5 rounded-v-control bg-tone-indigo-bg p-2.5 text-sm leading-relaxed text-tone-indigo">
                          <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                          {c.fix}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 font-mono tnum text-sm font-semibold text-ink">
                      {c.score}
                    </span>
                  </div>
                </StaggerItem>
              )
            })}
        </Stagger>
      </div>

      {/* ── everything already passing ── */}
      <details className="rounded-v border border-line bg-paper p-5 shadow-v-card">
        <summary className="cursor-pointer font-medium text-ink">
          {report.checks.filter((c) => c.severity === 'pass').length} checks already passing
        </summary>
        <ul className="mt-3 space-y-2">
          {report.checks
            .filter((c) => c.severity === 'pass')
            .map((c) => (
              <li key={c.id} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-tone-emerald" aria-hidden />
                <span>
                  <span className="font-medium text-ink">{c.label}</span>
                  <span className="block text-ink-2">{c.detail}</span>
                </span>
              </li>
            ))}
        </ul>
      </details>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/candidate/profile">
            Update my profile
            <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link to="/candidate/jobs">Find jobs matching this resume</Link>
        </Button>
      </div>
    </div>
  )
}
