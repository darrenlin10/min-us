**Economy and room-discovery analysis v0.4 — October 27, 2026.** This replaces the earlier 140,000-trial resource study for the revised rules. It is an analysis script and report, not a playable game, combat simulator, or proof of balance.

Current-rule pointer, October30: [adopted interaction/inventory/ghost/server contracts](design-update-2026-10-30.md). The dated calculations and findings below retain their original assumptions; they are not new runtime evidence for this revision.

> Historical evidence. The [October29 design](design-update-2026-10-29.md) now uses real scattered openings on every map, a nine-coin single-use nearest-opening compass and immediate mine activation. Old rates/policies below are not current predictions; the alleged same-round Guard-timeout gap is retracted.

> Historical October 27 evidence, retained unchanged below. The current rules and resolved defaults are in the [October 28 calculation report](defaults-calculation-v05.md) and [current audit](design-audit-2026-10-28.md). Earlier unresolved policies and fare twelve are superseded.

**Scope after the manual-camp revision.** The 90,000 results below are the existing ideal-travel resource baseline, produced before manual camp return, Explorer elections, escalating weapon/trial prices, the two-coin Merchant trade-profit cap, and natural escape for all survivors including Smugglers. They have not been rerun with those systems and must not be described as validation of the newest rules. The user has confirmed the 110-second schedule and permanent Explorer conversion; this model has no movement or election simulation.

**Recommended first-playtest targets: 12 coins per living, unescaped player and 25 personal coins for a Smuggler.** Retain the two-coin Worker cap. A full ten-round Worker produces at most 20; two starting coins bring pure-production wealth to at most 22. The personal target of 25 therefore requires another income source. Actual fresh-match mining starts in round two, so uninterrupted pure production is at most 18; deposits and depletion can reduce it further.

The reproducible run contains **90,000 trials across 42 scenarios**. The six main horizontal-exploration funding scenarios and six wallet-capacity scenarios each use 5,000 seeds. Target sensitivities and alternate direction policies each use 1,000. They are fixed-policy estimates, not human survival or secret-role win rates. The selected direction and collection policies deliberately do not optimize play.

**The model uses finite mines and actual individual wallets.** Everyone starts with two coins and has two prepared free actions per round. A Worker may mine twice; another career may mine once. Any miner reserves at most one mine, and a mine admits one miner per round. Each newly discovered mine contains eight coins total and activates next round. Two extractable coins per round is a throughput cap, not a replenishment rule. Empty mines stay exhausted.

The first discovery at three–four players, or first two at five–eight players, are guaranteed mines when Explorers devote their first-round slots to exploration. One Explorer has at most 20 free discoveries across ten rounds; two have at most 40. Traps and planned deposits reduce this. Mining does not tax its own one-coin output: up to two selected basic tools are included with the two free actions. Purchased extra actions/tools are excluded from these runs.

**Bounded discovery memory is a four-state Markov chain for each Explorer separately.** State 0–3 records the consecutive number of coin-mine or treasure outcomes, capped at three. Another valuable room increments it; a safe chamber, cache, gallery, or trap resets it to zero. The initial guaranteed mines increment it too. State persists between rounds; an Explorer who does not act does not change it. Only the following ordinary room draws use the probabilities below.

| Room category | Horizontal | Downward | Currency effect in this model |
|---|---:|---:|---|
| Coin mine | 22% | 40% | Eight mineable coins, never immediate wallet income |
| Treasure / communal vault | 33% | 15% | Finite pile from the roster-scaled range below |
| Bright safe chamber | 12% | 8% | No coins |
| Supply cache | 10% | 10% | No coins; item utility is not valued in this analysis |
| Trap | 2%, 3.5%, 5%, 6% by state | Same | Following-round Explorer physical actions lost |
| Gallery / other noncash room | 23% minus trap probability | 27% minus trap probability | No coins |

