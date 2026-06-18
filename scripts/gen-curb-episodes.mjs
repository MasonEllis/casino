import fs from 'fs'

const eps = JSON.parse(fs.readFileSync('curb-episodes.json', 'utf8'))

function slug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function norm(title) {
  return title.toLowerCase().replace(/^the\s+/i, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

const items = eps.map((e) => ({
  title: e.name,
  slug: slug(e.name),
  norm: norm(e.name),
  clip: `/curb/clips/${slug(e.name)}.mp4`,
}))

const lookup = items.map((e) => `  [${JSON.stringify(e.norm)}]: ${JSON.stringify(e)}`).join(',\n')

const out = `// Auto-generated from TVMaze — ${items.length} Curb Your Enthusiasm episodes
export interface CurbEpisode {
  title: string
  slug: string
  norm: string
  clip: string
}

export const CURB_EPISODES: CurbEpisode[] = ${JSON.stringify(items, null, 2)}

const LOOKUP: Record<string, CurbEpisode> = {
${lookup},
}

/** Normalize user input for fuzzy episode matching. */
export function normalizeEpisodeGuess(input: string): string {
  return input
    .toLowerCase()
    .replace(/^the\\s+/i, '')
    .replace(/[^a-z0-9\\s]/g, '')
    .replace(/\\s+/g, ' ')
    .trim()
}

export function matchCurbEpisode(guess: string): CurbEpisode | null {
  const n = normalizeEpisodeGuess(guess)
  if (!n || n.length < 3) return null
  if (LOOKUP[n]) return LOOKUP[n]
  const withThe = normalizeEpisodeGuess('the ' + guess)
  if (withThe !== n && LOOKUP[withThe]) return LOOKUP[withThe]

  const exactTitle = CURB_EPISODES.find(
    (e) => normalizeEpisodeGuess(e.title) === n || e.title.toLowerCase() === guess.trim().toLowerCase(),
  )
  if (exactTitle) return exactTitle

  if (n.length >= 4) {
    const hits = CURB_EPISODES.filter((e) => e.norm.startsWith(n) || n.startsWith(e.norm))
    if (hits.length === 1) return hits[0]
  }

  return null
}
`

fs.writeFileSync('src/game/curbEpisodes.ts', out)
console.log('wrote', items.length, 'episodes')