# Spatial and natural-route default analysis v0.5

Current-rule pointer, October30: [adopted interaction/inventory/ghost/server contracts](design-update-2026-10-30.md). The dated calculations and findings below retain their original assumptions; they are not new runtime evidence for this revision.

> Historical evidence. The [October29 design](design-update-2026-10-29.md) now uses real scattered openings on every map, a nine-coin single-use nearest-opening compass and immediate mine activation. Old rates/policies below are not current predictions; the alleged same-round Guard-timeout gap is retracted.

> Historical free-clue route model. The user removed all free natural-exit clues and recognizable failed branches; an optional paid Merchant compass now provides only a coarse bearing. The 19.2%/1.9% route result does not apply. Camp-distance arithmetic and the separate camp-gap cases retain their stated scope. See the [current compass rules](compass-and-natural-exit.md).

Generated October 28, 2026. This is a reproducible, bounded design experiment—not a playable map, full rules simulation, or predicted human win rate. It leaves the confirmed 110-second schedule, manual camp return, permanent Explorer succession, and the 10% rare-exit gate unchanged. No canonical design document is modified by this analysis.

## Working assumptions

- One Explorer takes at most two discovery actions per round for ten rounds, with no purchases, traps, deposits, combat, interruption, role loss, or other duties. Route length is uniformly 14/15/16 and the route is assumed to exist.
- A correct cue selects the next route room. An incorrect cue costs one or two additional drills on an identifiable dead-end branch, after which the Explorer returns and tries the correct continuation. Wrong discoveries do **not** reset progress. This is an explicit optimistic clue/backtracking policy: the selected October 28 design now specifies two-room recognizable failed cue branches; implementing that contract in real geometry remains necessary.
- A tree represents route and dead-end branches. Edge length is effective walking distance between adjacent interaction locations, not a measured room width. All distances include backtracking through known branches. No free teleport is used.
- Walking speed is three tiles/second. Each discovery takes a three-second channel plus three seconds of targeting/attention. Departure gives ten seconds of movement before the fifty-second field window. The player returns to a known camp by the end of the fifteen-second return buffer with three seconds reserved; settlement/next arrival are not used to extend planned work.
- Every round starts from the camp reached on the previous return. The player may leave the field early to complete a longer return. Unknown rooms are not assumed to contain a camp when deciding whether the next action is feasible.
- For the travel experiment, each new room after the one guaranteed opening mine has an independent 12% camp chance. This models a one-Explorer small-roster route only; it is not the full Markov content model, and it does not model a five-player second opening mine. A comparison guardrail forces a camp when a newly opened room would be six graph hops from the nearest discovered camp. This changes the content distribution; the separate October 28 economy analysis includes a linear-frontier approximation of its resource cost.
- All Monte Carlo comparisons use 5,000 seeded route cases per row; the separate camp-gap experiment uses 30,000 cases per row. Seeds and parameters are stored in the companion JSON. Confidence intervals describe simulation sampling uncertainty only, not uncertainty from these simplifying assumptions.

## Return-distance arithmetic

At three tiles/second, the dedicated fifteen-second return window covers **45 walking tiles**. Reserving three seconds for targeting/attention/network margin leaves **36 tiles**. This is a budget when work finishes near field close, not a hard exploration radius: players can finish early and begin their return during field time.

Four three-second channels plus three seconds of attention per action cost 24 of the 50 field seconds. The remaining 26 seconds plus the ten-second departure grace permit up to **108 tiles of outbound/inter-target movement**, but the last task must still satisfy the return constraint. Two discovery actions cost 12 seconds, leaving more time for outward travel or an early return.

| Effective adjacent-room spacing | Return hops within 36 tiles | Return hops within 45 tiles |
|---:|---:|---:|
| 4 tiles | 9 | 11 |
| 6 tiles | 6 | 7 |
| 8 tiles | 4 | 5 |

Independent camp draws have long tails. The following is the chance that a sixteen-room outward path contains a noncamp stretch beyond the indicated return budget. The first room is forced noncamp to represent the opening mine; this is not a complete map-generation model.

| Camp chance | Spacing | Any gap beyond 36 tiles | Any gap beyond 45 tiles |
|---:|---:|---:|---:|
| 12.0% | 4 | 47.8% | 31.9% |
| 12.0% | 6 | 81.0% | 70.7% |
| 12.0% | 8 | 96.4% | 90.0% |
| 8.0% | 4 | 64.1% | 48.2% |
| 8.0% | 6 | 90.9% | 84.1% |
| 8.0% | 8 | 98.9% | 96.0% |

## Discovery budget with retryable wrong branches

For length L and cue accuracy p, the modeled drill cost is L + kB, where B is binomial(L, 1−p) and k is the wrong-branch depth. Completion by twenty drills is P(B ≤ floor((20−L)/k)), averaged over lengths 14/15/16. Multiplying p fourteen to sixteen times would incorrectly treat any wrong clue as permanent failure.

| Cue accuracy | One extra drill per wrong cue | Two extra drills per wrong cue |
|---:|---:|---:|
| 70.0% | 69.3% | 19.4% |
| 80.0% | 90.9% | 48.3% |
| 85.0% | 96.7% | 67.3% |

## Travel, backtracking, and camp sensitivity

These rates are **conditional on a route existing**, for the single-Explorer policy above. Rates after the 10% gate are one tenth of the conditional figures, still not player win rates. Other actions, traps, misleading unbounded branches, and combat can lower completion; another cooperating Explorer can raise it.

