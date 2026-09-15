import { Link } from 'react-router'
import * as React from 'react'
import {
  Plus, MoreHorizontal, Eye, Copy, Archive, Users, Briefcase, TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { companies, companyById, type Job } from '@/data/mock'
import { relativeTime, shortDate, salaryLPA, titleCase } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, Tabs, TabsList, TabsTrigger,
} from '@/components/ui/controls'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/overlay'
import {
  PageHeader, Sparkline, Kbd, SectionHeading,
  StatCard, BarChart, HBarChart, TONE_CLASS, type Tone,
} from '@/components/common'
import { CompanyMark } from '@/features/jobs/JobCard'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/store/auth'

const SPARK = [4, 9, 6, 12, 18, 14, 22, 19, 26, 24, 31, 28]

export function Component() {
  const variant = useVariant()
  const data = useRecruiterJobs()
  const Views = { a: ListA, b: ListB, c: ListC }
  const View = Views[variant] ?? ListA
  return (
    <>
      {data.error && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 sm:px-6">
          {data.error}
        </div>
      )}
      <View {...data} />
    </>
  )
}
Component.displayName = 'RecruiterJobList'

type JobListData = {
  jobs: Job[]
  counts: { published: number; draft: number; closed: number }
  closeJob: (jobId: string) => Promise<void>
  duplicateJob: (job: Job) => Promise<void>
  error?: string
}

