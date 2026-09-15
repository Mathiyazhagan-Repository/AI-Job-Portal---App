import * as React from 'react'
import { Link } from 'react-router'
import {
  Upload, Star, Trash2, Download, PencilLine, AlertTriangle, Loader2,
  Check, FileText, Eye, CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { resumes as seed, type Resume, type ParseStatus } from '@/data/console'
import { relativeTime, shortDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/controls'
import { Sheet, SheetContent, SheetTrigger, Tooltip } from '@/components/ui/overlay'
import { PageHeader, EmptyState, DataTable, type Column } from '@/components/common'
import { Stagger, StaggerItem, Reveal } from '@/components/motion'
import { AIProvenanceChip } from '@/components/brand'
import { StatCard, RadialGauge, type Tone } from '@/components/common'
import { AtsPanel } from './AtsPanel'
import { MAX_RESUMES, useProfileStore, parseFor } from '@/store/profile'
import { atsReports } from '@/data/console'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/controls'
import { Gauge, Sparkles } from 'lucide-react'

/** C4 — Resume manager (PRD Part 14). */

const STATUS: Record<ParseStatus, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral'; icon: React.ElementType }> = {
  parsed: { label: 'Parsed', tone: 'success', icon: Check },
  processing: { label: 'Reading…', tone: 'neutral', icon: Loader2 },
  failed: { label: 'Could not read', tone: 'danger', icon: AlertTriangle },
}

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED = /\.(pdf|docx?)$/i

interface Upload {
  fileName: string
  stage: 'uploading' | 'reading' | 'done'
  pct: number
  read: number
  total: number
  /** Fields the parser read out of the file. */
  applied: string[]
  /** Of those, the ones that differ from what is on the profile today. */
  changes: string[]
  missing: string[]
  resumeId: string
}

function useResumes() {
  const [preview, setPreview] = React.useState<Resume | null>(null)
  const [tab, setTab] = React.useState<'files' | 'ats'>('files')
  const [atsFor, setAtsFor] = React.useState<string>('r1')
  const [uploading, setUploading] = React.useState<Upload | null>(null)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const profile = useProfileStore()
  const list = profile.resumes
  const timers = React.useRef<number[]>([])

  React.useEffect(
    () => () => { timers.current.forEach(clearTimeout) },
    [],
  )

  /**
   * Take a real file and walk it through upload → parse → ready.
   *
   * The parse is simulated (there is no backend here), but the file itself
   * is genuinely read and validated, so the size and format failures a
   * candidate actually hits are the ones this surface shows.
   */
  const upload = (file: File) => {
    setUploadError(null)
    if (list.length >= MAX_RESUMES) {
      setUploadError(`You can upload up to ${MAX_RESUMES} resumes. Delete one before adding another.`)
      return
    }
    if (!ACCEPTED.test(file.name)) {
      setUploadError('That format is not supported. Upload a PDF, DOC or DOCX.')
      return
    }
    if (file.size > MAX_BYTES) {
      setUploadError(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 5 MB.`)
      return
    }

    timers.current.forEach(clearTimeout)
    timers.current = []

    // a newly uploaded file parses like the primary fixture, which is the
    // complete one — the partial and failing parses stay reachable through
    // the existing r2/r3/r4 files
    const parseId = 'r1'
    const uploadId = `up-${Date.now()}`
    const total = 12
    setUploading({
      fileName: file.name, stage: 'uploading', pct: 0, read: 0, total,
      applied: [], changes: [], missing: [], resumeId: uploadId,
    })

    const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms))

    at(420, () => setUploading((u) => (u ? { ...u, stage: 'reading', pct: 18 } : u)))
    for (let i = 1; i <= total; i++) {
      at(420 + i * 130, () =>
        setUploading((u) => (u ? { ...u, read: i, pct: 18 + (i / total) * 78 } : u)))
    }
    at(420 + total * 130 + 260, () => {
      const parse = parseFor(parseId, [])
      const changes = profile.previewResume(parseId)
      setUploading((u) =>
        u
          ? {
              ...u,
              stage: 'done',
              pct: 100,
              applied: Object.keys(parse?.fields ?? {}).filter((key) => key !== 'email'),
              changes: changes.map((d) => d.label),
              missing: parse?.missing ?? [],
            }
          : u)
      // the file joins the list as soon as it is parsed, whether or not the
      // candidate chooses to fill their profile from it
      profile.addResume({
        // the uploaded file borrows the fixture parse, but keeps its own id so
        // it is a distinct entry the candidate can make primary or delete
        id: uploadId,
        label: file.name.replace(/\.[^.]+$/, '').slice(0, 40),
        fileName: file.name,
        sizeKb: Math.round(file.size / 1024),
        status: 'parsed',
        isPrimary: false,
        uploadedAt: new Date().toISOString(),
        fieldsRead: total,
        fieldsTotal: total,
        parseId,
      })
    })
  }

  const applyUpload = () => {
    if (!uploading) return
    profile.fillFromResume(uploading.resumeId, uploading.fileName)
    setUploading(null)
  }
  const dismissUpload = () => setUploading(null)

  /** Fill the profile from a resume already in the list. */
  const fillFrom = (r: Resume) => profile.fillFromResume(r.id, r.label)

  const makePrimary = (id: string) =>
    profile.setResumes(list.map((r) => ({ ...r, isPrimary: r.id === id })))
  const remove = (id: string) => profile.setResumes(list.filter((r) => r.id !== id))

  const openAts = (id: string) => {
    setAtsFor(id)
    setTab('ats')
  }

  const scored = list.filter((r) => atsReports[r.id])
  const best = scored.reduce(
    (top, r) => (atsReports[r.id].overall > (atsReports[top?.id ?? '']?.overall ?? -1) ? r : top),
    scored[0],
  )

  return {
    list, makePrimary, remove, preview, setPreview, tab, setTab, atsFor, setAtsFor,
    openAts, scored, best, upload, uploading, uploadError, applyUpload, dismissUpload,
    fillFrom, filledFrom: profile.filledFrom,
  }
}

type R = ReturnType<typeof useResumes>

export function Component() {
  const variant = useVariant()
  const r = useResumes()
  const Views = { a: ResumesA, b: ResumesB, c: ResumesC }
  const View = Views[variant] ?? ResumesA
  return (
    <>
      <View r={r} />
      <PreviewSheet r={r} />
    </>
  )
}
Component.displayName = 'ResumesPage'

/* ══════════════════ shared ══════════════════ */

function StatusPill({ status }: { status: ParseStatus }) {
  const s = STATUS[status]
  const Icon = s.icon
  return (
    <Badge tone={s.tone} size="sm">
      <Icon className={cn('size-3', status === 'processing' && 'animate-spin')} aria-hidden />
      {s.label}
    </Badge>
  )
}

/**
 * The upload surface. A real `<input type="file">` sits behind it so drag,
 * click and keyboard all reach the same handler — a div that only listens
 * for drop leaves keyboard users with no way to upload at all.
 */
function Dropzone({ large, r }: { large?: boolean; r: R }) {
  const [over, setOver] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const take = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    r.upload(file)
  }

  if (r.uploading) return <UploadProgress r={r} large={large} />

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        take(e.dataTransfer.files)
      }}
      className={cn(
        'rounded-v border-2 border-dashed text-center transition-v',
        large ? 'p-10' : 'p-6',
        over
          ? 'border-tone-indigo bg-[var(--color-tone-indigo-bg)]'
          : 'border-line bg-canvas',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="sr-only"
        onChange={(e) => {
          take(e.target.files)
          // reset so choosing the same file twice still fires a change
          e.target.value = ''
        }}
      />
      <span
        className={cn(
          'mx-auto grid place-items-center rounded-v-control bg-[var(--color-tone-indigo-bg)] text-tone-indigo',
          large ? 'size-14' : 'size-11',
        )}
        aria-hidden
      >
        <Upload className={large ? 'size-7' : 'size-5'} />
      </span>
      <p className={cn('mt-3 font-medium text-ink', large && 'text-lg')}>
        Drop a resume, or choose a file
      </p>
      <p className="mt-1 text-xs text-ink-3">PDF, DOC or DOCX · up to 5 MB · {r.list.length}/{MAX_RESUMES} resumes</p>
      {r.uploadError && (
        <p role="alert" className="mt-2 text-xs font-medium text-danger">
          {r.uploadError}
        </p>
      )}
      <Button
        size={large ? 'md' : 'sm'}
        variant="secondary"
        className="mt-4"
        disabled={r.list.length >= MAX_RESUMES}
        onClick={() => inputRef.current?.click()}
      >
        {r.list.length >= MAX_RESUMES ? 'Resume limit reached' : 'Choose file'}
      </Button>
      <p className="mx-auto mt-4 max-w-sm text-[11px] leading-relaxed text-ink-3">
        We read it into a structured profile and show you every field before it is saved. The file
        itself is private — recruiters only ever see the version you attach to an application.
      </p>
    </div>
  )
}

/** What the upload looks like while the parser is working. */
function UploadProgress({ r, large }: { r: R; large?: boolean }) {
  const u = r.uploading!
  return (
    <div
      className={cn(
        'rounded-v border border-line bg-paper shadow-v-card',
        large ? 'p-8' : 'p-5',
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-v-control bg-[var(--color-tone-indigo-bg)] text-tone-indigo"
          aria-hidden
        >
          {u.stage === 'done' ? <CheckCircle2 className="size-5" /> : <Loader2 className="size-5 animate-spin" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{u.fileName}</p>
          <p className="text-xs text-ink-3">
            {u.stage === 'uploading'
              ? 'Uploading…'
              : u.stage === 'reading'
                ? `Reading the document — ${u.read} of ${u.total} fields`
                : `Read ${u.read} of ${u.total} fields`}
          </p>
        </div>
        <span className="shrink-0 font-mono tnum text-sm font-semibold text-ink">
          {Math.round(u.pct)}%
        </span>
      </div>

      <Progress value={u.pct} className="mt-3" />

      {u.stage === 'done' && (
        <div className="mt-4 rounded-v-control bg-[var(--color-tone-emerald-bg)] p-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-tone-emerald">
            <Sparkles className="size-4" aria-hidden />
            Read {u.applied.length} fields from {u.fileName}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-2">
            {u.changes.length > 0
              ? `${u.changes.length} of them differ from what is on your profile today: ${u.changes.join(', ')}.`
              : 'Every one already matches your profile, so filling changes nothing — your profile is up to date with this file.'}
            {' '}Nothing is written until you say so, and you can still edit every field afterwards.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={r.applyUpload}>
              <Check className="size-4" />
              {u.changes.length > 0 ? `Fill ${u.changes.length} fields` : 'Mark my profile up to date'}
            </Button>
            <Button size="sm" variant="secondary" asChild>
              <Link to="/candidate/profile">Review field by field</Link>
            </Button>
            <Button size="sm" variant="ghost" onClick={r.dismissUpload}>
              Not now
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Fill the profile from one stored resume.
 *
 * A file the parser could not read has no fields to give, so it says that
 * instead of offering an action that would do nothing.
 */
function FillProfileAction({ res, r }: { res: Resume; r: R }) {
  const [done, setDone] = React.useState(false)
  const parse = parseFor(res.id, r.list)
  const isSource = r.filledFrom?.resumeId === res.id

  if (!parse) {
    return (
      <p className="mt-2 text-[11px] leading-relaxed text-ink-3">
        This file could not be read, so it cannot fill your profile.
      </p>
    )
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => {
          r.fillFrom(res)
          setDone(true)
          window.setTimeout(() => setDone(false), 2600)
        }}
        className="flex w-full items-center gap-2 rounded-v-control bg-[var(--color-tone-emerald-bg)] px-3 py-2 text-left text-xs font-medium text-tone-emerald transition-v hover:brightness-95"
      >
        {done ? <Check className="size-4 shrink-0" aria-hidden /> : <Sparkles className="size-4 shrink-0" aria-hidden />}
        {done ? 'Profile filled from this resume' : 'Fill my profile from this resume'}
      </button>
      {isSource && !done && (
        <p className="mt-1.5 text-[11px] text-ink-3">
          Your profile was last filled from this file {relativeTime(r.filledFrom!.at)}.
        </p>
      )}
      {parse.missing.length > 0 && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-ink-3">
          Not in this file: {parse.missing.join(', ')} — you will still need to add {parse.missing.length === 1 ? 'that' : 'those'} yourself.
        </p>
      )}
    </div>
  )
}

/** The failure state is designed, not an error toast (PRD Part 63). */
function FailureNote({ resume }: { resume: Resume }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-v-control bg-warning-bg p-3">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
      <div className="min-w-0">
        <p className="text-sm font-medium text-warning">
          Read {resume.fieldsRead} of {resume.fieldsTotal} fields, then stopped
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-2">{resume.failureReason}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="xs" asChild>
            <Link to="/candidate/profile">
              <PencilLine className="size-3.5" />
              Fill the rest in myself
            </Link>
          </Button>
          <Button size="xs" variant="secondary">
            Try another file
          </Button>
        </div>
      </div>
    </div>
  )
}

function RowActions({ resume, r }: { resume: Resume; r: R }) {
  return (
    <div className="flex items-center gap-1">
      <Tooltip content="Preview and see what was read">
        <Button variant="ghost" size="icon-sm" onClick={() => r.setPreview(resume)} aria-label="Preview">
          <Eye className="size-4" />
        </Button>
      </Tooltip>
      <Tooltip content={resume.isPrimary ? 'This is your default resume' : 'Use as default'}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => r.makePrimary(resume.id)}
          aria-label="Make primary"
          aria-pressed={resume.isPrimary}
        >
          <Star className={cn('size-4', resume.isPrimary && 'fill-warning text-warning')} />
        </Button>
      </Tooltip>
      <Tooltip content="Download">
        <Button variant="ghost" size="icon-sm" aria-label="Download">
          <Download className="size-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Delete">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => r.remove(resume.id)}
          aria-label="Delete"
          disabled={resume.isPrimary}
        >
          <Trash2 className="size-4" />
        </Button>
      </Tooltip>
    </div>
  )
}

function PreviewSheet({ r }: { r: R }) {
  const resume = r.preview
  return (
    <Sheet open={Boolean(resume)} onOpenChange={(o) => !o && r.setPreview(null)}>
      <SheetContent width="md:w-[680px]" className="overflow-y-auto">
        {resume && (
          <div className="p-5">
            <h2 className="text-lg font-semibold text-ink">{resume.label}</h2>
            <p className="font-mono text-xs text-ink-3">
              {resume.fileName} · {resume.sizeKb} KB · uploaded {shortDate(resume.uploadedAt)}
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {/* the document */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
                  Document
                </p>
                <div className="aspect-[1/1.294] rounded-v border border-line bg-paper p-4">
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-2/5 rounded bg-ink/80" />
                    <div className="h-1.5 w-1/3 rounded bg-line-strong" />
                  </div>
                  {[3, 4, 2, 3].map((n, bi) => (
                    <div key={bi} className="mt-4 space-y-1">
                      <div className="h-1.5 w-16 rounded bg-brand-200" />
                      {Array.from({ length: n }).map((_, i) => (
                        <div
                          key={i}
                          className="h-1 rounded bg-line"
                          style={{ width: `${60 + ((i * 13) % 35)}%` }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* what was extracted from it */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">
                    What we read
                  </p>
                  <AIProvenanceChip what="read this document" />
                </div>
                <div className="space-y-1.5">
                  {[
                    ['Name', 'Aarav Sharma'],
                    ['Title', 'Senior Frontend Engineer'],
                    ['Location', 'Bengaluru, Karnataka'],
                    ['Experience', '5 years'],
                    ['Skills', 'React · TypeScript · Node.js'],
                    ['Education', 'B.Tech CS, NIT Trichy'],
                    ['Certifications', resume.status === 'failed' ? null : 'AWS SA — Associate'],
                    ['Projects', resume.status === 'parsed' && resume.fieldsRead === 12 ? '2 listed' : null],
                  ].map(([k, v], i) => {
                    const read = v != null && i < resume.fieldsRead
                    return (
                      <div
                        key={k}
                        className={cn(
                          'rounded-v-control border px-2.5 py-1.5',
                          read ? 'border-score-elite/25 bg-score-elite-bg/50' : 'border-dashed border-line',
                        )}
                      >
                        <p className="text-[11px] text-ink-3">{k}</p>
                        <p className={cn('text-sm', read ? 'font-medium text-ink' : 'text-ink-3')}>
                          {read ? v : 'not read'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {resume.status === 'failed' && <FailureNote resume={resume} />}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

/* ══════════════════ A · version cards + ATS ══════════════════ */

/** Score band, reused for the small ring on each resume card. */
function scoreTone(n: number): Tone {
  return n >= 80 ? 'emerald' : n >= 60 ? 'amber' : 'rose'
}

function ResumesA({ r }: { r: R }) {
  const [tab, setTab] = React.useState<'versions' | 'ats'>('versions')
  // the ATS tab reads whichever resume the person last opened; default to the
  // primary one, since that is the file that actually gets sent
  const [scored, setScored] = React.useState(
    () => r.list.find((x) => x.isPrimary)?.id ?? r.list[0]?.id ?? '',
  )
  const scoredResume = r.list.find((x) => x.id === scored) ?? r.list[0]

  const analysed = r.list.filter((x) => atsReports[x.id])
  const avg = analysed.length
    ? Math.round(analysed.reduce((n, x) => n + atsReports[x.id].overall, 0) / analysed.length)
    : 0
  const fixable = analysed.reduce(
    (n, x) => n + atsReports[x.id].checks.filter((c) => c.severity !== 'pass').length,
    0,
  )

  const openAts = (id: string) => {
    setScored(id)
    setTab('ats')
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
      <PageHeader
        icon={FileText}
        tone="indigo"
        title="Resumes"
        description="Upload a file, see how an applicant tracking system reads it, and fix what it cannot."
        actions={
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList>
              <TabsTrigger value="versions">
                <FileText className="size-4" /> Versions
              </TabsTrigger>
              <TabsTrigger value="ats">
                <Gauge className="size-4" /> ATS score
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      {/* score strip — visible on both tabs, so the number is never hidden */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          tone={scoreTone(avg)}
          icon={Gauge}
          label="Average ATS score"
          value={avg}
          progress={avg}
          caption={`${analysed.length} of ${r.list.length} files analysed`}
        />
        <StatCard
          tone="indigo"
          icon={FileText}
          label="Versions stored"
          value={r.list.length}
          caption="tailor one per role family"
        />
        <StatCard
          tone="amber"
          icon={Sparkles}
          label="Fixable issues"
          value={fixable}
          caption="each one costs you points"
        />
        <StatCard
          tone="emerald"
          icon={CheckCircle2}
          label="Parsed cleanly"
          value={r.list.filter((x) => x.status === 'parsed').length}
          caption="machine-readable text"
        />
      </div>

      {tab === 'versions' ? (
        <>
          <div className="mt-5">
            <Dropzone r={r} />
          </div>

          <Stagger className="mt-5 grid gap-4 sm:grid-cols-2" whenVisible={false}>
            {r.list.map((res) => {
              const report = atsReports[res.id]
              return (
                <StaggerItem key={res.id}>
                  <article
                    className={cn(
                      'relative h-full overflow-hidden rounded-v border-[length:var(--v-card-border)] bg-paper p-v-card shadow-v-card hover-lift',
                      res.isPrimary ? 'border-brand-500' : 'border-line',
                    )}
                  >
                    {res.isPrimary && (
                      <span className="absolute inset-x-0 top-0 h-1 bg-tone-indigo" aria-hidden />
                    )}
                    <div className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-v-control bg-[var(--color-tone-indigo-bg)] text-tone-indigo">
                        <FileText className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate font-semibold text-ink">{res.label}</h2>
                          {res.isPrimary && <Badge tone="brand" size="sm">default</Badge>}
                        </div>
                        <p className="truncate font-mono text-xs text-ink-3">{res.fileName}</p>
                      </div>
                      {report && (
                        <RadialGauge
                          value={report.overall}
                          tone={scoreTone(report.overall)}
                          size={56}
                          sublabel="ATS"
                        />
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusPill status={res.status} />
                      <span className="font-mono text-xs text-ink-3">
                        {res.fieldsRead}/{res.fieldsTotal} fields
                      </span>
                      <span className="text-xs text-ink-3">· {relativeTime(res.uploadedAt)}</span>
                    </div>

                    {res.status === 'processing' && (
                      <Progress value={(res.fieldsRead / res.fieldsTotal) * 100} className="mt-3" />
                    )}
                    {res.status === 'failed' && <FailureNote resume={res} />}

                    {report && (
                      <button
                        type="button"
                        onClick={() => openAts(res.id)}
                        className="mt-3 flex w-full items-center gap-2 rounded-v-control bg-[var(--color-tone-indigo-bg)] px-3 py-2 text-left text-xs font-medium text-tone-indigo transition-v hover:brightness-95"
                      >
                        <Gauge className="size-4 shrink-0" aria-hidden />
                        See the full ATS breakdown
                        <span className="ml-auto font-mono tnum font-semibold">
                          {report.overall}/100
                        </span>
                      </button>
                    )}

                    <FillProfileAction res={res} r={r} />

                    <div className="mt-3 border-t border-line pt-2">
                      <RowActions resume={res} r={r} />
                    </div>
                  </article>
                </StaggerItem>
              )
            })}
          </Stagger>
        </>
      ) : (
        <div className="mt-5">
          {/* which file are we scoring */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-3">
              Scoring
            </span>
            {r.list.map((res) => (
              <button
                key={res.id}
                type="button"
                onClick={() => setScored(res.id)}
                aria-pressed={res.id === scored}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-v',
                  res.id === scored
                    ? 'border-transparent bg-tone-indigo text-white'
                    : 'border-line bg-paper text-ink-2 hover:border-line-strong',
                )}
              >
                {res.label}
                {atsReports[res.id] && (
                  <span className="ml-1.5 font-mono tnum opacity-80">
                    {atsReports[res.id].overall}
                  </span>
                )}
              </button>
            ))}
          </div>

          {scoredResume && (
            <Reveal key={scoredResume.id}>
              <AtsPanel resumeId={scoredResume.id} resumeLabel={scoredResume.label} />
            </Reveal>
          )}
        </div>
      )}
    </div>
  )
}

/* ══════════════════ B · table ══════════════════ */

function ResumesB({ r }: { r: R }) {
  const columns: Column<Resume>[] = [
    {
      key: 'label', header: 'Label', primary: true, sortable: true, sortValue: (x) => x.label,
      cell: (x) => (
        <span className="flex items-center gap-2">
          <FileText className="size-4 shrink-0 text-ink-3" aria-hidden />
          <span className="font-medium text-ink">{x.label}</span>
          {x.isPrimary && <Badge tone="brand" size="sm">default</Badge>}
        </span>
      ),
    },
    { key: 'file', header: 'File', hideBelow: 'lg', cell: (x) => <span className="font-mono text-xs text-ink-3">{x.fileName}</span> },
    { key: 'status', header: 'Parse', cell: (x) => <StatusPill status={x.status} /> },
    {
      key: 'fields', header: 'Fields', align: 'right', sortable: true, sortValue: (x) => x.fieldsRead,
      cell: (x) => <span className="font-mono tnum text-xs">{x.fieldsRead}/{x.fieldsTotal}</span>,
    },
    { key: 'size', header: 'Size', align: 'right', hideBelow: 'md', cell: (x) => <span className="font-mono tnum text-xs text-ink-3">{x.sizeKb} KB</span> },
    {
      key: 'date', header: 'Uploaded', align: 'right', sortable: true, sortValue: (x) => x.uploadedAt,
      cell: (x) => <span className="font-mono text-xs text-ink-3">{relativeTime(x.uploadedAt)}</span>,
    },
    { key: 'actions', header: '', align: 'right', cell: (x) => <RowActions resume={x} r={r} /> },
  ]

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
        <div>
          <h1 className="text-base font-semibold text-ink">Resumes</h1>
          <p className="font-mono text-xs text-ink-3">
            {r.list.length} versions · {r.list.filter((x) => x.status === 'parsed').length} parsed
          </p>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button size="sm">
              <Upload className="size-4" />
              Upload
            </Button>
          </SheetTrigger>
          <SheetContent className="p-5">
            <h2 className="mb-4 font-semibold text-ink">Upload a resume</h2>
            <Dropzone r={r} />
          </SheetContent>
        </Sheet>
      </div>

      <DataTable
        rows={r.list}
        columns={columns}
        rowKey={(x) => x.id}
        searchable={(x) => `${x.label} ${x.fileName}`}
        searchPlaceholder="Search resumes…"
        empty={{ title: 'No resumes yet', description: 'Upload one to build your profile automatically.' }}
      />

      {r.list.some((x) => x.status === 'failed') && (
        <div className="mt-4">
          <FailureNote resume={r.list.find((x) => x.status === 'failed')!} />
        </div>
      )}
    </div>
  )
}

/* ══════════════════ C · document shelf ══════════════════ */

function ResumesC({ r }: { r: R }) {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
      <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">
        Your resumes
      </h1>
      <p className="mt-3 text-lg text-ink-2">
        Keep a tailored version for each kind of role. The starred one is used by default.
      </p>

      <Stagger className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {r.list.map((res, i) => (
          <StaggerItem key={res.id}>
            <article className="group">
              <button
                type="button"
                onClick={() => r.setPreview(res)}
                className="block w-full"
                aria-label={`Preview ${res.label}`}
              >
                <div
                  className={cn(
                    'aspect-[1/1.294] rounded-v bg-paper p-5 shadow-v-card transition-v',
                    'group-hover:-translate-y-2 group-hover:shadow-xl',
                    res.status === 'failed' && 'opacity-60 grayscale',
                  )}
                  style={{ transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 1.2}deg)` }}
                >
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-2/5 rounded bg-ink/80" />
                    <div className="h-1.5 w-1/3 rounded bg-line-strong" />
                  </div>
                  {[3, 4, 3].map((n, bi) => (
                    <div key={bi} className="mt-4 space-y-1">
                      <div className="h-1.5 w-14 rounded bg-brand-200" />
                      {Array.from({ length: n }).map((_, k) => (
                        <div
                          key={k}
                          className="h-1 rounded bg-line"
                          style={{ width: `${60 + ((k * 17) % 35)}%` }}
                        />
                      ))}
                    </div>
                  ))}
                  {res.isPrimary && (
                    <span className="absolute -right-2 -top-2 grid size-8 place-items-center rounded-full bg-warning text-white shadow-md">
                      <Star className="size-4 fill-current" aria-hidden />
                    </span>
                  )}
                </div>
              </button>

              <div className="mt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-ink">{res.label}</h2>
                  {res.isPrimary && <Badge tone="brand" size="sm">default</Badge>}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <StatusPill status={res.status} />
                  <span className="text-xs text-ink-3">{relativeTime(res.uploadedAt)}</span>
                </div>
                <div className="mt-2">
                  <RowActions resume={res} r={r} />
                </div>
              </div>
            </article>
          </StaggerItem>
        ))}

        <StaggerItem>
          <div className="flex aspect-[1/1.294] items-center justify-center">
            <Dropzone r={r} />
          </div>
        </StaggerItem>
      </Stagger>
    </div>
  )
}
