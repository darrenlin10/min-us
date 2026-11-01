// Strategy simulation: cooperative bots play full games through the real rules engine, walking at real
// speed between rooms, to check that the win conditions are reachable through ordinary play.
// Usage: node test/strategy.mjs [games per roster size]
import { Match } from '../server.js';
import { ROOM, TICK_HZ, SPEED, CHOICE_CLOSE, FIELD_START, FIELD_END, FARE, SMUGGLER_FARE, DIRS, OPP, cellKey } from '../public/shared.js';

const GAMES = Number(process.argv[2] || 40);
const T = (s) => Math.round(s * TICK_HZ);
const STEP = SPEED / TICK_HZ; // tiles per tick

function newGame(n, smugglerPlan) {
  const m = new Match('SIM');
  for (let i = 0; i < n; i++) m.addPlayer('B' + i, 't' + i);
  m.players.forEach((p) => (p.ready = true));
  m.start();
  for (const p of m.players) { p.events = []; p.plan = null; p.path = []; }
  if (smugglerPlan !== undefined) m.players.forEach((p, i) => (p.smuggler = smugglerPlan(i, p)));
  return m;
}

// ----- navigation over the discovered room graph (centers are always walkable and joined by door lanes)
function neighbors(m, r) {
  const out = [];
  for (const k of Object.keys(DIRS)) if (r.doors[k]) { const o = m.rooms[cellKey(r.gx + DIRS[k][0], r.gy + DIRS[k][1], r.d)]; if (o) out.push(o); }
  if (r.down) out.push(m.rooms[r.down]); if (r.up) out.push(m.rooms[r.up]);
  return out;
}
function route(m, from, test) {
  const prev = new Map([[from.key, null]]), q = [from];
  while (q.length) {
    const r = q.shift();
    if (test(r)) { const path = []; for (let x = r; x; x = prev.get(x.key)) path.unshift(x); return path; }
    for (const o of neighbors(m, r)) if (!prev.has(o.key)) { prev.set(o.key, r); q.push(o); }
  }
  return null;
}
const center = (r) => ({ x: r.gx * ROOM + 2, y: r.gy * ROOM + 2, d: r.d });
function goTo(m, p, test) { const r = m.room(p); const path = r && route(m, r, test); if (!path) return false; p.path = path.slice(1).map(center); return true; }
// one tick of walking; ladders are taken instantly at their anchor (approximation of climbing time)
function walk(m, p) {
  if (!p.path.length || p.channel) return;
  const t = p.path[0];
  if (t.d !== p.d) { p.d = t.d; p.x = t.x; p.y = t.y; p.path.shift(); return; }
  const dx = t.x - p.x, dy = t.y - p.y, L = Math.hypot(dx, dy);
  if (L <= STEP) { p.x = t.x; p.y = t.y; p.path.shift(); } else { p.x += (dx / L) * STEP; p.y += (dy / L) * STEP; }
}
const act = (m, p, s, target) => { p.events = []; m.cmd(p, { t: 'act', slot: s.id, target }); return !p.events.some((e) => e.kind === 'error'); };
const slotOf = (m, p, type) => p.slots.find((s) => !s.used && ((s.item && (p.inv.find((i) => i.id === s.item) || {}).type === type) || s.marker === type));

