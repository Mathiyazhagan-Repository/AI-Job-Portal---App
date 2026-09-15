import * as React from 'react'
import { FileText, Check, AlertTriangle, RefreshCw, PencilLine } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AIProvenanceChip } from './AIProvenanceChip'
import { m, useTempo } from '@/components/motion'
import type { Variant } from '@/hooks'
import { supabase } from '@/lib/supabase'

/**
 * ⭐ DESIGN.md §7.3 — Resume Parse Theatre
 *
 * The PRD makes resume parsing a background job, which normally means a
 * spinner. We make it the product's trust moment instead: values are seen
 * leaving the document and landing in the profile fields, so the candidate
 * watches exactly what was read about them.
 *
 * The failure path is designed too (PRD Part 63): the document greys out
 * and a manual-entry route opens rather than dead-ending.
 *
 * Per direction:
 *   A — the full theatre, side by side
 *   B — a progress list of extracted fields, no flight animation
 *   C — full-screen and cinematic, larger type, slower cadence
 */

export interface ParsedField {
  key: string
  label: string
  value: string
  /** Where the value sits on the ghost document, as a percentage. */
  from: { top: number; left: number }
}

export const DEMO_FIELDS: ParsedField[] = [
  { key: 'name', label: 'Full name', value: 'Aarav Sharma', from: { top: 8, left: 12 } },
  { key: 'title', label: 'Current title', value: 'Senior Frontend Engineer', from: { top: 14, left: 12 } },
  { key: 'location', label: 'Location', value: 'Bengaluru, Karnataka', from: { top: 20, left: 12 } },
  { key: 'experience', label: 'Total experience', value: '5 years', from: { top: 34, left: 14 } },
  { key: 'skills', label: 'Skills', value: 'React · TypeScript · Node.js · Tailwind · PostgreSQL', from: { top: 52, left: 14 } },
  { key: 'education', label: 'Education', value: 'B.Tech Computer Science, NIT Trichy', from: { top: 70, left: 14 } },
  { key: 'certifications', label: 'Certifications', value: 'AWS Solutions Architect — Associate', from: { top: 82, left: 14 } },
]

function buildParsedFields(parsed: Record<string, any>): ParsedField[] {
  const personal = parsed.personal_info ?? {}
  const summary = typeof parsed.summary === 'string' ? parsed.summary : ''
  const skills = Array.isArray(parsed.skills) ? parsed.skills : []
  const education = Array.isArray(parsed.education) ? parsed.education : []
  const experience = Array.isArray(parsed.experience) ? parsed.experience : []
  const certifications = Array.isArray(parsed.certifications) ? parsed.certifications : []
  const currentTitle = typeof parsed.current_title === 'string' ? parsed.current_title.trim() : ''
  const totalYears = typeof parsed.total_experience_years === 'number' ? parsed.total_experience_years : null
  const firstExperienceTitle = experience.length ? (typeof experience[0]?.job_title === 'string' ? experience[0].job_title.trim() : '') : ''

  const cleanValue = (value?: string | null, fallback = 'Not extracted') => {
    const text = typeof value === 'string' ? value.trim() : ''
    return text || fallback
  }

  const educationLabel = education.length
    ? education
        .map((item) => [item?.degree, item?.institution].filter(Boolean).join(' @ '))
        .filter(Boolean)
        .slice(0, 2)
        .join(' · ')
    : 'Not extracted'

  const expLabel = experience.length
    ? experience
        .map((item) => [item?.job_title, item?.company].filter(Boolean).join(' · '))
        .filter(Boolean)
        .slice(0, 2)
        .join(' · ')
    : 'Not extracted'

  const certLabel = certifications.length ? certifications.slice(0, 2).join(' · ') : 'Not extracted'
  const yearsLabel = totalYears !== null ? `${totalYears} years` : 'Not extracted'

  const titleValue = cleanValue(currentTitle || firstExperienceTitle)

  return [
    { key: 'name', label: 'Full name', value: cleanValue(personal.name), from: { top: 8, left: 12 } },
    { key: 'title', label: 'Current title', value: titleValue, from: { top: 14, left: 12 } },
    { key: 'location', label: 'Location', value: cleanValue(personal.location), from: { top: 20, left: 12 } },
    { key: 'experience', label: 'Total experience', value: yearsLabel, from: { top: 34, left: 14 } },
    { key: 'skills', label: 'Skills', value: skills.length ? skills.join(' · ') : 'Not extracted', from: { top: 52, left: 14 } },
    { key: 'education', label: 'Education', value: educationLabel, from: { top: 70, left: 14 } },
    { key: 'certifications', label: 'Certifications', value: certLabel, from: { top: 82, left: 14 } },
  ]
}

