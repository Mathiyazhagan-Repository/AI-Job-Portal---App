import * as React from 'react'
import type { Job } from '@/data/mock'

const API_URL = 'http://localhost:8000'

interface JobsContextValue {
  jobs: Job[]
  isLoading: boolean
}

const JobsContext = React.createContext<JobsContextValue | null>(null)

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = React.useState<Job[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    let active = true
    fetch(`${API_URL}/api/jobs`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load jobs')
        return response.json()
      })
      .then((data: unknown) => {
        if (active) {
          const loaded = Array.isArray(data) ? data as Job[] : []
          setJobs(loaded.map((job) => ({
            ...job,
            salaryMin: job.salaryMin > 0 ? job.salaryMin : 600000,
            salaryMax: job.salaryMax > 0 ? job.salaryMax : 4000000,
          })))
        }
      })
      .catch(() => {
        if (active) setJobs([])
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => { active = false }
  }, [])

  return (
    <JobsContext.Provider value={{ jobs, isLoading }}>
      {children}
    </JobsContext.Provider>
  )
}

export function useJobs() {
  const context = React.useContext(JobsContext)
  if (!context) throw new Error('useJobs must be used inside <JobsProvider>')
  return context
}
