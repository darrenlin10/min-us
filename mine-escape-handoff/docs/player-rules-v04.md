# How to play — Mine Escape v0.4

For the complete design, character direction and structured build plan, see the [master document](../master-game-design.md). This file remains the player-facing rulebook draft.

Draft rulebook, October 30, 2026. This describes the selected first playable version; the game has not been built. Detailed defaults are in the [game design](game-design-v04.md).

## Join and start

Enter a nickname and the same room code with three to eight people. No login, installation, or microphone is needed. Everyone may change the available lobby settings. Any change or roster change resets Ready votes. The game starts only when everyone votes Ready, even with eight players. Read your private identity card; your public career is visible to everyone, but your wallet and possible Smuggler identity are private.

You start with two coins, three health, and two free actions each round. There are ten rounds. Your career supplies abilities, not a guaranteed moral alignment.

## What wins

Ordinary players contribute to a shared escape fund. The fare is **11 coins per living person still underground**, including people who might secretly be Smugglers. The fund cannot be stolen or withdrawn. Deaths, permanent disconnect forfeits, and earlier private departures reduce the fare. Each contribution uses one prepared action, whether you give one coin or your whole wallet.

A Smuggler instead needs **25 coins in their own wallet** to buy a private escape. Their public career works normally. Only one Smuggler can depart at each round-end check; if more than one qualifies, rotating player priority decides who goes first.

At every round end, the game checks both routes. If the ordinary group qualifies, all living ordinary players win and the match ends. One qualifying Smuggler can win at that same check. Other Smugglers still underground lose. If only a Smuggler leaves, the remaining players continue. A Smuggler who escaped earlier keeps their win. Anyone still underground after the round-ten check loses.

An exceptionally rare connected natural exit saves **every surviving player, including every Smuggler**, without a fare. Every map contains a few small, widely scattered hidden openings. Finding one requires luck along a 14–16-link horizontal route, not merely that many rooms anywhere. The design aims for under1% unaided natural escapes; actual odds have not been measured. There are no free clues: without a purchased compass, finding it is pure luck. Explorers can buy a compass from the Merchant for a rough bearing, not a guaranteed path. It is checked before paid escapes, so the 25-coin requirement and one-Smuggler limit do not apply. Previously escaped winners keep their wins; ghosts are not revived.

## Walk back to camp each round

**Confirmed schedule: 110 seconds.** This extends the earlier 80-second draft to provide four-action capacity and a return buffer.

| Time | What to do |
|---|---|
| First 10 seconds | Finish walking to a camp and review your planned purchases. No teleport. |
| Next 20 seconds | In camp, confirm tools/actions, purchases, protection offers, and theft targets. Purchases close two seconds before this period ends. |
| Next 10 seconds | Walk out with your locked loadout; no attacks during departure grace. |
| Next 50 seconds | Use up to four prepared field actions and travel between targets. |
| Next 15 seconds | Walk back to any discovered camp. No physical work or attacks; prepared contributions are allowed. |
| Final 5 seconds | Finish the walk and prepared contributions before the escape check. |

Discovering more Safe Zones gives the team nearer camps. Only camps allow planning, shopping, nominations, proposal edits, and voting. You may use already prepared actions and choose their nearby field targets outside camp. Camps give no passive coins or mine output. Trading, protection, contributing, and drilling an unopened camp wall are useful work; progressing deeper requires reaching new boundaries.

Read the catalog and your inventory ahead of time. When already in camp, draft your next loadout/cart before choices begin, then confirm it during choices at the displayed price. Drafts do not charge you or reserve stock. Outside camp the planning view is read-only. Returning late gives you only the remaining global choice time; your personal timer is never extended.

Four actions should fit on a reasonable nearby route; distant targets may not. Watch the estimated walk to the nearest camp and leave earlier when necessary. Timing and map distances still need a real-device prototype test.

A democratic trial adds 30 seconds and pauses ordinary play. A needed Explorer succession meeting adds 20 seconds before normal choices. No attacks occur during choices, grace, return, settlement, or meetings. Camps forbid ordinary attacks at all times.

