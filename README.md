# Grand Royale Casino

A first-person 3D casino built with React Three Fiber. Walk the floor, sit down at a blackjack table, or pull the lever on the slots — all with a shared chip balance that persists between visits.

## Controls

| Input | Action |
| --- | --- |
| Click | Lock the cursor and enter the floor |
| `W A S D` / arrows | Walk |
| `Shift` | Sprint |
| Mouse | Look around |
| `E` | Play the nearby table or machine |
| `Esc` | Release cursor / leave a game |

## Games

- **Blackjack** — chip-based betting, hit / stand / double down, dealer stands on 17, blackjack pays 3:2
- **Lucky Slots** — classic 3 reels with staggered stops, weighted symbols, paytable up to 100x
- **Fruit Frenzy / Royal Riches** — 5x3 video slots with 9 or 20 paylines, left-to-right runs pay up to 1000x per line
- **Roulette** — European single-zero wheel, straight-up numbers (35:1), dozens (2:1), and even-money outside bets
- **Street Craps** — back-corner dice game, pass / don't pass, point rounds, seven out
- **Baccarat** — player / banker / tie with the full third-card tableau, banker pays 0.95:1, tie pays 8:1
- **Casino War** — high card wins; on a tie, surrender for half or go to war

You start with 1,000 chips (persisted to `localStorage`). If you go broke, claim 1,000 free chips from any game.

## Development

```bash
npm install
npm run dev
```

Built with Vite, React, TypeScript, three.js, @react-three/fiber, @react-three/drei, and zustand.
