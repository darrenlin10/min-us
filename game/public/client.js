import { html, render, useState, useEffect } from './vendor/preact-htm.js';
import {
  ROOM, SPEED, PHASES, ROUND_SECONDS, SHOP_CLOSE, CHOICE_CLOSE, ROUNDS, FARE, SMUGGLER_FARE, INVENTORY, phaseAt, surcharge,
  CAREERS, ITEMS, ICON, MERCHANT_GOODS, UPGRADES, weaponPrice, trialFee, DIRS, cellKey, LADDER, LADDER_UP, walkable, roomAt,
} from './shared.js';

// ------------------------------------------------------------ state & network
const S = { screen: 'menu', conn: 'connecting', view: null, rooms: {}, mapVersion: 0, me: { x: 0, y: 0, d: 0 }, toasts: [], disp: {}, error: '' };
let ws, joinMsg = null, rerender = () => {};
const store = {
  // Each tab keeps its own seat (sessionStorage), so several tabs in one browser can play side by side.
  // The last seat is also remembered browser-wide so "Resume your game" works after closing the tab.
  get token() { try { return sessionStorage.getItem('me_token'); } catch { return null; } },
  set token(v) {
    try { v ? sessionStorage.setItem('me_token', v) : sessionStorage.removeItem('me_token'); } catch {}
    try { v ? localStorage.setItem('me_last_token', v) : localStorage.removeItem('me_last_token'); } catch {}
  },
  get lastToken() { try { return localStorage.getItem('me_last_token'); } catch { return null; } },
  get name() { try { return localStorage.getItem('me_name') || ''; } catch { return ''; } },
  set name(v) { try { localStorage.setItem('me_name', v); } catch {} },
};
const urlCode = (location.pathname.match(/^\/room\/([A-Za-z]{4})/) || [])[1];
if (urlCode && store.token) S.screen = 'play'; // refresh during a match resumes directly

function connect() {
  ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
  ws.onopen = () => { S.conn = 'open'; if (S.screen !== 'play') { rerender(); return; } if (store.token) send({ t: 'join', token: store.token, code: urlCode, rejoin: !joinMsg }); else if (joinMsg) send(joinMsg); rerender(); };
  ws.onclose = () => { S.conn = 'closed'; rerender(); setTimeout(connect, 1500); };
  ws.onmessage = (e) => onMsg(JSON.parse(e.data));
}
const send = (o) => ws && ws.readyState === 1 && ws.send(JSON.stringify(o));
window.__send = send; // used by automated browser tests

function goMenu() {
  S.screen = 'menu'; S.view = null; S.rooms = {}; joinMsg = null;
  if (ws) ws.close(); // the server keeps our seat for one round of game time
  history.replaceState(null, '', '/'); rerender();
}
function resume() { if (!store.token && store.lastToken) store.token = store.lastToken; S.screen = 'play'; S.error = ''; if (ws && ws.readyState === 1) send({ t: 'join', token: store.token, rejoin: true }); rerender(); }
function quit() {
  if (store.token) send({ t: 'leave' });
  store.token = null; S.screen = 'quit'; S.view = null; joinMsg = null;
  if (ws) ws.close();
  history.replaceState(null, '', '/'); rerender();
}

function toast(msg, kind = 'info') {
  const id = Math.random();
  S.toasts.push({ id, msg, kind }); if (S.toasts.length > 6) S.toasts.shift();
  setTimeout(() => { S.toasts = S.toasts.filter((t) => t.id !== id); rerender(); }, 6000);
}

let lastLogLen = 0, lastLogKey = '';
const floaters = [];
function floater(text, color) { floaters.push({ text, color, t0: performance.now(), dx: (Math.random() - 0.5) * 30 }); }
function onMsg(m) {
  if (m.t === 'joined') {
    store.token = m.token; S.error = '';
    if (!location.pathname.startsWith('/room/' + m.code)) history.replaceState(null, '', '/room/' + m.code);
  } else if (m.t === 'error') {
    if (m.quiet) { store.token = null; if (joinMsg) send(joinMsg); } else S.error = m.msg;
  } else if (m.t === 'left' || m.t === 'replaced') {
    if (m.t === 'replaced') S.error = 'This seat was opened in another tab.';
    store.token = null; S.view = null;
  } else if (m.t === 'pos') {
    Object.assign(S.me, { x: m.x, y: m.y, d: m.d });
  } else if (m.t === 'haunt') {
    S.haunt = { ...m, until: Date.now() + 450 }; setTimeout(() => { S.haunt = null; rerender(); }, 460);
  } else if (m.t === 'state') {
    const prev = S.view;
    if (m.rooms) { S.rooms = {}; for (const r of m.rooms) S.rooms[r.key] = r; }
    if (m.you) {
      const y = m.you;
      if (prev && prev.you && prev.state === 'game' && y.status === 'alive') {
        const dc = y.coins - prev.you.coins, dh = y.hp - prev.you.hp;
        if (dc) floater((dc > 0 ? '+' : '') + dc + ' 🪙', dc > 0 ? '#ffd25a' : '#ff9b9b');
        if (dh) floater((dh > 0 ? '+' : '') + dh + ' ❤', dh > 0 ? '#8ef0a0' : '#ff6b81');
      }
      if (!prev || !prev.you || prev.you.status !== y.status || Math.hypot(S.me.x - y.x, S.me.y - y.y) > 2.5 || S.me.d !== y.d) Object.assign(S.me, { x: y.x, y: y.y, d: y.d });
      for (const ev of m.events || []) toast(ev.msg, ev.kind);
    }
    if (m.log) {
      const key = m.log.map((l) => l.msg).join('|');
      if (prev && prev.state === 'game' && key !== lastLogKey) {
        const old = new Set((prev.log || []).map((l) => l.round + l.msg));
        for (const l of m.log) if (!old.has(l.round + l.msg)) toast(l.msg, 'pub');
      }
      lastLogKey = key;
    }
    S.view = m;
    S.lastState = performance.now();
  }
  rerender();
}

// ------------------------------------------------------------ images
const IMG = {};
function img(src) { if (!IMG[src]) { const i = new Image(); i.src = src; IMG[src] = i; } return IMG[src]; }
const charSrc = (a) => `/assets/chars/${a}.png`;
const itemSrc = (k) => `/assets/items/${ICON[k] || k}.png`;
const roomSrc = (r) => {
  let t = r.theme;
  if (r.cat === 'mine' && r.reserve <= 0) t = 'coin_mine_exhausted';
  if (r.cat === 'treasure' && r.chest <= 0) t = 'treasure_vault_empty';
  if (r.cat === 'cache' && r.triggered && !r.pickup) t = 'supply_cache_empty';
  if (r.cat === 'trap' && r.triggered) t = 'trap_gallery_triggered';
  if (r.cat === 'gallery' && (r.up || r.down)) t = 'ladder_chamber';
  return `/assets/rooms/${t}.jpg`;
};
let rockPattern = null;
{ const src = img('/assets/rooms/empty_junction.jpg');
  src.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 120; const g = c.getContext('2d');
    g.drawImage(src, 0, 0, 120, 120, 0, 0, 120, 120); g.fillStyle = '#0b0710a0'; g.fillRect(0, 0, 120, 120); rockPattern = c; }; }
['worker', 'worker-02', 'explorer', 'explorer-02', 'merchant', 'guard', 'thief', 'scavenger'].forEach((a) => img(charSrc(a)));

// ------------------------------------------------------------ input & movement
const keys = new Set();
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  keys.add(e.key.toLowerCase());
  if (e.key === 'e' || e.key === 'E') tryClimb();
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
const joy = { id: null, ox: 0, oy: 0, dx: 0, dy: 0 };
const canvas = document.getElementById('world');
canvas.addEventListener('pointerdown', (e) => { joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY; joy.dx = joy.dy = 0; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerId !== joy.id) return;
  const dx = e.clientX - joy.ox, dy = e.clientY - joy.oy, L = Math.hypot(dx, dy), R = 50;
  joy.dx = L > 6 ? (dx / Math.max(L, R)) : 0; joy.dy = L > 6 ? (dy / Math.max(L, R)) : 0;
});
const endJoy = (e) => { if (e.pointerId === joy.id) { joy.id = null; joy.dx = joy.dy = 0; } };
canvas.addEventListener('pointerup', endJoy); canvas.addEventListener('pointercancel', endJoy);

function canMove() {
  const v = S.view; if (!v || v.state !== 'game' || !v.you) return false;
  const y = v.you;
  if (y.status === 'forfeit') return false;
  if (y.status === 'alive') {
    const ph = phaseAt(v.sec).id;
    if (y.trapped && ph === 'field' && !v.meeting) return false;
    if (v.meeting && v.meeting.type === 'trial' && v.meeting.accused === v.me) return false;
  }
  return true;
}
let lastSend = 0, sentX = 0, sentY = 0, facing = {};
function moveStep(dt) {
  if (!canMove()) return;
  let dx = 0, dy = 0;
  if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d')) dx += 1;
  if (keys.has('arrowup') || keys.has('w')) dy -= 1;
  if (keys.has('arrowdown') || keys.has('s')) dy += 1;
  if (joy.id !== null) { dx = joy.dx; dy = joy.dy; }
  const L = Math.hypot(dx, dy); if (L < 0.05) return;
  if (L > 1) { dx /= L; dy /= L; }
  const y = S.view.you, ghost = y.status !== 'alive';
  const sp = SPEED * (ghost ? 1.5 : 1) * dt;
  const ok = (x, yy) => (ghost ? !!roomAt(S.rooms, x, yy, S.me.d) : walkable(S.rooms, x, yy, S.me.d));
  const nx = S.me.x + dx * sp, ny = S.me.y + dy * sp;
  if (ok(nx, ny)) { S.me.x = nx; S.me.y = ny; }
  else if (dx && ok(nx, S.me.y)) S.me.x = nx;
  else if (dy && ok(S.me.x, ny)) S.me.y = ny;
  else if (!ghost) {
    // doorway assist: pushing into a wall near a door slides you toward the opening
    const cxr = Math.floor(S.me.x / ROOM) * ROOM + 2, cyr = Math.floor(S.me.y / ROOM) * ROOM + 2;
    if (Math.abs(dx) >= Math.abs(dy) && Math.abs(S.me.y - cyr) < 1.4) { const ty = S.me.y + Math.sign(cyr - S.me.y) * Math.min(sp, Math.abs(cyr - S.me.y)); if (ok(S.me.x, ty)) S.me.y = ty; }
    else if (Math.abs(dy) > Math.abs(dx) && Math.abs(S.me.x - cxr) < 1.4) { const tx = S.me.x + Math.sign(cxr - S.me.x) * Math.min(sp, Math.abs(cxr - S.me.x)); if (ok(tx, S.me.y)) S.me.x = tx; }
  }
  if (dx) facing.me = dx < 0;
}
function netTick() {
  const now = performance.now();
  if (now - lastSend > 66 && (Math.abs(S.me.x - sentX) > 0.01 || Math.abs(S.me.y - sentY) > 0.01)) {
    send({ t: 'mv', x: +S.me.x.toFixed(3), y: +S.me.y.toFixed(3) }); sentX = S.me.x; sentY = S.me.y; lastSend = now;
  }
}
function nearLadder() {
  const r = roomAt(S.rooms, S.me.x, S.me.y, S.me.d); if (!r) return null;
  const at = (a) => Math.hypot(S.me.x - (r.gx * ROOM + a.x), S.me.y - (r.gy * ROOM + a.y)) <= 1.0;
  if (r.down && at(LADDER)) return 'down';
  if (r.up && at(LADDER_UP)) return 'up';
  return null;
}
function tryClimb() { if (nearLadder()) send({ t: 'climb' }); }

