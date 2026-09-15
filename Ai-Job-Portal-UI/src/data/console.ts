/**
 * Fixtures for the candidate / recruiter / admin consoles.
 * Kept separate from mock.ts purely for file size — same schema
 * discipline, still mirroring PRD Part 29.
 */

import { recruiterKpis } from './mock'
import type { Stage } from '@/lib/pipeline'

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()
const daysAhead = (n: number) => new Date(Date.now() + n * 86400000).toISOString()

/* ══════════════════ Candidate ══════════════════ */

export type ParseStatus = 'processing' | 'parsed' | 'failed'

export interface Resume {
  /** For an uploaded file: which parse fixture stands in for its contents. */
  parseId?: string
  id: string
  label: string
  fileName: string
  sizeKb: number
  status: ParseStatus
  isPrimary: boolean
  uploadedAt: string
  fieldsRead: number
  fieldsTotal: number
  failureReason?: string
}

export const resumes: Resume[] = [
  { id: 'r1', label: 'General — frontend', fileName: 'aarav-sharma-frontend.pdf', sizeKb: 214, status: 'parsed', isPrimary: true, uploadedAt: daysAgo(20), fieldsRead: 12, fieldsTotal: 12 },
  { id: 'r2', label: 'Tailored — design systems', fileName: 'aarav-design-systems.pdf', sizeKb: 198, status: 'parsed', isPrimary: false, uploadedAt: daysAgo(9), fieldsRead: 11, fieldsTotal: 12 },
  { id: 'r3', label: 'Old — 2024', fileName: 'resume-2024-final-v3.docx', sizeKb: 402, status: 'failed', isPrimary: false, uploadedAt: daysAgo(63), fieldsRead: 3, fieldsTotal: 12, failureReason: 'Two-column layout — the parser could not separate sections reliably.' },
  { id: 'r4', label: 'Draft', fileName: 'aarav-2026-draft.pdf', sizeKb: 187, status: 'processing', isPrimary: false, uploadedAt: daysAgo(0.02), fieldsRead: 4, fieldsTotal: 12 },
]

export interface JobAlert {
  id: string
  keywords: string
  location: string
  skills: string[]
  salaryMin: number
  workMode: string
  frequency: 'instant' | 'daily' | 'weekly'
  active: boolean
  newMatches: number
  lastRun: string
  hits: { jobId: string; at: string }[]
}

export const jobAlerts: JobAlert[] = [
  { id: 'al1', keywords: 'React', location: 'Bengaluru', skills: ['React', 'TypeScript'], salaryMin: 1800000, workMode: 'Remote or hybrid', frequency: 'daily', active: true, newMatches: 3, lastRun: daysAgo(0.3), hits: [{ jobId: 'j1', at: daysAgo(2) }, { jobId: 'j4', at: daysAgo(6) }] },
  { id: 'al2', keywords: 'Design systems', location: 'Anywhere', skills: ['Figma'], salaryMin: 1500000, workMode: 'Remote', frequency: 'weekly', active: true, newMatches: 1, lastRun: daysAgo(1.2), hits: [{ jobId: 'j2', at: daysAgo(1) }] },
  { id: 'al3', keywords: 'Staff engineer', location: 'Bengaluru', skills: ['React', 'Node.js'], salaryMin: 4000000, workMode: 'Any', frequency: 'instant', active: false, newMatches: 0, lastRun: daysAgo(14), hits: [] },
]

export const notificationFeed = [
  { id: 'n1', type: 'interview', title: 'Technical interview scheduled', body: 'Northwind Labs · Senior React Developer · Wed 15:30 IST', at: daysAgo(0.05), read: false },
  { id: 'n2', type: 'assessment', title: 'Assessment due in 3 days', body: 'Verdant Studio · design exercise · 90 minutes, one attempt', at: daysAgo(0.4), read: false },
  { id: 'n3', type: 'match', title: '6 new job matches', body: 'Based on your React and TypeScript experience', at: daysAgo(1), read: true, batched: 6 },
  { id: 'n4', type: 'message', title: 'Meera Krishnan replied', body: '“Wednesday 15:30 IST it is — invitation sent.”', at: daysAgo(1), read: true },
  { id: 'n5', type: 'stage', title: 'Application moved to Screening', body: 'Meridian Health · Frontend Engineer', at: daysAgo(3), read: true },
  { id: 'n6', type: 'alert', title: 'Job alert: 3 new matches', body: '“React · Bengaluru · above ₹18L” — daily digest', at: daysAgo(3.4), read: true, batched: 3 },
  { id: 'n7', type: 'stage', title: 'Not moved forward', body: 'Cobalt Financial · Backend Engineer — reason given', at: daysAgo(14), read: true },
  { id: 'n8', type: 'system', title: 'Resume parsed successfully', body: '12 of 12 fields read from aarav-sharma-frontend.pdf', at: daysAgo(20), read: true },
]

