# Implementation readiness, remaining gaps, and task checklist

The user has adopted the [October 30 review](preimplementation-review-2026-10-30.md) recommendations with seven-slot inventory and ghost overrides. The [adopted decision record](design-update-2026-10-30.md) gives their exact rules and examples. The selected contracts are recorded below and in the [file specification](implementation-file-spec-v02.md); the [next functional asset batch](next-asset-batch-v02.md) includes character-specific mild haunts. This completes design decisions, not implementation or new artwork.

October 30 asset update: [38 original PNGs and handoff metadata](asset-pack-v01.md) are now delivered. This completes a static art pass only; it does not complete the animation, UI, geometry, gameplay or deployment tasks below.

The [master game design and implementation plan](../master-game-design.md) is the consolidated handoff, with the full proposed source tree and a phased summary of these tasks. This checklist remains the detailed delivery tracker; no implementation task became complete through documentation consolidation.

Updated October 30, 2026. All current design documents and workspace memory now use the selected first-playtest rules version `mine-escape-playtest-2026-10-30-interactions`. The user requested design and balance before game coding. No playable prototype, database, public host, or submission exists. [All documents](../README.md) · [Selected defaults and calculation report](defaults-calculation-v05.md).

## Resolved policy and calculation work

Confirmed: nickname + room code, no login/microphone; two free actions and every extra paid, maximum four; one full round to reconnect before permanent removal. A round means 110 advancing base-game seconds from detected loss, with meeting/recovery pauses excluded. During grace the avatar/obligation/Explorer career remain; at expiry revoke the seat, apply one corpse/fare transition, and queue an election only if no living unescaped Explorer remains. Rejoin exactly at expiry loses the race. Leave uses the same delay; forfeited players cannot return as ghosts or spectators. Prior escape wins remain.

Selected numerical defaults: shared fare **eleven per living unescaped non-forfeited player**, private fare 25, trade-profit cap two/round, Merchant upgrades 3/5/7, weapons 4/7/10 plus `floor((round−1)/2)`, trial six plus the surcharge, strict-majority camp ballots, 20-second succession/30-second trial. Existing item/HP/TTL/roster/Markov/catalog values are adopted as initial tuning, not waiting on separate approval.

Selected spatial contract: three tiles/second, adjacent interaction anchors within six actual walking tiles, 36-tile return allowance including three seconds reserved margin, and a new Safe Zone replacing the content draw at that distance from a known camp. Every map contains a few real scattered openings (initially three), reached by 14–16-link horizontal routes without free clues. Target unaided natural escapes below 1%, as an unmeasured tuning goal. A nine-coin single-use Explorer compass points approximately toward the nearest real opening; there are no decoys or map gate. No teleport, remote shopping, free extra actions, productive Safe Zones, or guaranteed survival was added.

Confirmed interaction defaults: seven fixed physical inventory slots including equipped items and personal potions; no purchasable capacity, stacks or carried overflow. Purchases never consume an action; item use and any-amount Deposit still do. Extra-action plus dependent-tool orders commit all-or-nothing at second 28 after pre-cutoff approval. Physical channels require stationarity and continuous validity; unblocked HP damage interrupts, fully shielded hits do not. First accepted Loot start reserves its source, with rotating-seat ties and no faster later overtaking. Shared body/head/outfit components preserve identity on career conversion.

Ghosts see all player avatars in the discovered world, without private state or future rooms. Each ghost may haunt only its murderer once per base round, at any active phase including meetings, using a mild private 450 ms effect with no gameplay or control impact. Escaped spectators keep a bounded local camera. The server uses 20 Hz integer clocks and authenticates the current controller before receipt lookup; an existing committed receipt is recovered before evaluating execution staleness.

## Evidence and its limits

