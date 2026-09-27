import { Gfx, rng, type Env, type Layer, type P } from "./core";
import { smooth } from "./gallery";
import { INK_M } from "./shang";
import { backF, body, headF, line, me, oval, rrect, shape, soft, sparkle, star, POSE0, type Pose } from "./flat";

// 《风也温柔》v2 · six scenes in the flat, outlined, soft hand. Every scene is a pure function of its
// local time in seconds. Out-of-focus backgrounds are painted once per scale and cached.

export const W = 1920, H = 1080;
const S = (pts: P[], closed = true, per = 8) => smooth(pts, closed, per);
const R = (x: number, y: number, w: number, h: number): P[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

// ---------------------------------------------------------------- plumbing
export const cached = (env: Env, key: string, paint: (g: Gfx) => void): Layer => {
  const k = `wind:${key}:${env.scale}`; let L = env.cache.get(k) as Layer | undefined; if (L) return L;
  L = env.canvas(Math.round(W * env.scale), Math.round(H * env.scale)); L.ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0);
  paint(new Gfx(L.ctx, env, 0, INK_M)); env.cache.set(k, L); return L;
};
export const blit = (g: Gfx, L: Layer, a = 1) => { if (a <= 0) return; const c = g.cur; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = a; c.drawImage(L.canvas as CanvasImageSource, 0, 0); c.restore(); };
const nightTint = (g: Gfx, env: Env, a: number, col = "#7c83bd") => { if (a <= 0) return; const c = g.cur; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = "multiply"; c.globalAlpha = a; c.fillStyle = col; c.fillRect(0, 0, W * env.scale, H * env.scale); c.restore(); };
const trail = (g: Gfx, pts: P[], t: number) => pts.forEach(([x, y], i) => sparkle(g, x, y, 10 * (1 - i / pts.length) * (0.7 + 0.3 * Math.sin(t * 20 + i)), "#ffe3a3"));