## If your connection drops

Reconnect from the same browser within **one full round of advancing game time—110 seconds after the server detects the loss**. Meeting and server-recovery pauses do not consume that time. Your avatar stays in the mine and remains vulnerable. The browser remembers your seat automatically; a nickname alone cannot recover it on another device or after its credential is cleared.

After the deadline, you permanently forfeit this match. Your remaining wallet stays in one lootable body, previous contributions remain, and the group fare decreases. You cannot return as a player or controlled ghost. If you already escaped, your win remains. You can see final results or join a new rematch. Leaving deliberately uses the same deadline. When this removes the last Explorer, survivors may elect a replacement at the next eligible camp meeting.

## Prepare before acting

Choose two free actions each round; each additional action slot costs coins. Basic tools for the two free slots are included; extra tools cost one coin. The Merchant can sell up to two extra slots, for a maximum of four. Prices rise with each completed extra-action sale that round. An extra slot does not automatically include a paid item or a new physical tool. Deposit uses a free marker in any owned slot, so donating never adds a tool fee; the extra-slot purchase itself still costs coins.

Buying items or extra slots takes no action. Deposit still takes one action for any affordable amount. Buy an extra slot together with its needed tool in one approved bundle before the purchase cutoff: receive and pay for both, or neither. Prices and stock are rechecked; an extra slot includes no free tool.

You have **seven fixed item slots**, including equipped tools and personal potions. Items do not stack; equipment does not add storage. Money and prepared Deposit/Trial markers need no item slot. Discard items at camp to make space; nothing is automatically replaced. Saved tools keep their original expiry. A full bag leaves your first-slot fallback at the camp terminal until this round ends; collect it after making space. A full-bag Merchant personal potion grant works similarly, without a separate carried pouch.

Tools are single-use. Each successful donation, mining action, discovery, theft attempt, weapon hit, loot claim, potion use, lantern placement, or trial initiation needs its own slot. Movement and numeric proposals are free. An accepted physical action interrupted after starting still spends its tool and action; a request that cannot start costs nothing.

Stand still during physical actions. Moving, losing the target, taking unblocked damage, incapacitation or cancellation spends the started tool/action without completing the work. A fully shielded hit does not interrupt you. Turning is okay while your target stays visible. Meeting movement also interrupts, even if you walk back before it ends.

You may keep unused items until their expiry, normally two rounds for basic tools and three for weapons/potions/lanterns/compasses. Workers may save unused pickaxes: one issued in round one is usable in round two. Unused actions do not carry forward, and saved tools still need this round’s prepared slots. Owning an item does not give you an extra action. Choose it in this round's loadout before using it. Expiry labels include the round in which the item was obtained.

If you miss the first free choice, your career’s preset tool is reserved at camp; collect it from any camp terminal, without an extra action. It does not teleport to you outside camp, and you must still use it yourself. Miss the second choice and you lose that slot. The game will not donate or attack automatically.

## Your career

| Career | Advantage |
|---|---|
| Worker | Mine up to two coins per round, one coin per pickaxe/action. |
| Explorer | Open new rooms with drills. Nobody else can discover rooms. Receive one coin from each discovered treasure pile. |
| Merchant | Sell extra actions and supplies with at most two coins of combined trade profit per round; invest in public catalog upgrades and contribute. Receive one personal healing potion per round, lasting three rounds. |
| Guard | Sell one wallet lock and one life shield per round, each consuming your action. |
| Thief | Steal up to two coins per Hook instead of one. Another theft that round needs a different target. |
| Scavenger | Loot faster and take all remaining corpse coins, including what ordinary looters leave behind. |

Your outfit identifies your career. A Smuggler looks exactly like the ordinary version of that career. Thieves and Scavengers who are not Smugglers win with the ordinary group; stealing from someone suspicious can support the team, but the game never tells you a theft target's secret identity.

## Protect and replace Explorers

