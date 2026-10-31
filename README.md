# Mine Escape (min-us)

A real-time multiplayer social strategy game for **3–8 players**, each on their own phone or computer. No login, no install: open the link, pick a nickname, create or join a room with a 4-letter code.

> **👥 You need at least 3 players to start a game.** Each player uses their own device, or for a quick solo test, three separate browser tabs or windows (each tab gets its own seat).

> The mine has collapsed behind your crew. Over 10 rounds you walk the tunnels, drill new rooms, mine coins and pool them into a shared **escape fund**. But some of you may secretly be **Smugglers**, hoarding coins for a private way out.

- **Game code:** [`game/`](game/): Node.js + WebSocket server, canvas + Preact/htm browser client, no build step.
- **Original design handoff:** [`mine-escape-handoff/`](mine-escape-handoff/): full GPT-assisted spec, art sources and analysis.
- **In game:** the main menu has short instruction panels (Objective, Careers, Smugglers, Controls), and 📖 opens the full rules at any time.

---

## How to play

### Getting into a game
1. Open the game URL. The **main menu** explains the objective, careers, Smugglers and controls. **Start game** opens the game lobby; **Quit game** leaves.
2. In the **game lobby**, enter a nickname, then either **Create a room** (you get a unique 4-letter room code) or **Join a room** by typing a friend's code. Invite links (`/room/CODE`) fill the code in for you.
3. In the room, everyone taps **I'm ready**. The match starts when **all** players (3–8) are ready.
4. Read your **private identity card** (🪪): your career and whether you are secretly a Smuggler.

During a match, **☰ → Return to main menu** steps away without leaving. Your character stays in the mine and you can **Resume your game** from the main menu. If you're gone for more than one round of game time (130 s), you forfeit.

### Winning
| Who | How they win |
|---|---|
| Ordinary players | At the end of a round, the shared fund holds **11 coins × every living player**. The group escapes together. |
| Smugglers (secret, 0–2) | At the end of a round, they hold **25 coins in their own wallet** and escape privately (one per round-end check). |
| Everyone alive | Someone discovers one of the **3 hidden natural exits** (14–16 rooms from the start). Every survivor escapes free. |

Anyone still underground after round 10 loses. Wallets are private; contributions to the fund are public.

### A round (130 seconds)
| Time | Phase | What to do |
|---|---|---|
| 0–10 s | Arrival | Walk to a **camp** (bright crystal Safe Zone). |
| 10–50 s | Camp choices | Fill your action slots, shop (closes at 48 s), buy services, post/approve pledges. |
| 50–60 s | Departure | Walk out to where you'll act. |
| 60–110 s | Field | Tap your action slots to mine, drill, loot, attack, heal, deposit… |
| 110–125 s | Return | Walk back to a camp. Deposits still allowed. |
| 125–130 s | Settlement | Escape check at 130 s. |

Nobody teleports: you physically walk back to a camp every round. New Safe Zones found deeper in the mine become forward camps.

### Actions
You get **2 free action slots** per round; the Merchant sells up to 2 more (max 4). In camp, put into each slot a free basic tool, an item you own, or a **Deposit** / **Trial** marker.

Everything you can do is offered in the **"What do you do?" box** at the bottom of the screen: a numbered list of plain-language choices for exactly where you're standing ("⛏ Mine a coin here", "🔨 Drill a tunnel east", "⚔ Attack Ben with your Club", "🏦 Deposit all 5 coins", "⬇ Climb down the ladder", "📋 Prepare my action slots"…). Tap a choice or press its number key. Choices you can't use right now stay listed, greyed out with the reason ("stand in a coin mine"), so the rules teach themselves. Physical actions take **3 seconds standing still**. Moving cancels them, and so does being hit by an attack: the only way another player can interrupt you. An interrupted action costs nothing: you keep the tool and the action and can try again. Tools are only used up when the work completes. Items stay in your **7-item bag** (shown as 🎒 in the top bar) until they expire (2–5 rounds). **A tool you put in a slot but didn't use keeps that slot next round** (marked ↺, locked to that tool, up to 2), on top of your 2 new free slots; the 4-actions-per-round maximum still applies. Markers and empty slots don't carry over. If slot 1 is left empty, your career tool is equipped for you.