export type ParseState = 'idle' | 'reading' | 'done' | 'failed'

export function useParseTheatre(initialFields: ParsedField[] = [], stepMs = 620) {
  const [fields, setFields] = React.useState<ParsedField[]>(initialFields)
  const [state, setState] = React.useState<ParseState>('idle')
  const [landed, setLanded] = React.useState<string[]>([])
  const timers = React.useRef<number[]>([])

  const clear = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  const start = React.useCallback(
    (outcome: 'done' | 'failed' = 'done', nextFields: ParsedField[] = fields) => {
      clear()
      setLanded([])

      const activeFields = Array.isArray(nextFields) && nextFields.length ? nextFields : fields
      if (!activeFields.length) {
        setState(outcome)
        return
      }

      setState('reading')
      const stopAt = outcome === 'failed' ? Math.min(3, activeFields.length) : activeFields.length
      for (let i = 0; i < stopAt; i++) {
        timers.current.push(
          window.setTimeout(() => setLanded((l) => [...l, activeFields[i].key]), stepMs * (i + 1)),
        )
      }
      timers.current.push(
        window.setTimeout(() => setState(outcome), stepMs * (stopAt + 1)),
      )
    },
    [fields, stepMs],
  )

  React.useEffect(() => clear, [])

  return {
    state,
    landed,
    start,
    fields,
    setFields,
    reset: () => { clear(); setState('idle'); setLanded([]); setFields(initialFields) },
  }
}

export type Theatre = ReturnType<typeof useParseTheatre>

/* ══════════════════ the ghost document ══════════════════ */

