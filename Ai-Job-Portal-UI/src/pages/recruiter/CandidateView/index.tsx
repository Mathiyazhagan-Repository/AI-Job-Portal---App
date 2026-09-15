import * as React from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Mail, Bookmark, Briefcase, GraduationCap, MapPin, Award } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { applicants, jobs, jobById } from '@/data/mock'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/controls'
import { PageHeader } from '@/components/common'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { MatchPrism, SkillConstellation, AIProvenanceChip } from '@/components/brand'

/**
 * R11 — Candidate profile, viewed by a recruiter.
 *
 * Read-only, and scored against a job the recruiter picks — so the same
 * person can be compared against several open roles without leaving.
 */

export function Component() {
  const { id = 'a1' } = useParams()
  const variant = useVariant()
  const c = applicants.find((a) => a.id === id) ?? applicants[0]
  const [jobId, setJobId] = React.useState(c.jobId)
  const job = jobById(jobId)

  const jobSelector = (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-ink-3">Score against</span>
      <select
        value={jobId}
        onChange={(e) => setJobId(e.target.value)}
        className="h-9 rounded-v-control border border-line bg-paper px-2 text-sm font-medium text-ink outline-none focus:border-brand-500"
      >
        {jobs.map((j) => (
          <option key={j.id} value={j.id}>
            {j.title}
          </option>
        ))}
      </select>
    </label>
  )

  const actions = (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" asChild>
        <Link to={`/recruiter/jobs/${jobId}/applicants`}>Shortlist for this job</Link>
      </Button>
      <Button size="sm" variant="secondary" asChild>
        <Link to="/recruiter/messages">
          <Mail className="size-4" />
          Message
        </Link>
      </Button>
      <Button size="sm" variant="ghost">
        <Bookmark className="size-4" />
        Add to pool
      </Button>
    </div>
  )

  const facts = (
    <dl className="space-y-2.5 text-sm">
      {[
        [Briefcase, 'Experience', `${c.totalExperience} years`],
        [GraduationCap, 'Education', c.education],
        [MapPin, 'Location', c.locationNarrative.split('—')[0].trim()],
        [Award, 'Assessment', c.assessmentScore != null ? `${c.assessmentScore}%` : 'not taken'],
      ].map(([Icon, k, v]) => {
        const I = Icon as React.ElementType
        return (
          <div key={String(k)} className="flex items-start gap-2.5">
            <I className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
            <div className="min-w-0">
              <dt className="text-xs text-ink-3">{String(k)}</dt>
              <dd className="font-medium text-ink">{String(v)}</dd>
            </div>
          </div>
        )
      })}
    </dl>
  )

  const skills = (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">Skills against {job?.title}</h2>
        <AIProvenanceChip what="compared this profile to the job" />
      </div>
      {variant === 'b' ? (
        <SkillConstellation
          variant="b"
          matched={c.matchedSkills}
          missing={c.missingSkills}
          bonus={c.bonusSkills}
        />
      ) : (
        <div className="flex justify-center pb-6">
          <SkillConstellation
            variant={variant}
            matched={c.matchedSkills}
            missing={c.missingSkills}
            bonus={c.bonusSkills}
            size={240}
          />
        </div>
      )}
    </div>
  )

  const prism = (
    <MatchPrism
      score={c.score}
      breakdown={c.breakdown}
      matchedSkills={c.matchedSkills.map((s) => s.name)}
      missingSkills={c.missingSkills.map((s) => s.name)}
      meetsHardRequirements={c.meetsHardRequirements}
      layout={variant === 'c' ? 'ring' : 'panel'}
      size={variant === 'c' ? 'xl' : 'md'}
      defaultExpanded
    />
  )

  const back = (
    <Link
      to="/recruiter/candidates"
      className="inline-flex items-center gap-1 text-sm text-ink-3 hover:text-ink"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Back to search
    </Link>
  )

  /* ── C · dossier ── */
  if (variant === 'c') {
    return (
      <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
        {back}
        <Reveal whenVisible={false} className="mt-6 rounded-v bg-paper p-8 shadow-xl">
          <div className="flex flex-wrap items-start gap-5">
            <Avatar name={c.name} id={c.id} size="xl" />
            <div className="min-w-0 flex-1">
              <h1 className="font-display tracking-tight text-3xl font-semibold text-ink">
                {c.name}
              </h1>
              <p className="text-lg text-ink-2">{c.headline}</p>
              <div className="mt-4">{jobSelector}</div>
            </div>
          </div>
          <div className="mt-6 border-t border-line pt-6">{facts}</div>
          <div className="mt-6">{actions}</div>
        </Reveal>

        <Reveal className="mt-6 rounded-v bg-paper p-8 shadow-lg">
          <h2 className="font-display tracking-tight mb-6 text-2xl font-semibold text-ink">
            Fit for {job?.title}
          </h2>
          {prism}
        </Reveal>

        <Reveal className="mt-6 rounded-v bg-paper p-8 shadow-lg">{skills}</Reveal>
      </div>
    )
  }

  /* ── B · split structured / prism ── */
  if (variant === 'b') {
    return (
      <div className="mx-auto max-w-[1300px] px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
          <div className="flex items-center gap-3">
            {back}
            <span className="h-4 w-px bg-line" />
            <h1 className="text-base font-semibold text-ink">{c.name}</h1>
            <span className="text-sm text-ink-3">{c.headline}</span>
          </div>
          <div className="flex items-center gap-2">
            {jobSelector}
            {actions}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-v border border-line bg-paper p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-3">
              Structured profile
            </h2>
            {facts}
            <div className="mt-4 border-t border-line pt-4">{skills}</div>
          </div>
          <div className="rounded-v border border-line bg-paper p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-3">
              Match against {job?.title}
            </h2>
            {prism}
          </div>
        </div>
      </div>
    )
  }

  /* ── A · profile + prism ── */
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6">
      {back}
      <div className="mt-3 flex flex-wrap items-start gap-4">
        <Avatar name={c.name} id={c.id} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{c.name}</h1>
          <p className="text-ink-2">{c.headline}</p>
        </div>
        {jobSelector}
      </div>

      <div className="mt-4">{actions}</div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-v border border-line bg-paper p-v-card shadow-v-card">
          {facts}
        </aside>
        <div className="min-w-0 space-y-6">
          {prism}
          <div className="rounded-v border border-line bg-paper p-v-card shadow-v-card">
            {skills}
          </div>
        </div>
      </div>
    </div>
  )
}

Component.displayName = 'RecruiterCandidateView'
