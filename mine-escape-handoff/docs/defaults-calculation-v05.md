# Selected defaults and pre-implementation gap report

Current-rule pointer, October30: [adopted interaction/inventory/ghost/server contracts](design-update-2026-10-30.md). The dated calculations and findings below retain their original assumptions; they are not new runtime evidence for this revision.

> Historical evidence. The [October29 design](design-update-2026-10-29.md) now uses real scattered openings on every map, a nine-coin single-use nearest-opening compass and immediate mine activation. Old rates/policies below are not current predictions; the alleged same-round Guard-timeout gap is retracted.

October 28, 2026. These are selected **first-playtest defaults**, chosen under the user’s instruction to calculate the remaining values. Confirmed preferences remain unchanged. This closes policy ambiguities; it does not claim proven balance or a working game. See the [full rules](game-design-v04.md), [implementation tasks](implementation-readiness-v04.md), and [all documents](../README.md).

Latest user correction: [no free exit clues; optional Merchant compass](compass-and-natural-exit.md). The old clue-assisted rates are obsolete, and economy figures below exclude compass costs.

## Decisions for the first build

| Area | Selected rule | Reason |
|---|---|---|
| Actions | Two free each round; every extra slot costs coins; at most four total. | Four is capacity, not an entitlement. Tools and slot fees are separate; mining caps still apply. Deposit markers are free in any owned slot, preserving no contribution fee. |
| Shared fare | **11 × living, unescaped, non-forfeited players**, including secret covers. | Replaces proposed 12 after accounting for purchase burns and forward camps replacing potential resources. |
| Private escape | **25 coins**; unchanged. | Above the generous Worker ceiling of 20 mined coins + two starting coins, even with extra actions. Opening-mine delay makes actual mining-only yield lower. |
| Merchant | Combined trade-profit cap two/round; upgrades **3/5/7**, earliest rounds 2/4/6. | Preserves investment pressure. Lower upgrade prices increased Merchant income; cap three allows trading alone to exceed 25. |
| Extra-slot quotes | 1, 2, 3, … across completed sales each round; two extras maximum/person. | Merchant earns at most one per external sale within the shared cap; remainder burns. Stored tools avoid a new-tool fee, never the slot price. |
| Combat | Club/blade/gun base 4/7/10, damage 1/2/3; add floor((round−1)/2). Trial base six plus same surcharge. | Late healthy-target gun cost 14 exceeds the 11-coin fare reduction; wounded targets and loot can still make attacks attractive. |
| Votes | Strict majority of all living unescaped eligible players; camp ballots. Succession 20 seconds, trial 30. | Prevents a minority of those present from executing someone; failed coordination remains possible. Lobby start still requires unanimity. |
| Movement/camps | Three tiles/second; aim for six walking tiles between adjacent interaction anchors; 36-tile return budget with margin. | Four three-second channels plus 12 seconds attention leave 26 field seconds for movement. A 15-second return minus three seconds margin covers 36 tiles. |
| Forward camp guarantee | A new room reaching 36 walking tiles from the nearest existing camp becomes a Safe Zone, replacing its content draw. | Bounds growing camp gaps. Actual templates must enforce walking distance, not merely count rooms. |
| Natural route | 10% gate, 14–16 linked horizontal rooms; no free clues or guaranteed recognizable wrong branches. Explorer may buy a Merchant compass. | Unaided exploration is pure luck; paid guidance gives only an approximate destination bearing. |
| Joining/reconnect | Nickname + room code; no login, mic, install, or audio permission. Automatic browser credential; 110 advancing game seconds to reconnect. | Names identify players socially; private credentials protect their seat and wallet. |

Inventory, HP, item lifetime, room weights, Guard prices and other catalog values in the canonical design are also selected initial defaults. They are no longer awaiting individual approvals. The rules version is `mine-escape-playtest-2026-10-28-compass`; filenames retain v04/v02 for link continuity.

## Resource calculation — before compass addition

