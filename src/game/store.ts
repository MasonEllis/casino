import { create } from 'zustand'
import { playWinSound } from './audio'
import type { EmoteId } from './emotes'
import { useLobby } from './lobby'
import { lobbyClient } from './lobbyClient'
import type { SlotVariantId } from './slots'

export type GameType = 'blackjack' | 'slots' | 'roulette' | 'craps' | 'baccarat' | 'war' | 'crash' | 'atm' | 'jukebox'

const USE_VERB_TYPES = new Set<GameType>(['atm', 'jukebox'])

export function interactVerb(type: GameType): 'play' | 'use' {
  return USE_VERB_TYPES.has(type) ? 'use' : 'play'
}

export interface Interactable {
  id: string
  type: GameType
  label: string
  position: [number, number, number]
  rotationY: number
  /** distance at which the "Press E" prompt appears */
  interactRadius: number
  /** physical collision radius */
  collideRadius: number
  /** which slot machine flavor (slots only) */
  variant?: SlotVariantId
}

export const ROOM = {
  halfWidth: 19,
  halfDepth: 14,
  height: 5,
  eyeHeight: 1.65,
}

export const INTERACTABLES: Interactable[] = [
  { id: 'bj-1', type: 'blackjack', label: 'Blackjack', position: [-9, 0, -7], rotationY: 0.4, interactRadius: 3.2, collideRadius: 2.0 },
  { id: 'bj-2', type: 'blackjack', label: 'Blackjack', position: [0, 0, -9], rotationY: 0, interactRadius: 3.2, collideRadius: 2.0 },
  { id: 'bj-3', type: 'blackjack', label: 'Blackjack', position: [9, 0, -7], rotationY: -0.4, interactRadius: 3.2, collideRadius: 2.0 },
  { id: 'slot-1', type: 'slots', label: 'Lucky Slots', position: [17.5, 0, -12], rotationY: -Math.PI / 2, interactRadius: 2.4, collideRadius: 0.9, variant: 'classic' },
  { id: 'slot-2', type: 'slots', label: 'Lucky Slots', position: [17.5, 0, -8], rotationY: -Math.PI / 2, interactRadius: 2.4, collideRadius: 0.9, variant: 'classic' },
  { id: 'slot-3', type: 'slots', label: 'Lucky Slots', position: [17.5, 0, -4], rotationY: -Math.PI / 2, interactRadius: 2.4, collideRadius: 0.9, variant: 'classic' },
  { id: 'slot-4', type: 'slots', label: 'Fruit Frenzy (9 lines)', position: [17.5, 0, 0], rotationY: -Math.PI / 2, interactRadius: 2.4, collideRadius: 0.9, variant: 'nine' },
  { id: 'slot-5', type: 'slots', label: 'Fruit Frenzy (9 lines)', position: [17.5, 0, 4], rotationY: -Math.PI / 2, interactRadius: 2.4, collideRadius: 0.9, variant: 'nine' },
  { id: 'slot-6', type: 'slots', label: 'Royal Riches (20 lines)', position: [17.5, 0, 8], rotationY: -Math.PI / 2, interactRadius: 2.4, collideRadius: 0.9, variant: 'twenty' },
  { id: 'slot-7', type: 'slots', label: 'Royal Riches (20 lines)', position: [17.5, 0, 12], rotationY: -Math.PI / 2, interactRadius: 2.4, collideRadius: 0.9, variant: 'twenty' },
  { id: 'roulette-1', type: 'roulette', label: 'Roulette', position: [-16.6, 0, 0], rotationY: Math.PI / 2, interactRadius: 3.4, collideRadius: 2.1 },
  { id: 'craps-1', type: 'craps', label: 'Street Craps', position: [9, 0, 11.8], rotationY: Math.PI, interactRadius: 3.0, collideRadius: 1.3 },
  { id: 'baccarat-1', type: 'baccarat', label: 'Baccarat', position: [-6, 0, 3], rotationY: 0.7, interactRadius: 3.2, collideRadius: 2.0 },
  { id: 'war-1', type: 'war', label: 'Casino War', position: [6, 0, 3], rotationY: -0.7, interactRadius: 3.2, collideRadius: 2.0 },
  { id: 'crash-1', type: 'crash', label: 'Rocket Crash', position: [-3, 0, 12], rotationY: Math.PI, interactRadius: 3.0, collideRadius: 1.5 },
  { id: 'atm-1', type: 'atm', label: 'Curb ATM', position: [-17, 0, 8], rotationY: Math.PI / 2, interactRadius: 2.6, collideRadius: 0.8 },
  { id: 'juke-1', type: 'jukebox', label: 'Jukebox', position: [-17, 0, -5], rotationY: Math.PI / 2, interactRadius: 2.8, collideRadius: 1.0 },
]

