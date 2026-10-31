# Remaining design and validation gaps — October 30, 2026

The [October 30 review](preimplementation-review-2026-10-30.md) is now resolved at the design level by the [adopted decisions](design-update-2026-10-30.md): stationary interruption, first-start Loot claims, seven-item inventory, action-free purchases with atomic slot/tool checkout, global ghost avatar visibility and once-per-round mild haunts, shared character identity, receipt precedence and integer tick deadlines. The [next asset brief](next-asset-batch-v02.md) adds eight mild character haunts and functional room/animation needs. Existing38PNGs are unchanged; production art and runtime verification remain unfinished.

October 30 art progress: [38 static PNGs](asset-pack-v01.md) now cover careers, items/services and room themes/states. Remaining art work includes directional animation, layered walls/props/door/exit overlays, exact alignment and engine/mobile integration. Proposed room anchors do not resolve the geometry/visibility validation gaps below.

The [master game design and implementation plan](../master-game-design.md) now consolidates the current rules, structured code layout and phased tasks. This gap audit remains its focused validation companion; consolidation did not change tuning or establish new gameplay evidence.

Updated October 30, 2026. [Design update](design-update-2026-10-29.md) · [Full checklist](implementation-readiness-v04.md). This is an audit of the specification, not gameplay tests.

## Corrected Guard concern

The prior report called payment before 28 versus delivery 30 a missing rule if the Guard permanently disconnected in between. With current-round Guard authorization and 110 seconds of reconnect grace, that timeout cannot occur before same-round delivery. That blocker is retracted. Enforce current-round offers/kit/action binding and reject stale or automatically activated future drafts. A normal disconnect already preserves accepted delivery; installed protection survives later Guard death. No new refund exception has been adopted.

## Current validation gaps

| Area | Current rule | Evidence still needed |
|---|---|---|
| Natural-opening rarity | A few real openings on every map; initially three in distinct horizontal branches,14–16 links from start, no free clues. Target below 1% unaided natural escapes. | Validate graph geometry/search and measured rates; the target is not a probability switch or a demonstrated outcome. Multiple openings can raise encounter probability. |
| Compass value | Nine retail/eight wholesale, one action/one use, approximate nearest-opening bearing; no decoys. | Test whether expensive direction information is useful on winding maps and how target changes affect understanding. Include money burn and lost drill time in balance. |
| Immediate mining | A mine activates on completed discovery; prepared pickaxes can be used immediately in round 1. Worker cap2, reserve8, no free actions, new-mine reservation deadline d+15 capped90. | Test target races, early/late discovery, no-show expiry, cutoff consumption, Worker access and earlier reserve depletion. Old funding percentages are not current. |
| Saved tools and pacing | Fixed seven total items including equipment/personal potions; purchases use no actions; unused pickaxes retain two-round lifetime, actions do not carry over. | Validate old-item-first UI, storage/expiry, camp-only preparation and realistic time to reach a new mine. Workers no longer have a forced first-round production delay. |
| Career loss and social balance | Replacement only at zero Explorers; lost Merchant services stay lost; majority votes may fail. | Test resource recovery, optional roles, theft/combat/compass demand, hoarding and each Smuggler cover. These are defined consequences, not missing mechanics. |
| Interaction and observation | Stationary/damage interruption, first-start Loot claims, global ghost avatars and private once-per-round mild haunts. | Validate interrupted commitments, races, hidden-state filtering, retry behavior and accessible effect comfort. |
| Multiplayer and devices | Anonymous guest seats, private state, authoritative timers/resources and 110-second reconnect grace. | Build and test packet privacy, synchronization, replay/cutoff races, refresh/restart, phone checkout/movement/return and public reachability. |

The user’s scattered-opening distribution question is answered: openings exist on every map and must be very hard to find unaided. That October 29 preference is settled; the October30 review above records adopted contracts and the evidence still required after implementation. Price9, opening count3 and the sub-1% unaided target are selected draft tuning, not claims that the user supplied those exact values or that playtests validated them.

No new game system is required before an authorized prototype. Continue with geometry/timing, rules, full balance scenarios, actual multiplayer and deployment in the checklist. No application implementation has begun.
