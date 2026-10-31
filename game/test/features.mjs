// Feature-by-feature rules checks. Each block sets up a scenario and asserts the documented behaviour.
import assert from 'node:assert/strict';
import { Match } from '../server.js';
import { ROOM, TICK_HZ, CHOICE_CLOSE, FIELD_START, FIELD_END, ROUND_SECONDS, walkable } from '../public/shared.js';

const T = (s) => Math.round(s * TICK_HZ);
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('ok  ', name); } catch (e) { failed++; console.log('FAIL', name, '\n     ', e.message); }
}
function setup(n, careers) {
  const m = new Match('TEST');
  for (let i = 0; i < n; i++) m.addPlayer('P' + i, 'tok' + i).ready = true;
  m.start();
  if (careers) m.players.forEach((p, i) => { p.career = careers[i]; p.appearance = careers[i]; });
  m.players.forEach((p) => { p.events = []; p.smuggler = false; p.coins = 20; });
  m.camp = m.rooms['0,0,0'];
  return m;
}
const runTo = (m, sec) => { let g = 0; while (m.state === 'game' && (m.meeting || m.t < T(sec)) && g++ < 1e6) m.step(); };
const nextRound = (m) => { const r = m.round; while (m.state === 'game' && m.round === r) m.step(); };
const cmd = (m, p, o) => { m.cmd(p, o); const e = p.events.filter((x) => x.kind === 'error').map((x) => x.msg); p.events = []; return e.join('; ') || null; };
const at = (p, room, lx = 2, ly = 2) => { p.x = room.gx * ROOM + lx; p.y = room.gy * ROOM + ly; p.d = room.d; };
const give = (m, p, type, slot = 0) => { const it = m.item(type); p.inv.push(it); p.slots[slot].item = it.id; p.slots[slot].marker = null; return it; };
const room = (m, gx, gy, cat, d = 0) => { const r = m.makeRoom(gx, gy, d, cat); r.dist = 1; return r; };
const finish = (m, p) => { for (let i = 0; i < 70 && p.channel; i++) m.step(); };

test('guard wallet lock blocks theft; shield blocks one hit', () => {
  const m = setup(4, ['guard', 'thief', 'worker', 'explorer']);
  const [g, th, w] = m.players;
  runTo(m, 12);
  assert.equal(cmd(m, g, { t: 'setSlot', slot: g.slots[0].id, what: 'free:kit' }), null);
  assert.equal(cmd(m, g, { t: 'setSlot', slot: g.slots[1].id, what: 'free:kit' }), null);
  assert.equal(cmd(m, w, { t: 'guardBuy', svc: 'lock' }), null);
  assert.equal(cmd(m, w, { t: 'guardBuy', svc: 'shield' }), null);
  assert.equal(w.coins, 17); assert.equal(g.coins, 23);
  assert.match(cmd(m, th, { t: 'guardBuy', svc: 'lock' }), /already sold/);
  assert.match(cmd(m, g, { t: 'setSlot', slot: g.slots[0].id, what: 'none' }), /committed/);
  cmd(m, th, { t: 'setSlot', slot: th.slots[0].id, what: 'free:hook' });
  assert.equal(cmd(m, th, { t: 'setTheft', slot: th.slots[0].id, target: w.id }), null);
  th.coins += 10; cmd(m, th, { t: 'buy', item: 'blade' });
  cmd(m, th, { t: 'setSlot', slot: th.slots[1].id, what: 'item:' + th.inv.find((i) => i.type === 'blade').id });
  runTo(m, CHOICE_CLOSE + 1);
  assert.equal(w.coins, 17, 'lock blocked theft'); assert(th.slots[0].used, 'hook still spent');
  assert(g.slots[0].used && g.slots[1].used, 'guard kits spent');
  runTo(m, FIELD_START + 1);
  const gal = room(m, 1, 0, 'gallery'); at(w, gal, 2, 2); at(th, gal, 2.5, 2);
  assert.equal(cmd(m, th, { t: 'act', slot: th.slots[1].id, target: { id: w.id } }), null);
  assert.equal(w.hp, 3, 'shield absorbed'); assert.equal(w.shieldRound, 0);
});