The historical study ran **264,000 resource-policy cases**, **180,000 route cases**, and **180,000 camp-gap cases**. The resource model checked conservation, wallet/production/slot bounds and trade limits. With its former next-round mine activation, forward-camp approximation, upgrades and moderate purchase policy, cooperative funding coverage at fare eleven is **69.3–88.0%** across starting rosters; fare twelve yields **57.0–75.0%**. These are ideal-travel, privileged-coordination resource estimates, not human/faction win rates. A missing Explorer materially worsens several scenarios. The complete economy—including Guard services, strategic theft, private escapes, actual combat/healing, physical access and voting—is not simulated.

The previous 19.2% conditional / 1.9% overall route result is withdrawn for the corrected design: it assumed free clues and recognizable two-room wrong branches. Its 180,000 cases are historical only. Camp-distance/camp-gap findings retain their stated scope. Resource estimates exclude immediate mine activation and the nine-coin compass/Survey opportunity costs. Current luck-only and compass-assisted escape rates need a new graph/policy study; no revised rate is claimed.

## Remaining gaps before release

No additional major game system is needed to begin an authorized movement prototype. The [October 29 update](design-update-2026-10-29.md) retracts the earlier paid-Guard timeout concern: explicit current-round authorization plus 110-second grace makes that same-round gap unreachable. Reject stale/future offers and preserve accepted delivery on a brief disconnect. The remaining areas below principally need validation.

| Area | Contract now selected | Evidence still needed |
|---|---|---|
| Movement, camps and checkout | 110-second phases; manual return; 36-tile camp spacing; camp-only preview/commit; two free/four max. | Actual collision/path/ladder geometry, four nearby mixed actions and return on phones, and checkout within the 18 seconds before the purchase cutoff, inside the 20-second choices period, including late arrivals. |
| Role loss and voting | Strict majority of frozen living electorate; voluntary permanent conversion; one-round timeout. | Camp reachability, failed elections, last Merchant/Worker conversion, two-survivor votes and continuing resource balance after one of two Explorers is lost. |
| Full economy/faction balance | Fare 11/private 25, capped trade, escalating weapons, separate Loot/Deposit, fixed seven physical slots and no-action purchases. | Rules-engine scenarios with real strategic theft, Guard/shields/potions, merchant demand, simultaneous escapes, wounded-target kills, hoarding and each Smuggler cover. |
| Natural route | Three real scattered openings on every map; sub-1% unaided target unmeasured; optional nine-coin single-use nearest-opening compass; all-survivor reward. | Generated-map reachability, compass comprehension and unaided exploration, both Explorers, traps and actual escape frequency. |
| Anonymous recovery/privacy | Automatic browser credential, no login/mic; 110-base-second deadline, permanent revocation, durable money. | Packet filtering, forged/stale/replayed commands, exact boundary races, crash recovery, cookie/storage behavior and no new midmatch seat. |
| Complete delivery | Future source-file specification and staged tasks below. | Build, art/assets, real-device and adversarial playtests, public host, operating/recovery checks and authorized submission. |

Accepted limits are explicit: nickname-only play cannot prove unique human identity or block outside communication; players may infer theft from balances/co-presence; unanimous lobby edits and majority votes can stall; voluntary sacrifice and attacks can sometimes help a coalition. Rules can constrain these behaviors, but they cannot be declared impossible without changing the requested game. The first release is for trusted invited groups.

## Full implementation tasks

Every unchecked task below remains outstanding. Completion means the acceptance evidence is recorded, not merely that a file exists. The [file specification](implementation-file-spec-v02.md) maps each workstream to source files. Checked items below are design/calculation work only; unchecked implementation and release items remain outstanding.

### 0. Freeze a reviewable baseline

