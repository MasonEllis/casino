export const ATM_WITHDRAWAL = 1000

/** Prefix public clip paths with the Vite base URL (e.g. /casino/). */
export function resolveClipUrl(path: string): string {
  const base = import.meta.env.BASE_URL
  const normalized = path.startsWith('/') ? path.slice(1) : path
  return `${base}${normalized}`
}

/** Episode clip path, with optional default fallback. */
export function clipSources(episodeClip: string): string[] {
  return [episodeClip, '/curb/clips/default.mp4']
}

/** Return a local MP4 URL only when the file is actually present. */
export async function findLocalClip(episodeClip: string): Promise<string | null> {
  for (const path of clipSources(episodeClip)) {
    const url = resolveClipUrl(path)
    try {
      const res = await fetch(url, { method: 'HEAD' })
      const type = res.headers.get('content-type') ?? ''
      if (res.ok && type.includes('video')) return url
    } catch {
      /* try next source */
    }
  }
  return null
}