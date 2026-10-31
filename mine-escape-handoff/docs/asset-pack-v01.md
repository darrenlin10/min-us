# October 30 — 2D game asset delivery

October30 design alignment: [adopted contracts](design-update-2026-10-30.md) and [next asset brief](next-asset-batch-v02.md) now require a modular identity rig, eight mild career/appearance haunts (once per base round), corpse/ghost animation and functional room layers. These are not included in this static38PNG pack. Seven carried-item slots and purchase/claim UI should use runtime text/vector controls. The original PNG bytes remain unchanged.

The first static asset pack is now available: [visual gallery](../game-assets-v01/gallery.html), [import guide](../game-assets-v01/README.md), [manifest](../game-assets-v01/manifest.json), and [asset folder and import guide](../game-assets-v01/README.md).

It contains **38 original PNGs**: eight career appearances covering all six careers and duplicate Workers/Explorers; eighteen tools, weapons, goods, services and action/currency icons; and twelve room plates covering eight themes and four depleted/triggered states. All are native 1254×1254; characters/icons have real transparency and rooms are opaque. The built-in imagegen tool created the art. Exact prompt sets are inside the pack.

The style uses original, readable cartoon expedition characters, bold outlines and a slightly elevated 2D map, retaining the agreed career colors and outfit cues. Smugglers reuse the public career texture without a secret tell. Empty-handed sprites preserve inventory privacy. No game rule or balance value changed.

[Room layout metadata](../game-assets-v01/rooms-layouts.json) provides proposed normalized doorway ports, walkable areas, spawn/interaction anchors, safe status and state pairings. These are integration suggestions, not validated collision geometry. Room plates share a modular footprint and differ in peripheral contents; they are not eight proven navigation topologies or layered tilemaps.

This completes the requested **static character/item/room art pass**. Directional walking and action/death/ghost animations, exact sprite alignment, layered occlusion and door/exit overlays, final atlas sizes, audio and runtime/mobile checks remain production tasks. [Asset validation](../game-assets-v01/asset-validation.json) distinguishes file/alpha inspection from gameplay testing.

The [master design](../master-game-design.md), [file specification](implementation-file-spec-v02.md), [delivery checklist](implementation-readiness-v04.md), [character guide](character-design-v01.md), [index](../README.md) and local memory now link this pack. The application, authoritative server and public deployment remain unbuilt.
