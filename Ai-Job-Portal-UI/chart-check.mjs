import { chromium } from 'playwright-core'
const TYPES = ['Line','Area','Smooth','Columns','Stacked','Bars','Donut','Pie','Radar']
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
const errs = []
page.on('console', m => m.type() === 'error' && errs.push(m.text()))
page.on('pageerror', e => errs.push('pageerror: ' + e.message))
await page.goto('http://localhost:5173/candidate?v=a', { waitUntil: 'networkidle' })

// the SeriesChart svg labels itself "<series> across <labels>"
const svg = page.locator('svg[role="img"][aria-label*="across"]').first()
const card = page.locator('h2:has-text("Your activity")').locator('xpath=ancestor::*[self::div][3]')
await svg.scrollIntoViewIfNeeded()

// the picker opens once and closes on pick, so reopen per type
for (const t of TYPES) {
  await page.click('button[aria-label*="Chart type"]')
  await page.click(`button[role="menuitemradio"]:has-text("${t}")`)
  await page.waitForTimeout(700)
  const shapes = await svg.evaluate(el => ({
    paths: el.querySelectorAll('path').length,
    rects: el.querySelectorAll('rect').length,
    polys: el.querySelectorAll('polygon').length,
    circles: el.querySelectorAll('circle').length,
    box: (() => { const b = el.getBoundingClientRect(); return Math.round(b.width) + 'x' + Math.round(b.height) })(),
  }))
  const drawn = shapes.paths + shapes.rects + shapes.polys + shapes.circles
  console.log(`${drawn > 2 ? 'OK  ' : 'EMPTY'} ${t.padEnd(9)} paths:${String(shapes.paths).padStart(3)} rects:${String(shapes.rects).padStart(3)} polys:${String(shapes.polys).padStart(2)} circles:${String(shapes.circles).padStart(3)}  ${shapes.box}`)
  await card.screenshot({ path: `shots/chart-${t.toLowerCase()}.png` })
}
console.log('\nconsole errors:', errs.length ? errs : 'none')
await browser.close()
