// Mine Escape — authoritative multiplayer server (HTTP static files + WebSocket).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import {
  ROOM, SPEED, TICK_HZ, ROUND_SECONDS, SHOP_CLOSE, CHOICE_CLOSE, FIELD_START, FIELD_END, ROUNDS, FARE,
  SMUGGLER_FARE, INVENTORY, phaseAt, surcharge, CAREERS, ITEMS, MERCHANT_GOODS, UPGRADES, weaponPrice, trialFee,
  DIRS, OPP, cellKey, LADDER, LADDER_UP, walkable, roomAt,
} from './public/shared.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const SPEEDUP = Number(process.env.SPEEDUP || 1); // test-only: run the clock faster
const T = (sec) => Math.round(sec * TICK_HZ);
const ROUND_T = T(ROUND_SECONDS);
const CHANNEL_T = T(3);
const SCAV_T = T(1);
const MAX_GRID = 20;
const MAX_DEPTH = 3;

const rnd = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rnd(arr.length)];
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
let uid = 1;
const newId = (p) => `${p}${uid++}`;

// ---------------------------------------------------------------- static files
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml' };
const PUBLIC = path.join(__dirname, 'public');
const server = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p === '/' || p.startsWith('/room/')) p = '/index.html';
  if (p === '/healthz') { res.writeHead(200); res.end('ok'); return; }
  const file = path.normalize(path.join(PUBLIC, p));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': p.startsWith('/assets/') ? 'public, max-age=86400' : 'no-cache' });
    res.end(data);
  });
});

// ---------------------------------------------------------------- matches
const timers = [];
const matches = new Map(); // code -> Match
const sessions = new Map(); // token -> { code, pid }

function newCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  for (;;) { const c = Array.from({ length: 4 }, () => A[rnd(A.length)]).join(''); if (!matches.has(c)) return c; }
}

const ROSTERS = {
  2: ['worker', 'explorer'],
  3: ['worker', 'explorer', 'merchant'],
  4: ['worker', 'explorer', 'merchant', 'S'],
  5: ['worker', 'worker', 'explorer', 'merchant', 'S'],
  6: ['worker', 'worker', 'explorer', 'explorer', 'merchant', 'S'],
  7: ['worker', 'worker', 'explorer', 'explorer', 'merchant', 'S', 'S'],
  8: ['worker', 'worker', 'explorer', 'explorer', 'merchant', 'guard', 'thief', 'scavenger'],
};
const SEAT_COLORS = ['#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#f032e6', '#bfef45'];

class Match {
  constructor(code) {
    this.code = code;
    this.state = 'lobby';
    this.players = []; // seat order
    this.settings = { specialist: 'random' };
    this.createdAt = Date.now();
    this.log = [];
  }

  // ---------- helpers
  P(id) { return this.players.find((p) => p.id === id); }
  living() { return this.players.filter((p) => p.status === 'alive'); }
  room(p) { return roomAt(this.rooms, p.x, p.y, p.d); }
  inCamp(p) { const r = p.status === 'alive' && this.room(p); return !!(r && r.safe); }
  get sec() { return this.t / TICK_HZ; }
  phase() { return phaseAt(this.sec).id; }
  pub(msg) { this.log.push({ round: this.round, msg }); if (this.log.length > 40) this.log.shift(); }
  tell(p, msg, kind = 'info') { p.events.push({ msg, kind }); }
  bright(r) { return r.safe || (r.lightUntil && r.lightUntil >= this.round); }
  priority() { // rotating original-seat order
    const n = this.players.length, s = (this.round - 1) % n;
    return this.players.map((_, i) => this.players[(s + i) % n]);
  }
  canSee(a, b) { // living viewer a sees living b
    if (a.d !== b.d) return false;
    const ra = this.room(a), rb = roomAt(this.rooms, b.x, b.y, b.d);
    if (!ra || ra !== rb) return false;
    return this.bright(ra) || dist(a, b) <= 2.6;
  }

  // ---------- lobby
  addPlayer(name, token) {
    const taken = new Set(this.players.map((p) => p.seat));
    let seat = 0; while (taken.has(seat)) seat++;
    const p = {
      id: `P${seat + 1}`, seat, name, token, ws: null, connected: true, ready: false, events: [], color: SEAT_COLORS[seat],
      lobbyLeftAt: null,
    };
    this.players.push(p); this.players.sort((a, b) => a.seat - b.seat);
    this.clearReady();
    return p;
  }
  clearReady() { for (const p of this.players) p.ready = false; }

  lobbyCmd(p, m) {
    if (m.t === 'ready') { p.ready = !!m.v; this.tryStart(); }
    else if (m.t === 'setting' && ['random', 'guard', 'thief', 'scavenger'].includes(m.specialist)) {
      this.settings.specialist = m.specialist; this.clearReady();
    } else if (m.t === 'leave') { this.removeFromLobby(p); }
  }
  removeFromLobby(p) {
    this.players = this.players.filter((x) => x !== p); sessions.delete(p.token); this.clearReady();
    if (p.ws) p.ws.send(JSON.stringify({ t: 'left' }));
  }
  tryStart() {
    const n = this.players.length;
    if (n < 2 || n > 8 || !this.players.every((p) => p.ready && p.connected)) return;
    this.start();
  }

  // ---------- game start
  start() {
    const n = this.players.length;
    let specs = this.settings.specialist === 'random' ? shuffle(['guard', 'thief', 'scavenger']) : [this.settings.specialist, ...shuffle(['guard', 'thief', 'scavenger'].filter((s) => s !== this.settings.specialist))];
    const roster = ROSTERS[n].map((c) => (c === 'S' ? specs.shift() : c));
    shuffle(roster);
    const smugglers = n <= 4 ? rnd(2) : 1 + rnd(2);
    const smugSeats = new Set(shuffle(this.players.map((p) => p.id)).slice(0, smugglers));
    const seenCareer = {};
    this.state = 'game';
    this.startCount = n;
    this.round = 0; this.t = 0;
    this.fund = 0; this.meeting = null; this.mapVersion = 1;
    this.discoveries = 0; this.guaranteedMines = n >= 5 ? 2 : 1;
    this.merchant = { tier: 0, invested: 0, upgradedRound: 0, open: true, sales: 0, profit: 0, sold: {} };
    this.guard = { open: true, sold: {} };
    this.trialRound = 0;
    this.corpses = []; this.log = [];
    this.rooms = {};
    const camp = this.makeRoom(0, 0, 0, 'camp');
    camp.dist = 0;
    this.openings = this.makeOpenings();
    this.players.forEach((p, i) => {
      const career = roster[i];
      seenCareer[career] = (seenCareer[career] || 0) + 1;
      Object.assign(p, {
        career, appearance: (career === 'worker' || career === 'explorer') && seenCareer[career] === 2 ? `${career}-02` : career,
        smuggler: smugSeats.has(p.id), coins: 2, hp: 3, status: 'alive', winType: null,
        x: 2 + Math.cos(i * 0.785) * 0.9, y: 2.2 + Math.sin(i * 0.785) * 0.7, d: 0,
        inv: [], slots: [], extras: 0, freeIssued: 0, trappedRound: 0, lockRound: 0, shieldRound: 0,
        attackedRound: 0, mined: { round: 0, count: 0, mine: null }, contrib: 0, luck: 0, murderer: null, hauntRound: 0,
        notes: [], channel: null, disco: 0, lastMove: Date.now(),
        stats: { mined: 0, rooms: 0, deposited: 0, looted: 0, traps: 0, kills: 0, rescues: 0 },
      });
    });
    this.pub(`The mine collapsed behind you! ${n} players must escape within ${ROUNDS} rounds.`);
    this.beginRound();
  }

