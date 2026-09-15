import { useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  MapPin, Briefcase, Clock, Users, Share2, Bookmark, ArrowLeft, Check, CalendarX, ArrowRight,
  LineChart, AreaChart, Activity, BarChart3, BarChart4, BarChart, Donut, PieChart, Radar, ChevronDown
} from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/overlay'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { jobById, companyById, jobs } from '@/data/mock'
import { salaryLPA, experienceRange, relativeTime, shortDate, titleCase } from '@/lib/format'
import { MatchPrism, SkillConstellation, AIProvenanceChip } from '@/components/brand'
import { CompanyMark, JobCard } from '@/features/jobs/JobCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsListUnderline, TabsTriggerUnderline, TabsContent } from '@/components/ui/controls'

function MockChart({ type }: { type: string }) {
  if (type === 'Columns') {
    return (
      <div className="flex items-end justify-center gap-6 h-56 w-full px-8">
        {[40, 70, 45, 90, 65, 30, 80].map((h, i) => (
          <div key={i} className="w-10 rounded-t-xl bg-gradient-to-t from-violet-600 to-fuchsia-500 relative group transition-all duration-500 hover:opacity-80" style={{ height: `${h}%` }}>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-violet-900 text-white text-xs px-2.5 py-1 rounded-md shadow-lg pointer-events-none whitespace-nowrap">Skill {i+1}</div>
          </div>
        ))}
      </div>
    )
  }
  if (type === 'Bars') {
    return (
      <div className="flex flex-col justify-center gap-4 w-full max-w-sm mx-auto">
        {[80, 50, 95, 60, 30].map((w, i) => (
          <div key={i} className="flex items-center gap-4 group">
            <span className="text-sm font-medium text-violet-700 w-16 text-right">Skill {i+1}</span>
            <div className="h-6 rounded-r-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all duration-500 group-hover:opacity-80" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    )
  }
  if (type === 'Stacked') {
    return (
      <div className="flex items-end justify-center gap-6 h-56 w-full px-8">
        {[
          [30, 20, 10], [40, 10, 20], [20, 40, 10], [50, 20, 20], [30, 30, 10]
        ].map((segments, i) => (
          <div key={i} className="w-10 h-full flex flex-col justify-end gap-0.5 group">
            <div className="w-full rounded-t-md bg-amber-400 transition-all hover:opacity-80" style={{ height: `${segments[2]}%` }} />
            <div className="w-full bg-fuchsia-500 transition-all hover:opacity-80" style={{ height: `${segments[1]}%` }} />
            <div className="w-full rounded-b-md bg-violet-600 transition-all hover:opacity-80" style={{ height: `${segments[0]}%` }} />
          </div>
        ))}
      </div>
    )
  }
  if (type === 'Donut' || type === 'Pie') {
    const isDonut = type === 'Donut'
    return (
      <div className="relative flex items-center justify-center size-64 mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 drop-shadow-md">
          <circle cx="50" cy="50" r={isDonut ? "35" : "50"} fill="transparent" stroke="#7c3aed" strokeWidth={isDonut ? "20" : "100"} strokeDasharray="180 300" className="transition-all duration-500 hover:opacity-80 cursor-pointer" />
          <circle cx="50" cy="50" r={isDonut ? "35" : "50"} fill="transparent" stroke="#d946ef" strokeWidth={isDonut ? "20" : "100"} strokeDasharray="60 300" strokeDashoffset="-180" className="transition-all duration-500 hover:opacity-80 cursor-pointer" />
          <circle cx="50" cy="50" r={isDonut ? "35" : "50"} fill="transparent" stroke="#fbbf24" strokeWidth={isDonut ? "20" : "100"} strokeDasharray="20 300" strokeDashoffset="-240" className="transition-all duration-500 hover:opacity-80 cursor-pointer" />
        </svg>
        {isDonut && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-extrabold text-violet-900">85%</span>
            <span className="text-xs font-bold text-violet-500 uppercase tracking-widest mt-1">Match</span>
          </div>
        )}
      </div>
    )
  }
  if (type === 'Line' || type === 'Smooth') {
    const isSmooth = type === 'Smooth'
    const d = isSmooth 
      ? "M 0 100 C 50 100, 50 20, 100 20 C 150 20, 150 80, 200 80 C 250 80, 250 10, 300 10" 
      : "M 0 100 L 50 20 L 100 80 L 150 40 L 200 60 L 250 10 L 300 30"
    return (
      <div className="flex items-center justify-center h-56 w-full px-8">
        <svg viewBox="0 0 300 120" className="w-full h-full overflow-visible drop-shadow-lg">
          <path d={d} fill="none" stroke="url(#lineGrad)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>
          </defs>
          {[
            {x: 0, y: 100}, {x: 50, y: 20}, {x: 100, y: 80}, {x: 150, y: 40}, {x: 200, y: 60}, {x: 250, y: 10}, {x: 300, y: 30}
          ].map((pt, i) => !isSmooth && (
            <circle key={i} cx={pt.x} cy={pt.y} r="5" fill="#fff" stroke="#d946ef" strokeWidth="2.5" className="hover:r-[7px] transition-all cursor-pointer" />
          ))}
        </svg>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center text-violet-400">
      <BarChart3 className="mb-4 size-16 opacity-50" />
      <p className="text-base font-medium">Visualization for {type}</p>
    </div>
  )
}

export function Component() {
  const { jobId = 'j1' } = useParams()
  const variant = useVariant()
  const job = jobById(jobId) ?? jobs[0]
  const company = companyById(job.companyId)
  const [visualType, setVisualType] = useState('Area')
  
  // Dummy auth state for the UI prototype
  const isLoggedIn = false

  const matched = job.requiredSkills.slice(0, 3).map((n) => ({ name: n, years: 4 }))
  const missing = job.requiredSkills.slice(3).map((n) => ({ name: n }))
  const bonus = job.preferredSkills.slice(0, 2).map((n) => ({ name: n, years: 2 }))
  const similar = jobs.filter((j) => j.id !== job.id).slice(0, 3)

  const facts: [string, string][] = [
    ['Location', job.location],
    ['Work mode', titleCase(job.workMode)],
    ['Job type', titleCase(job.jobType)],
    ['Experience', experienceRange(job.experienceMin, job.experienceMax)],
    ['Salary', salaryLPA(job.salaryMin, job.salaryMax, job.salaryVisible)],
    ['Openings', String(job.openings)],
    ['Department', job.department],
    ['Apply by', shortDate(job.deadline)],
  ]

  const applyCard = (
    <div className="rounded-3xl border border-violet-500/10 bg-white/80 p-6 shadow-xl shadow-violet-500/[0.05] backdrop-blur-md">
      {job.matchScore != null && job.matchBreakdown && (
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 p-4 ring-1 ring-violet-500/20 shadow-inner">
          <MatchPrism
            score={job.matchScore}
            breakdown={job.matchBreakdown}
            matchedSkills={matched.map((s) => s.name)}
            missingSkills={missing.map((s) => s.name)}
            layout="panel"
            size="md"
            className="border-0 p-0 shadow-none bg-transparent"
          />
        </div>
      )}
      <Button size="lg" className="w-full h-12 rounded-xl text-base font-bold shadow-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0 transition-transform active:scale-95">
        Apply now
      </Button>
      <div className="mt-3 flex gap-3">
        <Button variant="secondary" size="sm" className="flex-1 h-10 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 border-0 font-medium transition-colors">
          <Bookmark className="size-4 mr-2" /> Save
        </Button>
        <Button variant="secondary" size="sm" className="flex-1 h-10 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 border-0 font-medium transition-colors">
          <Share2 className="size-4 mr-2" /> Share
        </Button>
      </div>
      <dl className="mt-6 space-y-3 border-t border-violet-100 pt-6 text-sm">
        {facts.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-violet-600/70 font-medium">{k}</dt>
            <dd className="text-right font-bold text-violet-900">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 py-3 text-xs font-bold text-white shadow-md">
        <Users className="size-4" aria-hidden />
        {job.applicants} people have applied
      </div>
    </div>
  )

  const VISUAL_OPTIONS = [
    { id: 'Line', icon: LineChart },
    { id: 'Area', icon: AreaChart },
    { id: 'Smooth', icon: Activity },
    { id: 'Columns', icon: BarChart3 },
    { id: 'Stacked', icon: BarChart4 },
    { id: 'Bars', icon: BarChart },
    { id: 'Donut', icon: Donut },
    { id: 'Pie', icon: PieChart },
    { id: 'Radar', icon: Radar },
  ]

  const body = (
    <div className="space-y-6">
      <section className="rounded-3xl border border-blue-500/10 bg-white/80 p-8 shadow-lg shadow-blue-500/[0.03] backdrop-blur-sm">
        <h2 className="font-display text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">About the role</h2>
        <p className="mt-4 leading-relaxed text-slate-700">{job.description}</p>
      </section>

      <section className="rounded-3xl border border-purple-500/10 bg-white/80 p-8 shadow-lg shadow-purple-500/[0.03] backdrop-blur-sm">
        <h2 className="font-display text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Responsibilities</h2>
        <ul className="mt-5 space-y-3">
          {job.responsibilities.map((r) => (
            <li key={r} className="flex gap-3 text-slate-700">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-sm">
                <Check className="size-3.5" aria-hidden />
              </div>
              <span className="pt-0.5">{r}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-orange-500/10 bg-white/80 p-8 shadow-lg shadow-orange-500/[0.03] backdrop-blur-sm">
        <h2 className="font-display text-2xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Requirements</h2>
        <ul className="mt-5 space-y-3">
          {job.qualifications.map((q) => (
            <li key={q} className="flex gap-3 text-slate-700">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-sm">
                <Check className="size-3.5" aria-hidden />
              </div>
              <span className="pt-0.5">{q}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-violet-500/10 bg-white/80 p-8 shadow-lg shadow-violet-500/[0.03] backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">How your skills line up</h2>
          
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 shadow-sm">
              <Activity className="size-3" />
              views up 29%
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-all">
                  <BarChart3 className="size-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[340px] p-5 rounded-2xl border border-violet-100 shadow-xl bg-white/95 backdrop-blur-md" align="end">
                <p className="text-[11px] font-bold text-violet-500 mb-4 tracking-widest">VISUALISE AS</p>
                <div className="grid grid-cols-3 gap-3">
                  {VISUAL_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const isSelected = visualType === opt.id
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setVisualType(opt.id)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2.5 rounded-xl border p-4 transition-all",
                          isSelected 
                            ? "border-violet-500 bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-md" 
                            : "border-slate-100 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50"
                        )}
                      >
                        <Icon className="size-6" strokeWidth={isSelected ? 2 : 1.5} />
                        <span className="text-[13px] font-medium">{opt.id}</span>
                      </button>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="mt-8 flex min-h-[300px] items-center justify-center rounded-2xl border border-violet-200/50 bg-violet-50/30 pb-6 pt-6 shadow-inner">
          {visualType === 'Radar' || visualType === 'Area' ? (
             <SkillConstellation variant={variant} matched={matched} missing={missing} bonus={bonus} size={280} />
          ) : (
             <MockChart type={visualType} />
          )}
        </div>
        <div className="mt-6 flex flex-wrap gap-2 pt-6 border-t border-violet-100">
          {job.requiredSkills.map((s) => (
            <Badge key={s} tone="brand" className="rounded-lg px-3 py-1 shadow-sm">
              {s}
            </Badge>
          ))}
          {job.preferredSkills.map((s) => (
            <Badge key={s} tone="outline" className="rounded-lg px-3 py-1 text-slate-600 border-slate-200 bg-white shadow-sm">
              {s} · preferred
            </Badge>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-emerald-500/10 bg-white/80 p-8 shadow-lg shadow-emerald-500/[0.03] backdrop-blur-sm">
        <h2 className="font-display text-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Benefits</h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {job.benefits.map((b) => (
            <li key={b} className="flex gap-3 text-slate-700">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm">
                <Check className="size-3.5" aria-hidden />
              </div>
              <span className="pt-0.5">{b}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-cyan-500/10 bg-white/80 p-8 shadow-lg shadow-cyan-500/[0.03] backdrop-blur-sm">
        <h2 className="font-display text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">About {company.name}</h2>
        <div className="mt-5 flex flex-col sm:flex-row items-start gap-5 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 p-5 ring-1 ring-cyan-500/20">
          <div className="rounded-xl bg-white p-2 shadow-md ring-1 ring-cyan-500/10">
            <CompanyMark company={company} size={56} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-cyan-950 text-lg">
              {company.name}
              {company.verified && (
                <Badge tone="brand" size="sm" className="ml-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0 shadow-sm">
                  verified
                </Badge>
              )}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-cyan-800">{company.about}</p>
            <p className="mt-4 text-sm font-medium text-cyan-700 flex flex-wrap gap-x-4 gap-y-2">
              <span>{company.industry}</span>
              <span>·</span>
              <span>{company.size} employees</span>
              <span>·</span>
              <span>{company.location}</span>
            </p>
            <Link
              to={`/companies/${company.slug}`}
              className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700"
            >
              See all {company.openJobs} open roles <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )

  /* ── C · cover hero + tabs ── */
  if (variant === 'c') {
    return (
      <div>
        <div
          className="h-40 w-full sm:h-56"
          style={{
            background: `linear-gradient(135deg, oklch(0.94 0.05 ${company.logoHue}), oklch(0.98 0.015 ${company.logoHue}))`,
          }}
          aria-hidden
        />
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
          <div className="-mt-12 flex flex-wrap items-end gap-4">
            <div className="rounded-v bg-paper p-2 shadow-lg">
              <CompanyMark company={company} size={72} />
            </div>
            <div className="min-w-0 flex-1 pb-2">
              <p className="text-ink-2">{company.name}</p>
              <h1 className="font-display tracking-tight text-display-2 font-semibold leading-tight text-ink">
                {job.title}
              </h1>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-ink-2">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="size-4" aria-hidden />
              {experienceRange(job.experienceMin, job.experienceMax)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden />
              {relativeTime(job.postedAt)}
            </span>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
            <Tabs defaultValue="role">
              <TabsListUnderline>
                <TabsTriggerUnderline value="role">The role</TabsTriggerUnderline>
                <TabsTriggerUnderline value="fit">Your fit</TabsTriggerUnderline>
                <TabsTriggerUnderline value="company">Company</TabsTriggerUnderline>
              </TabsListUnderline>
              <TabsContent value="role" className="pt-8">
                {body}
              </TabsContent>
              <TabsContent value="fit" className="pt-8">
                {job.matchBreakdown && job.matchScore != null && (
                  <MatchPrism
                    score={job.matchScore}
                    breakdown={job.matchBreakdown}
                    matchedSkills={matched.map((s) => s.name)}
                    missingSkills={missing.map((s) => s.name)}
                    layout="ring"
                    size="xl"
                    defaultExpanded
                  />
                )}
              </TabsContent>
              <TabsContent value="company" className="pt-8">
                <p className="leading-relaxed text-ink-2">{company.about}</p>
              </TabsContent>
            </Tabs>
            <aside>
              <div className="sticky top-24">{applyCard}</div>
            </aside>
          </div>

          <section className="py-16">
            <h2 className="font-display tracking-tight text-2xl font-semibold text-ink">Similar roles</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((j) => (
                <JobCard key={j.id} job={j} variant="c" />
              ))}
            </div>
          </section>
        </div>
      </div>
    )
  }

  /* ── B · narrow reading column + sticky bottom bar ── */
  if (variant === 'b') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 pb-24 sm:px-6">
        <Link to="/jobs" className="inline-flex items-center gap-1 text-xs text-ink-3 hover:text-ink">
          <ArrowLeft className="size-3.5" aria-hidden /> All jobs
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-ink">{job.title}</h1>
        <p className="text-sm text-ink-2">
          {company.name} · {job.location}
        </p>

        <table className="mt-4 w-full border-y border-line text-sm">
          <tbody className="divide-y divide-line">
            {facts.map(([k, v]) => (
              <tr key={k}>
                <th scope="row" className="w-32 py-1.5 text-left font-normal text-ink-3">
                  {k}
                </th>
                <td className="py-1.5 font-medium text-ink">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {job.matchScore != null && job.matchBreakdown && (
          <div className="mt-4 rounded-md border border-line p-3">
            <MatchPrism
              score={job.matchScore}
              breakdown={job.matchBreakdown}
              matchedSkills={matched.map((s) => s.name)}
              missingSkills={missing.map((s) => s.name)}
              layout="inline"
              defaultExpanded
            />
          </div>
        )}

        <div className="mt-8">{body}</div>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5 sm:px-6">
            <span className="min-w-0 flex-1 truncate text-sm">
              <span className="font-medium text-ink">{job.title}</span>
              <span className="text-ink-3">
                {' · '}
                {salaryLPA(job.salaryMin, job.salaryMax, job.salaryVisible)}
              </span>
            </span>
            <Button size="sm" variant="secondary" aria-label="Save job">
              <Bookmark className="size-4" />
            </Button>
            <Button size="sm">Apply now</Button>
          </div>
        </div>
      </div>
    )
  }

  /* ── A · premium vibrant theme ── */
  return (
    <>
      <div className="fixed inset-0 -z-10 transition-colors duration-500 bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100" aria-hidden />
      <div className="pb-20 pt-8">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <Link to="/jobs" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors drop-shadow-sm">
          <ArrowLeft className="size-4" aria-hidden /> Back to all jobs
        </Link>

        {/* Premium Header */}
        <div className="mt-6 rounded-[2.5rem] bg-white/80 p-8 sm:p-10 shadow-xl shadow-black/[0.04] ring-1 ring-black/5 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start gap-6 min-w-0 flex-1">
              <div className="rounded-2xl bg-white p-3 shadow-lg shadow-black/10 ring-1 ring-black/5 shrink-0">
                <CompanyMark company={company} size={72} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-lg font-bold bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-transparent truncate">{company.name}</p>
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 shrink-0 shadow-sm border border-brand-200/50">{company.industry}</span>
                </div>
                <h1 className="mt-2 font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 truncate drop-shadow-sm">{job.title}</h1>
                
                <div className="mt-5 -mx-1 px-1 py-1 flex items-center gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full">
                  <div className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-50/80 px-4 py-2.5 ring-1 ring-blue-500/20 whitespace-nowrap shadow-sm">
                    <MapPin className="size-5 text-blue-500" />
                    <span className="text-sm font-bold text-blue-800">{job.location}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 rounded-xl bg-purple-50/80 px-4 py-2.5 ring-1 ring-purple-500/20 whitespace-nowrap shadow-sm">
                    <Briefcase className="size-5 text-purple-500" />
                    <span className="text-sm font-bold text-purple-800">{experienceRange(job.experienceMin, job.experienceMax)}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 rounded-xl bg-orange-50/80 px-4 py-2.5 ring-1 ring-orange-500/20 whitespace-nowrap shadow-sm">
                    <Users className="size-5 text-orange-500" />
                    <span className="text-sm font-bold text-orange-800">{job.applicants} applicants</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-50/80 px-4 py-2.5 ring-1 ring-emerald-500/20 whitespace-nowrap shadow-sm">
                    <Check className="size-5 text-emerald-500" />
                    <span className="text-sm font-bold text-emerald-800">{job.openings} openings</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 rounded-xl bg-pink-50/80 px-4 py-2.5 ring-1 ring-pink-500/20 whitespace-nowrap shadow-sm">
                    <span className="text-sm font-bold text-pink-800">{titleCase(job.jobType)}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 rounded-xl bg-cyan-50/80 px-4 py-2.5 ring-1 ring-cyan-500/20 whitespace-nowrap shadow-sm">
                    <span className="text-sm font-bold text-cyan-800">{titleCase(job.workMode)}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 rounded-xl bg-amber-50/80 px-4 py-2.5 ring-1 ring-amber-500/20 whitespace-nowrap shadow-sm">
                    <Clock className="size-5 text-amber-500" />
                    <span className="text-sm font-bold text-amber-800">{relativeTime(job.postedAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {!isLoggedIn && (
              <div className="shrink-0 pt-2 sm:pt-0">
                <Button asChild size="lg" className="rounded-xl shadow-lg h-12 px-6 bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-700 hover:to-violet-700 text-white font-bold border-0 transition-transform active:scale-95">
                  <Link to="/login">Log in to apply</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0">{body}</div>
          <aside>
            <div className="sticky top-24">{applyCard}</div>
          </aside>
        </div>

        <section className="mt-16 rounded-[2.5rem] bg-white/80 p-8 sm:p-10 shadow-lg shadow-black/[0.03] ring-1 ring-black/5 backdrop-blur-sm">
          <h2 className="font-display text-3xl font-extrabold bg-gradient-to-r from-slate-800 to-slate-500 bg-clip-text text-transparent">Similar roles</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((j) => (
              <JobCard key={j.id} job={j} variant="a" />
            ))}
          </div>
        </section>
        </div>
      </div>
    </>
  )
}

Component.displayName = 'JobDetailPage'
