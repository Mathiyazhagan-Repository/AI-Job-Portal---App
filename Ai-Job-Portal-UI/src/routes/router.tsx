import { createBrowserRouter } from 'react-router'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AppLayout } from '@/layouts/AppLayout'
import { FocusLayout } from '@/layouts/FocusLayout'
import {
  NotFoundPage, ForbiddenPage, ErrorBoundaryPage, MaintenancePage,
} from '@/pages/system/Misc'
import { LoginPage, RegisterPage, ForgotPasswordPage } from '@/pages/public/Auth'
import { RequireAuth } from '@/store/auth'

/**
 * React Router v7, data mode (DESIGN.md §10).
 * Every page is `lazy`, so each route is its own chunk — PRD Part 52's
 * code-splitting requirement satisfied by the router itself.
 *
 * VARIANTS DO NOT ADD ROUTES. They are a ?v= param on the same URL, so
 * the route tree stays exactly as long as the page list.
 */


export const router = createBrowserRouter([
  /* ── Public ──────────────────────────────────────────── */
  {
    element: <PublicLayout />,
    errorElement: <ErrorBoundaryPage />,
    children: [
      { index: true, lazy: () => import('@/pages/public/Home') },
      { path: 'jobs', lazy: () => import('@/pages/public/Jobs') },
      { path: 'jobs/:jobId', lazy: () => import('@/pages/public/JobDetail') },
      { path: 'companies', lazy: () => import('@/pages/public/Companies') },
      { path: 'companies/:slug', lazy: () => import('@/pages/public/CompanyDetail') },
      { path: 'pricing', lazy: () => import('@/pages/public/Pricing') },
      { path: 'faq', lazy: () => import('@/pages/public/Faq') },
      { path: 'contact', lazy: () => import('@/pages/public/Contact') },
      { path: 'resources', lazy: () => import('@/pages/public/Resources') },
      { path: 'browse/:type/:value', lazy: () => import('@/pages/public/Browse') },
    ],
  },

  /* ── Auth ────────────────────────────────────────────── */
  {
    element: <AuthLayout />,
    errorElement: <ErrorBoundaryPage />,
    children: [
      { path: 'login', Component: LoginPage },
      { path: 'register', Component: RegisterPage },
      { path: 'forgot-password', Component: ForgotPasswordPage },
      { path: 'reset-password', Component: ForgotPasswordPage },
    ],
  },

  /* ── Candidate ───────────────────────────────────────── */
  {
    path: 'candidate',
    element: <RequireAuth role="candidate"><AppLayout persona="candidate" /></RequireAuth>,
    errorElement: <ErrorBoundaryPage />,
    children: [
      { index: true, lazy: () => import('@/pages/candidate/Dashboard') },
      { path: 'applications', lazy: () => import('@/pages/candidate/Applications') },
      { path: 'jobs', lazy: () => import('@/pages/public/Jobs') },
      { path: 'profile', lazy: () => import('@/pages/candidate/Profile') },
      { path: 'resumes', lazy: () => import('@/pages/candidate/Resumes') },
      { path: 'saved', lazy: () => import('@/pages/candidate/SavedJobs') },
      { path: 'alerts', lazy: () => import('@/pages/candidate/JobAlerts') },
      { path: 'interviews', lazy: () => import('@/pages/candidate/Interviews') },
      { path: 'messages', lazy: () => import('@/pages/candidate/Messages') },
      { path: 'notifications', lazy: () => import('@/pages/candidate/Notifications') },
      { path: 'settings', lazy: () => import('@/pages/candidate/Settings') },
      { path: 'privacy', lazy: () => import('@/pages/candidate/Privacy') },
    ],
  },

  /* ── Chrome-less candidate flows ─────────────────────── */
  {
    element: <RequireAuth><FocusLayout /></RequireAuth>,
    errorElement: <ErrorBoundaryPage />,
    children: [
      { path: 'onboarding', lazy: () => import('@/pages/candidate/Onboarding') },
      { path: 'assessment/:attemptId', lazy: () => import('@/pages/candidate/Assessment') },
    ],
  },

  /* ── Recruiter / Company ─────────────────────────────── */
  {
    path: 'recruiter',
    element: <RequireAuth role="recruiter"><AppLayout persona="recruiter" /></RequireAuth>,
    errorElement: <ErrorBoundaryPage />,
    children: [
      { index: true, lazy: () => import('@/pages/recruiter/Dashboard') },
      { path: 'jobs/new', lazy: () => import('@/pages/recruiter/JobEditor') },
      { path: 'jobs/:jobId/edit', lazy: () => import('@/pages/recruiter/JobEditor') },
      { path: 'jobs/:jobId/applicants', lazy: () => import('@/pages/recruiter/Applicants') },
      { path: 'jobs', lazy: () => import('@/pages/recruiter/JobList') },
      { path: 'candidates', lazy: () => import('@/pages/recruiter/CandidateSearch') },
      { path: 'candidates/:id', lazy: () => import('@/pages/recruiter/CandidateView') },
      { path: 'applications/:id', lazy: () => import('@/pages/recruiter/ApplicantDetail') },
      { path: 'company', lazy: () => import('@/pages/recruiter/Company') },
      { path: 'company/setup', lazy: () => import('@/pages/recruiter/CompanySetup') },
      { path: 'team', lazy: () => import('@/pages/recruiter/Team') },
      { path: 'assessments', lazy: () => import('@/pages/recruiter/Assessments') },
      { path: 'interviews', lazy: () => import('@/pages/recruiter/Interviews') },
      { path: 'messages', lazy: () => import('@/pages/recruiter/Messages') },
      { path: 'notifications', lazy: () => import('@/pages/recruiter/Notifications') },
      { path: 'analytics', lazy: () => import('@/pages/recruiter/Analytics') },
      { path: 'billing', lazy: () => import('@/pages/recruiter/Billing') },
    ],
  },

  /* ── Admin ───────────────────────────────────────────── */
  {
    path: 'admin',
    element: <RequireAuth role="admin"><AppLayout persona="admin" /></RequireAuth>,
    errorElement: <ErrorBoundaryPage />,
    children: [
      { index: true, lazy: () => import('@/pages/admin/Dashboard') },
      { path: 'jobs', lazy: () => import('@/pages/admin/Moderation') },
      { path: 'companies', lazy: () => import('@/pages/admin/Companies') },
      { path: 'users', lazy: () => import('@/pages/admin/Users') },
      { path: 'reports', lazy: () => import('@/pages/admin/Reports') },
      { path: 'support', lazy: () => import('@/pages/admin/Support') },
      { path: 'audit', lazy: () => import('@/pages/admin/Audit') },
      { path: 'ai-monitoring', lazy: () => import('@/pages/admin/AiMonitoring') },
      { path: 'settings', lazy: () => import('@/pages/admin/Settings') },
    ],
  },

  /* ── System ──────────────────────────────────────────── */
  { path: 'styleguide', lazy: () => import('@/pages/system/Styleguide') },
  { path: 'variants', lazy: () => import('@/pages/system/VariantGallery') },
  { path: 'unauthorized', Component: ForbiddenPage },
  { path: 'maintenance', Component: MaintenancePage },
  { path: '*', Component: NotFoundPage },
])