| Slot contents | Effect |
|---|---|
| Pickaxe | Mine 1 coin in a coin mine. Workers mine up to 2/round, others 1. |
| Drill (Explorer only) | Open a sealed wall or dig downward. Finds coin mines, treasure, supply caches, new camps, traps or empty galleries. |
| Crowbar | Loot a treasure chest, a dropped item, or a body (half its coins; Scavengers take all). |
| Hook | At any time, silently steal 1 coin (Thief: up to 2) from someone in the same room. The victim isn't told; you can rob each person once per round. |
| Deposit marker | Put any amount into the escape fund (field, return or settlement). |
| Club / Blade / Gun (bought privately at the machine) | Attack a visible player in an unsafe room: 1 / 2 / 3 damage (gun reaches 4 tiles). Bodies keep their coins. |
| Trial marker | In a camp during field time, pay 6+ coins to accuse someone there. Guilty needs a majority of **all** living players. |
| Potion / Rescue kit / Lantern / Compass | Heal 1 HP / free a trapped player / light a room / private rough bearing to the nearest exit (Explorer, depth 0). |

### Careers (public)
| Career | Ability |
|---|---|
| Worker | Mines up to 2 coins per round (others mine 1). |
| Explorer | The only career that drills new rooms; gets a 1-coin finder's share of treasure. |
| Merchant | Sells extra action slots (prices 1, 2, 3… per round) and advanced goods unlocked by upgrading the shop (potions, compass, rescue kits, reinforced lanterns). At most 2 coins of profit per round; gets a free potion each round. |
| Guard | Sells one wallet lock (1c, blocks theft) and one life shield (2c, blocks a hit) per round; both work immediately until the round ends. |
| Thief | Steals 2 coins per hook instead of 1. |
| Scavenger | Loots in 1 s instead of 3 s and can take every coin from a body. |

Rosters by player count: 3 = Worker, Explorer, Merchant · 4 = + one specialist (Guard/Thief/Scavenger, chosen in the room) · 5 = + second Worker · 6 = + second Explorer · 7 = + second specialist · 8 = all careers.