// ------------------------------------------------------------ canvas rendering
const ctx = canvas.getContext('2d');
let TS = 64, W = 0, H = 0;
function resize() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  W = innerWidth; H = innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  TS = Math.max(44, Math.min(84, Math.min(W, H) / 5.2));
}
addEventListener('resize', resize); resize();

function drawChar(e, x, y, opts = {}) {
  const im = img(charSrc(e.appearance));
  const h = TS * 1.15, w = im.width ? (h * im.width) / im.height : h * 0.7;
  ctx.save();
  ctx.translate(x, y);
  if (opts.corpse) { ctx.rotate(-Math.PI / 2); ctx.globalAlpha = 0.55; }
  if (opts.ghost) ctx.globalAlpha = 0.45;
  if (opts.flip) ctx.scale(-1, 1);
  // shadow
  if (!opts.corpse && !opts.ghost) { ctx.fillStyle = '#0006'; ctx.beginPath(); ctx.ellipse(0, 0, w * 0.32, h * 0.06, 0, 0, Math.PI * 2); ctx.fill(); }
  const bob = opts.moving ? Math.sin(performance.now() / 90) * 2 : 0;
  if (im.complete && im.width) ctx.drawImage(im, -w / 2, -h + bob, w, h);
  if (opts.ghost) { ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = '#9fc4ff88'; ctx.fillRect(-w / 2, -h, w, h); }
  ctx.restore();
  if (opts.corpse) return;
  // label
  const fs = Math.round(TS * 0.21);
  ctx.font = `${fs}px 'Lilita One', system-ui`; ctx.textAlign = 'center';
  const label = e.name, tw = ctx.measureText(label).width + 24, ph = fs + 8, ly = y - h - TS * 0.12 - ph;
  pill(x - tw / 2, ly, tw, ph, '#1a1222e6', '#120c18');
  ctx.fillStyle = e.color; ctx.beginPath(); ctx.arc(x - tw / 2 + 10, ly + ph / 2, 4.5, 0, 7); ctx.fill(); ctx.strokeStyle = '#120c18'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#fff6e3'; ctx.fillText(label, x + 6, ly + ph / 2 + fs * 0.36);
  if (e.hp !== undefined) for (let i = 0; i < 3; i++) { ctx.fillStyle = i < e.hp ? '#ff5d6c' : '#3a2f48'; ctx.strokeStyle = '#120c18'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x - 12 + i * 12, ly - 7, 4.5, 0, 7); ctx.fill(); ctx.stroke(); }
  if (e.trapped) { ctx.strokeStyle = '#bbb'; ctx.lineWidth = 2; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * 8, y - h * 0.9); ctx.lineTo(x + i * 8, y); ctx.stroke(); } }
  if (e.busy) { ctx.fillStyle = '#f2c14e'; ctx.font = `${Math.round(TS * 0.3)}px system-ui`; ctx.fillText('⚒', x + w * 0.4, y - h * 0.7); }
}

function pill(x, y, w, h, fill, stroke) {
  const r = h / 2; ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 2.5; ctx.stroke();
}
function frame(now) {
  const dt = Math.min(0.05, (now - (frame.last || now)) / 1000); frame.last = now;
  moveStep(dt); netTick();
  const v = S.view;
  ctx.fillStyle = '#0d0a12'; ctx.fillRect(0, 0, W, H);
  if (rockPattern && v && v.state === 'game') {
    const pat = ctx.createPattern(rockPattern, 'repeat');
    const ox = ((W / 2 - S.me.x * TS) % 120 + 120) % 120, oy = (((W < 640 ? H * 0.36 : H / 2) - S.me.y * TS + TS * 0.3) % 120 + 120) % 120;
    ctx.save(); ctx.translate(ox, oy); ctx.fillStyle = pat; ctx.fillRect(-ox, -oy, W, H); ctx.restore();
  }
  if (v && v.state === 'game') drawWorld(v, now);
  requestAnimationFrame(frame);
}
function drawWorld(v, now) {
  const me = S.me, cx = W / 2 - me.x * TS, cy = (W < 640 ? H * 0.36 : H / 2) - me.y * TS + TS * 0.3;
  const sx = (x) => cx + x * TS, sy = (y) => cy + y * TS;
  const myRoom = roomAt(S.rooms, me.x, me.y, me.d);
  const alive = v.you.status === 'alive';
  for (const r of Object.values(S.rooms)) {
    if (r.d !== me.d) continue;
    const x0 = sx(r.gx * ROOM), y0 = sy(r.gy * ROOM), s = ROOM * TS;
    if (x0 > W || y0 > H || x0 + s < 0 || y0 + s < 0) continue;
    const im = img(roomSrc(r));
    if (im.complete && im.width) ctx.drawImage(im, x0, y0, s, s); else { ctx.fillStyle = '#3b3048'; ctx.fillRect(x0, y0, s, s); }
    // sealed ports
    for (const k of ['n', 'e', 's', 'w']) {
      if (r.doors[k]) continue;
      const a = 0.42 * TS, b = 0.64 * TS;
      const [rx, ry, rw, rh] = k === 'n' ? [x0 + s / 2 - b, y0, b * 2, a] : k === 's' ? [x0 + s / 2 - b, y0 + s - a, b * 2, a] : k === 'w' ? [x0, y0 + s / 2 - b, a, b * 2] : [x0 + s - a, y0 + s / 2 - b, a, b * 2];
      ctx.fillStyle = rockPattern ? ctx.createPattern(rockPattern, 'repeat') : '#3d3350'; ctx.fillRect(rx, ry, rw, rh);
      // rubble boulders
      ctx.fillStyle = '#5a4a70'; ctx.strokeStyle = '#120c18'; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) { const t = (i + 0.5) / 4, bx = rw > rh ? rx + rw * t : rx + rw / 2, by = rw > rh ? ry + rh / 2 : ry + rh * t, br = Math.min(rw, rh) * (0.28 + 0.08 * ((i * 7 + r.gx * 3 + r.gy) % 3));
        ctx.beginPath(); ctx.arc(bx, by, br, 0, 7); ctx.fill(); ctx.stroke(); }
    }
    const lad = img('/assets/rooms/ladder.png');
    if (r.down && lad.complete) ctx.drawImage(lad, x0 + (LADDER.x - 0.5) * TS, y0 + (LADDER.y - 0.5) * TS, TS, TS * 0.9);
    if (r.up && lad.complete) { ctx.save(); ctx.translate(x0 + LADDER_UP.x * TS, y0 + LADDER_UP.y * TS); ctx.rotate(Math.PI); ctx.drawImage(lad, -TS / 2, -TS * 0.45, TS, TS * 0.9); ctx.restore(); ctx.fillStyle = '#fff'; ctx.font = `${TS * 0.3}px system-ui`; ctx.textAlign = 'center'; ctx.fillText('▲', x0 + LADDER_UP.x * TS, y0 + (LADDER_UP.y - 0.5) * TS); }
    if (r.pickup) { const it = img(itemSrc(r.pickup)); if (it.complete) ctx.drawImage(it, x0 + 2.5 * TS, y0 + 2.5 * TS, TS * 0.6, TS * 0.6); }
    if (r.opening) {
      const g = ctx.createRadialGradient(x0 + s / 2, y0 + s / 2, 4, x0 + s / 2, y0 + s / 2, s * 0.45);
      g.addColorStop(0, '#fffbe0'); g.addColorStop(0.4, '#ffe680aa'); g.addColorStop(1, '#ffe68000');
      ctx.fillStyle = g; ctx.fillRect(x0, y0, s, s);
      ctx.fillStyle = '#5a3d00'; ctx.font = `700 ${TS * 0.3}px system-ui`; ctx.textAlign = 'center'; ctx.fillText('☀ EXIT', x0 + s / 2, y0 + s / 2);
    }
    if (!r.lit && r !== myRoom) { ctx.fillStyle = '#0007'; ctx.fillRect(x0, y0, s, s); }
    if (r.cat === 'mine' && r.reserve > 0) { ctx.fillStyle = '#000a'; ctx.fillRect(x0 + s * 0.68, y0 + s * 0.05, TS * 1.1, TS * 0.32); ctx.fillStyle = '#f2c14e'; ctx.font = `600 ${TS * 0.22}px system-ui`; ctx.textAlign = 'left'; ctx.fillText(`⛏ ${r.reserve} left`, x0 + s * 0.7, y0 + s * 0.05 + TS * 0.24); }
    if (r.cat === 'treasure' && r.chest > 0) { ctx.fillStyle = '#000a'; ctx.fillRect(x0 + s * 0.68, y0 + s * 0.05, TS * 1.1, TS * 0.32); ctx.fillStyle = '#f2c14e'; ctx.font = `600 ${TS * 0.22}px system-ui`; ctx.textAlign = 'left'; ctx.fillText(`💰 ${r.chest} coins`, x0 + s * 0.7, y0 + s * 0.05 + TS * 0.24); }
  }
  // corpses
  for (const c of v.corpses || []) if (c.d === me.d) drawChar(c, sx(c.x), sy(c.y), { corpse: true });
  // entities (interpolated)
  const ents = (v.ents || []).filter((e) => e.d === me.d);
  const list = [];
  for (const e of ents) {
    const dsp = S.disp[e.id] || (S.disp[e.id] = { x: e.x, y: e.y });
    const k = Math.min(1, 0.25);
    const mx = e.x - dsp.x; dsp.x += mx * k; dsp.y += (e.y - dsp.y) * k;
    if (Math.abs(mx) > 0.01) facing[e.id] = mx < 0;
    dsp.moving = Math.hypot(e.x - dsp.x, e.y - dsp.y) > 0.02;
    list.push({ e, x: dsp.x, y: dsp.y });
  }
  if (v.you.status !== 'escaped' && v.you.status !== 'forfeit') {
    const meE = { name: v.roster.find((r) => r.id === v.me).name, color: v.roster.find((r) => r.id === v.me).color, appearance: v.you.appearance, hp: alive ? v.you.hp : undefined, trapped: v.you.trapped };
    list.push({ e: meE, x: me.x, y: me.y, self: true });
  }
  list.sort((a, b) => a.y - b.y);
  for (const o of list) drawChar(o.e, sx(o.x), sy(o.y), { ghost: o.e.ghost || (o.self && v.you.status === 'dead'), flip: o.self ? facing.me : facing[o.e.id], moving: o.self ? (keys.size > 0 || joy.dx || joy.dy) : S.disp[o.e.id] && S.disp[o.e.id].moving });
  // darkness around me in dim rooms
  if (alive && myRoom && !myRoom.lit) {
    const px = sx(me.x), py = sy(me.y) - TS * 0.5;
    const g = ctx.createRadialGradient(px, py, TS * 2.0, px, py, TS * 3.0);
    g.addColorStop(0, '#0000'); g.addColorStop(1, '#000a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  // channel bar
  const ch = v.you.channel;
  if (ch) {
    const p = 1 - ch.remaining / ch.total, x = W / 2 - 40, y = (W < 640 ? H * 0.36 : H / 2) - TS * 1.75;
    ctx.fillStyle = '#000b'; ctx.fillRect(x, y, 80, 10); ctx.fillStyle = '#f2c14e'; ctx.fillRect(x + 1, y + 1, 78 * p, 8);
  }
  // joystick ring
  if (joy.id !== null) { ctx.strokeStyle = '#fff6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(joy.ox, joy.oy, 50, 0, 7); ctx.stroke(); ctx.fillStyle = '#fff8'; ctx.beginPath(); ctx.arc(joy.ox + joy.dx * 50, joy.oy + joy.dy * 50, 18, 0, 7); ctx.fill(); }
  // floating numbers above me
  const tnow = performance.now();
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i], age = (tnow - f.t0) / 1200;
    if (age >= 1) { floaters.splice(i, 1); continue; }
    ctx.globalAlpha = 1 - age * age; ctx.font = `${Math.round(TS * 0.34)}px 'Lilita One', system-ui`; ctx.textAlign = 'center';
    ctx.lineWidth = 4; ctx.strokeStyle = '#120c18'; const fx = W / 2 + f.dx, fy = (W < 640 ? H * 0.36 : H / 2) - TS * 1.5 - age * TS;
    ctx.strokeText(f.text, fx, fy); ctx.fillStyle = f.color; ctx.fillText(f.text, fx, fy); ctx.globalAlpha = 1;
  }
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, '#0000'); vg.addColorStop(1, '#000a'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  drawMinimap(v);
}
function drawMinimap(v) {
  const rooms = Object.values(S.rooms).filter((r) => r.d === S.me.d);
  if (!rooms.length) return;
  const c = 9, pad = 6;
  const minx = Math.min(...rooms.map((r) => r.gx)), maxx = Math.max(...rooms.map((r) => r.gx));
  const miny = Math.min(...rooms.map((r) => r.gy)), maxy = Math.max(...rooms.map((r) => r.gy));
  const w = Math.max(64, (maxx - minx + 1) * c + pad * 2), h = (maxy - miny + 1) * c + pad * 2 + 14;
  const x0 = W - w - 8, y0 = H - h - (W < 640 ? 150 : 100);
  ctx.fillStyle = '#000a'; ctx.fillRect(x0, y0, w, h);
  ctx.fillStyle = '#ccc'; ctx.font = '11px system-ui'; ctx.textAlign = 'left'; ctx.fillText(`Depth ${S.me.d}`, x0 + 5, y0 + 11);
  const col = { camp: '#7be0ff', safe: '#7be0ff', mine: '#f2c14e', treasure: '#ff9f43', cache: '#9ad17a', trap: '#ff6b6b', gallery: '#8a7f99' };
  for (const r of rooms) {
    const x = x0 + pad + (r.gx - minx) * c, y = y0 + 14 + pad + (r.gy - miny) * c;
    ctx.fillStyle = r.opening ? '#fff' : col[r.cat]; ctx.fillRect(x + 1, y + 1, c - 2, c - 2);
    ctx.fillStyle = '#666';
    if (r.doors.e) ctx.fillRect(x + c - 1, y + c / 2 - 1, 2, 2);
    if (r.doors.s) ctx.fillRect(x + c / 2 - 1, y + c - 1, 2, 2);
    if (r.down) { ctx.fillStyle = '#000'; ctx.fillRect(x + 3, y + 3, 3, 3); }
  }
  const mx = x0 + pad + (S.me.x / ROOM - minx) * c, my = y0 + 14 + pad + (S.me.y / ROOM - miny) * c;
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(mx, my, 2.5, 0, 7); ctx.fill();
  for (const n of v.you.notes || []) {
    if (S.me.d !== 0) break;
    const nx = x0 + pad + (n.gx - minx + 0.5) * c, ny = y0 + 14 + pad + (n.gy - miny + 0.5) * c, a = (n.angle * Math.PI) / 180;
    ctx.strokeStyle = '#ff8fd0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(nx + Math.cos(a) * 14, ny + Math.sin(a) * 14); ctx.stroke();
  }
}
requestAnimationFrame(frame);

