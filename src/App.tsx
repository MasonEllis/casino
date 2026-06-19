import { Canvas } from '@react-three/fiber'
import { CasinoFloor } from './components/scene/CasinoFloor'
import { SceneDecor } from './components/scene/SceneDecor'
import { BlackjackTable } from './components/scene/BlackjackTable'
import { SlotMachine } from './components/scene/SlotMachine'
import { RouletteTable } from './components/scene/RouletteTable'
import { CrapsCorner } from './components/scene/CrapsCorner'
import { CardTable } from './components/scene/CardTable'
import { Player } from './components/scene/Player'
import { RemotePlayers } from './components/scene/RemotePlayers'
import { AudioManager } from './components/ui/AudioManager'
import { HUD } from './components/ui/HUD'
import { LobbyScreen } from './components/ui/LobbyScreen'
import { MobileControls } from './components/ui/MobileControls'
import { useIsMobile } from './hooks/useIsMobile'
import { BlackjackGame } from './components/ui/BlackjackGame'
import { SlotsGame } from './components/ui/SlotsGame'
import { MultiSlotsGame } from './components/ui/MultiSlotsGame'
import { RouletteGame } from './components/ui/RouletteGame'
import { CrapsGame } from './components/ui/CrapsGame'
import { BaccaratGame } from './components/ui/BaccaratGame'
import { WarGame } from './components/ui/WarGame'
import { CrashGame } from './components/ui/CrashGame'
import { CrashTerminal } from './components/scene/CrashTerminal'
import { AtmMachine } from './components/scene/AtmMachine'
import { Jukebox } from './components/scene/Jukebox'
import { AtmGame } from './components/ui/AtmGame'
import { JukeboxGame } from './components/ui/JukeboxGame'
import { INTERACTABLES, useCasino, type GameType, type Interactable } from './game/store'

const PROPS: Record<GameType, (i: Interactable) => React.ReactNode> = {
  blackjack: (i) => <BlackjackTable key={i.id} interactable={i} />,
  slots: (i) => <SlotMachine key={i.id} interactable={i} />,
  roulette: (i) => <RouletteTable key={i.id} interactable={i} />,
  craps: (i) => <CrapsCorner key={i.id} interactable={i} />,
  baccarat: (i) => (
    <CardTable key={i.id} interactable={i} feltColor="#6b1020" lampShadeColor="#3b0d18" feltDecal="B / P" />
  ),
  war: (i) => (
    <CardTable key={i.id} interactable={i} feltColor="#15356b" lampShadeColor="#0d1f3b" feltDecal="WAR" />
  ),
  crash: (i) => <CrashTerminal key={i.id} interactable={i} />,
  atm: (i) => <AtmMachine key={i.id} interactable={i} />,
  jukebox: (i) => <Jukebox key={i.id} interactable={i} />,
}

export default function App() {
  const activeGame = useCasino((s) => s.activeGame)
  const isMobile = useIsMobile()

  return (
    <div className="app">
      <div id="world" className="world">
        <Canvas
          camera={{ fov: isMobile ? 78 : 72, near: 0.1, far: 120 }}
          dpr={isMobile ? [1, 1.5] : [1, 2]}
        >
          <color attach="background" args={['#08040d']} />
          <fog attach="fog" args={['#08040d', 20, 50]} />
          <CasinoFloor />
          <SceneDecor />
          {INTERACTABLES.map((i) => PROPS[i.type](i))}
          <Player />
          <RemotePlayers />
        </Canvas>
      </div>

      <LobbyScreen />
      <AudioManager />
      <HUD />
      <MobileControls />
      {activeGame?.type === 'blackjack' && <BlackjackGame />}
      {activeGame?.type === 'slots' &&
        ((activeGame.variant ?? 'classic') === 'classic' ? <SlotsGame /> : <MultiSlotsGame />)}
      {activeGame?.type === 'roulette' && <RouletteGame />}
      {activeGame?.type === 'craps' && <CrapsGame />}
      {activeGame?.type === 'baccarat' && <BaccaratGame />}
      {activeGame?.type === 'war' && <WarGame />}
      {activeGame?.type === 'crash' && <CrashGame />}
      {activeGame?.type === 'atm' && <AtmGame />}
      {activeGame?.type === 'jukebox' && <JukeboxGame />}
    </div>
  )
}
