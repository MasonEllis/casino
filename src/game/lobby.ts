import { create } from 'zustand'
import {
  DEFAULT_MUSIC_TRACK,
  type MusicTrackId,
  type RemotePlayer,
} from '../../shared/lobbyProtocol'

export type LobbyConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error'

export interface LobbyRoomInfo {
  id: string
  name: string
  code?: string
  isPrivate: boolean
}

interface LobbyState {
  status: LobbyConnectionStatus
  error: string | null
  pickerOpen: boolean
  playerId: string | null
  room: LobbyRoomInfo | null
  musicTrack: MusicTrackId
  players: RemotePlayer[]
  displayName: string
  setDisplayName: (name: string) => void
  setPickerOpen: (open: boolean) => void
  setStatus: (status: LobbyConnectionStatus) => void
  setError: (message: string | null) => void
  setWelcome: (
    playerId: string,
    room: LobbyRoomInfo,
    players: RemotePlayer[],
    musicTrack: MusicTrackId,
  ) => void
  setMusicTrack: (musicTrack: MusicTrackId) => void
  setPlayers: (players: RemotePlayer[]) => void
  removePlayer: (playerId: string) => void
  reset: () => void
}

const NAME_KEY = 'casino-display-name'

function loadName(): string {
  return localStorage.getItem(NAME_KEY) ?? ''
}

/** Use saved name when set; otherwise assign a random guest label. */
export function resolveJoinName(): string {
  const trimmed = useLobby.getState().displayName.trim()
  if (trimmed) return trimmed
  return `Guest ${Math.floor(1000 + Math.random() * 9000)}`
}

export const useLobby = create<LobbyState>((set) => ({
  status: 'idle',
  error: null,
  pickerOpen: false,
  playerId: null,
  room: null,
  musicTrack: DEFAULT_MUSIC_TRACK,
  players: [],
  displayName: loadName(),
  setDisplayName: (name) => {
    localStorage.setItem(NAME_KEY, name)
    set({ displayName: name })
  },
  setPickerOpen: (pickerOpen) => set({ pickerOpen }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error, status: error ? 'error' : 'idle' }),
  setWelcome: (playerId, room, players, musicTrack) =>
    set({
      status: 'connected',
      error: null,
      playerId,
      room,
      musicTrack,
      players,
    }),
  setMusicTrack: (musicTrack) => set({ musicTrack }),
  setPlayers: (players) => set({ players }),
  removePlayer: (playerId) =>
    set((s) => ({
      players: s.players.filter((p) => p.id !== playerId),
    })),
  reset: () =>
    set({
      status: 'idle',
      error: null,
      playerId: null,
      room: null,
      musicTrack: DEFAULT_MUSIC_TRACK,
      players: [],
    }),
}))