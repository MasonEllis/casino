import { createServer, type IncomingMessage } from 'node:http'
import { randomBytes } from 'node:crypto'
import { WebSocketServer, type WebSocket } from 'ws'
import {
  DEFAULT_MUSIC_TRACK,
  LOBBY_WS_PATH,
  MAIN_PUBLIC_ROOM_ID,
  MAX_PLAYERS_PER_ROOM,
  type ClientMessage,
  type MusicTrackId,
  type RemotePlayer,
  type ServerMessage,
  isMusicTrackId,
  parseMessage,
} from '../shared/lobbyProtocol.ts'

const PORT = Number(process.env.LOBBY_PORT ?? 8787)

interface Player {
  id: string
  name: string
  ws: WebSocket
  x: number
  y: number
  z: number
  yaw: number
}

interface Room {
  id: string
  name: string
  isPrivate: boolean
  code?: string
  musicTrack: MusicTrackId
  players: Map<string, Player>
}

const rooms = new Map<string, Room>()

function ensureMainRoom() {
  if (!rooms.has(MAIN_PUBLIC_ROOM_ID)) {
    rooms.set(MAIN_PUBLIC_ROOM_ID, {
      id: MAIN_PUBLIC_ROOM_ID,
      name: 'Main Floor',
      isPrivate: false,
      musicTrack: DEFAULT_MUSIC_TRACK,
      players: new Map(),
    })
  }
}

function send(ws: WebSocket, message: ServerMessage) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(message))
}

function playerSnapshot(p: Player): RemotePlayer {
  return { id: p.id, name: p.name, x: p.x, y: p.y, z: p.z, yaw: p.yaw }
}

function broadcastRoom(room: Room, message: ServerMessage, exceptId?: string) {
  for (const p of room.players.values()) {
    if (p.id !== exceptId) send(p.ws, message)
  }
}

function roomPlayers(room: Room): RemotePlayer[] {
  return [...room.players.values()].map(playerSnapshot)
}

function generateId(): string {
  return randomBytes(8).toString('hex')
}

function generateCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  if ([...rooms.values()].some((r) => r.code === code)) return generateCode()
  return code
}

function sanitizeName(name: string): string {
  const trimmed = name.trim().slice(0, 20)
  return trimmed.length > 0 ? trimmed : 'Guest'
}

function removePlayer(playerId: string) {
  for (const room of rooms.values()) {
    const player = room.players.get(playerId)
    if (!player) continue
    room.players.delete(playerId)
    broadcastRoom(room, { type: 'player-left', playerId })
    broadcastRoom(room, { type: 'room-update', players: roomPlayers(room) })
    if (room.isPrivate && room.players.size === 0) rooms.delete(room.id)
    break
  }
}

function joinRoom(ws: WebSocket, room: Room, name: string): Player | null {
  if (room.players.size >= MAX_PLAYERS_PER_ROOM) {
    send(ws, { type: 'error', message: 'This lobby is full.' })
    return null
  }

  const player: Player = {
    id: generateId(),
    name: sanitizeName(name),
    ws,
    x: 0,
    y: 1.65,
    z: 10,
    yaw: 0,
  }

  room.players.set(player.id, player)
  ;(ws as WebSocket & { playerId?: string }).playerId = player.id
  ;(ws as WebSocket & { roomId?: string }).roomId = room.id

  const welcome: ServerMessage = {
    type: 'welcome',
    playerId: player.id,
    roomId: room.id,
    roomName: room.name,
    code: room.code,
    isPrivate: room.isPrivate,
    musicTrack: room.musicTrack,
    players: roomPlayers(room),
  }
  send(ws, welcome)
  broadcastRoom(room, { type: 'room-update', players: roomPlayers(room) }, player.id)
  return player
}

function handleJoin(ws: WebSocket, msg: Extract<ClientMessage, { type: 'join' }>) {
  ensureMainRoom()

  if (msg.mode === 'public') {
    if (msg.roomId !== MAIN_PUBLIC_ROOM_ID) {
      send(ws, { type: 'error', message: 'Lobby not found.' })
      return
    }
    const room = rooms.get(MAIN_PUBLIC_ROOM_ID)
    if (!room) {
      send(ws, { type: 'error', message: 'Lobby not found.' })
      return
    }
    joinRoom(ws, room, msg.name)
    return
  }

  if (msg.mode === 'private-create') {
    const room: Room = {
      id: generateId(),
      name: 'Private Lobby',
      isPrivate: true,
      code: generateCode(),
      musicTrack: DEFAULT_MUSIC_TRACK,
      players: new Map(),
    }
    rooms.set(room.id, room)
    joinRoom(ws, room, msg.name)
    return
  }

  if (msg.mode === 'private-join') {
    const code = msg.code.trim().toUpperCase()
    const room = [...rooms.values()].find((r) => r.isPrivate && r.code === code)
    if (!room) {
      send(ws, { type: 'error', message: 'Invalid lobby code.' })
      return
    }
    joinRoom(ws, room, msg.name)
  }
}

function handleMessage(ws: WebSocket, raw: string) {
  const msg = parseMessage(raw)
  if (!msg) return

  if (msg.type === 'leave') {
    const playerId = (ws as WebSocket & { playerId?: string }).playerId
    if (playerId) removePlayer(playerId)
    return
  }

  if (msg.type === 'join') {
    handleJoin(ws, msg)
    return
  }

  if (msg.type === 'set-music') {
    const playerId = (ws as WebSocket & { playerId?: string }).playerId
    const roomId = (ws as WebSocket & { roomId?: string }).roomId
    if (!playerId || !roomId) return
    const room = rooms.get(roomId)
    if (!room?.players.has(playerId)) return
    if (!isMusicTrackId(msg.track)) return

    room.musicTrack = msg.track
    for (const p of room.players.values()) {
      send(p.ws, { type: 'music-update', musicTrack: room.musicTrack })
    }
    return
  }

  if (msg.type === 'move') {
    const playerId = (ws as WebSocket & { playerId?: string }).playerId
    const roomId = (ws as WebSocket & { roomId?: string }).roomId
    if (!playerId || !roomId) return
    const room = rooms.get(roomId)
    const player = room?.players.get(playerId)
    if (!player) return

    player.x = msg.x
    player.y = msg.y
    player.z = msg.z
    player.yaw = msg.yaw

    broadcastRoom(
      room!,
      {
        type: 'room-update',
        players: roomPlayers(room!),
      },
      playerId,
    )
  }
}

ensureMainRoom()

const server = createServer((_req: IncomingMessage, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Grand Royale lobby server')
})

const wss = new WebSocketServer({ server, path: LOBBY_WS_PATH })

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    handleMessage(ws, String(data))
  })

  ws.on('close', () => {
    const playerId = (ws as WebSocket & { playerId?: string }).playerId
    if (playerId) removePlayer(playerId)
  })
})

server.listen(PORT, () => {
  console.log(`Lobby server listening on :${PORT}${LOBBY_WS_PATH}`)
})