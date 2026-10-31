# Next asset batch — functional game kit and mild haunts

October 30, 2026. This is the current **production specification**, not a delivered second asset pack. The existing [38 static PNGs](asset-pack-v01.md) remain eight single-view character sprites, 18 item/service icons and 12 flattened room plates. No new images, directional animation, sound files or game code were created in this update. Accepted gameplay and identity decisions are in the [October 30 contract](design-update-2026-10-30.md); the [master design](../master-game-design.md) remains the consolidated handoff.

## Adopted asset contracts

- **Identity:** use compatible body, head/identity and public-outfit components with stable attachment points. Face, hair/skin preset and fixed P1–P8 marker survive an Explorer conversion. A precomposed export is acceptable only if it preserves every supported identity/outfit combination. The existing baked PNGs are references, not a complete component system.
- **Frames:** support eight facing directions, a shared feet origin/body scale, consistent idle/walk timing and action-prop attachment points. Equal gameplay collision is independent of coat/pack silhouette. Prove one face in both Worker and Explorer outfits before expanding the cast.
- **Rooms:** separate floor, collision, interaction, foreground occlusion and lighting. The existing painted ports and proposed geometry require a prototype check for character clearance, six-tile adjacent-anchor travel and the 36-tile return-to-camp constraint. Large decorative rooms must not silently lengthen required travel.
- **Privacy:** no baked player numbers, prices, private wallet amounts, live bearings, secret roles or inventory contents. Default hands are empty. A Smuggler always uses their public career's ordinary art. Hook theft has no world animation, sound or victim cue.
- **Exports:** preserve native masters and original PNGs. Validate smaller runtime frames/icons, atlas padding, filtering and texture groups at intended phone scale before mass export. Frame counts and export resolution remain production measurements, not additional gameplay choices.
- **Inventory and actions:** show seven fixed physical-item slots, including equipped items and personal potions, separately from two free and up to two paid action slots. Shopping is free of action cost; item use and Deposit consume their prepared action. The interface must make atomic extra-action/tool checkout and a full inventory understandable.

## Batch A — prove the reusable kit

| Deliverable | Required content | Acceptance |
|---|---|---|
| Character animation pilot | One shared identity with Worker and Explorer outfits; eight-direction idle and a short consistent walk cycle; empty hands | Outfit conversion retains face, hair, skin, marker and feet anchor; turning/walking reads on a phone; no hidden equipment or Smuggler tell |
| Ghost and mild-haunt pilot | The same identity in non-graphic corpse, floating ghost and 450 ms mild-haunt forms for both outfits | Death preserves public outfit at death; haunt is recognizable, readable at phone size and clear of controls; reduced-motion version works |
| Modular room assembly | Floor, walls/foreground and four directional passage ports with sealed/open states | Each port closes independently; collision agrees with the visible opening; foreground occludes feet/body correctly without hiding targets |
| Traversal and escape features | Paired down/up ladder connectors; one clearly revealed small natural opening | Return ladder is readable without implying upward digging; opening appears only after discovery, has no advance glow/arrow and is not a pixel hunt |
| Independent stateful props | Camp terminal, active/depleted mine vein, closed/open-empty chest, ground cache pickup, placed standard/reinforced lantern | State changes do not require repainting a room; consistent viewpoint, anchors and interaction regions; ordinary lantern never makes a room look legally safe |
| Core indicators | Eight seat markers, target ring, channel progress/interrupted state, unavailable/locked state and camp/return indicator | Grayscale and phone-size readability; cancellation is distinct from completion; no invisible actor or distant event disclosed |
| Inventory/checkout UI kit | Seven item slots, expiry/count labels, equipped reference, pending grant badge, full/rejected purchase state; two free plus two paid action slots; combined slot/tool receipt | Purchases never animate as spent actions; a failed bundle looks uncharged; owned items occupy only one physical slot even when equipped |

These are asset families, not a promised fixed image count. Text, seat labels, rings, progress bars, timers, inventory slots and receipts should normally be rendered by the UI rather than generated as bitmap labels. Directional room pieces cannot be assumed to work by rotating a shaded painting; camera and wall faces must be checked.

Start with the pilot and one room. Four walk frames plus one idle per direction for two outfits would yield **80 frame/outfit combinations** before action/death states. That illustrates why the reusable component contract comes first. Final frame count and playback rate require animation review; no full directional pack has been delivered.

## Required mild-haunt appearances

Ghosts see all player avatars in discovered space regardless of darkness, distance or walls. They receive no undiscovered geometry, private wallets/inventories/roles, remote HP/action details or someone else's Compass journal. Their view does not illuminate the living players' maps. Living players and escaped spectators do not receive roaming ghost forms; the private haunt is a separate overlay. Do not animate a world ghost as haunting in other observers' views. Escaped spectators retain their separate, locally filtered observer view.

Each ghost may haunt **only their murderer once per base round**, at any time during an active match, including camp and meetings. It costs no action and changes no gameplay state beyond the persisted allowance. Use the [gameplay contract](design-update-2026-10-30.md) for eligibility, reconnect/delivery receipts and reset behavior. There is no distance requirement, public broadcast or queued offline scare.

