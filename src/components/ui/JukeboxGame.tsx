import { useCallback, useEffect, useState } from 'react'
import {
  getMusicTrack,
  getMusicTrackList,
  setMusicTrack,
  startBackgroundMusic,
} from '../../game/audio'
import { useLobby } from '../../game/lobby'
import { lobbyClient } from '../../game/lobbyClient'
import type { MusicTrackId } from '../../game/musicTracks'
import { useCasino } from '../../game/store'

export function JukeboxGame() {
  const closeGame = useCasino((s) => s.closeGame)
  const lobbyConnected = useLobby((s) => s.status === 'connected')
  const lobbyMusic = useLobby((s) => s.musicTrack)
  const [soloTrack, setSoloTrack] = useState<MusicTrackId>(getMusicTrack())
  const tracks = getMusicTrackList()
  const activeTrack = lobbyConnected ? lobbyMusic : soloTrack

  const leave = useCallback(() => {
    closeGame()
    useCasino.getState().lockPointer()
  }, [closeGame])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') leave()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [leave])

  const pickTrack = (id: MusicTrackId) => {
    if (lobbyConnected) {
      lobbyClient.setMusic(id)
      return
    }
    setSoloTrack(id)
    setMusicTrack(id)
    startBackgroundMusic()
  }

  return (
    <div className="overlay">
      <div className="game-panel jukebox-panel">
        <div className="game-header">
          <h2>♫ Jukebox</h2>
          <button type="button" className="btn btn-ghost" onClick={leave}>
            Close
          </button>
        </div>

        <p className="jukebox-sub">
          {lobbyConnected
            ? 'Changes the music for everyone in this lobby.'
            : 'Select the floor soundtrack. Your pick is saved for solo play.'}
        </p>

        <ul className="jukebox-tracks">
          {tracks.map((track) => (
            <li key={track.id}>
              <button
                type="button"
                className={`jukebox-track${activeTrack === track.id ? ' jukebox-track--active' : ''}`}
                onClick={() => pickTrack(track.id)}
              >
                <span className="jukebox-track-name">{track.name}</span>
                <span className="jukebox-track-tag">{track.tagline}</span>
                {activeTrack === track.id && <span className="jukebox-track-now">Now playing</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}