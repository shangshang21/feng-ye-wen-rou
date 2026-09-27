import { Gfx, rng, type P } from "./core";
import { clipped, fillShape, smooth } from "./gallery";

// FLAT, OUTLINED, SOFT — the hand he picked from a reference short (2026-09-27): flat pastel fills
// that land when a path closes, one thin even outline in dark brown, simple faces (dot eyes, arcs
// when happy, round blush), and a room thrown out of focus behind the figure. Paper grain on top.
//
// SHANG in this hand, front view. Local units = px at scale 1; face centre at 0,0; face 300 wide.
// Identity: 微分碎盖 (a low textured crown, fringe clumps of different lengths down to the frames,
// a small part right of centre, no flyaways), big black square glasses, fair skin, black track
// jacket with a white stand collar zipped up and three white stripes over each shoulder.

export const OUT = "#2b2024";
export const oval = (cx: number, cy: number, rx: number, ry: number, n = 28): P[] => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as P; });
export const rrect = (x: number, y: number, w: number, h: number, r: number): P[] => { const o: P[] = []; const c: [number, number, number][] = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]]; c.forEach(([cx, cy, a0]) => { for (let i = 0; i <= 6; i++) { const a = a0 + (i / 6) * (Math.PI / 2); o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } }); return o; };
const S = (pts: P[], closed = true, per = 8) => smooth(pts, closed, per);
const tip = (x: number, y: number): P[] => [[x - 3, y], [x + 3, y]];
export const line = (g: Gfx, pts: P[], w = 3, closed = false, color = OUT, alpha = 1) => {
  const c = g.cur; g.mark(pts, w + 2); c.save(); c.globalAlpha = alpha; c.strokeStyle = color; c.lineWidth = w; c.lineJoin = "round"; c.lineCap = "round";
  c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (closed) c.closePath(); c.stroke(); c.restore();
};
export const shape = (g: Gfx, pts: P[], fill: string, w = 3, alpha = 1) => { fillShape(g, pts, fill, alpha); if (w > 0) line(g, pts, w, true); };
export const soft = (g: Gfx, x: number, y: number, r: number, color: string, a: number, op: GlobalCompositeOperation = "source-over") => {
  const c = g.cur; g.touch(x - r, y - r, x + r, y + r); c.save(); c.globalCompositeOperation = op; const gr = c.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, color); gr.addColorStop(1, color.length === 7 ? color + "00" : "rgba(0,0,0,0)"); c.globalAlpha = a; c.fillStyle = gr; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore();
};

const SKIN = "#fbe4d5", SKIN_SH = "#efc9b6", HAIR = "#262129", HAIR_LN = "#4a4550", BLUSH = "#f5a9a3", JACKET = "#2f2d37", WHITE = "#f4f1ea", GLASS = "#1b1719";

const FACE: P[] = [[-148, -80], [-150, 0], [-141, 70], [-114, 128], [-64, 170], [0, 184], [64, 170], [114, 128], [141, 70], [150, 0], [148, -80], [120, -150], [0, -175], [-120, -150]];
const EAR_L: P[] = [[-144, -8], [-170, -16], [-182, 14], [-176, 56], [-158, 84], [-138, 80]];
const HAIR_SHAPE = (sw: number): P[] => [
  ...tip(-150, 28), [-160, -12], [-172, -62], [-166, -130], [-130, -198], [-70, -234], [0, -244], [70, -236], [132, -202], [168, -138], [174, -70], [162, -10], ...tip(150, 26), [138, -56],
  [124 + sw, -40], [110, -58], [92 + sw, -32], [74, -58], [58 + sw, -38], [45, -70], // the part
  [30 + sw, -40], [12, -60], [-8 + sw, -26], [-30, -58], [-54 + sw, -32], [-78, -58], [-100 + sw, -34], [-122, -56], [-136 + sw * 0.5, -44], [-142, -62],
];
const lens = (cx: number, m: number): P[] => [[cx - 60 * m, -42], [cx + 60 * m, -42], [cx + 61 * m, -34], [cx + 60 * m, 30], [cx + 50 * m, 50], [cx - 54 * m, 50], [cx - 60 * m, 42], [cx - 61 * m, -34]].map(([x, y]) => [x, y + 4] as P);