// ------------------------------------------------------------ UI helpers
const careerName = (c) => (CAREERS[c] ? CAREERS[c].name : c);
const Icon = ({ k, sm }) => html`<img class=${'icon' + (sm ? ' sm' : '')} src=${itemSrc(k)} alt="" />`;
const fmt = (s) => `${Math.max(0, Math.ceil(s))}s`;
const itemLabel = (it) => `${ITEMS[it.type].name}${it.personal ? ' (perk)' : ''} · until R${it.expires}`;

const CAREER_ORDER = ['worker', 'explorer', 'merchant', 'guard', 'thief', 'scavenger'];
function MainMenu() {
  const [tab, setTab] = useState('goal');
  const [rules, setRules] = useState(false);
  const panels = {
    goal: html`<p>The mine collapsed behind your crew. You have <b>${ROUNDS} rounds</b> to get out.</p>
      <ul><li>Everyone starts with <b>2 coins</b> and <b>3 HP</b>.</li>
      <li>Mine, explore and trade, then put coins into the shared <b>escape fund</b>.</li>
      <li>When the fund reaches <b>${FARE} × living players</b> at the end of a round, the whole group escapes.</li>
      <li>Rare <b>natural exits</b> hide 14+ rooms away — finding one saves every survivor for free.</li>
      <li>Every round: walk back to a <b>camp</b> to prepare, go out to use your actions, then walk back again.</li></ul>`,
    careers: html`<p>Your career is public — everyone sees your outfit.</p>
      <div class="col">${CAREER_ORDER.map((c) => html`<div class="item"><img src=${charSrc(c)} style="width:40px" /><div class="grow"><b>${CAREERS[c].name}</b><small>${CAREERS[c].blurb}</small></div></div>`)}</div>`,
    smuggler: html`<p>0–2 players are secretly <b class="smug">Smugglers</b>. A Smuggler looks exactly like a normal career and has its full abilities.</p>
      <ul><li>Smugglers win alone by holding <b>${SMUGGLER_FARE} coins</b> in their own wallet at a round's end (a private escape).</li>
      <li>Wallets are private — but contributions to the fund are public. Who promised coins and never paid?</li>
      <li>You can steal, fight, or put a suspect on trial (majority vote) — but you might be wrong.</li>
      <li>Your private identity card (🪪) tells you if you are one. Identities are revealed when the match ends.</li></ul>`,
    controls: html`<ul>
      <li><b>Move:</b> WASD / arrow keys, or drag anywhere on the screen (phone).</li>
      <li><b>🏕 Camp</b> (bottom right): fill your action slots, shop, buy services, post pledges.</li>
      <li><b>Action slots</b> (bottom): tap one during field time to use it where you stand.</li>
      <li><b>Ladders:</b> stand on one and press E or the Climb button.</li>
      <li><b>🪪</b> shows your secret identity · <b>📖</b> full rules · <b>☰</b> menu.</li></ul>`,
  };
  return html`<div class="screen"><div style="width:100%;max-width:560px">
    <div class="card">
      <div class="title">⛏ MINE ESCAPE</div>
      <div class="subtitle">A multiplayer game of cooperation and secret greed</div>
      <div class="note" style="text-align:center">👥 <b>Needs at least 3 players</b> (up to 8), each on their own phone, computer or browser tab. One person creates a room and shares the 4-letter code.</div>
      <div class="cast">${CAREER_ORDER.map((a) => html`<img src=${charSrc(a)} alt=${a} />`)}</div>
      <div class="col">
        ${(store.token || store.lastToken) && html`<button class="primary big" onClick=${resume}>▶ Resume your game</button>`}
        <button class=${store.token || store.lastToken ? 'big' : 'primary big'} onClick=${() => { S.screen = 'play'; S.error = ''; rerender(); }}>${urlCode ? `▶ Start game (join room ${urlCode.toUpperCase()})` : '▶ Start game'}</button>
        <button onClick=${quit}>✕ Quit game</button>
      </div>
    </div>
    <div class="card">
      <div class="row tabs" style="margin-bottom:8px">${[['goal', '🎯 Objective'], ['careers', '⛏ Careers'], ['smuggler', '🕵 Smugglers'], ['controls', '🎮 Controls']].map(([k, l]) => html`<button class=${tab === k ? 'on' : ''} onClick=${() => setTab(k)}>${l}</button>`)}</div>
      <div class="rules">${panels[tab]}</div>
      <button onClick=${() => setRules(true)}>📖 Full rules</button>
    </div></div>
    ${rules && html`<${RulesModal} close=${() => setRules(false)} />`}
  </div>`;
}

function QuitScreen() {
  return html`<div class="screen"><div class="card" style="text-align:center">
    <div class="title">Thanks for playing!</div>
    <p class="muted">You left the game. You can close this tab now.</p>
    <button class="primary" onClick=${() => { S.screen = 'menu'; rerender(); }}>Back to main menu</button>
  </div></div>`;
}