export const recruiterNotificationFeed = [
  { id: 'rn1', type: 'applicant', title: '12 new applicants', body: 'Senior React Developer · since yesterday', at: daysAgo(0.06), read: false, batched: 12 },
  { id: 'rn2', type: 'feedback', title: 'Interview feedback overdue', body: 'Priya Menon · interviewed 1 day ago · blocking her stage move', at: daysAgo(0.5), read: false },
  { id: 'rn3', type: 'moderation', title: 'Job approved', body: 'Frontend Engineer · now live', at: daysAgo(1), read: true },
  { id: 'rn4', type: 'message', title: 'Aarav Sharma replied', body: '“Wednesday or Thursday after 3pm works well.”', at: daysAgo(2.6), read: true },
  { id: 'rn5', type: 'assessment', title: '7 assessments awaiting review', body: 'Front-end engineering · written answers need a human', at: daysAgo(3), read: true, batched: 7 },
  { id: 'rn6', type: 'subscription', title: 'Seat limit reached', body: 'Growth plan · 5 of 5 seats used', at: daysAgo(6), read: true },
]

/* ══════════════════ Messaging (PRD Part 26) ══════════════════ */

export interface Message {
  id: string
  from: 'candidate' | 'recruiter'
  body: string
  at: string
  readAt?: string
  attachment?: { type: 'resume'; fileName: string }
}

export interface Conversation {
  id: string
  jobId: string
  candidateName: string
  candidateId: string
  recruiterName: string
  company: string
  unread: number
  messages: Message[]
}

export const conversations: Conversation[] = [
  {
    id: 'cv1', jobId: 'j1', candidateName: 'Aarav Sharma', candidateId: 'a1', recruiterName: 'Meera Krishnan', company: 'Northwind Labs', unread: 1,
    messages: [
      { id: 'm1', from: 'recruiter', body: 'Hi Aarav — thanks for applying. Your React depth stood out, particularly the component library work. Would you be free for a 45-minute technical conversation this week?', at: daysAgo(3) },
      { id: 'm2', from: 'candidate', body: 'Thanks Meera. Wednesday or Thursday after 3pm works well for me.', at: daysAgo(2.6), readAt: daysAgo(2.5), attachment: { type: 'resume', fileName: 'aarav-sharma-frontend.pdf' } },
      { id: 'm3', from: 'recruiter', body: "Wednesday 15:30 IST it is — invitation sent. Sanjay from the platform team will join. Nothing to prepare; we'll talk through a problem you've actually solved.", at: daysAgo(1) },
    ],
  },
  {
    id: 'cv2', jobId: 'j2', candidateName: 'Aarav Sharma', candidateId: 'a1', recruiterName: 'Devika Pillai', company: 'Verdant Studio', unread: 0,
    messages: [
      { id: 'm4', from: 'recruiter', body: 'Hi Aarav — the design exercise is assigned and due in 3 days. Take the full time; we score the reasoning, not the pixels.', at: daysAgo(2) },
      { id: 'm5', from: 'candidate', body: 'Understood, thank you. Is there a preferred file format?', at: daysAgo(1.8), readAt: daysAgo(1.7) },
      { id: 'm6', from: 'recruiter', body: 'PDF or a Figma link, whichever suits you.', at: daysAgo(1.7) },
    ],
  },
  {
    id: 'cv3', jobId: 'j4', candidateName: 'Aarav Sharma', candidateId: 'a1', recruiterName: 'Anil Suresh', company: 'Meridian Health', unread: 0,
    messages: [
      { id: 'm7', from: 'recruiter', body: 'Your application has moved to screening. We review in batches on Mondays — you will hear either way.', at: daysAgo(3) },
    ],
  },
]

/* ══════════════════ Company team (PRD Part 9 / 23) ══════════════════ */

export type CompanyRole = 'owner' | 'admin' | 'recruiter' | 'hiring_manager' | 'viewer'

export interface TeamMember {
  id: string
  name: string
  email: string
  role: CompanyRole
  jobsOwned: number
  lastActive: string
  status: 'active' | 'invited'
}

