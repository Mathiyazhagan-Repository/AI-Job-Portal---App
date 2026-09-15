import { chromium } from 'playwright-core'
const targets = process.argv.slice(2)
const browser = await chromium.launch({ channel: 'chrome' })
for (const t of targets) {
  const [route, v, name, h] = t.split('|')
  const page = await browser.newPage({ viewport: { width: 1440, height: Number(h) || 950 }, deviceScaleFactor: 1 })
  await page.goto(`http://localhost:5173${route}?v=${v}`, { waitUntil: 'networkidle', timeout: 25000 })
  await page.waitForTimeout(1400)
  await page.screenshot({ path: `shots/${name}.png` })
  await page.close()
  console.log('shot', name)
}
await browser.close()