The new economy experiment ran **264,000 seeded cases across 264 configurations**, 1,000 cases each. Each round checked wallet/pile/fund/burn conservation, nonnegative balances, finite reserves, production and slot bounds, and the trade-profit limit. Candidate policies share indexed per-Explorer random streams; differing action choices still change which draws are used.

The table uses the selected upgrades/profit cap, moderate voluntary purchase policy, and an abstract six-room forward-camp rule. “Coverage” means this policy deposited the required fund by round ten. It is **not a human or faction win rate**. Approximate sampling intervals are at most ±3.1 percentage points for each row; assumptions can cause much larger error.

| Starting players | Fare 10 | Selected fare 11 | Prior fare 12 |
|---:|---:|---:|---:|
| 3 | 77.4% | 69.3% | 57.0% |
| 4 | 84.9% | 74.9% | 64.5% |
| 5 | 81.2% | 70.3% | 60.7% |
| 6 | 91.2% | 79.5% | 57.3% |
| 7 | 95.3% | 88.0% | 75.0% |
| 8 | 92.2% | 80.6% | 63.7% |

Fare 10 gives more headroom but reaches 91–95% in larger-roster cooperative resource cases. Fare 12 falls below 65% for five of six rosters before adding real movement, secrecy, or conflict. Eleven is a reasonable starting compromise, not a mathematically unique optimum. Each death/forfeit reduces the target by eleven; earlier deposits stay. A later private departure reduces the next round’s target, without a same-check cascade.

The model includes individual-wallet affordability, paid extra slots/tools, finite mines, action-costed deposits, per-Explorer luck, chest/body collection, upgrade burns, capped commissions, and imposed retail demand. It assumes every online player reaches camp/targets and uses privileged aggregate-wallet information to coordinate deposits. Merchant buys upgrades as soon as affordable. Potion purchases are modeled as insurance demand without a simulated health benefit. Stored tools, inventory expiry, Guard contracts, theft strategy, secret factions/competing escape decisions, actual combat/shields, human voting, and spatial interaction are not simulated. Those require the future rules engine. These omissions prevent describing this as validation of the complete economy.

“Moderate” permits up to one paid extra/person and three orders/team/round; the fourth-slot stress permits two extras/person and six orders/team. Those are model policies, **not additional game caps**. Each extra pays the escalating quote plus one newly bought tool. Profitable demand is often low; the maximum of four does not imply everyone buys four every round.

| Players | No paid-slot/retail demand | Moderate purchases | Fourth-slot demand stress | Mean paid slots/match (moderate) |
|---:|---:|---:|---:|---:|
| 3 | 75.6% | 69.3% | 65.6% | 3.20 |
| 4 | 79.3% | 74.9% | 74.8% | 2.75 |
| 5 | 75.5% | 70.3% | 70.2% | 3.18 |
| 6 | 89.7% | 79.5% | 54.4% | 8.13 |
| 7 | 91.2% | 88.0% | 86.6% | 6.78 |
| 8 | 81.4% | 80.6% | 80.6% | 6.76 |

## Merchant and combat incentives

Trade cap one/two/three gives a ten-round theoretical trading-plus-starting-wallet ceiling of **12/22/32** coins before upgrades or other spending. Choose two: trade alone cannot pay the private fare, while three can. All three upgrades burn 15, leaving at most seven from capped trade plus starting coins; the Merchant must also do field work to invest and contribute heavily. This bounds trading, not total wealth.

| Players | Mean trade profit | Merchant field + trade − upgrades | Mean Worker field income |
|---:|---:|---:|---:|
| 3 | 5.53 | 17.30 | 19.63 |
| 4 | 5.04 | 16.53 | 17.65 |
| 5 | 5.20 | 17.53 | 15.43 |
| 6 | 9.64 | 20.11 | 18.97 |
| 7 | 8.69 | 19.65 | 18.13 |
| 8 | 9.13 | 18.06 | 18.81 |

