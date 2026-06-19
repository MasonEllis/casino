import {
  LOBBY_WS_PATH,
  MAIN_PUBLIC_ROOM_ID,
  type ClientMessage,
  type MusicTrackId,
  type ServerMessage,
} from '../../shared/lobbyProtocol'
import type { EmoteId } from './emotes'
import { applyMusicTrack, restorePersonalMusicTrack, startBackgroundMusic } from './audio'
import { resolveJoinName, useLobby } from './lobby'

function lobbyWsUrl(): string {
  const configured = import.meta.env.VITE_LOBBY_WS_URL as string | undefined
  if (configured) return configured
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  if (import.meta.env.DEV) {
    return `${proto}//${location.hostname}:8787${LOBBY_WS_PATH}`
  }
  return `${proto}//${location.host}${LOBBY_WS_PATH}`
}

class LobbyClient {
  private socket: WebSocket | null = null
  private intentionalClose = false
  private pendingAction: (() => void) | null = null

  connect() {
    if (this.socket?.readyState === WebSocket.OPEN) return
    if (this.socket?.readyState === WebSocket.CONNECTING) return

    useLobby.getState().setStatus('connecting')
    useLobby.getState().setError(null)

    const ws = new WebSocket(lobbyWsUrl())
    this.socket = ws

    ws.onopen = () => {
      useLobby.getState().setStatus('idle')
      const action = this.pendingAction
      this.pendingAction = null
      action?.()
    }

    ws.onmessage = (event) => {
      let msg: ServerMessage
      try {
        msg = JSON.parse(String(event.data)) as ServerMessage
      } catch {
        return
      }
      this.handleServerMessage(msg)
    }

    ws.onclose = () => {
      this.socket = null
      const wasConnected = useLobby.getState().status === 'connected'
      const hadPending = this.pendingAction !== null
      this.pendingAction = null
      useLobby.getState().reset()
      if (!this.intentionalClose) {
        if (wasConnected) {
          restorePersonalMusicTrack()
          useLobby.getState().setError('Disconnected from lobby.')
        } else if (hadPending) {
          useLobby.getState().setError('Could not reach the lobby server.')
        }
      }
      this.intentionalClose = false
    }

    ws.onerror = () => {
      useLobby.getState().setError('Could not reach the lobby server.')
    }
  }

  private send(message: ClientMessage): boolean {
    if (this.socket?.readyState !== WebSocket.OPEN) return false
    this.socket.send(JSON.stringify(message))
    return true
  }

  private runWhenOpen(action: () => void) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      action()
      return
    }
    this.pendingAction = action
    this.connect()
  }

  joinMainFloor() {
    this.runWhenOpen(() => {
      if (!this.send({
        type: 'join',
        name: resolveJoinName(),
        mode: 'public',
        roomId: MAIN_PUBLIC_ROOM_ID,
      })) {
        useLobby.getState().setError('Could not reach the lobby server.')
      }
    })
  }

  createPrivate() {
    this.runWhenOpen(() => {
      if (!this.send({ type: 'join', name: resolveJoinName(), mode: 'private-create' })) {
        useLobby.getState().setError('Could not reach the lobby server.')
      }
    })
  }

  joinPrivate(code: string) {
    this.runWhenOpen(() => {
      if (!this.send({ type: 'join', name: resolveJoinName(), mode: 'private-join', code })) {
        useLobby.getState().setError('Could not reach the lobby server.')
      }
    })
  }

  sendMove(x: number, y: number, z: number, yaw: number) {
    this.send({ type: 'move', x, y, z, yaw })
  }

  sendEmote(emote: EmoteId) {
    this.send({ type: 'emote', emote })
  }

  setMusic(track: MusicTrackId) {
    this.send({ type: 'set-music', track })
  }

  leave() {
    this.send({ type: 'leave' })
    useLobby.getState().reset()
    restorePersonalMusicTrack()
  }

  disconnect() {
    this.intentionalClose = true
    this.pendingAction = null
    if (this.socket) {
      this.socket.onclose = null
      this.socket.close()
      this.socket = null
    }
    useLobby.getState().reset()
    restorePersonalMusicTrack()
  }

  private handleServerMessage(msg: ServerMessage) {
    const store = useLobby.getState()
    switch (msg.type) {
      case 'welcome':
        store.setWelcome(msg.playerId, {
          id: msg.roomId,
          name: msg.roomName,
          code: msg.code,
          isPrivate: msg.isPrivate,
        }, msg.players, msg.musicTrack)
        applyMusicTrack(msg.musicTrack)
        startBackgroundMusic()
        break
      case 'music-update':
        store.setMusicTrack(msg.musicTrack)
        applyMusicTrack(msg.musicTrack)
        startBackgroundMusic()
        break
      case 'room-update':
        store.setPlayers(msg.players)
        break
      case 'player-left':
        store.removePlayer(msg.playerId)
        break
      case 'error':
        store.setError(msg.message)
        break
    }
  }
}

export const lobbyClient = new LobbyClient()