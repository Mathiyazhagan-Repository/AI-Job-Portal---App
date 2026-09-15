import * as React from 'react'
import { candidate } from '@/data/mock'
import { resumes as resumeSeed, type Resume } from '@/data/console'
import { useAuth } from '@/store/auth'

/**
 * The candidate profile, held in one place.
 *
 * Two surfaces write to it — the resume upload on C8 and the inline editor
 * on C3 — so it cannot live inside either page's component. It persists to
 * localStorage because the PRD's promise is that a parsed resume fills the
 * profile *and is still there when you sign back in*; without persistence
 * "fill from my latest resume" would silently undo itself on reload.
 */

export interface ExperienceEntry {
  id: string
  company: string
  title: string
  from: string
  to: string
  current: boolean
  detail: string
}

export interface EducationEntry {
  id: string
  institution: string
  degree: string
  field: string
  from: string
  to: string
  grade: string
}

export interface ProfileData {
  name: string
  headline: string
  location: string
  email: string
  phone: string
  summary: string
  totalExperience: number
  skills: string[]
  experience: ExperienceEntry[]
  education: EducationEntry[]
  certifications: string[]
  languages: string[]
}

/** Where a given section's current content came from. */
export type FieldSource = 'you' | 'resume'

export interface ProfileState {
  data: ProfileData
  /** Every resume the candidate has uploaded, newest first.
   *  This lives here rather than on C4 because C3 needs it too — "fill from
   *  your latest resume" has to see a file uploaded a moment ago. */
  resumes: Resume[]
  /** Per-section provenance, so the UI can say "read from your resume". */
  source: Partial<Record<keyof ProfileData, FieldSource>>
  /** Which resume last filled the profile, and when. */
  filledFrom: { resumeId: string; label: string; at: string } | null
}

export const MAX_RESUMES = 6

const SEED: ProfileData = {
  name: candidate.name,
  headline: candidate.headline,
  location: candidate.location,
  email: candidate.email,
  phone: '+91 9845 012 337',
  summary:
    'Frontend engineer with five years building data-heavy React interfaces. I care about interfaces that stay fast with real data volume, and about design systems that other engineers actually want to use.',
  totalExperience: candidate.totalExperience,
  skills: candidate.skills.map((s) => s.name),
  experience: [
    {
      id: 'x1', company: 'Zenith Systems', title: 'Senior Frontend Engineer',
      from: 'Mar 2023', to: 'Present', current: true,
      detail: 'Own the design system and the analytics surface used by 12k weekly users. Cut first-contentful-paint by 44%.',
    },
    {
      id: 'x2', company: 'Loop Health', title: 'Frontend Engineer',
      from: 'Jul 2021', to: 'Feb 2023', current: false,
      detail: 'Built the patient-intake flow in React and TypeScript. Introduced Testing Library across the front end.',
    },
  ],
  education: [
    {
      id: 'e1', institution: 'NIT Trichy', degree: 'B.Tech', field: 'Computer Science',
      from: '2017', to: '2021', grade: '8.6 CGPA',
    },
  ],
  certifications: [],
  languages: ['English — fluent', 'Hindi — native', 'Kannada — conversational'],
}

/* ══════════════════ what a parsed resume yields ══════════════════ */

/**
 * A parse result. In a real build this is what the resume service returns;
 * here each fixture resume carries its own so that filling from "General —
 * frontend" and from "Tailored — design systems" visibly differ.
 */
export interface ResumeParse {
  fields: Partial<ProfileData>
  /** Fields the parser could not read from this file. */
  missing: string[]
}

