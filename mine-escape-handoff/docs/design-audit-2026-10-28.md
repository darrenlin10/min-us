# Design update and consistency audit — October 28

Current-rule pointer, October30: [adopted interaction/inventory/ghost/server contracts](design-update-2026-10-30.md). The dated calculations and findings below retain their original assumptions; they are not new runtime evidence for this revision.

> Historical evidence. The [October29 design](design-update-2026-10-29.md) now uses real scattered openings on every map, a nine-coin single-use nearest-opening compass and immediate mine activation. Old rates/policies below are not current predictions; the alleged same-round Guard-timeout gap is retracted.

Current rules version: `mine-escape-playtest-2026-10-28-compass`. [All documents](../README.md) · [Calculations and gap report](defaults-calculation-v05.md) · [Implementation tasks](implementation-readiness-v04.md).

## Changes synchronized

- Exactly two free actions, each extra slot paid, four maximum. No script policy limit is a new gameplay cap. Deposit preparation is a free round-bound marker even in a purchased slot, preserving the no-contribution-fee rule; slot purchase still costs coins. The model never buys a paid Deposit tool, so this clarification does not change its calculations.
- Nickname and room code only; no account or microphone. Automatic private browser credential, fixed player IDs, no name-only seat recovery, no new seats after start.
- One round of reconnect grace defined as 110 advancing base-game seconds from detected loss. Five-second heartbeat/ten-second detection, meeting/recovery pauses excluded, strict-before rejoin and expiry-first boundary ordering.
- Permanent forfeit: revoke access, living wallet into one ordinary corpse, destroy items/cancel work, retain deposits, lower fare, no killer/controlled ghost. Dead/previously escaped cases do not duplicate effects. Explicit Leave uses the delay; final results/new rematch remain available separately.
- Last-Explorer timeout queues the normal willing-candidate election; another living Explorer prevents replacement. Frozen strict-majority electorates and failed-vote retry are explicit.
- Group fare eleven replaces proposed twelve. Private25, Merchant cap2/upgrades3/5/7 and round-based weapon/trial surcharge retained as selected defaults. Prices are no longer waiting on individual approval.
- Three tiles/second, six-tile adjacent anchors, 36-tile forward-camp constraint replacing the content draw; actual walking paths/footprints/ladder time must validate it. Ordinary Markov stationary probabilities do not include forced camps.
- Natural route retains the 10% gate/14–16 links, with no free clues. User correction removes environmental guidance and guaranteed failed branches. Merchant tier-1 compass gives an Explorer a paid approximate bearing; old route estimates are historical.
- Future files/tests cover anonymous entry, heartbeat, disconnect base time, tombstones, expiry/outcome races, one corpse, no stale controller, forced camps and absence of free route cues and paid compass sectors.
- Inventory/catalog defaults adopted; private match-data retention and initial responsive/browser validation targets recorded. Art remains concept art and original generation prompt is preserved.

## Evidence completed

The resource experiment ran 264,000 cases across 264 configurations. All included wallet/ledger/reserve/action/profit assertions completed without failure. The spatial experiment ran 180,000 route cases and 180,000 camp-gap cases. The calculation report distinguishes analytic bounds, policy-dependent resource coverage and route-present conditional completion. No player win rate, complete economy simulation, real-phone timing, network correctness or public hosting has been demonstrated.

The older 90,000-case resource report and October 27 audit remain historical snapshots with prominent current pointers. Earlier Markdown versions redirect to current documents. Original pre-update text is preserved under `work/history-2026-10-28-before-defaults/` in the package. Rule-document filenames remain stable for existing links.

## Remaining gaps

No new major user design answer is needed before an authorized prototype. Remaining work is real geometry and phone checkout/return timing; full faction/role-loss economics and human playtests; server privacy, authorization, replay/reconnect/restart behavior; complete UI/assets; deployment and independent-device acceptance. See the full checklist for source-to-release tasks.

Known design limits remain visible: invited guests are not verified unique humans; external negotiation cannot be prevented; ballots can fail; loss of one of two Explorers can severely reduce income; voluntary sacrifice can help a coalition; late killing can still pay through wounded targets or loot. These are not claimed solved by arithmetic.

## Package verification

Current Markdown links, rule references, art-prompt preservation and ZIP/source equality are checked when rebuilding the package. The final verification record is [artifact validation](artifact-validation-2026-10-28.json). That check verifies documents/artifacts, not gameplay.

## Subsequent user correction — no free natural-exit clues

The latest user instruction supersedes the free 70% clue and fixed two-room failed-branch rules. [Compass contract](compass-and-natural-exit.md): unaided exploration is pure luck; only a Merchant compass provides a coarse bearing. Canonical rules, player help, map model, item catalog, source-file specification, task list, memory and analysis reporting now follow this correction. The old 19.2%/1.9% route results are withdrawn; compass costs are excluded from the prior economy runs. Also corrected a leftover combat example to the selected eleven-coin fare (early gun saves one, late gun costs three extra).

## Follow-up gap audit

[Latest report](pre-implementation-gaps.md): Guard payment before28 versus delivery30 leaves an undefined outcome if the Guard permanently forfeits in between. The report recommends an irrevocable paid-delivery obligation but does not adopt it. This refines the prior completeness statement: the broad design is ready for a movement prototype, but this transaction rule must be closed before coding protection. Compass value/actual exit frequency, role-loss economics, opening-round pacing, phone timing and multiplayer/privacy/recovery remain validation work.