Gallery/cache visual subtypes can add room variety without adding an unaccounted currency source. No room can be farmed repeatedly. Treasure gives the discoverer one coin from the pile; the rest requires a separately prepared Loot action. The baseline uses chests, not corpse looting.

| Current luck state | Next 0 | Next 1 | Next 2 | Next 3 | Trap chance |
|---|---:|---:|---:|---:|---:|
| 0 | 45% | 55% | 0% | 0% | 2% |
| 1 | 45% | 0% | 55% | 0% | 3.5% |
| 2 | 45% | 0% | 0% | 55% | 5% |
| 3 | 45% | 0% | 0% | 55% | 6% |

Both direction tables give a 55% valuable-room probability. The stationary state probabilities are 45%, 24.75%, 13.6125%, and 16.6375%, giving an ordinary-draw long-run trap probability of **3.445125%**. This is not the exact rate in a short match with forced opening mines. The maximum remains six percent even after a long lucky streak. These bounds make risk measurable; only playtesting can establish whether exploration feels worthwhile.

**Roster scaling pays for the newer coin sinks without changing mining output.** Larger vault piles in the smaller rosters compensate for having only one Explorer and for Merchant upgrades costing up to 15 coins. A new second Explorer at six players is a substantial income change, so one universal pile range produced uneven results in exploratory pilots. Pile amounts are public rules fixed by the starting roster; they do not depend on hidden wallet sizes or secret identities.

| Players | Workers / Explorers | Treasure pile | Group target with everyone present |
|---:|---:|---:|---:|
| 3 | 1 / 1 | 5–7 | 36 |
| 4 | 1 / 1 | 7–9 | 48 |
| 5 | 2 / 1 | 7–9 | 60 |
| 6 | 2 / 2 | 3–5 | 72 |
| 7 | 2 / 2 | 4–6 | 84 |
| 8 | 2 / 2 | 4–6 | 96 |

**The cooperative benchmark has explicitly privileged information.** During planning it uses the sum of all wallets plus the fund to decide whether everyone should reserve a Deposit action. Players in the game do not receive that information automatically because wallets are private. This is an omniscient resource-feasibility benchmark, equivalent to perfectly accurate cooperative pledges, not a deployable agent policy.

When that planning-time total can already cover the target, everyone prepares one Deposit and uses their other free slot for work. Otherwise both slots prepare work. Round ten always reserves one Deposit. Deposits occur after that round’s modeled work and transfer only the owner’s wallet. The group fund is checked at every round end and a successful benchmark stops. It never treats an undeclared private wallet as money already deposited.

Explorers use their work slots for new discoveries. Workers first reserve active mines; other non-Explorers can reserve leftover mines for one extraction. Remaining non-Explorer work slots are prepared Crowbars. Prepared collectors reach new chests in that round, taking larger piles first in rotating seat order. This deliberately assumes ideal travel and no contested claims. No one uses more than two free slots. Traps stop physical work next round but still permit a reserved Deposit; a last-round trap stops remaining discoveries immediately.

A normal trap does not cancel the Explorer’s remaining current-round drill. The model does not locate or move trapped players, validate their return to a Safe Zone, or model shopping or stealing while trapped. Its only trap assumptions are lost physical work and a permitted prepared Deposit. Those narrower action assumptions do not establish that the corresponding spatial schedule is feasible.

**Sinks are paid from a particular wallet, not subtracted from an imaginary shared purse.** The first Explorer buys one two-coin lantern in round one. The Merchant attempts sequential machine unlocks costing three, five, and seven, no earlier than rounds two, four, and six, at most one per planning phase and only when their own wallet can afford it. Unaffordable tiers wait. All such payments burn coins. The lantern is purchased as a coin sink but not placed in this model; its placement action and lighting benefit are not simulated.

Retail sales are not assumed in a noncombat world with no injuries. A purchased Merchant stock item costing one coin and selling for two burns the wholesale coin and transfers the retail payment; it does not mint two coins. Free personal healing potions have no coin resale or cash value in this model. Optional extra tools, additional lanterns, weapon purchases, healing demand, trials, and their opportunity costs remain outside the benchmark.