// ----- camp preparation
function prepare(m, p) {
  const set = (i, what) => p.slots[i] && m.cmd(p, { t: 'setSlot', slot: p.slots[i].id, what });
  const free = p.slots.filter((s) => s.kind === 'free');
  if (p.career === 'explorer') { free.forEach((s) => m.cmd(p, { t: 'setSlot', slot: s.id, what: 'free:drill' })); }
  else if (p.career === 'worker') { free.forEach((s) => m.cmd(p, { t: 'setSlot', slot: s.id, what: 'free:pickaxe' })); }
  else { m.cmd(p, { t: 'setSlot', slot: free[0].id, what: 'free:crowbar' }); m.cmd(p, { t: 'setSlot', slot: free[1].id, what: 'free:pickaxe' }); }
  // everyone buys one extra action for depositing when they can afford it (Merchant prices 1,2,3…)
  if (p.coins >= m.merchant.sales + 2 && p.slots.length < 4) { p.events = []; m.cmd(p, { t: 'buyExtra' }); }
  const extra = p.slots.find((s) => s.kind === 'extra' && !s.item && !s.marker);
  if (extra) m.cmd(p, { t: 'setSlot', slot: extra.id, what: 'deposit' });
  // Smugglers keep coins and never deposit
  if (p.smuggler) for (const s of p.slots) if (s.marker === 'deposit') m.cmd(p, { t: 'setSlot', slot: s.id, what: 'none' });
  p.events = [];
}

// ----- field behaviour
function fieldTick(m, p) {
  if (p.status !== 'alive' || p.channel || p.path.length) return;
  const r = m.room(p); if (!r) return;
  // 1. Explorers drill the nearest frontier (prefer horizontal, then down)
  const drill = slotOf(m, p, 'drill');
  if (p.career === 'explorer' && drill) {
    const open = (x) => ['n', 'e', 's', 'w'].filter((k) => !x.doors[k] && !m.rooms[cellKey(x.gx + DIRS[k][0], x.gy + DIRS[k][1], x.d)] && Math.abs(x.gx + DIRS[k][0]) <= 20 && Math.abs(x.gy + DIRS[k][1]) <= 20);
    let dirs = open(r);
    if (m.toExit && r.d === 0) { // guided run toward the first hidden exit (stands in for a lucky / compass-led Explorer)
      const o = m.openings[0], want = [];
      if (o.gx > r.gx) want.push('e'); if (o.gx < r.gx) want.push('w'); if (o.gy > r.gy) want.push('s'); if (o.gy < r.gy) want.push('n');
      const good = dirs.filter((k) => want.includes(k));
      if (!good.length) { const tip = (x) => x.d === 0 && open(x).some((k) => (k === 'e' && o.gx > x.gx) || (k === 'w' && o.gx < x.gx) || (k === 's' && o.gy > x.gy) || (k === 'n' && o.gy < x.gy));
        if (goTo(m, p, (x) => x !== r && tip(x))) return; }
      dirs = good.length ? good : dirs;
    }
    if (dirs.length) { if (act(m, p, drill, { dir: dirs[Math.floor(Math.random() * dirs.length)] })) return; }
    if (!m.toExit && !r.down && r.d < 3 && Math.random() < 0.15 && act(m, p, drill, { dir: 'down' })) return;
    if (goTo(m, p, (x) => x !== r && open(x).length > 0 && (m.toExit || x.dist <= 6))) return;
  }
  // 2. Mine if holding a pickaxe and a mine has room
  const pick = slotOf(m, p, 'pickaxe');
  const cap = p.career === 'worker' ? 2 : 1;
  const minedHere = p.mined.round === m.round ? p.mined.count : 0;
  if (pick && minedHere < cap) {
    const ok = (x) => x.cat === 'mine' && x.reserve > 0 && !(x.mineRound === m.round && x.mineCount >= 2) && (!p.mined.mine || p.mined.round !== m.round || p.mined.mine === x.key);
    if (ok(r) && act(m, p, pick, {})) return;
    if (!ok(r) && goTo(m, p, ok)) return;
  }
  // 3. Loot a chest with a crowbar
  const bar = slotOf(m, p, 'crowbar');
  if (bar) {
    if (r.chest > 0 && !r.chestClaim && act(m, p, bar, { kind: 'chest' })) return;
    if (!(r.chest > 0) && goTo(m, p, (x) => x.chest > 0 && x.dist <= 7)) return;
  }
  // 4. Otherwise deposit now (deposits work anywhere during field)
  const dep = slotOf(m, p, 'deposit');
  if (dep && p.coins > 0 && !m.noDeposit) act(m, p, dep, { amount: p.coins });
}