export const teamMembers: TeamMember[] = [
  { id: 't1', name: 'Meera Krishnan', email: 'meera@northwind.example', role: 'owner', jobsOwned: 6, lastActive: daysAgo(0.02), status: 'active' },
  { id: 't2', name: 'Sanjay Bose', email: 'sanjay@northwind.example', role: 'hiring_manager', jobsOwned: 3, lastActive: daysAgo(0.4), status: 'active' },
  { id: 't3', name: 'Nikita Rane', email: 'nikita@northwind.example', role: 'recruiter', jobsOwned: 5, lastActive: daysAgo(1), status: 'active' },
  { id: 't4', name: 'Imran Qadri', email: 'imran@northwind.example', role: 'admin', jobsOwned: 0, lastActive: daysAgo(2), status: 'active' },
  { id: 't5', name: 'Leela Nair', email: 'leela@northwind.example', role: 'viewer', jobsOwned: 0, lastActive: daysAgo(9), status: 'active' },
  { id: 't6', name: 'Rohan Das', email: 'rohan@northwind.example', role: 'recruiter', jobsOwned: 0, lastActive: daysAgo(0), status: 'invited' },
]

export const ROLE_LABEL: Record<CompanyRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  recruiter: 'Recruiter',
  hiring_manager: 'Hiring manager',
  viewer: 'Viewer',
}

/** PRD Part 9.2 — what each company role may do. */
export const PERMISSION_MATRIX: {
  module: string
  owner: string
  admin: string
  recruiter: string
  hiring_manager: string
  viewer: string
}[] = [
  { module: 'Jobs', owner: 'CRUD', admin: 'CRUD', recruiter: 'CRUD', hiring_manager: 'Read / comment', viewer: 'Read' },
  { module: 'Applications', owner: 'Read all', admin: 'Read all', recruiter: 'Update stage', hiring_manager: 'Read / comment', viewer: 'Read' },
  { module: 'Candidate DB search', owner: 'Read', admin: 'Read', recruiter: 'Per plan limits', hiring_manager: 'Read', viewer: '—' },
  { module: 'Assessments', owner: 'View results', admin: 'Create / grade', recruiter: 'Create / grade', hiring_manager: 'View results', viewer: '—' },
  { module: 'Interviews', owner: 'View', admin: 'Schedule', recruiter: 'Schedule / feedback', hiring_manager: 'Feedback', viewer: '—' },
  { module: 'Company profile', owner: 'CRUD', admin: 'CRUD', recruiter: 'Read', hiring_manager: 'Read', viewer: 'Read' },
  { module: 'Team management', owner: 'CRUD', admin: 'CRUD', recruiter: '—', hiring_manager: '—', viewer: '—' },
  { module: 'Billing', owner: 'CRUD', admin: 'CRUD', recruiter: 'Read', hiring_manager: '—', viewer: '—' },
  { module: 'Audit log', owner: 'Company-scoped', admin: 'Company-scoped', recruiter: '—', hiring_manager: '—', viewer: '—' },
]

/* ══════════════════ Assessments (PRD Part 20) ══════════════════ */

export interface AssessmentSummary {
  id: string
  title: string
  jobId: string | null
  questions: number
  timeLimit: number
  passMark: number
  attempts: number
  avgScore: number
  passRate: number
  awaitingReview: number
}

export const assessments: AssessmentSummary[] = [
  { id: 'as1', title: 'Front-end engineering', jobId: 'j1', questions: 6, timeLimit: 45, passMark: 60, attempts: 41, avgScore: 71, passRate: 68, awaitingReview: 7 },
  { id: 'as2', title: 'Design systems exercise', jobId: 'j2', questions: 4, timeLimit: 90, passMark: 55, attempts: 18, avgScore: 64, passRate: 61, awaitingReview: 3 },
  { id: 'as3', title: 'Backend fundamentals', jobId: 'j3', questions: 8, timeLimit: 60, passMark: 65, attempts: 63, avgScore: 58, passRate: 44, awaitingReview: 0 },
]

export const questionDifficulty = [
  { q: 'Q1 · Re-render cause', correct: 88 },
  { q: 'Q2 · Layout reflow', correct: 41 },
  { q: 'Q3 · unknown vs any', correct: 72 },
  { q: 'Q4 · Library ownership', correct: 95 },
  { q: 'Q5 · TypeScript years', correct: 99 },
  { q: 'Q6 · Written answer', correct: 0 },
]

export const scoreDistribution = [1, 2, 4, 6, 9, 12, 8, 5, 3, 1]

/* ══════════════════ Interviews (recruiter side) ══════════════════ */

export interface InterviewSlot {
  id: string
  candidateName: string
  candidateId: string
  jobId: string
  stage: Stage
  at: string
  duration: number
  interviewers: string[]
  status: 'scheduled' | 'confirmed' | 'awaiting_feedback' | 'completed' | 'cancelled'
  feedbackDue?: boolean
}