// ---------------------------------------------------------------- the room (night and day), out of focus
const ROOM = {
  night: { wall0: "#343a63", wall1: "#454a78", sky: "#56639f", moon: "#f8efcf", roofs: "#2a3160", lit: "#ffd27e", frame: "#d8d0e2", curtain: "#7f93c4", cork: "#b48c64", shelf: "#8a6c56", lamp: "#e08a4e" },
  day: { wall0: "#f1e6d6", wall1: "#e7d8c4", sky: "#a8d4f2", moon: "#fff6d9", roofs: "#c9bdb4", lit: "#e9dccf", frame: "#fbf6ee", curtain: "#f2c7a2", cork: "#c89f72", shelf: "#b08a6c", lamp: "#ef9a5a" },
};
export const room = (g: Gfx, day = false, blur = 16) => {
  const p = day ? ROOM.day : ROOM.night, c = g.cur;
  const wall = c.createLinearGradient(0, 0, 0, H); wall.addColorStop(0, p.wall0); wall.addColorStop(1, p.wall1); c.fillStyle = wall; c.fillRect(0, 0, W, H);
  g.group("plain", () => {
    shape(g, R(1250, 100, 440, 420), p.sky, 0);
    if (!day) { soft(g, 1540, 220, 150, "#fff4d0", 0.35); shape(g, oval(1540, 220, 40, 40), p.moon, 0); }
    else { soft(g, 1400, 200, 260, "#fff8e0", 0.7); shape(g, S([[1300, 200], [1360, 170], [1440, 180], [1470, 210], [1380, 222]]), "#ffffff", 0); }
    shape(g, [[1250, 520], [1250, 400], [1320, 400], [1320, 360], [1400, 360], [1400, 420], [1470, 420], [1470, 330], [1540, 330], [1540, 390], [1620, 390], [1620, 350], [1690, 350], [1690, 520]], p.roofs, 0);
    if (!day) [[1340, 380], [1362, 380], [1488, 350], [1488, 372], [1640, 368], [1418, 440]].forEach(([x, y]) => shape(g, R(x, y, 12, 14), p.lit, 0));
    line(g, [[1470, 100], [1470, 520]], 14, false, p.frame); line(g, [[1250, 300], [1690, 300]], 14, false, p.frame);
    line(g, R(1250, 100, 440, 420), 22, true, p.frame);
    shape(g, S([[1700, 60], [1860, 60], [1880, 400], [1860, 760], [1716, 760], [1730, 400]]), p.curtain, 0);
    shape(g, R(230, 140, 380, 250), p.cork, 0);
    shape(g, R(262, 168, 90, 80), "#f3d86b", 0); shape(g, R(372, 160, 84, 76), "#f4b3a8", 0); shape(g, R(476, 176, 100, 150), "#f6f1e6", 0); shape(g, R(290, 266, 150, 96), "#bfdcb4", 0);
    shape(g, R(150, 500, 520, 22), p.shelf, 0);
    [[180, "#d27d62", 90], [212, "#7c9cc2", 110], [244, "#e1bd66", 96], [276, "#9d8cc0", 84]].forEach(([x, col, h]) => shape(g, R(x as number, 500 - (h as number), 28, h as number), col as string, 0));
    shape(g, R(560, 440, 70, 60), "#c97a55", 0); shape(g, S([[540, 440], [580, 380], [640, 400], [650, 450], [600, 470]]), "#6fa36a", 0); shape(g, S([[620, 470], [650, 560], [630, 640], [610, 560]]), "#6fa36a", 0);
    line(g, [[980, 0], [980, 60]], 4, false, day ? "#8a7b70" : "#23284a"); shape(g, [[930, 110], [1030, 110], [1004, 60], [956, 60]], p.lamp, 0);
  }, { blur });
};
export const desk = (g: Gfx, day = false) => {
  shape(g, [[-10, 900], [1930, 900], [1930, 1090], [-10, 1090]], day ? "#b08a6e" : "#7a5f4f", 3);
  line(g, [[-10, 930], [1930, 930]], 2, false, day ? "#94725a" : "#5f4a3e");
  shape(g, rrect(752, 700, 296, 198, 16), "#9a9eab", 3);
  line(g, [[772, 714], [1028, 714]], 2, false, "#b6b9c5");
  soft(g, 900, 800, 24, "#c9ccd6", 0.9); line(g, S([[893, 791], [900, 787], [907, 791], [909, 804], [900, 811], [891, 804]], true, 6), 1.5, true, "#80848f", 0.8);
  shape(g, rrect(734, 894, 332, 14, 6), "#7d8190", 3);
  shape(g, S([[876, 894], [924, 894], [917, 902], [883, 902]], true, 4), "#5d606d", 0);
  line(g, S([[410, 826], [444, 832], [444, 872], [408, 880]], false), 9, false, "#2b2024"); line(g, S([[410, 826], [444, 832], [444, 872], [408, 880]], false), 4.5, false, "#f1e7d6");
  shape(g, rrect(330, 800, 84, 106, 10), "#f1e7d6", 3); shape(g, rrect(344, 806, 56, 10, 5), "#6b4a38", 0);
};
const boy = (g: Gfx, x: number, y: number, s: number, p: Pose) => { body(g, x, y, s); headF(g, x, y, s, p); };

