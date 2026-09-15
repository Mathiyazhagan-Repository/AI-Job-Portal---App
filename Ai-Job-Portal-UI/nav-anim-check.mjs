import { chromium } from 'playwright-core'

/**
 * Proves the sidebar icons really animate on hover, and that hovering the
 * whole row — not just the 16px glyph — is what triggers them.
 *
 * animateicons drives paths through Motion, so nothing shows up in
 * `animationName`; the check samples the computed transform of every element
 * inside the icon and looks for it changing while hovered.
 */

const browser = await chromium.launch({ channel: 'chrome' })

async function sample(page, rowIndex) {
  return page.evaluate((i) => {
    const row = document.querySelectorAll('nav[aria-label="Sections"] a, aside nav a')[i]
    if (!row) return null
    return [...row.querySelectorAll('svg, svg *')].map((el) => {
      const cs = getComputedStyle(el)
      return cs.transform + '|' + cs.opacity
    })
  }, rowIndex)
}

const diff = (a, b) =>
  !a || !b || a.length !== b.length ? -1 : a.filter((v, i) => v !== b[i]).length

async function run(reduced) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ...(reduced ? { reducedMotion: 'reduce' } : {}),
  })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('http://localhost:5173/candidate?v=a', { waitUntil: 'networkidle' })

  const links = page.locator('aside nav a')
  const total = await links.count()
  let animated = 0
  const checked = Math.min(total, 8)

  for (let i = 0; i < checked; i++) {
    const label = (await links.nth(i).innerText()).split('\n')[0].trim()
    // hover the row, not the glyph — the row is the trigger
    const box = await links.nth(i).boundingBox()
    await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2)

    const before = await sample(page, i)
    await page.waitForTimeout(90)
    const during = await sample(page, i)
    const moved = diff(before, during)

    await page.mouse.move(0, 0)
    await page.waitForTimeout(400)

    if (moved > 0) animated++
    console.log(
      `${moved > 0 ? 'ANIMATES' : 'static  '}  ${label.padEnd(16)} ${moved} elements moved`,
    )
  }

  console.log(
    `\n${reduced ? 'reduced-motion' : 'normal'}: ${animated}/${checked} rows animate on row hover`,
  )
  if (errors.length) console.log('page errors:', errors)
  await ctx.close()
  return animated
}

const normal = await run(false)
console.log('\n──────────────────────────────')
const reduced = await run(true)

console.log(
  `\n=== hover animation: ${normal} rows normally, ${reduced} under reduced-motion (want 0) ===`,
)
await browser.close()
