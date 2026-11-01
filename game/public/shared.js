// Shared constants and geometry used by both the server and the browser.

export const ROOM = 4; // tiles per room side
export const SPEED = 3; // tiles per second
export const TICK_HZ = 20;

// Phase boundaries in seconds of base round time.
export const PHASES = [
  { id: 'arrival', start: 0, end: 10, label: 'Arrival — walk to a camp' },
  { id: 'choices', start: 10, end: 50, label: 'Camp choices — shop & prepare' },
  { id: 'departure', start: 50, end: 60, label: 'Departure — head out' },
  { id: 'field', start: 60, end: 110, label: 'Field — use your actions' },
  { id: 'return', start: 110, end: 125, label: 'Return — walk back to a camp' },
  { id: 'settlement', start: 125, end: 130, label: 'Settlement — escape check soon' },
];
export const ROUND_SECONDS = 130;
export const SHOP_CLOSE = 48; // purchases/services close
export const CHOICE_CLOSE = 50; // loadout & theft close
export const FIELD_START = 60;
export const FIELD_END = 110;
export const ROUNDS = 10;
// Group fare: each additional person adds a smaller share (15, 14, 13, 12, then 8, 6, 5, 4).
export const FARE_STEPS = [15, 14, 13, 12, 8, 6, 5, 4];
export const fareFor = (n) => FARE_STEPS.slice(0, Math.max(0, n)).reduce((a, b) => a + b, 0);
// The fare is set by the starting roster (Smugglers included). Each player no longer in the mine
// (dead, forfeited or escaped privately) removes the largest remaining share: 8 players 77 -> 62 -> 48 -> 35 ...
export const groupFare = (start, living) => FARE_STEPS.slice(Math.max(0, start - living), start).reduce((a, b) => a + b, 0);
export const SMUGGLER_FARE = 25;
export const INVENTORY = 7;

export function phaseAt(sec) {
  for (const p of PHASES) if (sec >= p.start && sec < p.end) return p;
  return PHASES[PHASES.length - 1];
}

export const surcharge = (round) => Math.floor((round - 1) / 2);

export const CAREERS = {
  worker: { name: 'Worker', preset: 'pickaxe', blurb: 'Mines up to 2 coins per round (others mine 1).' },
  explorer: { name: 'Explorer', preset: 'drill', blurb: 'Only career that drills new rooms. Gets 1 finder coin from treasure.' },
  merchant: { name: 'Merchant', preset: 'crowbar', blurb: 'Sells extra actions and advanced goods; unlocks catalog tiers. Gets a free potion each round.' },
  guard: { name: 'Guard', preset: 'kit', blurb: 'Sells one wallet lock (1c, stops theft) and one life shield (2c, blocks a hit) per round; they work immediately.' },
  thief: { name: 'Thief', preset: 'hook', blurb: 'Steals up to 3 coins per hook (others steal 1).' },
  scavenger: { name: 'Scavenger', preset: 'crowbar', blurb: 'Loots in 1s instead of 3s and can take ALL coins from a body.' },
};

export const ITEMS = {
  pickaxe: { name: 'Pickaxe', ttl: 2, basic: true, use: 'Mine 1 coin in a mine room' },
  drill: { name: 'Drill', ttl: 2, basic: true, career: 'explorer', use: 'Explorer: open a new room' },
  hook: { name: 'Hook', ttl: 2, basic: true, use: 'Silently steal from someone in your room, any time' },
  crowbar: { name: 'Crowbar', ttl: 2, basic: true, use: 'Loot a body, chest or dropped item' },
  kit: { name: 'Protection kit', ttl: 2, basic: true, career: 'guard', use: 'Guard: deliver a sold service' },
  club: { name: 'Club', ttl: 3, weapon: true, base: 4, dmg: 1, reach: 1.3, use: 'Attack: 1 damage, close range' },
  blade: { name: 'Blade', ttl: 3, weapon: true, base: 7, dmg: 2, reach: 1.3, use: 'Attack: 2 damage, close range' },
  gun: { name: 'Gun', ttl: 3, weapon: true, base: 10, dmg: 3, reach: 4, use: 'Attack: 3 damage, 4-tile range' },
  lantern: { name: 'Lantern', ttl: 3, price: 2, use: 'Light up a room for 3 rounds' },
  potion: { name: 'Healing potion', ttl: 3, use: 'Heal yourself 1 HP' },
  rescue: { name: 'Rescue kit', ttl: 3, use: 'Free a trapped player (or yourself)' },
  rlantern: { name: 'Reinforced lantern', ttl: 5, use: 'Light up a room for 5 rounds' },
  compass: { name: 'Compass', ttl: 3, career: 'explorer', use: 'Explorer at depth 0: rough direction to the nearest exit' },
};