Protect Explorers so the team can keep finding mines and forward camps. If no living, unescaped Explorer remains, survivors can nominate a willing replacement and vote at camp before the next normal choices. A trapped Explorer or one still within the reconnect grace counts as present. Once the last Explorer permanently forfeits, the replacement election becomes available.

Election rule: a free 20-second meeting; more than half of all living unescaped players must choose the same willing candidate. Ties or no majority appoint nobody; try again next round. The elected winner permanently becomes an Explorer and loses their old career abilities, while preserving wallet, HP, contributions, player identity, and secret Smuggler status. No one receives extra coins or actions for being elected.

## Explore and earn

Start in the central Safe Zone. Explorers can drill outward through horizontal walls or downward. You cannot dig a new passage upward, but you can return through known ladders. Other players can use discovered passages.

Using the Explorer's first-round slots on discovery guarantees starting mines: one for three/four players, two for larger rosters. Unused opening-mine guarantees carry forward until completed, even if a replacement Explorer opens them. A new mine is usable as soon as the Explorer finishes discovering it—even in round one. Prepare pickaxes at camp, then walk to the revealed mine and finish your mining actions before field time ends. A reservation is not a waiting period. Every mine has eight coins total and yields at most two per round. One person works a mine each round; Workers get reservation priority. An exhausted mine does not refill. Keep exploring.

Possible finds include mines, treasure vaults, tool caches, bright mineral Safe Zones, traps, and empty galleries. The map places a forward camp before new-room anchors exceed a 36-tile walking gap from an existing camp; it replaces that room’s resource find. Watch actual return time, especially when moving between tasks. Treasure gives the finder one coin; claiming the remainder needs a separate Loot action. Downward exploration increases mine chance but reduces treasure chance and never advances the natural exit.

Lucky mine/treasure streaks slightly raise trap risk, never above 6%. A trap usually prevents physical work and movement during next round’s field time, but a prepared contribution still works. You must still walk home; designated return/arrival/choice windows allow walking to camp even while affected. A trap in round ten takes effect immediately for the remaining field time. A prepared Merchant rescue kit can remove active incapacitation in a three-second field action, including self-rescue while trapped. Potions and lantern placement also take three seconds. Effects happen on completion; a lethal hit before completion cannot be undone by a potion.

Dark rooms limit what you see. A two-coin lantern takes one action to place and brightens its room until it expires. It does not make the room a Safe Zone. Walls still block sight. Stay aware of who can actually witness an action.

## Optional Explorer compass

After the Merchant unlocks tier one, an Explorer may buy a **nine-coin compass**. Prepare it in an action slot at camp, then use one three-second Survey action at depth zero. It gives a private broad direction from that room toward the nearest real hidden opening, with no exact location, distance or correct wall. Every map has openings; it does not give a fake reading. It is single-use; an unused compass expires three rounds after manufacture. The note stays on your discovered map, but does not update when you move.

The tunnels may bend away from the indicated bearing, so direction alone does not reveal a usable tunnel path. A Survey from another room may point toward a different, nearer opening. Reading the same room again gives the same direction. There are no environmental arrows or special signals telling you that you took a wrong turn. Compass shopping is optional; ordinary digging can still find the natural exit by luck.

## Theft and protection

During choices, prepare a Hook and select someone in your same camp. Selection and retargeting are camp-only. Both of you must still share a room when choices end; if you leave camp together, the already prepared theft may resolve in that unsafe room. You cannot initiate a new theft target outside camp. Theft resolves then, after wallet protection is installed. There is no theft notification or disclosed thief identity. Your own balance can still change, and you can draw your own conclusions.

A valid committed attempt uses its Hook/action even if the target has no coins or is protected. A Thief takes at most two, other careers one. You cannot steal from the shared fund or through room boundaries. Disconnecting does not protect a co-located avatar or cancel a theft already committed.

The Guard can sell one **wallet lock for one coin**, preventing that round's theft, and one **life shield for two coins**, blocking one whole weapon hit. The Guard spends an action on each; the customer does not. Neither protects a corpse's coins. A life shield does not stop a democratic execution.

## Combat and loot