  makeOpenings() {
    const out = [];
    const base = Math.random() * Math.PI * 2;
    for (let k = 0; k < 3; k++) {
      for (let tries = 0; tries < 200; tries++) {
        const a = base + (k * 2 * Math.PI) / 3 + (Math.random() - 0.5) * 0.8;
        const L = 14 + rnd(3);
        const fx = Math.cos(a), fy = Math.sin(a);
        const s = L / (Math.abs(fx) + Math.abs(fy));
        const gx = Math.round(fx * s), gy = Math.round(fy * s);
        const md = Math.abs(gx) + Math.abs(gy);
        if (md >= 14 && md <= 16 && Math.abs(gx) <= MAX_GRID && Math.abs(gy) <= MAX_GRID && !out.some((o) => o.gx === gx && o.gy === gy)) { out.push({ id: k, gx, gy }); break; }
      }
    }
    return out;
  }

  makeRoom(gx, gy, d, cat) {
    const theme = { camp: 'central_camp', safe: 'crystal_safe_zone', mine: 'coin_mine', treasure: 'treasure_vault', cache: 'supply_cache', trap: 'trap_gallery', gallery: 'empty_junction' }[cat];
    const r = {
      key: cellKey(gx, gy, d), gx, gy, d, cat, theme, safe: cat === 'camp' || cat === 'safe',
      doors: { n: false, e: false, s: false, w: false }, up: null, down: null, lightUntil: 0, dist: 99,
      opening: false, reserve: 0, mineRound: 0, mineCount: 0, miner: null, chest: 0, chestClaim: null, pickup: null, pickupClaim: null, triggered: false,
    };
    this.rooms[r.key] = r; this.mapVersion++;
    return r;
  }

  // ---------- round flow
  beginRound() {
    this.round++; this.t = 0;
    this.merchant.sales = 0; this.merchant.profit = 0; this.merchant.sold = {};
    this.guard.sold = {};
    for (const p of this.players) {
      if (p.status !== 'alive') continue;
      p.inv = p.inv.filter((it) => this.round <= it.issued + ITEMS[it.type].ttl - 1);
      p.slots = [this.newSlot('free'), this.newSlot('free')];
      p.extras = 0; p.freeIssued = 0; p.channel = null;
      if (p.career === 'merchant') {
        const own = p.inv.filter((it) => it.type === 'potion' && it.personal).length;
        if (own < 3 && p.inv.length < INVENTORY) { p.inv.push(this.item('potion', { personal: true })); this.tell(p, 'Merchant perk: you received a personal healing potion.'); }
      }
      if (p.trappedRound === this.round) this.tell(p, 'You are trapped this round: no field movement or physical work (a rescue kit can free you).', 'warn');
    }
    this.pub(`Round ${this.round} begins. Walk to a camp and prepare.`);
    const explorers = this.living().filter((p) => p.career === 'explorer');
    if (explorers.length === 0 && this.living().length > 0) {
      this.meeting = { type: 'election', remaining: T(20), total: T(20), electorate: this.living().map((p) => p.id), volunteers: [], votes: {} };
      this.pub('No Explorer remains! Election meeting: volunteer in camp, then vote for a new Explorer.');
    }
  }
  newSlot(kind) { return { id: newId('s'), kind, item: null, marker: null, used: false, target: null, service: null }; }
  item(type, extra = {}) { return { id: newId('i'), type, issued: this.round, ...extra }; }

  step() {
    if (this.state !== 'game') return;
    // disconnect grace (base time; paused during meetings)
    for (const p of this.players) {
      if (!p.connected && (p.status === 'alive' || p.status === 'dead') && !this.meeting) {
        p.disco++;
        if (p.disco >= ROUND_T) this.forfeit(p);
      }
    }
    if (this.meeting) { this.stepMeeting(); this.stepChannels(); return; }
    this.t++;
    const t = this.t;
    if (t === T(CHOICE_CLOSE)) this.closeChoices();
    if (t === T(FIELD_END)) for (const p of this.players) if (p.channel) this.cancelChannel(p, 'Field time ended before your action finished.');
    this.stepChannels();
    if (t >= ROUND_T) this.endRound();
  }

  closeChoices() {
    // first-slot fallback
    for (const p of this.living()) {
      const s = p.slots[0];
      if (s && !s.item && !s.marker && p.freeIssued < 2) {
        const type = CAREERS[p.career].preset;
        if (this.inCamp(p) && p.inv.length < INVENTORY) {
          const it = this.item(type); p.inv.push(it); s.item = it.id; p.freeIssued++;
          this.tell(p, `You left slot 1 empty, so your career tool (${ITEMS[type].name}) was equipped.`, 'warn');
        } else this.tell(p, 'Slot 1 was left empty and no fallback tool could be delivered.', 'warn');
      }
    }
    // install Guard services
    const g = this.living().find((p) => p.career === 'guard');
    for (const svc of ['lock', 'shield']) {
      const sale = this.guard.sold[svc];
      if (!sale) continue;
      const cust = this.P(sale.customer);
      const slot = g && g.slots.find((s) => s.id === sale.slot);
      if (g && slot && !slot.used) {
        this.useSlot(g, slot);
        if (cust && cust.status === 'alive') {
          if (svc === 'lock') cust.lockRound = this.round; else cust.shieldRound = this.round;
          this.tell(cust, svc === 'lock' ? 'Your wallet lock is active this round.' : 'Your life shield is active this round (blocks one hit).', 'good');
        }
      }
    }
    // silent theft batch
    const opening = {};
    for (const p of this.players) opening[p.id] = p.coins;
    for (const thief of this.priority()) {
      if (thief.status !== 'alive') continue;
      for (const s of thief.slots) {
        if (s.used || !s.target || !this.slotItem(thief, s) || this.slotItem(thief, s).type !== 'hook') continue;
        const v = this.P(s.target);
        if (!v || v.status !== 'alive' || this.room(thief) !== this.room(v) || v.d !== thief.d) continue;
        this.useSlot(thief, s);
        let amt = 0;
        if (v.lockRound !== this.round) {
          amt = Math.min(thief.career === 'thief' ? 2 : 1, opening[v.id], v.coins);
          opening[v.id] -= amt; v.coins -= amt; thief.coins += amt;
        }
        this.tell(thief, `Your hook took ${amt} coin${amt === 1 ? '' : 's'} from ${v.name}.`, amt ? 'good' : 'info');
      }
    }
  }

  endRound() {
    const living = this.living();
    const natural = Object.values(this.rooms).some((r) => r.opening);
    if (natural && living.length) {
      for (const p of living) { p.status = 'escaped'; p.winType = 'natural'; }
      this.pub('Daylight! The natural opening saves every survivor.');
      return this.finish('natural');
    }
    const N = living.length;
    const ordinary = living.filter((p) => !p.smuggler);
    const groupOk = N > 0 && ordinary.length > 0 && this.fund >= FARE * N;
    const smug = this.priority().find((p) => p.status === 'alive' && p.smuggler && p.coins >= SMUGGLER_FARE);
    if (smug) { smug.coins -= SMUGGLER_FARE; smug.status = 'escaped'; smug.winType = 'private'; this.pub(`${smug.name} paid a smuggler and escaped privately!`); }
    if (groupOk) {
      this.fund -= FARE * N;
      for (const p of ordinary) { p.status = 'escaped'; p.winType = 'group'; }
      this.pub(`The escape fund paid the fare (${FARE * N})! The group escapes.`);
      return this.finish('group');
    }
    if (this.living().length === 0) return this.finish('none');
    if (this.round >= ROUNDS) { this.pub('Time is up. The mine seals for good.'); return this.finish('timeout'); }
    this.beginRound();
  }