- [x] Adopted the review’s action-interruption, accepted-start Loot reservation, atomic extra-slot/tool checkout and shared character identity contracts; recorded the user’s seven-slot/no-action-purchase/global-ghost/once-round-haunt overrides.
- [x] Documented current membership/controller authentication before receipt replay, canonical business-argument hashing excluding transport epoch/generation, committed-receipt precedence and 20 Hz integer logical-tick/deadline semantics in the file specification.
- [x] Confirmed 110-second rounds and permanent Explorer conversion; recorded both answers in project memory and reconciled the linked rules.
- [x] Selected surcharge, commission, quorum, fare eleven and camp-distance defaults; later no-free-clue/paid-compass and seven-slot inventory corrections supersede their historical predecessors. Current rules version is recorded; old calculations are not rerun balance evidence.
- [x] Defined intentional Leave/110-base-second grace/permanent forfeit, exactly-once corpse and fare reduction, last-Explorer election, guest retention and cleanup. Deliberate sacrifice remains possible after the delay.
- [x] Selected rule/catalog version, allowed lobby settings, item catalog/TTLs and public/private view contracts in the design handoff.
- [ ] Encode those contracts and worked outcomes as versioned fixtures during implementation.
- [x] Set initial responsive targets: 360×640 CSS-pixel phone through desktop; keyboard plus touch, portrait/landscape.
- [ ] Verify current Safari/iOS, Chrome/Android and desktop Chrome/Safari/Firefox in the prototype; do not claim support before testing.
- [ ] Select current compatible dependency versions and confirm hosting/account/budget constraints before provisioning.

Acceptance: one internally consistent rules version with worked examples for late camp arrival, replacement election, capped Merchant sales, stored-weapon top-up, theft, trial, partial loot, paid escape, and the all-survivor natural exit.

### 1. Prove movement and time budget

- [ ] Build a disposable gray-box 2D map with camps at different distances, two potential mines, a chest, darkness, a lantern, branching rooms, and a downward/return ladder.
- [ ] Implement keyboard and touch movement, facing, collision, nearby target selection, and room/depth transitions.
- [ ] Measure two explorations in round one and three/four mixed actions followed by a manual return within the selected schedule.
- [ ] Validate the return buffer against growing depth and branching distance, including an interrupted channel, a slow phone, and network latency.
- [ ] Enforce the field cutoff at 90 seconds: unfinished physical channels, including Loot, cannot continue into return or settlement. Those windows permit only walking and a prepared Deposit; a trap permits the designated return walk without teleporting its finder.
- [ ] Test a late return during choices, after the purchase cutoff, and after choices close; preserve position and enforce camp-only commitments without teleporting anyone.
- [ ] Test the 20-second choices interface and its 18-second purchase window with advance catalog preview, clear deadlines, and no remote purchase or loadout commit.
- [ ] Test cone/occlusion on small phones, reduced motion, and non-color-only player markers.

Acceptance: observed usable controls and enough time for the intended actions and return walk. Neither the confirmed 110 seconds nor the former 80 seconds counts as verified merely because it is written down. This is future prototype work, not a completed timing test.

### 2. Implement and verify the authoritative rules

