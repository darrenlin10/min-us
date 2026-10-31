# Mine Escape (min-us)

A real-time multiplayer social strategy game for **2–8 players**, each on their own phone or computer. No login or install: open the link, type a nickname, share the 4-letter room code.

The mine has collapsed. Over 10 rounds, players walk the tunnels, drill new rooms, mine coins, trade and pool money into a shared **escape fund** (fare = 11 coins × living players). Some players may secretly be **Smugglers**, who win by keeping 25 coins for a private escape. Hidden natural exits deep in the mine save everyone. Players can steal, fight, loot, put each other on trial, and haunt their killers as ghosts.

- Game code: [`game/`](game/) (Node.js + WebSocket server, canvas + Preact/htm browser client, no build step)
- Original design handoff: [`mine-escape-handoff/`](mine-escape-handoff/) (the full spec, art sources and analysis)
- The in-game **📖 How to play** button teaches the rules.

## Run locally

```bash
cd game
npm install
npm start          # http://localhost:3000
```

Open the page in two browser windows (or on two devices on the same network) to test multiplayer.

Run the rules test suite (2-player loop, theft, merchant, combat, trials, elections, escape checks and 30 randomized full games):

```bash
cd game && npm test
```

`SPEEDUP=4 npm start` runs the game clock 4× faster for quick playtesting.

## Deploy (Render, free)

1. Sign in at https://render.com with GitHub.
2. **New → Blueprint**, pick this repository and branch, click **Apply**. `render.yaml` configures everything.
3. Share the `https://<name>.onrender.com` URL. Free instances sleep after ~15 min idle and take ~30–60 s to wake on the first visit.

Any Node 20+ host with WebSocket support works (Railway, Fly.io, a VPS): run `npm install && npm start` in `game/`; it listens on `$PORT`.

Game state lives in server memory: a server restart or redeploy ends games in progress.