  finish(kind) {
    this.state = 'over'; this.meeting = null;
    this.result = {
      kind,
      players: this.players.map((p) => ({
        id: p.id, name: p.name, career: p.career, appearance: p.appearance, smuggler: p.smuggler, status: p.status, winType: p.winType,
        contrib: p.contrib, stats: p.stats, color: p.color,
      })),
      fund: this.fund, round: this.round,
    };
  }

  forfeit(p) {
    if (p.status === 'alive') { this.dropCorpse(p); this.pub(`${p.name} lost connection for too long and forfeited.`); }
    p.status = 'forfeit'; p.channel = null;
    if (this.living().length === 0) this.finish('none');
  }

  // ---------- death
  dropCorpse(p) {
    this.corpses.push({ id: newId('c'), x: p.x, y: p.y, d: p.d, coins: p.coins, name: p.name, appearance: p.appearance, color: p.color, halfTaken: false, claim: null });
    p.coins = 0; p.inv = []; p.channel = null; p.slots.forEach((s) => (s.used = true));
    // release reservations
    for (const r of Object.values(this.rooms)) { if (r.chestClaim === p.id) r.chestClaim = null; if (r.pickupClaim === p.id) r.pickupClaim = null; }
    for (const c of this.corpses) if (c.claim === p.id) c.claim = null;
  }
  kill(p, killer) {
    this.dropCorpse(p);
    p.status = 'dead'; p.murderer = killer ? killer.id : null; p.hp = 0;
    if (killer) killer.stats.kills++;
    this.pub(`${p.name} was eliminated.`);
    this.tell(p, killer ? `You were eliminated by ${killer.name}. You are now a ghost: you can drift through walls, see everyone, and haunt ${killer.name} once per round.` : 'You were eliminated.', 'bad');
    if (this.living().length === 0) this.finish('none');
  }

  // ---------- slots & inventory
  slotItem(p, s) { return s.item ? p.inv.find((it) => it.id === s.item) : null; }
  useSlot(p, s) {
    s.used = true;
    if (s.item) { p.inv = p.inv.filter((it) => it.id !== s.item); }
  }
  boundIds(p) { return new Set(p.slots.filter((s) => !s.used && s.item).map((s) => s.item)); }

  // ---------- meetings
  stepMeeting() {
    const m = this.meeting;
    m.remaining--;
    if (m.remaining > 0) return;
    this.meeting = null;
    const need = Math.floor(m.electorate.length / 2) + 1;
    if (m.type === 'trial') {
      const yes = Object.values(m.votes).filter((v) => v).length;
      const acc = this.P(m.accused);
      if (yes >= need && acc && acc.status === 'alive') {
        this.pub(`Trial verdict: GUILTY (${yes} of ${m.electorate.length} needed ${need}). ${acc.name} is executed.`);
        this.kill(acc, this.P(m.caller));
      } else this.pub(`Trial verdict: not enough votes (${yes} yes; ${need} needed). ${acc ? acc.name : 'The accused'} is spared.`);
    } else {
      const tally = {};
      for (const c of Object.values(m.votes)) tally[c] = (tally[c] || 0) + 1;
      const win = Object.entries(tally).find(([c, n]) => n >= need && m.volunteers.includes(c));
      const w = win && this.P(win[0]);
      if (w && w.status === 'alive') {
        w.career = 'explorer'; w.appearance = 'explorer'; w.luck = 0;
        this.pub(`${w.name} was elected and is now an Explorer.`);
      } else this.pub('Election failed: nobody got a majority. Try again next round.');
    }
  }

  // ---------- channels
  startChannel(p, s, kind, target, ticks) {
    p.channel = { slot: s.id, kind, target, remaining: ticks, total: ticks, x: p.x, y: p.y, d: p.d };
    this.useSlot(p, s); // accepted start commits the tool and action
  }
  cancelChannel(p, why) {
    const c = p.channel; if (!c) return;
    p.channel = null;
    this.releaseClaims(p, c);
    if (why) this.tell(p, `Action interrupted: ${why} (the action and tool are spent).`, 'warn');
  }
  releaseClaims(p, c) {
    if (c.kind === 'loot') {
      if (c.target.kind === 'chest') { const r = this.rooms[c.target.room]; if (r && r.chestClaim === p.id) r.chestClaim = null; }
      if (c.target.kind === 'pickup') { const r = this.rooms[c.target.room]; if (r && r.pickupClaim === p.id) r.pickupClaim = null; }
      if (c.target.kind === 'corpse') { const k = this.corpses.find((x) => x.id === c.target.id); if (k && k.claim === p.id) k.claim = null; }
    }
    if (c.kind === 'mine') { const r = this.rooms[c.target.room]; if (r && r.miner === p.id && p.mined.count === 0) r.miner = null; }
    if (c.kind === 'explore') { const r = this.rooms[c.target.room]; if (r && r.drilling) delete r.drilling[c.target.dir]; }
  }
  stepChannels() {
    for (const p of this.players) {
      const c = p.channel; if (!c) continue;
      if (p.status !== 'alive') { p.channel = null; continue; }
      if (Math.hypot(p.x - c.x, p.y - c.y) > 0.05 || p.d !== c.d) { this.cancelChannel(p, 'you moved'); continue; }
      if (this.meeting) continue; // frozen
      if (--c.remaining > 0) continue;
      p.channel = null;
      this.complete(p, c);
    }
  }

  complete(p, c) {
    const r = this.room(p);
    switch (c.kind) {
      case 'mine': {
        const m = this.rooms[c.target.room];
        if (!m || m.reserve <= 0) { this.tell(p, 'The mine was empty.'); break; }
        m.reserve--; m.mineCount++; p.coins++; p.mined.count++; p.stats.mined++;
        this.mapVersion++;
        this.tell(p, `+1 coin mined (${m.reserve} left in this mine).`, 'good');
        break;
      }
      case 'explore': this.discover(p, c.target); break;
      case 'loot': this.finishLoot(p, c.target); break;
      case 'heal': p.hp = Math.min(3, p.hp + 1); this.tell(p, `Healed to ${p.hp} HP.`, 'good'); break;
      case 'rescue': {
        const v = this.P(c.target.id);
        if (v && v.status === 'alive' && v.trappedRound === this.round) { v.trappedRound = 0; p.stats.rescues++; this.tell(v, `You were freed from the trap${v === p ? '' : ` by ${p.name}`}!`, 'good'); if (v !== p) this.tell(p, `You freed ${v.name}.`, 'good'); }
        break;
      }
      case 'lantern': if (r) { r.lightUntil = Math.max(r.lightUntil, c.target.until); this.mapVersion++; this.tell(p, 'Lantern placed: this room is brightly lit.', 'good'); } break;
      case 'survey': {
        const note = this.survey(r);
        p.notes.push(note);
        this.tell(p, `Compass: the nearest exit lies roughly ${note.label} of this room (±45°).`, 'good');
        break;
      }
    }
  }