| Players | Funding coverage at target 12 | Mean successful round | Mean fund across all trials |
|---:|---:|---:|---:|
| 3 | 72.46% | 8.98 | 38.13 |
| 4 | 79.68% | 8.72 | 52.89 |
| 5 | 74.18% | 8.99 | 64.33 |
| 6 | 88.14% | 9.39 | 79.01 |
| 7 | 90.00% | 9.19 | 93.32 |
| 8 | 79.30% | 9.51 | 102.94 |

**Target sensitivity uses the same specified policy.** The 12-coin column has 5,000 trials per size; the others have 1,000. Lower thresholds reduce scarcity; 14 makes full-group funding considerably harder before combat, theft, or extra purchases are even included. Twelve is a provisional compromise, not a validated optimum.

| Players | Target 10 | Target 11 | Target 12 | Target 14 |
|---:|---:|---:|---:|---:|
| 3 | 89.00% | 81.10% | 72.46% | 52.90% |
| 4 | 93.00% | 88.80% | 79.68% | 62.90% |
| 5 | 92.60% | 86.30% | 74.18% | 52.40% |
| 6 | 99.50% | 96.10% | 88.14% | 53.70% |
| 7 | 99.20% | 95.70% | 90.00% | 63.40% |
| 8 | 98.20% | 92.90% | 79.30% | 38.10% |

**Downward exploration trades treasure for mine availability.** These alternate direction cases each have 1,000 trials. The mixed policy chooses downward independently half the time; it is not an adaptive strategy responding to exhausted mines. Blindly digging downward can reveal more ore than the available actions can extract while reducing readily collectable vault coins. These results support situational downward exploration, not a blanket claim that it is always worse.

| Players | Horizontal only | Half downward | All downward |
|---:|---:|---:|---:|
| 3 | 72.46% | 49.60% | 19.30% |
| 4 | 79.68% | 63.20% | 30.70% |
| 5 | 74.18% | 63.70% | 38.50% |
| 6 | 88.14% | 63.20% | 20.80% |
| 7 | 90.00% | 73.30% | 30.20% |
| 8 | 79.30% | 61.90% | 20.60% |

**Private-wallet capacity is a separate no-deposit experiment.** These players gather for all ten rounds, buy the modeled lantern/upgrades, and never contribute or leave. Threshold attainment means a particular wallet reached the number at a round-end check. It is not a Smuggler win rate: identities, service demand, theft, attacks, politics, rival escapes, and the consequences of departing players are not simulated. Worker wallets can exceed the production bound only through their separately modeled chest looting.

| Players | Public role | Wallet reaches 25 | Reaches 28 | Reaches 30 |
|---:|---|---:|---:|---:|
| 3 | Worker | 19.74% | 1.98% | 0.68% |
| 3 | Merchant | 29.08% | 20.20% | 15.26% |
| 4 | Worker | 29.04% | 9.94% | 1.38% |
| 4 | Merchant | 33.08% | 23.98% | 19.22% |
| 5 | Worker | 3.46% | 0.80% | 0.46% |
| 5 | Merchant | 27.36% | 19.88% | 15.18% |
| 6 | Worker | 4.59% | 0.64% | 0.00% |
| 6 | Merchant | 6.64% | 1.46% | 0.54% |
| 7 | Worker | 12.30% | 3.04% | 0.40% |
| 7 | Merchant | 24.26% | 11.76% | 6.06% |
| 8 | Worker | 13.12% | 3.50% | 0.65% |
| 8 | Merchant | 8.22% | 2.84% | 1.06% |