function JoinScreen() {
  const [name, setName] = useState(store.name);
  const [code, setCode] = useState((urlCode || '').toUpperCase());
  const go = (c) => {
    const n = name.trim(); if (n.length < 2) { S.error = 'Enter a nickname (2–18 characters) first.'; rerender(); return; }
    store.name = n; store.token = null; S.error = '';
    joinMsg = { t: 'join', name: n, code: c }; send(joinMsg);
  };
  return html`<div class="screen"><div style="width:100%;max-width:560px">
    <div class="card">
      <div class="row"><h2 class="grow">🏕 Game lobby</h2><button class="small" onClick=${() => { S.screen = 'menu'; S.error = ''; rerender(); }}>← Main menu</button></div>
      <label>Your nickname<br/><input maxlength="18" value=${name} onInput=${(e) => setName(e.target.value)} placeholder="2–18 characters" style="width:100%" /></label>
      ${S.error && html`<div class="bad" style="margin-top:6px">${S.error}</div>`}
      ${S.conn !== 'open' && html`<div class="warn" style="margin-top:6px">Connecting to the server…</div>`}
    </div>
    <div class="card">
      <h3>➕ Create a room</h3>
      <p class="muted" style="font-size:13px">Get a new unique room code to share with your friends (3–8 players).</p>
      <button class="primary big" style="width:100%" disabled=${S.conn !== 'open'} onClick=${() => go('')}>Create room</button>
    </div>
    <div class="card">
      <h3>🔑 Join a room</h3>
      <p class="muted" style="font-size:13px">Enter the 4-letter code from the room's creator (or open their invite link).</p>
      <div class="row"><input class="grow" maxlength="4" value=${code} onInput=${(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} placeholder="CODE" style="text-transform:uppercase;letter-spacing:4px;font-size:20px" />
        <button class="primary big" disabled=${code.length !== 4 || S.conn !== 'open'} onClick=${() => go(code)}>Join</button></div>
    </div></div>
  </div>`;
}

function Lobby({ v }) {
  const me = v.players.find((p) => p.id === v.me);
  const link = `${location.origin}/room/${v.code}`;
  const [rules, setRules] = useState(false);
  const n = v.players.length;
  return html`<div class="screen"><div style="width:100%;max-width:520px">
    <div class="card">
      <div class="muted">Room code</div>
      <div class="row"><span class="code">${v.code}</span>
        <button class="small" onClick=${() => { navigator.clipboard && navigator.clipboard.writeText(link); toast('Invite link copied!'); rerender(); }}>Copy invite link</button></div>
      <div class="muted" style="font-size:12px;word-break:break-all">${link}</div>
      <h3 style="margin-top:12px">Players (${n}/8)</h3>
      <ul class="plist">${v.players.map((p) => html`<li><span class="dot" style=${{ background: p.color }}></span><b>${p.id}</b> ${p.name} ${p.id === v.me ? html`<span class="muted">(you)</span>` : ''}
        <span class="grow"></span>${!p.connected ? html`<span class="badge off">offline</span>` : p.ready ? html`<span class="badge ok">✔ Ready</span>` : html`<span class="badge no">not ready</span>`}</li>`)}</ul>
      ${n >= 4 && n <= 7 && html`<div style="margin:6px 0"><div class="muted" style="font-size:13px">Specialist career${n === 7 ? 's' : ''} for this team:</div>
        <div class="row tabs" style="margin-top:4px">${[['random', '🎲 Random'], ['guard', '🛡 Guard'], ['thief', '🪝 Thief'], ['scavenger', '🎒 Scavenger']].map(([k, l]) => html`<button class=${v.settings.specialist === k ? 'on' : ''} onClick=${() => send({ t: 'setting', specialist: k })}>${l}</button>`)}</div></div>`}
      <p class="muted" style="font-size:13px">${n < 3 ? html`<b class="warn">At least 3 players are needed — share the code or invite link.</b> ` : ''}The game starts when <b>everyone</b> is Ready (3–8 players). Any change un-readies everyone.</p>
      <div class="row">
        <button class=${me && me.ready ? '' : 'primary'} style="flex:1" onClick=${() => send({ t: 'ready', v: !(me && me.ready) })} disabled=${n < 3}>${me && me.ready ? 'Cancel ready' : n < 3 ? `Waiting for players (${n}/3 minimum)…` : "I'm ready"}</button>
        <button onClick=${() => setRules(true)}>📖 Rules</button>
        <button class="danger" onClick=${() => { send({ t: 'leave' }); store.token = null; goMenu(); }}>Leave room</button>
      </div>
    </div></div>
    ${rules && html`<${RulesModal} close=${() => setRules(false)} />`}
  </div>`;
}

function RulesModal({ close }) {
  return html`<div class="modal" onClick=${close}><div class="card rules" onClick=${(e) => e.stopPropagation()}>
    <div class="row"><h2 class="grow">📖 How to play</h2><button onClick=${close}>Close</button></div>
    <h3>Goal</h3>
    <p>Everyone starts with <b>2 coins</b> and <b>3 HP</b>. Put coins into the shared <b>escape fund</b>. At the end of any round, if the fund covers <b>${FARE} coins × every living player</b>, the whole group escapes and wins. You have ${ROUNDS} rounds.</p>
    <p><b class="smug">Smugglers</b> (0–2 secret players) win differently: they need <b>${SMUGGLER_FARE} coins in their own wallet</b> to escape privately. A Smuggler looks like a normal career — wallets are private, so watch who actually contributes!</p>
    <p>Somewhere far away there are hidden <b>natural exits</b> (14+ rooms from the start). Discovering one saves every survivor for free.</p>
    <h3>Each round (${ROUND_SECONDS}s)</h3>
    <ul>${PHASES.map((p) => html`<li><b>${p.start}–${p.end}s</b> ${p.label}</li>`)}</ul>
    <p>Walk back to a <b>camp</b> (bright crystal Safe Zone) each round — shopping, loadouts, votes and theft targets only work there. Nobody teleports home!</p>
    <h3>Actions</h3>
    <p>You get <b>2 free action slots</b> per round (buy up to 2 more from the Merchant). In camp, fill each slot: a free basic tool (pickaxe, hook, crowbar…), an item you own, or a <b>Deposit</b>/<b>Trial</b> marker. In the field, tap a slot to use it. Physical actions take 3 seconds standing still — moving or getting hit interrupts them, but you keep the tool and the action and can try again. Tools are only used up when the work finishes. Unused items stay in your 7-slot bag until they expire. A tool you put in a slot but didn't use keeps its slot next round (↺, up to 2), on top of your 2 new free slots — max 4 actions per round.</p>
    <ul>
      <li><b>Pickaxe</b> — mine 1 coin in a coin mine (Workers up to 2/round, others 1). First come, first served: one person mines at a time; a mine gives at most 2 coins per round and 8 in total.</li>
      <li><b>Drill</b> (Explorer only) — open a new room through a sealed wall, or downward. Finds mines, treasure, caches, new camps, traps or empty galleries.</li>
      <li><b>Crowbar</b> — loot a treasure chest, a dropped item, or half of a body's coins (Scavengers take all).</li>
      <li><b>Hook</b> — pick a victim in camp; when choices close, if you're still in the same room, you silently steal 1 coin (Thief: 2).</li>
      <li><b>Deposit</b> — put any amount into the fund (field, return or settlement time).</li>
      <li><b>Weapons</b> (bought privately at the machine: club 1 dmg, blade 2, gun 3 at range) — attack a visible player in an unsafe room during field time. Bodies keep their coins for looting.</li>
      <li><b>Trial</b> — in a camp during field time, pay ${trialFee(1)}+ coins to accuse someone there. Majority of ALL living players must vote guilty to execute.</li>
    </ul>
    <h3>Careers</h3>
    <ul>${Object.entries(CAREERS).map(([k, c]) => html`<li><b>${c.name}</b> — ${c.blurb}</li>`)}</ul>
    <h3>Other rules</h3>
    <p><b>Pledges</b> (Camp → Pledges): post a plan asking each player for coins; others approve or reject. Pledges are promises only — compare them with what people actually gave.</p>
    <p>Traps snare the Explorer for the next round's field time (a Merchant rescue kit frees them). Dark rooms limit sight; lanterns light them. If no Explorer is left alive, survivors elect a new one. Dead players become ghosts who see everyone and can haunt their killer once per round. Disconnected players have one round of game time to reconnect from the same browser.</p>
    <p class="muted">Controls: WASD/arrow keys or drag anywhere on the screen to walk. E or the Climb button uses ladders. ☰ returns to the main menu (resume within one round or forfeit).</p>
  </div></div>`;
}

