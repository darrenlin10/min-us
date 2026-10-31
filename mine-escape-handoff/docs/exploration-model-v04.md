# Exploration and map model v0.4

October 30 art reference: [room plates and state variants](../game-assets-v01/rooms/README.md) and [proposed layout coordinates](../game-assets-v01/rooms-layouts.json) now exist. They share a four-port art footprint and do not prove actual collision/path/camp-distance constraints or replace the generator contracts below.

See the [master design and structured implementation plan](../master-game-design.md) for this model within the complete current game and build layout.

Updated October 30, 2026. Companion to the [authoritative design](game-design-v04.md) and [latest calculations](defaults-calculation-v05.md). These are selected first-playtest generation rules; no map generator or movement prototype has been implemented.

## Connected growth and discovery

The starting room is a central, permanently illuminated Safe Zone at depth zero. Only current Explorers can open new rooms, each with one drill and one action; an elected replacement follows the same rule. Everyone walks back to a discovered Safe Zone to plan. No automatic camp return exists. A valid sealed boundary leads horizontally at the same depth or down one layer. No new upward excavation is offered. Known ladders are bidirectional for movement, so downward exploration never prevents returning to safety.

Horizontal north/east/south/west means map-plane directions, not travel toward the surface. Only the rare route at depth zero can reach daylight. Downward digging never advances that route. Other players may traverse every open passage, work active mines, and collect discovered chests.

Model rooms as nodes with template geometry, depth, lighting, Safe Zone status, doors, and persistent contents. Server-owned boundary IDs identify an unopened connection. Reserve a boundary when drilling starts; competing starts do not consume tools. On completion commit geometry and contents once. Cancellation consumes the accepted drill but does not draw a new outcome. Reconnects, retries, or alternate entrances cannot redraw a discovered room. If a boundary joins existing geometry, reveal a passage without treating it as a new resource draw; the UI must distinguish a passage-opening action from a new-room discovery before commitment. The first build omits loop-closing excavation and exposes only valid new-room boundaries to avoid ambiguous spending.

Use bounded, prevalidated templates with navigable doors, space for interaction targets, and no trapped spawn points. Map topology may be laid out procedurally in advance without revealing it. Known geometry is public; unopened topology, room outcomes, route seed, and future RNG state are private. No client may inspect the entire generated map.

## Walking-distance and forward-camp contract

Use three tiles/second initially. Template placement must keep adjacent interaction anchors within six actual walking tiles, counting doors, detours and ladder transit as equivalent walking time. Check the shortest navigable path to a discovered camp, not screen distance or a simple room count. Reserve three of the 15 return seconds as margin: the remaining twelve seconds cover 36 tiles. Four ordinary channels plus attention cost 24 of the fifty field seconds; reaching four arbitrary distant targets is not guaranteed.

At generation, after mandatory opening mines, if a new anchor reaches 36 walking tiles from the nearest existing camp, make the room a permanently bright Safe Zone **instead of** drawing a resource category. Validate the whole accessible template footprint and place the camp earlier when needed; never permit an invalid long doorway/ladder transition. This rule applies on side branches and depth changes. Newly opened forward camps are usable immediately; no teleportation. Independent random Safe Zones still occur before the limit. Lantern light never creates camp rights. Opening mines must be laid out within the starting camp’s budget, so their guarantee cannot conflict with this rule.

A forced camp resets its Explorer’s luck to zero, consumes the normal drill/action, grants no coins, and advances a route link only if on the actual natural route. Use a separate generation stream; the category draw is skipped, not secretly rolled and discarded. Actual resource frequency therefore differs from the ordinary Markov table. The [new economy study](defaults-calculation-v05.md) includes a linear-frontier approximation of these replacements; the [historical spatial study](defaults-spatial-v05.md) used a clue-assisted tree; its natural-exit completion estimates are obsolete. Neither is the final shared 2D generator.

## Opening guarantee and finite mines

The first completed discovery in the match is a mine for three/four players. The first two are mines for five-to-eight. Unused guarantees carry into later rounds until successfully consumed, including by an elected replacement. Interrupted or invalid attempts do not consume a guarantee, and replacement never restores one already consumed. These guarantees take priority over ordinary room weights and increment the acting Explorer's lucky-state counter. Using all first-round Explorer slots therefore opens the required starting production capacity. Guarantee consumption is global, not one promise per Explorer. Missed actions or an Explorer dying before completion can still prevent opening a mine; the design now permits a camp election when no living unescaped Explorer remains. An election grants no automatic mine, action, or refund; a new Explorer starts their own luck state at zero while existing rooms, route progress, and global consumed guarantees persist.

