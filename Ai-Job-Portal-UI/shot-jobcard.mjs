import { chromium } from 'playwright-core'
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 900, height: 1400 }, deviceScaleFactor: 1 })
await page.goto('http://localhost:5173/jobs?v=a', { waitUntil: 'networkidle', timeout: 25000 })
await page.waitForTimeout(1200)
await page.screenshot({ path: 'shots/jobcard-redesign.png' })

const card = await page.$('article')
if (card) await card.screenshot({ path: 'shots/jobcard-redesign-single.png' })

const errors = []
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(800)
console.log('console errors:', errors)

await browser.close()