function GhostDoc({
  theatre,
  className,
}: {
  theatre: Theatre
  className?: string
}) {
  const failed = theatre.state === 'failed'
  return (
    <div
      className={cn(
        'relative aspect-[1/1.294] w-full overflow-hidden rounded-v border border-line bg-paper p-5 shadow-v-card transition-v',
        failed && 'opacity-40 grayscale',
        className,
      )}
      aria-hidden
    >
      {/* a suggestion of a resume — never real text, so it can't be misread */}
      <div className="space-y-1.5">
        <div className="h-3 w-2/5 rounded bg-ink/80" />
        <div className="h-2 w-1/3 rounded bg-line-strong" />
        <div className="h-2 w-1/4 rounded bg-line-strong" />
      </div>
      {[
        { w: ['90%', '78%', '84%'], top: 'mt-6' },
        { w: ['70%', '92%', '61%', '88%'], top: 'mt-5' },
        { w: ['86%', '74%'], top: 'mt-5' },
        { w: ['80%', '66%', '90%'], top: 'mt-5' },
      ].map((block, bi) => (
        <div key={bi} className={cn('space-y-1.5', block.top)}>
          <div className="h-2 w-20 rounded bg-brand-200" />
          {block.w.map((w, i) => (
            <div key={i} className="h-1.5 rounded bg-line" style={{ width: w }} />
          ))}
        </div>
      ))}

      {/* the reading beam */}
      {theatre.state === 'reading' && (
        <m.div
          className="pointer-events-none absolute inset-x-0 h-16"
          style={{
            background:
              'linear-gradient(180deg, transparent, rgb(37 99 235 / 0.12), transparent)',
          }}
          initial={{ top: '-10%' }}
          animate={{ top: '100%' }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </div>
  )
}

/* ══════════════════ the landing field ══════════════════ */

function FieldRow({
  field,
  landed,
  reading,
  large,
}: {
  field: ParsedField
  landed: boolean
  reading: boolean
  large?: boolean
}) {
  const t = useTempo()
  return (
    <m.div
      layout
      className={cn(
        'flex items-start gap-3 rounded-v-control border px-3 transition-v',
        large ? 'py-3' : 'py-2',
        landed ? 'border-score-elite/25 bg-score-elite-bg/50' : 'border-dashed border-line bg-canvas',
      )}
    >
      <span
        className={cn(
          'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full transition-v',
          landed ? 'bg-score-elite text-white' : 'bg-subtle text-ink-3',
        )}
      >
        {landed ? (
          <Check className="size-3 stroke-[3]" aria-hidden />
        ) : (
          <span className="size-1.5 rounded-full bg-current" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('text-ink-3', large ? 'text-sm' : 'text-xs')}>{field.label}</p>
        {landed ? (
          <m.p
            initial={t.reduced ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: t.duration, ease: t.ease }}
            className={cn('font-medium text-ink', large ? 'text-lg' : 'text-sm')}
          >
            {field.value}
          </m.p>
        ) : (
          <p className={cn('text-ink-3', large ? 'text-base' : 'text-sm')}>
            {reading ? 'reading…' : 'not read yet'}
          </p>
        )}
      </div>
    </m.div>
  )
}

/* ══════════════════ ParseTheatre ══════════════════ */

export function ParseTheatre({
  theatre,
  variant = 'a',
  onAccept,
  onManual,
  className,
}: {
  theatre: Theatre
  variant?: Variant
  onAccept?: () => void
  onManual?: () => void
  className?: string
}) {
  const { state, landed, fields } = theatre
  const done = state === 'done'
  const failed = state === 'failed'
  const reading = state === 'reading'
  const large = variant === 'c'

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 className={cn('font-semibold text-ink', large ? 'text-2xl' : 'text-lg')}>
          {failed
            ? "We couldn't read that file"
            : done
              ? 'Here is what we read'
              : reading
                ? 'Reading your resume…'
                : 'Upload your resume'}
        </h2>
        <p className={cn('mt-1 text-ink-2', large ? 'text-base' : 'text-sm')}>
          {failed
            ? 'Nothing is lost — you can fill these in yourself and carry on.'
            : done
              ? 'Check each field before we build your profile. You can edit any of them.'
              : 'Everything extracted is shown to you before it becomes your profile.'}
        </p>
      </div>
      <AIProvenanceChip what="read this document" cannot="It only extracts what is written. It does not infer age, gender or any personal characteristic, and nothing is scored until you confirm." />
    </div>
  )

  /* ── B · progress list, no flight ── */
  if (variant === 'b') {
    return (
      <div className={cn('space-y-4', className)}>
        {header}
        <div className="rounded-v border border-line bg-paper p-4 shadow-v-card">
          <div className="mb-3 flex items-center justify-between font-mono text-xs text-ink-3">
            <span>resume.pdf · 214 KB</span>
            <span>
              {landed.length}/{fields.length} fields
            </span>
          </div>
          <div className="space-y-1.5">
            {fields.map((f) => (
              <FieldRow
                key={f.key}
                field={f}
                landed={landed.includes(f.key)}
                reading={reading}
              />
            ))}
          </div>
        </div>
        <Actions theatre={theatre} onAccept={onAccept} onManual={onManual} />
      </div>
    )
  }

  /* ── A and C · the theatre ── */
  return (
    <div className={cn('space-y-5', className)}>
      {header}

      <div className={cn('grid gap-6', large ? 'lg:grid-cols-[340px_1fr]' : 'lg:grid-cols-[260px_1fr]')}>
        <div>
          <GhostDoc theatre={theatre} />
          <p className="mt-2 text-center font-mono text-xs text-ink-3">resume.pdf · 214 KB</p>
        </div>

        <div className="min-w-0">
          {failed && (
            <div className="mb-3 flex items-start gap-2 rounded-v bg-warning-bg p-3 text-sm text-warning">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                We read the first few fields, then the file format defeated us. This happens with
                heavily designed CVs. Fill in the rest and nothing is lost.
              </span>
            </div>
          )}
          <div className={cn('space-y-2', large && 'space-y-3')}>
            {fields.map((f) => (
              <FieldRow
                key={f.key}
                field={f}
                landed={landed.includes(f.key)}
                reading={reading}
                large={large}
              />
            ))}
          </div>
        </div>
      </div>

      <Actions theatre={theatre} onAccept={onAccept} onManual={onManual} />
    </div>
  )
}

function Actions({
  theatre,
  onAccept,
  onManual,
}: {
  theatre: Theatre
  onAccept?: () => void
  onManual?: () => void
}) {
  const { state, start, setFields } = theatre
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const uploadResumeFile = async (file: File) => {
    try {
      const raw = localStorage.getItem('kairo.signup.basics')
      const saved = raw ? (JSON.parse(raw) as { email?: string }) : {}
      const email = saved.email?.trim()

      let candidateData: { id: string } | null = null
      if (email) {
        const { data, error: candidateError } = await supabase
          .from('Candidates')
          .select('id')
          .eq('email', email)
          .maybeSingle()

        if (candidateError && candidateError.code !== 'PGRST116') {
          throw candidateError
        }

        candidateData = data
      }

      const extension = file.name.split('.').pop()?.toLowerCase() || 'pdf'
      const safeEmail = email ? email.replace(/[^a-zA-Z0-9._@-]/g, '_') : 'resume-upload'
      const path = `${safeEmail}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`

      let storagePath: string | null = null
      try {
        const { error: uploadError } = await supabase.storage.from('resumes').upload(path, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'application/octet-stream',
        })

        if (!uploadError) {
          storagePath = path
        } else {
          console.warn('Resume storage upload skipped because the Supabase bucket is unavailable:', uploadError)
        }
      } catch (storageError) {
        console.warn('Resume storage upload skipped because the Supabase bucket is unavailable:', storageError)
      }

      const resumeType =
        file.type ||
        (extension === 'pdf'
          ? 'application/pdf'
          : extension === 'docx'
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : 'application/octet-stream')

      const { data: resumeRow, error: insertError } = await supabase.from('Resumes').insert([
        {
          candidate_id: candidateData?.id ?? null,
          file_name: file.name,
          file_type: resumeType,
          file_size: file.size,
          storage_path: storagePath,
          parse_status: 'parsing',
          parse_summary: {},
          uploaded_at: new Date().toISOString(),
        },
      ]).select('id').single()

      if (insertError) {
        throw insertError
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('http://localhost:8000/api/resume/parse', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.detail || 'Resume parsing failed.')
      }

      const parsed = await response.json()
      const parsedFields = buildParsedFields(parsed)
      setFields(parsedFields)

      const personal = parsed.personal_info ?? {}
      if (candidateData?.id || email || personal.email) {
        const authToken = localStorage.getItem('kairo.auth.token')
        const candidateUpdateResponse = await fetch('http://localhost:8000/api/candidate/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({
            authoritative_email: email || null,
            parsed_email: personal.email || null,
            full_name: personal.name || null,
            location: personal.location || null,
          }),
        })

        if (!candidateUpdateResponse.ok) {
          const detail = await candidateUpdateResponse.text()
          throw new Error(`Candidate update failed: ${detail}`)
        }
      }

      if (resumeRow?.id) {
        await supabase
          .from('Resumes')
          .update({
            parse_status: 'parsed',
            parse_summary: {
              name: personal.name ?? null,
              email: personal.email ?? null,
              phone: personal.phone ?? null,
              location: personal.location ?? null,
              linkedin: personal.linkedin ?? null,
              github: personal.github ?? null,
              portfolio: personal.portfolio ?? null,
              skills: Array.isArray(parsed.skills) ? parsed.skills : [],
              education: Array.isArray(parsed.education) ? parsed.education : [],
              experience: Array.isArray(parsed.experience) ? parsed.experience : [],
              summary: parsed.summary ?? null,
            },
          })
          .eq('id', resumeRow.id)
      }

      start('done', parsedFields)
    } catch (error) {
      console.error('Resume upload failed:', error)
      setFields([])
      theatre.start('failed', [])
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''
    await uploadResumeFile(file)
  }

  const triggerAnotherFile = () => {
    theatre.reset()
    requestAnimationFrame(() => fileInputRef.current?.click())
  }

  if (state === 'idle') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button onClick={() => fileInputRef.current?.click()}>
          <FileText className="size-4" />
          Upload and read my resume
        </Button>
      </div>
    )
  }

  if (state === 'reading') {
    return (
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileChange}
        />
        <p className="text-sm text-ink-3">
          This normally takes about four seconds. You can edit anything afterwards.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileChange}
      />
      {state === 'done' && (
        <Button onClick={onAccept}>
          <Check className="size-4" />
          Looks right — continue
        </Button>
      )}
      <Button variant="secondary" onClick={onManual}>
        <PencilLine className="size-4" />
        {state === 'failed' ? 'Fill it in myself' : 'Edit these fields'}
      </Button>
      <Button variant="ghost" onClick={triggerAnotherFile}>
        <RefreshCw className="size-4" />
        Try another file
      </Button>
    </div>
  )
}