Workers are averaged over their one or two seats; Merchants have one seat. Full per-role figures are in the JSON. Always-drilling Explorers never reach 25 under this policy; a selfish Explorer must change activities, such as preparing Loot or Steal instead of another drill. Thieves never steal in this experiment, Scavengers encounter no corpses, and Guards sell no services, so these figures must not be used to rank career strength. Increasing the private target to 28 or 30 is not supported as a necessary first adjustment; retain 25 until adversarial playtests exist.

| Players | Merchant completes all three unlocks in ten-round holding benchmark | Mean exhausted mines |
|---:|---:|---:|
| 3 | 96.78% | 0.87 |
| 4 | 95.12% | 1.53 |
| 5 | 94.66% | 3.38 |
| 6 | 99.76% | 1.59 |
| 7 | 99.44% | 2.55 |
| 8 | 98.28% | 3.41 |

The unlock percentages above establish affordability under this collection policy, not a promise that an ordinary Merchant can always unlock on schedule. Mines are genuinely exhausted; an initial eight-coin mine supports only four full two-coin Worker rounds. Finding further mines is therefore necessary to sustain production over ten rounds.

**The natural exit is kept separate from paid escape.** The current design saves every living survivor, including Smugglers, if this route is completed; that outcome is not simulated here. The proposed gate gives ten percent of map seeds a natural route requiring 14–16 linked correct horizontal discoveries at starting depth. Wrong branches can be backtracked but do not advance the route. Downward discovery never advances it, and upward excavation is unavailable. The seed gate places an analytic upper bound of ten percent on natural-exit occurrence before directional choices, traps, travel, and competition. These runs do not generate linked geometry or simulate that route, so they do not estimate actual natural-escape probability. The 20/40 free-discovery action caps alone do not prove a route will be reached.

**Accounting and scope checks.** Every trial asserts that fund + remaining wallets + uncollected chest coins + burned coins equals starting coins + mined coins + discovered treasure. It also checks nonnegative finite mine reserves and each player’s production cap. Markov rows sum to one, and the stated stationary distribution satisfies the transition matrix. Guaranteed first-round mine and discovery-cap checks cover each roster. These are analysis assertions, not tests of a production game engine.

Current proposed price arithmetic is separate from these runs: add S(r)=floor((r−1)/2) to club four, blade seven, gun ten, and trial six. Gun cost rises from ten in rounds one/two to fourteen in rounds nine/ten, while a death still removes twelve from the fare. The simple gun/fare difference changes from a two-coin saving to a two-coin deficit before actions, loot, shields, and lost labor. Stored weapons pay the surcharge difference when equipped at camp. Trials rise to ten, still below twelve but requiring a majority. No combat or voting strategy was simulated.

The proposed Merchant cap is two coins of combined trade profit per round, covering slot commissions and all retail margins. Pure trade therefore yields at most twenty over ten rounds, or twenty-two including starting coins; paying all three upgrades burns fifteen, leaving seven before field earnings, contributions, or other spending. Repaid wholesale inventory cost is recovered capital, not extra profit. Example slot prices one/two/three total six: Merchant receives two and machine burns four. These are accounting bounds, not an income forecast. Extra action demand, increased machine burns, stock margins, and other-role comparisons still require a new full-rules simulation or playtests.

**Limits that matter before implementation.** Room geometry, darkness, travel and safe-zone access; stored-item expiry; paid extra actions; recovery/disconnects; selective private information; non-Scavenger partial corpse looting; potions and damage; public voting; one-Smuggler-per-round departures; simultaneous ordinary/Smuggler success; and human behavior remain outside the model. Neither the previous 80-second schedule nor the confirmed 110-second schedule, manual return buffer, and meeting extensions are timing-validated by this action-level analysis. A generated starting map is not guaranteed solvable merely because the benchmark sometimes funds it.

**Reproduce the report.** Run `python3 work/balance_analysis_v04.py` from the project workspace. It writes `outputs/balance-analysis-v04.json` and this Markdown report. The script uses Python’s seeded `random.Random`; a seed alone does not reproduce the same stream in another language. Model data and explicit decks/action traces should become fixtures when actual rules are implemented.