export const recruiterInterviews: InterviewSlot[] = [
  { id: 'iv1', candidateName: 'Ananya Rao', candidateId: 'a1', jobId: 'j1', stage: 'technical_interview', at: daysAhead(0.1), duration: 60, interviewers: ['Meera Krishnan', 'Sanjay Bose'], status: 'confirmed' },
  { id: 'iv2', candidateName: 'Karthik Iyer', candidateId: 'a6', jobId: 'j1', stage: 'hr_interview', at: daysAhead(0.3), duration: 45, interviewers: ['Meera Krishnan'], status: 'confirmed' },
  { id: 'iv3', candidateName: 'Priya Menon', candidateId: 'a3', jobId: 'j1', stage: 'interview', at: daysAgo(1), duration: 45, interviewers: ['Nikita Rane'], status: 'awaiting_feedback', feedbackDue: true },
  { id: 'iv4', candidateName: 'Vikram Shetty', candidateId: 'a2', jobId: 'j1', stage: 'interview', at: daysAgo(2), duration: 45, interviewers: ['Sanjay Bose'], status: 'awaiting_feedback', feedbackDue: true },
  { id: 'iv5', candidateName: 'Rahul Deshpande', candidateId: 'a4', jobId: 'j1', stage: 'interview', at: daysAhead(2.2), duration: 45, interviewers: ['Meera Krishnan'], status: 'scheduled' },
]

/* ══════════════════ Analytics ══════════════════ */

export const analytics = {
  funnel: recruiterKpis.funnel,
  timeToHire: [26, 24, 25, 21, 22, 19, 18, 18, 17, 16, 18, 15],
  sourceOfHire: [
    { source: 'Kairo search', count: 42 },
    { source: 'Direct apply', count: 31 },
    { source: 'Referral', count: 14 },
    { source: 'Career page', count: 9 },
  ],
  perJob: [
    { jobId: 'j1', applicants: 148, shortlisted: 41, interviewed: 12, offers: 4, hires: 2, days: 18 },
    { jobId: 'j2', applicants: 92, shortlisted: 22, interviewed: 8, offers: 2, hires: 1, days: 24 },
    { jobId: 'j3', applicants: 211, shortlisted: 38, interviewed: 11, offers: 3, hires: 2, days: 31 },
    { jobId: 'j4', applicants: 176, shortlisted: 29, interviewed: 9, offers: 2, hires: 1, days: 27 },
  ],
  rates: [
    { label: 'Applicant → shortlist', value: 27, prev: 22 },
    { label: 'Shortlist → interview', value: 34, prev: 31 },
    { label: 'Interview → offer', value: 33, prev: 28 },
    { label: 'Offer → accepted', value: 71, prev: 74 },
  ],
}

/* ══════════════════ Billing (PRD Part 47) ══════════════════ */

export const billing = {
  plan: 'Growth',
  renews: daysAhead(19),
  amount: 9600,
  usage: [
    { label: 'Live job posts', used: 6, limit: 15 },
    { label: 'Candidate unlocks', used: 14, limit: 50 },
    { label: 'Team seats', used: 5, limit: 5 },
    { label: 'Assessments created', used: 3, limit: null as number | null },
  ],
  invoices: [
    { id: 'INV-2026-08', period: 'Aug 2026', amount: 9600, status: 'paid' as const, issued: daysAgo(2) },
    { id: 'INV-2026-07', period: 'Jul 2026', amount: 9600, status: 'paid' as const, issued: daysAgo(32) },
    { id: 'INV-2026-06', period: 'Jun 2026', amount: 9600, status: 'paid' as const, issued: daysAgo(62) },
    { id: 'INV-2026-05', period: 'May 2026', amount: -4800, status: 'refunded' as const, issued: daysAgo(92) },
  ],
}

/* ══════════════════ Admin ══════════════════ */

export type PlatformRole =
  | 'candidate' | 'recruiter' | 'company_admin' | 'platform_admin' | 'support_agent'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: PlatformRole
  status: 'active' | 'suspended' | 'pending'
  company?: string
  joined: string
  lastActive: string
  applications?: number
  profilePct?: number
  parseFailed?: boolean
}