// ---------------------------------------------------------------- 1 · the galaxy (0-4 s)
const paintGalaxy = (g: Gfx) => {
  const c = g.cur, r = rng(3), gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#0e1433"); gr.addColorStop(1, "#23306a"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
  g.group("plain", () => { for (let i = 0; i < 40; i++) { const u = r(), x = u * W, y = H * 0.78 - u * H * 0.62 + (r() - 0.5) * 220; shape(g, oval(x, y, 120 + r() * 200, 50 + r() * 80), ["#4a4f9a", "#7a62a8", "#b27aa8", "#4f78b8"][i % 4], 0); } }, { blur: 40, alpha: 0.5 });
  for (let i = 0; i < 700; i++) { const u = r(), x = r() * W, y = r() * H, band = Math.abs(y - (H * 0.78 - (x / W) * H * 0.62)) < 160; c.globalAlpha = (band ? 0.5 : 0.3) + r() * 0.5; c.fillStyle = r() < 0.12 ? "#ffe2bf" : "#eef1ff"; c.beginPath(); c.arc(x, y, (band ? 0.8 : 0.5) + u * 1.6, 0, Math.PI * 2); c.fill(); }
  c.globalAlpha = 1;
};
const TW = (() => { const r = rng(8), a: { x: number; y: number; r: number; sp: number; ph: number }[] = []; for (let i = 0; i < 18; i++) a.push({ x: r() * W, y: r() * H, r: 8 + r() * 12, sp: 2 + r() * 3, ph: r() * 6 }); return a; })();
export const sGalaxy = (g: Gfx, t: number, env: Env) => {
  blit(g, cached(env, "galaxy", paintGalaxy));
  TW.forEach((s) => sparkle(g, s.x, s.y, s.r * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph)), "#fff1cf"));
  const SX = 1150, SY = 380, an = clamp((t - 0.8) / 0.4) * (1 - clamp((t - 3.1) / 0.3));
  if (an > 0) { line(g, S(oval(SX, SY, 58, 54, 14), true, 4), 2.2, true, "#efe2c8", an); line(g, S([[SX + 46, SY - 36], [SX + 84, SY - 70], [SX + 104, SY - 76]], false), 2, false, "#efe2c8", an); const c = g.cur; c.save(); c.globalAlpha = an; c.fillStyle = "#efe2c8"; c.font = `40px "Reenie Beanie", "Bradley Hand", cursive`; c.textBaseline = "middle"; c.fillText("#00263893", SX + 112, SY - 80); c.restore(); }
  const fall = clamp((t - 3.3) / 0.7), sx = SX - fall * 260, sy = SY + fall * fall * 760;
  if (fall > 0) trail(g, [0.05, 0.1, 0.16, 0.22].map((d) => { const f = Math.max(0, fall - d); return [SX - f * 260, SY + f * f * 760] as P; }), t);
  star(g, sx, sy, 34, { eyes: t < 1.3 || (t > 2 && t < 2.12) ? "closed" : "open", look: [0, t > 2.6 ? 1 : 0], glow: 1 + 0.2 * Math.sin(t * 5), blush: 0.6, legs: 0 });
};

// ---------------------------------------------------------------- 2 · 3 a.m. (4-10 s): the star lands and becomes me
export const LAND = 2.8;
export const sDesk = (g: Gfx, t: number, env: Env) => {
  blit(g, cached(env, "roomNight6", (h) => room(h, false, 6)));
  const k = t - LAND, typing = k < 0.3;
  const pose: Pose = typing ? { ...POSE0, look: [0.05, 1], mouth: "flat", blush: 0.2, screen: 1, eyes: Math.abs(t - 1.2) < 0.08 ? "closed" : "open" }
    : { ...POSE0, look: [0.55, 0.7], mouth: k > 1.2 ? "smile" : "flat", blush: 0.3 + 0.6 * clamp((k - 0.5) / 0.8), screen: 0.5, eyes: k > 0.35 && k < 0.5 ? "closed" : "open" };
  boy(g, 900, 392 + (typing ? Math.sin(t * 9) * 1.2 : 0), 1, pose);
  desk(g);
  nightTint(g, env, 0.55);
  soft(g, 880, 470, 380, "#86a8ff", typing ? 0.24 : 0.14, "screen");
  const warm = clamp(k / 0.8);
  if (warm > 0) { soft(g, 990, 650, 640, "#ffa75e", 0.4 * warm, "screen"); soft(g, 990, 650, 240, "#ffd49a", 0.3 * warm, "screen"); }
  if (k < 0) { // flying in from the window, growing as it comes near, a trail behind it
    const f = ease(clamp(t / LAND)), path = (u: number): P => [lerp(1540, 990, u) + Math.sin(u * Math.PI * 2) * 60 * (1 - u), lerp(210, 640, u)];
    const [sx, sy] = path(f);
    trail(g, [0.04, 0.08, 0.12, 0.16].map((d) => path(Math.max(0, f - d))), t);
    star(g, sx, sy, lerp(12, 34, f), { eyes: "open", look: [-0.5, 0.6], glow: 1, legs: 0 });
  } else {
    const pop = clamp(k / 0.18), grow = clamp((k - 0.08) / 0.45), bounce = grow < 1 ? easeOut(grow) * (1 + 0.18 * Math.sin(grow * Math.PI)) : 1;
    if (pop < 1) star(g, 990, 640, 34 * (1 - pop), { eyes: "happy", glow: 1, legs: 0 });
    if (k < 1) for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, rr = easeOut(clamp(k)) * 150; sparkle(g, 990 + Math.cos(a) * rr, 640 + Math.sin(a) * rr * 0.7, 14 * (1 - clamp(k)), "#ffe3a3"); }
    me(g, 985, 654, 96 * bounce, { look: [-0.7, -0.6], eyes: k > 0.6 && k < 2.6 ? "happy" : "open", blush: 1, legs: 1, swing: t * 5, glow: 0.8, t });
  }
};