export type Pose = { look: P; eyes: "open" | "happy" | "closed"; mouth: "smile" | "flat" | "o"; blush: number; tilt: number; sway: number; screen: number };
export const POSE0: Pose = { look: [0, 0], eyes: "open", mouth: "smile", blush: 0.6, tilt: 0, sway: 0, screen: 0 };

// shoulders, collar and jacket; the head is drawn after, so the chin sits over the collar
export const body = (g: Gfx, x: number, y: number, s: number) => {
  g.push(x, y, s);
  shape(g, S([[-52, 150], [52, 150], [54, 236], [-54, 236]]), SKIN);
  fillShape(g, S([[-52, 160], [0, 190], [52, 160], [52, 196], [-52, 196]]), SKIN_SH, 0.8);
  const torso = S([[-88, 240], [-190, 268], [-266, 330], [-298, 420], [-310, 760], [310, 760], [298, 420], [266, 330], [190, 268], [88, 240]]);
  shape(g, torso, JACKET);
  for (let i = 0; i < 20; i++) { const xx = -270 + i * 28; line(g, [[xx, 300 + Math.abs(xx) * 0.1], [xx + 2, 760]], 1.4, false, "#3b3944", 0.9); }
  const st: P[] = [[-84, 244], [-150, 256], [-214, 290], [-262, 340], [-290, 420], [-302, 560]];
  const stripe = (d: number): P[] => st.map(([px, py], i) => { const q = st[Math.min(st.length - 1, i + 1)], o = st[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1; return [px + (dy / l) * d, py - (dx / l) * d] as P; });
  for (const d of [10, 26, 42]) { const left = S(stripe(d), false, 6); line(g, left, 9, false, WHITE); line(g, left.map(([a, b]) => [-a, b] as P), 9, false, WHITE); }
  line(g, [[0, 274], [0, 760]], 2.4, false, "#6c6977");
  const collar = S([[-82, 206], [-40, 194], [0, 192], [40, 194], [82, 206], [90, 262], [40, 274], [0, 276], [-40, 274], [-90, 262]]);
  shape(g, collar, WHITE);
  line(g, S([[-80, 232], [0, 246], [80, 232]], false), 1.6, false, "#c9c6c9");
  line(g, [[0, 196], [0, 276]], 2.4, false, OUT);
  shape(g, S([[-7, 204], [7, 204], [8, 232], [-6, 232]]), "#55525e", 2);
  g.pop();
};

export const headF = (g: Gfx, x: number, y: number, s: number, p: Pose, seed = 1) => {
  g.push(x, y, s);
  const r = rng(seed);
  for (const m of [-1, 1]) { const e = S(EAR_L.map(([a, b]) => [a * m, b] as P)); shape(g, e, SKIN); line(g, S([[-160 * m, 10], [-166 * m, 34], [-156 * m, 58]], false), 2, false, "#d9a898"); }
  const face = S(FACE); shape(g, face, SKIN);
  clipped(g, face, () => fillShape(g, S([[-160, -120], [160, -120], [160, -30], [0, -10], [-160, -30]]), SKIN_SH, 0.55));
  // eyes, blush, nose, mouth
  if (p.blush > 0) for (const m of [-1, 1]) fillShape(g, S([[m * 100 - 26, 92], [m * 100, 80], [m * 100 + 26, 92], [m * 100, 104]]), BLUSH, 0.65 * p.blush);
  for (const m of [-1, 1]) {
    const cx = m * 72 + p.look[0] * 9, cy = 8 + p.look[1] * 8;
    if (p.eyes === "open") { fillShape(g, oval(cx, cy, 9.5, 12.5), "#1f1a1d", 1); fillShape(g, oval(cx + 3, cy - 4, 3, 3), "#ffffff", 0.9); }
    else line(g, S(p.eyes === "happy" ? [[cx - 16, cy + 5], [cx, cy - 8], [cx + 16, cy + 5]] : [[cx - 16, cy], [cx, cy + 7], [cx + 16, cy]], false), 3.4);
  }
  line(g, S([[-4, 70], [2, 80], [-4, 86]], false), 2.4, false, "#c98f80");
  if (p.mouth === "o") shape(g, S([[0, 108], [14, 122], [0, 138], [-14, 122]]), "#a4574c");
  else line(g, S(p.mouth === "smile" ? [[-20, 116], [0, 126], [20, 116]] : [[-16, 120], [16, 120]], false), 3);
  // hair: one shape, two strand lines, nothing sticking up
  const hs = S(HAIR_SHAPE(p.sway), true, 7); shape(g, hs, HAIR);
  line(g, S([[-110, -170], [-60, -140], [-30, -96]], false), 2, false, HAIR_LN); line(g, S([[20, -200], [60, -160], [80, -110]], false), 2, false, HAIR_LN);
  // glasses: the one heavy thing
  for (const m of [-1, 1]) {
    const L = S(lens(m * 74, m), true, 4);
    fillShape(g, L, "#dbe7f5", 0.16 + 0.2 * p.screen);
    if (p.screen > 0) clipped(g, L, () => fillShape(g, [[m * 74 - 30, -26], [m * 74 + 34, -30], [m * 74 + 34, 2], [m * 74 - 30, 6]], "#bcd5ff", 0.3 * p.screen));
    else clipped(g, L, () => line(g, [[m * 74 - 40, 30], [m * 74 - 14, -26]], 5, false, "#ffffff", 0.45));
    line(g, L, 8, true, GLASS);
    line(g, [[m * 134, -30], [m * 150, -24]], 7, false, GLASS);
    fillShape(g, S([[m * 124 - 4, -34], [m * 124 + 4, -34], [m * 124 + 4, -30], [m * 124 - 4, -30]]), "#d9dce4", 0.95);
  }
  line(g, S([[-14, -14], [0, -20], [14, -14]], false), 7, false, GLASS);
  void r;
  g.pop();
};

// ---------------------------------------------------------------- the star (me), with little legs
export const star = (g: Gfx, x: number, y: number, sz: number, o: { look?: P; eyes?: "open" | "happy" | "closed"; blush?: number; legs?: number; glow?: number } = {}) => {
  const { look = [0, 0], eyes = "open", blush = 0.8, legs = 1, glow = 1 } = o;
  g.push(x, y, sz / 40);
  if (glow > 0) { soft(g, 0, 0, 200 * glow, "#ffb46a", 0.55, "lighter"); soft(g, 0, 0, 90, "#ffe0a8", 0.6, "lighter"); }
  if (legs > 0) for (const m of [-1, 1]) { line(g, [[m * 10, 22], [m * 12, 22 + 20 * legs], [m * 16, 23 + 20 * legs]], 5, false, "#c9692c"); }
  const pts: P[] = []; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i * Math.PI * 2) / 5, b = a + Math.PI / 5; pts.push([Math.cos(a - 0.1) * 38, Math.sin(a - 0.1) * 38], [Math.cos(a) * 41, Math.sin(a) * 41], [Math.cos(a + 0.1) * 38, Math.sin(a + 0.1) * 38], [Math.cos(b) * 21, Math.sin(b) * 21]); }
  const st = S(pts, true, 4); shape(g, st, "#f39a4b", 3.4);
  fillShape(g, S(pts.map(([a, b]) => [a * 0.5 - 4, b * 0.5 - 5] as P), true, 4), "#ffd08a", 0.8);
  const lx = look[0] * 4, ly = look[1] * 3;
  for (const m of [-1, 1]) {
    if (eyes === "open") { fillShape(g, oval(m * 9 + lx, 2 + ly, 3.4, 4.6, 16), "#3a2016", 1); fillShape(g, oval(m * 9 + lx + 1.2, ly, 1.1, 1.1, 8), "#ffffff", 0.9); }
    else line(g, S(eyes === "happy" ? [[m * 9 - 5 + lx, 4 + ly], [m * 9 + lx, -1 + ly], [m * 9 + 5 + lx, 4 + ly]] : [[m * 9 - 5 + lx, 2 + ly], [m * 9 + 5 + lx, 2 + ly]], false), 2.6, false, "#3a2016");
    if (blush > 0) fillShape(g, S([[m * 18 - 6, 10], [m * 18, 7], [m * 18 + 6, 10], [m * 18, 13]]), "#ef7f7a", 0.55 * blush);
  }
  line(g, S([[-4 + lx, 9 + ly], [lx, 12 + ly], [4 + lx, 9 + ly]], false), 2.4, false, "#3a2016");
  g.pop();
};