export const COLUMN_POSITIONS: [number, number][] = [
  [-12, 6],
  [12, 6],
  [-12, -2],
  [12, -2],
]

/** circle colliders the player gets pushed out of */
export const DECOR_COLLIDERS: { x: number; z: number; r: number }[] = [
  { x: 11, z: -12.2, r: 2.6 },
  { x: -12, z: 12.2, r: 1.15 },
  { x: -17.4, z: 12.6, r: 0.55 },
]

export const COLLIDERS: { x: number; z: number; r: number }[] = [
  ...INTERACTABLES.map((i) => ({ x: i.position[0], z: i.position[2], r: i.collideRadius })),
  ...COLUMN_POSITIONS.map(([x, z]) => ({ x, z, r: 0.8 })),
  ...DECOR_COLLIDERS,
]

const BALANCE_KEY = 'casino-balance'

function loadBalance(): number {
  const raw = localStorage.getItem(BALANCE_KEY)
  const n = raw === null ? NaN : Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : 1000
}

export interface RouletteSpinState {
  tableId: string
  result: number
  startedAt: number
  durationMs: number
}

export interface ActiveEmote {
  type: EmoteId
  startedAt: number
}

interface CasinoState {
  balance: number
  activeGame: Interactable | null
  nearby: Interactable | null
  /** touch/mobile: player has entered the floor (replaces pointer lock) */
  floorEntered: boolean
  activeEmote: ActiveEmote | null
  rouletteSpin: RouletteSpinState | null
  setNearby: (i: Interactable | null) => void
  openGame: (i: Interactable) => void
  closeGame: () => void
  enterFloor: () => void
  triggerEmote: (type: EmoteId) => void
  startRouletteSpin: (tableId: string, result: number, durationMs: number, startedAt?: number) => void
  clearRouletteSpin: () => void
  addBalance: (delta: number, playWin?: boolean) => void
  resetChips: () => void
  /** re-engage pointer lock; registered by the Player controller */
  lockPointer: () => void
}

export const useCasino = create<CasinoState>((set) => ({
  balance: loadBalance(),
  activeGame: null,
  nearby: null,
  floorEntered: false,
  activeEmote: null,
  rouletteSpin: null,
  setNearby: (i) => set({ nearby: i }),
  openGame: (i) => set({ activeGame: i }),
  closeGame: () => set({ activeGame: null, rouletteSpin: null }),
  startRouletteSpin: (tableId, result, durationMs, startedAt = performance.now()) =>
    set({ rouletteSpin: { tableId, result, startedAt, durationMs } }),
  clearRouletteSpin: () => set({ rouletteSpin: null }),
  enterFloor: () => set({ floorEntered: true }),
  triggerEmote: (type) => {
    const startedAt = Date.now()
    set({ activeEmote: { type, startedAt } })
    if (useLobby.getState().status === 'connected') {
      lobbyClient.sendEmote(type)
    }
  },
  addBalance: (delta, playWin = false) => {
    if (playWin && delta > 0) playWinSound()
    set((s) => {
      const balance = Math.max(0, s.balance + delta)
      localStorage.setItem(BALANCE_KEY, String(balance))
      return { balance }
    })
  },
  resetChips: () => {
    localStorage.setItem(BALANCE_KEY, '1000')
    set({ balance: 1000 })
  },
  lockPointer: () => {},
}))
