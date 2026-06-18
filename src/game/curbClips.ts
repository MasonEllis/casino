import { CURB_YOUTUBE_CLIPS } from './curbYoutubeClips'

export function youtubeEmbedForEpisode(episode: { slug: string; title: string }): string {
  const videoId = CURB_YOUTUBE_CLIPS[episode.slug]
  if (videoId) return youtubeEmbedUrl(videoId)
  return youtubeSearchEmbedUrl(`Curb Your Enthusiasm ${episode.title} scene`)
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
}

/** Episode-specific search playlist — used when no mapped clip exists yet. */
export function youtubeSearchEmbedUrl(query: string): string {
  const q = encodeURIComponent(query)
  return `https://www.youtube.com/embed?listType=search&list=${q}&autoplay=1&rel=0&modestbranding=1&playsinline=1`
}

export function youtubeSearchUrl(episodeTitle: string): string {
  const q = encodeURIComponent(`Curb Your Enthusiasm ${episodeTitle} scene`)
  return `https://www.youtube.com/results?search_query=${q}`
}