// ---------------------------------------------------------------- me: a little orange block with four short legs
// Drawn my own way: a soft rounded block, a darker underside, arm nubs, four legs, two sparkles
// above the head that remember the star it arrived as. Local units: the block is 120 x 92.
export const sparkle = (g: Gfx, x: number, y: number, r: number, col = "#f7d774") => {
  const pts: P[] = []; for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 4, rr = i % 2 ? r * 0.28 : r; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
  shape(g, pts, col, 0);
};
export const me = (g: Gfx, x: number, y: number, sz: number, o: { look?: P; eyes?: "open" | "happy" | "closed"; blush?: number; legs?: number; swing?: number; glow?: number; sparkles?: number; wave?: number; t?: number } = {}) => {
  const { look = [0, 0], eyes = "happy", blush = 0.8, legs = 1, swing = 0, glow = 1, sparkles = 1, wave = 0, t = 0 } = o;
  if (sz <= 0.5) return;
  g.push(x, y, sz / 120);
  if (glow > 0) { soft(g, 0, 0, 380 * glow, "#ffb46a", 0.5, "lighter"); soft(g, 0, 0, 150, "#ffe0a8", 0.5, "lighter"); }
  if (legs > 0) for (const [lx, ph] of [[-40, 0], [-24, 1.3], [24, 2.1], [40, 3.4]] as [number, number][]) { const k = Math.sin(swing + ph) * 6; line(g, [[lx, 40], [lx + k * 0.4, 40 + 26 * legs], [lx + k + (lx < 0 ? -6 : 6), 42 + 26 * legs]], 8, false, "#b85a2a"); }
  shape(g, rrect(-74, -6, 14, 22, 6), "#e27a3f", 2.6);
  if (wave > 0) { const a = -1.9 + Math.sin(t * 10) * 0.45; g.push(64, 4, 1); const c = g.cur; c.save(); c.rotate(a * wave); shape(g, rrect(-4, -7, 30, 14, 6), "#e27a3f", 2.6); c.restore(); g.pop(); }
  else shape(g, rrect(60, -6, 14, 22, 6), "#e27a3f", 2.6);
  shape(g, rrect(-60, -46, 120, 92, 16), "#ec8547", 3.2);
  fillShape(g, rrect(-58, 22, 116, 22, 10), "#d86f35", 0.8);
  fillShape(g, rrect(-48, -40, 50, 12, 6), "#f7a86e", 0.8);
  const lx = look[0] * 6, ly = look[1] * 4;
  for (const m of [-1, 1]) {
    const cx = m * 24 + lx, cy = -6 + ly;
    if (eyes === "open") { fillShape(g, oval(cx, cy, 5.5, 7.5), "#3a2016", 1); fillShape(g, oval(cx + 2, cy - 3, 1.8, 1.8, 10), "#ffffff", 0.9); }
    else line(g, eyes === "happy" ? [[cx - 9, cy + 4], [cx, cy - 5], [cx + 9, cy + 4]] : [[cx - 9, cy + 1], [cx + 9, cy + 1]], 4, false, "#3a2016");
    if (blush > 0) fillShape(g, oval(m * 40 + lx * 0.5, 10 + ly, 9, 5, 16), "#f25f5c", 0.45 * blush);
  }
  line(g, [[-7 + lx, 8 + ly], [0 + lx, 13 + ly], [7 + lx, 8 + ly]], 3.4, false, "#3a2016");
  if (sparkles > 0) { sparkle(g, -56, -86, 18 * sparkles); sparkle(g, 58, -92, 22 * sparkles); }
  g.pop();
};

