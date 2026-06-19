import { lobbyClient } from '../../game/lobbyClient'
import { useLobby } from '../../game/lobby'

export function LobbyBadge() {
  const room = useLobby((s) => s.room)
  const players = useLobby((s) => s.players)
  const status = useLobby((s) => s.status)

  if (status !== 'connected' || !room) return null

  return (
    <div className="lobby-badge">
      <div className="lobby-badge-main">
        <span className="lobby-badge-label">Lobby</span>
        <span className="lobby-badge-name">{room.name}</span>
        <span className="lobby-badge-count">{players.length} online</span>
      </div>
      {room.isPrivate && room.code && (
        <span className="lobby-badge-code">Code: {room.code}</span>
      )}
      <button type="button" className="lobby-badge-leave" onClick={() => lobbyClient.leave()}>
        Leave
      </button>
    </div>
  )
}