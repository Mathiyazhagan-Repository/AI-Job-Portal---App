/**
 * Mock data mirroring the PRD Part 29 schema field-for-field.
 * When the FastAPI backend lands, only services/apiClient.ts changes.
 */

import { buildBreakdown, weightedTotal, type MatchBreakdownItem } from '@/lib/scoring'
import type { Stage } from '@/lib/pipeline'
import type { SkillNode } from '@/components/brand/SkillConstellation'

/* ══════════════════ Companies ══════════════════ */

export interface Company {
  id: string
  name: string
  slug: string
  logoHue: number
  industry: string
  size: string
  location: string
  verified: boolean
  about: string
  openJobs: number
  rating: number
  logoUrl?: string
  /** What the employer advertises — shown as chips on the premium carousel. */
  benefits?: string[]
}

export const companies: Company[] = [
  { id: 'c1', name: 'TCS', slug: 'tcs', logoHue: 215, industry: 'IT Services', size: '10000+', location: 'Mumbai', verified: true, about: 'Tata Consultancy Services.', openJobs: 4, rating: 4.6, benefits: ['Learning & Development', 'Inclusive Workplace'], logoUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Tata_Consultancy_Services_Logo.svg' },
  { id: 'c2', name: 'Microsoft', slug: 'microsoft', logoHue: 210, industry: 'Technology', size: '10000+', location: 'Redmond', verified: true, about: 'Empower every person and every organization.', openJobs: 4, rating: 4.7, benefits: ['Flexible work', 'Pay equity', 'Health care benefits'], logoUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Microsoft_logo_(2012).svg' },
  { id: 'c3', name: 'Amazon', slug: 'amazon', logoHue: 30, industry: 'E-commerce', size: '10000+', location: 'Seattle', verified: true, about: 'Earth\'s most customer-centric company.', openJobs: 5, rating: 4.5, benefits: ['Health and wellness', 'Internship Opportunities'], logoUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Amazon_logo.svg' },
  { id: 'c4', name: 'Dream11', slug: 'dream11', logoHue: 0, industry: 'Gaming', size: '1000+', location: 'Mumbai', verified: true, about: 'Play Fantasy Cricket.', openJobs: 5, rating: 4.2, benefits: ['Paid Time Off', 'Parental Care Leave'], logoUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Dream11_Logo.svg' },
  { id: 'c5', name: 'Google', slug: 'google', logoHue: 220, industry: 'Search', size: '10000+', location: 'Mountain View', verified: true, about: 'Organize the world\'s information.', openJobs: 4, rating: 4.8, benefits: ['Global pay parity', 'Incentive pay'], logoUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Google_2015_logo.svg' },
  { id: 'c6', name: 'Deloitte', slug: 'deloitte', logoHue: 120, industry: 'Consulting', size: '10000+', location: 'London', verified: true, about: 'Audit, consulting, advisory.', openJobs: 4, rating: 4.3, benefits: ['Flexibility', 'Positive work/life balance'], logoUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Logo_of_Deloitte.svg' },
  { id: 'c7', name: 'BYJU\'S', slug: 'byjus', logoHue: 280, industry: 'EdTech', size: '10000+', location: 'Bengaluru', verified: true, about: 'The Learning App.', openJobs: 4, rating: 3.9, benefits: ['Job/Soft Skill Training', 'Training and Development'], logoUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Byju%27s_logo.svg' },
]

export const companyById = (id: string) => companies.find((c) => c.id === id) ?? {
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
}

/* ══════════════════ Jobs ══════════════════ */

export type WorkMode = 'onsite' | 'remote' | 'hybrid'
export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship'

export interface Job {
  id: string
  title: string
  companyId: string
  location: string
  workMode: WorkMode
  jobType: JobType
  experienceMin: number
  experienceMax: number
  salaryMin: number
  salaryMax: number
  salaryVisible: boolean
  requiredSkills: string[]
  preferredSkills: string[]
  postedAt: string
  applicants: number
  views: number
  status: 'draft' | 'pending_review' | 'published' | 'closed' | 'expired'
  department: string
  openings: number
  deadline: string
  description: string
  responsibilities: string[]
  qualifications: string[]
  benefits: string[]
  /** Candidate-side score against the signed-in candidate. */
  matchScore?: number
  matchBreakdown?: MatchBreakdownItem[]
  recommendationReason?: string
  aiGenerated?: boolean
  saved?: boolean
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()
const daysAhead = (n: number) => new Date(Date.now() + n * 86400000).toISOString()

function job(
  partial: Omit<Job, 'matchBreakdown' | 'matchScore'> & { scores?: Record<string, number> },
): Job {
  const { scores, ...rest } = partial
  if (!scores) return rest as Job
  const breakdown = buildBreakdown(scores)
  return { ...rest, matchBreakdown: breakdown, matchScore: weightedTotal(breakdown) }
}

export const jobs: Job[] = [
  job({
    id: 'j1', title: 'Senior React Developer', companyId: 'c1', location: 'Bengaluru', workMode: 'hybrid', jobType: 'full_time',
    experienceMin: 4, experienceMax: 7, salaryMin: 2400000, salaryMax: 3800000, salaryVisible: true,
    requiredSkills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'Redux', 'Tailwind CSS'], preferredSkills: ['Next.js', 'AWS', 'Playwright', 'Vite', 'Framer Motion'],
    postedAt: daysAgo(2), applicants: 148, views: 2410, status: 'published', department: 'Engineering', openings: 2, deadline: daysAhead(21),
    description: 'We are looking for a senior engineer to own the front end of our data-exploration product — the surface where thousands of analysts spend their day.',
    responsibilities: ['Own the architecture of our React application and its design system', 'Partner with design to ship interfaces that hold up under real data volume', 'Mentor three mid-level engineers through code review and pairing', 'Drive front-end performance budgets and keep them honest'],
    qualifications: ['4+ years building production React applications', 'Deep TypeScript — generics, discriminated unions, not just annotations', 'Experience with GraphQL clients and cache design', "Bachelor's degree in Computer Science or equivalent practical experience"],
    benefits: ['Health cover for you and dependants', 'Annual learning budget of ₹1L', 'Hybrid — 2 days in office', 'ESOP with a 4-year vest'],
    scores: { skills: 92, experience: 85, location: 100, education: 90, title: 82, preferences: 85 },
    recommendationReason: 'Because you saved 3 React roles in Bengaluru this week.',
  }),
  job({
    id: 'j2', title: 'Product Designer', companyId: 'c5', location: 'Remote', workMode: 'remote', jobType: 'full_time',
    experienceMin: 3, experienceMax: 6, salaryMin: 1800000, salaryMax: 2800000, salaryVisible: true,
    requiredSkills: ['Figma', 'Design systems', 'Prototyping'], preferredSkills: ['Motion design', 'Front-end basics'],
    postedAt: daysAgo(1), applicants: 92, views: 1830, status: 'published', department: 'Design', openings: 1, deadline: daysAhead(30),
    description: 'Design end-to-end product experiences for climate-tech companies, from research through to shipped interface.',
    responsibilities: ['Lead design on two client engagements at a time', 'Grow and maintain our shared component library', 'Run research sessions and turn findings into decisions'],
    qualifications: ['3+ years in product design', 'A portfolio showing shipped work, not concepts', 'Comfortable working directly with engineers'],
    benefits: ['Fully remote', 'Four-day weeks in December', 'Conference budget'],
    scores: { skills: 64, experience: 78, location: 100, education: 80, title: 55, preferences: 92 },
    recommendationReason: 'Similar to the Design Systems role you viewed twice.',
  }),
  job({
    id: 'j3', title: 'Backend Engineer — Python', companyId: 'c4', location: 'Pune', workMode: 'onsite', jobType: 'full_time',
    experienceMin: 2, experienceMax: 5, salaryMin: 1600000, salaryMax: 2600000, salaryVisible: true,
    requiredSkills: ['Python', 'FastAPI', 'PostgreSQL'], preferredSkills: ['Redis', 'Kubernetes', 'Celery'],
    postedAt: daysAgo(4), applicants: 211, views: 3120, status: 'published', department: 'Engineering', openings: 3, deadline: daysAhead(14),
    description: 'Build and scale the lending APIs that move ₹400 crore a month.',
    responsibilities: ['Design and ship FastAPI services', 'Own database schema and migration strategy', 'Take part in the on-call rotation'],
    qualifications: ['2+ years with Python in production', 'Strong SQL and schema design', 'Understanding of idempotency and retries'],
    benefits: ['Relocation support', 'Health cover', 'Annual bonus'],
    scores: { skills: 58, experience: 88, location: 40, education: 90, title: 60, preferences: 45 },
    recommendationReason: 'Your Python and PostgreSQL experience matches 6 of 8 requirements.',
  }),
  job({
    id: 'j4', title: 'Frontend Engineer', companyId: 'c2', location: 'Hyderabad', workMode: 'hybrid', jobType: 'full_time',
    experienceMin: 2, experienceMax: 4, salaryMin: 1400000, salaryMax: 2200000, salaryVisible: true,
    requiredSkills: ['React', 'TypeScript', 'CSS'], preferredSkills: ['Testing Library', 'Accessibility'],
    postedAt: daysAgo(6), applicants: 176, views: 2050, status: 'published', department: 'Engineering', openings: 2, deadline: daysAhead(18),
    description: 'Help clinicians move faster by building interfaces that work at 3am on a hospital workstation.',
    responsibilities: ['Ship accessible, tested React components', 'Work directly with clinical staff on usability', 'Keep bundle size honest'],
    qualifications: ['2+ years of React', 'Care about accessibility', 'Comfortable writing tests'],
    benefits: ['Health cover', 'Hybrid working', 'Learning budget'],
    scores: { skills: 88, experience: 72, location: 55, education: 90, title: 90, preferences: 70 },
    recommendationReason: 'Strong overlap with your React and TypeScript skills.',
  }),
  job({
    id: 'j5', title: 'Data Analyst', companyId: 'c3', location: 'Mumbai', workMode: 'onsite', jobType: 'full_time',
    experienceMin: 1, experienceMax: 3, salaryMin: 900000, salaryMax: 1500000, salaryVisible: true,
    requiredSkills: ['SQL', 'Python', 'Excel'], preferredSkills: ['dbt', 'Looker'],
    postedAt: daysAgo(9), applicants: 340, views: 4200, status: 'published', department: 'Operations', openings: 1, deadline: daysAhead(7),
    description: 'Turn delivery data into decisions the operations team can act on this week.',
    responsibilities: ['Build and maintain operational dashboards', 'Investigate delivery anomalies', 'Partner with ops leads on weekly reviews'],
    qualifications: ['1+ years in analytics', 'Fluent SQL', 'Clear written communication'],
    benefits: ['Health cover', 'Performance bonus'],
    scores: { skills: 42, experience: 60, location: 35, education: 85, title: 30, preferences: 40 },
    recommendationReason: 'Matches your stated interest in analytics roles.',
  }),
  job({
    id: 'j6', title: 'DevOps Engineer', companyId: 'c6', location: 'Chennai', workMode: 'remote', jobType: 'full_time',
    experienceMin: 3, experienceMax: 6, salaryMin: 2000000, salaryMax: 3200000, salaryVisible: true,
    requiredSkills: ['Kubernetes', 'Terraform', 'AWS'], preferredSkills: ['Go', 'Observability'],
    postedAt: daysAgo(3), applicants: 84, views: 1290, status: 'published', department: 'Platform', openings: 1, deadline: daysAhead(25),
    description: 'Own the platform that keeps edge devices talking to the cloud across 40 factories.',
    responsibilities: ['Own our Kubernetes footprint', 'Codify infrastructure in Terraform', 'Build the observability story'],
    qualifications: ['3+ years in platform or SRE roles', 'Production Kubernetes experience', 'Infrastructure as code'],
    benefits: ['Fully remote', 'Hardware budget', 'On-call compensation'],
    scores: { skills: 35, experience: 80, location: 100, education: 85, title: 25, preferences: 78 },
    recommendationReason: 'Remote-first and matches your salary expectation.',
  }),
]

export const jobById = (id: string) => jobs.find((j) => j.id === id)

/* ══════════════════ Applicants (recruiter side) ══════════════════ */

export interface Applicant {
  id: string
  name: string
  headline: string
  jobId: string
  stage: Stage
  score: number
  breakdown: MatchBreakdownItem[]
  meetsHardRequirements: boolean
  matchedSkills: SkillNode[]
  missingSkills: SkillNode[]
  bonusSkills: SkillNode[]
  strengths: string[]
  concerns: string[]
  experienceNarrative: string
  locationNarrative: string
  salaryNarrative: string
  titleNarrative: string
  education: string
  salaryCompatible: boolean
  appliedAgo: string
  totalExperience: number
  assessmentScore?: number
}

function applicant(
  p: Omit<Applicant, 'breakdown' | 'score'> & { scores: Record<string, number> },
): Applicant {
  const { scores, ...rest } = p
  const breakdown = buildBreakdown(scores)
  return { ...rest, breakdown, score: weightedTotal(breakdown) }
}

export const applicants: Applicant[] = [
  applicant({
    id: 'a1', name: 'Ananya Rao', headline: 'Senior Frontend Engineer at Zenith', jobId: 'j1', stage: 'shortlisted',
    scores: { skills: 94, experience: 90, location: 100, education: 92, title: 88, preferences: 86 },
    meetsHardRequirements: true,
    matchedSkills: [{ name: 'React', years: 6, proficiency: 'Expert' }, { name: 'TypeScript', years: 5, proficiency: 'Expert' }, { name: 'Node.js', years: 4, proficiency: 'Advanced' }, { name: 'GraphQL', years: 3, proficiency: 'Advanced' }],
    missingSkills: [],
    bonusSkills: [{ name: 'Next.js', years: 3 }, { name: 'AWS', years: 2 }, { name: 'Playwright', years: 2 }],
    strengths: ['6 years of React with 3 years leading a front-end team', 'All 4 required skills present, plus 3 of 3 preferred', 'Located in Bengaluru — matches the hybrid requirement exactly'],
    concerns: ['No stated experience with the specific data-visualisation libraries in the stack'],
    experienceNarrative: 'Candidate has 6 yrs vs 4–7 yrs required', locationNarrative: 'Bengaluru — exact city match, hybrid-eligible',
    salaryNarrative: 'Expects ₹32L vs ₹24L–₹38L offered — compatible', titleNarrative: 'Current title is a direct match',
    education: 'B.Tech Computer Science, NIT Trichy', salaryCompatible: true, appliedAgo: '2 days ago', totalExperience: 6, assessmentScore: 88,
  }),
  applicant({
    id: 'a2', name: 'Vikram Shetty', headline: 'Full-stack Engineer at Loop Health', jobId: 'j1', stage: 'screening',
    scores: { skills: 82, experience: 85, location: 100, education: 88, title: 78, preferences: 80 },
    meetsHardRequirements: true,
    matchedSkills: [{ name: 'React', years: 5, proficiency: 'Advanced' }, { name: 'TypeScript', years: 4, proficiency: 'Advanced' }, { name: 'Node.js', years: 5, proficiency: 'Expert' }],
    missingSkills: [{ name: 'GraphQL' }],
    bonusSkills: [{ name: 'AWS', years: 3 }, { name: 'Docker', years: 3 }],
    strengths: ['5 years across both front end and back end', 'Strong Node.js background suits our BFF architecture', 'Bengaluru-based'],
    concerns: ['No prior experience with GraphQL — a required skill', 'Most recent work is back-end weighted'],
    experienceNarrative: 'Candidate has 5 yrs vs 4–7 yrs required', locationNarrative: 'Bengaluru — exact city match',
    salaryNarrative: 'Expects ₹30L vs ₹24L–₹38L offered — compatible', titleNarrative: 'Adjacent title, strong overlap',
    education: 'B.E. Information Science, RVCE', salaryCompatible: true, appliedAgo: '3 days ago', totalExperience: 5, assessmentScore: 74,
  }),
  applicant({
    id: 'a3', name: 'Priya Menon', headline: 'Frontend Engineer at Curio', jobId: 'j1', stage: 'assessment',
    scores: { skills: 76, experience: 70, location: 100, education: 85, title: 85, preferences: 72 },
    meetsHardRequirements: true,
    matchedSkills: [{ name: 'React', years: 4, proficiency: 'Advanced' }, { name: 'TypeScript', years: 3, proficiency: 'Intermediate' }, { name: 'GraphQL', years: 2, proficiency: 'Intermediate' }],
    missingSkills: [{ name: 'Node.js' }],
    bonusSkills: [{ name: 'Next.js', years: 2 }],
    strengths: ['4 years of focused React product work', 'GraphQL experience on the client side', 'Design-system contributor at current company'],
    concerns: ['No server-side Node.js experience listed', 'TypeScript depth is intermediate rather than advanced'],
    experienceNarrative: 'Candidate has 4 yrs vs 4–7 yrs required — at the lower bound', locationNarrative: 'Bengaluru — exact city match',
    salaryNarrative: 'Expects ₹26L vs ₹24L–₹38L offered — compatible', titleNarrative: 'Direct title match',
    education: 'B.Sc Computer Science, Christ University', salaryCompatible: true, appliedAgo: '4 days ago', totalExperience: 4, assessmentScore: 91,
  }),
  applicant({
    id: 'a4', name: 'Rahul Deshpande', headline: 'Software Engineer at Tessellate', jobId: 'j1', stage: 'applied',
    scores: { skills: 61, experience: 55, location: 60, education: 82, title: 70, preferences: 58 },
    meetsHardRequirements: true,
    matchedSkills: [{ name: 'React', years: 3, proficiency: 'Intermediate' }, { name: 'TypeScript', years: 2, proficiency: 'Intermediate' }],
    missingSkills: [{ name: 'Node.js' }, { name: 'GraphQL' }],
    bonusSkills: [{ name: 'Vue', years: 2 }],
    strengths: ['3 years of front-end work across two products', 'Has shipped a component library from scratch'],
    concerns: ['Below the 4-year experience floor for this role', 'Missing 2 of 4 required skills', 'Based in Pune — would need relocation for a hybrid role'],
    experienceNarrative: 'Candidate has 3 yrs vs 4–7 yrs required — below range', locationNarrative: 'Pune — outside the hybrid commute zone',
    salaryNarrative: 'Expects ₹22L vs ₹24L–₹38L offered — compatible', titleNarrative: 'Generalist title, partial overlap',
    education: 'B.Tech IT, COEP Pune', salaryCompatible: true, appliedAgo: '5 days ago', totalExperience: 3,
  }),
  applicant({
    id: 'a5', name: 'Sana Qureshi', headline: 'Junior Developer at Brightpath', jobId: 'j1', stage: 'applied',
    scores: { skills: 44, experience: 30, location: 100, education: 78, title: 50, preferences: 62 },
    meetsHardRequirements: false,
    matchedSkills: [{ name: 'React', years: 1, proficiency: 'Beginner' }],
    missingSkills: [{ name: 'TypeScript' }, { name: 'Node.js' }, { name: 'GraphQL' }],
    bonusSkills: [{ name: 'JavaScript', years: 2 }],
    strengths: ['Actively learning — three certifications completed this year', 'Strong written communication in the screening answers'],
    concerns: ['1 year of experience vs a 4-year minimum — fails the hard requirement', 'Missing 3 of 4 required skills'],
    experienceNarrative: 'Candidate has 1 yr vs 4–7 yrs required — fails minimum', locationNarrative: 'Bengaluru — exact city match',
    salaryNarrative: 'Expects ₹9L vs ₹24L–₹38L offered', titleNarrative: 'Junior title, limited overlap',
    education: 'BCA, Bangalore University', salaryCompatible: true, appliedAgo: '6 days ago', totalExperience: 1,
  }),
  applicant({
    id: 'a6', name: 'Karthik Iyer', headline: 'Lead Engineer at Formation', jobId: 'j1', stage: 'interview',
    scores: { skills: 90, experience: 95, location: 85, education: 90, title: 92, preferences: 74 },
    meetsHardRequirements: true,
    matchedSkills: [{ name: 'React', years: 7, proficiency: 'Expert' }, { name: 'TypeScript', years: 6, proficiency: 'Expert' }, { name: 'Node.js', years: 6, proficiency: 'Expert' }, { name: 'GraphQL', years: 4, proficiency: 'Expert' }],
    missingSkills: [],
    bonusSkills: [{ name: 'AWS', years: 5 }, { name: 'Terraform', years: 2 }],
    strengths: ['7 years with 2 years in a lead role', 'All required and 2 of 3 preferred skills present', 'Has run hiring loops before — could help scale the team'],
    concerns: ['Salary expectation sits at the top of the band', 'Currently remote-only; role is hybrid'],
    experienceNarrative: 'Candidate has 7 yrs vs 4–7 yrs required — at the upper bound', locationNarrative: 'Bengaluru — city match, prefers remote',
    salaryNarrative: 'Expects ₹38L vs ₹24L–₹38L offered — at ceiling', titleNarrative: 'Above the posted level',
    education: 'M.Tech Computer Science, IIT Madras', salaryCompatible: true, appliedAgo: '1 week ago', totalExperience: 7, assessmentScore: 95,
  }),
]

/* ══════════════════ Candidate applications ══════════════════ */

export interface Application {
  id: string
  jobId: string
  stage: Stage
  appliedAt: string
  lastUpdate: string
  history: { stage: Stage; at: string; by: string; note?: string }[]
}

export const applications: Application[] = [
  { id: 'ap1', jobId: 'j1', stage: 'interview', appliedAt: daysAgo(12), lastUpdate: daysAgo(1), history: [
    { stage: 'applied', at: daysAgo(12), by: 'You' },
    { stage: 'screening', at: daysAgo(10), by: 'System' },
    { stage: 'shortlisted', at: daysAgo(7), by: 'Meera K · Recruiter', note: 'Strong React depth' },
    { stage: 'assessment', at: daysAgo(5), by: 'Meera K · Recruiter' },
    { stage: 'interview', at: daysAgo(1), by: 'Meera K · Recruiter', note: 'Technical round scheduled' },
  ] },
  { id: 'ap2', jobId: 'j4', stage: 'screening', appliedAt: daysAgo(5), lastUpdate: daysAgo(3), history: [
    { stage: 'applied', at: daysAgo(5), by: 'You' },
    { stage: 'screening', at: daysAgo(3), by: 'System' },
  ] },
  { id: 'ap3', jobId: 'j2', stage: 'assessment', appliedAt: daysAgo(8), lastUpdate: daysAgo(2), history: [
    { stage: 'applied', at: daysAgo(8), by: 'You' },
    { stage: 'screening', at: daysAgo(6), by: 'System' },
    { stage: 'shortlisted', at: daysAgo(4), by: 'Dev P · Recruiter' },
    { stage: 'assessment', at: daysAgo(2), by: 'Dev P · Recruiter', note: 'Design exercise assigned — due in 3 days' },
  ] },
  { id: 'ap4', jobId: 'j3', stage: 'rejected', appliedAt: daysAgo(20), lastUpdate: daysAgo(14), history: [
    { stage: 'applied', at: daysAgo(20), by: 'You' },
    { stage: 'screening', at: daysAgo(18), by: 'System' },
    { stage: 'rejected', at: daysAgo(14), by: 'Anil S · Recruiter', note: 'Looking for stronger FastAPI production experience' },
  ] },
  { id: 'ap5', jobId: 'j6', stage: 'applied', appliedAt: daysAgo(2), lastUpdate: daysAgo(2), history: [
    { stage: 'applied', at: daysAgo(2), by: 'You' },
  ] },
]

/* ══════════════════ Candidate profile ══════════════════ */

export const candidate = {
  id: 'cand-1',
  name: 'Aarav Sharma',
  headline: 'Senior Frontend Engineer',
  location: 'Bengaluru, Karnataka',
  email: 'aarav.sharma@example.com',
  totalExperience: 5,
  profileCompletion: 78,
  skills: [
    { name: 'React', years: 5, proficiency: 'Expert' },
    { name: 'TypeScript', years: 4, proficiency: 'Advanced' },
    { name: 'Node.js', years: 3, proficiency: 'Advanced' },
    { name: 'CSS / Tailwind', years: 5, proficiency: 'Expert' },
    { name: 'Testing Library', years: 3, proficiency: 'Intermediate' },
    { name: 'PostgreSQL', years: 2, proficiency: 'Intermediate' },
  ],
  missingForTarget: ['GraphQL', 'Kubernetes'],
  nextBestAction: {
    label: 'Add 2 more skills to your profile',
    impact: '+12% match quality',
    detail: 'Candidates with 8+ listed skills appear in 3× more recruiter searches.',
  },
  sections: [
    { name: 'Personal details', complete: true },
    { name: 'Professional summary', complete: true },
    { name: 'Skills', complete: true },
    { name: 'Work experience', complete: true },
    { name: 'Education', complete: true },
    { name: 'Certifications', complete: false },
    { name: 'Projects', complete: false },
    { name: 'Languages', complete: true },
  ],
}

/* ══════════════════ Interviews, notifications, KPIs ══════════════════ */

export const interviews = [
  { id: 'i1', jobId: 'j1', stage: 'technical_interview' as Stage, at: daysAhead(2), duration: 60, interviewers: ['Meera Krishnan', 'Sanjay Bose'], mode: 'Google Meet', status: 'confirmed' as const },
  { id: 'i2', jobId: 'j2', stage: 'interview' as Stage, at: daysAhead(5), duration: 45, interviewers: ['Devika Pillai'], mode: 'Google Meet', status: 'scheduled' as const },
]

export const notifications = [
  { id: 'n1', type: 'interview', title: 'Technical interview scheduled', body: 'Northwind Labs · Senior React Developer · in 2 days', at: daysAgo(0.05), read: false },
  { id: 'n2', type: 'assessment', title: 'Assessment due in 3 days', body: 'Verdant Studio · Product Designer design exercise', at: daysAgo(0.4), read: false },
  { id: 'n3', type: 'match', title: '6 new job matches', body: 'Based on your React and TypeScript experience', at: daysAgo(1), read: true },
  { id: 'n4', type: 'stage', title: 'Application moved to Screening', body: 'Meridian Health · Frontend Engineer', at: daysAgo(3), read: true },
]

export const recruiterKpis = {
  needsAttention: [
    { id: 'na1', label: '12 new applicants', detail: 'Senior React Developer', tone: 'brand' as const, href: '/recruiter/jobs/j1/applicants' },
    { id: 'na2', label: '3 interview feedbacks overdue', detail: 'Blocking 3 pipeline moves', tone: 'danger' as const, href: '/recruiter/interviews' },
    { id: 'na3', label: '2 interviews today', detail: '11:00 and 15:30', tone: 'accent' as const, href: '/recruiter/interviews' },
    { id: 'na4', label: '1 job expires in 3 days', detail: 'Data Analyst · Mumbai', tone: 'warning' as const, href: '/recruiter/jobs' },
  ],
  funnel: [
    { stage: 'Applied', count: 148 },
    { stage: 'Screening', count: 92 },
    { stage: 'Shortlisted', count: 41 },
    { stage: 'Assessment', count: 24 },
    { stage: 'Interview', count: 12 },
    { stage: 'Offer', count: 4 },
    { stage: 'Hired', count: 2 },
  ],
  stats: [
    { label: 'Active jobs', value: 14, delta: +2, hint: 'vs last month' },
    { label: 'Applicants this week', value: 312, delta: +48, hint: 'vs last week' },
    { label: 'Avg. time to shortlist', value: '1.4 days', delta: -0.6, hint: 'was 2.0 days' },
    { label: 'Interview → offer', value: '33%', delta: +5, hint: 'vs last quarter' },
  ],
}

export const adminKpis = {
  stats: [
    { label: 'Daily active users', value: '18.4k', delta: +6 },
    { label: 'Jobs published', value: '4,281', delta: +112 },
    { label: 'Applications', value: '146k', delta: +8 },
    { label: 'Companies', value: '892', delta: +14 },
    { label: 'Hires to date', value: '3,104', delta: +47 },
    { label: 'AI calls / day', value: '92.1k', delta: +11 },
  ],
  queues: [
    { label: 'Jobs awaiting moderation', count: 23, tone: 'warning' as const },
    { label: 'Company verifications', count: 8, tone: 'brand' as const },
    { label: 'Abuse reports', count: 4, tone: 'danger' as const },
    { label: 'Support tickets breaching SLA', count: 2, tone: 'danger' as const },
  ],
  aiHealth: [
    { label: 'Resume parse success', value: 96.4, target: 95, unit: '%' },
    { label: 'JD generation accepted', value: 71.2, target: 60, unit: '%' },
    { label: 'Match sampling agreement', value: 84.0, target: 80, unit: '%' },
    { label: 'AI p95 latency', value: 1.8, target: 3, unit: 's' },
  ],
}

/* ══════════════════ Filter facets ══════════════════ */

export const facets = {
  workMode: [
    { value: 'remote', label: 'Remote', count: 412 },
    { value: 'hybrid', label: 'Hybrid', count: 688 },
    { value: 'onsite', label: 'On-site', count: 934 },
  ],
  jobType: [
    { value: 'full_time', label: 'Full time', count: 1740 },
    { value: 'contract', label: 'Contract', count: 186 },
    { value: 'internship', label: 'Internship', count: 94 },
    { value: 'part_time', label: 'Part time', count: 34 },
  ],
  experience: [
    { value: '0-2', label: '0–2 years', count: 520 },
    { value: '2-5', label: '2–5 years', count: 918 },
    { value: '5-8', label: '5–8 years', count: 441 },
    { value: '8+', label: '8+ years', count: 155 },
  ],
  datePosted: [
    { value: '1', label: 'Last 24 hours', count: 87 },
    { value: '7', label: 'Last 7 days', count: 604 },
    { value: '30', label: 'Last 30 days', count: 1611 },
  ],
  topSkills: ['React', 'TypeScript', 'Python', 'Node.js', 'SQL', 'AWS', 'Figma', 'Kubernetes'],
}

/** Salary histogram for the range slider — DESIGN.md §7.8 */
export const salaryHistogram = [4, 9, 18, 31, 44, 52, 47, 38, 29, 21, 14, 9, 6, 3, 2, 1]

export const categories = [
  { name: 'Engineering', count: 1284, hue: 220 },
  { name: 'Design', count: 312, hue: 265 },
  { name: 'Data & Analytics', count: 486, hue: 190 },
  { name: 'Product', count: 268, hue: 25 },
  { name: 'Marketing', count: 401, hue: 340 },
  { name: 'Operations', count: 356, hue: 150 },
]