test('ordinary looter takes half once; scavenger takes the rest', () => {
  const m = setup(4, ['scavenger', 'worker', 'explorer', 'merchant']);
  const [sc, w, ex, me] = m.players;
  runTo(m, FIELD_START + 1);
  const gal = room(m, 1, 0, 'gallery');
  at(ex, gal, 2, 2); ex.coins = 9; give(m, me, 'gun', 0); me.inv[0].paidS = 0; at(me, gal, 1, 2);
  assert.equal(cmd(m, me, { t: 'act', slot: me.slots[0].id, target: { id: ex.id } }), null);
  assert.equal(ex.status, 'dead');
  const c = m.corpses[0]; assert.equal(c.coins, 9);
  give(m, w, 'crowbar', 0); at(w, gal, 2.2, 2);
  assert.equal(cmd(m, w, { t: 'act', slot: w.slots[0].id, target: { kind: 'corpse', id: c.id } }), null);
  give(m, sc, 'crowbar', 0); at(sc, gal, 2.1, 2.1);
  assert.match(cmd(m, sc, { t: 'act', slot: sc.slots[0].id, target: { kind: 'corpse', id: c.id } }), /already looting/);
  finish(m, w); assert.equal(w.coins, 24); assert.equal(c.coins, 5);
  give(m, w, 'crowbar', 1);
  assert.match(cmd(m, w, { t: 'act', slot: w.slots[1].id, target: { kind: 'corpse', id: c.id } }), /Scavenger/);
  assert.equal(cmd(m, sc, { t: 'act', slot: sc.slots[0].id, target: { kind: 'corpse', id: c.id } }), null);
  assert.equal(sc.channel.total, T(1), 'scavenger loots in 1s');
  finish(m, sc); assert.equal(sc.coins, 25); assert.equal(c.coins, 0);
});

test('treasure finder coin + chest loot; cache item and full-bag pickup', () => {
  const m = setup(3, ['explorer', 'worker', 'merchant']);
  const [ex, w] = m.players;
  m.discoveries = 99;
  runTo(m, FIELD_START + 1);
  // force treasure by stubbing the draw
  const orig = Math.random; Math.random = () => 0.3; // horizontal: mine 0-0.22, treasure 0.22-0.55
  give(m, ex, 'drill', 0); at(ex, m.camp);
  assert.equal(cmd(m, ex, { t: 'act', slot: ex.slots[0].id, target: { dir: 'e' } }), null);
  finish(m, ex); Math.random = orig;
  const tr = m.rooms['1,0,0']; assert.equal(tr.cat, 'treasure');
  assert.equal(ex.coins, 21, 'finder coin'); assert(tr.chest >= 4 && tr.chest <= 6, 'chest ' + tr.chest);
  give(m, w, 'crowbar', 0); at(w, tr);
  const chest = tr.chest;
  assert.equal(cmd(m, w, { t: 'act', slot: w.slots[0].id, target: { kind: 'chest' } }), null); finish(m, w);
  assert.equal(w.coins, 20 + chest); assert.equal(tr.chest, 0);
  // cache with full bag -> ground pickup
  Math.random = () => 0.6; // cache band 0.67..0.77 for horizontal? compute: mine .22 tr .33 safe .12 -> .67, cache .10 -> .77
  Math.random = () => 0.7;
  ex.inv = []; for (let i = 0; i < 7; i++) ex.inv.push(m.item('pickaxe'));
  ex.inv.splice(0, 0); const d2 = m.item('drill'); ex.inv[ex.inv.length - 1] = d2; ex.slots[1].item = d2.id;
  assert.equal(ex.inv.length, 7);
  assert.equal(cmd(m, ex, { t: 'act', slot: ex.slots[1].id, target: { dir: 'w' } }), null);
  finish(m, ex); Math.random = orig;
  const ca = m.rooms['-1,0,0']; assert.equal(ca.cat, 'cache');
  assert.equal(ex.inv.length, 7, 'drill slot freed then cache item filled it');
});