These income columns include chest/corpse earnings, so Worker income may exceed the mining cap. They are not final wealth: deposits, customer purchases and losses are not all deducted in these income measures. They indicate that trade is only part of Merchant earnings; they do not prove career parity. Cheaper upgrades 2/3/5 raised the Merchant measure while reducing the intended investment burden, so retain 3/5/7. Under the selected policy all three upgrades completed in 94–100% of cases, using ideal access and cooperative loot behavior—not a promise for actual play.

Weapon comparison: with three HP and no shield, one gun uses one attack and costs 10 early/14 late. Blade+club costs 11 early/19 late and needs two attackers or different rounds; three clubs cost 12/24 and three attacks. A life shield blocks one whole hit, increasing needed attacks. Loot and contribution each require separate actions. A late gun costs three more than the fare it removes, but six victim coins yield three to an ordinary looter; recovered loot or a wounded target can still reverse that arithmetic. Price escalation discourages some kills without eliminating the intended betrayal strategy.

## Disruption sensitivity

One prescribed event is attempted in round eight if affordable; gun/passed-trial outcomes are forced, not resolved tactically. The disconnect case removes one original Explorer after a whole missed round and assumes a successful election only if no Explorer remains. This is a resource stress test, not a simulation of human ballots or connection timing.

| Players | Baseline | Explorer timeout | Gun event | Failed trial | Passed trial |
|---:|---:|---:|---:|---:|---:|
| 3 | 69.3% | 67.5% | 27.8% | 33.7% | 24.7% |
| 4 | 74.9% | 71.0% | 60.1% | 49.8% | 65.5% |
| 5 | 70.3% | 41.7% | 58.8% | 49.1% | 65.6% |
| 6 | 79.5% | 19.7% | 25.2% | 39.4% | 39.6% |
| 7 | 88.0% | 22.0% | 60.6% | 68.8% | 71.3% |
| 8 | 80.6% | 34.7% | 44.9% | 59.8% | 52.9% |

The loss of one of two Explorers can leave resource coverage very low: only the last Explorer’s loss triggers succession under the chosen rule. This is a known balance risk and reinforces protecting Explorers. The tests do not justify promising that every roster remains recoverable after sabotage. No automatic spare Explorer, farewell coin grant, or revival has been added.

## Travel and natural-exit correction

The previous experiment ran 180,000 clue-assisted route cases and 180,000 separate camp-gap cases. Its random-camp gap and return-distance arithmetic retain their stated scope: at three tiles/second, a fifteen-second return minus three seconds margin covers 36 tiles. Four three-second channels plus twelve seconds attention leave 26 seconds of field travel. A connected graph is not proof that real room templates and touch input meet those limits.

**User correction: natural exit has no free clues.** Remove preferred walls, air currents, route progress and guaranteed recognizable two-room wrong branches. Unassisted discovery is pure luck. Keep the 10% existence gate and 14–16 linked horizontal discoveries. Wrong branches extend as ordinary exploration; they do not promise an identifiable failure after two drills.

An Explorer may buy a Merchant compass, initially tier 1 at wholesale two / retail three, lasting three rounds unused. One prepared three-second Survey action consumes it and gives a private static 90-degree bearing sector from that depth-zero room toward the approximate exit location, with fixed room-specific noise up to ±22.5 degrees. It does not show a correct wall, distance, exact coordinate or traversable path. No-exit maps use the same-format persistent decoy bearing; repeats in the same room do not reroll. See the [complete compass contract](compass-and-natural-exit.md).

Compass arithmetic: one sale costs the Explorer three coins. Manufacturing plus sale burns two team coins and earns the Merchant one when profit allowance remains; when exhausted, it burns three and earns zero. The combined trading cap of two/round and trade-only ceiling of 22 including starting money remain unchanged. The Survey also replaces a possible drill in that slot; it grants no extra action. The existing resource cases did not model this optional spending or lost drill time, so their figures are pre-compass baselines, not validation of the expanded catalog.