function useRecruiterJobs(): JobListData {
  const [jobRows, setJobRows] = React.useState<Job[]>([])
  const [error, setError] = React.useState<string>()
  const { token } = useAuth()

  const closeJob = React.useCallback(async (jobId: string) => {
    setError(undefined)
    if (!token) {
      const signInError = new Error('Sign in as a recruiter before closing a job.')
      setError(signInError.message)
      throw signInError
    }

    const res = await fetch(`http://localhost:8000/api/recruiter/jobs/${jobId}/close`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (!res.ok) {
      const notUpdatedError = new Error('The job could not be closed.')
      setError(notUpdatedError.message)
      throw notUpdatedError
    }

    setJobRows((current) => current.map((job) =>
      job.id === jobId ? { ...job, status: 'closed' } : job,
    ))
  }, [token])

  const duplicateJob = React.useCallback(async (job: Job) => {
    setError(undefined)
    if (!token) {
      const signInError = new Error('Sign in as a recruiter before duplicating a job.')
      setError(signInError.message)
      throw signInError
    }

    const res = await fetch(`http://localhost:8000/api/recruiter/jobs/${job.id}/duplicate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (!res.ok) {
      const duplicateError = new Error('Unable to duplicate the job.')
      setError(duplicateError.message)
      throw duplicateError
    }

    const resData = await res.json()
    const duplicated = resData.job
    
    setJobRows((current) => [duplicated as Job, ...current])
  }, [token])

  React.useEffect(() => {
    let active = true
    const loadJobs = async () => {
      try {
        if (!token) {
          if (active) {
            setJobRows([])
            setError('Sign in as a recruiter to load your jobs.')
          }
          return
        }
        
        const res = await fetch('http://localhost:8000/api/recruiter/jobs', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Failed to fetch jobs')
        const data = await res.json()
        
        if (!active) return

        setJobRows(data as Job[])
        setError(undefined)
      }
      catch (loadError) {
        if (!active) return
        setJobRows([])
        setError(loadError instanceof Error ? loadError.message : 'Unable to load jobs from the database.')
      }
    }

    void loadJobs()

    return () => {
      active = false
    }
  }, [token])

  return {
    jobs: jobRows,
    closeJob,
    duplicateJob,
    error,
    counts: {
      published: jobRows.filter((job) => job.status === 'published').length,
      draft: jobRows.filter((job) => job.status === 'draft').length,
      closed: jobRows.filter((job) => job.status === 'closed').length,
    },
  }
}

function RowActions({
  job,
  closeJob,
  duplicateJob,
}: {
  job: Job
  closeJob: JobListData['closeJob']
  duplicateJob: JobListData['duplicateJob']
}) {
  const [closing, setClosing] = React.useState(false)
  const [duplicating, setDuplicating] = React.useState(false)
  const [closeDialogOpen, setCloseDialogOpen] = React.useState(false)

  const handleClose = async () => {
    setClosing(true)
    try {
      await closeJob(job.id)
      setCloseDialogOpen(false)
    } catch {
      // The page-level error banner displays the database error.
    } finally {
      setClosing(false)
    }
  }

  const handleDuplicate = async () => {
    setDuplicating(true)
    try {
      await duplicateJob(job)
    } catch {
      // The page-level error banner displays the database error.
    } finally {
      setDuplicating(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Job actions">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <Eye className="size-4" /> Preview as candidate
        </DropdownMenuItem>
        <DropdownMenuItem disabled={duplicating} onSelect={() => void handleDuplicate()}>
          <Copy className="size-4" /> {duplicating ? 'Duplicating...' : 'Duplicate'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          danger
          disabled={closing || job.status === 'closed'}
          onClick={() => setCloseDialogOpen(true)}
        >
          <Archive className="size-4" /> Close job
        </DropdownMenuItem>
      </DropdownMenuContent>
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close this job?</DialogTitle>
            <DialogDescription>
              Are you sure you want to close <strong>{job.title}</strong>? Candidates will no longer be able to apply.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
            <Button variant="secondary" onClick={() => setCloseDialogOpen(false)} disabled={closing}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void handleClose()} loading={closing}>
              Close job
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DropdownMenu>
  )
}

/* ══════════════════ A · table with status tabs ══════════════════ */

const JOB_TONES: Tone[] = ['indigo', 'sky', 'violet', 'fuchsia', 'teal', 'amber', 'emerald', 'rose']

/** Applicants per 100 views — the number that says whether a posting works. */
function conversion(applicants: number, views: number) {
  return views ? Math.round((applicants / views) * 1000) / 10 : 0
}

function ListA({ jobs, counts: COUNTS, closeJob, duplicateJob }: JobListData) {
  const published = jobs.filter((j) => j.status === 'published')
  const totalApplicants = jobs.reduce((n, j) => n + j.applicants, 0)
  const totalViews = jobs.reduce((n, j) => n + j.views, 0)
  const best = [...jobs].sort(
    (a, b) => conversion(b.applicants, b.views) - conversion(a.applicants, a.views),
  )[0]

  const cards = [
    { tone: 'indigo' as Tone, icon: Briefcase, label: 'Published', value: published.length,
      badge: { text: '+2', direction: 'up' as const },
      caption: `${COUNTS.draft} drafts · ${COUNTS.closed} closed` },
    { tone: 'sky' as Tone, icon: Users, label: 'Applicants', value: totalApplicants,
      badge: { text: '+72', direction: 'up' as const }, caption: 'across every live posting' },
    { tone: 'violet' as Tone, icon: Eye, label: 'Job views', value: totalViews.toLocaleString('en-IN'),
      caption: 'last 30 days' },
    { tone: 'emerald' as Tone, icon: TrendingUp, label: 'Applicants per 100 views',
      value: conversion(totalApplicants, totalViews),
      progress: Math.min(100, conversion(totalApplicants, totalViews) * 10),
      caption: best ? `best: ${best.title}` : undefined },
  ]

  const applicantMix = jobs.slice(0, 6).map((j, i) => ({
    label: j.title.length > 16 ? j.title.slice(0, 15) + '…' : j.title,
    value: j.applicants,
    tone: JOB_TONES[i % JOB_TONES.length],
    hint: `${conversion(j.applicants, j.views)} per 100 views`,
  }))

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <PageHeader
        icon={Briefcase}
        tone="violet"
        title="Jobs"
        description={`${COUNTS.published} published · ${COUNTS.draft} drafts · ${COUNTS.closed} closed`}
        actions={
          <Button asChild>
            <Link to="/recruiter/jobs/new">
              <Plus className="size-4" />
              Create a job
            </Link>
          </Button>
        }
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <div className="rounded-v border border-line bg-paper p-v-card shadow-v-card lg:col-span-7">
          <SectionHeading title="Applicants per posting" icon={Users} tone="sky" />
          <HBarChart data={applicantMix} labelWidth="w-32" />
        </div>
        <div className="rounded-v border border-line bg-paper p-v-card shadow-v-card lg:col-span-5">
          <SectionHeading title="Views per posting · last 12 weeks" icon={TrendingUp} tone="violet" />
          <BarChart
            data={jobs.slice(0, 6).map((j, i) => ({
              label: j.location,
              value: j.views,
              tone: JOB_TONES[i % JOB_TONES.length],
            }))}
            height={172}
            formatValue={(n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))}
          />
        </div>
      </div>

      <Tabs defaultValue="published" className="mt-5">
        <TabsList>
          <TabsTrigger value="published">Published ({COUNTS.published})</TabsTrigger>
          <TabsTrigger value="draft">Drafts ({COUNTS.draft})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({COUNTS.closed})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4 overflow-hidden rounded-v border border-line bg-paper shadow-v-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-subtle text-left text-xs text-ink-3">
              <th scope="col" className="px-4 py-2.5 font-medium">Job</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Applicants</th>
              <th scope="col" className="hidden px-4 py-2.5 text-right font-medium lg:table-cell">Views</th>
              <th scope="col" className="hidden px-4 py-2.5 font-medium lg:table-cell">Reach</th>
              <th scope="col" className="hidden px-4 py-2.5 text-right font-medium lg:table-cell">Posted</th>
              <th scope="col" className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {jobs.map((j, i) => {
              const tone = JOB_TONES[i % JOB_TONES.length]
              const t = TONE_CLASS[tone]
              const conv = conversion(j.applicants, j.views)
              return (
                <tr key={j.id} className="group hover:bg-hover">
                  <td className="py-3 pl-0 pr-4">
                    {/* the hue rail makes each row scannable at a glance */}
                    <div className="flex items-start gap-3">
                      <span className={cn('h-9 w-1 shrink-0 rounded-r', t.rail)} aria-hidden />
                      <span
                        className={cn('grid size-9 shrink-0 place-items-center rounded-lg', t.bg, t.text)}
                        aria-hidden
                      >
                        <Briefcase className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <Link
                          to={`/recruiter/jobs/${j.id}/applicants`}
                          className="font-medium text-ink hover:text-brand-700"
                        >
                          {j.title}
                        </Link>
                        <p className="text-xs text-ink-3">
                          {j.location} · {titleCase(j.workMode)} ·{' '}
                          {salaryLPA(j.salaryMin, j.salaryMax, j.salaryVisible)}
                        </p>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={j.status === 'published' ? 'success' : 'neutral'}>
                      {titleCase(j.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/recruiter/jobs/${j.id}/applicants`}
                      className="inline-flex items-center gap-1.5 font-mono tnum font-medium text-ink hover:text-brand-700"
                    >
                      {j.applicants}
                      <span className={cn('rounded-full px-1.5 text-[10px] font-semibold', t.bg, t.text)}>
                        +12 new
                      </span>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-right font-mono tnum text-ink-3 lg:table-cell">
                    {j.views}
                  </td>
                  <td className="hidden w-40 px-4 py-3 lg:table-cell">
                    {/* how well the posting converts views into applicants */}
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-subtle">
                        <span
                          className={cn('block h-full rounded-full', t.fill)}
                          style={{ width: `${Math.min(100, conv * 10)}%` }}
                        />
                      </span>
                      <span className="w-9 shrink-0 text-right font-mono tnum text-[11px] text-ink-3">
                        {conv}%
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-right text-xs text-ink-3 lg:table-cell">
                    {relativeTime(j.postedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RowActions job={j} closeJob={closeJob} duplicateJob={duplicateJob} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ══════════════════ B · full console table ══════════════════ */

function ListB({ jobs, counts: COUNTS, closeJob, duplicateJob }: JobListData) {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
        <h1 className="text-base font-semibold text-ink">Jobs</h1>
        <div className="flex items-center gap-2">
          <p className="font-mono text-xs text-ink-3">
            {COUNTS.published} published / {COUNTS.draft} draft / {COUNTS.closed} closed
          </p>
          <Button size="xs" asChild>
            <Link to="/recruiter/jobs/new">New job</Link>
          </Button>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-ink-3">
            <th scope="col" className="py-1.5 font-medium">Title</th>
            <th scope="col" className="py-1.5 font-medium">Location</th>
            <th scope="col" className="py-1.5 font-medium">Mode</th>
            <th scope="col" className="py-1.5 text-right font-medium">Appl.</th>
            <th scope="col" className="py-1.5 text-right font-medium">Views</th>
            <th scope="col" className="py-1.5 text-right font-medium">Posted</th>
            <th scope="col" className="py-1.5 text-right font-medium">Closes</th>
            <th scope="col" className="py-1.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {jobs.map((j) => (
            <tr key={j.id} className="hover:bg-hover">
              <td className="py-1.5">
                <Link
                  to={`/recruiter/jobs/${j.id}/applicants`}
                  className="font-medium text-ink hover:text-brand-700"
                >
                  {j.title}
                </Link>
              </td>
              <td className="py-1.5 text-ink-2">{j.location}</td>
              <td className="py-1.5 text-ink-3">{titleCase(j.workMode)}</td>
              <td className="py-1.5 text-right font-mono tnum">{j.applicants}</td>
              <td className="py-1.5 text-right font-mono tnum text-ink-3">{j.views}</td>
              <td className="py-1.5 text-right font-mono text-xs text-ink-3">
                {relativeTime(j.postedAt)}
              </td>
              <td className="py-1.5 text-right font-mono text-xs text-ink-3">
                {shortDate(j.deadline)}
              </td>
              <td className="py-1.5 text-right">
                <RowActions job={j} closeJob={closeJob} duplicateJob={duplicateJob} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="flex items-center gap-2 py-3 text-xs text-ink-3">
        <Kbd>J</Kbd>
        <Kbd>K</Kbd> move · <Kbd>E</Kbd> edit · <Kbd>↵</Kbd> open applicants
      </p>
    </div>
  )
}

/* ══════════════════ C · kanban by status ══════════════════ */

function ListC({ jobs, closeJob, duplicateJob }: JobListData) {
  const columns = [
    { key: 'published', label: 'Published', items: jobs.filter((job) => job.status === 'published') },
    { key: 'draft', label: 'Drafts', items: jobs.filter((job) => job.status === 'draft') },
    { key: 'closed', label: 'Closed', items: jobs.filter((job) => job.status === 'closed') },
  ]

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">Your jobs</h1>
          <p className="mt-2 text-lg text-ink-2">Drag a card between columns to change its status.</p>
        </div>
        <Button size="lg" asChild>
          <Link to="/recruiter/jobs/new">
            <Plus className="size-4" />
            Create a job
          </Link>
        </Button>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {columns.map((col) => (
          <section key={col.key}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-ink">{col.label}</h2>
              <span className="font-mono tnum text-sm text-ink-3">{col.items.length}</span>
            </div>
            <div className="space-y-4">
              {col.items.map((j) => (
                <article key={j.id} className="rounded-v bg-paper p-6 shadow-lg">
                  <div className="flex items-start justify-between gap-3">
                    <CompanyMark company={companyById(j.companyId) || companies[0]} size={36} />
                    <RowActions job={j} closeJob={closeJob} duplicateJob={duplicateJob} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold leading-tight text-ink">
                    <Link to={`/recruiter/jobs/${j.id}/applicants`}>{j.title}</Link>
                  </h3>
                  <p className="mt-1 text-sm text-ink-2">
                    {j.location} · {titleCase(j.workMode)}
                  </p>

                  <div className="mt-4">
                    <p className="text-xs text-ink-3">Applicants over time</p>
                    <Sparkline values={SPARK} />
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                    <span className="inline-flex items-center gap-1.5 text-sm text-ink-2">
                      <Users className="size-4" aria-hidden />
                      <span className="font-mono tnum font-semibold text-ink">{j.applicants}</span>
                    </span>
                    <span className="text-xs text-ink-3">{relativeTime(j.postedAt)}</span>
                  </div>
                </article>
              ))}
              {col.items.length === 0 && (
                <div className="rounded-v border border-dashed border-line py-10 text-center text-sm text-ink-3">
                  Nothing here
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
