# Mine Escape — static 2D asset pack v0.1

October30 design alignment: the adopted contracts and next asset brief in the main design package now require a modular identity rig, eight mild career/appearance haunts (once per base round), corpse/ghost animation and functional room layers. These are not included in this static38PNG pack. Seven carried-item slots and purchase/claim UI should use runtime text/vector controls. The original PNG bytes remain unchanged.

Created October 30, 2026 with the **built-in imagegen tool**. Original cartoon expedition art with bold outlines, distinct career silhouettes, and a slightly elevated 2D view. This follows the game's existing careers and palettes, using the small-screen readability of social multiplayer games as a reference.

Open [the visual gallery](gallery.html) in a browser. It works locally without network dependencies; keep the folder structure intact. Click an asset for the full PNG. [manifest.json](manifest.json) lists each texture, dimensions, hash, alpha bounds, suggested origin and intended use.

## Included

| Group | Files | Contents |
|---|---:|---|
| Characters | 8 | Worker ×2, Explorer ×2, Merchant, Guard, Thief, Scavenger; one front-right idle pose per appearance |
| Items and services | 18 | Pickaxe, drill, hook, crowbar, club, blade, gun, wallet lock, life shield, lantern, reinforced lantern, potion, rescue kit, compass, extra action, Deposit, Trial and coin |
| Room plates | 12 | Eight themes plus four exhausted/empty/triggered states |

All **38 PNGs are native 1254×1254**. Characters and icons use real RGBA transparency. Rooms are opaque RGB full-room artwork. The generator returned this resolution despite 1024-square prompt requests; the originals are preserved without resampling, cropping, compositing or alpha edits.

The six careers have public outfits only. A Smuggler uses exactly the same texture as their cover. Variant 2 is cosmetic, with no gameplay benefit. P1–P8 labels and personal markers must be rendered separately at runtime, not baked into these images.

## Directory layout

```text
game-assets-v01/
  characters/                 Eight transparent base appearances
  items/                      Eighteen transparent item/service icons
  rooms/                      Eight room themes and four state variants
  gallery.html                Searchable local preview and composition viewer
  manifest.json               Portable asset/import metadata and hashes
  rooms-layouts.json          Proposed normalized ports, geometry and anchors
  character-metadata.json     Visible bounds and suggested feet origins
  character-prompts.json      Exact character generation/edit prompts
  utility-prompts.json        Exact utility icon prompts
  combat-service-prompts.json Exact weapon/service/currency prompts
  room-prompts.json           Exact room generation/edit prompts
  asset-validation.json       Pixel/file checks and their limits
  README.md
```

## Importing into the planned Phaser client

1. Copy this directory into the future `apps/web/public/assets/` tree, or map the manifest's relative paths to that location. Load each PNG as an individual texture using its `texture_key`. Each file has **one frame**, not an animation grid.
2. Use the full image dimensions for texture loading. Transparent margins differ; align characters using each suggested visual origin and normalize by visible body height. Choose equal collision footprints independently of art. Do not use opaque pixels as a collider.
3. Scale with smooth filtering for this illustrated style. Treat 48–64 CSS-pixel visible character height and 40–64-pixel inventory icons as starting preview sizes, not final tested targets. Keep raw high-resolution PNGs as source art; texture atlas packing/compression is future build work.
4. Draw room backgrounds below characters. The room images are **flattened plates**, not tiles or separate foreground occlusion layers. Runtime wall collision, darkness, visibility masks, overlays, prop hit areas and depth ordering remain separate.
5. Swap depleted/empty/triggered room textures only when authorized server state changes. These generation edits are visually matched, **not guaranteed pixel-identical layers**; do not assume lossless animated transitions. Later production can separate floor, walls and props for precise changes.

The generic icon for a service or action does not make it a physical item. Prices and effects must come from the versioned rule catalog. Deposit has no tool/coin fee but uses an action; extra slots do not include free tools. The coin icon is not permission to show other players' wallets. A potion texture can serve both retail and bound Merchant potions; instance ownership and expiry belong to game data.

## Room layout contracts

The eight themes are central camp, coin mine, treasure vault, crystal refuge, supply cache, trap gallery, empty junction and ladder chamber. Each shares an approximate four-port footprint, with passages centered north/east/south/west. Peripheral contents differ. These are themed layouts, not eight validated navigation topologies.

Four paired states are included: `coin_mine_exhausted`, `treasure_vault_empty`, `supply_cache_empty`, `trap_gallery_triggered`. [Room notes](rooms/README.md) and [layout JSON](rooms-layouts.json) specify proposed anchors, safe status, spawn candidates and state pairs. Geometry uses normalized coordinates with top-left origin and y increasing downward.

The layout JSON is an authored integration suggestion. It has **not** been tested for collision, radius clearance, occlusion, adjacency time, six-tile travel or 36-tile return budgets. Open-looking door artwork does not determine topology. The game must cover/close inaccessible ports and withhold undiscovered rooms. No natural-exit clues are embedded in these base rooms. A separately revealed opening overlay/state is still needed for natural escape; the ladder art is not an exit.

Camp/Refuge terminals and bright minerals are static scenery. Unsafe rooms remain unsafe when a lantern is placed. Ladder access and trap behavior come from server state; a room image cannot grant either automatically.

## Privacy and visual rules

- Characters are empty-handed in idle poses. Do not reveal purchased weapons, saved pickaxes, shield charges or wallet balances through idle art.
- Hook imagery belongs in the owner's inventory/target UI only. Do not animate a hook, sound or identifying effect for other players when theft settles.
- The compass needle in the inventory icon is decorative. Show actual coarse bearings in the owner-private Survey UI only after a committed Survey; never rotate the icon into a free continuous compass.
- Guard costume, wallet/shield service icons and actual active protection are separate. Public acceptance must not expose off-screen shield breaks.
- Draw only entities/room information authorized by the server. A dark shader over already-delivered hidden state is insufficient.

## What this pack does not yet contain

These files are usable **static source assets for a prototype**, not a complete animated production library. Still needed for the release build: eight-direction idle/walk sets, action/death/ghost states, aligned foot anchors, layered walls/props and sealed doorway/natural-opening overlays, further room silhouettes/variants, in-game UI badges/markers, audio, final atlas/export sizing and engine/browser verification. The current six career bases and two duplicate appearances are complete for this static pass.

The originals can contain faint low-alpha generator speckles beyond the visible silhouette. Metadata uses alpha ≥128 for meaningful visible bounds, while keeping originals unchanged. Inspect blending and any edge halos on light and dark backgrounds during integration before deciding whether cleanup is necessary. No clipping was found in the meaningful silhouettes.

## Generation record and validation

All art used built-in imagegen; no CLI/API fallback or stock asset download. Exact prompts, source paths and references are in the four prompt JSON files above. Paths to original generator files are provenance only; all final PNGs also live in this pack, so importing does not depend on the generator directory.

The validation record checks successful PNG decoding, expected filenames/counts, square dimensions, actual alpha for sprites/icons, opaque room plates, visible silhouette margins, metadata, gallery source references/JavaScript syntax and ZIP equality. This is **not gameplay, collision, animation or mobile usability testing**. Gallery browser rendering was not verified here: the sandbox disallowed a local preview server and the browser blocked file URLs. The PNGs were inspected directly. The former career concept image and its original prompt remain preserved separately in the main project.