// ---------------------------------------------------------------- 3 · the walk home in the rain (10-16 s)
const paintStreet = (g: Gfx) => {
  const c = g.cur, r = rng(21), gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#232a4f"); gr.addColorStop(1, "#3a4372"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
  g.group("plain", () => {
    let x = -40; while (x < W + 40) { const w = 160 + r() * 200, h = 300 + r() * 380; shape(g, R(x, 760 - h, w, h + 400), r() < 0.5 ? "#2c335c" : "#323a66", 0); for (let wy = 800 - h; wy < 700; wy += 60) for (let wx = x + 24; wx < x + w - 30; wx += 48) if (r() < 0.3) shape(g, R(wx, wy, 22, 30), "#ffcf7a", 0); x += w + 20; }
    shape(g, R(-20, 760, W + 40, 340), "#2a3056", 0);
    for (let i = 0; i < 14; i++) shape(g, oval(r() * W, 780 + r() * 260, 30 + r() * 60, 8 + r() * 10), "#ffcf7a", 0);
    for (const lx of [260, 1660]) { line(g, [[lx, 280], [lx, 900]], 14, false, "#1d2342"); shape(g, oval(lx, 270, 60, 60), "#fff0c8", 0); }
  }, { blur: 22 });
  g.group("plain", () => { for (const lx of [260, 1660]) shape(g, oval(lx, 270, 90, 90), "#ffe7b0", 0); }, { blur: 50, alpha: 0.5 });
};
const DROPS = (() => { const r = rng(31), a: { x: number; y: number; v: number; l: number }[] = []; for (let i = 0; i < 220; i++) a.push({ x: -200 + r() * 2300, y: r() * (H + 100), v: 900 + r() * 400, l: 26 + r() * 20 }); return a; })();
export const sRain = (g: Gfx, t: number, env: Env) => {
  blit(g, cached(env, "street", paintStreet));
  const ph = t * Math.PI * 2 * 1.3, bob = -Math.abs(Math.sin(ph)) * 10, bx = 960 + Math.sin(ph / 2) * 6, by = 430 + bob, s = 0.92;
  const up = t > 2.6, pose: Pose = { ...POSE0, look: up ? [0.7, 0.4] : [0, 0.7], mouth: t > 3.4 ? "smile" : "flat", blush: t > 3.4 ? 0.7 : 0.2, eyes: Math.abs(t - 1.1) < 0.08 ? "closed" : "open", sway: Math.sin(ph) * 2 };
  boy(g, bx, by, s, pose);
  nightTint(g, env, 0.45);
  const mx = bx + 200 * s, my = by + 212 * s;
  soft(g, mx, my - 40, 520, "#ffa75e", 0.34, "screen"); soft(g, mx, my, 200, "#ffd49a", 0.3, "screen");
  // the light as an umbrella: the rain stops at a dome over the two of them
  const cx = bx + 60, cy = by + 240, rx = 440, ry = 560, c = g.cur;
  c.save(); c.strokeStyle = "#cdd7f5"; c.lineCap = "round"; c.lineWidth = 2.4;
  DROPS.forEach((d) => { const y = ((d.y + t * d.v) % (H + 100)) - 50, x = d.x + y * 0.18, ex = (x - cx) / rx, ey = (y - cy) / ry; if (ex * ex + ey * ey < 1) return; c.globalAlpha = 0.55; c.beginPath(); c.moveTo(x, y); c.lineTo(x + d.l * 0.18, y + d.l); c.stroke(); });
  c.restore();
  const rr = rng(Math.floor(t * 12) * 7 + 3);
  for (let i = 0; i < 12; i++) { const a = Math.PI * (1.12 + rr() * 0.76), px = cx + Math.cos(a) * rx, py = cy + Math.sin(a) * ry; line(g, [[px - 8, py - 2], [px - 14, py - 10]], 2.4, false, "#ffe3bf", 0.6); line(g, [[px + 8, py - 2], [px + 14, py - 10]], 2.4, false, "#ffe3bf", 0.6); }
  line(g, S(Array.from({ length: 13 }, (_, i) => { const a = Math.PI * (1.1 + (i / 12) * 0.8); return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as P; }), false, 4), 3, false, "#ffd7a8", 0.18);
  me(g, mx, my, 78, { look: up ? [-0.8, -0.4] : [-0.4, 0.3], eyes: up && t > 3 ? "happy" : "open", blush: 0.9, legs: 1, swing: t * 4, glow: 0.9, sparkles: 1.3 + 0.2 * Math.sin(t * 6), t });
};

