# Mine Escape — master design and all existing artwork

Start with [master-game-design.md](./master-game-design.md). It contains the agreed gameplay and implementation structure, including the October 30 inventory, interruption, Loot, purchase, ghost, identity and server decisions. Rules version: `mine-escape-playtest-2026-10-30-interactions`.

The master covers the TypeScript project structure, React/Phaser client, authoritative Node/Colyseus server, PostgreSQL storage, privacy/recovery, implementation phases, tests and public deployment acceptance. This is a specification: the game has not yet been built or playtested.

## Folder contents

| Location | Contents |
|---|---|
| [Master design](./master-game-design.md) | Main 17-section game-design and implementation handoff |
| [Asset gallery](./game-assets-v01/gallery.html) | Searchable gallery of the 38 static game images; preserves the original local gallery |
| [Asset import guide](./game-assets-v01/README.md) | Metadata, suggested anchors, proposed room geometry, original generation prompts and usage limits |
| `game-assets-v01/characters/` | 8 transparent character appearances: Worker×2, Explorer×2, Merchant, Guard, Thief, Scavenger |
| `game-assets-v01/items/` | 18 transparent tool, weapon, item, service and action icons |
| `game-assets-v01/rooms/` | 12 room plates: eight themes and four depleted/triggered variants |
| [Original character concept sheet](./concept-art/career-cast-v01.png) | Earlier cast illustration; reference art, not a sprite atlas |
| [File specification](./docs/implementation-file-spec-v02.md) | Detailed future source files and module responsibilities |
| [Implementation checklist](./docs/implementation-readiness-v04.md) | Work remaining from prototype through public multiplayer verification |
| [Latest decision record](./docs/design-update-2026-10-30.md) | Exact current interaction, inventory, purchase, ghost and server contracts |
| [Next asset brief](./docs/next-asset-batch-v02.md) | Additional artwork still to create |
| [Document status and remaining gaps](./docs/preimplementation-review-2026-10-30.md) | Settled design choices and remaining validation evidence |
| `docs/` | Companion rules, contracts, character guide, memory, provenance and dated analysis/reference reports |
| [Package manifest](./package-manifest.json) | Source mapping and SHA-256 checksums |
| [Package validation](./package-validation.json) | File, image-hash, link and ZIP packaging checks; not gameplay tests |

There are **39 PNG images total: 38 game assets plus one original concept sheet**. All image bytes and original generation prompts are preserved. Markdown links were made relative to this folder so the master and supporting references travel together. Historical reports keep their original dates/assumptions; they do not establish current win rates. Analysis scripts and the earlier large archives are not duplicated in this focused handoff.

## Not yet created

Directional walking/action/death/ghost animation, the eight mild character haunt sets, modular head/body/outfit assets, layered room/door/ladder/exit pieces, independent placed props, production atlases and audio remain future work. The current PNGs are static sources, not a complete animated game library. The asset brief records these tasks without implying those files exist.

Extract the ZIP as one folder and keep its structure intact. The asset gallery has no external network dependencies; its source references were checked, but browser rendering was not verified in this workspace. No application code, hosting or new artwork was created during packaging.