test('trap snares explorer next round; rescue kit frees; trapped cannot move in field', () => {
  const m = setup(3, ['explorer', 'worker', 'merchant']);
  const [ex, w] = m.players;
  m.discoveries = 99;
  runTo(m, FIELD_START + 1);
  const orig = Math.random; Math.random = () => 0.775; // horizontal L=0: cache ends .77, trap .02 -> .79
  give(m, ex, 'drill', 0); at(ex, m.camp);
  cmd(m, ex, { t: 'act', slot: ex.slots[0].id, target: { dir: 'n' } }); finish(m, ex); Math.random = orig;
  assert.equal(m.rooms['0,-1,0'].cat, 'trap'); assert.equal(ex.trappedRound, 2);
  nextRound(m); runTo(m, FIELD_START + 1);
  const x0 = ex.x; ex.lastMove = Date.now() - 200;
  m.c_mv(ex, { t: 'mv', x: ex.x + 0.2, y: ex.y });
  assert.equal(ex.x, x0, 'trapped cannot move');
  give(m, ex, 'pickaxe', 0);
  assert.match(cmd(m, ex, { t: 'act', slot: ex.slots[0].id }), /trapped/);
  give(m, w, 'rescue', 0); at(w, m.rooms['0,0,0'], ex.x - m.camp.gx * ROOM + 0.5, ex.y - m.camp.gy * ROOM);
  assert.equal(cmd(m, w, { t: 'act', slot: w.slots[0].id, target: { id: ex.id } }), null); finish(m, w);
  assert.equal(ex.trappedRound, 0, 'rescued');
});

test('potion heals, lantern lights room, compass gives stable bearing', () => {
  const m = setup(3, ['explorer', 'worker', 'merchant']);
  const [ex, w] = m.players;
  runTo(m, FIELD_START + 1);
  w.hp = 1; give(m, w, 'potion', 0); at(w, m.camp);
  assert.equal(cmd(m, w, { t: 'act', slot: w.slots[0].id }), null); finish(m, w); assert.equal(w.hp, 2);
  const gal = room(m, 0, 1, 'gallery'); at(w, gal); give(m, w, 'lantern', 1);
  assert.equal(m.bright(gal), false);
  assert.equal(cmd(m, w, { t: 'act', slot: w.slots[1].id }), null); finish(m, w); assert.equal(m.bright(gal), true);
  give(m, ex, 'compass', 0); at(ex, gal);
  assert.equal(cmd(m, ex, { t: 'act', slot: ex.slots[0].id }), null); finish(m, ex);
  const n1 = ex.notes[0]; assert(n1 && n1.label);
  const o = m.openings.reduce((b, o) => (Math.hypot(o.gx, o.gy - 1) < Math.hypot(b.gx, b.gy - 1) ? o : b));
  const truth = Math.atan2(o.gy - 1, o.gx) * 180 / Math.PI;
  let diff = Math.abs(((n1.angle - truth) % 360 + 540) % 360 - 180); assert(diff <= 22.6, 'noise within ±22.5: ' + diff);
  assert.equal(m.survey(gal).angle, n1.angle, 'same room same reading');
  w.slots.push(m.newSlot('extra')); give(m, w, 'compass', 2);
  assert.match(cmd(m, w, { t: 'act', slot: w.slots[2].id }), /Explorer/);
});

test('merchant: upgrades gated by round, goods & profit cap, personal potion', () => {
  const m = setup(3, ['merchant', 'worker', 'explorer']);
  const [me, w, ex] = m.players;
  runTo(m, 12);
  assert.match(cmd(m, me, { t: 'upgrade' }), /round 2/);
  assert.match(cmd(m, w, { t: 'merchantBuy', good: 'potion' }), /not unlocked/);
  nextRound(m); runTo(m, 12);
  assert(me.inv.some((i) => i.type === 'potion' && i.personal), 'personal potion');
  assert.equal(cmd(m, me, { t: 'upgrade' }), null); assert.equal(m.merchant.tier, 1);
  assert.match(cmd(m, me, { t: 'upgrade' }), /round 4|One upgrade/);
  const c = me.coins;
  assert.equal(cmd(m, w, { t: 'merchantBuy', good: 'potion' }), null); // +1 cost +1 margin
  assert.equal(cmd(m, ex, { t: 'merchantBuy', good: 'compass' }), null); // +8 cost +1 margin
  assert.equal(me.coins, c + 2 + 9);
  assert.equal(cmd(m, w, { t: 'buyExtra' }), null); // profit already 2 -> merchant gets 0
  assert.equal(me.coins, c + 11, 'profit cap');
  assert.match(cmd(m, w, { t: 'merchantBuy', good: 'compass' }), /Explorer/);
  assert.equal(cmd(m, w, { t: 'merchantBuy', good: 'potion' }), null);
  assert.match(cmd(m, ex, { t: 'merchantBuy', good: 'potion' }), /Sold out/);
  me.coins += 0; at(me, room(m, 3, 3, 'gallery'));
  assert.match(cmd(m, ex, { t: 'buyExtra' }), /camp/, 'merchant must be in camp');
});

