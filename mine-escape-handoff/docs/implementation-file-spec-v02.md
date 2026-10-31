# Implementation file specification v0.2

The [October 30 review](preimplementation-review-2026-10-30.md) recommendations are now adopted with the user’s overrides: seven fixed inventory slots, purchases costing no actions, atomic extra-action/tool checkout, and ghosts seeing every player with one murderer-only haunt per base round. This specifies future implementation under `mine-escape-playtest-2026-10-30-interactions`; it does not claim that those modules exist. The [adopted decision record](design-update-2026-10-30.md) supplies worked examples and full-inventory grant rules. The [next asset brief](next-asset-batch-v02.md) covers shared character identity, mild character-specific haunts and modular room integration.

October 30 asset update: the [static 2D pack](asset-pack-v01.md) now exists, with [manifest](../game-assets-v01/manifest.json), [room-layout suggestions](../game-assets-v01/rooms-layouts.json) and [import guide](../game-assets-v01/README.md). Future asset-loader paths should consume these separate PNGs or a derived atlas. They are single-view static sprites and flattened room plates; animation, layer separation and runtime collision remain future work. No application code was built.

Start with the [master game design and implementation plan](../master-game-design.md) for the complete game and proposed directory tree; this document supplies detailed file responsibilities and test cases for that same version.

Updated October 30, 2026 for [game design v0.4](game-design-v04.md). This is a specification of future files, not an existing application. The only executable work so far consists of Python design-analysis/report scripts. No frontend, match server, database, or deployment has been built. The [readiness report and delivery checklist](implementation-readiness-v04.md) tracks remaining work.

## Architecture and boundaries

Use a TypeScript monorepo: React menus/HUD around a Phaser 2D scene, an authoritative Node/Colyseus server, and PostgreSQL for durable checkpoints, events, and anonymous membership. HTTP and secure WebSockets share an origin for the initial deployment. Choose compatible current dependency versions at implementation time and pin them in the lockfile. The original challenge does not require Unity/Godot or a particular engine.

The server owns roles, wallets, inventory, actions, phase deadlines, movement validation, room generation, visibility, combat, votes, and outcomes. The client sends intentions. Public state and recipient-specific views are explicit allowlists, never a serialization of the full authoritative state. Money, HP, item commitments, discoveries, and outcomes commit before acknowledgment/broadcast. Positions can update in memory with periodic checkpoints; every economic transition must be replay-safe.