export const adminUsers: AdminUser[] = [
  { id: 'u1', name: 'Aarav Sharma', email: 'aarav.sharma@example.com', role: 'candidate', status: 'active', joined: daysAgo(64), lastActive: daysAgo(0.02), applications: 5, profilePct: 78 },
  { id: 'u2', name: 'Meera Krishnan', email: 'meera@northwind.example', role: 'company_admin', status: 'active', company: 'Northwind Labs', joined: daysAgo(210), lastActive: daysAgo(0.1) },
  { id: 'u3', name: 'Ananya Rao', email: 'ananya.rao@example.com', role: 'candidate', status: 'active', joined: daysAgo(120), lastActive: daysAgo(2), applications: 11, profilePct: 96 },
  { id: 'u4', name: 'Nikita Rane', email: 'nikita@northwind.example', role: 'recruiter', status: 'active', company: 'Northwind Labs', joined: daysAgo(88), lastActive: daysAgo(1) },
  { id: 'u5', name: 'Sana Qureshi', email: 'sana.q@example.com', role: 'candidate', status: 'active', joined: daysAgo(18), lastActive: daysAgo(6), applications: 3, profilePct: 41, parseFailed: true },
  { id: 'u6', name: 'Deepak Varma', email: 'deepak@foldferry.example', role: 'recruiter', status: 'suspended', company: 'Fold & Ferry', joined: daysAgo(45), lastActive: daysAgo(12) },
  { id: 'u7', name: 'Priya Menon', email: 'priya.menon@example.com', role: 'candidate', status: 'active', joined: daysAgo(200), lastActive: daysAgo(4), applications: 8, profilePct: 84 },
  { id: 'u8', name: 'Support Desk', email: 'support@kairo.example', role: 'support_agent', status: 'active', joined: daysAgo(300), lastActive: daysAgo(0.5) },
  { id: 'u9', name: 'Vikram Shetty', email: 'vikram.s@example.com', role: 'candidate', status: 'active', joined: daysAgo(75), lastActive: daysAgo(3), applications: 6, profilePct: 88 },
  { id: 'u10', name: 'Rhea Kapoor', email: 'rhea@cobalt.example', role: 'recruiter', status: 'pending', company: 'Cobalt Financial', joined: daysAgo(1), lastActive: daysAgo(1) },
]

export interface ModerationItem {
  id: string
  jobId: string
  company: string
  submitted: string
  flags: { kind: 'language' | 'salary' | 'duplicate'; detail: string }[]
}

export const moderationQueue: ModerationItem[] = [
  { id: 'mq1', jobId: 'j5', company: 'Fold & Ferry', submitted: daysAgo(0.2), flags: [{ kind: 'salary', detail: 'Salary band is 46% below the median for this title and city.' }] },
  { id: 'mq2', jobId: 'j3', company: 'Cobalt Financial', submitted: daysAgo(0.4), flags: [] },
  { id: 'mq3', jobId: 'j6', company: 'Arclight Systems', submitted: daysAgo(0.9), flags: [{ kind: 'language', detail: 'Phrase “young and dynamic team” may indicate age preference — PRD Part 13.2 banned-term check.' }, { kind: 'duplicate', detail: 'Near-identical to a posting from the same company 6 days ago.' }] },
  { id: 'mq4', jobId: 'j4', company: 'Meridian Health', submitted: daysAgo(1.4), flags: [] },
]

export interface VerificationItem {
  id: string
  companyId: string
  domain: string
  documentName: string
  submitted: string
  domainMatch: boolean
  gstPresent: boolean
}

export const verificationQueue: VerificationItem[] = [
  { id: 'vq1', companyId: 'c3', domain: 'foldferry.example', documentName: 'incorporation-certificate.pdf', submitted: daysAgo(1), domainMatch: true, gstPresent: true },
  { id: 'vq2', companyId: 'c6', domain: 'arclight-systems.example', documentName: 'gst-registration.pdf', submitted: daysAgo(2.5), domainMatch: false, gstPresent: true },
]

export interface AbuseReport {
  id: string
  entityType: 'job' | 'company' | 'user' | 'message'
  entityLabel: string
  reason: string
  detail: string
  reportedBy: string
  at: string
  status: 'open' | 'resolved' | 'dismissed'
}

export const abuseReports: AbuseReport[] = [
  { id: 'rp1', entityType: 'job', entityLabel: 'Data Analyst · Fold & Ferry', reason: 'Misleading salary', detail: 'Listing says ₹9–15L but the recruiter quoted ₹6L in the screening call.', reportedBy: 'Priya Menon', at: daysAgo(0.3), status: 'open' },
  { id: 'rp2', entityType: 'message', entityLabel: 'Conversation cv3', reason: 'Requested payment', detail: 'Recruiter asked for a ₹2,000 “processing fee” before interview.', reportedBy: 'Sana Qureshi', at: daysAgo(0.8), status: 'open' },
  { id: 'rp3', entityType: 'company', entityLabel: 'Fold & Ferry', reason: 'Fake company', detail: 'Website resolves to a parked domain.', reportedBy: 'Vikram Shetty', at: daysAgo(2), status: 'open' },
  { id: 'rp4', entityType: 'job', entityLabel: 'Backend Engineer · Cobalt Financial', reason: 'Duplicate posting', detail: 'Same role listed four times this month.', reportedBy: 'Ananya Rao', at: daysAgo(4), status: 'resolved' },
]

export type TicketPriority = 'urgent' | 'high' | 'normal' | 'low'