The old **19.2% route-present / 1.9% gate-adjusted** completion estimate is **withdrawn for the current design**. Its free cues and recognizable failed branches no longer exist. Historical results remain in the spatial report/JSON for provenance; neither they nor a simple per-wall success multiplier model the corrected graph. Measure blind search and paid compass behavior on actual winding topology, including backtracking, traps, coin affordability, one/two Explorers and return walks before publishing a current natural-win estimate.

## Reconnect, identity, and votes

A disconnect starts a **110-second advancing base-game-time** deadline. Trials, succession and server recovery pause it; ordinary offline players do not pause the match. Fully authenticated reconnect must reach the controller strictly before the deadline. At equality, expiry wins. For example, disconnect at round three second 60 expires at round four second 60, excluding meeting/recovery pauses. Accepted durable actions continue under their normal rules; stale movement stops.

On timeout, permanently revoke the seat for this match. A living underground avatar forfeits, leaves one ordinary corpse containing its remaining wallet, loses its items, retains previous contributions, and no longer counts toward the fare or electorate. It gets no survival award, killer credit, controlled ghost, or haunt target. A previously dead avatar creates no second body; an already escaped winner keeps the result. Deny active-match rejoin even under a new nickname; final results and a fresh rematch are separate. Explicit Leave starts the same grace period, not an instant fare reduction. A deliberate sacrifice can still help the team after the delay; that follows the requested removal rule and cannot honestly be called exploit-proof.

After timeout, if zero living unescaped non-forfeited Explorers remain, queue succession at the next eligible post-arrival meeting. Do not duplicate a surviving Explorer. Freeze each meeting’s electorate at its start; strict majority is floor(N/2)+1. Base time is paused during meetings, so disconnect expiry cannot silently change that denominator. Failed votes retry next round, with no automatic appointment.

| Eligible players | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Votes needed | 1 | 2 | 2 | 3 | 3 | 4 | 4 | 5 |

One survivor may elect themselves Explorer. A trial needs a distinct other accused; with two survivors both must vote yes, which is intentionally protective. Disconnected eligible players still count during their grace period. Camp presence controls where a ballot can be cast, not whether a distant player is removed from the denominator.

Players enter only a nickname and room code. Generate a secret browser credential automatically, use stable player IDs, lock nicknames during play, and never accept a name/code alone as proof of an existing seat. Reconnect is supported from that browser while its credential survives; clearing storage or switching devices cannot reclaim private state by name. No microphone API/permission or voice service is needed. A private room code plus unanimous start fits trusted friends/classmates. Without stronger identity verification, it cannot guarantee one human per browser/seat or prevent external communication.

## What can and cannot be closed before coding

The action rule, abandonment policy, vote thresholds, prices, Merchant cap, item defaults, camp-distance target and optional paid Compass/Survey now have explicit implementation contracts. No further design answer is required to begin a prototype when authorized. Arithmetic checks and bounded resource/spatial experiments are complete for this pass.

Remaining work is implementation evidence: actual phone movement/checkout timing; generated-map distance/path correctness; full faction/role-loss balance and social playtests; server privacy and synchronization; reconnect/forfeit/restart boundary tests; public hosting and separate-device acceptance. These can be reduced through the staged [implementation checklist](implementation-readiness-v04.md), not eliminated by more paper rules. Human collusion, vote obstruction, inferred theft and deliberate sacrifice remain possible within the chosen game.

Reproduce: `python3 work/defaults_economy_v05.py`, `python3 work/defaults_spatial_v05.py`, then `python3 work/report_defaults_v05.py` from the extracted package root. [Economy JSON](defaults-economy-v05.json), [spatial report](defaults-spatial-v05.md), [spatial JSON](defaults-spatial-v05.json), and [calculated contracts](defaults-calculation-v05.json) preserve parameters/results. The earlier [90,000-case resource report](balance-analysis-v04.md) remains historical and is not overwritten. No game code or deployment was created.