Everyone can privately buy a club, blade, or single-shot gun. Damage stays **1 / 2 / 3**; prices increase with the round:

| Rounds | Club | Blade | Gun | Trial fee |
|---|---:|---:|---:|---:|
| 1–2 | 4 | 7 | 10 | 6 |
| 3–4 | 5 | 8 | 11 | 7 |
| 5–6 | 6 | 9 | 12 | 8 |
| 7–8 | 7 | 10 | 13 | 9 |
| 9–10 | 8 | 11 | 14 | 10 |

An older weapon needs the price increase paid when equipping it at camp; buying early does not avoid the late cost. Pay only the difference once, and see the quote before accepting. Everyone has three maximum health. Guns have the greatest reach and damage. You can own one weapon and attack once per round. Every valid hit spends the weapon and one action, even if a shield blocks it.

Attacks require a nearby visible target in the same unsafe room during field time. An attack may injure without killing. Health carries across rounds; potions heal one HP for one action. Returning to camp does not heal you.

Elimination does not give the killer any coins. The wallet stays on the body and requires a separate Loot action. An ordinary looter can take half rounded down, once per body; only a Scavenger can recover the remainder. A Scavenger can instead take the whole untouched body. Prior contributions stay in the shared fund.

The first player whose Loot action validly starts reserves that source. Simultaneous starts use rotating player priority; losing the race costs nothing. A faster Scavenger cannot overtake an active claim. If the claimant moves or is interrupted, someone else may start a new claim.

The victim and witnesses can identify an observed attacker. Distant players receive only an elimination notice. Being alone avoids direct witnesses, but does not guarantee nobody will suspect you.

## Merchant cooperation

Extra-action prices still rise 1, 2, 3, … within a round. The Merchant earns at most one coin per slot sale and at most two coins of combined trade profit across all sales that round. Remaining fees go to the machine. Retail sales reimburse the Merchant’s stock cost, then pay a margin only within that same profit limit. Self-orders do not create income.

Upgrade costs are 3, 5, and 7 coins, available sequentially from rounds 2, 4, and 6. Catalog upgrades and total contributions are public; the wallet remains private. The team can judge whether the Merchant is investing and helping. Low upgrades or contributions may attract suspicion, but do not prove a Smuggler identity. Field earnings are separate from the trading-profit limit.

## Trials

During field time, a player in a Safe Zone may spend **the current trial fee and one prepared action** to accuse someone in that same Safe Zone. One trial maximum per round; the fee is spent even if the vote fails. It adds 30 seconds.

Every living person still underground, including the accused, has one vote. Cast it from a Safe Zone. More than half of the entire eligible group must approve execution. Ties and insufficient votes mean no execution. A passed verdict bypasses health and life shields. The body still needs a separate Loot action.

## Proposals, death, and results

Use numeric offers and approve/reject controls to agree on contributions or services. A contribution agreement does not move coins: each player still needs to use their own Deposit action. There is no free chat or manual emote system.

If you die, become a ghost and see all living players and other ghosts throughout discovered rooms, through darkness and walls. Living players cannot see roaming ghosts. You still cannot inspect private wallets, inventories, secret careers or unopened rooms. Haunt only your murderer **once per round, at any time**, including meetings, with a small 450 ms character pop. It affects no controls, visibility, money, health or votes, and only you and your murderer see it. No offline scare queue; reduced motion uses a brief static badge. Escaped spectators have local observation only and cannot haunt.

Paid ordinary-group winners rank by contributed coins, with ties shared. A natural-exit victory ranks all surviving shared winners, including Smugglers, by contributions. Private escape winners are shown separately. Results include actual discoveries, contributions, traps, rescues, and eliminations. Theft victim–thief links remain private. The final reveal happens when the whole match ends, not when the first Smuggler leaves.

These are the selected October 30 first-playtest rules. The [latest decisions](design-update-2026-10-30.md) cover inventory, purchases, interruption, Loot and ghosts. The [calculation and gap report](defaults-calculation-v05.md) explains the defaults and what still needs a playable test.