| Cue | Wrong-branch drills | Spacing | Random camps | Camp by six hops |
|---:|---:|---:|---:|---:|
| 70.0% | 1 | 4 | 69.2% | 69.2% |
| 70.0% | 1 | 6 | 68.4% | 69.2% |
| 70.0% | 1 | 8 | 53.2% | 69.2% |
| 70.0% | 2 | 4 | 19.2% | 19.2% |
| 70.0% | 2 | 6 | 18.7% | 19.2% |
| 70.0% | 2 | 8 | 14.6% | 19.2% |
| 80.0% | 1 | 4 | 90.7% | 90.7% |
| 80.0% | 1 | 6 | 89.6% | 90.7% |
| 80.0% | 1 | 8 | 69.8% | 90.7% |
| 80.0% | 2 | 4 | 48.8% | 48.8% |
| 80.0% | 2 | 6 | 47.5% | 48.8% |
| 80.0% | 2 | 8 | 36.1% | 48.8% |
| 85.0% | 1 | 4 | 96.8% | 96.8% |
| 85.0% | 1 | 6 | 96.1% | 96.8% |
| 85.0% | 1 | 8 | 73.6% | 96.8% |
| 85.0% | 2 | 4 | 67.1% | 67.1% |
| 85.0% | 2 | 6 | 65.9% | 67.1% |
| 85.0% | 2 | 8 | 50.2% | 67.1% |

## Historical candidate defaults — route guidance superseded

Use **three tiles/second**, room templates targeting **about six effective walking tiles between adjacent interaction locations**, and a **36-tile end-of-work return budget** shown by the server's shortest-known-path estimate. These are measurable targets, not promises derived from tile art dimensions. Reserve three seconds within the fifteen-second return buffer; do not rely on settlement/arrival to make the advertised route feasible.

The former experiment used **70%** cues and a two-extra-drill failed-branch rule. Both are now superseded by the user’s no-free-clues instruction; this section describes the historical model only. Two indicated candidate walls and a recognizable sealed air pocket after two wrong-branch discoveries allow backtracking to retry. Route-absent/off-route decoys use the same presentation. The 80/85% alternatives materially raise conditional success in this model; they are not selected. Actual clue comprehension and geometry still need a prototype.

For accessibility of forward camps, select a topology guardrail: **a newly opened room that would be six effective six-tile hops from the closest discovered camp becomes a Safe Zone**. Earlier random camps remain possible. Apply the same distance rule to side branches and depth transitions using actual walking distance, not just route index. This caps planned camp spacing without teleportation and keeps safe-room status distinct from temporary lantern light. Forced Safe Zones replace potential content; the new economy comparison accounts for an approximate resource penalty. The selected shared fare is now eleven. See the [combined calculation report](defaults-calculation-v05.md).

In the modeled one-extra-drill case, the 70% cue / six-tile spacing / six-hop-camp combination completes 69.2% of route-present cases (approximately 6.9% after the existence gate). Under that historical two-wasted-drill rule, it is 19.2% conditional (1.9% after the gate). This sensitivity is why clue interpretation is more important than presenting a single success number.

The camp guardrail principally protects late-task return reliability; this model lets explorers return early and therefore does not equate exceeding 36 tiles with automatic failure. A single field objective can still be reachable farther away. Actual geometry must check doors, ladders, wall collisions, turning, touch input, item selection, and simultaneous players.

## One-round disconnect contract to add to implementation

- Store an authoritative `disconnectedAtBaseTime` and an expiry exactly **110 advancing base-game seconds** later. This is elapsed game time, not 'at the next round boundary' and not wall-clock time. Trial/succession/recovery pauses do not consume it. A disconnect at second 100 can extend through the next round until its second 100.
- While pending, the avatar and obligations remain. Movement input stops; already accepted actions follow their ordinary rules; disconnect is not a shield, remote camp access, or role vacancy. A reconnect before the deadline restores that seat and invalidates the old controller generation.
- At expiry, atomically mark a permanent forfeit, invalidate the participant/controller authorization, cancel pending actions/offers, and apply the selected corpse-wallet/inventory-destruction/fare disposition exactly once. Never erase the wallet or reduce the fare twice. For a living underground avatar, create one ordinary corpse and a system cause—not invented killer credit or a haunt target.
- Rejoining the active match after forfeiture is denied, including ghost/spectator controls; it cannot restore HP, inventory, wallet, actions, voting, or Explorer abilities. A final result page or a new rematch lobby is separate. Expire old transport tickets and reject queued commands with the superseded seat generation. Keep the forfeiture tombstone through match retention.
- Process reconnect versus expiry in the serialized controller with an explicit deadline rule (fully authenticated controller acceptance strictly before expiry). Persist the deadline and forfeit transition across server restart. A deliberate Leave starts the same grace; it does not immediately reduce the fare.
- Trigger Explorer succession only after there are **zero living, unescaped, non-forfeited Explorers**. A temporarily disconnected or trapped Explorer is not a vacancy. A forfeiture does not create a free Explorer or bypass nomination/majority; it enables the normal next eligible succession meeting.

Reproduce with `python3 work/defaults_spatial_v05.py`. The companion [JSON](defaults-spatial-v05.json) contains every comparison row and sampling interval; no production game code was created.