- [ ] Set up monorepo, shared catalog/protocol, pure state transitions, deterministic randomness, and event types.
- [ ] Add lobby revision/unanimity, legal careers, secret covers, two coins/three HP, and rematch initialization.
- [ ] Add the selected phases/grace/return buffers, camp-only planning, slot preparation, machine subsidy, paid equipment, free Deposit/Trial preparation markers even in purchased slots, expiry, camp-held current-round first-slot fallback and full-capacity personal-potion entitlement with original issue/arrival TTL, no eighth item or new post-close loadout, lost missed slots, and fixed seven-slot capacity including equipped items/personal potions. Capacity fixtures include full7 minus a tool consumed at start before adding a cache reward; Merchant self-withdrawal never charges wholesale twice. Reject discard/reassignment of a paid Guard service kit/action before delivery. All purchases, upgrades, manufacture and top-ups cost no action; actual item/service execution and Deposit retain their action costs.
- [ ] Add Explorer-loss detection, volunteer acceptance, camp-eligible nominations/ballots, quorum/cutoff/retry rules, and the approved replacement-career transition. Pause for the 20-second succession meeting after arrival, then give the full normal choice period. Preserve identity, wallet, items, and map progress without silently retaining forbidden old-career abilities; do not replace a temporarily disconnected/trapped Explorer; do queue succession when timeout removes the last one.
- [ ] Implement connected map/Markov discovery, bootstrap mines, depletion, treasure/caches, traps, Safe Zones, rare route, and paid Compass/Survey, without free natural-route hints.
- [ ] Implement immediate mine activation including round 1, prepared field-target selection, discovery-relative no-show deadlines, late90 cutoff, saved pickaxes/TTL with no saved actions, mining reservations/caps and carry-forward opening guarantees; separate chest/corpse/cache-item looting with capacity/expiry checks; three-second healing/rescue/lantern channels and explicit trapped self-rescue.
- [ ] Implement stationary channel checks every tick, damage/shield distinctions, cancellation/meeting-resume behavior and consumed-on-accepted-start semantics. Deposit stays an independent instant action.
- [ ] Implement Loot source reservations on first accepted start, rotating same-tick priority, loss-of-validity release, no later Scavenger overtaking, single global ordinary half claim, and separate mine reservation rules.
- [ ] Implement silent theft batch and coin-conserving concurrent transfers, retaining disconnected co-located avatars and accepted intentions without granting immunity.
- [x] Corrected the alleged same-round Guard-timeout gap by checking current-round authorization against the110-second grace.
- [ ] Enforce current-round Guard offers/kit/action binding, reject stale/future draft activation, and test ordinary disconnect with once-only second 30 delivery.
- [ ] Implement escalating extra-action quotes, the combined two-coin Merchant trade-profit allowance, wholesale reimbursement, excess-fee burns, self-purchases, upgrades/stock/potions, Guard offers/delivery, and camp-eligible numeric proposals. Implement atomic extra-slot/tool checkout at tick 560 for orders approved before it, accepted total/slot quote caps including unpaid weapon top-ups, seven-slot delivery checks and no counter/charge on failure.
- [ ] Implement combat/shields/persistent HP, the round surcharge, per-weapon paid-surcharge credit, camp top-ups, mutual kills, one corpse, global discovered-world ghost avatar visibility only for ghosts (no roaming ghosts in living/escaped projections), one murderer-only private haunt per base round in any active phase, committed live delivery consuming budget even if acknowledgment is lost, no offline burst, simultaneous ghosts combined into one 450 ms appearance strip, visible-target authorization, and round-priced execution trials with post-tick rotating-priority arbitration.
- [ ] Implement per-round contributions/outcomes, one paid private departure, simultaneous paid wins, paid group terminal win, and a priority natural-route win for every living unescaped player including all Smugglers. Cover prior escapees, all-dead/deadline cases, and recap privacy.
- [ ] Run focused rule tests and accounting/generation properties for every money and item transition.

Acceptance: deterministic tests pass for all named invariants; no client code is required to enforce a rule.

### 3. Add real multiplayer and recovery

- [ ] Create nickname-only anonymous sessions with no login/microphone, room-code lookup, secure join tickets, seat-controller generations, and command idempotency. No new seats after start or name-only seat recovery.
- [ ] Implement heartbeat detection, 110-base-second disconnect grace, strict deadline ordering, permanent seat revocation/one corpse/no ghost, prior-win preservation, last-Explorer trigger, voluntary Leave, and timed cleanup. Test assigned rejoin ticks just before/at/after the detection+2200 deadline (including upward-rounded 109.999 seconds rejected at equality), meetings/outages, all-offline matches and exact escape boundaries.
- [ ] Integrate one serialized Colyseus controller per match with authoritative movement and 20 Hz integer logical ticks. Test exact 28/30/90/110 boundaries, upward server-time quantization, overdue callbacks, no late backdating and separate meeting/recovery clocks.
- [ ] Build recipient projections for global/owner/local/ghost/spectator/final views.
- [ ] Add PostgreSQL schema, atomic commits, checkpoints/events, migration tooling, and recovery.
- [ ] Add runtime ownership/fencing and separate platform/gameplay readiness.
- [ ] Exercise duplicate/reordered inputs, slow clients, connection loss, process restart, storage failure, and deployment overlap. Include commit-before-ack → restart → authorized new controller → same command receipt, no reexecution; reject stale-controller reads and changed business hashes.
- [ ] Persist/restore physical position, camp eligibility, pending fallback claims, election membership/votes, public career changes, weapon surcharge credit, and remaining Merchant profit allowance, active Loot claims/global corpse-half flag, inventory/equip references, atomic cart orders/caps and per-ghost round usage/receipts without replaying charges, grants or haunts.
- [ ] Verify no public packet/log/debug path contains private wallets, secret identities, future rooms, or unseen action effects. Public career changes remain visible by design.