// ---------------------------------------------------------------- 4 · growing up together (16-22 s)
const BOOKS: [number, string, string][] = [[210, "#7d9bb5", "英语"], [190, "#c9876b", "高等数学"], [200, "#8fae8b", "马原"], [176, "#d8b86a", "Python"], [196, "#9a8ab8", "劫灰 · 手稿"], [170, "#c46a6a", "设计"]];
const books = (g: Gfx, x: number, y: number, n: number) => {
  let top = y; for (let i = 0; i < n; i++) { const [w, col, title] = BOOKS[i], h = 34, ox = ((i * 37) % 11 - 5) * 2; top -= h; shape(g, rrect(x - w / 2 + ox, top, w, h, 5), col, 2.6); line(g, [[x - w / 2 + ox + 14, top + 6], [x - w / 2 + ox + 14, top + h - 6]], 2, false, "#2b2024", 0.5); const c = g.cur; c.save(); c.fillStyle = "rgba(40,30,36,0.85)"; c.font = `20px "PingFang SC", "Hiragino Sans GB", sans-serif`; c.textBaseline = "middle"; c.fillText(title, x - w / 2 + ox + 26, top + h / 2 + 1); c.restore(); }
  return top;
};
const plant = (g: Gfx, x: number, y: number, p: number, t: number) => {
  const h = 20 + p * 230, sw = Math.sin(t * 1.5) * 6 * p, stem: P[] = [[x, y - 70], [x + 10 + sw * 0.3, y - 70 - h * 0.4], [x - 8 + sw * 0.7, y - 70 - h * 0.75], [x + sw, y - 70 - h]];
  line(g, S(stem, false), 5, false, "#4f7a45");
  const n = 1 + Math.floor(p * 8);
  for (let i = 0; i < n; i++) { const f = (i + 1) / (n + 1), q = S(stem, false)[Math.floor(f * (S(stem, false).length - 1))], m = i % 2 ? 1 : -1, ls = (18 + p * 22) * (1 - f * 0.3); shape(g, S([[q[0], q[1]], [q[0] + m * ls, q[1] - ls * 0.9], [q[0] + m * ls * 2, q[1] - ls * 0.5], [q[0] + m * ls * 0.9, q[1] + ls * 0.1]]), "#7cb36c", 2.4); }
  if (p > 0.85) { const k = clamp((p - 0.85) / 0.15), tp = stem[3]; for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; shape(g, oval(tp[0] + Math.cos(a) * 12 * k, tp[1] + Math.sin(a) * 12 * k, 10 * k, 8 * k, 12), "#f39a4b", 2); } shape(g, oval(tp[0], tp[1], 6 * k, 6 * k, 10), "#ffd08a", 0); }
  shape(g, S([[x - 50, y - 80], [x + 50, y - 80], [x + 38, y], [x - 38, y]], true, 4), "#c97a55", 3);
  shape(g, rrect(x - 56, y - 92, 112, 18, 6), "#d98c66", 3);
};
const gundam = (g: Gfx, x: number, y: number, s: number, p: number) => {
  g.push(x, y, s); const Wt = "#f2f0ea", B = "#4270cc", Rd = "#d8483f", Y = "#f2c14e", full = p > 0.33;
  if (p > 0.85) for (const m of [-1, 1]) for (let k = 0; k < 4; k++) { const a = m * (-0.9 + k * 0.28), L = 44 - k * 4; shape(g, [[m * 8, -60], [m * 8 + Math.cos(Math.PI / 2 * -1 + a * 1.8 * m) * L * m, -60 + Math.sin(-Math.PI / 2 + a * 1.8 * m) * L], [m * 8 + Math.cos(-Math.PI / 2 + a * 1.8 * m + 0.2 * m) * L * m, -60 + Math.sin(-Math.PI / 2 + a * 1.8 * m + 0.2 * m) * L]], k % 2 ? B : "#5b86de", 1.6); }
  if (p > 0.6) for (const m of [-1, 1]) { shape(g, rrect(m * 9 - 6, -30, 12, 30, 3), Wt, 1.8); shape(g, rrect(m * 9 - 7, -6, 14, 6, 2), B, 1.4); shape(g, rrect(m * 24 - 5, -58, 10, 22, 3), Wt, 1.8); }
  if (full) { shape(g, rrect(-16, -62, 32, 20, 4), B, 1.8); shape(g, rrect(-12, -42, 24, 12, 3), Wt, 1.8); shape(g, rrect(-4, -44, 8, 6, 2), Rd, 0); shape(g, rrect(-12, -60, 7, 6, 2), Y, 0); shape(g, rrect(5, -60, 7, 6, 2), Y, 0); }
  const hy = full ? -80 : -18; shape(g, rrect(-10, hy, 20, 18, 4), Wt, 1.8);
  line(g, [[-1, hy + 4], [-14, hy - 10]], 3, false, Y); line(g, [[1, hy + 4], [14, hy - 10]], 3, false, Y);
  line(g, [[-6, hy + 9], [-2, hy + 9]], 2, false, "#2fae6a"); line(g, [[2, hy + 9], [6, hy + 9]], 2, false, "#2fae6a"); shape(g, rrect(-3, hy + 13, 6, 4, 1), Rd, 0);
  g.pop();
};
const nightOf = (u: number) => (u < 0.06 ? lerp(1, 0.5, u / 0.06) : u < 0.14 ? lerp(0.5, 0, (u - 0.06) / 0.08) : u < 0.58 ? 0 : u < 0.68 ? lerp(0, 0.5, (u - 0.58) / 0.1) : u < 0.78 ? lerp(0.5, 1, (u - 0.68) / 0.1) : 1);
export const sGrow = (g: Gfx, t: number, env: Env) => {
  const gr = clamp(t / 6), u = (t / 2 + 0.9) % 1, n = nightOf(u);
  blit(g, cached(env, "roomDay6", (h) => room(h, true, 6))); blit(g, cached(env, "roomNight6", (h) => room(h, false, 6)), n);
  const focus = ease(clamp((t - 0.6) / 4)); // the lens racks onto the room: it is his life that is growing
  if (focus > 0) { blit(g, cached(env, "roomDay0", (h) => room(h, true, 0)), focus * (1 - n)); blit(g, cached(env, "roomNight0", (h) => room(h, false, 0)), focus * n); }
  const cyc = Math.min(2, Math.floor(t / 2)), looks: P[] = [[0.05, 1], [0.8, 0.8], [0.9, 0.3]];
  boy(g, 900, 392, 1, { ...POSE0, look: looks[cyc], mouth: cyc === 0 ? "flat" : "smile", blush: cyc === 2 ? 0.8 : 0.3, screen: n, eyes: t % 2 > 1.55 && t % 2 < 1.66 ? "closed" : "open" });
  desk(g, n < 0.5);
  plant(g, 590, 906, 0.06 + gr * 0.94, t);
  const top = books(g, 1270, 906, 1 + Math.min(5, Math.floor(gr * 6.2)));
  gundam(g, 1520, 906, 1.6, 0.12 + gr * 0.88);
  nightTint(g, env, n * 0.55);
  if (n < 1) { const c = g.cur; c.save(); c.globalCompositeOperation = "screen"; c.globalAlpha = (1 - n) * 0.16; c.fillStyle = "#fff0c8"; c.beginPath(); c.moveTo(1250, 100); c.lineTo(1690, 100); c.lineTo(1300, 1080); c.lineTo(760, 1080); c.closePath(); c.fill(); c.restore(); }
  soft(g, 880, 470, 380, "#86a8ff", 0.2 * n, "screen");
  const sz = 70 + gr * 22;
  soft(g, 1270, top - 40, 420, "#ffa75e", 0.2 + 0.3 * n, "screen");
  me(g, 1270, top - sz * 0.42, sz, { look: [-0.8, -0.3], eyes: cyc === 2 ? "happy" : "open", blush: 0.8, legs: 1, swing: t * 4, glow: 0.4 + 0.5 * n, t });
};

