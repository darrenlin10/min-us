// Rules simulation: drives the Match engine directly (no network).
import assert from 'node:assert/strict';
import { Match } from '../server.js';
import { ROOM, TICK_HZ, CHOICE_CLOSE, FIELD_START, ROUND_SECONDS } from '../public/shared.js';

const T = (s) => Math.round(s * TICK_HZ);
const msgs = [];
function setup(n) {
  const m = new Match('TEST');
  for (let i = 0; i < n; i++) { const p = m.addPlayer('P' + i, 'tok' + i); p.ready = true; }
  m.start();
  for (const p of m.players) p.events = [];
  return m;
}
const runTo = (m, sec) => { while (m.state === 'game' && (m.meeting || m.t < T(sec))) m.step(); };
const runUntilRound = (m, r) => { while (m.state === 'game' && m.round < r) m.step(); };
const cmd = (m, p, o) => { m.cmd(p, o); const e = p.events.filter((x) => x.kind === 'error'); p.events = []; return e.map((x) => x.msg).join('; ') || null; };
const at = (p, room, lx = 2, ly = 2) => { p.x = room.gx * ROOM + lx; p.y = room.gy * ROOM + ly; p.d = room.d; };
const by = (m, c) => m.players.find((p) => p.career === c);

// --- 2-player game: explorer drills a guaranteed mine, worker mines it, deposits.
{
  const m = setup(2);
  const w = by(m, 'worker'), e = by(m, 'explorer');
  assert(w && e, '2p roster');
  const camp = m.rooms['0,0,0'];
  runTo(m, 12);
  assert.equal(cmd(m, e, { t: 'setSlot', slot: e.slots[0].id, what: 'free:drill' }), null);
  assert.equal(cmd(m, w, { t: 'setSlot', slot: w.slots[0].id, what: 'free:pickaxe' }), null);
  assert.equal(cmd(m, w, { t: 'setSlot', slot: w.slots[1].id, what: 'free:pickaxe' }), null);
  assert.equal(cmd(m, e, { t: 'setSlot', slot: e.slots[1].id, what: 'deposit' }), null);
  assert.match(cmd(m, w, { t: 'setSlot', slot: w.slots[0].id, what: 'free:drill' }), /Explorer|free/);
  runTo(m, FIELD_START + 1);
  assert.equal(cmd(m, e, { t: 'act', slot: e.slots[0].id, target: { dir: 'e' } }), null);
  runTo(m, FIELD_START + 5);
  const mine = m.rooms['1,0,0'];
  assert(mine && mine.cat === 'mine' && mine.reserve === 8, 'guaranteed mine');
  assert(camp.doors.e && mine.doors.w, 'door opened');
  at(w, mine);
  assert.equal(cmd(m, w, { t: 'act', slot: w.slots[0].id }), null);
  runTo(m, FIELD_START + 9);
  assert.equal(w.coins, 3);
  assert.equal(cmd(m, w, { t: 'act', slot: w.slots[1].id }), null);
  w.x += 0.5; m.step(); // moving cancels
  assert.equal(w.channel, null); assert.equal(w.coins, 3); assert(w.slots[1].used);
  assert.equal(cmd(m, e, { t: 'act', slot: e.slots[1].id, target: { amount: 2 } }), null);
  assert.equal(m.fund, 2); assert.equal(e.contrib, 2);
  runUntilRound(m, 2);
  assert.equal(m.round, 2); assert.equal(w.slots.length, 2);
  console.log('ok 2p basic loop');
}