Acceptance: independent clients remain synchronized; refresh/restart preserves acknowledged resources and roles exactly once.

### 4. Build complete player UI and production assets

- [x] Adopted shared body/head/outfit components preserving face, hair, skin and P marker through Explorer conversion.
- [ ] Produce and validate one same-identity Worker/Explorer eight-direction animation pilot before expanding the full cast; the existing static PNGs do not complete this task.
- [ ] Create one layered room/door kit, paired ladder and revealed-opening features, separate stateful props and readable seat/action indicators; validate collider/port clearance and export scale before expanding art.
- [x] Create eight static career appearances, eighteen item/service icons and twelve themed/state room plates, preserving exact prompts and adding metadata/gallery/import notes.
- [ ] Implement join/lobby/settings/Ready, private identity, rules onboarding, timers, map, and roster.
- [ ] Implement read-only off-camp preview and camp-only planning/loadout/expiry, private machine, exact weapon top-up quotes, Merchant fee splits/profit allowance, protection offers, camp-only theft targeting, proposals, and contributions.
- [ ] Show a clear return deadline, camp destination/location information, partial time remaining for late arrivals, and the exact first-slot fallback waiting at a terminal. Do not imply a remote choice has committed.
- [ ] Implement visible-target actions, health/healing, distinct free succession and paid execution ballots, ghost/escaped views, final results, and rematch. Make the return/settlement restriction explicit: collect corpse/chest money before field ends, then use a remaining Deposit action during the return walk if desired.
- [ ] Update the elected player's public Explorer badge/outfit and ability descriptions for the confirmed permanent conversion, while preserving their fixed player marker, cosmetics, and hidden identity.
- [ ] Produce licensed/provenanced sprites from the career reference: walk/idle/action/death/ghost, eight character-appearance mild-haunt variants, props, room tiles, UI icons, and audio. Haunts use a 450 ms private edge pop, no flashes, no blocked controls/vision, optional quiet sound and a reduced-motion substitute preserving the same identity.
- [ ] Validate identical Smuggler-cover rendering before and after election, empty-handed idle privacy, no theft animation, clear camp/dark/depleted-room signals, and natural-exit results that include every surviving Smuggler.
- [ ] Complete mobile/keyboard/focus/contrast/reduced-motion/error/recovery behavior; show seven fixed physical slots independently from two-to-four action slots, exact combined purchase totals and once-round haunt availability.

Acceptance: a new player can understand and play through the UI without a host explaining the rules.

### 5. Validate balance and adversarial play

- [ ] Retain the earlier 90,000-trial experiment as a labeled resource reference; port deterministic traces where applicable without claiming it validates manual return or the new trade economy.
- [ ] Add full-rule scenarios for manual camp access, late fallback, succession failures and career changes, reduced working time, and lost access to a former Merchant/Guard/Worker ability under the approved conversion rule.
- [ ] Model escalating combat/trial prices, stored top-ups, shields, trial coalitions, thief/scavenger strategies, hoarding, Merchant demand, capped commissions, excess-fee burns, and each public Smuggler cover.
- [ ] Compare the revised amount of circulating money against the group fare after purchases and fee burns; the trade-profit cap must not be mistaken for a free transfer to the fund.
- [ ] Extend the completed abstract route/camp calculations to actual unmarked 2D branching geometry with three scattered openings per map, blind search, expensive single-use nearest-opening compass bearings with no decoys, traps, purchased actions, both Explorers and successors. Retire the old free-clue route results. Measure all-survivor natural wins separately from paid escape.
- [ ] Playtest all six roster sizes, zero/one/two permitted Smuggler cases, both four-player specialist alternatives, and additional seven-player specialist sets.
- [ ] Test seven-slot pressure, Merchant personal-potion storage, late/full-inventory fallback, atomic cart failure clarity and global ghost observation in trusted groups; no new win-rate claim follows from these design decisions.
- [ ] Measure survival/funding/private/natural-escape rates separately, time to complete four actions and return, election quorum, early role loss, late killing, camp hoarding, missed choices, Merchant net profit/field income, and player comprehension.
- [ ] Tune prices/weights/controls from findings and update all linked documents and versioned fixtures.

