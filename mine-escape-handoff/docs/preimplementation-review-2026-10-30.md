# Pre-implementation review — October 30, 2026

The user's follow-up resolves the behavior decisions from this review. Current rules version: `mine-escape-playtest-2026-10-30-interactions`. See the [adopted decision record](design-update-2026-10-30.md), [master handoff](../master-game-design.md) and [next asset brief](next-asset-batch-v02.md). The earlier review text is retained in the package's work/history folder. No application, new animation batch or gameplay test was produced by this update.

## Closed design questions

| Finding | Adopted resolution | Implementation acceptance |
|---|---|---|
| R1: channel interruption was incomplete | Stand still; turning requires valid visibility; movement, invalid target, incapacitation and unblocked HP damage cancel. Fully shielded hits do not. Meeting movement cancels even if the actor returns. | Continuous tick checks, move-away/back, shield versus nonlethal hit, meeting pause and strict field cutoff. |
| R2: contested Loot priority was ambiguous | First valid accepted start reserves chest/corpse/cache; same-tick rotating seat priority. Faster later Scavenger cannot overtake. Release on interruption/completion. | Losing starts consume nothing; interrupted holder spends commitment; ordinary half once globally, remainder to Scavenger. |
| R3: slot settlement could strand an unpurchased tool | Pre-28 approved bundle atomically commits extra slot, dependent item or owned-item reservation, unpaid weapon top-up, coins and sale counter at28. | Failed affordability/stock/capacity/camp check charges nothing; retries exact once; two extras settle as two independently complete bundles. |
| Inventory was unspecified at the requested smaller size | Seven fixed total physical items, nonstacking, equipment and personal potions included. No carried overflow or upgrades. | Every grant/purchase/pickup path, item references, terminal-only pending fallback/potion, consume-tool-before-capacity calculation and original TTL. |
| Purchase versus execution cost | Every purchase takes zero actions. Deposit still takes one; tool use and Guard delivery keep their prepared-action costs. | No purchase may decrement action use; owned items never grant extra actions. |
| R4: observer permissions and haunt range | User chose global discovered-world avatar visibility for ghosts; private data stays private. Murderer-only mild haunt once/base-round at any active phase, no range restriction. Escapees retain local observation. | No hidden map/private fields; no offline burst or retry replay; per-ghost persisted round budget; accessible private 450 ms effect. |
| A1: career conversion changed baked faces | Shared body/head/outfit identity components; preserve face, skin/hair, seat and aligned rig across conversion. | One identical person in Worker and Explorer animations before extending the full set. Existing PNGs remain references. |
| T1: committed receipt versus stale envelope | Current authority first, matching committed receipt second, execution freshness only for uncommitted commands. Immutable business hash excludes transport epoch/generation. | Commit-before-ack plus runtime takeover/controller replacement returns original receipt without repeated mutation; old sockets get no authority. |
| T2: exact deadlines versus 20Hz | Integer 50ms ticks; server receipt rounded upward; ordered overdue ticks; field completion strictly below1800; reconnect deadline detection+2200 with expiry winning equality. | Before/at/after28/30/90/110, meeting/recovery pauses, delayed callbacks, boundary resume and persisted counters. |

No additional user choice is needed to implement these contracts. Values such as seven slots and 450ms are selected defaults within the user's stated preference; balance and comfort have not been demonstrated.

## Assets still required

The delivered pack contains **38 static source PNGs**: eight career appearances, eighteen item/service icons and twelve room plates/states. It has no directional animations, modular identity rig, mild-haunt animations or playable modular room assembly.

1. Prove an identity-preserving Worker/Explorer animation pilot, then extend all careers/duplicate variants. Add career-preserving death/corpse, ghost and **eight mild haunt appearances** with a shared ghost rig for future face/outfit combinations.
2. Build separate floor, wall/foreground and sealed/open port pieces, paired up/down ladders and a revealed natural-opening overlay. Hidden openings have no advance visual clue.
3. Separate interactive terminal, active/depleted mine, closed/open/empty chest, cache pickup, trap and placed lantern states from painted backgrounds. Keep collision and interaction polygons separate from alpha.
4. Add readable seat markers, seven-slot inventory/locked equipment links, expiry/pending grant/atomic checkout states, channel interruption, claim-in-use, return-to-camp, ghost allowance and accessibility indicators. Prefer text/vector UI for these.
5. Add local-only action/hit/shield/healing/rescue effects, restrained optional audio, runtime export sizes, feet/pivots and atlas groups. Never add a theft animation/sound, public wallet or Smuggler costume.

The [asset brief](next-asset-batch-v02.md) gives the production order and acceptance rules. Existing four-port room metadata is proposed geometry: a four-tile room with a 0.16-width port gives 0.64 tiles, which does not by itself prove collider clearance. Test an assembled room before drawing more footprints.

The 38 original PNGs total **43,271,787 bytes (41.27MiB)**. Uploading every source once as RGBA8 would total **227.95MiB**, before mipmaps/other buffers; this is source arithmetic, not measured runtime memory. Preserve originals and select smaller runtime exports after silhouette/alpha tests. Gallery source and image files were checked; browser rendering and device performance remain unverified.

## Remaining evidence gaps

| Area | What must be demonstrated |
|---|---|
| Fixed inventory and choice time | Seven slots, pending grants and atomic checkout remain understandable within the 18-second purchase window, including touch, latency and stored tools. |
| Pacing and geometry | Four nearby actions plus manual return, doorway clearance, visibility cones, ladders and 36-tile forward-camp spacing work in the actual movement model. |
| Current economy | Fare 11/private 25, immediate finite mining, treasure, tool storage, Merchant/Guard demand and each Smuggler cover need current-engine scenarios. Historical funding percentages are not current predictions. |
| Natural exits and Compass | Three 14–16-link openings are reachable without shortcuts/clues; unaided escape below 1% is an unmeasured target. Nine-coin compass value needs testing. |
| Combat and social incentives | Interruption, exclusive Loot claims, protection, votes, career loss, camping and ghosts' global visibility can change behavior. Haunt timing can convey a limited signal despite no text chat. |
| Multiplayer and privacy | Authoritative clocks/transactions, private projections, reconnect, crash recovery, duplicate inputs and real devices/public URL remain unimplemented. |
| Asset comfort and integration | Identity conversion, mild-haunt comfort/reduced motion, alpha edges, draw order, load time and atlas memory require runtime inspection. |

A Guard-covered Smuggler receiving both services every round has a conditional no-spending ceiling of `2 + 3r`, reaching 26 in round 8. This requires willing solvent customers, legal deliveries, survival and no losses/contributions; it is not a guaranteed escape or proof of dominance. Test it against the Merchant's two-coin profit cap before changing prices. The earlier Guard-timeout-before-second30 concern remains retracted: current-round authorization plus 110 seconds of grace cannot expire before that delivery.

Next implementation order remains: character/room pilot, authoritative rules and contract tests, current balance simulation, multiplayer/storage/privacy, device playtests, then deployment when authorized. More prose cannot prove these outcomes, and no extra game system is required to begin an authorized prototype.