export const RESUME_PARSES: Record<string, ResumeParse> = {
  r1: {
    missing: ['certifications'],
    fields: {
      name: 'Aarav Sharma',
      headline: 'Senior Frontend Engineer',
      location: 'Bengaluru, Karnataka',
      email: 'aarav.sharma@example.com',
      phone: '+91 9845 012 337',
      totalExperience: 5,
      summary:
        'Frontend engineer with five years building data-heavy React interfaces. I care about interfaces that stay fast with real data volume, and about design systems that other engineers actually want to use.',
      skills: ['React', 'TypeScript', 'Node.js', 'CSS / Tailwind', 'Testing Library', 'PostgreSQL'],
      experience: SEED.experience,
      education: SEED.education,
      languages: SEED.languages,
    },
  },
  r2: {
    missing: ['certifications', 'phone'],
    fields: {
      name: 'Aarav Sharma',
      headline: 'Design Systems Engineer',
      location: 'Bengaluru, Karnataka',
      email: 'aarav.sharma@example.com',
      totalExperience: 5,
      summary:
        'Frontend engineer who builds and maintains design systems. Five years shipping component libraries that survive contact with four product teams and two rebrands.',
      skills: [
        'React', 'TypeScript', 'Design systems', 'Storybook', 'Accessibility',
        'CSS / Tailwind', 'Figma',
      ],
      experience: [
        {
          id: 'x1', company: 'Zenith Systems', title: 'Senior Frontend Engineer · Design Systems',
          from: 'Mar 2023', to: 'Present', current: true,
          detail: 'Own the component library used by four product teams. Took adoption from 31% to 88% of surfaces in eighteen months.',
        },
        SEED.experience[1],
      ],
      education: SEED.education,
      languages: SEED.languages,
    },
  },
  r4: {
    missing: ['certifications', 'education', 'languages', 'phone'],
    fields: {
      name: 'Aarav Sharma',
      headline: 'Senior Frontend Engineer',
      location: 'Bengaluru, Karnataka',
      email: 'aarav.sharma@example.com',
      totalExperience: 5,
      skills: ['React', 'TypeScript', 'Node.js'],
      experience: [SEED.experience[0]],
    },
  },
  // r3 is the deliberately-unreadable file, so it has no parse at all
}

/**
 * Resolve a resume to the parse that backs it. A fixture resume is keyed by
 * its own id; an uploaded file carries `parseId` pointing at the fixture
 * parse that stands in for its contents.
 */
export function parseFor(resumeId: string, resumes: Resume[]): ResumeParse | undefined {
  if (RESUME_PARSES[resumeId]) return RESUME_PARSES[resumeId]
  const uploaded = resumes.find((r) => r.id === resumeId)
  return uploaded?.parseId ? RESUME_PARSES[uploaded.parseId] : undefined
}

/* ══════════════════ store ══════════════════ */

const STORAGE_KEY = 'kairo.profile.v1'

const INITIAL: ProfileState = { data: SEED, resumes: resumeSeed, source: {}, filledFrom: null }

function load(): ProfileState {
  let seedOverrides: Partial<ProfileData> = {}
  try {
    const signupBasics = localStorage.getItem('kairo.signup.basics')
    if (signupBasics) {
      const parsedBasics = JSON.parse(signupBasics) as { name?: string; email?: string; location?: string }
      if (parsedBasics.name) seedOverrides.name = parsedBasics.name
      if (parsedBasics.email) seedOverrides.email = parsedBasics.email
      if (parsedBasics.location) seedOverrides.location = parsedBasics.location
    }
  } catch {}

  const baseSeed = { ...SEED, ...seedOverrides }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { data: baseSeed, resumes: resumeSeed, source: {}, filledFrom: null }
    const parsed = JSON.parse(raw) as ProfileState
    return {
      data: { ...SEED, ...parsed.data, ...seedOverrides },
      resumes: parsed.resumes?.length ? parsed.resumes.slice(0, MAX_RESUMES) : resumeSeed.slice(0, MAX_RESUMES),
      source: parsed.source ?? {},
      filledFrom: parsed.filledFrom ?? null,
    }
  } catch {
    return { data: baseSeed, resumes: resumeSeed, source: {}, filledFrom: null }
  }
}

function save(state: ProfileState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* storage unavailable — the profile still works for this session */
  }
}

interface ProfileContextValue extends ProfileState {
  /** Overwrite one field, marking it as hand-edited. */
  set: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void
  /** Record a newly uploaded file so every surface can see it. */
  addResume: (resume: Resume) => void
  /** Replace the whole list (reorder, make primary, delete). */
  setResumes: (resumes: Resume[]) => void
  /** Apply a parsed resume over the profile. */
  fillFromResume: (resumeId: string, label: string) => { applied: string[]; missing: string[] }
  /** Preview what a resume would change, without applying it. */
  previewResume: (resumeId: string) => { key: keyof ProfileData; label: string; before: string; after: string }[]
  reset: () => void
}

const ProfileContext = React.createContext<ProfileContextValue | null>(null)

/** Human label + a readable rendering for any profile field. */
export const FIELD_LABEL: Record<string, string> = {
  name: 'Full name',
  headline: 'Current title',
  location: 'Location',
  email: 'Email',
  phone: 'Phone',
  summary: 'Professional summary',
  totalExperience: 'Total experience',
  skills: 'Skills',
  experience: 'Work experience',
  education: 'Education',
  certifications: 'Certifications',
  languages: 'Languages',
}