  survey(r) {
    if (r.compass == null) {
      let best = null, bd = Infinity;
      for (const o of this.openings) { const dd = Math.hypot(o.gx - r.gx, o.gy - r.gy); if (dd < bd - 1e-9) { bd = dd; best = o; } }
      const ang = Math.atan2(best.gy - r.gy, best.gx - r.gx) * 180 / Math.PI;
      r.compass = ang + (Math.random() - 0.5) * 45;
    }
    const names = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];
    const a = ((r.compass % 360) + 360) % 360;
    return { room: r.key, gx: r.gx, gy: r.gy, angle: r.compass, label: names[Math.round(a / 45) % 8] };
  }

  discover(p, tg) {
    const from = this.rooms[tg.room];
    if (from && from.drilling) delete from.drilling[tg.dir];
    let gx = from.gx, gy = from.gy, d = from.d;
    if (tg.dir === 'down') d++; else { gx += DIRS[tg.dir][0]; gy += DIRS[tg.dir][1]; }
    if (this.rooms[cellKey(gx, gy, d)]) { this.tell(p, 'Someone already opened that passage.'); return; }
    const down = tg.dir === 'down';
    const n = this.startCount;
    const dist = from.dist + 1;
    let cat;
    if (this.discoveries < this.guaranteedMines) cat = 'mine';
    else if (dist >= 9) cat = 'safe';
    else {
      const q = [0.02, 0.035, 0.05, 0.06][p.luck];
      const table = down
        ? [['mine', 0.40], ['treasure', 0.15], ['safe', 0.08], ['cache', 0.10], ['trap', q], ['gallery', 0.27 - q]]
        : [['mine', 0.22], ['treasure', 0.33], ['safe', 0.12], ['cache', 0.10], ['trap', q], ['gallery', 0.23 - q]];
      let x = Math.random(); cat = 'gallery';
      for (const [c, w] of table) { if (x < w) { cat = c; break; } x -= w; }
    }
    this.discoveries++;
    p.luck = cat === 'mine' || cat === 'treasure' ? Math.min(3, p.luck + 1) : 0;
    const r = this.makeRoom(gx, gy, d, cat);
    r.dist = cat === 'safe' ? 0 : dist;
    if (down) { from.down = r.key; r.up = from.key; }
    else { from.doors[tg.dir] = true; r.doors[OPP[tg.dir]] = true; }
    if (r.safe) this.recomputeDistances();
    p.stats.rooms++;
    const label = { mine: 'a coin mine', treasure: 'a treasure vault', safe: 'a crystal Safe Zone (new camp!)', cache: 'a supply cache', trap: 'a trap', gallery: 'an empty gallery' }[cat];
    let extra = '';
    if (cat === 'mine') r.reserve = 8;
    if (cat === 'treasure') {
      const [lo, hi] = n <= 3 ? [5, 7] : n <= 5 ? [7, 9] : n === 6 ? [3, 5] : [4, 6];
      const total = lo + rnd(hi - lo + 1);
      p.coins += 1; r.chest = total - 1; extra = ` You took the 1-coin finder's share; ${r.chest} coins remain in the chest (loot it with a crowbar).`;
    }
    if (cat === 'cache') {
      const type = pick(['pickaxe', 'drill', 'hook', 'crowbar']);
      const it = this.item(type);
      if (p.inv.length < INVENTORY) { p.inv.push(it); extra = ` You found a ${ITEMS[type].name}.`; r.triggered = true; }
      else { r.pickup = it; extra = ` A ${ITEMS[type].name} lies here (your bag is full).`; }
    }
    if (cat === 'trap') {
      r.triggered = true; p.stats.traps++;
      if (this.round >= ROUNDS) { p.trappedRound = this.round; extra = ' You are trapped for the rest of the field time!'; }
      else { p.trappedRound = this.round + 1; extra = ' You are snared: next round you cannot move or work during field time.'; }
    }
    if (!down && d === 0 && this.openings.some((o) => o.gx === gx && o.gy === gy)) {
      r.opening = true;
      this.pub(`☀ ${p.name} found a NATURAL OPENING! Every survivor escapes at the end of this round.`);
    }
    this.pub(`${p.name} discovered ${label}${down ? ' (downward)' : ''}.`);
    this.tell(p, `You discovered ${label}.${extra}`, cat === 'trap' ? 'bad' : 'good');
  }

  recomputeDistances() {
    const rooms = Object.values(this.rooms);
    for (const r of rooms) r.dist = r.safe ? 0 : 99;
    const q = rooms.filter((r) => r.safe);
    while (q.length) {
      const r = q.shift();
      const nbrs = [];
      for (const k of Object.keys(DIRS)) if (r.doors[k]) nbrs.push(cellKey(r.gx + DIRS[k][0], r.gy + DIRS[k][1], r.d));
      if (r.up) nbrs.push(r.up); if (r.down) nbrs.push(r.down);
      for (const key of nbrs) { const o = this.rooms[key]; if (o && o.dist > r.dist + 1) { o.dist = r.dist + 1; q.push(o); } }
    }
  }

  finishLoot(p, tg) {
    if (tg.kind === 'chest') {
      const r = this.rooms[tg.room]; r.chestClaim = null;
      const amt = r.chest; r.chest = 0; p.coins += amt; p.stats.looted += amt; this.mapVersion++;
      this.tell(p, `You looted ${amt} coins from the chest.`, 'good');
    } else if (tg.kind === 'pickup') {
      const r = this.rooms[tg.room]; r.pickupClaim = null;
      if (!r.pickup) return;
      if (p.inv.length >= INVENTORY) { this.tell(p, 'Your bag is full; the item stays on the ground.', 'warn'); return; }
      p.inv.push(r.pickup); this.tell(p, `Picked up a ${ITEMS[r.pickup.type].name}.`, 'good'); r.pickup = null; r.triggered = true; this.mapVersion++;
    } else {
      const c = this.corpses.find((x) => x.id === tg.id); if (!c) return;
      c.claim = null;
      let amt;
      if (p.career === 'scavenger') { amt = c.coins; } else { amt = Math.floor(c.coins / 2); c.halfTaken = true; }
      c.coins -= amt; p.coins += amt; p.stats.looted += amt;
      this.tell(p, `You looted ${amt} coins from ${c.name}'s body.`, 'good');
    }
  }

  // ---------- commands during a game
  cmd(p, m) {
    if (this.state !== 'game') return;
    const fn = this['c_' + m.t];
    if (typeof fn !== 'function') return;
    const err = fn.call(this, p, m);
    if (typeof err === 'string') this.tell(p, err, 'error');
  }

  campCheck(p, until) {
    if (p.status !== 'alive') return 'Only living players can do that.';
    if (this.meeting) return 'Not during a meeting.';
    if (!this.inCamp(p)) return 'You must be standing in a camp (Safe Zone).';
    if (until && this.t >= T(until)) return 'Camp choices are closed for this round.';
    return null;
  }
  shopCheck(p) {
    const e = this.campCheck(p, SHOP_CLOSE); if (e) return e;
    if (this.t < T(10)) return 'Shopping opens when the choices phase starts.';
    return null;
  }

  c_mv(p, m) {
    const x = +m.x, y = +m.y, d = p.d;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const now = Date.now();
    const dt = Math.min(0.6, (now - p.lastMove) / 1000);
    const ghost = p.status !== 'alive';
    const reject = () => p.ws && p.ws.send(JSON.stringify({ t: 'pos', x: p.x, y: p.y, d: p.d }));
    if (p.status === 'forfeit') return;
    if (!ghost) {
      const ph = this.phase();
      if (p.trappedRound === this.round && ph === 'field' && !this.meeting) return reject();
      if (this.meeting && this.meeting.type === 'trial' && this.meeting.accused === p.id) return reject();
    }
    const dd = Math.hypot(x - p.x, y - p.y);
    if (dd > SPEED * (ghost ? 1.6 : 1) * dt * 1.5 + 0.35) return reject();
    // validate path in small steps
    const steps = Math.max(1, Math.ceil(dd / 0.2));
    for (let i = 1; i <= steps; i++) {
      const sx = p.x + ((x - p.x) * i) / steps, sy = p.y + ((y - p.y) * i) / steps;
      if (ghost ? !roomAt(this.rooms, sx, sy, d) : !walkable(this.rooms, sx, sy, d)) return reject();
    }
    p.x = x; p.y = y; p.lastMove = now;
  }

  c_climb(p) {
    if (p.status === 'forfeit') return;
    const r = roomAt(this.rooms, p.x, p.y, p.d);
    if (!r) return;
    const near = (a) => Math.hypot(p.x - (r.gx * ROOM + a.x), p.y - (r.gy * ROOM + a.y)) <= 1.0;
    const key = r.down && near(LADDER) ? r.down : r.up && near(LADDER_UP) ? r.up : null;
    if (!key) return 'Walk onto a ladder first.';
    if (p.status === 'alive' && p.trappedRound === this.round && this.phase() === 'field') return 'You are trapped.';
    const target = this.rooms[key];
    if (p.channel) this.cancelChannel(p, 'you climbed');
    const a = key === r.down ? LADDER_UP : LADDER; // arrive at the matching ladder below/above
    p.d = target.d; p.x = r.gx * ROOM + a.x; p.y = r.gy * ROOM + a.y + 0.6; p.lastMove = Date.now();
    if (p.ws) p.ws.send(JSON.stringify({ t: 'pos', x: p.x, y: p.y, d: p.d }));
  }

  c_cancel(p) { if (p.channel) this.cancelChannel(p, 'you cancelled'); }

  c_setSlot(p, m) {
    const e = this.campCheck(p, CHOICE_CLOSE); if (e) return e;
    const s = p.slots.find((x) => x.id === m.slot); if (!s || s.used) return 'Invalid slot.';
    if (s.service) return 'This kit is committed to a paid Guard service.';
    const what = String(m.what || 'none');
    if (what === 'none') { Object.assign(s, { item: null, marker: null, target: null }); return; }
    if (what === 'deposit' || what === 'trial') { Object.assign(s, { item: null, marker: what, target: null }); return; }
    if (what.startsWith('free:')) {
      const type = what.slice(5);
      if (s.kind !== 'free' || s.freeIssued) return 'Only a free slot can issue a free tool (once).';
      if (!ITEMS[type] || !ITEMS[type].basic) return 'Not a basic tool.';
      if (ITEMS[type].career && ITEMS[type].career !== p.career) return `Only the ${CAREERS[ITEMS[type].career].name} can use that.`;
      if (p.inv.length >= INVENTORY) return 'Your bag is full (7 items). Discard something first.';
      const it = this.item(type); p.inv.push(it); s.freeIssued = true; p.freeIssued++;
      Object.assign(s, { item: it.id, marker: null, target: null });
      return;
    }
    if (what.startsWith('item:')) {
      const id = what.slice(5);
      const it = p.inv.find((x) => x.id === id); if (!it) return 'You do not have that item.';
      if (this.boundIds(p).has(id) && s.item !== id) return 'That item is already in another slot.';
      const def = ITEMS[it.type];
      if (def.career && def.career !== p.career) return `Only the ${CAREERS[def.career].name} can use that.`;
      if (def.weapon) {
        const due = surcharge(this.round) - (it.paidS || 0);
        if (due > 0) {
          if (p.coins < due) return `This weapon needs a ${due}-coin price top-up to equip this round.`;
          p.coins -= due; it.paidS = surcharge(this.round);
          this.tell(p, `Paid a ${due}-coin weapon surcharge top-up.`);
        }
      }
      Object.assign(s, { item: id, marker: null, target: null });
    }
  }

  c_setTheft(p, m) {
    const e = this.campCheck(p, CHOICE_CLOSE); if (e) return e;
    const s = p.slots.find((x) => x.id === m.slot);
    if (!s || s.used || !this.slotItem(p, s) || this.slotItem(p, s).type !== 'hook') return 'Put a hook in that slot first.';
    if (!m.target) { s.target = null; return; }
    const v = this.P(m.target);
    if (!v || v === p || v.status !== 'alive' || this.room(v) !== this.room(p)) return 'Target must be in your camp.';
    if (p.slots.some((o) => o !== s && o.target === v.id && !o.used)) return 'Each hook needs a different target.';
    s.target = v.id;
  }

  c_discard(p, m) {
    if (p.status !== 'alive' || !this.inCamp(p) || this.meeting) return 'Discard only in camp.';
    const it = p.inv.find((x) => x.id === m.item); if (!it) return;
    const s = p.slots.find((x) => x.item === it.id && !x.used);
    if (s && s.service) return 'That kit is committed to a paid service.';
    if (s) { s.item = null; s.target = null; }
    p.inv = p.inv.filter((x) => x !== it);
  }

  c_buy(p, m) { // machine terminal
    const e = this.shopCheck(p); if (e) return e;
    const type = m.item, def = ITEMS[type];
    if (!def || !(def.basic || def.weapon || type === 'lantern')) return 'Not sold at the machine.';
    if (def.career && def.career !== p.career) return `Only the ${CAREERS[def.career].name} can buy that.`;
    let price = def.basic ? 1 : def.weapon ? weaponPrice(type, this.round) : def.price;
    if (def.weapon && p.inv.some((it) => ITEMS[it.type].weapon)) return 'You may own only one weapon.';
    if (p.inv.length >= INVENTORY) return 'Your bag is full (7 items).';
    if (p.coins < price) return 'Not enough coins.';
    p.coins -= price;
    p.inv.push(this.item(type, def.weapon ? { paidS: surcharge(this.round) } : {}));
    this.tell(p, `Bought ${def.name} for ${price}.`);
  }

  merchantP() { return this.living().find((x) => x.career === 'merchant'); }

  c_buyExtra(p) {
    const e = this.shopCheck(p); if (e) return e;
    const mer = this.merchantP();
    if (!mer) return 'There is no living Merchant.';
    if (mer !== p && (!this.merchant.open || !this.inCamp(mer))) return 'The Merchant must be in a camp and open for business.';
    if (p.extras >= 2) return 'At most 2 extra actions (4 total).';
    const price = this.merchant.sales + 1;
    if (p.coins < price) return `An extra action costs ${price} now.`;
    p.coins -= price;
    if (mer !== p) { const cut = Math.min(1, 2 - this.merchant.profit); mer.coins += cut; this.merchant.profit += cut; this.tell(mer, `Sold an extra action to ${p.name} (+${cut} profit).`); }
    this.merchant.sales++; p.extras++;
    p.slots.push(this.newSlot('extra'));
    this.tell(p, `Bought an extra action slot for ${price}.`);
  }

  c_merchantBuy(p, m) {
    const e = this.shopCheck(p); if (e) return e;
    const g = MERCHANT_GOODS[m.good]; if (!g) return;
    const mer = this.merchantP(); if (!mer) return 'There is no living Merchant.';
    if (this.merchant.tier < g.tier) return 'The Merchant has not unlocked that yet.';
    if (m.good === 'compass' && p.career !== 'explorer') return 'Only Explorers can buy a compass.';
    if (m.good === 'compass' && this.round < 2) return 'Compasses are available from round 2.';
    if ((this.merchant.sold[m.good] || 0) >= 2) return 'Sold out this round (2 per round).';
    if (p.inv.length >= INVENTORY) return 'Your bag is full (7 items).';
    const self = mer === p;
    if (!self && (!this.merchant.open || !this.inCamp(mer))) return 'The Merchant must be in a camp and open for business.';
    const price = self ? g.cost : g.price;
    if (p.coins < price) return 'Not enough coins.';
    p.coins -= price;
    if (!self) {
      const margin = Math.min(g.price - g.cost, 2 - this.merchant.profit);
      mer.coins += g.cost + margin; this.merchant.profit += margin;
      this.tell(mer, `Sold a ${ITEMS[m.good].name} to ${p.name} (+${margin} profit, ${g.cost} stock cost returned).`);
    }
    this.merchant.sold[m.good] = (this.merchant.sold[m.good] || 0) + 1;
    p.inv.push(this.item(m.good));
    this.tell(p, `Bought ${ITEMS[m.good].name} for ${price}.`);
  }

  c_merchantOpen(p, m) { if (p.career === 'merchant') this.merchant.open = !!m.v; }
  c_upgrade(p) {
    const e = this.shopCheck(p); if (e) return e;
    if (p.career !== 'merchant') return 'Only the Merchant can upgrade.';
    const next = this.merchant.tier + 1, u = UPGRADES[next];
    if (!u) return 'Fully upgraded.';
    if (this.round < u.round) return `Tier ${next} unlocks from round ${u.round}.`;
    if (this.merchant.upgradedRound === this.round) return 'One upgrade per round.';
    if (p.coins < u.cost) return 'Not enough coins.';
    p.coins -= u.cost; this.merchant.tier = next; this.merchant.invested += u.cost; this.merchant.upgradedRound = this.round;
    this.pub(`The Merchant unlocked catalog tier ${next}.`);
  }

  c_guardOpen(p, m) { if (p.career === 'guard') this.guard.open = !!m.v; }
  c_guardBuy(p, m) {
    const e = this.shopCheck(p); if (e) return e;
    const svc = m.svc; if (svc !== 'lock' && svc !== 'shield') return;
    const g = this.living().find((x) => x.career === 'guard');
    if (!g) return 'There is no living Guard.';
    if (g === p) return 'The Guard cannot hire themself.';
    if (!this.guard.open || !this.inCamp(g)) return 'The Guard must be in a camp and open for business.';
    if (g.trappedRound === this.round) return 'The Guard is trapped this round.';
    if (this.guard.sold[svc]) return 'The Guard already sold that service this round.';
    const slot = g.slots.find((s) => !s.used && !s.service && this.slotItem(g, s) && this.slotItem(g, s).type === 'kit');
    if (!slot) return 'The Guard has no free protection kit in an action slot.';
    const price = svc === 'lock' ? 1 : 2;
    if (p.coins < price) return 'Not enough coins.';
    p.coins -= price; g.coins += price;
    slot.service = svc;
    this.guard.sold[svc] = { customer: p.id, slot: slot.id };
    this.pub(`${p.name} hired the Guard for a ${svc === 'lock' ? 'wallet lock' : 'life shield'}.`);
    this.tell(g, `${p.name} bought a ${svc === 'lock' ? 'wallet lock' : 'life shield'} (+${price}). It installs at choice close using your kit.`);
  }

  // field action using a prepared slot
  c_act(p, m) {
    if (p.status !== 'alive') return 'You are not alive.';
    if (this.meeting) return 'Not during a meeting.';
    const s = p.slots.find((x) => x.id === m.slot);
    if (!s || s.used) return 'That action is not available.';
    const ph = this.phase();
    const r = this.room(p);
    const tg = m.target || {};
    if (s.marker === 'deposit') {
      if (!['field', 'return', 'settlement'].includes(ph)) return 'Deposits work during field, return and settlement.';
      const amt = Math.floor(+tg.amount);
      if (!(amt >= 1) || amt > p.coins) return 'Choose an amount you can afford.';
      s.used = true; p.coins -= amt; this.fund += amt; p.contrib += amt; p.stats.deposited += amt;
      this.pub(`${p.name} contributed ${amt} coin${amt === 1 ? '' : 's'} to the escape fund.`);
      return;
    }
    if (ph !== 'field') return 'Physical actions only during field time.';
    if (s.marker === 'trial') return this.startTrial(p, s, tg);
    if (p.channel) return 'You are already busy with an action.';
    const it = this.slotItem(p, s);
    if (!it) return 'This slot is empty.';
    const type = it.type;
    const trapped = p.trappedRound === this.round;
    if (trapped && !(type === 'rescue' && (!tg.id || tg.id === p.id))) return 'You are trapped — only a self-rescue works.';
    if (ITEMS[type].weapon) return this.attack(p, s, it, tg);
    switch (type) {
      case 'pickaxe': {
        if (!r || r.cat !== 'mine') return 'Stand in a coin mine to use a pickaxe.';
        if (r.reserve <= 0) return 'This mine is exhausted.';
        if (r.mineRound !== this.round) { r.mineRound = this.round; r.mineCount = 0; r.miner = null; }
        if (p.mined.round !== this.round) p.mined = { round: this.round, count: 0, mine: null };
        const cap = p.career === 'worker' ? 2 : 1;
        if (p.mined.count >= cap) return `You can mine at most ${cap} coin${cap > 1 ? 's' : ''} per round.`;
        if (p.mined.mine && p.mined.mine !== r.key) return 'You can work only one mine per round.';
        if (r.miner && r.miner !== p.id) return 'Someone else is working this mine this round.';
        if (r.mineCount >= 2) return 'This mine already produced 2 coins this round.';
        r.miner = p.id; p.mined.mine = r.key;
        this.startChannel(p, s, 'mine', { room: r.key }, CHANNEL_T); return;
      }
      case 'drill': {
        if (p.career !== 'explorer') return 'Only Explorers can drill.';
        const dir = tg.dir;
        if (!r) return;
        if (dir === 'down') {
          if (r.down || r.d >= MAX_DEPTH) return 'Cannot drill down here.';
        } else {
          if (!DIRS[dir]) return 'Choose a direction.';
          if (r.doors[dir]) return 'That passage is already open.';
          const nx = r.gx + DIRS[dir][0], ny = r.gy + DIRS[dir][1];
          if (Math.abs(nx) > MAX_GRID || Math.abs(ny) > MAX_GRID) return 'Solid bedrock that way.';
          if (this.rooms[cellKey(nx, ny, r.d)]) return 'Another room is already behind that wall.';
        }
        r.drilling = r.drilling || {};
        if (r.drilling[dir]) return 'Someone is already drilling there.';
        r.drilling[dir] = p.id;
        this.startChannel(p, s, 'explore', { room: r.key, dir }, CHANNEL_T); return;
      }
      case 'crowbar': {
        const ticks = p.career === 'scavenger' ? SCAV_T : CHANNEL_T;
        if (tg.kind === 'chest') {
          if (!r || r.chest <= 0) return 'No coins in a chest here.';
          if (r.chestClaim) return 'Someone else is already looting that.';
          r.chestClaim = p.id; this.startChannel(p, s, 'loot', { kind: 'chest', room: r.key }, ticks); return;
        }
        if (tg.kind === 'pickup') {
          if (!r || !r.pickup) return 'Nothing to pick up here.';
          if (r.pickupClaim) return 'Someone else is already picking that up.';
          if (p.inv.length - 1 >= INVENTORY) return 'Your bag is full.';
          r.pickupClaim = p.id; this.startChannel(p, s, 'loot', { kind: 'pickup', room: r.key }, ticks); return;
        }
        const c = this.corpses.find((x) => x.id === tg.id);
        if (!c || c.d !== p.d || roomAt(this.rooms, c.x, c.y, c.d) !== r || dist(c, p) > 1.6) return 'Stand next to a body to loot it.';
        if (c.claim) return 'Someone else is already looting that body.';
        const amt = p.career === 'scavenger' ? c.coins : c.halfTaken ? 0 : Math.floor(c.coins / 2);
        if (amt <= 0) return p.career === 'scavenger' ? 'That body is empty.' : 'Nothing you can take (only a Scavenger can take the rest).';
        c.claim = p.id; this.startChannel(p, s, 'loot', { kind: 'corpse', id: c.id }, ticks); return;
      }
      case 'potion':
        if (p.hp >= 3) return 'You are already at full health.';
        this.startChannel(p, s, 'heal', {}, CHANNEL_T); return;
      case 'rescue': {
        const v = tg.id ? this.P(tg.id) : p;
        if (!v || v.status !== 'alive' || v.trappedRound !== this.round) return 'That player is not trapped.';
        if (v !== p && (!this.canSee(p, v) || dist(p, v) > 1.6)) return 'Stand next to the trapped player.';
        this.startChannel(p, s, 'rescue', { id: v.id }, CHANNEL_T); return;
      }
      case 'lantern': case 'rlantern':
        if (!r || r.safe) return 'Camps are already bright.';
        this.startChannel(p, s, 'lantern', { until: it.issued + ITEMS[type].ttl - 1 }, CHANNEL_T); return;
      case 'compass':
        if (p.career !== 'explorer') return 'Only Explorers can survey.';
        if (!r || r.d !== 0) return 'The compass only works at depth 0.';
        if (Object.values(this.rooms).some((x) => x.opening)) return 'An exit is already open!';
        this.startChannel(p, s, 'survey', {}, CHANNEL_T); return;
      case 'hook': return 'Hooks are used automatically when camp choices close (pick a target in camp).';
      case 'kit': return 'Protection kits are used when a customer buys a Guard service.';
    }
    return 'Nothing to do with that here.';
  }

  attack(p, s, it, tg) {
    const r = this.room(p);
    if (!r || r.safe) return 'No attacks inside camps.';
    if (p.attackedRound === this.round) return 'Only one attack per round.';
    const v = this.P(tg.id);
    if (!v || v === p || v.status !== 'alive' || !this.canSee(p, v)) return 'No visible target.';
    const def = ITEMS[it.type];
    if (dist(p, v) > def.reach) return `Too far — ${def.name} reach is ${def.reach} tiles.`;
    if (p.channel) this.cancelChannel(p, 'you attacked');
    this.useSlot(p, s); p.attackedRound = this.round;
    const witnesses = this.living().filter((w) => w !== p && w !== v && this.canSee(w, p));
    if (v.shieldRound === this.round) {
      v.shieldRound = 0;
      this.tell(v, `${p.name} attacked you with a ${def.name} — your life shield blocked it!`, 'warn');
      this.tell(p, `${v.name}'s life shield blocked your ${def.name}.`, 'warn');
      for (const w of witnesses) this.tell(w, `You saw ${p.name} attack ${v.name} (blocked by a shield).`, 'warn');
      return;
    }
    v.hp -= def.dmg;
    if (v.channel) this.cancelChannel(v, 'you were hit');
    for (const w of witnesses) this.tell(w, `You saw ${p.name} attack ${v.name} with a ${def.name}!`, 'bad');
    if (v.hp <= 0) { this.tell(p, `You eliminated ${v.name}.`, 'warn'); this.kill(v, p); }
    else { this.tell(v, `${p.name} hit you with a ${def.name}! (${v.hp} HP left)`, 'bad'); this.tell(p, `You hit ${v.name} for ${def.dmg}.`); }
  }

  startTrial(p, s, tg) {
    const r = this.room(p);
    if (!r || !r.safe) return 'Trials are called from a Safe Zone.';
    if (this.trialRound === this.round) return 'Only one trial per round.';
    if (this.t >= T(FIELD_END)) return 'Too late for a trial.';
    const v = this.P(tg.id);
    if (!v || v === p || v.status !== 'alive' || this.room(v) !== r) return 'The accused must be in your Safe Zone.';
    const fee = trialFee(this.round);
    if (p.coins < fee) return `A trial costs ${fee} coins.`;
    p.coins -= fee; s.used = true; this.trialRound = this.round;
    this.meeting = { type: 'trial', caller: p.id, accused: v.id, remaining: T(30), total: T(30), electorate: this.living().map((x) => x.id), votes: {} };
    this.pub(`⚖ ${p.name} put ${v.name} on trial! Everyone alive: vote from a Safe Zone. Majority of ALL living players needed.`);
  }

  c_vote(p, m) {
    const mt = this.meeting;
    if (!mt || !mt.electorate.includes(p.id) || p.status !== 'alive') return;
    if (!this.inCamp(p)) return 'You must be in a Safe Zone to vote.';
    if (mt.type === 'trial') mt.votes[p.id] = !!m.v;
    else {
      if (mt.remaining > T(10)) return 'Voting opens after volunteering (10s).';
      if (!mt.volunteers.includes(m.v)) return 'Vote for a volunteer.';
      mt.votes[p.id] = m.v;
    }
  }
  c_volunteer(p) {
    const mt = this.meeting;
    if (!mt || mt.type !== 'election' || p.status !== 'alive') return;
    if (!this.inCamp(p)) return 'Volunteer from a camp.';
    if (mt.remaining <= T(10)) return 'Volunteering has closed.';
    if (!mt.volunteers.includes(p.id)) mt.volunteers.push(p.id);
  }

  c_haunt(p) {
    if (p.status !== 'dead' || !p.murderer) return;
    if (p.hauntRound === this.round) return 'You already haunted this round.';
    const k = this.P(p.murderer);
    if (!k || !k.connected || k.status === 'forfeit' || !k.ws) return 'Haunt unavailable right now.';
    p.hauntRound = this.round;
    const ev = JSON.stringify({ t: 'haunt', from: p.id, appearance: p.appearance, name: p.name, color: p.color });
    k.ws.send(ev); if (p.ws) p.ws.send(ev);
  }

  // ---------- per-player view
  view(p, sendRooms) {
    const base = {
      t: 'state', code: this.code, state: this.state, me: p.id,
      players: this.players.map((o) => ({ id: o.id, name: o.name, color: o.color, connected: o.connected, ready: o.ready })),
    };
    if (this.state === 'lobby') return { ...base, settings: this.settings };
    if (this.state === 'over') return { ...base, result: this.result, log: this.log.slice(-12) };
    const living = this.living();
    const v = {
      ...base,
      round: this.round, sec: this.sec, fund: this.fund, fare: FARE * living.length,
      log: this.log.slice(-8),
      roster: this.players.map((o) => ({ id: o.id, name: o.name, color: o.color, career: o.career, appearance: o.appearance, status: o.status, connected: o.connected, contrib: o.contrib })),
      merchant: { tier: this.merchant.tier, invested: this.merchant.invested, open: this.merchant.open, nextPrice: this.merchant.sales + 1, sold: this.merchant.sold, upgradedRound: this.merchant.upgradedRound },
      guard: { open: this.guard.open, sold: { lock: !!this.guard.sold.lock, shield: !!this.guard.sold.shield } },
      trialUsed: this.trialRound === this.round,
      meeting: this.meeting && {
        type: this.meeting.type, remaining: this.meeting.remaining / TICK_HZ, caller: this.meeting.caller, accused: this.meeting.accused,
        electorate: this.meeting.electorate.length, voted: Object.keys(this.meeting.votes).length, myVote: this.meeting.votes[p.id],
        volunteers: this.meeting.volunteers, canVote: this.meeting.electorate.includes(p.id),
      },
      you: {
        career: p.career, appearance: p.appearance, smuggler: p.smuggler, coins: p.coins, hp: p.hp, status: p.status, x: p.x, y: p.y, d: p.d,
        inv: p.inv.map((it) => ({ id: it.id, type: it.type, expires: it.issued + ITEMS[it.type].ttl - 1, personal: !!it.personal, paidS: it.paidS })),
        slots: p.slots.map((s) => ({ id: s.id, kind: s.kind, item: s.item, marker: s.marker, used: s.used, target: s.target, service: s.service, freeIssued: !!s.freeIssued })),
        extras: p.extras, trapped: p.trappedRound === this.round, trappedNext: p.trappedRound === this.round + 1,
        lock: p.lockRound === this.round, shield: p.shieldRound === this.round, attacked: p.attackedRound === this.round,
        channel: p.channel && { kind: p.channel.kind, remaining: p.channel.remaining, total: p.channel.total },
        notes: p.notes, murderer: p.murderer, canHaunt: p.status === 'dead' && !!p.murderer && p.hauntRound !== this.round,
        disco: p.disco, inCamp: this.inCamp(p),
      },
      events: p.events.splice(0),
    };
    // visible entities
    const ents = [];
    for (const o of this.players) {
      if (o === p || o.status === 'escaped' || o.status === 'forfeit') continue;
      let vis = false;
      if (o.status === 'alive') {
        if (p.status === 'dead') vis = true;
        else if (p.status === 'alive') vis = this.canSee(p, o);
        else vis = o.d === p.d && roomAt(this.rooms, p.x, p.y, p.d) === roomAt(this.rooms, o.x, o.y, o.d);
      } else if (o.status === 'dead') vis = p.status === 'dead';
      if (!vis) continue;
      ents.push({
        id: o.id, x: o.x, y: o.y, d: o.d, appearance: o.appearance, name: o.name, color: o.color, ghost: o.status === 'dead',
        hp: o.status === 'alive' && p.status === 'alive' ? o.hp : undefined, busy: !!o.channel, trapped: o.trappedRound === this.round,
        inMyRoom: p.status === 'alive' && this.room(p) === roomAt(this.rooms, o.x, o.y, o.d),
      });
    }
    v.ents = ents;
    v.corpses = this.corpses.filter((c) => {
      if (p.status === 'dead') return true;
      const rr = roomAt(this.rooms, c.x, c.y, c.d);
      return c.d === p.d && rr === roomAt(this.rooms, p.x, p.y, p.d) && (p.status !== 'alive' || this.bright(rr) || dist(c, p) <= 2.6);
    }).map((c) => ({ id: c.id, x: c.x, y: c.y, d: c.d, name: c.name, appearance: c.appearance, color: c.color, empty: c.coins === 0 || (c.halfTaken && p.career !== 'scavenger') }));
    v.mapVersion = this.mapVersion;
    if (sendRooms) {
      v.rooms = Object.values(this.rooms).map((r) => ({
        key: r.key, gx: r.gx, gy: r.gy, d: r.d, cat: r.cat, theme: r.theme, safe: r.safe, doors: r.doors, up: r.up, down: r.down,
        lit: this.bright(r), opening: r.opening, reserve: r.reserve, chest: r.chest, pickup: r.pickup ? r.pickup.type : null, triggered: r.triggered, dist: r.dist,
      }));
    }
    return v;
  }
}

