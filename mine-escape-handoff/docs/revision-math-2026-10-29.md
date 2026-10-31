# October 29 revision arithmetic

Current-rule pointer, October30: [adopted interaction/inventory/ghost/server contracts](design-update-2026-10-30.md). The dated calculations and findings below retain their original assumptions; they are not new runtime evidence for this revision.

This calculation supports a design change, not a playable test or new complete-economy simulation.

## Immediate mining and stored pickaxes

A mine activates when its discovery completes, including round one. A Worker must already have prepared Pickaxe/Mine slots at camp. A prepared target may be chosen after it is revealed; no field purchase, loadout swap, tool or action grant is needed.

With discovery at d, Worker travel t, attention allowance a, and two three-second channels, completion is d + t + a + 6. It must be strictly before round second 90. Meetings pause the base clock; walking, interruptions and input delays still matter.

| Discovery second | Travel | Attention | Two extractions finish | Within field? | New-mine no-show deadline |
|---:|---:|---:|---:|---|---:|
| 43 | 2 | 0 | 51 | Yes | 58 |
| 43 | 2 | 6 | 57 | Yes | 58 |
| 51 | 2 | 6 | 65 | Yes | 66 |
| 82 | 2 | 0 | 90 | No | 90 |
| 84 | 2 | 6 | 98 | No | 90 |

The 15-second reservation is a no-show grace, not a wait before mining. New mines use min(discovery+15,90); existing mines use round second 55. Once a valid channel starts before that deadline its claim persists through the channel, subject to ordinary interruption/field cutoff. First extraction locks the mine to that miner for the round. No reservation expiry extends field time or creates coins.

One Worker can now potentially produce twenty coins over ten rounds rather than the eighteen-coin ceiling imposed by next-round activation. Starting money raises that to22, still below Smuggler25. One/two opening mines can yield at most two/four total Worker coins in round one if actors prepare and arrive in time. This is not a fixed extra two coins over every entire match: finite eight-coin mines deplete earlier, and later mines also change availability.

Unused pickaxes keep their existing two-round lifetime: an item issued in round one is usable through round two and expires at round-three arrival. The player may equip it during a later camp choices phase. Unused actions expire each round and cannot be banked; owning several saved tools does not exceed two free/four maximum actions or the Worker production cap. Already committed/interrupted uses do not count as unused tools.

## Expensive single-use compass

| Retail | Wholesale | Compared with former3 | Crew burn with margin / at cap | Worker production to fund |
|---:|---:|---:|---:|---:|
| 6 | 5 | 2× | 5 / 6 | 3 rounds |
| 9 | 8 | 3× | 8 / 9 | 4.5 rounds |
| 12 | 11 | 4× | 11 / 12 | 6 rounds |

Select **nine retail/eight wholesale** as the initial draft: triple the previous price, equivalent to four-and-a-half Worker production rounds, while retaining only one potential Merchant margin inside the shared two-per-round cap. This is an explicit tuning choice, not a price proven optimal by playtests. A sale burns eight crew coins when margin remains, or nine at the profit cap. It still uses one prepared three-second Survey action, breaks after one committed use, and grants no drill or extra slot. Lifetime before use remains three rounds from manufacture.

The compass targets the nearest eligible small opening among scattered openings, with approximate direction only. The user confirmed that every map contains a few real hidden openings. Select three initially and target less than1% unaided natural escapes in validation; this is a tuning target, not a measured success rate. The old 10% map-existence gate is removed. A compass selects the geographically nearest opening, not a decoy or a guaranteed next wall. Prior free-clue and single-exit rates are obsolete.

Existing resource studies assume next-round mine activation and omit the new compass cost. Preserve them as historical; do not relabel their funding rates as current. A new full-map/economy policy model is required for actual escape/funding probabilities. Reproduce this arithmetic with `python3 work/revision_math_20261029.py`.
