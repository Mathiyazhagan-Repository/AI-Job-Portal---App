import * as React from 'react'
import type { Company } from '@/data/mock'

const API_URL = 'http://localhost:8000'

interface CompaniesContextValue {
  companies: Company[]
  isLoading: boolean
  companyById: (id: string) => Company | undefined
}

const CompaniesContext = React.createContext<CompaniesContextValue | null>(null)

export function CompaniesProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = React.useState<Company[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    let active = true
    fetch(`${API_URL}/api/companies`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load companies')
        return response.json()
      })
      .then((data: unknown) => {
        if (active) {
          const loaded = Array.isArray(data) ? data as Company[] : []
          setCompanies(loaded)
        }
      })
      .catch(() => {
        if (active) setCompanies([])
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => { active = false }
  }, [])

  const companyById = React.useCallback(
    (id: string) => companies.find((c) => c.id === id) ?? {
      id,
      name: 'Company',
      slug: id,
      logoHue: 210,
      industry: 'Technology',
      size: 'Unknown',
      location: '',
      verified: false,
      about: '',
      openJobs: 0,
      rating: 0,
    },
    [companies]
  )

  return (
    <CompaniesContext.Provider value={{ companies, isLoading, companyById }}>
      {children}
    </CompaniesContext.Provider>
  )
}

export function useCompanies() {
  const context = React.useContext(CompaniesContext)
  if (!context) throw new Error('useCompanies must be used inside <CompaniesProvider>')
  return context
}
