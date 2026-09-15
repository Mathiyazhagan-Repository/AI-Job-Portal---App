import * as React from 'react'
import { type Job } from '@/data/mock'
import { useJobs } from '@/store/jobs'
import { useCompanies } from '@/store/companies'
import { MATCH_WEIGHTS, buildBreakdown, type MatchBreakdownItem } from '@/lib/scoring'
import { useProfileStore, type ProfileData } from '@/store/profile'

/**
 * Job recommendations, scored against the candidate's own profile.
 *
 * This is deliberately computed from the profile rather than read off a
 * fixture: filling the profile from a resume has to visibly improve what
 * gets recommended, otherwise the parse is theatre. Every component below
 * maps to one of the six weights in PRD Part 16.2, so the number a
 * candidate sees here decomposes exactly the way MatchPrism explains it.
 *
 * The model ranks. It never filters anything out — a low-scoring role still
 * appears in search, it just does not get recommended.
 */

export interface Recommendation {
  job: Job
  score: number
  breakdown: MatchBreakdownItem[]
  matchedSkills: string[]
  missingSkills: string[]
  meetsHardRequirements: boolean
  /** One sentence saying why this role surfaced, in plain language. */
  reason: string
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#.]/g, '')

/** Skill names differ by punctuation more often than by meaning. */
function skillsOverlap(required: string[], have: string[]) {
  const mine = new Set(have.map(norm))
  const matched = required.filter((r) => {
    const n = norm(r)
    if (mine.has(n)) return true
    // "CSS / Tailwind" on a profile should satisfy a "Tailwind" requirement
    return [...mine].some((m) => m.includes(n) || n.includes(m))
  })
  return { matched, missing: required.filter((r) => !matched.includes(r)) }
}

/** City, ignoring the state suffix a profile usually carries. */
function cityOf(location?: string | null) {
  if (!location) return ''
  return norm(location.split(',')[0] ?? location)
}

function scoreJob(job: Job, p: ProfileData) {
  const required = job.requiredSkills ?? []
  const preferred = job.preferredSkills ?? []
  const { matched, missing } = skillsOverlap(required, p.skills)
  const pref = skillsOverlap(preferred, p.skills)

  // skills — 35%, the heaviest component
  const skills = required.length
    ? Math.round(
        ((matched.length + pref.matched.length * 0.4) /
          (required.length + preferred.length * 0.4)) * 100,
      )
    : 60

  // experience — 20%. Inside the band scores full; outside decays by distance.
  const yrs = p.totalExperience
  const experience =
    yrs >= job.experienceMin && yrs <= job.experienceMax
      ? 100
      : Math.max(20, 100 - Math.abs(yrs - (yrs < job.experienceMin ? job.experienceMin : job.experienceMax)) * 18)

  // location — 15%. Remote is location-independent by definition.
  const jCity = cityOf(job.location)
  const pCity = cityOf(p.location)
  const location =
    job.workMode === 'remote'
      ? 100
      : (jCity && jCity === pCity)
        ? 100
        : job.workMode === 'hybrid'
          ? 35
          : 25

  // education — 10%. Any completed degree clears the usual bar.
  const education = p.education.length > 0 ? 92 : 45

  // job-title relevance — 10%
  const title = (() => {
    const a = new Set(norm(p.headline).split(/(?=[a-z])/).length ? p.headline.toLowerCase().split(/\s+/) : [])
    const b = job.title.toLowerCase().split(/\s+/)
    const hits = b.filter((w) => w.length > 3 && a.has(w)).length
    return Math.min(100, 45 + hits * 22)
  })()

  // preferences — 10%. Nothing declared, so this stays neutral rather than
  // penalising a candidate for information we never asked for.
  const preferences = 75

  const parts: Record<string, number> = { skills, experience, location, education, title, preferences }
  const breakdown = buildBreakdown(parts)
  const score = Math.round(
    MATCH_WEIGHTS.reduce((sum, w) => sum + (parts[w.key] ?? 0) * (w.weight / 100), 0),
  )

  // hard requirements: more than half the required skills missing blocks it
  const meetsHardRequirements = required.length === 0 || matched.length >= Math.ceil(required.length / 2)

  return { score, breakdown, matched, missing, meetsHardRequirements, skills, location, experience }
}

/** Plain-language reason, built from whichever component actually carried it. */
function reasonFor(
  job: Job,
  s: ReturnType<typeof scoreJob>,
  p: ProfileData,
  companyById: (id: string) => any,
): string {
  const company = companyById(job.companyId)
  const bits: string[] = []

  if (s.matched.length) {
    const shown = s.matched.slice(0, 3).join(', ')
    bits.push(
      `you have ${s.matched.length} of the ${job.requiredSkills.length} required skills — ${shown}`,
    )
  }
  if (job.workMode === 'remote') bits.push('it is fully remote')
  else if (s.location === 100 && job.location) bits.push(`it is in ${job.location.split(',')[0]}, where you are`)

  if (s.experience === 100) {
    bits.push(`your ${p.totalExperience} years sit inside their ${job.experienceMin}–${job.experienceMax} year band`)
  }

  if (bits.length === 0) return job.recommendationReason ?? `Open role at ${company?.name ?? 'this company'}.`

  const sentence = bits.length === 1
    ? bits[0]
    : `${bits.slice(0, -1).join(', ')} and ${bits[bits.length - 1]}`
  return `Recommended because ${sentence}.`
}

export function useRecommendations(limit = 4) {
  const { data, filledFrom } = useProfileStore()
  const { jobs, isLoading } = useJobs()
  const { companyById } = useCompanies()

  return React.useMemo(() => {
    const scored: Recommendation[] = jobs
      .filter((j) => j.status === 'published')
      .map((job) => {
        const s = scoreJob(job, data)
        return {
          job,
          score: s.score,
          breakdown: s.breakdown,
          matchedSkills: s.matched,
          missingSkills: s.missing,
          meetsHardRequirements: s.meetsHardRequirements,
          reason: reasonFor(job, s, data, companyById),
        }
      })
      .sort((a, b) => {
        if (a.meetsHardRequirements !== b.meetsHardRequirements) {
          return a.meetsHardRequirements ? -1 : 1
        }
        return b.score - a.score
      })

    return {
      all: scored,
      /** Only the roles the candidate actually qualifies for. */
      qualified: scored.filter((r) => r.meetsHardRequirements),
      top: scored.filter((r) => r.meetsHardRequirements).slice(0, limit),
      /** How many skills the profile brings to the table at all. */
      skillCount: data.skills.length,
      filledFrom,
      isLoading,
    }
  }, [data, filledFrom, limit, jobs, isLoading, companyById])
}

export type RecommendationsResult = ReturnType<typeof useRecommendations>