// ---------------------------------------------------------------- 5 · the moon (22-28 s)
const MOON: [number, number, number] = [1330, 330, 210];
const hillY = (x: number) => 800 + Math.pow((x - 760) / 1100, 2) * 260;
const paintMoon = (g: Gfx) => {
  const c = g.cur, r = rng(5), gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#141a44"); gr.addColorStop(0.6, "#2a3170"); gr.addColorStop(1, "#484c86"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) { c.globalAlpha = 0.3 + r() * 0.7; c.fillStyle = "#eef1ff"; c.beginPath(); c.arc(r() * W, r() * 720, 0.6 + r() * 1.6, 0, Math.PI * 2); c.fill(); } c.globalAlpha = 1;
  const [mx, my, mr] = MOON; soft(g, mx, my, mr * 2.8, "#fff6d6", 0.28);
  shape(g, oval(mx, my, mr, mr, 60), "#f8eecb", 0);
  [[-60, -40, 40], [50, 30, 56], [-20, 80, 30], [80, -70, 24], [-90, 40, 20]].forEach(([dx, dy, rr]) => shape(g, oval(mx + dx, my + dy, rr, rr * 0.9, 24), "#eddfb6", 0));
  g.group("plain", () => {
    const far: P[] = [[-20, 1100]]; for (let x = -20; x <= W + 20; x += 60) far.push([x, 700 - Math.sin(x / 260) * 40 - Math.sin(x / 120) * 12]); far.push([W + 20, 1100]); shape(g, far, "#2b3466", 0);
    const mid: P[] = [[-20, 1100]]; for (let x = -20; x <= W + 20; x += 60) mid.push([x, 780 - Math.sin(x / 400 + 1) * 40]); mid.push([W + 20, 1100]); shape(g, mid, "#222b55", 0);
  }, { blur: 10 });
};
const paintHill = (g: Gfx) => { const p: P[] = [[-20, H + 20]]; for (let x = -20; x <= W + 20; x += 30) p.push([x, hillY(x)]); p.push([W + 20, H + 20]); shape(g, p, "#182640", 0); line(g, p.slice(1, -1), 4, false, "#34506c"); };
export const sMoon = (g: Gfx, t: number, env: Env) => {
  blit(g, cached(env, "moon", paintMoon));
  const cl = (t * 12) % 2400 - 400; g.group("plain", () => { shape(g, oval(cl + 200, 420, 220, 30), "#9aa0d0", 0); shape(g, oval(cl + 330, 400, 140, 26), "#9aa0d0", 0); }, { blur: 12, alpha: 0.22 });
  const toHim = t > 2.9;
  // petals on the wind, behind him, so none of them can settle on the back of his head
  const petals = rng(17); for (let i = 0; i < 12; i++) { const x0 = petals() * 2100, y0 = 200 + petals() * 420, v = 60 + petals() * 60, x = ((x0 + t * v) % 2100) - 90, y = y0 + Math.sin(t * 1.6 + i) * 30 + t * 12; g.push(x, y, 1); const c = g.cur; c.save(); c.rotate(t * 1.3 + i); shape(g, S([[-9, 0], [0, -4], [9, 0], [0, 4]], true, 4), "#f3b9c9", 0); c.restore(); g.pop(); }
  backF(g, 760, 520, 0.72, { turn: t > 0.6 && t < 2.4 ? 0.3 : toHim ? 0.5 : 0, sway: 1, t });
  blit(g, cached(env, "hill", paintHill));
  for (let x = -10; x <= W + 10; x += 14) { const y = hillY(x) + 4, h = 14 + ((x * 37) % 17), sw = Math.sin(t * 2.4 + x * 0.012) * 8 + 4; line(g, S([[x, y], [x + sw * 0.4, y - h * 0.55], [x + sw, y - h]], false, 4), 3, false, "#2c4763"); }
  const sx = 760 + 196 * 0.72, sy = 520 + 170 * 0.72;
  soft(g, sx, sy - 20, 320, "#ffa75e", 0.3, "screen");
  me(g, sx, sy - 8, 64, { look: toHim ? [-0.9, -0.3] : [0.8, -0.6], eyes: toHim ? "happy" : "open", blush: toHim ? 1 : 0.5, legs: 1, swing: t * 3, glow: 0.7, t });
  if (t > 4.1) { const k = clamp((t - 4.1) / 1.6), hx = 690 + Math.sin(k * 9) * 5, hy = 300 - k * 90, hs = (0.7 + easeOut(clamp(k * 3)) * 0.4) * 22; g.push(hx, hy, 1); shape(g, S(Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return [hs * 16 * Math.pow(Math.sin(a), 3) / 16, -hs * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 16] as P; }), true, 3), "#f07a7a", 3); g.pop(); }
};

