import fs from 'fs'

const OUT = 'src/game/curbYoutubeClips.ts'
const ts = fs.readFileSync('src/game/curbEpisodes.ts', 'utf8')
const arrayMatch = ts.match(/export const CURB_EPISODES: CurbEpisode\[\] = (\[[\s\S]*?\])\r?\n\r?\nconst LOOKUP/)
if (!arrayMatch) throw new Error('Could not parse CURB_EPISODES from curbEpisodes.ts')
const episodes = JSON.parse(arrayMatch[1])

const existing = {}
if (fs.existsSync(OUT)) {
  const prev = fs.readFileSync(OUT, 'utf8')
  for (const [, slug, id] of prev.matchAll(/['"]([^'"]+)['"]:\s*['"]([a-zA-Z0-9_-]{11})['"]/g)) {
    existing[slug] = id
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function searchVideoId(title, attempt = 1) {
  const q = encodeURIComponent(`Curb Your Enthusiasm ${title} scene`)
  try {
    const res = await fetch(`https://www.youtube.com/results?search_query=${q}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()
    const ids = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map((m) => m[1])
    const unique = [...new Set(ids)].filter((id) => id !== 'undefined')
    return unique[0] ?? null
  } catch (err) {
    if (attempt < 4) {
      await sleep(1500 * attempt)
      return searchVideoId(title, attempt + 1)
    }
    throw err
  }
}

function writeMapping(mapping) {
  const out = `// Auto-generated YouTube clip IDs per episode — run: node scripts/gen-curb-youtube.mjs
export const CURB_YOUTUBE_CLIPS: Record<string, string> = ${JSON.stringify(mapping, null, 2)}
`
  fs.writeFileSync(OUT, out)
}

const mapping = { ...existing }
let added = 0
let failed = 0

for (let i = 0; i < episodes.length; i++) {
  const ep = episodes[i]
  if (mapping[ep.slug]) {
    continue
  }
  process.stdout.write(`[${i + 1}/${episodes.length}] ${ep.title}… `)
  try {
    const id = await searchVideoId(ep.title)
    if (id) {
      mapping[ep.slug] = id
      added++
      writeMapping(mapping)
      console.log(id)
    } else {
      failed++
      console.log('no result')
    }
  } catch (err) {
    failed++
    console.log(`error: ${err.message}`)
  }
  await sleep(2000)
}

console.log(`\ndone — ${Object.keys(mapping).length} total, ${added} added, ${failed} failed`)