### Pledges (contribution proposals)
There is no free-text chat. In camp, open **🏕 Camp → Pledges** to post a plan asking each player for an amount (the **Split what's needed** button divides the remaining fare evenly). Others tap 👍 / 👎. Pledges are **promises only**: no coins move, and each player still has to use their own Deposit action. The board shows **asked vs. gave this round** for everyone, so broken promises are visible. Editing a plan resets its approvals; plans reset every round.

### Other rules
- **Mines** hold 8 coins, give at most 2 per round, and are **first come, first served**: one person mines at a time, and when they finish the next player can take what's left.
- **Traps** snare the discovering Explorer for next round's field time (no movement or work); a rescue kit frees them.
- **Dark rooms** limit how far you can see; lanterns light them. Camps are always bright and no attacks happen there.
- **No Explorer left?** Survivors hold a 20-second election in camp: volunteer, then vote (majority of all living players).
- **Ghosts:** eliminated players drift through walls, see everyone, and can **haunt their killer** once per round (a harmless 0.45 s pop-up).
- **Disconnects:** your seat is held for one round of game time (130 s). Reopen the same browser to resume.

### Controls
WASD / arrow keys, or drag anywhere on a phone screen, to walk (walking into a wall beside a doorway slides you through it) · tap a choice in the "What do you do?" box or press **1–9** · **E** climbs ladders · 🏕 Camp opens the planning panel · 🪪 identity · 📖 rules · ☰ menu. The colored bar under the top chips shows where you are in the round.

---

## Design decisions

The detailed rules come from the design handoff in `mine-escape-handoff/`. These decisions shaped the playable version:

**Decided by the project owner**
- **3–8 players.** Every team always has at least a Worker, an Explorer and a Merchant (a 2-player mode was tried and removed).
- **Camp choices last 40 s instead of 20 s**, so shopping and planning are comfortable on a phone; rounds are therefore 130 s instead of 110 s.
- **Saved actions.** An unused tool that was placed in an action slot keeps its slot into next round, so using a saved tool doesn't cost a new action. Up to 2 carry over (locked to their tool), keeping the 4-actions-per-round maximum; the original design discarded unused actions.
- **7-item bag limit** for everything a player carries.
- **Theft any time.** A hook can rob anyone in the same room at any moment (silently), instead of only resolving when camp choices close. Guard locks and shields therefore activate the moment they're bought.
- **Interruptions are free.** If you move, get hit or cancel before an action finishes, you keep the tool and the action (the original design spent them). An action already in progress when field time ends still finishes.
- **No mine reservations.** Mines are first come, first served, and another player's action can only be interrupted by attacking them.
- **Two shops.** The private tool machine in every camp sells basic career tools (1 coin), lanterns and weapons, so nobody learns who is armed. The Merchant sells extra action slots and advanced goods unlocked by upgrading the shop. (Moving weapons to the Merchant was tried and reverted.)
- **Contribution proposals (Pledges) are included** as the only structured communication; still no free chat.
- **A main menu** with instruction panels plus Start / Quit, a **game lobby** to create or join a room by unique code, and **Return to main menu** during a match.

**Implementation choices (for the deadline and for playability)**
- **One Node server holding all game state in memory** instead of the planned React/Phaser/Colyseus/PostgreSQL stack. The server still decides every outcome and sends each player only what they're allowed to see (private wallet, inventory and Smuggler flag never leave the server for anyone else). Trade-off: restarting or redeploying the server ends games in progress.
- **Instant purchases**: Merchant and Guard are "open for business" by default and can close shop, instead of per-order approvals and batch settlement.
- **Mines are only busy while someone is actively mining** (instead of locking to the first miner for the whole round), which follows from the first-come rule above.
- **Room-based sight**: you see players in your own room (everyone in bright rooms, within ~2.6 tiles in dim ones) instead of facing-direction vision cones.
- **Simplified**: undeliverable fallback tools or Merchant potions are lost rather than waiting at a camp terminal; Merchant goods are made on demand; attacks resolve one at a time (no simultaneous mutual kills); static character art (no animation or audio).
- **Rooms are joined by code or invite link only.** There's no public room list, so strangers can't walk into a friends' game.
- **Text-choice interaction**: actions are chosen from a context-aware "What do you do?" list instead of tapping item slots, so first-time players can see every option and why some aren't available.
- **"Quit game"** leaves the room and shows a goodbye screen; browsers don't allow a page to close its own tab.

---

## Run locally

```bash
cd game
npm install
npm start          # http://localhost:3000
```

Open the page in two browser windows (or on two devices on the same network) to test multiplayer. `SPEEDUP=4 npm start` runs the game clock 4× faster for quick playtests.

Run the rules tests: 22 feature scenarios plus 30 randomized full games (browser end-to-end scenarios for every ending were also run during development with `TEST_HOOKS=1`, a test-only switch that must never be set in production):

```bash
cd game && npm test
```

## Deploy (Render, free)

1. Sign in at https://render.com with GitHub.
2. **New → Blueprint**, pick this repository and branch, click **Apply**. `render.yaml` configures everything.
3. Share the `https://<name>.onrender.com` URL. Free instances sleep after ~15 min idle and take ~30–60 s to wake on the first visit. During a match the page pings the server so it stays awake.

Any Node 20+ host with WebSocket support works (Railway, Fly.io, a VPS): run `npm install && npm start` in `game/`; it listens on `$PORT`. Don't redeploy while people are playing: in-memory games end on restart.