// ------------------------------------------------------------ game HUD
function Game({ v }) {
  const [tab, setTab] = useState(null);
  const idKey = 'me_idseen_' + v.code;
  const [showId, setShowId] = useState(() => { try { return v.round === 1 && !sessionStorage.getItem(idKey); } catch { return v.round === 1 && v.sec < 8; } });
  const closeId = () => { setShowId(false); try { sessionStorage.setItem(idKey, '1'); } catch {} };
  const [rules, setRules] = useState(false);
  const [menu, setMenu] = useState(false);
  const y = v.you;
  const ph = phaseAt(v.sec);
  const left = ph.end - v.sec;
  const meR = v.roster.find((r) => r.id === v.me);
  const myRoom = roomAt(S.rooms, S.me.x, S.me.y, S.me.d);
  const lad = nearLadder();
  const alive = y.status === 'alive';
  let hint = '';
  if (alive) {
    if (y.channel) hint = `Working… stand still (${(y.channel.remaining / 20).toFixed(1)}s)`;
    else if (y.trapped && ph.id === 'field') hint = '🪤 You are trapped this field phase.';
    else if (ph.id === 'arrival' && !y.inCamp) hint = 'Walk to a camp (crystal Safe Zone) to prepare.';
    else if (ph.id === 'choices' && y.inCamp) hint = 'In camp — prepare for the field';
    else if (ph.id === 'choices' && !y.inCamp) hint = 'Get to a camp before choices close!';
    else if (ph.id === 'departure') hint = 'Head out to where you will use your actions.';
    else if (ph.id === 'field') hint = 'Field time — what do you do?';
    else if (ph.id === 'return' && !y.inCamp) hint = 'Walk back to a camp!';
  } else if (y.status === 'dead') hint = '👻 You are a ghost: drift anywhere and watch everyone.';
  else if (y.status === 'escaped') hint = '🎉 You escaped! Watching…';
  else if (y.status === 'forfeit') hint = 'You forfeited this match.';

  return html`
    <div class="top">
      <span class="chip">R <b>${v.round}</b>/${ROUNDS}</span>
      <span class="chip phase">${v.meeting ? (v.meeting.type === 'trial' ? '⚖ Trial' : '🗳 Election') : ph.label.split(' — ')[0]} <span class="timer">${v.meeting ? fmt(v.meeting.remaining) : fmt(left)}</span></span>
      <span class="chip" title="Escape fund / fare">🏦 <b>${v.fund}</b>/${v.fare}</span>
      ${alive && html`<span class="chip"><${Icon} k="coin" sm /> <b>${y.coins}</b></span><span class="chip hp">${'❤'.repeat(Math.max(0, y.hp))}${'♡'.repeat(Math.max(0, 3 - y.hp))}</span>`}
      ${y.status === 'escaped' && html`<span class="chip good">🎉 Escaped!</span>`}${y.status === 'dead' && html`<span class="chip">👻 Ghost</span>`}${y.status === 'forfeit' && html`<span class="chip bad">Forfeited</span>`}
      ${alive && html`<span class=${'chip' + (y.inv.length >= INVENTORY ? ' bad' : '')} title="Bag (7 items max)">🎒 <b>${y.inv.length}</b>/${INVENTORY}</span>`}
      ${y.lock && html`<span class="chip"><${Icon} k="lock" sm />lock</span>`}${y.shield && html`<span class="chip"><${Icon} k="shield" sm />shield</span>`}
      <span class="grow"></span>
      ${S.conn !== 'open' && html`<span class="chip bad">reconnecting…</span>`}
      <button class="small" onClick=${() => setShowId(true)}>🪪 ${careerName(y.career)}</button>
      <button class="small" onClick=${() => setRules(true)}>📖</button>
      <button class="small" onClick=${() => setMenu(true)}>☰</button>
    </div>
    ${!v.meeting && html`<div class="timeline">${PHASES.map((p) => html`<div style=${{ flex: p.end - p.start, background: { arrival: '#6b5a80', choices: '#3fae6a', departure: '#6b5a80', field: '#d9822b', return: '#4a8fd9', settlement: '#8a4ad9' }[p.id], opacity: v.sec >= p.end ? 0.45 : 1 }}>${v.sec >= p.start && v.sec < p.end && html`<span class="now" style=${{ left: `calc(${((v.sec - p.start) / (p.end - p.start)) * 100}% - 2px)` }}></span>`}</div>`)}</div>`}
    <div class="feed">${S.toasts.map((t) => html`<div class="toast ${t.kind}" key=${t.id}>${t.msg}</div>`)}</div>
    ${v.meeting && html`<${Meeting} v=${v} />`}
    <div class="bottom">
      <div class="side">
      </div>
      ${alive ? html`<div class="slots">${y.slots.map((s, i) => html`<${SlotBtn} s=${s} i=${i} v=${v} />`)}</div>` : html`<div></div>`}
      <div class="side">
        <button class="big" onClick=${() => setTab(tab ? null : alive ? 'loadout' : 'people')}>${y.inCamp ? '🏕 Camp' : '🎒 Info'}${(v.proposals || []).length ? ` · 📜${v.proposals.length}` : ''}</button>
      </div>
    </div>
    ${!v.meeting && !tab && y.status !== 'forfeit' && html`<${ChoiceBox} v=${v} setTab=${setTab} title=${hint || 'What do you do?'} />`}
    ${tab && html`<${Sheet} v=${v} tab=${tab} setTab=${setTab} />`}
    ${showId && html`<${IdCard} v=${v} close=${closeId} />`}
    ${rules && html`<${RulesModal} close=${() => setRules(false)} />`}
    ${menu && html`<div class="modal" onClick=${() => setMenu(false)}><div class="card" onClick=${(e) => e.stopPropagation()}>
      <h2>Return to main menu?</h2>
      <p class="muted">Your character stays in the mine and can be robbed or attacked. Resume from the main menu within one round of game time (${ROUND_SECONDS}s) or you forfeit: your coins drop as a body and you can't come back.</p>
      <div class="row"><button class="danger" onClick=${goMenu}>Return to main menu</button><button onClick=${() => setMenu(false)}>Keep playing</button></div>
    </div></div>`}
    ${S.haunt && html`<img class="haunt" style=${{ [Math.random() < 0.5 ? 'left' : 'right']: '6px' }} src=${charSrc(S.haunt.appearance)} />`}
  `;
}

function IdCard({ v, close }) {
  const y = v.you;
  return html`<div class="modal" onClick=${close}><div class="card" onClick=${(e) => e.stopPropagation()}>
    <h2>Your private identity</h2>
    <div class="idcard"><img src=${charSrc(y.appearance)} />
      <div><div style="font-size:22px;font-weight:800">${careerName(y.career)}</div><div class="muted">${CAREERS[y.career].blurb}</div></div></div>
    <div class="note" style="font-size:15px;color:var(--ink)">${y.smuggler
      ? html`<span class="smug">You are a SMUGGLER.</span> You win by holding <b>${SMUGGLER_FARE} coins</b> at a round's end (you escape privately). Your career is a perfect cover — nobody can see your wallet. If the group escapes first, you only win if you also qualify that same round.`
      : html`<b class="good">You are an ordinary miner.</b> You win when the shared fund pays the group fare (${FARE} × living players), or if anyone finds a natural exit. Beware: Smugglers may be hoarding coins.`}</div>
    <p class="muted" style="font-size:13px">Keep this secret. Tap 🪪 at the top any time to see it again.</p>
    <button class="primary" onClick=${close}>Got it</button>
  </div></div>`;
}

function slotIconKey(s, y) {
  if (s.marker) return s.marker;
  const it = s.item && y.inv.find((i) => i.id === s.item);
  return it ? it.type : null;
}
function SlotBtn({ s, i, v }) {
  const y = v.you, k = slotIconKey(s, y);
  const it = s.item && y.inv.find((x) => x.id === s.item);
  const label = s.marker ? (s.marker === 'deposit' ? 'Deposit' : 'Trial') : it ? ITEMS[it.type].name.split(' ')[0] : 'empty';
  const usable = !s.used && k && !['hook', 'kit'].includes(k);
  const tgt = s.target && v.roster.find((r) => r.id === s.target);
  return html`<div class=${'slot' + (s.used ? ' used' : usable ? ' ready' : '')} title=${label}>
    <span class="k">${i + 1}${s.kind === 'extra' ? '+' : s.kind === 'saved' ? '↺' : ''}</span>
    ${k ? html`<img src=${itemSrc(k)} />` : html`<span class="muted">—</span>`}
    <span>${s.used ? 'used' : tgt ? '→' + tgt.name.slice(0, 6) : s.service ? s.service : label}</span>
  </div>`;
}

// Build the "What do you do?" list: every action available where you stand, in plain words.
function buildChoices(v, setTab) {
  const y = v.you, out = [];
  const add = (label, pick, opts = {}) => out.push({ label, pick, ...opts });
  const r = roomAt(S.rooms, S.me.x, S.me.y, S.me.d);
  const ph = phaseAt(v.sec).id;
  const lad = nearLadder();
  if (y.status === 'dead') {
    const k = v.roster.find((x) => x.id === y.murderer);
    if (k) add(`👻 Haunt ${k.name} (once per round)`, () => send({ t: 'haunt' }), { disabled: !y.canHaunt && 'already used this round' });
    if (lad) add(lad === 'down' ? '⬇ Drift down the ladder' : '⬆ Drift up the ladder', tryClimb);
    add('👥 See who is still alive', () => setTab('people'));
    return out;
  }
  if (y.status !== 'alive') return out;
  if (v.meeting) return out;
  if (y.channel) { add('✋ Stop what I am doing', () => send({ t: 'cancel' }), { sub: 'You keep the tool and can try again' }); return out; }
  if (lad) add(lad === 'down' ? '⬇ Climb down the ladder' : '⬆ Climb up the ladder', tryClimb);
  const others = (v.ents || []).filter((e) => !e.ghost && e.inMyRoom);
  const near = (e, d) => Math.hypot(e.x - S.me.x, e.y - S.me.y) <= d;
  const canAct = ph === 'field';
  const trapped = y.trapped && ph === 'field';
  const depositOK = ['field', 'return', 'settlement'].includes(ph);
  for (const [i, s] of y.slots.entries()) {
    if (s.used) continue;
    const act = (target) => () => send({ t: 'act', slot: s.id, target });
    const it = s.item && y.inv.find((x) => x.id === s.item);
    const tag = `slot ${i + 1}`;
    const notYet = !canAct && 'wait for field time';
    if (s.marker === 'deposit') {
      if (y.coins < 1) { add('🏦 Deposit coins into the escape fund', null, { disabled: 'you have no coins', sub: tag }); continue; }
      const amts = [...new Set([1, Math.ceil(y.coins / 2), y.coins])];
      for (const a of amts) add(`🏦 Deposit ${a === y.coins ? 'all ' : ''}${a} coin${a > 1 ? 's' : ''} into the escape fund`, act({ amount: a }), { disabled: !depositOK && 'deposits open at field time', sub: `${tag} · fund ${v.fund}/${v.fare}` });
      continue;
    }
    if (s.marker === 'trial') {
      if (!(r && r.safe)) { add('⚖ Put someone on trial', null, { disabled: 'stand in a camp', sub: tag }); continue; }
      if (!others.length) add('⚖ Put someone on trial', null, { disabled: 'nobody else is in this camp', sub: tag });
      for (const e of others) add(`⚖ Put ${e.name} on trial (${trialFee(v.round)} coins)`, act({ id: e.id }), { disabled: notYet || (v.trialUsed && 'one trial per round'), sub: `${tag} · majority of all living players must vote guilty`, danger: true });
      continue;
    }
    if (!it) continue;
    const type = it.type, name = ITEMS[type].name;
    const blocked = trapped && type !== 'rescue' ? "you're trapped" : notYet;
    if (type === 'pickaxe') add('⛏ Mine a coin here', act({}), { disabled: blocked || (!(r && r.cat === 'mine') && 'stand in a coin mine') || (r.reserve <= 0 && 'this mine is empty'), sub: `${tag} · 3s, stand still` });
    else if (type === 'drill') {
      const nm = { n: 'north', e: 'east', s: 'south', w: 'west' };
      let any = false;
      if (r) for (const k of ['n', 'e', 's', 'w']) if (!r.doors[k] && !S.rooms[cellKey(r.gx + DIRS[k][0], r.gy + DIRS[k][1], r.d)]) { any = true; add(`🔨 Drill a tunnel ${nm[k]}`, act({ dir: k }), { disabled: blocked, sub: `${tag} · 3s · discovers a new room` }); }
      if (r && !r.down && r.d < 3) { any = true; add('🔨 Drill downward', act({ dir: 'down' }), { disabled: blocked, sub: `${tag} · more mines, less treasure, never an exit` }); }
      if (!any) add('🔨 Drill a tunnel', null, { disabled: 'no sealed walls in this room', sub: tag });
    } else if (type === 'crowbar') {
      let any = false;
      if (r && r.chest > 0) { any = true; add(`💰 Loot the chest (${r.chest} coins)`, act({ kind: 'chest' }), { disabled: blocked, sub: tag }); }
      if (r && r.pickup) { any = true; add(`🎒 Pick up the ${ITEMS[r.pickup].name}`, act({ kind: 'pickup' }), { disabled: blocked, sub: tag }); }
      for (const c of v.corpses || []) if (c.d === S.me.d && !c.empty && near(c, 1.6)) { any = true; add(`💀 Search ${c.name}'s body for coins`, act({ kind: 'corpse', id: c.id }), { disabled: blocked, sub: `${tag} · ${y.career === 'scavenger' ? 'you take everything' : 'you take half'}` }); }
      if (!any) add('💰 Loot something', null, { disabled: 'stand by a chest, dropped item or body', sub: tag });
    } else if (ITEMS[type].weapon) {
      const unsafe = r && !r.safe;
      if (!others.length || !unsafe) add(`⚔ Attack with your ${name}`, null, { disabled: !unsafe ? 'no fighting inside camps' : 'nobody visible nearby', sub: tag });
      else for (const e of others) { const d = Math.hypot(e.x - S.me.x, e.y - S.me.y); add(`⚔ Attack ${e.name} with your ${name}`, act({ id: e.id }), { disabled: blocked || (y.attacked && 'one attack per round') || (d > ITEMS[type].reach && `too far (${d.toFixed(1)} tiles)`), sub: `${tag} · ${ITEMS[type].dmg} damage`, danger: true }); }
    } else if (type === 'potion') add('🧪 Drink a healing potion (+1 HP)', act({}), { disabled: blocked || (y.hp >= 3 && 'already at full health'), sub: tag });
    else if (type === 'rescue') {
      if (y.trapped) add('🪢 Free yourself from the trap', act({ id: v.me }), { disabled: notYet, sub: tag });
      const tr = others.filter((e) => e.trapped);
      for (const e of tr) add(`🪢 Free ${e.name} from the trap`, act({ id: e.id }), { disabled: blocked || (!near(e, 1.6) && 'stand next to them'), sub: tag });
      if (!y.trapped && !tr.length) add('🪢 Rescue a trapped player', null, { disabled: 'nobody trapped nearby', sub: tag });
    } else if (type === 'lantern' || type === 'rlantern') add(`🏮 Hang the ${name} to light this room`, act({}), { disabled: blocked || (r && r.safe && 'camps are already bright'), sub: tag });
    else if (type === 'compass') add('🧭 Survey with the compass', act({}), { disabled: blocked || (S.me.d !== 0 && 'only works at depth 0'), sub: `${tag} · private rough direction to the nearest exit` });
    else if (type === 'hook') add(s.target ? `🪝 Hook is set on ${(v.roster.find((x) => x.id === s.target) || {}).name}` : '🪝 Choose who to rob (in camp)', () => setTab('loadout'), { disabled: v.sec >= CHOICE_CLOSE && 'resolves automatically when choices close', sub: tag });
    else if (type === 'kit') add('🛡 Protection kit ready to sell', () => setTab('guard'), { sub: tag });
  }
  if (y.inCamp && v.sec < CHOICE_CLOSE) {
    add('📋 Prepare my action slots', () => setTab('loadout'), { sub: `before ${CHOICE_CLOSE}s` });
    add('🛒 Shop at the machine (tools & weapons)', () => setTab('machine'), { disabled: v.sec < 10 && 'opens at 10s', sub: `closes at ${SHOP_CLOSE}s` });
    if (v.roster.some((x) => x.career === 'merchant' && x.status === 'alive')) add('🤝 Visit the Merchant (extra actions & advanced goods)', () => setTab('merchant'), { disabled: v.sec < 10 && 'opens at 10s' });
    if (v.roster.some((x) => x.career === 'guard' && x.status === 'alive')) add('🛡 Hire the Guard (lock / shield)', () => setTab('guard'), { disabled: v.sec < 10 && 'opens at 10s' });
  }
  if (y.inCamp) add(`📜 Pledges${(v.proposals || []).length ? ` (${v.proposals.length} posted)` : ''}`, () => setTab('pledges'));
  return out;
}