export const ICON = {
  pickaxe: 'pickaxe', drill: 'drill', hook: 'hook', crowbar: 'crowbar', kit: 'life_shield', club: 'club', blade: 'blade',
  gun: 'gun', lantern: 'lantern', potion: 'healing_potion', rescue: 'rescue_kit', rlantern: 'reinforced_lantern',
  compass: 'compass', deposit: 'deposit', trial: 'trial', extra: 'extra_action', coin: 'coin', lock: 'wallet_lock', shield: 'life_shield',
};

// Merchant catalog (advanced goods unlocked by upgrading the shop). Weapons are sold by the machine.
export const MERCHANT_GOODS = {
  potion: { tier: 1, cost: 1, price: 2 },
  compass: { tier: 1, cost: 8, price: 9 },
  rescue: { tier: 2, cost: 1, price: 2 },
  rlantern: { tier: 3, cost: 2, price: 3 },
};
export const UPGRADES = [null, { cost: 3, round: 2 }, { cost: 5, round: 4 }, { cost: 7, round: 6 }];

export const weaponPrice = (type, round) => ITEMS[type].base + surcharge(round);

export const trialFee = (round) => 6 + surcharge(round);

// ---- Geometry: rooms are 4x4 tiles on a grid; each depth is its own plane. ----
export const DIRS = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] };
export const OPP = { n: 's', s: 'n', e: 'w', w: 'e' };
export const cellKey = (gx, gy, d) => `${gx},${gy},${d}`;
export const LADDER = { x: 2.9, y: 1.1 }; // local anchor of the ladder going DOWN (top-right)
export const LADDER_UP = { x: 1.1, y: 2.9 }; // local anchor of the ladder going UP (bottom-left)

export function roomCellOf(x, y) {
  return [Math.floor(x / ROOM), Math.floor(y / ROOM)];
}

// Is local point (lx,ly) in the walkable floor of a room with given open doors?
export function walkableLocal(lx, ly, doors) {
  const m = 0.45;
  const cx = lx - 2, cy = ly - 2;
  if (lx >= m && lx <= ROOM - m && ly >= m && ly <= ROOM - m) {
    // cut the rocky corners
    return Math.abs(cx) + Math.abs(cy) <= 2.75 || Math.abs(cx) < 1.1 || Math.abs(cy) < 1.1;
  }
  const inLaneX = Math.abs(cx) <= 0.5, inLaneY = Math.abs(cy) <= 0.5;
  if (inLaneX && ly < m) return !!doors.n;
  if (inLaneX && ly > ROOM - m) return !!doors.s;
  if (inLaneY && lx < m) return !!doors.w;
  if (inLaneY && lx > ROOM - m) return !!doors.e;
  return false;
}

// rooms: Map/obj keyed by cellKey -> room with .doors
export function walkable(rooms, x, y, d) {
  const [gx, gy] = roomCellOf(x, y);
  const r = rooms[cellKey(gx, gy, d)];
  if (!r) return false;
  return walkableLocal(x - gx * ROOM, y - gy * ROOM, r.doors);
}

export function roomAt(rooms, x, y, d) {
  const [gx, gy] = roomCellOf(x, y);
  return rooms[cellKey(gx, gy, d)] || null;
}