export interface Ticket {
  id: string
  subject: string
  category: string
  priority: TicketPriority
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  raisedBy: string
  assignedTo: string | null
  createdAt: string
  slaHours: number
  firstResponseHours: number | null
  thread: { from: 'user' | 'agent'; body: string; at: string }[]
}

export const tickets: Ticket[] = [
  {
    id: 'TK-1042', subject: 'My resume keeps failing to parse', category: 'Resume parsing', priority: 'high', status: 'in_progress',
    raisedBy: 'Sana Qureshi', assignedTo: 'Support Desk', createdAt: daysAgo(0.6), slaHours: 8, firstResponseHours: 1.2,
    thread: [
      { from: 'user', body: 'I have uploaded my CV three times and it always says failed. It is a normal PDF.', at: daysAgo(0.6) },
      { from: 'agent', body: 'Thanks for flagging. Your file uses a two-column layout, which our parser struggles with. I have raised it with the AI team. In the meantime you can fill the fields in manually — nothing you have entered is lost.', at: daysAgo(0.55) },
    ],
  },
  {
    id: 'TK-1041', subject: 'Appealing a screening outcome', category: 'AI / screening', priority: 'urgent', status: 'open',
    raisedBy: 'Rahul Deshpande', assignedTo: null, createdAt: daysAgo(0.9), slaHours: 4, firstResponseHours: null,
    thread: [
      { from: 'user', body: 'I was marked below minimum requirements for a role, but I do have 4 years of experience — my profile shows 3 because one contract role is missing. Can a person review this?', at: daysAgo(0.9) },
    ],
  },
  {
    id: 'TK-1039', subject: 'Cannot invite a fifth team member', category: 'Billing', priority: 'normal', status: 'open',
    raisedBy: 'Meera Krishnan', assignedTo: 'Support Desk', createdAt: daysAgo(1.6), slaHours: 24, firstResponseHours: 3.1,
    thread: [{ from: 'user', body: 'We are on Growth with 5 seats but the invite button is disabled.', at: daysAgo(1.6) }],
  },
  {
    id: 'TK-1036', subject: 'Delete my account and all data', category: 'Privacy', priority: 'high', status: 'resolved',
    raisedBy: 'Former candidate', assignedTo: 'Support Desk', createdAt: daysAgo(5), slaHours: 8, firstResponseHours: 0.8,
    thread: [
      { from: 'user', body: 'Please delete my account under my data rights.', at: daysAgo(5) },
      { from: 'agent', body: 'Done — account soft-deleted, scheduled for hard purge in 30 days, and active applications marked withdrawn. Confirmation emailed.', at: daysAgo(4.9) },
    ],
  },
]

export interface AuditEntry {
  id: string
  actor: string
  action: string
  entityType: string
  entityId: string
  at: string
  ip: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
}

export const auditLog: AuditEntry[] = [
  { id: 'ae1', actor: 'meera@northwind.example', action: 'application.stage_change', entityType: 'application', entityId: 'ap1', at: daysAgo(0.05), ip: '103.21.58.4', before: { status: 'assessment' }, after: { status: 'interview', reason: 'Strong assessment score' } },
  { id: 'ae2', actor: 'admin@kairo.example', action: 'job.approve', entityType: 'job', entityId: 'j4', at: daysAgo(0.1), ip: '10.0.4.19', before: { status: 'pending_review' }, after: { status: 'published' } },
  { id: 'ae3', actor: 'system', action: 'match.recompute', entityType: 'candidate_matches', entityId: 'batch-8841', at: daysAgo(0.3), ip: '—', before: null, after: { pairs: 12480, durationMs: 41200 } },
  { id: 'ae4', actor: 'admin@kairo.example', action: 'company.verify', entityType: 'company', entityId: 'c2', at: daysAgo(0.8), ip: '10.0.4.19', before: { verification_status: 'pending' }, after: { verification_status: 'verified', reviewed_by: 'admin@kairo.example' } },
  { id: 'ae5', actor: 'nikita@northwind.example', action: 'candidate.unlock', entityType: 'candidate', entityId: 'a3', at: daysAgo(1.1), ip: '103.21.58.9', before: { unlocks_used: 13 }, after: { unlocks_used: 14 } },
  { id: 'ae6', actor: 'admin@kairo.example', action: 'user.suspend', entityType: 'user', entityId: 'u6', at: daysAgo(2), ip: '10.0.4.19', before: { status: 'active' }, after: { status: 'suspended', reason: 'Payment solicitation reported by two candidates' } },
  { id: 'ae7', actor: 'aarav.sharma@example.com', action: 'profile.update', entityType: 'candidate', entityId: 'cand-1', at: daysAgo(3), ip: '49.207.11.2', before: { total_experience_years: 4 }, after: { total_experience_years: 5 } },
]

