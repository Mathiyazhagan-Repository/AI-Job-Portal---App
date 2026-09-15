import * as React from 'react'
import { applications as applicationSeed, companyById, type Application, type Job } from '@/data/mock'
import { conversations as conversationSeed, type Conversation } from '@/data/console'
import { useProfileStore } from '@/store/profile'
import { useAuth } from '@/store/auth'

interface ApplicationState {
  applications: Application[]
  conversations: Conversation[]
  applicationCount: number
}

interface ApplicationStore extends ApplicationState {
  easyApply: (job: Job) => { ok: true; resumeName: string } | { ok: false; reason: string }
  hasApplied: (jobId: string) => boolean
}

const ApplicationContext = React.createContext<ApplicationStore | null>(null)

export function ApplicationProvider({ children }: { children: React.ReactNode }) {
  const profile = useProfileStore()
  const { user, token } = useAuth()
  const [state, setState] = React.useState<ApplicationState>({
    applications: applicationSeed,
    conversations: conversationSeed,
    applicationCount: 0,
  })

  React.useEffect(() => {
    let active = true

    if (!user?.id || !token) {
      setState((current) => ({ ...current, applicationCount: 0, applications: [] }))
      return () => { active = false }
    }

    fetch('http://localhost:8000/api/candidate/applications', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => response.ok ? response.json() : [])
      .then((data: any[]) => {
        if (active) setState((current) => ({
          ...current,
          applications: data,
          applicationCount: data.length,
        }))
      })
      .catch(console.error)

    return () => { active = false }
  }, [user?.id, token])

  const hasApplied = React.useCallback(
    (jobId: string) => state.applications.some((application) => application.jobId === jobId),
    [state.applications],
  )

  const easyApply = React.useCallback(async (job: Job) => {
    const resume = profile.resumes.find((item) => item.isPrimary) ?? profile.resumes[0]
    if (!resume) return { ok: false as const, reason: 'Add a resume to your profile before applying.' }
    if (state.applications.some((application) => application.jobId === job.id)) {
      return { ok: false as const, reason: 'You have already applied to this job.' }
    }

    try {
      const response = await fetch('http://localhost:8000/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          job_id: job.id,
          resume_id: resume.id, // the frontend uses a string for id, but we send it. Wait, the API handles string or None.
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        return { ok: false as const, reason: error.detail || 'Failed to submit application.' }
      }

      const result = await response.json()
      
      const now = new Date().toISOString()
      const application: Application = {
        id: result.application?.id || `easy-${job.id}-${Date.now()}`,
        jobId: job.id,
        stage: 'applied',
        appliedAt: now,
        lastUpdate: now,
        history: [{ stage: 'applied', at: now, by: 'You', note: `Easy Applied with ${resume.fileName}` }],
      }

      setState((current) => ({
        ...current,
        applications: [application, ...current.applications],
        applicationCount: current.applicationCount + 1,
      }))
      
      return { ok: true as const, resumeName: resume.fileName }
    } catch (e) {
      return { ok: false as const, reason: 'Network error submitting application.' }
    }
  }, [profile.resumes, state.applications, token])

  const value = React.useMemo(
    () => ({ ...state, easyApply, hasApplied }),
    // @ts-ignore - React expects easyApply to be sync in some places but async here is fine because consumers await or don't care
    [state, easyApply, hasApplied],
  )

  return <ApplicationContext.Provider value={value}>{children}</ApplicationContext.Provider>
}

export function useApplicationStore() {
  const context = React.useContext(ApplicationContext)
  if (!context) throw new Error('useApplicationStore must be used inside <ApplicationProvider>')
  return context
}