Official documentation checked October 27, 2026: [Phaser supports 2D browser games in JavaScript/TypeScript](https://docs.phaser.io/phaser/getting-started/what-is-phaser); [Colyseus provides authoritative Node servers and state synchronization](https://docs.colyseus.io/); [Render web services accept public WebSockets and require reconnect handling](https://render.com/docs/websocket). The proposed stack is our design choice; these sources do not validate this game’s rules, budget, or deployment configuration.

Revision status: manual camp return, camp-only planning, Explorer succession, escalating elimination prices, limited Merchant trade profit, and shared natural-exit victory are included below. The user has confirmed the 110-second schedule and permanent conversion to Explorer. The October 28 calculations and latest no-free-clue/paid-compass correction select the initial numeric/procedural defaults, fare eleven, paid extra actions up to four total, forward-camp/paid-compass contracts, and 110-base-second permanent forfeits. These are specified, not implemented. See the [calculation report](defaults-calculation-v05.md).

The core rules are pure functions of state, validated command, logical time, and deterministic randomness. They have no database, React, Phaser, or socket dependency. A per-match controller serializes transitions and owns persistence. This allows meaningful rule tests without a browser and prevents separate UI/server implementations of the economy.

## Workspace and delivery files

| Future path | Responsibility |
|---|---|
| `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` | Workspaces, pinned package manager/dependencies, scripts for development, checks, build, migration, and start. Generate the lockfile during implementation. |
| `tsconfig.base.json`, package-specific `tsconfig.json` | Strict types and import boundaries; server-only modules cannot be bundled into the client. |
| `eslint.config.mjs`, `vitest.config.ts`, `playwright.config.ts` | Static checks; rule/integration/browser suites with separate fixture environments. |
| `.env.example`, `.gitignore` | Document required environment keys; exclude credentials, private logs, and generated data. No secret gets a public frontend prefix. |
| `Dockerfile`, `.dockerignore`, `compose.yaml` | Reproducible production build and local PostgreSQL setup. |
| `render.yaml` or chosen provider manifest | One initial authoritative Node service, HTTPS/WSS, durable database, appropriate health probes. Confirm provider/plan before provisioning. |
| `.github/workflows/ci.yml` | Locked install, lint/types, unit/integration/browser checks, asset validation, production build. Deployment is a distinct release step. |
| `scripts/build.mjs`, `scripts/migrate.ts` | Build dependency order; numbered SQL migrations with lock and version tracking. |
| `scripts/check-assets.ts`, `scripts/smoke.ts` | Validate sprite manifest; probe a supplied public URL for join/sync. A localhost test is not public-deployment acceptance. |
| `README.md`, `docs/rules.md`, `docs/operations.md` | Setup, player rules, recovery/backup/deployment runbook, known limits. Keep versioned rules linked to the canonical design. |

## Shared public contracts — `packages/shared/src/`

| File | Responsibility |
|---|---|
| `index.ts` | Export only public catalogs, protocols, view DTOs, and safe geometry primitives. |
| `catalog.ts` | Rule version, legal rosters, phase durations, round-indexed price functions, commission cap, election rules, damage, item TTLs, production caps, action limits, quota, Smuggler threshold, and role labels. No match seeds or assignments. |
| `protocol.ts` | Typed command/event families, IDs, protocol version, acknowledgments, and stable rejection codes. |
| `validation.ts` | Runtime schemas: finite coordinates, bounded enums/strings/amounts, message size, valid IDs. TypeScript types alone do not validate input. |
| `views.ts` | Separate global, owner-private, visible-entity, ghost, escaped-spectator, and final-result types. |
| `GameWireState.ts` | Colyseus schema for public roster/careers/status, round/phase, discovered map, fund/contribution totals, Merchant tier/upgrade investment, career-history/election state, and accepted public contracts. No wallets, unused tools, secret count, or raw event log. |
| `geometry.ts` | Units, vectors, normalized movement, shape primitives, collision helpers. Prediction sees only revealed geometry. |

A globally public death/escape state does not authorize sending the person's wallet or secret role. Room-code lookup does not authorize controlling a player. Asset names can describe possible weapons without disclosing which weapons are owned.

## Server infrastructure — `apps/server/src/`

| File | Responsibility |
|---|---|
| `main.ts`, `config.ts` | Assemble HTTP, transport, database, recovery, and shutdown. Reject missing production secrets/configuration. |
| `http.ts` | Serve browser assets; create/join/rejoin routes; liveness/platform/gameplay readiness. Never expose snapshots or private logs. |
| `auth/guestSessions.ts` | Anonymous credentials using secure same-site HttpOnly cookies where supported; credential hashes server-side, expiry/revocation. Nickname-only join; no account, microphone or camera permission. Stable IDs, normalized 2–18-character lobby names, no case-insensitive duplicates, match-name lock. Automatic private credential is not the display name. |
| `auth/joinTickets.ts` | Short-lived one-use WebSocket ticket bound to membership, match, epoch, and seat generation. No ticket in URLs/logs. |
| `auth/rejoin.ts` | Restore same seat after refresh/disconnect. Replacing its controller increments generation, closes the old socket, and rejects stale queued commands. Only before the 110-base-second deadline, strictly; expiry wins at equality. Reject revoked/forfeited seats and post-start new-name joins. Never reroll roles or issue another starting wallet; no name-only/cross-device recovery. |
| `auth/retention.ts` | Lobby seat 60s, empty lobby 15min, active membership preserved, private match data/results/tombstones retained 24h after end, idle guest credential 24h unless active, redacted logs 7d; purge/revoke safely. |
| `auth/limits.ts` | Origin validation, code-guess rate limits, payload bounds, action/movement rate limits, authorization from connection identity. |
| `rooms/GameRoom.ts` | Colyseus lifecycle and public schema adapter. Delegate every rule to the controller. |
| `rooms/MatchController.ts` | Serialized command/tick queue, 20 Hz integer logical ticks (50 ms), server-stamped command scheduling, ordered overdue ticks and staging/commit/publish. No concurrent async state mutation. |
| `network/heartbeat.ts` | Five-second heartbeat, ten-second no-response disconnect detection or immediate close; one deadline per continuous detected absence, authenticated rejoin clears it. |
| `rooms/roomRegistry.ts` | Stable invite-code/logical-match routing to recovered transport rooms; prevent duplicate live instances. |
| `network/project.ts` | Recipient allowlists and event-time witness audiences; remove entities when visibility ends. Never filter only on the client. |
| `network/publish.ts` | Publish committed public/private/spatial deltas; complete authorized view on reconnect. |
| `storage/db.ts`, `storage/commit.ts` | Parameterized queries and atomic checkpoint/event/receipt/ownership transactions. |
| `storage/recover.ts` | Restore logical remaining time and private state; clear stale movement; resume only after ownership and version checks. |
| `storage/ownership.ts` | Runtime lease with monotonically increasing fencing epoch; reject stale writes and stop old publishers. |
| `observability.ts` | Tick/commit latency, recovery, rejection rates, active matches, errors. Redact roles, wallets, purchase details, cookies, and tickets from ordinary telemetry. |

Movement checkpoints can be approximately one second apart. A crash may rewind only that uncommitted movement/logical time; acknowledged economic actions cannot disappear or repeat. Persisting a transaction also persists its relevant position/visibility inputs. Database uncertainty pauses the affected match instead of permitting speculative spending. Recovery outages pause the logical game clock; ordinary player disconnects do not.

Keep platform health separate from active-owner gameplay readiness. Otherwise rolling deployment can deadlock while the new process waits for a lease that the platform will not release until it is ready. A healthy standby may serve the frontend while gameplay returns a retryable recovery state. Shutdown checkpoints and relinquishes ownership before takeover. These are required reliability contracts, not a claim they are implemented.

## Authoritative game modules — `apps/server/src/game/`

| File | Responsibility and invariants |
|---|---|
| `state.ts` | Full private model: version, original seats, careers/secret roles, HP/wallets/inventory/slots, world, clocks, proposals, trials/succession, camp-presence checks, fallback claim records, paid weapon surcharges, trade-profit counters, private escapes, statistics, RNG, cumulative advancing base time, disconnect deadlines, forfeiture tombstones and session generation. |
| `random.ts` | Cryptographically seeded deterministic streams for roles, topology, room contents, route, and cosmetics. Persist counters; never derive secret seeds from public time. |
| `priority.ts` | Cyclic priority over original seats by round, skipping ineligible seats without renumbering. Used for simultaneous claims, extra-action sales, theft, combat, and private-escape ties. |
| `lobby.ts` | Settings revisions, roster legality, three-to-eight participants, unanimous Ready including eight, joins/leaves/disconnect invalidation, fresh rematches. No owner Start permission. |
| `initialize.ts` | Public career assignment and independent Smuggler selection; two coins/three HP, central Safe Zone, per-Explorer state, starting inventory/markers. |
| `phases.ts` | Confirmed 10/20/10/50/15/5 schedule: purchase cutoff 28, theft/protection 30, field 40–90, protected return 90–105, settlement 105–110, outcomes 110. Trial +30 and needed succession +20 pause the base clock. The user has approved the base schedule; meeting procedure/duration is a selected first-playtest default. |
| `rounds.ts` | Preserve actual position at arrival; slot/ration refresh, protection expiry, inventory aging, potion grant, traps, and next-round setup. Mines never refill. |
| `resolveTick.ts` | One documented order: due disconnect forfeits before same-time commands/outcome snapshots, phase boundary transitions, eligible commands/movement, deposits, pre-snapshot attack batch, surviving physical completions, then rotating-priority trial arbitration/pause, outcomes when due. Same-time conflicts resolved deterministically. |
| `loadouts.ts` | Two free/four maximum slots, plan-before-use, tools versus free Deposit/Trial action markers in any owned slot (no Deposit tool fee; round-bound markers), locked Guard slots, fallback first choice/action reserved for once-only current-round camp collection, including full-capacity entitlement with original issue TTL; no substitution/eighth item; forfeited second choice, camp-only planning, no field swaps. Camp discard outside meetings remains free after choice close but destroys the item and forfeits any bound action without replacement. Paid Guard-service kit/action bindings cannot be discarded, reassigned or unilaterally canceled before delivery. Draft cart is nonbinding; quote changes require confirmation. |
| `inventory.ts`, `items.ts` | Unique item instances, one-use reservation/consumption, round expiry, stock transfer retaining expiry, stored-weapon surcharge already paid, fixed seven personal physical-item slots, including equipped tools and bound personal potions; no stacks, expandable capacity or overflow pouch; equipped slots reference the same owned instances, each bound to at most one unspent action. Coins, action markers and service status use no inventory space. Merchant retail stock is a separate nonusable warehouse, never personal storage. One owned weapon. |
| `machines.ts` | Private basic-tool/weapon/lantern purchases and subsidized tools; role eligibility, wallet debit, stock, and camp presence at request and commit. Purchases, manufacture, upgrades, top-ups, grant collection and equipment preparation consume no action; actual item use and Deposit still use their prepared action. Check seven-slot capacity atomically before personal delivery. For cache claims/grants, count the resulting inventory after a tool consumed by the same accepted transaction, then recheck completion; full seven minus a used crowbar/drill can fit the reward. No remote fallback delivery or automatic purchases. |
| `merchant.ts` | Public unlock tier, 3/5/7 burns, earliest rounds 2/4/6, sequential upgrades, tier-1 Compass wholesale8/retail9/Explorer-only buyer, stock recipes/caps, fixed retail offers, wholesale reimbursement versus capped margin, bound personal potion accrual within seven slots, maximum three unexpired including a pending grant; full-capacity arrival grant waits at camp for this round only with arrival-based TTL3 and no loadout swap after close. Retail warehouse cannot receive personal deposits or equip stock directly; lawful self-withdrawal checks personal capacity before cutoff, with no self-used Compass and no second wholesale charge after manufacture. Publish tiers/investment/contributions, never the wallet; disable future perks on career conversion. |
| `market.ts` | Extra-slot orders accepted before tick 560/second 28 and settled at tick 560; exact owned item or free marker or dependent paid tool; accepted slot/total caps, fixed tool quote and any unpaid stored-weapon surcharge top-up (already-paid amounts never charged again); camp, career, affordability, stock, expiry and seven-slot-capacity recheck. Atomically commit extra slot, dependent tool delivery/debit, receipt and completed-sale/profit counters, or none per bundle; two-extra orders have independently settled bundles and no item can back two actions. Rotating first/second passes, escalating completed-sale count, one-coin commission within shared two-coin trade-profit cap, excess/self burns. No free tool with an extra slot and no action charged for buying. |
| `tradeProfit.ts` | Shared two-coin per-round profit cap across slot commissions and retail margins; reimburse already-paid wholesale capital, burn excess fees, exclude self-orders, no retry duplication. |
| `weaponPricing.ts` | S(r)=floor((r−1)/2); round weapon/trial quotes; equip-time surcharge difference, no double charge or expiry reset, no late field top-ups. |
| `explorerElection.ts` | Zero living unescaped non-forfeited Explorers; temporary offline/trapped ones still count; last-Explorer expiry queues next eligible meeting; free 20-second meeting before choices, voluntary nominees, camp-only one-choice ballot, strict majority, fail/retry next round, at most one meeting/round. |
| `careerChanges.ts` | Confirmed permanent conversion to Explorer: public outfit/career update through shared body/head/outfit components, preserving face/hair/skin and fixed P marker; old perks/standing offers canceled, inventory/HP/wallet/secret identity/deposits preserved, new luck state zero. Do not retain the previous career’s abilities. |
| `protection.ts` | Guard offer/accept/locked kit/slot, one wallet+one life service, payment and delivery before theft, no self-hire, one-hit shields, round expiry. Require current-round Guard authorization and bound kit/action; no auto-activating future drafts, reject stale offers. Ordinary disconnect preserves paid delivery; full110-second grace cannot expire before same-round second 30 delivery. |
| `economy.ts` | Integer coin mint/transfer/burn/deposit primitives; no negative balances, fund withdrawal, implicit redistribution, or duplicate payments. |
| `proposals.ts` | Numeric per-person amounts, approve/reject revisions, nonbinding agreement, participant/round invalidation, no wallet oracle or free text. |
| `interactions.ts` | One stationary physical channel; validate required target/range/LOS/room/eligibility each tick. Turning is allowed only while validity remains. Movement, room change, invalid target/range/LOS, incapacitation (except permitted self-Rescue), unblocked HP damage, death, explicit cancel, own attack or field cutoff cancels; a fully shielded hit does not. Invalid start spends nothing; accepted start commits tool/action without interruption refund. Meeting clocks pause progress; movement (even away and back) or lost eligibility cancels, with validation before resume. A prepared instant Deposit may run during a channel. |
| `exploration.ts` | Explorer-only drilling; carry-forward opening-mine guarantees until successfully consumed; per-Explorer Markov draws; persistent room results, finder coin, trap scheduling. |
| `mining.ts` | Eight-coin reserves; immediate activation at committed discovery, including round 1; Worker priority; one miner/mine, one mine/player; two/one caps; new mine min(d+15,90), existing mine55 no-show deadline, not waiting; prepared field-target selection; no extending holds or field time; extraction lock. |
| `theft.ts` | Queue/retarget/cancel only in the same camp during choices; same-room co-location at choice-close settlement (second 30), even if both departed; protection-before-debit; snapshot balances; no incoming re-theft; disconnected avatars and already accepted intentions remain eligible; consumed valid empty/protected attempts; private results only. |
| `loot.ts` | First valid accepted Loot start reserves the source; same-tick requests use rotating original-seat priority, losing starts spend nothing. A later faster Scavenger cannot displace a valid holder. Cancel/death/eligibility loss/cutoff releases the source while preserving the holder’s spent tool/action. Chest full claim; cache-item capacity checked at start/completion with original expiry, no automatic equip/coin conversion. An ordinary corpse completion commits its single global floor-half claim and releases the remainder for Scavenger; no automatic killer loot. Mine reservations remain separate. |
| `survey.ts` | Explorer-only single-use Compass; one prepared action/three-second field channel at depth zero; TTL3 from manufacture; commit/interruption rules, capacity/expiry, private completed note, no automatic slot or free machine/cache issue. |
| `healing.ts` | Three-second self-heal/rescue channels, effect only on completion after the attack batch, no resurrection; explicit prepared self-Rescue exception to incapacitation; no automatic camp healing. Rescue targets self or a visible incapacitated player within one tile. |
| `combat.ts` | 4/7/10 + S(r) prices and paid equip stamp, 1/2/3 damage, persistent HP, range/LOS/current cone-light visibility/same-room/safe-phase restrictions, generic unavailable-target errors, shield consumption, one attack/round, mutual kills. |
| `disconnects.ts` | 110 advancing base seconds, excluding trial/succession/recovery pauses; stop stale movement, retain valid durable intentions/avatar/fare during grace. Expiry permanently revokes live access, creates one corpse only for a living underground player, destroys inventory/cancels pending work, preserves fund/prior wins, no killer/controlled ghost. Explicit Leave uses same timer; check last-Explorer vacancy. |
| `death.ts` | Sole alive-to-dead transition, corpse wallet escrow, equipment destruction, canceled queued work, retained contributions, ghost and eliminator record. |
| `trials.ts` | 6 + S(r) coin/action request, same-Safe-Zone accused/caller, post-tick rotating-priority arbitration, charge only the valid winner, once-per-round limit, paused clock +30 seconds, frozen living electorate, Safe Zone ballots, strict majority/ties, execution. |
| `ghosts.ts` | Discovered-world ghost traversal and global player-appearance/position view; private eliminator pointer. One accepted haunt per ghost per base round, any active phase including meetings, only its murderer, no distance requirement. Persist budget and receipt; 450 ms private cosmetic edge effect without control/economy/vision/deadline changes; simultaneous ghosts combine in one appearance strip without stacked motion/audio. Reject unavailable/offline target without spending budget, no offline queue; committed live delivery consumes budget even if acknowledgment is lost. A dead or escaped murderer can receive while authorized observing. Forfeit grants no ghost. |
| `outcomes.ts` | Natural opening first: all living unescaped players win including all Smugglers without payment or private-departure cap. Otherwise same-snapshot paid group/private checks every round; one private escape; continuation only if group did not escape; simultaneous winners; terminal deadline/no survivors. No mid-check quota cascade. |
| `statistics.ts`, `recap.ts` | Event-derived statistics and template highlights; contribution ties, separate private winners, terminal reveal, no public theft actor/victim reconstruction. |

## World modules — `apps/server/src/game/world/`

| File | Responsibility |
|---|---|
| `templates.ts`, `generateMap.ts` | Valid room footprints, connected horizontal/downward growth, Safe Zone spawns, boundary reservations, collision-safe doors; measured six-tile adjacency and forced camp at 36 walking tiles, with earlier placement if footprint/ladder requires it. |
| `generateOpenings.ts` | Exactly three initial real openings on every valid map; scattered distinct final branches at depth0, each 14–16-link minimum path/no shortcuts, no free clues or gate/decoy logic. Content category and forced camps retain terminal features. A sub-1% unaided-win target is unmeasured, not a random gate. |
| `compass.ts` | Server-only nearest real opening by horizontal Euclidean distance from room anchor; stable ID ties, per-room fixed ±22.5° noise/90° sector, owner-only completed Survey. Different rooms can select different openings; no decoys, coordinates, distance, target IDs, door or path advice in payload. |
| `roomContents.ts` | Opening-guarantee > forced-camp > ordinary Markov category/subtype precedence; forced camps skip resource RNG and reset luck; roster-scaled finite treasure, eight-coin mines, item cache, lighting/safe flags, exhausted-room state. |
| `movement.ts` | Server speed/collision/turn validation, known ladders, depth transitions, no physical body-blocking, trap and trial detention. |
| `safeZones.ts` | Camp-only planning/shop/vote eligibility, preserve positions across rounds, once-only linked-terminal fallback collection, ambient light independent of lanterns; never teleport players. |
| `returnRoutes.ts` | Shortest discovered walking path/ETA to a camp, current return budget, forward-camp benefit, unclaimed fallback expiry, warnings for infeasible four-action routes. No guarantee that distant tasks fit. |
| `lighting.ts` | Natural light and placed lantern lifetimes; three-second placement at a visible valid floor point within one tile, effect on completion; no expiry reset at placement or sale. |
| `visibility.ts` | Facing cone, near bubble, wall raycasting, recipient entities/health/witnesses; camp-only theft-list exception. |

Connected topology and local geometric reach are separate tests. A connected graph can still contain an impassable doorway or an impractical travel distance. Raycast visibility cannot be inferred merely from sharing a room.

## Persistence schema — `apps/server/migrations/`

`001_initial.sql` establishes:

| Table | Content |
|---|---|
| `guest_sessions` | Hashed anonymous credential, lifetime, revocation. |
| `matches` | Logical ID/code, status, original roster/settings, rules/schema version, last committed revision, owner epoch. |
| `match_members` | Stable guest/seat association, cosmetics, control generation, lobby connection/readiness state. No privileged host permission. |
| `match_checkpoints` | Server-private complete snapshot and logical remaining time. Never returned as public JSON. |
| `match_events` | Ordered authoritative events with authorized audience and recap metadata. Theft relationships remain restricted even in final exports. |
| `command_receipts` | Unique stable match/seat/command ID, canonical business-argument hash, stable result and committed revision. Hash includes command type and immutable semantic arguments (including intended round/settings revision where relevant), excludes runtime epoch/controller generation and transport metadata. Prevents duplicate economic effects across reconnect/restart. |
| `runtime_ownership` | Runtime lease, expiry, fencing epoch. |
| `schema_migrations` | Applied schema versions. |

Checkpoint inventory includes expiry/ownership/reservation, queued theft, fixed ballots/electorate, paused trial time, per-round allowance use, mine reserves/reservations, luck states, route topology, all opening locations/IDs and each room’s selected opening/sector sample, owner Survey notes, all RNG counters, accepted services, Merchant stock/unlocks, career changes and election consent/ballots and frozen electorates, base-time disconnect deadlines/forfeit tombstones, once-only fallback claims, seven-slot item ownership/equip references, active Loot reservations and global half-claim flags, atomic slot/tool orders and accepted caps, weapon paid-surcharge stamps, per-round trade profit, per-ghost last-haunted base round and delivery receipts, integer clock/deadline/channel ticks, and already escaped winners. The persisted state must distinguish a continuing game with a private winner from a terminal group win. Recovery cannot rerun the same end-round settlement or potion grant.

Forfeiture records persist through retention and across restarts; a timeout and corpse/fare transition commit atomically with controller revocation. Restoring a snapshot cannot resurrect the seat or charge/refund twice. Base time does not advance during server/storage recovery; meetings have their own paused-phase clocks.

## Commands and visibility contracts

A durable command carries protocol version, match ID, runtime epoch, seat generation, round/settings revision as applicable, command ID, type, and payload. Identity comes from the authenticated connection. Processing order is explicit:

1. Authenticate the current membership and controller; revoked/forfeited membership and an old socket cannot recover a live receipt or mutate state. Final-result access is separately authorized.
2. Look up `(matchId, originalSeatId, commandId)`. Canonically hash command type plus immutable business arguments, including intended round/settings revision where semantic; exclude runtime epoch, controller generation and transport metadata. Sort object keys, normalize numbers/enums under the schema, reject nonfinite/unknown fields, and distinguish omitted optional values according to that schema.
3. A matching committed receipt returns its original result/revision without execution, even if that original business round is over or the server epoch changed. A different business hash under the same ID is rejected. Receipt recovery never makes an old controller current.
4. Only previously uncommitted commands undergo execution freshness, current phase/role, wallet, inventory, target and other rule checks. Recheck authority and freshness at dequeue. Commit state/event/receipt atomically before acknowledgment.

Movement is a bounded sequence stream, not a database receipt per frame. A client reconnects with its current authorization and retries the original command ID/business arguments; it never forges a fresh economic command to recover a lost acknowledgment.

### Logical time and exact cutoffs

Gameplay uses 20 Hz integer ticks of 50 ms. Round tick zero is arrival; seconds 28/30/40/90/105/110 are ticks 560/600/800/1800/2100/2200. A three-second channel lasts 60 ticks and a one-second Scavenger Loot lasts 20. Start and completion must both be eligible; physical completion must be scheduled strictly before tick 1800. At tick 1800 the field closes before any same-tick physical completion.

Stamp receipt using monotonic server time, never client time, and round upward to the next eligible simulation boundary; an exact boundary uses that tick only if it has not already been processed. This is at most a one-tick input delay in normal operation. Orders must be accepted on ticks below 560; only those preaccepted orders settle at 560. Process overdue logical ticks in chronological order, rather than moving their scheduled events into the time of a delayed callback. Arrival after a deadline cannot be backdated into the backlog.

Disconnect detection uses the current logical base tick; the expiry is detection tick +2200 advancing base ticks. Completed authenticated rejoin is server-stamped on the same grid and must be assigned a tick strictly below that deadline; expiry wins equality. At a detection-relative deadline of 110 seconds, 109.949 seconds rounds to tick 2199 and can qualify; 109.999 rounds to 2200 and is too late. The UI displays the conservative authoritative countdown, never a promise that every sub-tick arrival qualifies. Heartbeat detection remains five-second wall-time heartbeat/ten-second loss detection, followed by assignment to the logical grid.

Trials and succession pause base ticks and use separate 20 Hz meeting ticks, so their 30/20 seconds do not age disconnect grace or physical channels. Server/storage recovery pauses all gameplay clocks; ordinary disconnected clients do not. Movement permitted during meetings still invalidates stationary work, and eligibility is rechecked before any channel resumes. Persist clocks and scheduled ticks so recovery cannot duplicate a boundary, grant, theft batch or outcome.

Command families: authenticated join/rejoin/Leave; lobby settings/Ready; loadout equip/discard; machine buy; Merchant order/approve/stock/unlock; Guard offer/accept; mine reserve; contribution propose/vote/execute; physical channel start/cancel; theft choose/cancel; weapon attack; lantern placement; compass Survey; healing/rescue; trial request/vote; Explorer nominate/accept/vote; camp preset collection; haunt. No generic set-state/set-wallet/kill endpoint and no arbitrary chat.

| Audience | May receive | Must not receive |
|---|---|---|
| All participants | Careers/identifiers, phase/deadlines, public map, fund/contributions/target, Merchant tier/cumulative upgrade investment, public career conversion, election state, deaths/departures, public contract acceptance | Wallets, secret count, prepared inventory, future rooms, off-screen positions/HP/shield breaks |
| Owner | Own identity, wallet, inventory/actions, detailed receipts, own HP/conditions, completed private Survey notes | Others' protected private state |
| Permitted local viewers | Visible living entities/corpses, local HP/action effects, observed attacker | Invisible targets, roaming ghosts or distant effects; explicit ghost projection is separate |
| Theft chooser | Same-camp candidate names while planning in camp, and own result | Target balance, secret identity, exact position via this list, reason for zero theft |
| Ghost | All living/ghost player appearances and avatar positions throughout the discovered world, independent of local cone/darkness/walls; public escaped/dead/disconnected roster status; own murderer identity and haunt result | Unopened rooms/topology, private wallets/inventories/Survey notes/roles, remote HP or action details, living commands; no physical or public observer avatar for an escaped player |
| Escaped spectator | Discovered map and roster; bounded freely movable observer camera in discovered space with the normal local room/light/LOS entity projection and no public avatar; an escaped murderer may receive a private haunt | Global live positions, roaming ghost avatars, private state, unopened rooms, haunt command or other living commands |
| Final results | Public careers plus terminal identities, outcomes, contribution ranks, allowed factual highlights | Theft victim–thief links or a reconstructable theft event stream |

Errors, action counters, market quotes, sound, animation, debug overlays, analytics, and reconnect payloads must follow the same privacy boundaries as the main state. “No toast” alone does not establish anonymous theft.

## Browser files — `apps/web/`

| Path | Responsibility |
|---|---|
| `index.html`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx` | Browser build and React shell with connection/recovery states. |
| `src/network/client.ts`, `session.ts`, `commands.ts`, `store.ts` | Secure transport ticket/reconnect flow, normalized authorized views, command receipts, duplicate/stale handling. No game-rule authority. |
| `src/game/GameCanvas.tsx`, `scenes/BootScene.ts`, `scenes/MineScene.ts` | Phaser mount/lifecycle, assets, room geometry, map layers, depth transitions, entities/effects. |
| `src/game/input.ts`, `prediction.ts` | Keyboard/virtual joystick/touch target controls; movement prediction/reconciliation only. Never predict money or deaths as confirmed. |
| `src/game/visibility.ts`, `lighting.ts`, `entities.ts`, `effects.ts` | Render server-permitted content, cone/ambient overlays, stable marker silhouettes, private ghost effects. Clear removed visibility promptly. |
| `src/components/Join.tsx` | Nickname + room code only; resume stored browser seat automatically; no account/microphone prompt; explain unrecoverable lost credential/forfeited seat without revealing private state. |
| `src/components/Lobby.tsx`, `ReadyPanel.tsx` | Shared settings with revision, all-player votes, minimum roster, reset explanation. No host-only Start. |
| `IdentityCard.tsx`, `RoundClock.tsx`, `Roster.tsx` | Private role, exact phase and pause state, public careers/contributions without wallet leakage. |
| `LoadoutPanel.tsx`, `InventoryPanel.tsx`, `MachineShop.tsx` | Seven fixed physical slots with equipment references, expiry/stock/capacity, item-versus-action distinction, no-action purchasing, atomic extra-slot/tool checkout and total quote, fallback warnings, preparation lock, private purchase results. |
| `MerchantPanel.tsx`, `ProtectionOffers.tsx` | Unlocks/stock, escalating quotes/weapon top-ups, trade-profit cap and reimbursement split, standing approvals, Guard capacity and committed actions. |
| `ActionBar.tsx`, `TargetPicker.tsx`, `TheftPicker.tsx` | Valid nearby actions and camp-only silent theft selection with same-room resolution, mobile reach and clear disabled reasons that do not reveal secrets. |
| `ContributionPanel.tsx`, `ProposalPanel.tsx` | Any-amount one-action donation, public fund/target, nonbinding numeric agreements. |
| `TrialPanel.tsx`, `MapPanel.tsx` | Trial electorate/deadline/aggregate verdict, Safe Zone voting eligibility, discovered map with no hidden occupants. |
| `CompassReading.tsx` | Owner-private static 90° sector anchored to its surveyed discovered room; no route/path/door/coordinate reveal, clear uncertain-reading and depth-zero wording, expiry/Survey cost. No free clue overlay. |
| `CampPlanner.tsx`, `ExplorerElection.tsx`, `ReturnTimer.tsx` | Read-only preview outside camp, editable nonbinding drafts in camp, rapid confirmed checkout, late fallback collection, nomination/consent/majority, actual return-route ETA. |
| `GhostPanel.tsx`, `ResultsPanel.tsx`, `RematchPanel.tsx` | Ghost global discovered-world avatars versus restricted escaped camera, one-haunt-per-base-round state, murderer-only private 450 ms edge pop, reduced-motion equivalent, contribution ranks/separate private wins, restricted recap, fresh unanimous rematch lobby. |
| `RulesPanel.tsx`, `ConnectionBanner.tsx`, `ErrorBoundary.tsx` | Onboarding without host explanation, recovery/disconnect feedback including server-authoritative 110-base-second grace/pause/countdown and permanent-forfeit result, actionable errors. |
| `src/styles/`, `src/accessibility.ts` | Responsive phone/desktop layouts, focus/keyboard controls, contrast, reduced motion, text scaling, non-color-only markers. |

Component files above live under `src/components/` unless a prefix is shown. The exact split may be simplified during implementation if the same responsibilities and testable contracts remain clear.

## Assets — `apps/web/public/assets/`

Create `manifest.json`; shared body/head/outfit identity components with six career sprite families and Worker/Explorer variants; eight-direction walk/idle and shared action overlays; portraits, badges, body/ghost forms, eight appearance-preserving mild-haunt variants (same public outfit, face and marker; 450 ms edge pop, no flash/obstruction, optional quiet sound and reduced-motion substitute); club/blade/gun/pickaxe/drill/crowbar/potion/lantern/compass props; room tiles/templates and trap/safe/exhausted-mine visuals; accessible UI symbols; restrained audio cues. Keep the concept PNG as reference, not a production atlas. Public Smuggler covers must be pixel-identical to their ordinary equivalents; no hidden-role animation. Theft has no observer-visible Hook effect or sound. License/provenance documentation accompanies production assets.

## Verification files and required cases

Create focused suites under `apps/server/test/` and browser suites under `apps/web/e2e/`; tests verify behavior/invariants rather than restating implementation.

| Suite | Essential cases |
|---|---|
| `lobby.test.ts` | Three/eight boundaries, unanimity, setting/roster revision races, disconnected seats, rematch reset, no owner privilege. |
| `phases.test.ts`, `inventory.test.ts` | 28/30/40/90/105/110 cutoffs; no relocation; camp-only edits/commit; late fallback collection once; protections before theft; 30-second trial pause once; TTL across pauses/rejoins; fallback and four-action cap; full-capacity fallback/personal-potion pending terminal grants expire unclaimed this round and preserve original TTL, post-choice collection does not unlock swaps; fixed seven physical items across equipment/personal potions, no stacking/overflow/equip capacity bonus; atomic delivery and full-capacity rejection, stored pickaxe retention, no purchase action charge. |
| `interactions.test.ts` | Stationary channels, valid turning, movement/room/range/LOS/target loss, unblocked nonlethal HP damage versus fully shielded hit, own attack, incapacitation/self-Rescue exception, death/cancel/cutoff, meeting movement and resume, concurrent instant Deposit, invalid-start no spend versus interrupted-start spend. |
| `clock.test.ts` | Before/at/after ticks 560/600/1800/2200; 60/20-tick channels, strict completion cutoff, receipt-time upward rounding, chronological overdue callbacks, no late backdating, separate meeting ticks, recovery pause and detected-loss+2200 rejoin equality. |
| `economy.property.test.ts` | Conservation across mint/transfer/burn/deposit/death/loot; no negatives; retries do not repeat money. |
| `exploration.test.ts`, `map.property.test.ts` | Per-Explorer Markov transitions, opening mines in round one or later after interruption/replacement, no guarantee reset, finite reserves, no rerolls, path connectivity, depth rules, 14–16 route length/no shortcuts, no free cues or guaranteed failed-route markers, forced-camp distance by actual paths including depth, resource RNG skipped and luck reset only when forced. |
| `mining.test.ts` | One miner/mine, production limits with extra slots, reservation release/death/no-show, reserve exhaustion; new-mine d+15 capped90 versus existing55 no-show deadlines, no restartable holds, prepared-slot target selection after reveal, late discovery/cutoff, stored pickaxe TTL with no saved actions. |
| `theft.test.ts` | Target moves/empties/dies, disconnected target/attacker with durable intention, protected victim, multiple attackers, no circular same-batch re-theft, private receipts and no public notification/identity. |
| `market.test.ts`, `protection.test.ts` | Combined slot/tool max-total and slot caps, accepted-before560/settled560, owned-item/free-marker/new-tool branches, failed capacity/stock/affordability/career/camp delivers and charges neither, no counter advance on failure, retry exactly once, rotating allocation, shared profit cap across all products, wholesale reimbursement, excess/self burns, own-wallet affordability, stock/expiry, personal potion bound, services delivered once; current-round Guard authorization, stale/future offer rejection, ordinary disconnect through second 30, no fictitious same-round110-second timeout. |
| `combat.test.ts`, `loot.test.ts`, `trials.test.ts` | Escalating weapon/trial fees, old-weapon top-up once, no field top-up, range/phase/return safety, mutual kills, unseen forged target IDs, one corpse, shield, potion-vs-lethal-hit order, trapped self-rescue exception, cache pickup capacity/expiry/races, accepted-start reservations and rotating same-tick starts, faster Scavenger cannot overtake, release after interrupt/death/cutoff, one global ordinary half then Scavenger remainder, invalid competing start no spend, strict-majority electorate, tie/no quorum, simultaneous trial requests and exact cutoff. |
| `outcomes.test.ts` | Group alone, Smuggler alone, simultaneous group/private success, two private qualifiers, group-ending leftovers, prior winner preservation, no living ordinary, natural route with multiple Smugglers/no ordinary survivor/no payment, earlier private winner preservation, round-ten/all-dead. |
| `explorerElection.test.ts`, `campReturn.test.ts` | Zero active Explorer trigger, temporarily disconnected/trapped Explorer prevents replacement; forfeited last Explorer queues election, surviving second Explorer prevents it; consent/majority/ties, permanent conversion removes old perks without changing secrets, camp reachability, no personal choice extensions, preserved predeparture commitments, claimable fallback. |
| `compass.test.ts`, `survey.test.ts` | Owner-only coarse sector, true bearing within sector on route-present maps, nearest of three real openings, exact ties, cross-room target switches, no decoys or map-existence gate, stable same-room sample across items/players/reconnects, wrong depth/role, TTL, single-use/action cost, interruption, no hidden opening coordinate/ID/topology leakage, no subsidy/cache drop, cap-sharing retail accounting. |
| `visibility.test.ts`, `privacy.contract.test.ts` | Cone/wall/light/depth filtering, wallet/role non-disclosure, silent theft errors/events, ghost global-avatar exception without remote private-state/HP/action leakage, escaped local camera, private haunt, redacted recap and reconnect packets. |
| `ghosts.test.ts` | Only own murderer; new ghost can haunt in its death round, once per base round across every phase/meeting, no range gate, reset only on next base round; concurrent commands/retry/restart budget exactly once; committed live delivery with lost acknowledgment consumes budget, disconnected target rejects without budget use or offline queue; dead/escaped observing murderer, target forfeit, multiple ghosts combine into one 450 ms appearance strip, no gameplay/control obstruction and reduced-motion/mute equivalents. |
| `disconnects.test.ts`, `guestAuth.integration.test.ts` | Rejoin just before/at/after 110, heartbeat detection, paused meetings/recovery, repeated authenticated rejoin vs failed handshake, same-time escape, living/dead/escaped expiry, exactly one body/fare reduction, stale socket/forged nickname/no new midmatch seat, no ghost after forfeit, all offline/no survivors, cleanup/rematch isolation. |
| `recovery.integration.test.ts` | Deposit commit then lost acknowledgment then restart/new epoch and controller then exact original receipt recovery without second debit; stale socket denied before receipt access; changed business hash rejected; expired original round receipt returned only to current authorized client; uncommitted stale command rejected; atomic slot/tool/haunt receipts and reservations; in-flight actions, trial pause, theft batch, phase/escape boundaries, duplicate commands, seat controller replacement, lease fencing. |
| `multiplayer.e2e.ts`, `mobile.e2e.ts` | Separate browser contexts, code join, real synchronized phases/actions, phone controls, reconnect, whole match, rematch. Final physical-device tests are separate. |

The Python resource simulation is supporting analysis, not a replacement for these tests. Port explicit event traces or fixtures; equal RNG seeds across Python/TypeScript do not promise equal streams.

## Delivery acceptance

Finish the [implementation checklist](implementation-readiness-v04.md): use the selected rules version, prove movement/action timing, implement rules and durable transport, integrate complete UI/assets, run adversarial economy/social tests, then deploy. Final acceptance requires a reachable HTTPS link, two separate physical devices on independent connections, understandable in-game rules, a complete successful and failed match, correct hidden information, and reconnect without duplicated resources. No deployment or challenge submission has occurred.

The browser must request no microphone/camera permissions and have no voice service dependency. Include an acceptance check for a complete nickname-only join/reconnect flow. Anonymous seats do not establish unique human identity; do not claim resistance to one person joining several devices before start.

Latest correction: [natural exit and Merchant compass](compass-and-natural-exit.md). No free route clues or bounded recognizable wrong branches remain. The old clue-assisted success estimates must not become acceptance targets.

[Latest gap audit](pre-implementation-gaps.md): the prior Guard payment-to-timeout concern is retracted after clock analysis; current-round authorization must be enforced. Principal gaps are empirical opening rarity, compass value, immediate-mining economy, phone timing and multiplayer verification.

October 29: [current rules JSON](current-rules.json) and [revision arithmetic](revision-math-2026-10-29.md). Preserve prepared Mine actions targeting newly revealed mines, immediate activation, discovery-relative reservations and tool-only carryover. Replace single-exit generation with three real scattered openings, and price a single-use compass at9/8. These modules are future implementation work.
