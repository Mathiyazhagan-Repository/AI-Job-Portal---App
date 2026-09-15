import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { TooltipProvider } from '@/components/ui/overlay'
import { MotionProvider } from '@/components/motion'
import { ProfileProvider } from '@/store/profile'
import { ApplicationProvider } from '@/store/applications'
import { AuthProvider } from '@/store/auth'
import { JobsProvider } from '@/store/jobs'
import { CompaniesProvider } from '@/store/companies'
import { router } from '@/routes/router'
import './styles/theme.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <CompaniesProvider>
        <JobsProvider>
          <MotionProvider>
          <TooltipProvider delayDuration={200} skipDelayDuration={300}>
            <ProfileProvider>
              <ApplicationProvider>
                <RouterProvider router={router} />
              </ApplicationProvider>
            </ProfileProvider>
          </TooltipProvider>
          </MotionProvider>
        </JobsProvider>
      </CompaniesProvider>
    </AuthProvider>
  </StrictMode>,
)
