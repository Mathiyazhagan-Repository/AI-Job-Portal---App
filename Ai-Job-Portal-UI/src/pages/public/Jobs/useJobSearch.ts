import { useEffect, useMemo, useState } from 'react'
import { salaryHistogram, type Job } from '@/data/mock'
import { useJobs } from '@/store/jobs'
import { useAuth } from '@/store/auth'

/**
 * ONE data hook, shared by all three variants (DESIGN.md §6.6b).
 * Called once in index.tsx; the views receive everything as props.
 */

export interface JobFilters {
  query: string
  workMode: string[]
  jobType: string[]
  salary: [number, number]
  skills: string[]
  sort: 'relevance' | 'date' | 'salary'
}

const EMPTY: JobFilters = {
  query: '',
  workMode: [],
  jobType: [],
  salary: [600000, 4000000],
  skills: [],
  sort: 'relevance',
}

export function useJobSearch() {
  const { jobs } = useJobs()
  const { token } = useAuth()
  const [filters, setFilters] = useState<JobFilters>(EMPTY)
  const [selectedId, setSelectedId] = useState<string>('')
  const [saved, setSaved] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!token) {
      setSaved(new Set())
      return
    }
    fetch('http://localhost:8000/api/candidate/saved-jobs', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => response.ok ? response.json() : [])
      .then((data: unknown) => {
        const rows = Array.isArray(data) ? data as { jobId?: string }[] : []
        setSaved(new Set(rows.map((row) => row.jobId).filter((id): id is string => Boolean(id))))
      })
      .catch(() => setSaved(new Set()))
  }, [token])

  const results = useMemo(() => {
    let out = jobs.filter((j) => {
      if (filters.query) {
        const q = filters.query.toLowerCase()
        const hay = `${j.title} ${j.requiredSkills.join(' ')} ${j.location}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (filters.workMode.length && !filters.workMode.includes(j.workMode)) return false
      if (filters.jobType.length && !filters.jobType.includes(j.jobType)) return false
      if (j.salaryMax < filters.salary[0] || j.salaryMin > filters.salary[1]) return false
      if (filters.skills.length && !filters.skills.some((s) => j.requiredSkills.includes(s)))
        return false
      return true
    })

    out = [...out].sort((a, b) => {
      if (filters.sort === 'date') return +new Date(b.postedAt) - +new Date(a.postedAt)
      if (filters.sort === 'salary') return b.salaryMax - a.salaryMax
      return (b.matchScore ?? 0) - (a.matchScore ?? 0)
    })

    return out.map((j) => ({ ...j, saved: saved.has(j.id) }))
  }, [filters, jobs, saved])

  /** Active filters as removable chips — also feeds the filtered-empty state. */
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string }[] = []
    if (filters.query) chips.push({ key: 'query', label: `“${filters.query}”` })
    filters.workMode.forEach((m) => chips.push({ key: `workMode:${m}`, label: m }))
    filters.jobType.forEach((t) => chips.push({ key: `jobType:${t}`, label: t.replace('_', ' ') }))
    filters.skills.forEach((s) => chips.push({ key: `skills:${s}`, label: s }))
    if (filters.salary[0] !== EMPTY.salary[0] || filters.salary[1] !== EMPTY.salary[1])
      chips.push({ key: 'salary', label: 'salary range' })
    return chips
  }, [filters])

  function clearChip(key: string) {
    const [group, value] = key.split(':')
    setFilters((f) => {
      if (group === 'query') return { ...f, query: '' }
      if (group === 'salary') return { ...f, salary: EMPTY.salary }
      if (group === 'workMode') return { ...f, workMode: f.workMode.filter((v) => v !== value) }
      if (group === 'jobType') return { ...f, jobType: f.jobType.filter((v) => v !== value) }
      if (group === 'skills') return { ...f, skills: f.skills.filter((v) => v !== value) }
      return f
    })
  }

  function toggle(group: 'workMode' | 'jobType' | 'skills', value: string) {
    setFilters((f) => {
      const list = f[group]
      return {
        ...f,
        [group]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      }
    })
  }

  async function toggleSave(id: string) {
    if (!token) throw new Error('Please sign in to save jobs.')
    const isSaved = saved.has(id)
    const response = await fetch(
      isSaved
        ? `http://localhost:8000/api/candidate/saved-jobs/${encodeURIComponent(id)}`
        : 'http://localhost:8000/api/candidate/saved-jobs',
      {
        method: isSaved ? 'DELETE' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          ...(isSaved ? {} : { 'Content-Type': 'application/json' }),
        },
        body: isSaved ? undefined : JSON.stringify({ job_id: id }),
      },
    )
    if (!response.ok) throw new Error('Unable to update saved jobs.')
    setSaved((current) => {
      const next = new Set(current)
      isSaved ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selected: Job | undefined =
    results.find((j) => j.id === selectedId) ?? results[0]

  return {
    filters,
    setFilters,
    toggle,
    results,
    activeChips,
    clearChip,
    clearAll: () => setFilters(EMPTY),
    selected,
    selectedId: selected?.id,
    setSelectedId,
    toggleSave,
    histogram: salaryHistogram,
    salaryBounds: [EMPTY.salary[0], EMPTY.salary[1]] as [number, number],
  }
}

export type JobSearchState = ReturnType<typeof useJobSearch>
