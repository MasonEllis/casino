export const LOBBY_WS_PATH = '/casino/lobby'
export const MAX_PLAYERS_PER_ROOM = 16
export const MAIN_PUBLIC_ROOM_ID = 'main'

export const MUSIC_TRACK_IDS = ['lounge', 'ambient', 'velvet', 'neon', 'jackpot'] as const
export type MusicTrackId = (typeof MUSIC_TRACK_IDS)[number]
export const DEFAULT_MUSIC_TRACK: MusicTrackId = 'lounge'

export function isMusicTrackId(value: string): value is MusicTrackId {
  return (MUSIC_TRACK_IDS as readonly string[]).includes(value)
}

export interface RemotePlayer {
  id: string
  name: string
  x: number
  y: number
  z: number
  yaw: number
  emote?: string | null
  emoteStartedAt?: number
}

export type ClientMessage =
  | { type: 'join'; name: string; mode: 'public'; roomId: string }
  | { type: 'join'; name: string; mode: 'private-create' }
  | { type: 'join'; name: string; mode: 'private-join'; code: string }
  | { type: 'move'; x: number; y: number; z: number; yaw: number }
  | { type: 'emote'; emote: string }
  | { type: 'set-music'; track: MusicTrackId }
  | { type: 'leave' }

export type ServerMessage =
  | {
      type: 'welcome'
      playerId: string
      roomId: string
      roomName: string
      code?: string
      isPrivate: boolean
      musicTrack: MusicTrackId
      players: RemotePlayer[]
    }
  | { type: 'room-update'; players: RemotePlayer[] }
  | { type: 'music-update'; musicTrack: MusicTrackId }
  | { type: 'player-left'; playerId: string }
  | { type: 'error'; message: string }

export function parseMessage(raw: string): ClientMessage | null {
  try {
    const data = JSON.parse(raw) as ClientMessage
    if (!data || typeof data !== 'object' || !('type' in data)) return null
    return data
  } catch {
    return null
  }
}