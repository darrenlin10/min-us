# Scattered natural openings and Merchant compass

The [master game design and implementation plan](../master-game-design.md) incorporates this contract alongside all other rules and the structured source layout.

Updated October 30, 2026. Rules version `mine-escape-playtest-2026-10-30-interactions`. This replaces the old 10% map gate, single exit and decoy-compass design. [Full rules](game-design-v04.md) · [Exploration model](exploration-model-v04.md) · [Revision arithmetic](revision-math-2026-10-29.md).

## Confirmed direction and rarity

The user confirmed **a few real hidden escape openings on every map**, extremely hard to find without guidance. There are still no free clues, preferred walls, route-progress counters, special sounds/lights, or guaranteed recognizable wrong branches. Without a compass, finding an opening is luck. Ordinary map navigation and camp-return estimates do not reveal the way to an opening.

Initial generator default: **three small openings**, scattered into distinct horizontal branches at depth zero. Each has a shortest excavatable route of 14–16 new horizontal room links from the starting camp; prevent shorter connections and clustered terminal rooms. Paths can share an initial section, but their final branches must differ. Openings are secondary features of their rooms, not extra currency categories: mine/treasure/trap/camp weights remain separate. A forced Safe Zone cannot erase an assigned opening, and an opening grants no coins. One opening is sufficient to unlock the common natural escape at round end for all living unescaped players, including Smugglers. The small passage's appearance does not impose a one-person capacity or change the all-survivor reward.

**Rarity target: below 1% of matches ending in an unaided natural escape in representative validation runs.** This is a first-playtest target, not an achieved percentage or a hidden per-discovery roll. The old 10% referred to whether a map contained an exit; that gate is removed. Now all maps have openings, while the chance of discovering one before the deadline is meant to be very low. Actual frequency needs an unmarked-map/search-policy model and player tests. Multiple openings can increase encounter probability, so do not claim the target is met without measuring the generated layout. Preserve the minimum search depth and no-free-clue rule when tuning separation/branching.

“Small” describes the art, not an inaccessible pixel hunt. Before the room is discovered, no opening information leaks. Successfully discovering its room reveals the usable opening clearly and unlocks natural escape; no tiny click target or extra Survey is required. Discovery does not give new actions. The user has not requested changes to round-end outcome timing or the shared win.

## Expensive single-use compass

| Property | Initial default |
|---|---|
| Seller / unlock | Merchant only, tier1 alongside the potion; existing three-coin unlock from round2. |
| Buyer / user | Current Explorer, including an elected Explorer or a Smuggler with Explorer cover. No Merchant use of unsold stock. |
| Price | **Nine coins retail, eight wholesale**, triple the old retail3. Merchant receives at most one profit within the existing shared two-per-round cap. |
| Supply | At most two manufactured per round; no free cache/machine issue, gifts, resale or subsidy. |
| Lifetime | Three rounds from manufacture, with normal inventory capacity. Trading/equipping never refreshes it. |
| Use | Prepare at camp, then one three-second Survey action during field time at depth zero. **One committed use consumes the compass and action.** It cannot scan again or act as passive continuous guidance. |
| Result | One owner-private static 90° sector, anchored to the surveyed room, pointing approximately toward its nearest real opening. No exact location, distance, correct door, opening ID or route path. |
| Note | The completed reading stays in the owner's journal for the match; it does not update as they move. A new room's reading requires a different purchased compass/action. |

Compass activation is rejected without consumption for invalid role/depth/item/slot/phase, or when natural escape is already unlocked. Accepted interruption consumes it without giving a reading, consistent with other action tools. A trapped Explorer must be rescued before Survey. The one-use limit is per item; buying another costs nine with no purchase action; using it requires another prepared Survey action. No unrequested per-player lifetime purchase limit is added.

Purchases obey the fixed seven-item capacity and can be bundled atomically with an extra action before the cutoff. Survey uses the stationary/interruption contract, including unblocked damage. See [October 30 decisions](design-update-2026-10-30.md).

## Nearest opening and approximate bearing

Choose the opening with the smallest horizontal straight-line distance from the surveyed room’s fixed reference point; use a persistent opening ID to break exact ties. “Nearest” does not mean the easiest tunnel route. Compute its bearing, apply fixed room-specific angular noise between −22.5° and +22.5°, and display a 90° sector centered on that result. The true bearing lies within the sector, but a winding tunnel can require initially moving away from it. The server never identifies the next correct wall.

Sample/store one result per match/room on a separate server-only stream. All Explorers/items surveying that room get the same sector: turning, moving inside the room, reopening the UI or reconnecting cannot generate fresh samples. A Survey from another room may select a **different nearest opening**, so different readings must not be presented as necessarily pointing to the same destination. Only completed owner-authorized readings are sent to the client. Keep all opening coordinates, IDs, topology, RNG state and other owners’ notes server-private.

There are **no fake or decoy readings** in the selected design, since every valid map has real openings. Generation must validate three accessible distinct openings before a match starts. An invalid generator result is a technical setup failure, not a paid opportunity to receive a fabricated direction. The terminal room is identified on discovery; Survey is then disabled by the public unlocked-escape state.

## Cost and evidence

Each sale burns eight crew coins and earns the Merchant one if margin allowance remains; if the cap is exhausted it burns nine and earns zero. A Survey also replaces a potential drill/action. That is an expensive information purchase, not a guaranteed escape or extra move. The price is an initial calculated choice, not independently specified by the user or proven optimal.

The old clue-assisted 19.2%/1.9% results and the old 10% gate are obsolete. Prior funding studies also used next-round mine activation and omitted this nine-coin compass. Do not reuse those figures as current success rates. Validate unmarked graph search, scattered-opening placement, nearest-target switches, compass affordability, lost drill time, traps, one/two Explorers and actual travel. Every map can contain an escape while players still rarely find it; the frequency remains unmeasured.

## Implementation and tests

Update `generateOpenings.ts`, `world/compass.ts`, `survey.ts`, Merchant catalog/stock, owner notes and `CompassReading.tsx`. Persist all opening locations and fixed room target/sector samples. Test three distinct accessible openings,14–16-link minimum paths/no shortcuts, no free hints, nearest-distance ties/switching, no decoys, no hidden coordinate leakage, one-use/expiry/interruption, nine/eight-coin accounting and shared margin cap. The first discovered opening unlocks the existing all-survivor natural outcome; no private fare or one-Smuggler limit applies.

No game code was created; this is a design specification.