function playGame(n, opts = {}) {
  const m = newGame(n, opts.smugglers);
  m.toExit = !!opts.toExit; m.noDeposit = !!opts.noDeposit;
  let lastRound = 0;
  while (m.state === 'game') {
    if (m.round !== lastRound) { lastRound = m.round; for (const p of m.living()) { p.path = []; goTo(m, p, (x) => x.safe); } }
    const sec = m.t / TICK_HZ;
    for (const p of m.living()) {
      if (sec >= 11 && sec < 12 && !m.meeting && m.inCamp(p) && !p.prepared) { prepare(m, p); p.prepared = m.round; }
      if (sec >= FIELD_START && sec < FIELD_END) fieldTick(m, p);
      if (sec >= FIELD_END && !p.returning) { p.returning = m.round; p.path = []; goTo(m, p, (x) => x.safe); }
      if (sec >= FIELD_END + 1) { const dep = slotOf(m, p, 'deposit'); if (dep && p.coins > 0 && !p.smuggler && !m.noDeposit) act(m, p, dep, { amount: p.coins }); }
      walk(m, p);
    }
    if (m.t === 1) for (const p of m.players) { p.prepared = 0; p.returning = 0; }
    m.step();
  }
  return m;
}

function summarize(label, games) {
  const kinds = {}; let rounds = 0, wonRounds = [];
  for (const m of games) { kinds[m.result.kind] = (kinds[m.result.kind] || 0) + 1; if (m.result.kind === 'group' || m.result.kind === 'natural') wonRounds.push(m.result.round); }
  const pct = (k) => (((kinds[k] || 0) / games.length) * 100).toFixed(0) + '%';
  const avg = wonRounds.length ? (wonRounds.reduce((a, b) => a + b, 0) / wonRounds.length).toFixed(1) : '-';
  console.log(`${label.padEnd(30)} group win ${pct('group').padStart(4)} | natural exit ${pct('natural').padStart(4)} | time out ${pct('timeout').padStart(4)} | avg winning round ${avg}`);
}

console.log(`Cooperative bots, ${GAMES} games per roster (no Smugglers):`);
for (const n of [3, 4, 5, 6, 8]) summarize(`${n} players`, Array.from({ length: GAMES }, () => playGame(n, { smugglers: () => false })));

console.log('\nOne Smuggler hoarding (never deposits) among cooperative players:');
for (const n of [3, 5, 8]) {
  const games = Array.from({ length: GAMES }, () => playGame(n, { smugglers: (i) => i === 0 }));
  const priv = games.filter((m) => m.result.players.some((p) => p.winType === 'private')).length;
  const maxCoins = Math.max(...games.map((m) => m.players[0].coins + (m.players[0].winType === 'private' ? SMUGGLER_FARE : 0)));
  summarize(`${n} players`, games);
  console.log(`${''.padEnd(30)} smuggler private escape in ${((priv / games.length) * 100).toFixed(0)}% of games (best smuggler wallet ${maxCoins})`);
}
console.log('\nExplorers heading straight for a hidden exit (fund deposits disabled, so only the exit can win):');
for (const n of [3, 6]) {
  const games = Array.from({ length: GAMES }, () => { const g = playGame(n, { smugglers: (i) => i === 0, toExit: true, noDeposit: true }); return g; });
  summarize(`${n} players`, games);
  const allSaved = games.filter((m) => m.result.kind === 'natural').every((m) => m.result.players.filter((p) => p.status === 'escaped').length === m.result.players.filter((p) => p.winType === 'natural' || p.winType === 'private').length);
  console.log(`${''.padEnd(30)} natural exits saved every survivor incl. the Smuggler: ${allSaved}`);
}
process.exit(0);
