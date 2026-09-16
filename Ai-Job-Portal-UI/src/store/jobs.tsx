import * as React from 'react'
import type { Job } from '@/data/mock'

const API_URL = 'http://localhost:8000'

interface JobsContextValue {
  jobs: Job[]
  isLoading: boolean
  refreshJobs: () => Promise<void>
}

const JobsContext = React.createContext<JobsContextValue | null>(null)

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = React.useState<Job[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const fetchJobs = React.useCallback(async (active = true) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/jobs`)
      if (!response.ok) throw new Error('Unable to load jobs')
      const data = await response.json()
      if (active) {
        const loaded = Array.isArray(data) ? data as Job[] : []
        setJobs(loaded.map((job) => ({
          ...job,
          salaryMin: job.salaryMin > 0 ? job.salaryMin : 600000,
          salaryMax: job.salaryMax > 0 ? job.salaryMax : 4000000,
        })))
      }
    } catch {
      if (active) setJobs([])
    } finally {
      if (active) setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    let active = true
    fetchJobs(active)
    return () => { active = false }
  }, [fetchJobs])

  return (
    <JobsContext.Provider value={{ jobs, isLoading, refreshJobs: () => fetchJobs(true) }}>
      {children}
    </JobsContext.Provider>
  )
}

export function useJobs() {
  const context = React.useContext(JobsContext)
  if (!context) throw new Error('useJobs must be used inside <JobsProvider>')
  return context
}