export function renderField(key: keyof ProfileData, data: ProfileData): string {
  const v = data[key]
  if (v == null) return '—'
  if (Array.isArray(v)) {
    if (v.length === 0) return 'Nothing added'
    if (typeof v[0] === 'string') return (v as string[]).join(' · ')
    if (key === 'experience') {
      return (v as ExperienceEntry[]).map((e) => `${e.title} at ${e.company}`).join(' · ')
    }
    if (key === 'education') {
      return (v as EducationEntry[]).map((e) => `${e.degree} ${e.field}, ${e.institution}`).join(' · ')
    }
  }
  if (key === 'totalExperience') return `${v as number} years`
  return String(v)
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ProfileState>(load)
  const { user } = useAuth()
  const stateRef = React.useRef(state)
  stateRef.current = state

  React.useEffect(() => {
    save(state)
    const authToken = localStorage.getItem('kairo.auth.token')
    if (authToken && state.data.email && (!user || user.role === 'candidate')) {
      // Sync to backend
      fetch('http://localhost:8000/api/candidate/profile/full', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(state.data),
      }).catch(console.error)
    }
  }, [state, user])

  React.useEffect(() => {
    let email = user?.email || state.data.email
    if (!email) {
      try {
        const raw = localStorage.getItem('kairo.signup.basics')
        if (raw) email = JSON.parse(raw).email
      } catch {}
    }
    if (!email) return

    if (user) {
      setState((s) => ({
        ...s,
        data: {
          ...s.data,
          name: user.name || s.data.name,
          email: user.email || s.data.email,
          location: user.location || s.data.location,
        },
      }))
    }

    const authToken = localStorage.getItem('kairo.auth.token')
    if (authToken && (!user || user.role === 'candidate')) {
      fetch('http://localhost:8000/api/candidate/profile/full', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && data.name) {
            setState((s) => ({
              ...s,
              data: {
                ...s.data,
                ...data, // merge all fetched fields
                name: data.name || s.data.name,
                email: data.email || s.data.email,
              },
            }))
          }
        })
        .catch(console.error)
    }
  }, [user])

  const set = React.useCallback(
    <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => {
      setState((s) => ({
        ...s,
        data: { ...s.data, [key]: value },
        // a hand edit takes provenance back from the parser
        source: { ...s.source, [key]: 'you' as FieldSource },
      }))
    },
    [],
  )

  const addResume = React.useCallback((resume: Resume) => {
    setState((s) => (
      s.resumes.length >= MAX_RESUMES
        ? s
        : { ...s, resumes: [resume, ...s.resumes] }
    ))
  }, [])

  const setResumes = React.useCallback((resumes: Resume[]) => {
    setState((s) => ({ ...s, resumes: resumes.slice(0, MAX_RESUMES) }))
  }, [])

  const fillFromResume = React.useCallback((resumeId: string, label: string) => {
    // resolve against the state we are about to update, so a file uploaded
    // moments ago is already resolvable
    const parse = parseFor(resumeId, stateRef.current.resumes)
    if (!parse) return { applied: [], missing: [] }

    const applied = (Object.keys(parse.fields) as (keyof ProfileData)[])
      .filter((key) => key !== 'email')
    const fields = Object.fromEntries(
      applied.map((key) => [key, parse.fields[key]]),
    ) as Partial<ProfileData>
    setState((s) => ({
      ...s,
      data: { ...s.data, ...fields },
      source: {
        ...s.source,
        ...Object.fromEntries(applied.map((k) => [k, 'resume' as FieldSource])),
      },
      filledFrom: { resumeId, label, at: new Date().toISOString() },
    }))
    return { applied: applied.map(String), missing: parse.missing }
  }, [])

  const previewResume = React.useCallback(
    (resumeId: string) => {
      const parse = parseFor(resumeId, state.resumes)
      if (!parse) return []
      return (Object.keys(parse.fields) as (keyof ProfileData)[])
        .filter((key) => key !== 'email')
        .map((key) => ({
          key,
          label: FIELD_LABEL[key] ?? key,
          before: renderField(key, state.data),
          after: renderField(key, { ...state.data, ...parse.fields }),
        }))
        .filter((d) => d.before !== d.after)
    },
    [state.data, state.resumes],
  )

  const reset = React.useCallback(() => setState(INITIAL), [])

  const value = React.useMemo(
    () => ({ ...state, set, addResume, setResumes, fillFromResume, previewResume, reset }),
    [state, set, addResume, setResumes, fillFromResume, previewResume, reset],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfileStore() {
  const ctx = React.useContext(ProfileContext)
  if (!ctx) throw new Error('useProfileStore must be used inside <ProfileProvider>')
  return ctx
}