A discovered mine activates immediately on committed discovery completion, including round one. Mining uses already-prepared pickaxe actions; the target may be selected after reveal. No mine appears early or gives free tools/actions. It contains eight coins, never a regenerating allowance. Throughput is at most two per round, with one actual miner per mine and one mine per miner per round. Workers can extract two; others one. Each extraction costs one prepared pickaxe/action. At full Worker use, a mine lasts four production rounds. Existing-mine reservation no-show deadline is second 55. A new mine discovered at d uses min(d+15,90); this is a fixed no-show deadline, not a mandatory delay. Valid work can begin immediately and must complete before second 90. Prepared pickaxes not used can be saved until their two-round expiry; actions are never banked. Detailed claims/priority are in the main design.

Discovery does not mint the mine's full reserve into a wallet. Only successful extraction moves a reserve coin into circulation. Depleted rooms remain traversable and may have valid undiscovered boundaries; they never refill.

## Markov state and probabilities

Each Explorer has a private-to-the-server state L in {0,1,2,3}, initially zero. It counts consecutive valuable discoveries, capped at three. A coin mine or treasure increments L; Safe Zone, cache, gallery, or trap resets L to zero. Every completed discovery applies the transition rule; at state zero or three the result can be the same state. Making no discovery, or canceling/failing an attempt, leaves the state unchanged. It persists across rounds, route branches, direction changes, reconnects, and traps until the trap reset applies. It is not shared between Explorers and does not transfer after death. An elected replacement starts at zero; eligibility for election requires no living unescaped Explorer, so brief disconnects/traps cannot be used to reroll this state. A permanent timeout forfeits that player; a legitimately elected successor starts at zero without rerolling any existing room.

After opening guarantees and forced-camp checks, draw an ordinary category using the Explorer's state before the discovery and the selected direction. Then update state from the result. Both direction tables sum to 100% for every state.

| Category | Horizontal | Downward | State change |
|---|---:|---:|---|
| Coin mine | 22% | 40% | min(3,L+1) |
| Treasure / vault | 33% | 15% | min(3,L+1) |
| Bright mineral Safe Zone | 12% | 8% | 0 |
| Supply cache | 10% | 10% | 0 |
| Trap | q(L) | q(L) | 0 |
| Gallery / noncash room | 23% − q(L) | 27% − q(L) | 0 |

q(0)=2%, q(1)=3.5%, q(2)=5%, q(3)=6%. Even a long lucky streak never raises the next trap chance above 6%. This is probabilistic compensation, not a guaranteed punishment. Do not secretly change these weights based on wallet, secret identity, or who seems to be winning.

Because mine + treasure is 55% in either direction, the state transition matrix, ordered 0/1/2/3, is:

| From | To 0 | To 1 | To 2 | To 3 |
|---|---:|---:|---:|---:|
| 0 | .45 | .55 | 0 | 0 |
| 1 | .45 | 0 | .55 | 0 |
| 2 | .45 | 0 | 0 | .55 |
| 3 | .45 | 0 | 0 | .55 |

Its stationary distribution is (.45, .2475, .136125, .166375). The ordinary-draw long-run trap probability is 3.445125%. This is not the exact trap fraction of a short match with guaranteed opening mines, forced Safe Zones, finite actions, or eliminated Explorers. The full generator includes topology/camp-distance state in addition to the four-state ordinary-content chain. The simulation checks row sums and stationarity.

## Room variety without hidden currency sources

Select visual subtypes uniformly within a category initially. Subtypes do not change category probabilities, grant extra coins, or provide undisclosed role bonuses. Cosmetic variation must not obscure interactable doors and targets.

| Category | Example subtypes | Gameplay content |
|---|---|---|
| Mine | Narrow ore seam; abandoned rail mine; crystal-vein pit | Eight-coin reserve, active on discovery, dim ambient light. |
| Treasure | Surveyor's strongbox; forgotten pay vault; wrecked supply wagon | One finite pile; one finder coin, rest in a chest. |
| Safe Zone | Shining mineral cathedral; luminous geode hall; crystal refuge | Permanently bright, spacious safe room, linked machine terminal. No automatic coins. |
| Cache | Tool locker; collapsed equipment depot; dry storage niche | One free basic nonweapon item for the discovering Explorer, lasting two rounds. Choose pickaxe, drill, hook, or crowbar uniformly. If inventory is full, leave a clearly marked pickup requiring a Loot action. No coin resale. Utility is excluded from the resource model. |
| Trap | Snare passage; falling cage; sticky mineral bed | Same one-round incapacitation rule. Different visuals do not imply different hidden penalties. |
| Gallery | Empty rail junction; echo chamber; dry underground lake; abandoned workshop | Traversable space and more possible boundaries. No coins, healing, free actions, or automatic protection. |

An item cache's direct grant is selected utility, not a currency reward. Unclaimed pickup contents/expiry are persistent and cannot be regenerated. A Loot action may claim one visible cache-item pickup into one of the fixed seven carried-item slots (equipment uses those same slots), without equipping it or granting another action. Check start capacity after the committed crowbar consumption (full seven minus one is legal), and recheck at completion; invalid capacity at start costs nothing, while lost capacity after a valid committed start consumes the action but leaves the pickup on the ground. The first valid accepted Loot start reserves the pickup; same-tick starts rotate original-seat priority. Losing competitors spend nothing, interruption releases the claim, and a faster Scavenger cannot overtake it. Only one successful claimant receives the item. Preserve its original expiry, including while on the ground; no coin conversion or lifetime reset. Cache pickups use the normal three-second Loot channel, or one second for a Scavenger. A strong visual distinction between empty gallery, productive mine, and exhausted mine prevents misleading players.

