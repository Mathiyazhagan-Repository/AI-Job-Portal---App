/** Launch market default: India · ₹ · LPA (DESIGN.md §23). */

export function salaryLPA(min?: number, max?: number, visible = true): string {
  if (!visible) return 'Not disclosed'
  if (min == null && max == null) return 'Not disclosed'
  const f = (n: number) => `${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`
  if (min != null && max != null) return `₹${f(min)} – ₹${f(max)}`
  return `₹${f((min ?? max)!)}+`
}

export function experienceRange(min: number, max?: number): string {
  if (max == null) return `${min}+ yrs`
  if (min === max) return `${min} yrs`
  return `${min}–${max} yrs`
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function timeOfDay(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function compact(n: number): string {
  return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

export function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
