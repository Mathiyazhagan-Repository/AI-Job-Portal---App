import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'
// hello
const OUT = 'shots'
const browser = await chromium.launch({ channel: 'chrome' })
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  acceptDownloads: true,
})
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))

/* ── 1. Upload a résumé and let it fill the profile ───────────────── */

await page.goto('http://localhost:5173/candidate/resumes?v=a', { waitUntil: 'networkidle' })

// a real file, handed to the real <input type="file">
const tmp = path.join(process.cwd(), 'shots', 'sample-resume.pdf')
fs.writeFileSync(tmp, '%PDF-1.4\n% test fixture\n')
await page.setInputFiles('input[type=file]', tmp)

await page.waitForSelector('text=Reading the document', { timeout: 5000 })
console.log('upload  : parse started')
await page.waitForSelector('text=fields from', { timeout: 15000 })
console.log('upload  : parse finished, fields offered')
await page.screenshot({ path: `${OUT}/feat-upload.png` })

await page.click('.rounded-v-control button:has-text("Mark my profile up to date"), button:has-text("Fill ")')
await page.waitForTimeout(400)

// the new file must now be in the list
const listed = await page.locator('text=sample-resume').count()
console.log('upload  : new file listed =', listed > 0)

/* ── 2. The profile must show what the résumé wrote ───────────────── */

await page.goto('http://localhost:5173/candidate/profile?v=a', { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
const filled = await page.locator('text=Filled from').count()
console.log('profile : shows provenance =', filled > 0)
await page.screenshot({ path: `${OUT}/feat-profile.png`, fullPage: false })

/* ── 3. Persistence across a reload (the "after sign-in" path) ────── */

await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(500)
const persisted = await page.locator('text=Filled from').count()
console.log('profile : survives reload =', persisted > 0)

/* ── 4. Download the profile as a PDF ─────────────────────────────── */

const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 20000 }),
  page.click('button:has-text("Download PDF")'),
])
const saved = path.join(process.cwd(), OUT, download.suggestedFilename())
await download.saveAs(saved)
const bytes = fs.statSync(saved).size
const head = fs.readFileSync(saved).subarray(0, 5).toString('latin1')
console.log('pdf     : file =', download.suggestedFilename())
console.log('pdf     : bytes =', bytes, '| header =', JSON.stringify(head))

/* ── 5. A fresh visitor still gets the offer banner ───────────────── */

const clean = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const p2 = await clean.newPage()
await p2.goto('http://localhost:5173/candidate/profile?v=a', { waitUntil: 'networkidle' })
await p2.waitForTimeout(500)
const offered = await p2.locator('text=Fill this profile from your latest').count()
console.log('banner  : offered to a new visitor =', offered > 0)
await p2.screenshot({ path: `${OUT}/feat-banner.png` })
await p2.click('button:has-text("Show me what changes")')
await p2.waitForTimeout(300)
await p2.screenshot({ path: `${OUT}/feat-diff.png` })
await clean.close()

fs.unlinkSync(tmp)
console.log('\nconsole errors:', errors.length ? errors : 'none')
await browser.close()