Physical channels use stationary, per-tick eligibility and unblocked-damage interruption; see [October 30 contracts](design-update-2026-10-30.md). The seven-item limit includes free grants, stored/equipped tools and personal potions, with no overflow storage.

Treasure size is uniform over an inclusive range set by initial player count:

| Starting players | Total pile |
|---:|---:|
| 3 | 5–7 |
| 4 or 5 | 7–9 |
| 6 | 3–5 |
| 7 or 8 | 4–6 |

The finder coin is deducted from the total. Any career can collect all remaining chest coins in one Loot action. Corpse partial-loot rules do not apply. Dead/departed players do not rescale future piles. Larger small-roster vaults compensate for one Explorer and the Merchant's upgrade burns; this balancing device needs human testing.

## Very rare discovery of scattered openings

The user confirmed a few real hidden openings on **every map**; remove the old 10% existence gate and all decoy destinations. Initially place **three small openings** in distinct scattered branches at depth zero. Each shortest excavatable path from the central camp has 14–16 horizontal room links, with no shorter cross-connection. Final branches/terminal rooms must be distinct; early path segments may be shared. No downward opening or new upward excavation qualifies. This is a topology constraint, not an exit roll on every room.

Openings are preassigned secondary room features independent of ordinary room category/RNG. A forced camp must retain any assigned opening; no extra money or mine reserve appears. Before discovery, no lighting, wall, route-counter or other cue distinguishes the route. Wrong branches may extend normally and need not be recognized within a fixed number of drills. Discovered-map navigation and camp-return guidance reveal no hidden terminal.

The tuning target is **below 1% unaided natural escapes before the deadline**, not a measured result. Having three real exits on every map does not itself establish that low encounter rate. Validate actual placement, branching, search policy and early paid endings before claiming the target is met. Do not confuse this with the retired 10% map-existence probability. No current natural-win estimate is available.

“Small” is visual: discovering the opening’s room identifies it clearly and unlocks the common escape; it is not a pixel hunt or a one-person exit. At round end, the first discovered opening saves all living unescaped players including Smugglers, before paid outcomes. Earlier winners remain winners; dead/forfeited players are not revived. No extra walk by every survivor or separate opening-use fee is introduced.

Only an Explorer’s paid Merchant compass supplies guidance. Initial retail nine/wholesale eight; single-use three-second Survey in an existing action slot, unused TTL three rounds. At depth zero, select the horizontally nearest opening from the current room’s fixed anchor, breaking exact ties by persistent opening ID, and display a private 90° sector with fixed room noise ±22.5°. It gives no exact location, path or correct wall. Different rooms can select different nearest openings; repeat readings within one room remain identical. There are no fake/no-exit readings on valid maps. See the [complete compass contract](compass-and-natural-exit.md).

The former 19.2%/1.9% clue-assisted rates and old single-exit graph are obsolete. Multiple openings, no free clues, expensive Survey actions and immediate mine income all require a new whole-map policy study. The action-only ideal of fourteen–sixteen discoveries still requires seven/eight rounds with two free drills, but offers no probability or travel guarantee.

## Required implementation validation

Validate the six-tile adjacency/36-tile forward-camp constraints, opening-guarantee priority, no free route signals, ordinary unbounded wrong branches, three real scattered openings on every map, nearest-opening compass selection/ties/switching and stable room samples with no decoys, independent RNG stream consumption, seeded rows, persistent per-Explorer state, a maximum 6% trap probability, guarantee consumption, immediate mine activation/no free field tools, discovery-relative reservation expiry, saved-pickaxe TTL and no saved actions, finite reserves, conservation, and deterministic replay. For generated maps, check connected accessible doors, no hidden upward excavation, known-ladder return, no duplicate rooms/resources, no escape shortcut, three accessible distinct openings and actual14–16-link minimum paths, and valid Safe Zone spawn positions. Route draw, topology, category draw, compass noise, and visual subtype need separate RNG streams so changing art does not change money outcomes.

Travel-time tests must measure whether two free drills can actually finish and whether four nearby mixed actions fit the confirmed 50-second field period, followed by a 15-second manual return. The confirmed full round is 110 seconds. An elected replacement permanently becomes an Explorer; their previous career abilities are removed. Validate actual walking distance to discovered forward camps, cone occlusion, darkness, lantern expiry, late arrival/fallback collection, succession voting, and trial access. None of these live geometry or input checks has been completed. The [implementation readiness report](implementation-readiness-v04.md) tracks them.