export const aiMonitoring = {
  parseSeries: [94.1, 95.2, 94.8, 96.0, 95.4, 96.4, 96.2, 96.9, 96.4],
  jdAcceptSeries: [58, 61, 64, 63, 68, 70, 69, 72, 71],
  latencySeries: [2.4, 2.2, 2.3, 2.0, 1.9, 2.1, 1.8, 1.7, 1.8],
  failures: [
    { kind: 'Parse failure', count: 41, share: 3.6, note: 'Two-column and image-heavy CVs dominate. Degrades to manual entry.' },
    { kind: 'JD generation timeout', count: 6, share: 0.4, note: 'Falls back to manual entry — never blocks the recruiter.' },
    { kind: 'Match recompute retry', count: 12, share: 0.1, note: 'Retried with backoff; no user-visible effect.' },
  ],
  /** PRD Part 45 — score parity across anonymised profile variants. */
  biasParity: [
    { pair: 'Name origin A vs B', delta: 0.4, threshold: 2 },
    { pair: 'Gendered name variants', delta: 0.2, threshold: 2 },
    { pair: 'Tier-1 vs tier-2 university', delta: 1.8, threshold: 2 },
    { pair: 'Employment gap present', delta: 1.1, threshold: 2 },
  ],
}

export const featureFlags = [
  { key: 'semantic_search', label: 'Semantic (vector) search', env: 'dev' as const, on: true, note: 'pgvector — PRD Part 22 future' },
  { key: 'video_interviews', label: 'Native video interviews', env: 'dev' as const, on: false, note: 'V3 — out of MVP scope' },
  { key: 'coding_assessments', label: 'Coding questions with test runner', env: 'staging' as const, on: true, note: 'V1.1' },
  { key: 'configurable_stages', label: 'Company-configurable pipeline stages', env: 'prod' as const, on: true, note: 'V1.1' },
  { key: 'learning_to_rank', label: 'Learning-to-rank from recruiter feedback', env: 'dev' as const, on: false, note: 'V2 — needs a bias review first' },
  { key: 'payment_gateway', label: 'Live payment gateway', env: 'dev' as const, on: false, note: 'Provider not selected (PRD Part 47)' },
]

export const systemSettings = [
  { group: 'Matching', items: [
    { key: 'Nightly recompute window', value: '02:00–04:00 IST' },
    { key: 'Match score cache TTL', value: '24 hours' },
    { key: 'Minimum profile completeness to rank', value: '35%' },
  ] },
  { group: 'Uploads', items: [
    { key: 'Max resume size', value: '5 MB' },
    { key: 'Accepted resume types', value: 'pdf, doc, docx' },
    { key: 'Signed URL lifetime', value: '10 minutes' },
  ] },
  { group: 'Retention', items: [
    { key: 'Soft-delete grace period', value: '30 days' },
    { key: 'Inactive account purge', value: '24 months' },
    { key: 'Audit log retention', value: 'Indefinite (append-only)' },
  ] },
  { group: 'Rate limits', items: [
    { key: 'Auth endpoints', value: '10 / minute / IP' },
    { key: 'Search endpoints', value: '60 / minute / user' },
    { key: 'AI generation', value: '20 / hour / company' },
  ] },
]

/* ══════════════════ ATS analysis (C4 — resume screen) ══════════════════ */

export type AtsSeverity = 'critical' | 'warning' | 'pass'

export interface AtsCheck {
  id: string
  category: 'Parsing' | 'Content' | 'Keywords' | 'Formatting'
  label: string
  score: number
  weight: number
  severity: AtsSeverity
  detail: string
  fix?: string
}

export interface AtsReport {
  resumeId: string
  overall: number
  checks: AtsCheck[]
  /** Keyword coverage against a chosen job. */
  keywords: { term: string; inResume: boolean; inJob: boolean; count: number }[]
  wordCount: number
  readingLevel: string
  pages: number
}