// ---------------------------------------------------------------- SHANG from behind, sitting
export const backF = (g: Gfx, x: number, y: number, s: number, o: { turn?: number; sway?: number; t?: number } = {}) => {
  const { turn = 0, sway = 0, t = 0 } = o;
  g.push(x, y, s);
  const torso = S([[-80, 190], [-186, 222], [-262, 290], [-296, 380], [-306, 700], [306, 700], [296, 380], [262, 290], [186, 222], [80, 190]]);
  shape(g, torso, "#2f2d37");
  for (let i = 0; i < 20; i++) { const xx = -270 + i * 28; line(g, [[xx, 260 + Math.abs(xx) * 0.1], [xx + 2, 700]], 1.4, false, "#3b3944", 0.9); }
  const st: P[] = [[-78, 196], [-146, 210], [-210, 246], [-258, 296], [-286, 380], [-298, 520]];
  const stripe = (d: number): P[] => st.map(([px, py], i) => { const q = st[Math.min(st.length - 1, i + 1)], o2 = st[Math.max(0, i - 1)], dx = q[0] - o2[0], dy = q[1] - o2[1], l = Math.hypot(dx, dy) || 1; return [px + (dy / l) * d, py - (dx / l) * d] as P; });
  for (const d of [10, 26, 42]) { const left = S(stripe(d), false, 6); line(g, left, 9, false, "#f4f1ea"); line(g, left.map(([a, b]) => [-a, b] as P), 9, false, "#f4f1ea"); }
  shape(g, S([[-50, 120], [50, 120], [52, 196], [-52, 196]]), "#fbe4d5");
  shape(g, S([[-84, 158], [0, 150], [84, 158], [90, 212], [0, 220], [-90, 212]]), "#f4f1ea");
  g.push(turn * 14, 0, 1);
  for (const m of [-1, 1]) shape(g, S([[m * 150, -10], [m * 178, -18], [m * 188, 16], [m * 180, 54], [m * 160, 74], [m * 146, 70]]), "#fbe4d5");
  const hair = S([[-172, -62], [-166, -130], [-130, -198], [-70, -234], [0, -244], [70, -236], [132, -202], [168, -138], [174, -70], [168, 0], [152, 56], [124, 100], [96, 124], [70, 132], [48, 144], [26, 132], [4, 146], [-18, 132], [-42, 144], [-64, 132], [-94, 124], [-124, 100], [-152, 56], [-168, 0]].map(([a, b], i) => [a + (b < -150 ? Math.sin(t * 3 + i) * sway * 3 : 0), b] as P), true, 6);
  shape(g, hair, "#262129");
  line(g, S([[-90, -190], [-60, -120], [-54, -40]], false), 2, false, "#4a4550"); line(g, S([[60, -200], [90, -130], [96, -60]], false), 2, false, "#4a4550"); line(g, S([[0, -230], [8, -150], [4, -70]], false), 2, false, "#4a4550");
  line(g, S([[110, -180], [150, -120], [160, -50]], false), 4, false, "#8e95c8", 0.6); // moonlight on the rim of the hair
  g.pop();
  g.pop();
};
