import { chromium } from 'playwright-core'
const browser = await chromium.launch({ channel: 'chrome' })

/**
 * Snapshot every element's opacity + transform inside <main>.
 *
 * Two engines drive motion here, and a check that only understands one of
 * them lies: CSS keyframes expose `animationName`, while Motion (`motion/react`)
 * animates inline transform/opacity from JS and never sets one. So the probe
 * records raw visual state, and the caller decides what "moving" means by
 * comparing two snapshots — anything whose transform or opacity CHANGES
 * between them is genuinely in motion, whichever engine moved it. A decorative
 * element parked at opacity .06 looks identical in both samples and is
 * correctly ignored.
 */
function snapshot() {
  const out = []
  for (const el of document.querySelectorAll('main *')) {
    const cs = getComputedStyle(el)
    out.push(cs.opacity + '|' + cs.transform)
  }
  return out
}

/** How many elements differ between two snapshots of the same page. */
function movedBetween(a, b) {
  if (a.length !== b.length) return Math.max(a.length, b.length)
  let n = 0
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++
  return n
}

/** Wait for the lazy route chunk to actually mount before sampling. */
async function waitForContent(page) {
  await page
    .waitForFunction(() => document.querySelectorAll('main *').length > 20, null, { timeout: 10000 })
    .catch(() => {})
}

const cases = [
  ['/?v=a', 'A home'],
  ['/?v=b', 'B home'],
  ['/?v=c', 'C home'],
  ['/jobs?v=b', 'B jobs list'],
  ['/jobs?v=c', 'C jobs list'],
  ['/recruiter/jobs/j1/applicants?v=b', 'B triage'],
  ['/recruiter/jobs/j1/applicants?v=c', 'C triage'],
]

let pass = 0
for (const [url, label] of cases) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto('http://localhost:5173' + url, { waitUntil: 'domcontentloaded' })
  await waitForContent(page)

  const t0 = await page.evaluate(snapshot)
  await page.waitForTimeout(120)
  const t1 = await page.evaluate(snapshot)
  const inFlight = movedBetween(t0, t1)

  await page.waitForTimeout(2200)
  const s0 = await page.evaluate(snapshot)
  await page.waitForTimeout(120)
  const s1 = await page.evaluate(snapshot)
  const settled = movedBetween(s0, s1)

  const ok = inFlight > 0
  console.log(
    `${ok ? 'ANIMATES' : 'STATIC  '}  ${label.padEnd(14)} moving on mount ${inFlight} -> settled ${settled}`,
  )
  if (ok) pass++
  await page.close()
}

/* Reduced motion: nothing may still be moving once the page has mounted. */
const rm = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
await rm.goto('http://localhost:5173/?v=c', { waitUntil: 'domcontentloaded' })
await waitForContent(rm)
const r0 = await rm.evaluate(snapshot)
await rm.waitForTimeout(150)
const r1 = await rm.evaluate(snapshot)
const rmMoving = movedBetween(r0, r1)
console.log(`\nreduced-motion: ${rmMoving} elements moving (want 0)`)
await rm.close()

console.log(`\n=== ${pass}/${cases.length} pages animate ===`)
await browser.close()
