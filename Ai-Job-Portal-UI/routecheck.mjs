import { chromium } from 'playwright-core'
const ROUTES = `/ /jobs /jobs/j1 /companies /companies/northwind-labs /browse/category/engineering
/resources /pricing /faq /contact /login /register /forgot-password /reset-password
/candidate /candidate/jobs /candidate/applications /candidate/profile /candidate/resumes
/candidate/saved /candidate/alerts /candidate/interviews /candidate/messages
/candidate/notifications /candidate/settings /candidate/privacy /onboarding /assessment/at1
/recruiter /recruiter/jobs /recruiter/jobs/new /recruiter/jobs/j1/edit
/recruiter/jobs/j1/applicants /recruiter/applications/a1 /recruiter/candidates
/recruiter/candidates/a1 /recruiter/company /recruiter/company/setup /recruiter/team
/recruiter/assessments /recruiter/interviews /recruiter/messages /recruiter/notifications
/recruiter/analytics /recruiter/billing /admin /admin/jobs /admin/companies /admin/users
/admin/reports /admin/support /admin/audit /admin/ai-monitoring /admin/settings
/styleguide /variants /unauthorized /maintenance`.split(/\s+/).filter(Boolean)

const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
let bad = 0
for (const r of ROUTES) {
  await p.goto('http://localhost:5173' + r, { waitUntil: 'domcontentloaded', timeout: 20000 })
  await p.waitForTimeout(250)
  const t = (await p.locator('body').innerText()).trim()
  const is404 = t.includes('refracted into nothing')
  if (is404) { console.log('404 →', r); bad++ }
}
console.log(`\n${ROUTES.length - bad}/${ROUTES.length} documented routes resolve (0 unintended 404s expected)`)
await b.close()