function ChoiceBox({ v, setTab, title }) {
  const [min, setMin] = useState(false);
  const list = buildChoices(v, setTab);
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      const n = +e.key; if (!(n >= 1 && n <= 9)) return;
      const c = buildChoices(S.view, setTab).filter((x) => x.pick && !x.disabled)[n - 1];
      if (c) c.pick();
    };
    addEventListener('keydown', onKey); return () => removeEventListener('keydown', onKey);
  }, []);
  let n = 0;
  return html`<div class="choices">
    <div class="ch-hd" onClick=${() => setMin(!min)}><span class="grow">${title}</span><span class="ch-toggle">${min ? '▲' : '▼'}</span></div>
    ${!min && html`<div class="ch-list">
      ${list.length === 0 && html`<div class="ch-empty">${v.you.status === 'escaped' ? 'You escaped and won! Drift around to watch the others until the match ends.' : 'Nothing to do right here. Walk somewhere else, or wait for the next phase.'}</div>`}
      ${list.map((c) => { const live = c.pick && !c.disabled; const num = live ? ++n : null;
        return html`<button class=${'choice' + (c.danger ? ' danger' : '')} disabled=${!live} onClick=${() => live && c.pick()}>
          <span class="ch-n">${num && num <= 9 ? num : '·'}</span><span class="grow"><span class="ch-l">${c.label}</span>${(c.disabled || c.sub) && html`<small>${c.disabled ? '✖ ' + c.disabled : c.sub}</small>`}</span></button>`; })}
    </div>`}
  </div>`;
}

function Meeting({ v }) {
  const m = v.meeting, y = v.you;
  const name = (id) => (v.roster.find((r) => r.id === id) || {}).name;
  if (m.type === 'trial') return html`<div class="meeting">
    <b>⚖ Trial: ${name(m.caller)} accuses ${name(m.accused)}</b> <span class="timer">${fmt(m.remaining)}</span>
    <div class="muted" style="font-size:13px">Guilty needs more than half of all ${m.electorate} living players. ${m.voted} voted. Vote from a Safe Zone; you can change your vote.</div>
    ${m.canVote && y.status === 'alive' ? html`<div class="row" style="margin-top:6px"><button class=${m.myVote === true ? 'danger' : ''} onClick=${() => send({ t: 'vote', v: true })}>Guilty ${m.myVote === true ? '✔' : ''}</button><button class=${m.myVote === false ? 'primary' : ''} onClick=${() => send({ t: 'vote', v: false })}>Spare ${m.myVote === false ? '✔' : ''}</button>${!y.inCamp && html`<span class="warn">Go to a camp to vote</span>`}</div>` : ''}
  </div>`;
  const voting = m.remaining <= 10;
  return html`<div class="meeting">
    <b>🗳 No Explorer left — elect a new one</b> <span class="timer">${fmt(m.remaining)}</span>
    <div class="muted" style="font-size:13px">${voting ? 'Vote for a volunteer (majority of all living players needed).' : 'Volunteers step forward (first 10s). The winner permanently becomes an Explorer.'}</div>
    ${y.status === 'alive' && html`<div class="row" style="margin-top:6px">
      ${!voting && html`<button onClick=${() => send({ t: 'volunteer' })} disabled=${m.volunteers.includes(v.me)}>${m.volunteers.includes(v.me) ? 'Volunteered ✔' : 'Volunteer'}</button>`}
      ${voting && m.volunteers.map((id) => html`<button class=${m.myVote === id ? 'primary' : ''} onClick=${() => send({ t: 'vote', v: id })}>${name(id)}</button>`)}
      ${voting && !m.volunteers.length && html`<span class="muted">Nobody volunteered.</span>`}
      ${!y.inCamp && html`<span class="warn">Be in a camp to take part</span>`}</div>`}
  </div>`;
}

function Sheet({ v, tab, setTab }) {
  const y = v.you, alive = y.status === 'alive';
  const tabs = alive ? [['loadout', 'Actions'], ['machine', 'Machine'], ['merchant', 'Merchant'], ['guard', 'Guard'], ['pledges', `Pledges${(v.proposals || []).length ? ' ' + v.proposals.length : ''}`], ['bag', `Bag ${y.inv.length}/${INVENTORY}`], ['people', 'People']] : [['pledges', 'Pledges'], ['people', 'People']];
  const sec = v.sec, ph = phaseAt(sec).id;
  const shopOpen = y.inCamp && sec >= 10 && sec < SHOP_CLOSE && !v.meeting;
  const loadOpen = y.inCamp && sec < CHOICE_CLOSE && !v.meeting;
  const shopNote = !y.inCamp ? html`<div class="note warn">You are not in a camp — this is read-only.</div>`
    : sec < 10 ? html`<div class="note">Shopping opens at 10s (choices phase). You can already fill slots.</div>`
    : sec >= SHOP_CLOSE ? html`<div class="note">Shopping is closed for this round.</div>` : html`<div class="note">Shop closes in ${fmt(SHOP_CLOSE - sec)}. Buying takes no action.</div>`;
  let body;
  if (tab === 'loadout') body = html`<${Loadout} v=${v} open=${loadOpen} />`;
  else if (tab === 'machine') body = html`${shopNote}<${Machine} v=${v} open=${shopOpen} />`;
  else if (tab === 'merchant') body = html`${shopNote}<${Merchant} v=${v} open=${shopOpen} />`;
  else if (tab === 'guard') body = html`${shopNote}<${Guard} v=${v} open=${shopOpen} />`;
  else if (tab === 'bag') body = html`<${Bag} v=${v} />`;
  else if (tab === 'pledges') body = html`<${Pledges} v=${v} />`;
  else body = html`<${People} v=${v} />`;
  return html`<div class="sheet">
    <div class="hd tabs">${tabs.map(([k, l]) => html`<button class=${tab === k ? 'on' : ''} onClick=${() => setTab(k)}>${l}</button>`)}<span class="grow"></span><button class="small" onClick=${() => setTab(null)}>✕</button></div>
    <div class="bd">${body}</div></div>`;
}