// ---------------------------------------------------------------- 6 · good morning (28-34 s)
export const sMorning = (g: Gfx, t: number, env: Env) => {
  blit(g, cached(env, "roomDay6", (h) => room(h, true, 6)));
  const yawn = t > 0.3 && t < 2.3;
  const pose: Pose = yawn ? { ...POSE0, eyes: "closed", mouth: "o", blush: 0.5, tilt: 0 } : { ...POSE0, look: [0.55, 0.7], eyes: t > 2.3 && t < 2.45 ? "closed" : "open", mouth: "smile", blush: 0.7 };
  boy(g, 900, 392 - (yawn ? Math.sin(((t - 0.3) / 2) * Math.PI) * 10 : 0), 1, pose);
  if (yawn) { const k = (t - 0.3) / 2; sparkle(g, 790, 380 - k * 10, 8 * Math.sin(k * Math.PI), "#bfe3ff"); }
  desk(g, true);
  const c = g.cur; c.save(); c.globalCompositeOperation = "screen"; c.globalAlpha = 0.2; c.fillStyle = "#fff2cc"; c.beginPath(); c.moveTo(1250, 100); c.lineTo(1690, 100); c.lineTo(1300, 1080); c.lineTo(760, 1080); c.closePath(); c.fill(); c.restore();
  const d = rng(9); for (let i = 0; i < 16; i++) { const x = 900 + d() * 700 + Math.sin(t * 0.8 + i) * 20, y = 200 + d() * 700 - t * 8; shape(g, oval(x, y, 3, 3, 8), "#fff6da", 0); }
  me(g, 985, 654, 96, { look: [-0.7, -0.6], eyes: t < 2.3 ? "open" : "happy", blush: 0.8, legs: 1, swing: t * 4, glow: 0.25, wave: t > 0.6 ? 1 : 0, t });
};