// --- theft, guard lock, merchant extra slot, weapons & loot, trial, natural exit, group win
{
  const m = setup(5);
  m.players.forEach((p) => (p.coins = 10)); 
  const camp = m.rooms['0,0,0'];
  const mer = by(m, 'merchant');
  const spec = m.players.find((p) => ['guard', 'thief', 'scavenger'].includes(p.career));
  const [a, b] = m.players.filter((p) => p !== mer && p !== spec);
  runTo(m, 12);
  // extra action prices 1,2
  const c0 = a.coins, mc = mer.coins;
  assert.equal(cmd(m, a, { t: 'buyExtra' }), null); assert.equal(a.coins, c0 - 1); assert.equal(a.slots.length, 3);
  assert.equal(cmd(m, b, { t: 'buyExtra' }), null); assert.equal(b.coins, 8);
  assert.equal(cmd(m, b, { t: 'buyExtra' }), null); assert.equal(b.coins, 5);
  assert.equal(mer.coins, mc + 2, 'profit cap 2'); assert.match(cmd(m, b, { t: 'buyExtra' }), /At most 2/);
  // theft: a hooks b
  cmd(m, a, { t: 'setSlot', slot: a.slots[0].id, what: 'free:hook' });
  assert.equal(cmd(m, a, { t: 'setTheft', slot: a.slots[0].id, target: b.id }), null);
  const bBefore = b.coins, aBefore = a.coins + 10 - 10;
  // weapons
  a.coins += 10;
  assert.equal(cmd(m, a, { t: 'buy', item: 'gun' }), null);
  const gun = a.inv.find((i) => i.type === 'gun');
  cmd(m, a, { t: 'setSlot', slot: a.slots[1].id, what: 'item:' + gun.id });
  cmd(m, a, { t: 'setSlot', slot: a.slots[2].id, what: 'deposit' });
  runTo(m, CHOICE_CLOSE + 1);
  const steal = a.career === 'thief' ? 2 : 1;
  assert.equal(b.coins, bBefore - steal); assert.equal(a.coins, aBefore + steal);
  assert.match(cmd(m, b, { t: 'buy', item: 'club' }), /closed/);
  runTo(m, FIELD_START + 1);
  // no attacks in camp
  assert.match(cmd(m, a, { t: 'act', slot: a.slots[1].id, target: { id: b.id } }), /camp/);
  // make a gallery room east and fight there
  const g = m.makeRoom(1, 0, 0, 'gallery'); camp.doors.e = true; g.doors.w = true; g.dist = 1;
  at(a, g, 1.5, 2); at(b, g, 2.5, 2);
  assert.equal(cmd(m, a, { t: 'act', slot: a.slots[1].id, target: { id: b.id } }), null);
  assert.equal(b.status, 'dead'); assert.equal(b.murderer, a.id);
  const corpse = m.corpses[0]; assert.equal(corpse.coins, bBefore - steal);
  const fareN = m.living().length; assert.equal(fareN, 4);
  // ghost haunt
  b.ws = null; assert.match(cmd(m, b, { t: 'haunt' }) || 'unavailable', /unavailable/);
  // trial: mer accuses spec in camp
  at(mer, camp); at(spec, camp, 2.5, 2.5);
  cmd(m, mer, { t: 'act', slot: mer.slots[0].id }); // nothing
  m.t = T(FIELD_START + 2);
  runUntilRound(m, 2); runTo(m, 12);
  for (const p of m.living()) at(p, camp, 2, 2);
  cmd(m, mer, { t: 'setSlot', slot: mer.slots[1].id, what: 'trial' });
  runTo(m, FIELD_START + 1);
  assert.equal(cmd(m, mer, { t: 'act', slot: mer.slots[1].id, target: { id: spec.id } }), null);
  assert(m.meeting && m.meeting.type === 'trial');
  for (const p of m.living()) cmd(m, p, { t: 'vote', v: p !== spec });
  runTo(m, FIELD_START + 2);
  assert.equal(spec.status, 'dead', 'trial executes with majority');
  // natural exit
  const opening = m.openings[0];
  const r = m.makeRoom(opening.gx, opening.gy, 0, 'gallery'); r.opening = true;
  runUntilRound(m, 3);
  assert.equal(m.state, 'over'); assert.equal(m.result.kind, 'natural');
  assert(m.living().length === 0 && m.players.filter((p) => p.winType === 'natural').length === 3);
  console.log('ok theft/merchant/combat/trial/natural exit');
}

// --- group fare & smuggler private escape same check
{
  const m = setup(3);
  const s = m.players[0]; s.smuggler = true; m.players.slice(1).forEach((p) => (p.smuggler = false));
  s.coins = 30; m.fund = 33;
  runUntilRound(m, 2);
  assert.equal(m.state, 'over'); assert.equal(m.result.kind, 'group');
  assert.equal(s.winType, 'private'); assert.equal(m.players[1].winType, 'group');
  console.log('ok group + smuggler');
}

