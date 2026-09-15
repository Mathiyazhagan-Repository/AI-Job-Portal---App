import { chromium } from 'playwright-core'

const ROUTES = [
  '/', '/jobs', '/jobs/j1', '/login', '/register', '/pricing', '/companies',
  '/companies/northwind-labs', '/onboarding', '/assessment/at1',
  '/faq', '/contact', '/resources', '/browse/skill/react', '/browse/location/bengaluru',
  '/candidate', '/candidate/applications', '/candidate/jobs', '/candidate/profile',
  '/candidate/resumes', '/candidate/saved', '/candidate/alerts', '/candidate/interviews',
  '/candidate/messages', '/candidate/notifications', '/candidate/settings', '/candidate/privacy',
  '/recruiter', '/recruiter/jobs', '/recruiter/jobs/new', '/recruiter/jobs/j1/applicants',
  '/recruiter/applications/a1', '/recruiter/candidates', '/recruiter/candidates/a1',
  '/recruiter/company', '/recruiter/company/setup', '/recruiter/team', '/recruiter/assessments',
  '/recruiter/interviews', '/recruiter/messages', '/recruiter/notifications',
  '/recruiter/analytics', '/recruiter/billing',
  '/admin', '/admin/jobs', '/admin/companies', '/admin/users', '/admin/reports',
  '/admin/support', '/admin/audit', '/admin/ai-monitoring', '/admin/settings',
  '/styleguide', '/variants', '/unauthorized', '/nope-404',
]
const VARIANTS = ['a', 'b', 'c']

const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

const problems = []
page.on('console', (m) => {
  if (m.type() === 'error') problems.push(`  console: ${m.text().slice(0, 200)}`)
})
page.on('pageerror', (e) => problems.push(`  pageerror: ${String(e).slice(0, 200)}`))

let checked = 0, failed = 0
for (const route of ROUTES) {
  for (const v of VARIANTS) {
    problems.length = 0
    const url = `http://localhost:5173${route}?v=${v}`
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 })
      // Every route is a lazy chunk. A flat 120ms wait raced the mount often
      // enough to report a phantom "no <h1>" on a page that has one, so wait
      // for the heading to exist (or genuinely time out) before asserting.
      await page
        .waitForFunction(() => document.querySelector('h1') !== null, null, { timeout: 5000 })
        .catch(() => {})
      const text = (await page.locator('body').innerText()).trim()
      if (text.length < 30) problems.push(`  body nearly empty (${text.length} chars)`)
      const h1 = await page.locator('h1').count()
      if (h1 === 0 && !route.includes('variants')) problems.push('  no <h1>')
    } catch (e) {
      problems.push(`  navigation: ${String(e).split('\n')[0].slice(0, 160)}`)
    }
    checked++
    if (problems.length) {
      failed++
      console.log(`FAIL ${route}?v=${v}`)
      console.log([...new Set(problems)].join('\n'))
    }
  }
}
console.log(`\n=== ${checked - failed}/${checked} route+variant combos clean ===`)
await browser.close()
