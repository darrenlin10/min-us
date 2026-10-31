# Room plates v01

Created October 30, 2026 with the built-in image generation tool. These are twelve original opaque PNG room plates: eight themes sharing a modular four-port footprint, plus four resource/trap state variants. Native dimensions are **1254 × 1254**, preserved without resizing.

| Theme | Initial plate | State variant |
|---|---|---|
| Central camp | `central_camp.png` | — |
| Coin mine | `coin_mine.png` | `coin_mine_exhausted.png` |
| Treasure vault | `treasure_vault.png` | `treasure_vault_empty.png` |
| Crystal Safe Zone | `crystal_safe_zone.png` | — |
| Supply cache | `supply_cache.png` | `supply_cache_empty.png` |
| Trap gallery | `trap_gallery.png` | `trap_gallery_triggered.png` |
| Empty junction | `empty_junction.png` | — |
| Ladder chamber | `ladder_chamber.png` | — |

The four centered ports and clear central floor are visually consistent. Corner props differentiate the spaces, while a common footprint makes prototype placement easier. They are eight room themes, not eight independently validated navigation topologies. The central camp and crystal refuge are Safe Zones; lighting alone does not confer that status on any other room.

[Layout metadata](../rooms-layouts.json) provides normalized doorway positions, conservative clear-floor candidate polygons, spawn candidates, interaction anchors, safe flags and state mappings. These coordinates are authored estimates for integration, **not measured collision or path-length guarantees**. The proposed four-tile room scale still needs in-engine checks against the six-tile adjacent-anchor and 36-tile camp-distance rules.

Each image is flattened. Apply visibility, dynamic darkness and state authorizations in the game, using server geometry. Add sealed-boundary overlays where a passage has not been discovered. Rooms must never be shown beyond discovered topology. Actual natural openings require a separate revealed-only feature; these plates contain no advance exit clue.

Use the state variants to avoid showing productive gold or unopened rewards after depletion/collection. The triggered cage communicates state; it adds no new rule that physically teleports a trapped player into that corner. Generated state edits visually preserve the footprint but are not promised pixel-identical layer composites. Review transitions for flicker and construct foreground/occluder layers if characters will pass behind props or walls.

All twelve images were visually inspected and their PNG headers checked for 1254-square opaque RGB output. Runtime collision, occlusion, mobile scale, memory use and gameplay remain untested. [Exact prompts and original generation paths](../room-prompts.json) are preserved.