// --- explorer election + trap + forced camp + openings sanity
{
  const m = setup(3);
  const e = by(m, 'explorer');
  e.status = 'dead';
  runUntilRound(m, 2);
  assert(m.meeting && m.meeting.type === 'election');
  const w = by(m, 'worker');
  for (const p of m.living()) at(p, m.rooms['0,0,0']);
  cmd(m, w, { t: 'volunteer' });
  for (let i = 0; i < T(11); i++) m.step();
  for (const p of m.living()) assert.equal(cmd(m, p, { t: 'vote', v: w.id }), null);
  while (m.meeting) m.step();
  assert.equal(w.career, 'explorer');
  assert.equal(m.openings.length, 3);
  for (const o of m.openings) { const md = Math.abs(o.gx) + Math.abs(o.gy); assert(md >= 14 && md <= 16, 'opening distance ' + md); }
  // forced camp at 9 links
  m.discoveries = 5; const far = m.makeRoom(8, 0, 0, 'gallery'); far.dist = 8;
  runTo(m, FIELD_START + 1);
  at(w, far); w.slots[0].item = null; const it = m.item('drill'); w.inv.push(it); w.slots[0].item = it.id;
  assert.equal(cmd(m, w, { t: 'act', slot: w.slots[0].id, target: { dir: 'e' } }), null);
  for (let i = 0; i < 61; i++) m.step();
  assert.equal(m.rooms['9,0,0'].cat, 'safe');
  console.log('ok election/openings/forced camp');
}

// --- random full-game fuzz: bots wander and spam commands; check invariants
{
  for (let g = 0; g < 30; g++) {
    const n = 2 + (g % 7);
    const m = setup(n);
    let guard = 0;
    while (m.state === 'game' && guard++ < 200000) {
      for (const p of m.players) {
        if (Math.random() < 0.02) {
          const s = p.slots && p.slots[Math.floor(Math.random() * p.slots.length)];
          const opts = ['free:pickaxe', 'free:drill', 'free:hook', 'free:crowbar', 'free:kit', 'deposit', 'trial', ...((p.inv || []).map((i) => 'item:' + i.id))];
          const r = Math.random();
          if (s && r < 0.3) m.cmd(p, { t: 'setSlot', slot: s.id, what: opts[Math.floor(Math.random() * opts.length)] });
          else if (s && r < 0.7) m.cmd(p, { t: 'act', slot: s.id, target: { dir: ['n', 'e', 's', 'w', 'down'][Math.floor(Math.random() * 5)], amount: 1, id: m.players[Math.floor(Math.random() * n)].id, kind: 'chest' } });
          else if (r < 0.8) m.cmd(p, { t: 'buy', item: ['pickaxe', 'club', 'lantern', 'gun'][Math.floor(Math.random() * 4)] });
          else if (r < 0.85) m.cmd(p, { t: 'buyExtra' });
          else if (r < 0.9) m.cmd(p, { t: 'merchantBuy', good: 'potion' });
          else if (r < 0.95) m.cmd(p, { t: 'guardBuy', svc: 'lock' });
          else m.cmd(p, { t: 'vote', v: true });
        }
        // random walk via valid steps; occasionally teleport within discovered rooms for coverage
        if (p.status === 'alive' && Math.random() < 0.01) {
          const rooms = Object.values(m.rooms).filter((r) => r.d === 0 || true);
          const r = rooms[Math.floor(Math.random() * rooms.length)];
          at(p, r, 2, 2);
        }
        p.events = [];
      }
      m.step();
      for (const p of m.players) { assert(p.coins >= 0, 'negative coins'); assert(!p.inv || p.inv.length <= 7, 'inventory > 7'); assert(p.hp <= 3); }
      assert(m.fund >= 0);
      if (m.state === 'game') for (const p of m.players) m.view(p, true);
    }
    assert.equal(m.state, 'over', 'game ended');
  }
  console.log('ok 30 fuzzed games');
}
console.log('ALL TESTS PASSED');
process.exit(0);