// ---------------------------------------------------------------- websocket
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 4096 });
const cleanName = (s) => String(s || '').replace(/[\u0000-\u001f<>&"'`]/g, '').trim().slice(0, 18);

wss.on('connection', (ws) => {
  ws.alive = true;
  ws.on('pong', () => (ws.alive = true));
  let me = null, match = null;
  const send = (o) => ws.readyState === 1 && ws.send(JSON.stringify(o));
  ws.on('message', (buf) => {
    if ((ws._rate = (ws._rate || 0) + 1) > 80) return; // simple flood guard (reset every second)
    let m; try { m = JSON.parse(buf); } catch { return; }
    if (!m || typeof m.t !== 'string') return;
    if (m.t === 'join') {
      const token = typeof m.token === 'string' && m.token.length >= 16 ? m.token.slice(0, 64) : null;
      // reconnect
      const sess = token && sessions.get(token);
      if (sess && matches.has(sess.code) && (!m.code || m.code.toUpperCase() === sess.code)) {
        match = matches.get(sess.code); me = match.P(sess.pid);
        if (me) {
          if (me.ws && me.ws !== ws) { try { me.ws.send(JSON.stringify({ t: 'replaced' })); me.ws.close(); } catch {} }
          if (match.state === 'game' && me.status === 'forfeit') { send({ t: 'error', msg: 'You forfeited this match.' }); }
          me.ws = ws; me.connected = true; me.disco = 0; me.lobbyLeftAt = null; me.lastMove = Date.now(); me.sentMap = 0;
          send({ t: 'joined', code: match.code, token: me.token, id: me.id });
          return;
        }
      }
      if (m.rejoin) return send({ t: 'error', msg: '', quiet: true });
      const name = cleanName(m.name);
      if (name.length < 2) return send({ t: 'error', msg: 'Enter a nickname (2–18 characters).' });
      let code = String(m.code || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
      if (!code) { code = newCode(); matches.set(code, new Match(code)); }
      match = matches.get(code);
      if (!match) return send({ t: 'error', msg: `No room with code ${code}.` });
      if (match.state !== 'lobby') return send({ t: 'error', msg: 'That game has already started.' });
      if (match.players.length >= 8) return send({ t: 'error', msg: 'That room is full (8 players).' });
      if (match.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) return send({ t: 'error', msg: 'That nickname is taken in this room.' });
      const tok = crypto.randomBytes(18).toString('hex');
      me = match.addPlayer(name, tok); me.ws = ws; me.sentMap = 0;
      sessions.set(tok, { code, pid: me.id });
      send({ t: 'joined', code, token: tok, id: me.id });
      return;
    }
    if (!me || !match || me.ws !== ws) return;
    if (match.state === 'lobby') match.lobbyCmd(me, m);
    else if (match.state === 'game') match.cmd(me, m);
    else if (match.state === 'over' && m.t === 'rematch') {
      match.state = 'lobby'; match.clearReady();
      match.players = match.players.filter((p) => p.connected);
      for (const p of match.players) { delete p.career; p.sentMap = 0; }
    } else if (m.t === 'leave') { sessions.delete(me.token); }
  });
  ws.on('close', () => {
    if (!me || me.ws !== ws) return;
    me.connected = false; me.ws = null;
    if (match.state === 'lobby') { me.lobbyLeftAt = Date.now(); match.clearReady(); }
  });
});
timers.push(setInterval(() => { for (const c of wss.clients) c._socket && (c.alive === false ? c.terminate() : ((c.alive = false), c.ping())); }, 5000));
timers.push(setInterval(() => { for (const c of wss.clients) c._rate = 0; }, 1000));

// ---------------------------------------------------------------- main loop
let tickN = 0;
function clearIntervalsForTests() { timers.forEach(clearInterval); }
timers.push(setInterval(() => {
  tickN++;
  for (const [code, m] of matches) {
    for (let i = 0; i < SPEEDUP; i++) m.step();
    if (m.state === 'lobby') {
      for (const p of [...m.players]) if (!p.connected && p.lobbyLeftAt && Date.now() - p.lobbyLeftAt > 60000) m.removeFromLobby(p);
      if (m.players.length === 0 && Date.now() - m.createdAt > 15 * 60000) matches.delete(code);
    }
    if (m.players.every((p) => !p.connected) && Date.now() - (m.lastActive || Date.now()) > 30 * 60000) matches.delete(code);
    if (m.players.some((p) => p.connected)) m.lastActive = Date.now();
    if (tickN % 2) continue; // broadcast at 10 Hz
    for (const p of m.players) {
      if (!p.ws || p.ws.readyState !== 1) continue;
      const sendRooms = m.state === 'game' && p.sentMap !== m.mapVersion;
      const v = m.view(p, sendRooms);
      if (sendRooms) p.sentMap = m.mapVersion;
      p.ws.send(JSON.stringify(v));
    }
  }
}, 1000 / TICK_HZ));

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) server.listen(PORT, () => console.log(`Mine Escape listening on http://localhost:${PORT}`));
else { clearIntervalsForTests(); }
export { Match, matches };