export const atsReports: Record<string, AtsReport> = {
  r1: {
    resumeId: 'r1',
    overall: 82,
    wordCount: 612,
    readingLevel: 'Clear · grade 9',
    pages: 2,
    checks: [
      { id: 'parse', category: 'Parsing', label: 'Machine-readable text', score: 100, weight: 20, severity: 'pass', detail: 'All 612 words extracted cleanly. No text trapped in images or tables.' },
      { id: 'contact', category: 'Parsing', label: 'Contact details found', score: 100, weight: 10, severity: 'pass', detail: 'Name, email, phone and city all detected in the header.' },
      { id: 'sections', category: 'Content', label: 'Standard section headings', score: 85, weight: 15, severity: 'warning', detail: '4 of 5 expected sections found.', fix: 'Add a short “Summary” heading at the top — many parsers key off it.' },
      { id: 'dates', category: 'Content', label: 'Consistent date formats', score: 100, weight: 10, severity: 'pass', detail: 'All roles use “Mon YYYY — Mon YYYY”.' },
      { id: 'verbs', category: 'Content', label: 'Action verbs and outcomes', score: 72, weight: 15, severity: 'warning', detail: '6 of 11 bullets start with a weak verb or have no measurable outcome.', fix: 'Rewrite “Responsible for the design system” as “Owned the design system used by 4 teams”.' },
      { id: 'keywords', category: 'Keywords', label: 'Role keyword coverage', score: 68, weight: 20, severity: 'warning', detail: '11 of 16 keywords from your target roles appear in the resume.', fix: 'GraphQL and CI/CD appear in most of your target jobs but nowhere in the resume.' },
      { id: 'format', category: 'Formatting', label: 'Single-column layout', score: 100, weight: 5, severity: 'pass', detail: 'One column throughout — the safest layout for parsers.' },
      { id: 'length', category: 'Formatting', label: 'Length', score: 90, weight: 5, severity: 'pass', detail: '2 pages for 5 years of experience is appropriate.' },
    ],
    keywords: [
      { term: 'React', inResume: true, inJob: true, count: 7 },
      { term: 'TypeScript', inResume: true, inJob: true, count: 5 },
      { term: 'Node.js', inResume: true, inJob: true, count: 3 },
      { term: 'design system', inResume: true, inJob: true, count: 4 },
      { term: 'testing', inResume: true, inJob: true, count: 2 },
      { term: 'accessibility', inResume: true, inJob: false, count: 2 },
      { term: 'performance', inResume: true, inJob: true, count: 3 },
      { term: 'GraphQL', inResume: false, inJob: true, count: 0 },
      { term: 'CI/CD', inResume: false, inJob: true, count: 0 },
      { term: 'Kubernetes', inResume: false, inJob: true, count: 0 },
      { term: 'mentoring', inResume: false, inJob: true, count: 0 },
      { term: 'REST', inResume: true, inJob: false, count: 1 },
    ],
  },
  r2: {
    resumeId: 'r2',
    overall: 74,
    wordCount: 548,
    readingLevel: 'Clear · grade 10',
    pages: 2,
    checks: [
      { id: 'parse', category: 'Parsing', label: 'Machine-readable text', score: 100, weight: 20, severity: 'pass', detail: 'All 548 words extracted cleanly.' },
      { id: 'contact', category: 'Parsing', label: 'Contact details found', score: 80, weight: 10, severity: 'warning', detail: 'Phone number not detected.', fix: 'Add a phone number in plain text, not inside an icon or image.' },
      { id: 'sections', category: 'Content', label: 'Standard section headings', score: 100, weight: 15, severity: 'pass', detail: 'All expected sections present.' },
      { id: 'dates', category: 'Content', label: 'Consistent date formats', score: 70, weight: 10, severity: 'warning', detail: 'Two roles use “2023-2024” while others use “Mar 2023 — Feb 2024”.', fix: 'Use one format everywhere. Parsers frequently mis-read the short form.' },
      { id: 'verbs', category: 'Content', label: 'Action verbs and outcomes', score: 80, weight: 15, severity: 'warning', detail: '3 of 9 bullets have no measurable outcome.' },
      { id: 'keywords', category: 'Keywords', label: 'Role keyword coverage', score: 55, weight: 20, severity: 'critical', detail: '7 of 16 keywords found — this resume is tuned for design-system roles, not general frontend ones.', fix: 'Use this version only for design-system applications.' },
      { id: 'format', category: 'Formatting', label: 'Single-column layout', score: 100, weight: 5, severity: 'pass', detail: 'One column throughout.' },
      { id: 'length', category: 'Formatting', label: 'Length', score: 100, weight: 5, severity: 'pass', detail: 'Appropriate length.' },
    ],
    keywords: [
      { term: 'design system', inResume: true, inJob: true, count: 9 },
      { term: 'Figma', inResume: true, inJob: true, count: 4 },
      { term: 'React', inResume: true, inJob: true, count: 5 },
      { term: 'tokens', inResume: true, inJob: false, count: 3 },
      { term: 'TypeScript', inResume: true, inJob: true, count: 2 },
      { term: 'accessibility', inResume: true, inJob: true, count: 3 },
      { term: 'Node.js', inResume: false, inJob: true, count: 0 },
      { term: 'GraphQL', inResume: false, inJob: true, count: 0 },
      { term: 'testing', inResume: false, inJob: true, count: 0 },
      { term: 'CI/CD', inResume: false, inJob: true, count: 0 },
    ],
  },
}
