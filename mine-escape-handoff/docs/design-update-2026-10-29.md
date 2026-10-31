# October 29 design update

Current-rule pointer, October30: [adopted interaction/inventory/ghost/server contracts](design-update-2026-10-30.md). The dated calculations and findings below retain their original assumptions; they are not new runtime evidence for this revision.

Latest documentation deliverable: [master game design and implementation plan](../master-game-design.md) combines the complete current game, appearance, rules, architecture, proposed file tree and implementation/validation tasks. The consolidation changes no gameplay values or design-only scope.

Rules at this dated revision: `mine-escape-playtest-2026-10-29-openings`; superseded where noted by the October30 decision record. [All documents](../README.md) · [Current contracts](current-rules.json) · [Arithmetic](revision-math-2026-10-29.md).

## Confirmed changes

The user confirmed that **every map has a few real hidden openings**. There are no free natural-exit clues. The compass is used once and costs much more. Workers may save unused pickaxes and may mine as soon as an Explorer discovers a mine, including round one if they act fast enough.

Initial tuning selections are three scattered small openings per map, each reached through a 14–16-link horizontal route from the starting camp; a target below 1% unaided natural escapes; and a nine-coin retail/eight-coin wholesale compass. These quantities are selected draft values, not individually supplied by the user or measured success rates. Small openings are revealed clearly after their room is discovered and retain the existing all-survivor natural victory at round end.

The old 10% map-existence gate, single exit, fake no-exit compass bearings and next-round mine activation are retired. A valid map always has real openings. The compass gives a private static 90° approximate bearing toward the geographically nearest opening, based on the surveyed room’s reference point, with fixed ±22.5° noise. It does not show a correct wall, path, distance or target ID. Another room can have a different nearest opening. One Survey consumes the item and one action; another scan requires another purchased compass.

## First-round mining and saved tools

Prepare pickaxes during camp choices, then target a newly discovered mine in the field. The mine activates on completed discovery; players receive no free tools/actions or field loadout swaps. A new mine’s no-show reservation deadline is min(discovery+15,90), not the old absolute second 55; existing mines keep55. The hold is not a mandatory waiting period. Late discovery never extends field time. Mine reserve8, throughput2, one actual miner/mine and Worker cap2 remain.

An unused pickaxe keeps its two-round lifetime: one issued in round one can be equipped/used in round two. It expires at round-three arrival. Used/interrupted tools are spent; unused actions never carry over. Stockpiling does not bypass the two free/four maximum slots or production limit.

With a mine discovered at43, two seconds of Worker travel and two three-second channels, ideal completion is51; adding six seconds for attention gives57, still before90. These are arithmetic examples, not measured controls. One Worker’s ten-round production ceiling is now20 rather than18 under delayed activation; with starting coins it is22, still below private escape25. One/two opening mines can provide up to two/four Worker coins in round one. Finite reserves and earlier depletion prevent calling this a fixed increase to every match’s total income.

## What the Guard rule actually is

The Guard offers one wallet lock for one coin and one life shield for two coins per round, each costing the Guard one action. The client pays no action. Protection activates at choice close (second 30); the lock stops that round’s theft, and the shield blocks one ordinary weapon hit, not a democratic execution. Installed services remain for the round if the Guard later dies.

The earlier audit claimed the Guard could permanently time out between payment before 28 and delivery 30. **That concern was overstated.** With explicit current-round authorization at time a≥10, a subsequent disconnect deadline is d+110≥120, later than delivery 30. Reconnecting to authorize clears an old deadline. A current-round offer can still be accepted after a brief disconnect, but its accepted delivery already persists under the ordinary durable-action rule. Attacks/trials are forbidden during choices.

Clarify/enforce current-round offer authorization and kit/action binding; future draft offers do not auto-activate and stale offers are rejected. This closes the specification wording issue without inventing a refund/forfeit-survival policy. The earlier recommendation was not adopted as a new gameplay rule.

## Evidence limits and remaining work

Arithmetic checked five mining timing examples, three price candidates and coin conservation for the selected compass margin split. No new full economy or natural-escape simulation was run. Existing studies have obsolete activation/compass/exit assumptions and remain historical baselines. The below 1% unaided target is **not achieved evidence**; validate it on actual scattered-opening layouts and search policies.

Remaining work: map/rarity model, compass affordability/value, mine-target races and late cutoff, saved-tool UI/expiry, new funding balance, phone checkout/return timing, career-loss scenarios, authoritative multiplayer/privacy/reconnect tests and public deployment. No major user preference from the latest turn remains unanswered. Design-only scope remains; no game or hosting was created.