const EMOJI = { pickaxe: '⛏', drill: '🔨', hook: '🪝', crowbar: '🪛', kit: '🛡', club: '🏏', blade: '🗡', gun: '🔫', lantern: '🏮', rlantern: '🏮', potion: '🧪', rescue: '🪢', compass: '🧭', deposit: '🏦', trial: '⚖' };
// Slot editor built from buttons (not native <select>): the HUD re-renders 10x/second, which
// resets an open native dropdown in Chrome and swallows the player's pick.
function Loadout({ v, open }) {
  const y = v.you;
  const bound = new Set(y.slots.filter((s) => !s.used && s.item).map((s) => s.item));
  const freeTools = ['pickaxe', 'hook', 'crowbar', 'drill', 'kit'].filter((t) => !ITEMS[t].career || ITEMS[t].career === y.career);
  const sameRoom = (v.ents || []).filter((e) => !e.ghost && e.inMyRoom);
  const [editing, setEditing] = useState(null);
  const [pending, setPending] = useState({});
  const current = (s) => (s.marker ? s.marker : s.item ? 'item:' + s.item : 'none');
  const pick = (s, what) => { setPending({ ...pending, [s.id]: { before: current(s), at: Date.now() } }); setEditing(null); send({ t: 'setSlot', slot: s.id, what }); };
  const describe = (s) => {
    const it = s.item && y.inv.find((x) => x.id === s.item);
    if (s.marker === 'deposit') return '🏦 Deposit marker';
    if (s.marker === 'trial') return `⚖ Trial marker (fee ${trialFee(v.round)}c)`;
    if (it) return `${EMOJI[it.type] || ''} ${itemLabel(it)}`;
    return '— empty —';
  };
  return html`
    ${!y.inCamp ? html`<div class="note warn">Not in a camp: slots can only be changed in a camp before ${CHOICE_CLOSE}s.</div>` : !open ? html`<div class="note">Action slots are locked for this round.</div>` : html`<div class="note">Tap a slot to choose what goes in it (before ${CHOICE_CLOSE}s). Each free slot can give you one free basic tool. Your career tool: <b>${ITEMS[CAREERS[y.career].preset].name}</b>.</div>`}
    ${y.trappedNext && html`<div class="note warn">🪤 You are snared NEXT round (no field work).</div>`}
    ${y.slots.map((s, i) => {
      const it = s.item && y.inv.find((x) => x.id === s.item);
      const pend = pending[s.id] && pending[s.id].before === current(s) && Date.now() - pending[s.id].at < 1500; // waiting for the server
      const canEdit = open && !s.used && !s.service && s.kind !== 'saved';
      const isOpen = editing === s.id && canEdit;
      const opts = [];
      if (s.kind === 'free' && !s.freeIssued) for (const t of freeTools) opts.push([`free:${t}`, `${EMOJI[t]} Take a FREE ${ITEMS[t].name}`, ITEMS[t].use]);
      for (const x of y.inv) if (!bound.has(x.id) || x.id === s.item) opts.push([`item:${x.id}`, `${EMOJI[x.type] || ''} Use my ${itemLabel(x)}`, ITEMS[x.type].use]);
      opts.push(['deposit', '🏦 Deposit marker', 'Give any amount of coins to the escape fund (no tool needed)']);
      opts.push(['trial', `⚖ Trial marker`, `Accuse someone in a camp during field time (fee ${trialFee(v.round)}c)`]);
      opts.push(['none', '✖ Leave empty', i === 0 ? 'Slot 1 gets your career tool automatically if left empty' : 'This action is lost if left empty']);
      return html`<div class="item" style="flex-direction:column;align-items:stretch">
        <button class="choice" disabled=${!canEdit} onClick=${() => setEditing(isOpen ? null : s.id)}>
          <span class="ch-n">${i + 1}</span>
          <span class="grow"><span class="ch-l">${s.used ? 'used' : pend ? '⏳ saving…' : describe(s)}</span>
            <small>${s.kind === 'saved' ? '↺ saved from last round — locked to this tool' : s.kind === 'extra' ? 'extra slot (no free tool)' : s.freeIssued ? 'free tool already taken' : 'free slot — can take a free tool'}${s.service ? ' · committed to ' + s.service : ''}${it && !s.service ? ' · ' + ITEMS[it.type].use : ''}</small></span>
          ${canEdit && html`<span class="ch-toggle">${isOpen ? '▲' : 'Change ▼'}</span>`}
        </button>
        ${isOpen && html`<div class="col" style="gap:5px;margin-top:6px">${opts.map(([what, label, sub]) => html`<button class=${'choice' + (what === current(s) ? ' picked' : '')} onClick=${() => pick(s, what)}><span class="grow"><span class="ch-l">${label}${what === current(s) ? ' ✔' : ''}</span><small>${sub}</small></span></button>`)}</div>`}
        ${it && it.type === 'hook' && !s.used && html`<div style="margin-top:6px"><div class="muted" style="font-size:13px">🪝 Rob who? (must be in this camp; resolves when choices close if you're still in the same room)</div>
          <div class="row" style="margin-top:4px">${sameRoom.map((e) => html`<button class=${'small' + (s.target === e.id ? ' primary' : '')} disabled=${!open} onClick=${() => send({ t: 'setTheft', slot: s.id, target: s.target === e.id ? null : e.id })}>${e.name}${s.target === e.id ? ' ✔' : ''}</button>`)}
          ${!sameRoom.length && html`<span class="muted" style="font-size:13px">Nobody else is in this camp.</span>`}
          ${s.target && !sameRoom.some((e) => e.id === s.target) && html`<span class="warn" style="font-size:13px">Target: ${(v.roster.find((r) => r.id === s.target) || {}).name} (not here now)</span>`}</div></div>`}
      </div>`;
    })}
    <p class="muted" style="font-size:12px">Unused tools in slots carry over to next round (↺, max 2) on top of your 2 new free slots. Need more actions? See the Merchant tab (max 4 per round in total).</p>`;
}

function Machine({ v, open }) {
  const y = v.you;
  const hasWeapon = y.inv.some((i) => ITEMS[i.type].weapon);
  const line = (type, price, note = '') => html`<div class="item"><${Icon} k=${type} /><div class="grow">${ITEMS[type].name} <b class="gold">${price}c</b><small>${note || ITEMS[type].use}</small></div>
    <button class="small" disabled=${!open || y.coins < price || y.inv.length >= INVENTORY || (note && ITEMS[type].weapon)} onClick=${() => send({ t: 'buy', item: type })}>Buy</button></div>`;
  return html`<h3>Tool machine (private)</h3>
    <div class="note plain">Nobody sees what you buy here. Each free action slot already gives you one free basic tool — buy extras to save for later.</div>
    ${['pickaxe', 'hook', 'crowbar', 'drill', 'kit'].filter((t) => !ITEMS[t].career || ITEMS[t].career === y.career).map((t) => line(t, 1))}
    ${line('lantern', 2)}
    <h3 style="margin-top:10px">⚔ Weapons</h3>
    <div class="muted" style="font-size:12px">One weapon max. Prices rise every 2 rounds; an older weapon pays the difference when equipped.</div>
    ${['club', 'blade', 'gun'].map((t) => line(t, weaponPrice(t, v.round), hasWeapon ? 'You already own a weapon' : ''))}`;
}

