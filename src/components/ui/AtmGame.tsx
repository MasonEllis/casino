import { useCallback, useEffect, useRef, useState } from 'react'
import { ATM_WITHDRAWAL, findLocalClip } from '../../game/atm'
import { youtubeEmbedForEpisode, youtubeSearchUrl } from '../../game/curbClips'
import { matchCurbEpisode, type CurbEpisode } from '../../game/curbEpisodes'
import { useCasino } from '../../game/store'

type Phase = 'quiz' | 'playing' | 'success' | 'fail'
type Playback = 'local' | 'youtube'

export function AtmGame() {
  const balance = useCasino((s) => s.balance)
  const addBalance = useCasino((s) => s.addBalance)
  const closeGame = useCasino((s) => s.closeGame)

  const [phase, setPhase] = useState<Phase>('quiz')
  const [guess, setGuess] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [episode, setEpisode] = useState<CurbEpisode | null>(null)
  const [playback, setPlayback] = useState<Playback>('youtube')
  const [localSrc, setLocalSrc] = useState<string | null>(null)
  const [youtubeSrc, setYoutubeSrc] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const leave = useCallback(() => {
    if (phase === 'playing') return
    closeGame()
    useCasino.getState().lockPointer()
  }, [phase, closeGame])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && phase !== 'playing') leave()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [leave, phase])

  useEffect(() => {
    if (phase !== 'quiz') return
    const t = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(t)
  }, [phase])

  const beginYoutube = useCallback((ep: CurbEpisode) => {
    setPlayback('youtube')
    setLocalSrc(null)
    setYoutubeSrc(youtubeEmbedForEpisode(ep))
  }, [])

  useEffect(() => {
    if (phase !== 'playing' || playback !== 'local' || !localSrc) return
    const video = videoRef.current
    if (!video) return
    video.src = localSrc
    video.load()
    void video.play().catch(() => {
      if (episode) beginYoutube(episode)
    })
  }, [phase, playback, localSrc, episode, beginYoutube])

  const beginPlayback = useCallback(async (match: CurbEpisode) => {
    setEpisode(match)
    setMessage(null)
    setPhase('playing')
    beginYoutube(match)

    const local = await findLocalClip(match.clip)
    if (local) {
      setPlayback('local')
      setLocalSrc(local)
      setYoutubeSrc(null)
    }
  }, [beginYoutube])

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (phase !== 'quiz') return
    const match = matchCurbEpisode(guess)
    if (!match) {
      setMessage('Pretty, pretty, pretty… no. That is not a Curb episode.')
      setPhase('fail')
      return
    }
    addBalance(ATM_WITHDRAWAL)
    void beginPlayback(match)
  }

  const finish = () => {
    setPhase('success')
  }

  const reset = () => {
    setPhase('quiz')
    setGuess('')
    setMessage(null)
    setEpisode(null)
    setPlayback('youtube')
    setLocalSrc(null)
    setYoutubeSrc(null)
  }

  return (
    <div className="overlay">
      <div className="game-panel atm-panel">
        <div className="game-header">
          <h2>🏧 Curb ATM</h2>
          <button className="btn btn-ghost" onClick={leave} disabled={phase === 'playing'}>
            Leave
          </button>
        </div>

        <div className="atm-body">
          {phase === 'playing' && episode && (
            <div className="atm-screen">
              <div className="atm-screen-label">Now playing: {episode.title}</div>
              {playback === 'local' && localSrc ? (
                <video
                  ref={videoRef}
                  className="atm-video"
                  controls
                  playsInline
                  onEnded={finish}
                  onError={() => beginYoutube(episode)}
                />
              ) : youtubeSrc ? (
                <div className="atm-youtube-wrap">
                  <iframe
                    className="atm-youtube"
                    src={youtubeSrc}
                    title={`Curb Your Enthusiasm — ${episode.title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="atm-clip-fallback">
                  <span className="atm-larry" aria-hidden>
                    🧑‍🦲
                  </span>
                  <p>Clip loading…</p>
                </div>
              )}
              <div className="atm-playback-actions">
                <a
                  className="btn btn-ghost atm-search-link"
                  href={youtubeSearchUrl(episode.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Search on YouTube
                </a>
                <button type="button" className="btn btn-primary atm-continue" onClick={finish}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {phase === 'quiz' && (
            <>
              <p className="atm-prompt">
                Withdraw <strong>{ATM_WITHDRAWAL.toLocaleString()} chips</strong> if you can name a
                {' '}<em>Curb Your Enthusiasm</em> episode.
              </p>
              <p className="atm-sub">Spelling can be casual — partial titles work if unambiguous.</p>
              <form className="atm-form" onSubmit={submit}>
                <input
                  ref={inputRef}
                  className="atm-input"
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="Episode title…"
                  autoComplete="off"
                />
                <button className="btn btn-gold atm-submit" type="submit" disabled={!guess.trim()}>
                  Withdraw
                </button>
              </form>
              <p className="atm-examples">
                Try: The Pants Tent · Krazee-Eyez Killa · The Survivor · Namaste
              </p>
            </>
          )}

          {phase === 'fail' && message && (
            <div className="atm-fail">
              <p>{message}</p>
              <button type="button" className="btn btn-primary" onClick={reset}>
                Try Again
              </button>
            </div>
          )}

          {phase === 'success' && episode && (
            <div className="atm-success">
              <p className="atm-success-title">Dispensed!</p>
              <p>
                <strong>{episode.title}</strong> — +{ATM_WITHDRAWAL.toLocaleString()} chips
              </p>
              <p className="atm-balance">Balance: {balance.toLocaleString()}</p>
              <div className="controls">
                <button type="button" className="btn btn-primary" onClick={reset}>
                  Another Episode
                </button>
                <button type="button" className="btn btn-ghost" onClick={leave}>
                  Leave ATM
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}