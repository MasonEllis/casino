import { useEffect, useState } from 'react'
import { lobbyClient } from '../../game/lobbyClient'
import { useLobby } from '../../game/lobby'

type View = 'home' | 'join-private'

export function LobbyScreen() {
  const status = useLobby((s) => s.status)
  const error = useLobby((s) => s.error)
  const pickerOpen = useLobby((s) => s.pickerOpen)
  const setPickerOpen = useLobby((s) => s.setPickerOpen)
  const displayName = useLobby((s) => s.displayName)
  const setDisplayName = useLobby((s) => s.setDisplayName)

  const [view, setView] = useState<View>('home')
  const [privateCode, setPrivateCode] = useState('')

  const connected = status === 'connected'

  useEffect(() => {
    if (!pickerOpen || connected) return
    return () => {
      if (useLobby.getState().status !== 'connected') {
        lobbyClient.disconnect()
      }
    }
  }, [pickerOpen, connected])

  const playSolo = () => {
    setPickerOpen(false)
    lobbyClient.disconnect()
  }

  if (!pickerOpen || connected) return null

  const joinMainFloor = () => {
    lobbyClient.joinMainFloor()
  }

  const joinPrivate = (fn: () => void) => {
    fn()
  }

  return (
    <div className="lobby-screen">
      <div className="lobby-card">
        <header className="lobby-card-header">
          <button type="button" className="btn btn-ghost lobby-back" onClick={playSolo}>
            ← Play Solo
          </button>
          <h1>
            <span className="suit">♠</span> GRAND ROYALE <span className="suit red">♦</span>
          </h1>
          <p className="lobby-subtitle">Play with friends</p>
        </header>

        {error && <p className="lobby-error">{error}</p>}
        {status === 'connecting' && <p className="lobby-status">Connecting…</p>}

        {view === 'home' && (
          <>
            <section className="lobby-section">
              <p className="lobby-section-label">Private</p>
              <div className="lobby-actions">
                <button
                  type="button"
                  className="btn btn-primary lobby-action"
                  disabled={status === 'connecting'}
                  onClick={() => joinPrivate(() => lobbyClient.createPrivate())}
                >
                  Create Private Lobby
                </button>
                <button
                  type="button"
                  className="btn btn-ghost lobby-action"
                  disabled={status === 'connecting'}
                  onClick={() => setView('join-private')}
                >
                  Join with Code
                </button>
              </div>
            </section>

            <section className="lobby-section">
              <p className="lobby-section-label">Main Floor</p>
              <label className="lobby-name-field">
                <span>Your name</span>
                <input
                  type="text"
                  maxLength={20}
                  placeholder="High Roller"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </label>
              <div className="lobby-actions">
                <button
                  type="button"
                  className="btn btn-gold lobby-action"
                  disabled={status === 'connecting'}
                  onClick={joinMainFloor}
                >
                  Join Main Floor
                </button>
              </div>
            </section>
          </>
        )}

        {view === 'join-private' && (
          <div className="lobby-browse">
            <button type="button" className="btn btn-ghost lobby-back" onClick={() => setView('home')}>
              ← Back
            </button>
            <label className="lobby-name-field">
              <span>Lobby code</span>
              <input
                type="text"
                maxLength={4}
                placeholder="ABCD"
                value={privateCode}
                onChange={(e) => setPrivateCode(e.target.value.toUpperCase())}
                autoFocus
              />
            </label>
            <button
              type="button"
              className="btn btn-gold"
              disabled={privateCode.trim().length < 4 || status === 'connecting'}
              onClick={() => joinPrivate(() => lobbyClient.joinPrivate(privateCode.trim()))}
            >
              Join Private Lobby
            </button>
          </div>
        )}
      </div>
    </div>
  )
}