Acceptance: no known dominant exploit or unavoidable UI failure; observed results justify tuning. Resource coverage alone is insufficient.

### 6. Deploy and operate a reachable game

- [ ] Provision the agreed always-available Node/WebSocket host and durable database; configure secrets and TLS.
- [ ] Deploy versioned assets/server, migration plan, readiness probes, logs/metrics, capacity limits, and retention/cleanup.
- [ ] Test backup/restore, restart recovery, graceful shutdown/rollout, and rollback.
- [ ] Open the public HTTPS link from a phone on mobile data and a separate laptop/network; join by code and finish matches.
- [ ] Exercise paid group escape, private departure followed by continuation, same-check paid group/private victory, natural escape with two surviving Smugglers and no private charge, failed deadline, and rematch.
- [ ] Exercise Explorer succession/public career change, manual return and late fallback, stored-weapon top-up, and simultaneous Merchant sales at the profit-cap boundary on separate devices.
- [ ] Run final privacy, load, responsiveness, and accessibility acceptance checks on the deployed build.

Acceptance: public link actually works for other people, state stays in sync, rules are available in game, and anonymous join requires no install.

### 7. Prepare the challenge deliverable

- [ ] Verify the official campaign page, applicable deadline/year/timezone, eligibility, and required submission fields using the actual rules link.
- [ ] Prepare a short game description, public URL, joining instructions, screenshots/demo, and any requested source/documentation.
- [ ] Submit only through the authorized official flow and record the confirmation if submission is requested.

No official rules link was supplied in the pasted brief, and no entry has been submitted. The pasted October 31 date alone is not verification of the current campaign's full requirements.

## Design work and evidence already available

- [x] Recorded manual camp return, camp-only planning, replacement elections, escalating late costs, and all-survivor natural escape as the latest design directions.
- [x] Established finite mines, per-Explorer Markov exploration, room variants, rare-route structure, and visibility defaults for further validation.
- [x] Completed the earlier 90,000-trial resource study and explicitly limited its relevance to the newest revision; the separate October 28 studies add simplified commission/resource and route/camp evidence, not real movement/combat validation.
- [x] Prepared future code-file responsibilities, network privacy, persistence requirements, and character concept guidance as design artifacts.
- [x] Updated this gap report and full implementation-to-deployment checklist without creating game code.
- [x] Resolved both preference questions and reconciled the documents and workspace memory: 110-second rounds; permanent Explorer conversion.

“Project memory” is a Markdown record inside this workspace. It does not claim to update an account-wide ChatGPT memory service.

Latest completed design evidence: [October 28 calculations](defaults-calculation-v05.md) and [current audit](design-audit-2026-10-28.md). Current 360×640 layout/browser targets, no-microphone onboarding and retention rules are specified; no physical-device/browser acceptance is claimed.

Latest user correction and implementation additions: [natural exit and Merchant compass](compass-and-natural-exit.md). The existing funding percentages are pre-compass baselines; validate the extra coin/Survey cost before claiming current balance.

Latest accepted direction and calculations: [October 29 update](design-update-2026-10-29.md). Mines can be worked in round one as soon as discovered. Opening-round idle time is no longer mandated by delayed activation; field travel/late discoveries still need testing. The Guard question is explained and the earlier blocker retracted.
