# Document consistency audit and remaining gaps

Current-rule pointer, October30: [adopted interaction/inventory/ghost/server contracts](design-update-2026-10-30.md). The dated calculations and findings below retain their original assumptions; they are not new runtime evidence for this revision.

> Historical evidence. The [October29 design](design-update-2026-10-29.md) now uses real scattered openings on every map, a nine-coin single-use nearest-opening compass and immediate mine activation. Old rates/policies below are not current predictions; the alleged same-round Guard-timeout gap is retracted.

> Historical October 27 evidence, retained unchanged below. The current rules and resolved defaults are in the [October 28 calculation report](defaults-calculation-v05.md) and [current audit](design-audit-2026-10-28.md). Earlier unresolved policies and fare twelve are superseded.

October 27, 2026. This reviews the current [design](game-design-v04.md), [player rules](player-rules-v04.md), [exploration model](exploration-model-v04.md), [file specification](implementation-file-spec-v02.md), appearance guidance, project memory, and [implementation checklist](implementation-readiness-v04.md). It is a document audit, not a playable-game test.

## Update status

All latest confirmed choices are represented in the current documents: 110-second rounds; manual return to discovered camps; camp-only planning; permanent conversion of an elected replacement Explorer; private wallets; silent same-room theft; natural escape saving all survivors including Smugglers; and unanimous lobby start at three to eight players. Existing artwork is still concept art. The exact original art prompt and historical texts are intentionally preserved, not rewritten as if they had always described the latest rules.

Both recent preference questions are resolved. Exact election procedure, numerical prices/commission caps, item parameters, and map probabilities remain clearly labeled proposed defaults. Confirmation of timing and conversion does not approve every tuning value or prove playability.

## Corrections made in this audit

| Finding | Clarification now written into the rules/spec |
|---|---|
| General trap restrictions accidentally blocked promised self-rescue. | A prepared three-second self-Rescue is an explicit exception. Other physical actions remain blocked until it completes. |
| Healing, rescue, and lantern effects lacked precise completion timing. | Each uses a three-second field channel. Effects apply on completion, after the same tick's attack batch; lethal damage prevents an unfinished potion from reviving its user. |
| The combat file contract mentioned walls/range but omitted the current vision cone and light limit. | Physical targets must be in the server-computed visible set; forged hidden target IDs return a generic unavailable-target response. Remote Deposit and the camp theft list retain their specific exceptions. |
| Simultaneous trial requests and the start of a pause were ambiguous. | Finish the field tick, revalidate, select one valid caller by rotating priority, charge only that caller, then pause. Competing or cutoff-invalid requests cost nothing. |
| Opening-mine guarantees did not say what happens after an interrupted/missed first round. | Unused guarantees carry forward until completed, including by a successor; no reroll or replenishment. This matches the analysis model's global counter, but does not turn it into an election simulation. |
| One Markov sentence incorrectly suggested every discovery must change the state. | Every completed discovery applies the matrix; zero/three can remain unchanged. Canceled/invalid attempts do not update it. |
| Cache items left on the ground were missing from Loot's implementation contract. | One prepared Loot claims one item, with capacity checks, original expiry, one claimant, no automatic equip or extra action, and no coin conversion. |
| “Absent players” could imply disconnect-based theft immunity. | A co-located disconnected avatar remains a target, and an already accepted theft intention persists. A disconnected client cannot submit new decisions. |
| Saying no rooms could be opened from camp contradicted starting exploration. | Camps produce no passive income, but an Explorer can drill a camp boundary during field time. Useful camp support work is distinguished from idle camping. |
| The short rulebook omitted natural-exit contribution ranking. | All surviving natural-exit winners, including Smugglers, share the contribution ranking; paid private winners remain separate. |

These are specification repairs and explicit implementation defaults. They do not claim any gameplay code, runtime security test, or new simulation was completed.

## What still needs resolution or validation

| Remaining area | Why it matters | Current status / next step |
|---|---|---|
| **Camp spacing and action timing** | Fifty field seconds plus a 15-second return window may not fit four actions on a deep route without nearby camps. Twenty-second shopping also needs a usable interface. | Round duration is confirmed. Maximum room dimensions, useful camp spacing, travel-speed tuning, and measurable checkout/return acceptance limits still need a prototype. No teleport fallback is permitted. |
| **Permanent disconnect or voluntary departure** | Brief disconnects retain the avatar, obligations, and career. If the only Explorer never returns, that rule can stop discovery despite the replacement system. | Final abandonment/forfeit policy and retention/cleanup durations are not settled. Do not silently kill/remove a player, lower the fare, or create another Explorer on a transient connection loss. |
| **Election and trial procedures** | A strict majority can fail; players in distant rooms may miss ballots. Converting the only Merchant removes future trading services. | The written default is willing nominees, all-living electorate, strict majority, retry next round, and no automatic replacement. The free 20-second succession meeting and paid trial details remain proposed. Review these consequences and test small rosters. Permanent career conversion itself is settled. |
| **The complete economy** | Extra-action fees now burn more coins; Merchant profit is capped; healing, deaths, votes, hoarding, and role changes redistribute resources. | The 12-coin group fare, weapon surcharge, two-coin trade-profit cap, and other tuning values need adoption as a first-playtest baseline and testing in the actual rules engine. Old resource coverage is insufficient. |
| **Natural-route attainability** | A 10% map gate, 14–16 linked discoveries, clues, wrong turns, traps, and walks back compound into an unknown success rate. | Its reward is settled: all survivors win. Actual frequency must be measured with generated geometry and player/policy behavior; 10% is only an upper bound on route existence. |
| **Multiplayer/privacy/recovery behavior** | Private wallets, silent theft, vision-filtered targets, exactly-once purchases, and reconnects must hold in packets and persistence, not only the UI. | These are specified implementation and acceptance tasks. They have not been tested because no game exists yet. |

There is no unanswered major preference from the latest two questions. There are still proposed defaults to adopt, one important abandonment policy to settle, and substantial prototype/balance/technical validation. Adding more features is not required to investigate those gaps.

## Evidence boundary

The existing 90,000 trials remain an earlier resource baseline with ideal travel and privileged knowledge of total wallets. They do not validate manual camp travel, the new shop economy, elections, combat, linked route generation, or real players. This audit checked document consistency and local links, and the downloadable package was rebuilt; it did not rerun the simulations or implement the game.