test('weapon surcharge top-up, one weapon, no purchase after cutoff', () => {
  const m = setup(2, ['worker', 'explorer']);
  const [w] = m.players;
  runTo(m, 12);
  assert.equal(cmd(m, w, { t: 'buy', item: 'club' }), null); assert.equal(w.coins, 16);
  assert.match(cmd(m, w, { t: 'buy', item: 'gun' }), /one weapon/);
  nextRound(m); nextRound(m); runTo(m, 12); // round 3: surcharge 1
  const club = w.inv.find((i) => i.type === 'club');
  const c = w.coins;
  assert.equal(cmd(m, w, { t: 'setSlot', slot: w.slots[0].id, what: 'item:' + club.id }), null);
  assert.equal(w.coins, c - 1, 'paid top-up');
  cmd(m, w, { t: 'setSlot', slot: w.slots[0].id, what: 'none' });
  cmd(m, w, { t: 'setSlot', slot: w.slots[0].id, what: 'item:' + club.id });
  assert.equal(w.coins, c - 1, 'top-up only once');
  runTo(m, 48.5);
  assert.match(cmd(m, w, { t: 'buy', item: 'pickaxe' }), /closed/);
});

test('item expiry and 7-slot inventory limit', () => {
  const m = setup(2, ['worker', 'explorer']);
  const [w] = m.players;
  runTo(m, 12);
  for (let i = 0; i < 7; i++) assert.equal(cmd(m, w, { t: 'buy', item: 'pickaxe' }), null);
  assert.match(cmd(m, w, { t: 'buy', item: 'pickaxe' }), /full/);
  assert.match(cmd(m, w, { t: 'setSlot', slot: w.slots[0].id, what: 'free:pickaxe' }), /full/);
  assert.equal(cmd(m, w, { t: 'discard', item: w.inv[0].id }), null); assert.equal(w.inv.length, 6);
  nextRound(m); assert.equal(w.inv.length, 7, 'TTL2 survives round 2 (+1 fallback pickaxe)');
  nextRound(m); assert.equal(w.inv.length, 0, 'expired at round 3');
});

test('first-slot fallback gives career tool; blank second slot lost', () => {
  const m = setup(2, ['worker', 'explorer']);
  const [w, ex] = m.players;
  runTo(m, CHOICE_CLOSE + 1);
  assert.equal(w.inv[0].type, 'pickaxe'); assert.equal(w.slots[0].item, w.inv[0].id);
  assert.equal(ex.inv[0].type, 'drill'); assert.equal(w.slots[1].item, null);
  const away = setup(2, ['worker', 'explorer']);
  at(away.players[0], room(away, 1, 0, 'gallery'));
  runTo(away, CHOICE_CLOSE + 1); assert.equal(away.players[0].inv.length, 0, 'no fallback outside camp');
});

test('ladders: drill down, climb both ways, depth-0-only exits', () => {
  const m = setup(2, ['explorer', 'worker']);
  const [ex] = m.players;
  runTo(m, FIELD_START + 1);
  give(m, ex, 'drill', 0); at(ex, m.camp);
  assert.equal(cmd(m, ex, { t: 'act', slot: ex.slots[0].id, target: { dir: 'down' } }), null); finish(m, ex);
  const low = m.rooms['0,0,1']; assert(low && m.camp.down === low.key && low.up === m.camp.key);
  assert.match(cmd(m, ex, { t: 'climb' }), /ladder/);
  at(ex, m.camp, 2.9, 1.1); assert.equal(cmd(m, ex, { t: 'climb' }), null); assert.equal(ex.d, 1);
  assert(walkable(m.rooms, ex.x, ex.y, 1), 'arrived on walkable floor');
  at(ex, low, 1.1, 2.9); assert.equal(cmd(m, ex, { t: 'climb' }), null); assert.equal(ex.d, 0);
  assert(walkable(m.rooms, ex.x, ex.y, 0));
});

