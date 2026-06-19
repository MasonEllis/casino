import { useEffect } from 'react'
import { EMOTE_KEY_BINDINGS, emoteProgress, type EmoteId, EMOTE_LABELS } from '../../game/emotes'
import { useCasino } from '../../game/store'
import { useIsMobile } from '../../hooks/useIsMobile'

const EMOTES: EmoteId[] = ['wave', 'thumbsup']

export function EmoteBar() {
  const isMobile = useIsMobile()
  const activeGame = useCasino((s) => s.activeGame)
  const floorEntered = useCasino((s) => s.floorEntered)
  const triggerEmote = useCasino((s) => s.triggerEmote)
  const activeEmote = useCasino((s) => s.activeEmote)
  const playingEmote =
    activeEmote && emoteProgress(activeEmote.type, activeEmote.startedAt) !== null
      ? activeEmote.type
      : null

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      const state = useCasino.getState()
      if (state.activeGame || !state.floorEntered) return
      const emote = EMOTE_KEY_BINDINGS[e.code]
      if (!emote) return
      e.preventDefault()
      state.triggerEmote(emote)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  if (!floorEntered || activeGame) return null

  return (
    <div className={`emote-bar ${isMobile ? 'emote-bar--mobile' : ''}`} role="toolbar" aria-label="Emotes">
      {EMOTES.map((emote) => (
        <button
          key={emote}
          type="button"
          className={`emote-btn ${playingEmote === emote ? 'active' : ''}`}
          aria-label={EMOTE_LABELS[emote]}
          title={isMobile ? EMOTE_LABELS[emote] : `${EMOTE_LABELS[emote]} (${emote === 'wave' ? '1' : '2'})`}
          onClick={() => triggerEmote(emote)}
        >
          <span className="emote-btn-icon" aria-hidden>
            {emote === 'wave' ? '👋' : '👍'}
          </span>
          {!isMobile && <span className="emote-btn-label">{EMOTE_LABELS[emote]}</span>}
        </button>
      ))}
    </div>
  )
}