The common effect is a **450 ms** small pop at a clear edge of the world viewport: a short upward hop, settle and fade of the deceased player's ghost appearance. Retain face, P marker and public outfit at death, including an elected Explorer's new outfit and a Smuggler's cover. Keep action buttons, ballots, clock, aiming targets and text clear. Only the haunting ghost and murderer receive it. Simultaneous different ghosts appear in one small 450 ms strip, with one restrained motion/sound, rather than stacking animations.

| Appearance set | Recognizable details to preserve | Small playful variation |
|---|---|---|
| Worker 01 | Yellow hardhat, orange overalls, single helmet stripe, selected identity | One small helmet bob with a rounded mist puff |
| Worker 02 | Same career palette, double helmet stripe, distinct selected identity | Same timing with a slight opposite tilt; no stronger scare |
| Explorer 01 | Wide hat, teal coat, upright pack, single diamond detail | Hat brim gives one tiny bounce |
| Explorer 02 | Same career silhouette, double diamond detail, distinct identity | Same bounce with a small pack sway |
| Merchant | Plum coat, rectangular ledger satchel, face and marker | One soft lapel/ledger bob |
| Guard | Square helmet, broad cobalt/ivory shoulders, face and marker | A tiny shoulder lift; no shield activation implied |
| Thief | Pointed hood, charcoal/lime accents, face and marker | A gentle hood-tip wobble; no Hook or theft cue |
| Scavenger | Rounded aviator cap, rust jacket and rounded pack, identity | One small pack bob with a soft mist puff |

These eight sets cover the eight current launch appearances, not eight fixed demographic identities. Build the effect from the shared head/outfit rig so every supported personal preset and career conversion also works. Keep the overall timing, scale and intensity equal across careers. Do not generate a special Smuggler haunt.

Reduced motion shows a small stationary ghost badge for the same duration. Optional audio is a quiet rounded pop, respects mute/volume and conveys no extra information. No gore, frightening face, scream, loud sting, full-screen flash, camera shake, control capture, vision obstruction or custom message is allowed. A haunt should produce a small playful surprise. Verify comfort, readability and control clearance on a phone before accepting the full set.

## Batch B — complete the play kit

| Family | Still needed after the pilot | Verification |
|---|---|---|
| Full character animation | Extend compatible identity/body/outfit components to Merchant, Guard, Thief and Scavenger; both Worker and Explorer variants; supported personal presets | Back/side views keep role cues; identical collision and pivots; no face swap on conversion |
| Death, ghost and all eight haunts | Non-graphic bodies, floating ghost loops, eight appearance-specific mild-haunt sets and static reduced-motion portraits | Correct identity at death; no secret role tell; no public murderer cue; concurrent effects remain restrained |
| Shared action overlays | Mine, Drill, Loot, healing, rescue, lantern placement, paid Compass Survey, Deposit, club/blade/gun and shield impact; committed-tool break and interrupted-channel feedback | Visible only to server-authorized viewers; unblocked damage cancellation differs from blocked hit; invalid starts show no spent tool; theft stays silent |
| World states and variants | Cache full/empty/pickup; trap ready/triggered; lit/expired lanterns; sealed/open room walls; non-graphic corpse coin-available/exhausted states; additional narrow passage and larger Safe Zone footprints | Claimed Loot is shown only where the source is visible, without broadcasting the claimant; corpse art does not reveal coin quantity; state changes match collision/light |
| Functional HUD | Six career badges, personal HP, trap/rescue/protection, expiry, claim busy/canceled, inventory-full and pending grants; local safe-room label; election/trial ballots; reconnect/recovery status | Distinct item and action capacity; no world-wallet count; authoritative receipts survive retries; private status stays private |
| Menus and results | Lobby Ready/roster, nickname entry, readable rules, private career card, Merchant catalog/tier state, structured proposal/approve/reject, contribution/results cards | Text/controls are runtime UI; no unrestricted chat or manual emotes; secret reveal only at the authorized terminal result |
| Audio | Restrained footsteps, permitted local tool/use/combat effects, phase/return warnings, optional private haunt and neutral result cues | No theft sound or unseen-world information; usable muted; no stacked haunt volume |
| Runtime export set | Phone-size character/prop/icon exports, animation metadata and atlases; layered-room import data | Transparent edges, padding, origin, filtering, decoded memory and load behavior tested on target devices |

The existing 18 item/service icons can largely be reused. They are inventory/UI pictures; an icon does not automatically serve as a correctly scaled held prop or placed world object. Wallet locks and life shields need status/effect versions, and a physical lantern needs a placed version. Basic UI graphics and lighting masks can be drawn by the renderer instead of commissioning separate raster images.

The 12 room plates are useful references and prototype backgrounds. They are eight room themes plus four depletion/trigger variants, not 12 validated navigable layouts. None supplies the complete separable collision, occlusion, door or light layers needed for production. The current character images likewise provide a front-right idle view, not walking, attacking, corpse, ghost or haunt frames.

## Later polish and completion gates

Decorative themes, elaborate idle flourishes, extra costume palettes, large recap illustrations and a broad music library can wait until the core kit passes review. First prove one room, one modular identity, both pilot outfits and the mild haunt. Then produce the remaining functional states and full cast.

No additional gameplay choice is required to commission this work. Production still needs alignment/scale checks, doorway clearance, phone-size readability, privacy checks, mild-haunt comfort, muted/reduced-motion review and runtime memory/loading measurements. These are acceptance tasks, not completed tests. Save new assets and exact prompts as a new pack version; preserve the original 38 PNGs and their provenance.
