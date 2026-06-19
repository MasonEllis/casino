import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:4173/casino/'
const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`)
})
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
await page.waitForTimeout(2000)
const rootHtml = await page.locator('#root').innerHTML().catch(() => '')
const canvasCount = await page.locator('canvas').count()
console.log(JSON.stringify({ url, errors, rootLen: rootHtml.length, canvasCount }, null, 2))
await browser.close()