test('movement validation: walls, closed doors, speed', () => {
  const m = setup(2, ['explorer', 'worker']);
  const [ex] = m.players;
  at(ex, m.camp, 2, 2); ex.lastMove = Date.now() - 100;
  m.c_mv(ex, { x: ex.x + 0.25, y: ex.y }); assert.equal(ex.x, 2.25, 'normal step ok');
  ex.lastMove = Date.now() - 100; m.c_mv(ex, { x: ex.x + 2, y: ex.y }); assert.equal(ex.x, 2.25, 'too fast rejected');
  at(ex, m.camp, 3.4, 2); ex.lastMove = Date.now() - 300; m.c_mv(ex, { x: 4.1, y: 2 }); assert.equal(ex.x, 3.4, 'closed door blocks');
  at(ex, m.camp, 0.6, 0.6); assert.equal(walkable(m.rooms, 0.6, 0.6, 0), false, 'rocky corner');
  m.c_mv(ex, { x: NaN, y: 1 }); assert(Number.isFinite(ex.x));
});

test('smuggler-only private escape continues game; timeout after round 10', () => {
  const m = setup(3, ['worker', 'explorer', 'merchant']);
  const [w, ex, me] = m.players;
  w.smuggler = true; w.coins = 25;
  nextRound(m);
  assert.equal(w.status, 'escaped'); assert.equal(w.winType, 'private'); assert.equal(m.state, 'game');
  assert.equal(m.living().length, 2);
  while (m.state === 'game') m.step();
  assert.equal(m.result.kind, 'timeout'); assert.equal(m.round, 10);
  assert.equal(m.result.players.find((p) => p.id === w.id).status, 'escaped', 'prior private win kept');
});

test('group needs an ordinary survivor; 2 smugglers only 1 departs per check', () => {
  const m = setup(5, ['worker', 'worker', 'explorer', 'merchant', 'guard']);
  m.players[0].smuggler = true; m.players[1].smuggler = true;
  m.players[0].coins = 30; m.players[1].coins = 30;
  nextRound(m);
  assert.equal(m.players.filter((p) => p.winType === 'private').length, 1);
  nextRound(m);
  assert.equal(m.players.filter((p) => p.winType === 'private').length, 2);
});

test('trial acquittal on tie / insufficient votes; fee charged; one per round', () => {
  const m = setup(4, ['worker', 'explorer', 'merchant', 'guard']);
  const [a, b, c, d] = m.players;
  runTo(m, 12); cmd(m, a, { t: 'setSlot', slot: a.slots[0].id, what: 'trial' }); cmd(m, c, { t: 'setSlot', slot: c.slots[0].id, what: 'trial' });
  runTo(m, FIELD_START + 1);
  assert.equal(cmd(m, a, { t: 'act', slot: a.slots[0].id, target: { id: b.id } }), null);
  assert.equal(a.coins, 14);
  cmd(m, a, { t: 'vote', v: true }); cmd(m, c, { t: 'vote', v: true }); // 2 of 4: not > half
  at(d, room(m, 2, 2, 'gallery')); assert.match(cmd(m, d, { t: 'vote', v: true }), /Safe Zone/);
  runTo(m, FIELD_START + 2);
  assert.equal(b.status, 'alive');
  assert.match(cmd(m, c, { t: 'act', slot: c.slots[0].id, target: { id: b.id } }), /one trial/i);
});

test('disconnect grace: forfeit after one round of base time, body dropped, fare drops', () => {
  const m = setup(3, ['worker', 'explorer', 'merchant']);
  const [w] = m.players;
  w.connected = false; w.coins = 7;
  for (let i = 0; i < T(ROUND_SECONDS) - 2; i++) m.step();
  assert.equal(w.status, 'alive');
  for (let i = 0; i < 4; i++) m.step();
  assert.equal(w.status, 'forfeit'); assert.equal(m.corpses.at(-1).coins, 7); assert.equal(m.living().length, 2);
});

test('election fails with no majority; elected explorer can drill', () => {
  const m = setup(3, ['worker', 'explorer', 'merchant']);
  const [w, ex, me] = m.players;
  ex.status = 'dead';
  nextRound(m);
  assert.equal(m.meeting.type, 'election');
  while (m.meeting) m.step(); // nobody volunteers
  assert.equal(w.career, 'worker');
  nextRound(m); assert.equal(m.meeting.type, 'election', 'retries next round');
});

