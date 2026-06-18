import { useCallback, useEffect, useRef, useState } from 'react'
import {
  newShoe,
  handValue,
  isBlackjack,
  isBust,
  dealerShouldHit,
  settle,
  payout,
  canSplitHand,
  type Card,
  type Outcome,
} from '../../game/blackjack'
import { playCardDealSound } from '../../game/audio'
import { blackjackInitialSteps, CARD_REVEAL_MS, scheduleCardReveals } from '../../game/dealSequence'
import { useCasino } from '../../game/store'
import { PlayingCard } from './PlayingCard'

type Phase = 'betting' | 'dealing' | 'playing' | 'dealer' | 'done'

const CHIP_VALUES = [10, 25, 50, 100]

const OUTCOME_MESSAGES: Record<Outcome, string> = {
  blackjack: 'Blackjack! Paid 3:2',
  win: 'You win!',
  push: 'Push — bet returned',
  lose: 'Dealer wins',
}

export function BlackjackGame() {
  const balance = useCasino((s) => s.balance)
  const addBalance = useCasino((s) => s.addBalance)
  const closeGame = useCasino((s) => s.closeGame)
  const resetChips = useCasino((s) => s.resetChips)

  const leave = useCallback(() => {
    closeGame()
    useCasino.getState().lockPointer()
  }, [closeGame])

  const shoe = useRef<Card[]>(newShoe())
  const [phase, setPhase] = useState<Phase>('betting')
  const [bet, setBet] = useState(0)
  const [hands, setHands] = useState<Card[][]>([[]])
  const [handBets, setHandBets] = useState<number[]>([0])
  const [handFinished, setHandFinished] = useState<boolean[]>([false])
  const [activeHand, setActiveHand] = useState(0)
  const [splitPerformed, setSplitPerformed] = useState(false)
  const [dealer, setDealer] = useState<Card[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [lastDelta, setLastDelta] = useState(0)
  const [drawing, setDrawing] = useState(false)
  const timers = useRef<number[]>([])

  const totalWager = handBets.reduce((sum, w) => sum + w, 0)
  const currentHand = hands[activeHand] ?? []

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((t) => window.clearTimeout(t))
  }, [])

  const draw = useCallback((): Card => {
    if (shoe.current.length < 15) shoe.current = newShoe()
    return shoe.current.pop()!
  }, [])

  const finishRound = useCallback(
    (playerHands: Card[][], dealerHand: Card[], wagers: number[], fromSplit: boolean) => {
      let totalReturned = 0
      let totalWagered = 0
      let wins = 0
      let losses = 0
      let pushes = 0

      for (let i = 0; i < playerHands.length; i++) {
        const hand = playerHands[i]
        const wager = wagers[i]
        totalWagered += wager
        const outcome: Outcome = isBust(hand) ? 'lose' : settle(hand, dealerHand)
        const returned = payout(outcome, wager, fromSplit)
        totalReturned += returned
        if (returned > wager) wins++
        else if (returned === 0) losses++
        else pushes++
      }

      if (totalReturned > 0) addBalance(totalReturned, wins > 0)
      setLastDelta(totalReturned - totalWagered)

      if (playerHands.length > 1) {
        if (wins === playerHands.length) setMessage('Both hands win!')
        else if (losses === playerHands.length) setMessage('Both hands lose')
        else setMessage(`Split: ${wins} won, ${losses} lost${pushes ? `, ${pushes} push` : ''}`)
      } else {
        const hand = playerHands[0]
        const outcome: Outcome = isBust(hand) ? 'lose' : settle(hand, dealerHand)
        setMessage(isBust(hand) ? 'Bust!' : OUTCOME_MESSAGES[outcome])
      }

      setPhase('done')
    },
    [addBalance],
  )

  const advanceFinishedHand = useCallback(
    (handIdx: number, playerHands: Card[][], wagers: number[]) => {
      setHandFinished((finished) => {
        const updated = finished.map((f, i) => (i === handIdx ? true : f))
        const nextIdx = updated.findIndex((done) => !done)
        if (nextIdx === -1) {
          if (playerHands.every((h) => isBust(h))) finishRound(playerHands, dealer, wagers, splitPerformed)
          else setPhase('dealer')
        } else {
          setActiveHand(nextIdx)
        }
        return updated
      })
    },
    [dealer, finishRound, splitPerformed],
  )

  const deal = () => {
    if (bet <= 0 || bet > balance || phase !== 'betting') return
    addBalance(-bet)
    const p = [draw(), draw()]
    const d = [draw(), draw()]
    setHands([[]])
    setHandBets([bet])
    setHandFinished([false])
    setActiveHand(0)
    setSplitPerformed(false)
    setDealer([])
    setMessage(null)
    setLastDelta(0)
    setPhase('dealing')

    const steps = blackjackInitialSteps(p, d)
    timers.current.push(
      ...scheduleCardReveals(
        steps,
        (step) => {
          if (step.hand === 'player') setHands((h) => [[...h[0], step.card]])
          else setDealer((h) => [...h, step.card])
        },
        () => {
          setHands([p])
          setDealer(d)
          if (isBlackjack(p) || isBlackjack(d)) finishRound([p], d, [bet], false)
          else setPhase('playing')
        },
      ),
    )
  }

  const hit = () => {
    if (phase !== 'playing' || drawing) return
    const handIdx = activeHand
    setDrawing(true)
    const card = draw()
    timers.current.push(
      window.setTimeout(() => {
        playCardDealSound()
        setDrawing(false)
        setHands((prev) => {
          const next = prev.map((h, i) => (i === handIdx ? [...h, card] : h))
          if (isBust(next[handIdx])) {
            setHandBets((wagers) => {
              advanceFinishedHand(handIdx, next, wagers)
              return wagers
            })
          }
          return next
        })
      }, CARD_REVEAL_MS),
    )
  }

  const stand = () => {
    if (phase !== 'playing' || drawing) return
    advanceFinishedHand(activeHand, hands, handBets)
  }

  const activeWager = handBets[activeHand] ?? 0
  const canDouble =
    phase === 'playing' && currentHand.length === 2 && balance >= activeWager && !drawing

  const doubleDown = () => {
    if (!canDouble) return
    const handIdx = activeHand
    addBalance(-activeWager)
    setDrawing(true)
    const card = draw()
    timers.current.push(
      window.setTimeout(() => {
        playCardDealSound()
        setDrawing(false)
        setHandBets((wagers) => {
          const newWagers = wagers.map((w, i) => (i === handIdx ? w * 2 : w))
          setHands((prev) => {
            const next = prev.map((h, i) => (i === handIdx ? [...h, card] : h))
            advanceFinishedHand(handIdx, next, newWagers)
            return next
          })
          return newWagers
        })
      }, CARD_REVEAL_MS),
    )
  }

  const canSplit =
    phase === 'playing' &&
    !splitPerformed &&
    hands.length === 1 &&
    canSplitHand(currentHand) &&
    balance >= activeWager &&
    !drawing

  const split = () => {
    if (!canSplit) return
    const [c0, c1] = currentHand
    addBalance(-activeWager)
    const wager = activeWager
    setSplitPerformed(true)
    setHands([[c0], [c1]])
    setHandBets([wager, wager])
    setHandFinished([false, false])
    setActiveHand(0)
    setDrawing(true)

    const card0 = draw()
    const card1 = draw()
    const splitAces = c0.rank === 'A'

    timers.current.push(
      window.setTimeout(() => {
        playCardDealSound()
        setHands([[c0, card0], [c1]])
        timers.current.push(
          window.setTimeout(() => {
            playCardDealSound()
            const finalHands = [[c0, card0], [c1, card1]]
            setHands(finalHands)
            setDrawing(false)
            if (splitAces) {
              setHandFinished([true, true])
              setPhase('dealer')
            } else {
              setPhase('playing')
              setActiveHand(0)
            }
          }, CARD_REVEAL_MS),
        )
      }, CARD_REVEAL_MS),
    )
  }

  useEffect(() => {
    if (phase !== 'dealer') return
    if (dealerShouldHit(dealer)) {
      const t = setTimeout(() => {
        playCardDealSound()
        const card = draw()
        setDealer((d) => [...d, card])
      }, 650)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => finishRound(hands, dealer, handBets, splitPerformed), 500)
    return () => clearTimeout(t)
  }, [phase, dealer, hands, handBets, splitPerformed, draw, finishRound])

  const newHand = () => {
    setPhase('betting')
    setHands([[]])
    setHandBets([0])
    setHandFinished([false])
    setActiveHand(0)
    setSplitPerformed(false)
    setDealer([])
    setBet(0)
    setMessage(null)
  }

  const canLeave = phase === 'betting' || phase === 'done'
  const busy = phase === 'dealing' || phase === 'dealer' || drawing

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && canLeave) leave()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [canLeave, leave])

  const dealerRevealed = phase === 'dealer' || phase === 'done'
  const dealerVal = dealer.length
    ? dealerRevealed
      ? handValue(dealer).total
      : handValue([dealer[0]]).total
    : null

  return (
    <div className="overlay">
      <div className="game-panel blackjack-panel">
        <div className="game-header">
          <h2>♠ Blackjack</h2>
          <button className="btn btn-ghost" onClick={leave} disabled={!canLeave}>
            Leave Table
          </button>
        </div>

        <div className="bj-table">
          <div className="bj-hand">
            <div className="bj-hand-label">
              Dealer {dealerVal !== null && <span className="bj-total">{dealerVal}{!dealerRevealed && ' + ?'}</span>}
            </div>
            <div className="bj-cards">
              {dealer.map((c, i) => (
                <PlayingCard key={i} card={c} faceDown={i === 1 && !dealerRevealed} />
              ))}
              {dealer.length === 0 && <div className="card card-slot" />}
            </div>
          </div>

          {message && (
            <div className={`bj-result ${lastDelta > 0 ? 'win' : lastDelta < 0 ? 'lose' : ''}`}>
              {message}
              {phase === 'done' && lastDelta !== 0 && (
                <span className="bj-delta">{lastDelta > 0 ? `+${lastDelta}` : lastDelta}</span>
              )}
            </div>
          )}

          <div className={`bj-player-hands ${hands.length > 1 ? 'bj-split' : ''}`}>
            {hands.map((hand, i) => {
              const val = hand.length ? handValue(hand).total : null
              const isActive = i === activeHand && phase === 'playing' && !handFinished[i]
              return (
                <div
                  key={i}
                  className={`bj-hand ${isActive ? 'bj-hand-active' : ''} ${handFinished[i] ? 'bj-hand-done' : ''}`}
                >
                  <div className="bj-hand-label">
                    {hands.length > 1 ? `Hand ${i + 1}` : 'You'}
                    {val !== null && <span className="bj-total">{val}</span>}
                    {hands.length > 1 && handBets[i] > 0 && (
                      <span className="bj-hand-bet">{handBets[i]}</span>
                    )}
                  </div>
                  <div className="bj-cards">
                    {hand.map((c, j) => (
                      <PlayingCard key={j} card={c} />
                    ))}
                    {hand.length === 0 && <div className="card card-slot" />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="game-footer">
          <div className="balance-line">
            <span className="hud-chip" /> {balance.toLocaleString()}
            {totalWager > 0 && <span className="bet-line">Bet: {totalWager}</span>}
          </div>

          {phase === 'betting' && (
            <div className="controls">
              {CHIP_VALUES.map((v) => (
                <button
                  key={v}
                  className={`chip-btn chip-${v}`}
                  disabled={bet + v > balance}
                  onClick={() => setBet((b) => b + v)}
                >
                  {v}
                </button>
              ))}
              <button className="btn btn-ghost" disabled={bet === 0} onClick={() => setBet(0)}>
                Clear
              </button>
              <button className="btn btn-primary" disabled={bet === 0} onClick={deal}>
                Deal
              </button>
              {balance < CHIP_VALUES[0] && bet === 0 && (
                <button className="btn btn-gold" onClick={resetChips}>
                  Claim 1,000 free chips
                </button>
              )}
            </div>
          )}

          {phase === 'dealing' && <div className="controls dealer-thinking">Dealing…</div>}

          {phase === 'playing' && (
            <div className="controls">
              <button className="btn btn-primary" disabled={busy} onClick={hit}>Hit</button>
              <button className="btn btn-primary" disabled={busy} onClick={stand}>Stand</button>
              <button className="btn btn-gold" disabled={!canDouble} onClick={doubleDown}>
                Double
              </button>
              <button className="btn btn-gold" disabled={!canSplit} onClick={split}>
                Split
              </button>
            </div>
          )}

          {phase === 'dealer' && <div className="controls dealer-thinking">Dealer is drawing…</div>}

          {phase === 'done' && (
            <div className="controls">
              <button className="btn btn-primary" onClick={newHand}>New Hand</button>
              <button className="btn btn-ghost" onClick={leave}>Leave Table</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}