function Merchant({ v, open }) {
  const y = v.you, m = v.merchant, isM = y.career === 'merchant';
  const merchant = v.roster.find((r) => r.career === 'merchant' && r.status === 'alive');
  if (!merchant) return html`<div class="note">The Merchant is gone — no more extra actions or advanced goods can be bought.</div>`;
  const nextU = UPGRADES[m.tier + 1];
  return html`<h3>${isM ? 'Your shop' : `${merchant.name}'s shop`} · tier ${m.tier}</h3>
    ${isM ? html`<label class="row note"><input type="checkbox" checked=${m.open} onChange=${(e) => send({ t: 'merchantOpen', v: e.target.checked })} /> Open for business (customers can buy while we're both in camps)</label>
      <div class="note">You keep at most 2 coins of profit per round; the rest of each price is burned. Buying your own goods costs only the stock price.</div>`
      : html`<div class="note ${m.open ? '' : 'warn'}">${m.open ? 'Open — the Merchant must also be standing in a camp.' : 'The Merchant has closed the shop.'}</div>`}
    <div class="item"><${Icon} k="extra" /><div class="grow">Extra action slot <b class="gold">${m.nextPrice}c</b><small>Price rises with each sale this round (1, 2, 3…). You have ${y.extras}/2 extras.</small></div>
      <button class="small" disabled=${!open || y.coins < m.nextPrice || y.extras >= 2 || y.slots.length >= 4} onClick=${() => send({ t: 'buyExtra' })}>Buy</button></div>
    ${Object.entries(MERCHANT_GOODS).map(([k, g]) => {
      const price = isM ? g.cost : g.price, left = 2 - (m.sold[k] || 0);
      const locked = m.tier < g.tier || (k === 'compass' && v.round < 2);
      return html`<div class="item ${locked ? 'muted' : ''}"><${Icon} k=${k} /><div class="grow">${ITEMS[k].name} <b class="gold">${price}c</b><small>${locked ? `Unlocks at tier ${g.tier}${k === 'compass' ? ' (round 2+)' : ''}` : `${ITEMS[k].use} · ${left} left this round`}</small></div>
        <button class="small" disabled=${locked || !open || y.coins < price || left <= 0 || (k === 'compass' && y.career !== 'explorer')} onClick=${() => send({ t: 'merchantBuy', good: k })}>Buy</button></div>`;
    })}
    ${isM && html`<h3 style="margin-top:10px">Upgrade catalog</h3>${nextU ? html`<div class="item"><div class="grow">Tier ${m.tier + 1} for <b class="gold">${nextU.cost}c</b> (burned)<small>Available from round ${nextU.round}. Upgrades are public.</small></div>
      <button class="small" disabled=${!open || y.coins < nextU.cost || v.round < nextU.round || m.upgradedRound === v.round} onClick=${() => send({ t: 'upgrade' })}>Upgrade</button></div>` : html`<div class="muted">Fully upgraded.</div>`}`}`;
}

function Guard({ v, open }) {
  const y = v.you, g = v.guard, isG = y.career === 'guard';
  const guard = v.roster.find((r) => r.career === 'guard' && r.status === 'alive');
  if (!guard) return html`<div class="note">There is no living Guard in this game.</div>`;
  if (isG) {
    const kits = y.slots.filter((s) => !s.used && s.item && (y.inv.find((i) => i.id === s.item) || {}).type === 'kit');
    return html`<h3>Your protection services</h3>
      <label class="row note"><input type="checkbox" checked=${g.open} onChange=${(e) => send({ t: 'guardOpen', v: e.target.checked })} /> Open for business</label>
      <div class="note">Each sale uses one <b>protection kit</b> sitting in one of your action slots (you have ${kits.length}). Put kits in your slots in the Actions tab. You are paid immediately; the service installs when choices close.</div>
      <div>Wallet lock (1c): ${g.sold.lock ? 'sold ✔' : 'available'} · Life shield (2c): ${g.sold.shield ? 'sold ✔' : 'available'}</div>`;
  }
  return html`<h3>${guard.name}'s protection</h3>
    <div class="note ${g.open ? '' : 'warn'}">${g.open ? 'The Guard must be in a camp with a free protection kit in an action slot.' : 'The Guard is not selling right now.'}</div>
    <div class="item"><${Icon} k="lock" /><div class="grow">Wallet lock <b class="gold">1c</b><small>Blocks all theft against you this round.</small></div>
      <button class="small" disabled=${!open || g.sold.lock || y.coins < 1} onClick=${() => send({ t: 'guardBuy', svc: 'lock' })}>${g.sold.lock ? 'Sold' : 'Buy'}</button></div>
    <div class="item"><${Icon} k="shield" /><div class="grow">Life shield <b class="gold">2c</b><small>Blocks one whole weapon hit this round (not a trial).</small></div>
      <button class="small" disabled=${!open || g.sold.shield || y.coins < 2} onClick=${() => send({ t: 'guardBuy', svc: 'shield' })}>${g.sold.shield ? 'Sold' : 'Buy'}</button></div>`;
}

function Pledges({ v }) {
  const y = v.you, alive = y.status === 'alive';
  const living = v.roster.filter((r) => r.status === 'alive');
  const name = (id) => (v.roster.find((r) => r.id === id) || {}).name || id;
  const mine = (v.proposals || []).find((p) => p.by === v.me);
  const [draft, setDraft] = useState(() => (mine ? { ...mine.amounts } : {}));
  const total = living.reduce((a, r) => a + (draft[r.id] || 0), 0);
  const need = Math.max(0, v.fare - v.fund);
  const split = () => { const d = {}, n = living.length; living.forEach((r, i) => (d[r.id] = Math.floor(need / n) + (i < need % n ? 1 : 0))); setDraft(d); };
  const can = alive && y.inCamp && !v.meeting;
  return html`
    <div class="note">Pledges are <b>promises, not payments</b>: no coins move. Everyone still pays with their own Deposit action. Compare "asked" with "gave this round" to see who kept their word. Plans reset every round.</div>
    <div>Fund <b class="gold">${v.fund}</b> / fare ${v.fare} · still needed <b>${need}</b></div>
    ${(v.proposals || []).length === 0 && html`<p class="muted">No plans posted this round.</p>`}
    ${(v.proposals || []).map((pr) => {
      const yes = Object.entries(pr.votes).filter(([, x]) => x).map(([k]) => name(k)), no = Object.entries(pr.votes).filter(([, x]) => !x).map(([k]) => name(k));
      const my = pr.votes[v.me];
      return html`<div class="note" style="color:var(--ink)">
        <b>${name(pr.by)}'s plan</b> · total <b class="gold">${pr.total}</b>
        <table><tr><th>Player</th><th>Asked</th><th>Gave this round</th></tr>
          ${Object.entries(pr.amounts).map(([id, n]) => { const r = v.roster.find((x) => x.id === id) || {}; return html`<tr><td>${name(id)}${r.status && r.status !== 'alive' ? ' (' + r.status + ')' : ''}</td><td class="gold">${n}</td><td class=${(r.roundContrib || 0) >= n ? 'good' : ''}>${r.roundContrib || 0}</td></tr>`; })}</table>
        <div style="font-size:13px;margin:4px 0">👍 ${yes.join(', ') || '—'} · 👎 ${no.join(', ') || '—'}</div>
        ${alive && pr.by !== v.me && html`<div class="row"><button class=${'small' + (my === true ? ' primary' : '')} disabled=${!can} onClick=${() => send({ t: 'approve', by: pr.by, rev: pr.rev, v: my === true ? null : true })}>👍 Approve</button>
          <button class=${'small' + (my === false ? ' danger' : '')} disabled=${!can} onClick=${() => send({ t: 'approve', by: pr.by, rev: pr.rev, v: my === false ? null : false })}>👎 Reject</button></div>`}
      </div>`;
    })}
    ${alive && html`<h3 style="margin-top:10px">${mine ? 'Edit your plan' : 'Post a plan'}</h3>
      ${!can && html`<div class="note warn">Go to a camp to post or approve plans.</div>`}
      ${living.map((r) => html`<div class="row" style="margin:3px 0"><span class="grow"><span class="dot" style=${{ background: r.color }}></span>${r.name}${r.id === v.me ? ' (you)' : ''}</span>
        <button class="small" onClick=${() => setDraft({ ...draft, [r.id]: Math.max(0, (draft[r.id] || 0) - 1) })}>−</button><b style="min-width:26px;text-align:center">${draft[r.id] || 0}</b>
        <button class="small" onClick=${() => setDraft({ ...draft, [r.id]: Math.min(99, (draft[r.id] || 0) + 1) })}>+</button></div>`)}
      <div class="row" style="margin-top:6px"><button class="small" onClick=${split}>Split what's needed (${need})</button><span class="grow">Total ${total}</span>
        <button class="primary small" disabled=${!can || total <= 0} onClick=${() => send({ t: 'propose', amounts: draft })}>${mine ? 'Update plan' : 'Post plan'}</button>
        ${mine && html`<button class="small" onClick=${() => send({ t: 'withdraw' })}>Withdraw</button>`}</div>`}`;
}

function Bag({ v }) {
  const y = v.you;
  return html`<h3>Bag ${y.inv.length}/${INVENTORY}</h3>
    ${y.inv.length === 0 && html`<div class="muted">Empty.</div>`}
    ${y.inv.map((it) => html`<div class="item"><${Icon} k=${it.type} /><div class="grow">${itemLabel(it)}<small>${ITEMS[it.type].use}</small></div>
      <button class="small danger" disabled=${!y.inCamp} onClick=${() => confirm(`Discard ${ITEMS[it.type].name}?`) && send({ t: 'discard', item: it.id })}>Discard</button></div>`)}
    ${y.notes.length > 0 && html`<h3 style="margin-top:10px">Compass notes</h3>${y.notes.map((n) => html`<div class="note">From room (${n.gx},${n.gy}): exit roughly <b>${n.label}</b></div>`)}`}`;
}

function People({ v }) {
  const st = { alive: '', dead: '☠ dead', escaped: '🎉 escaped', forfeit: 'forfeited' };
  return html`<h3>Escape fund: <span class="gold">${v.fund}</span> / ${v.fare}</h3>
    <div class="muted" style="font-size:13px">Group fare = ${FARE} × living players. Contributions are public; wallets are private.</div>
    <table><tr><th>Player</th><th>Career</th><th>Gave</th><th></th></tr>
    ${v.roster.map((r) => html`<tr><td><span class="dot" style=${{ background: r.color }}></span>${r.name}${r.id === v.me ? ' (you)' : ''}</td><td>${careerName(r.career)}</td><td class="gold">${r.contrib}</td><td>${st[r.status]}${!r.connected && r.status !== 'forfeit' ? ' 📵' : ''}</td></tr>`)}</table>
    <p class="muted" style="font-size:13px">Merchant: tier ${v.merchant.tier}, invested ${v.merchant.invested} coins.</p>
    <h3>Recent events</h3>${(v.log || []).slice().reverse().map((l) => html`<div class="muted" style="font-size:13px">R${l.round}: ${l.msg}</div>`)}`;
}

function Results({ v }) {
  const r = v.result;
  const headline = { natural: '☀ A natural exit saved every survivor!', group: '🏦 The escape fund paid the fare — the group escaped!', timeout: '⛓ Time ran out. The mine sealed.', none: '☠ Nobody made it out.' }[r.kind];
  const outcome = (p) => p.status === 'escaped' ? html`<span class="good">WON (${p.winType === 'private' ? 'private escape' : p.winType === 'natural' ? 'natural exit' : 'group fare'})</span>` : p.status === 'dead' ? html`<span class="bad">died</span>` : p.status === 'forfeit' ? html`<span class="bad">forfeited</span>` : html`<span class="bad">trapped below</span>`;
  const ranked = r.players.slice().sort((a, b) => b.contrib - a.contrib);
  return html`<div class="screen"><div class="card" style="max-width:640px">
    <div class="results-banner">${headline}</div>
    <p class="muted">Ended in round ${r.round}. Secret identities revealed:</p>
    <table><tr><th>Player</th><th>Career</th><th>Secret</th><th>Gave</th><th>Result</th></tr>
      ${ranked.map((p) => html`<tr class=${p.status === 'escaped' ? 'win-row' : ''}><td><span class="dot" style=${{ background: p.color }}></span>${p.name}</td><td>${careerName(p.career)}</td><td>${p.smuggler ? html`<span class="smug">Smuggler</span>` : 'ordinary'}</td><td class="gold">${p.contrib}</td><td>${outcome(p)}</td></tr>`)}</table>
    <h3 style="margin-top:12px">Highlights</h3>
    <ul>${ranked.map((p) => { const s = p.stats, bits = [];
      if (s.rooms) bits.push(`opened ${s.rooms} room${s.rooms > 1 ? 's' : ''}`); if (s.mined) bits.push(`mined ${s.mined} coin${s.mined > 1 ? 's' : ''}`);
      if (s.looted) bits.push(`looted ${s.looted}`); if (s.kills) bits.push(`eliminated ${s.kills}`); if (s.traps) bits.push(`hit ${s.traps} trap${s.traps > 1 ? 's' : ''}`); if (s.rescues) bits.push(`rescued ${s.rescues}`);
      return bits.length ? html`<li><b>${p.name}</b> ${bits.join(', ')}.</li>` : ''; })}
      ${ranked.every((p) => !Object.values(p.stats).some((x) => x)) && html`<li class="muted">A quiet expedition — nobody mined, explored or looted.</li>`}</ul>
    <div class="row"><button class="primary" onClick=${() => send({ t: 'rematch' })}>Play again (back to lobby)</button>
      <button onClick=${() => { store.token = null; goMenu(); }}>Main menu</button></div>
  </div></div>`;
}

function App() {
  const [, set] = useState(0);
  useEffect(() => { rerender = () => set((n) => n + 1); }, []);
  if (S.screen === 'menu') return html`<${MainMenu} />`;
  if (S.screen === 'quit') return html`<${QuitScreen} />`;
  const v = S.view;
  if (!v) return store.token ? html`<div class="screen"><div class="card">Connecting… <button class="small" onClick=${goMenu}>Main menu</button></div></div>` : html`<${JoinScreen} />`;
  if (v.state === 'lobby') return html`<${Lobby} v=${v} />`;
  if (v.state === 'over') return html`<${Results} v=${v} />`;
  return html`<${Game} v=${v} />`;
}
render(html`<${App} />`, document.getElementById('app'));
connect();
// Keep free-tier hosts awake during a match (some count only HTTP requests as activity).
setInterval(() => { if (S.view && S.view.state === 'game') fetch('/healthz', { cache: 'no-store' }).catch(() => {}); }, 4 * 60 * 1000);