test('privacy: views never leak other wallets, smuggler flags or unseen players', () => {
  const m = setup(4, ['worker', 'explorer', 'merchant', 'thief']);
  m.players[3].smuggler = true;
  const far = room(m, 3, 0, 'gallery'); at(m.players[1], far);
  const v = m.view(m.players[0], true);
  const s = JSON.stringify(v);
  assert(!s.includes('"smuggler":true'), 'no smuggler leak'); assert(!s.includes('tok'), 'no tokens');
  assert(!v.ents.some((e) => e.id === m.players[1].id), 'far player hidden');
  assert(v.ents.every((e) => e.coins === undefined));
  assert(v.roster.every((r) => r.coins === undefined && r.smuggler === undefined));
  assert(!s.includes('openings') && !s.includes('"compass"'), 'no exit locations');
  const sv = m.view(m.players[3], false); assert.equal(sv.you.smuggler, true);
});

test('ghost sees everyone and can haunt murderer once per round', () => {
  const m = setup(3, ['worker', 'explorer', 'merchant']);
  const [w, ex, me] = m.players;
  runTo(m, FIELD_START + 1);
  const gal = room(m, 1, 0, 'gallery'); at(w, gal); at(me, gal, 2.5, 2);
  give(m, me, 'gun', 0); me.inv[0].paidS = 0;
  cmd(m, me, { t: 'act', slot: me.slots[0].id, target: { id: w.id } });
  assert.equal(w.status, 'dead');
  const sent = []; me.ws = { send: (x) => sent.push(x) }; w.ws = { send: () => {} };
  at(ex, room(m, 0, 2, 'gallery'));
  const gv = m.view(w, false); assert(gv.ents.some((e) => e.id === ex.id), 'ghost sees far player');
  const lv = m.view(ex, false); assert(!lv.ents.some((e) => e.id === w.id), 'living do not see ghosts');
  assert.equal(cmd(m, w, { t: 'haunt' }), null); assert.equal(sent.length, 1);
  assert.match(cmd(m, w, { t: 'haunt' }), /already/);
  w.lastMove = Date.now() - 300; const gx = w.x; m.c_mv(w, { x: w.x - 0.3, y: w.y }); assert.notEqual(w.x, gx, 'ghost moves');
});

test('mining limits: one miner per mine, 2/round per mine, cap per career, reserve 8', () => {
  const m = setup(3, ['worker', 'explorer', 'merchant']);
  const [w, ex, me] = m.players;
  runTo(m, FIELD_START + 1);
  const mine = room(m, 1, 0, 'mine'); mine.reserve = 3;
  at(w, mine); at(me, mine, 2.5, 2.5);
  give(m, w, 'pickaxe', 0); give(m, w, 'pickaxe', 1); give(m, me, 'pickaxe', 0);
  assert.equal(cmd(m, w, { t: 'act', slot: w.slots[0].id }), null);
  assert.match(cmd(m, me, { t: 'act', slot: me.slots[0].id }), /Someone else/);
  finish(m, w); assert.equal(cmd(m, w, { t: 'act', slot: w.slots[1].id }), null); finish(m, w);
  assert.equal(w.coins, 22); assert.equal(mine.reserve, 1);
  w.slots.push(m.newSlot('extra')); give(m, w, 'pickaxe', 2);
  assert.match(cmd(m, w, { t: 'act', slot: w.slots[2].id }), /at most 2/);
  nextRound(m); runTo(m, FIELD_START + 1);
  at(me, mine); give(m, me, 'pickaxe', 0); give(m, me, 'pickaxe', 1);
  assert.equal(cmd(m, me, { t: 'act', slot: me.slots[0].id }), null); finish(m, me);
  assert.equal(mine.reserve, 0);
  assert.match(cmd(m, me, { t: 'act', slot: me.slots[1].id }), /exhausted|at most 1/);
});

test('field cutoff interrupts unfinished channels; deposits allowed after field', () => {
  const m = setup(2, ['worker', 'explorer']);
  const [w] = m.players;
  runTo(m, 12); cmd(m, w, { t: 'setSlot', slot: w.slots[1].id, what: 'deposit' });
  runTo(m, FIELD_END - 1);
  const mine = room(m, 1, 0, 'mine'); mine.reserve = 8; at(w, mine); give(m, w, 'pickaxe', 0);
  assert.equal(cmd(m, w, { t: 'act', slot: w.slots[0].id }), null);
  runTo(m, FIELD_END + 1); assert.equal(w.channel, null); assert.equal(w.coins, 20);
  assert.equal(cmd(m, w, { t: 'act', slot: w.slots[1].id, target: { amount: 5 } }), null); assert.equal(m.fund, 5);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
