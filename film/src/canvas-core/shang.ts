import { Gfx, rng, type Medium, type P } from "./core";
import { blob, bounds, clamp, clipped, fillShape, lerpP, mix, smooth } from "./gallery";

// SHANG · the one character module. Every shot poses this; nothing redraws him.
//
// Hand: ink & line-wash (the wren plate's recipe). Washes go down first and flood a little past
// the line, pigment settling along each shape's lower edge; then a flexible nib, pressed thick in
// the shadow and lifted hair-thin where light eats the edge.
//
// IDENTITY (from his photo, 2026-09-27), the features a friend would draw from memory:
//  1. 微分碎盖: a textured crop, full on top, the fringe broken into pointed clumps that fall to the
//     top of the glasses, with a small off-centre part where a sliver of forehead shows. No flyaways.
//  2. Big black square frames, a chamfer at both lower corners, a silver rivet at the outer top.
//  3. Calm almond eyes under a slightly heavy lid; a straight nose; a V-line jaw; soft lips.
//  4. Fair skin.
//  5. Black ribbed track jacket, white stand collar zipped to the top, three white stripes over the
//     shoulder.
// VIEW: three-quarter, facing picture-right (yaw ~32 deg). Head = 210 units, crown -105 to chin
// +105; eye line 0; nose base +48; mouth +66. Face midline x = +30 at the eyes.

export const INK = "#17141f", PAPER = "#fbf8f0";
export const INK_M: Medium = { nib: 1.6, taper: 1, pressure: 1.6, retrace: false, wobble: 1.1, rough: 0.5 };
const SKIN = "#f0d2bf", SKIN_SH = "#9e8fb0", LIP = "#d4827f", HAIR = "#1c1a26", HAIR_HI = "#50557a", JACKET = "#211f2a", RIB = "#3a3847", COLLAR_SH = "#b9c1d8";

// ---------------------------------------------------------------- the hand (wren's recipe)
export const wet = (g: Gfx, pts: P[], color: string, o: { alpha: number; seed: number; pool?: number; dx?: number; dy?: number; shrink?: number }) => {
  const { alpha, seed, pool = 0.55, dx = 5, dy = 5, shrink = 1.04 } = o, b = bounds(pts);
  g.group("paint", () => {
    g.wash(pts, color, { alpha, seed, dx, dy, shrink, rim: true });
    if (pool > 0) clipped(g, pts, () => {
      const c = g.cur, gr = c.createLinearGradient(0, b.y0 + (b.y1 - b.y0) * 0.45, 0, b.y1 + 2);
      gr.addColorStop(0, color + "00"); gr.addColorStop(0.75, color + Math.round(255 * clamp(alpha * pool * 0.6)).toString(16).padStart(2, "0")); gr.addColorStop(1, color + Math.round(255 * clamp(alpha * pool * 1.3)).toString(16).padStart(2, "0"));
      c.fillStyle = gr; c.fillRect(b.x0 - 20, b.y0, b.x1 - b.x0 + 40, b.y1 - b.y0 + 20);
    });
  });
};
// a flat, opaque-ish body of colour with no wet drift (for things that must sit exactly: hair mass, lenses)
export const flat = (g: Gfx, pts: P[], color: string, alpha = 1) => g.group("paint", () => g.wash(pts, color, { alpha, seed: 3, dx: 0, dy: 0, shrink: 1, rim: false }));
export const pen = (g: Gfx, pts: P[], w: number, seed: number, op = 0.95, wob = 0.6, color = INK) => g.pen(pts, { w, color, seed, wobble: wob, boil: 0, taper: 1, opacity: op, retrace: false });
const S = (pts: P[], closed = true, per = 8) => smooth(pts, closed, per);

// ---------------------------------------------------------------- geometry (hand-placed, local units)
const FACE: P[] = [[-50, -46], [-12, -66], [38, -60], [56, -34], [61, -10], [58, 4], [63, 18], [60, 40], [54, 60], [45, 80], [36, 93], [25, 99], [13, 97], [-2, 89], [-17, 76], [-29, 58], [-38, 40], [-46, 8]];
const NECK: P[] = [[-40, 30], [-24, 72], [4, 92], [20, 98], [22, 150], [-42, 150]];
const EAR: P[] = [[-40, -2], [-50, -8], [-58, 2], [-58, 20], [-52, 36], [-44, 46], [-37, 42]];
// the back and crown as one mass; the fringe is laid over it clump by clump
const hairBack = (sw: number): P[] => [[-62, 44], [-78, 24], [-90, -12], [-92, -54], [-80, -98], [-50, -126], [-6, -138], [34, -132], [62 + sw * 0.2, -110], [76 + sw * 0.3, -82], [78 + sw * 0.4, -54], [70 + sw * 0.4, -36], [48, -46], [18, -54], [-12, -52], [-36, -44], [-40, -26], [-41, -4], [-39, 12], [-45, -2], [-52, -12], [-60, -6], [-64, 14], [-64, 32]];
// [rootX, rootY, tipX, tipY, width]: pointed clumps, near temple to far temple; the part is the gap at x 14-26
const CLUMPS: [number, number, number, number, number][] = [[-40, -58, -37, -14, 15], [-27, -70, -24, -7, 18], [-12, -74, -9, -3, 18], [2, -76, 5, -8, 17], [12, -74, 14, -19, 11], [30, -74, 27, -17, 12], [41, -72, 42, -8, 16], [53, -66, 55, -13, 15], [64, -56, 67, -21, 13]];
const clump = (c: [number, number, number, number, number], sw: number): P[] => {
  const [rx, ry, tx0, ty, w] = c, tx = tx0 + sw, mx = (rx + tx) / 2 + 2, my = (ry + ty) / 2;
  return [[rx - w / 2, ry], [mx - w * 0.52, my], [lerpP([mx, my], [tx, ty], 0.6)[0] - w * 0.22, lerpP([mx, my], [tx, ty], 0.6)[1]], [tx, ty], [tx, ty], [lerpP([mx, my], [tx, ty], 0.55)[0] + w * 0.3, lerpP([mx, my], [tx, ty], 0.55)[1]], [mx + w * 0.5, my], [rx + w / 2, ry]];
};
const lensNear: P[] = [[-31, -21], [18, -21], [19, -15], [17.5, 12], [12, 23], [-25, 23], [-31, 15], [-31.5, -15]];
const lensFar: P[] = [[27, -19], [55, -19], [55.5, -14], [54, 10], [51, 20], [30, 21], [27, 13], [26.5, -14]];

export type HeadPose = { look: P; blink: number; smile: number; blush: number; warm: number; screen: number; sway: number };
export const HEAD0: HeadPose = { look: [0.6, 0.2], blink: 0, smile: 0, blush: 0, warm: 0, screen: 0, sway: 0 };
const soft = (g: Gfx, pts: P[], color: string, alpha: number, seed: number) => wet(g, pts, color, { alpha, seed, pool: 0, dx: 0, dy: 0, shrink: 1 });

// ---------------------------------------------------------------- the head
export const head = (g: Gfx, x: number, y: number, s: number, p: HeadPose, seed = 1) => {
  g.push(x, y, s);
  const face = S(FACE), neck = S(NECK), ear = S(EAR);
  // washes, big to small: neck, face, a light cool turn on the near side, the warm light, ear, lips
  wet(g, neck, mix(SKIN, SKIN_SH, 0.25), { alpha: 0.5, seed: seed + 1, pool: 0.35 });
  wet(g, face, SKIN, { alpha: 0.5, seed: seed + 2, pool: 0.18, dx: 1, dy: 2, shrink: 1.01 });
  soft(g, S([[-48, -30], [-30, -34], [-26, 10], [-14, 50], [4, 88], [-2, 94], [-18, 80], [-32, 62], [-42, 42], [-48, 8]]), SKIN_SH, 0.18, seed + 3);
  soft(g, S([[-46, -44], [60, -44], [60, -12], [20, -8], [-46, -10]]), SKIN_SH, 0.16, seed + 4);
  soft(g, S([[-36, 84], [0, 92], [20, 100], [22, 120], [-40, 114]]), SKIN_SH, 0.32, seed + 5);
  soft(g, S([[34, 50], [48, 49], [44, 56], [34, 56]]), SKIN_SH, 0.22, seed + 11);
  if (p.warm > 0) soft(g, S([[28, -6], [62, 2], [60, 50], [44, 92], [26, 70]]), "#f6a66e", 0.2 * p.warm, seed + 6);
  if (p.blush > 0) { soft(g, blob(6, 38, 13, 6, seed + 7, 0.2, 12), "#ee8f8a", 0.14 * p.blush, seed + 7); soft(g, blob(52, 36, 6, 5, seed + 8, 0.2, 10), "#ee8f8a", 0.12 * p.blush, seed + 8); }
  wet(g, ear, mix(SKIN, "#e8a898", 0.3), { alpha: 0.55, seed: seed + 9, pool: 0.3, dx: 1, dy: 2, shrink: 1 });
  const lipY = 65 - p.smile * 1.2;
  soft(g, S([[18, lipY + 1], [31, lipY - 1], [45, lipY + 1], [34, lipY + 7], [24, lipY + 6]]), LIP, 0.34, seed + 10);

  // eyes: almond, calm; a large iris clipped top and bottom by the lids
  const eye = (cx: number, cy: number, w: number, h: number, k: number) => {
    const lx = p.look[0] * w * 0.2, ly = p.look[1] * h * 0.18;
    if (p.blink > 0.5) { g.group("plain", () => pen(g, S([[cx - w / 2, cy], [cx, cy + h * 0.4], [cx + w / 2, cy - 1]], false), 2.6 * k, seed + 20 + k * 3)); return; }
    const up: P[] = [[cx - w / 2, cy + 1], [cx - w * 0.22, cy - h * 0.5], [cx + w * 0.22, cy - h * 0.56], [cx + w / 2, cy - h * 0.24]];
    const low: P[] = [[cx + w / 2, cy - h * 0.24], [cx + w * 0.2, cy + h * 0.42], [cx - w * 0.22, cy + h * 0.46], [cx - w / 2, cy + 1]];
    const shape = S([...up, ...low], true, 6);
    g.group("plain", () => {
      fillShape(g, shape, "#f8f3ec", 0.95);
      clipped(g, shape, () => {
        fillShape(g, blob(cx + lx, cy + ly - h * 0.02, h * 0.66, h * 0.7, seed + 30 + k, 0.02, 16), "#3d2b2b", 1);
        fillShape(g, blob(cx + lx, cy + ly, h * 0.34, h * 0.38, seed + 31 + k, 0.02, 12), "#0d0a0e", 1);
        fillShape(g, blob(cx + lx + h * 0.28, cy + ly - h * 0.22, h * 0.14, h * 0.12, seed + 32 + k, 0.04, 8), "#ffffff", 0.95);
        fillShape(g, S([[cx - w / 2, cy - h], [cx + w / 2, cy - h], [cx + w / 2, cy - h * 0.1], [cx - w / 2, cy - h * 0.2]]), "#2a1e2a", 0.18);
      });
      pen(g, S(up, false, 6), 3.6 * k, seed + 40 + k, 0.97, 0.25);
      pen(g, [[cx + w / 2 - 3, cy - h * 0.26], [cx + w / 2 + 3 * k, cy - h * 0.34]], 2.4 * k, seed + 41 + k, 0.9, 0.15);
      pen(g, S([[cx - w * 0.25, cy + h * 0.5], [cx + w * 0.15, cy + h * 0.46], [cx + w * 0.42, cy + h * 0.1]], false), 1 * k, seed + 42 + k, 0.35, 0.2);
      pen(g, S([[cx - w * 0.32, cy - h * 0.8], [cx + w * 0.1, cy - h * 0.98], [cx + w * 0.45, cy - h * 0.62]], false), 1 * k, seed + 43 + k, 0.35, 0.2);
    });
  };
  eye(-5, 4, 30, 10, 1);
  eye(42, 4, 19, 8.5, 0.8);

  // hair: a small dark core, then tapered brush strokes from the crown whorl outwards, so the
  // silhouette is made of clump tips (碎) rather than a smooth dome; the fringe falls clump by clump
  const hb = S(hairBack(p.sway), true, 6), cl = CLUMPS.map((c) => S(clump(c, p.sway), true, 5));
  const crown: P = [-34, -112], r = rng(seed + 55);
  const brush = (a: P, b: P, bend: number, w: number, k: number, col = HAIR, op = 0.97) => { const m = lerpP(a, b, 0.5), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; pen(g, S([a, [m[0] - (dy / l) * bend, m[1] + (dx / l) * bend], b], false, 8), w, seed + 300 + k, op, 0.25, col); };
  g.group("plain", () => {
    fillShape(g, S(hairBack(p.sway).map(([x, y]) => [x * 0.92 - 4, y * 0.93 - 4] as P), true, 6), HAIR, 0.97);
    // the outline: clumps swept from the crown to just past the edge, tips pointing with the growth
    const rim: [number, number, number][] = [ // end x, end y, width
      [-66, 40, 16], [-80, 22, 18], [-90, -6, 20], [-96, -38, 20], [-94, -70, 22], [-82, -100, 22], [-60, -126, 22], [-30, -142, 22], [4, -146, 22], [34, -138, 22], [58, -120, 20], [74, -96, 18], [82, -70, 16], [80, -46, 14],
    ];
    rim.forEach(([ex, ey, w], i) => { const st = lerpP(crown, [ex, ey], 0.25), wob = (r() - 0.5) * 6; brush(st, [ex + p.sway * clamp((ey + 140) / 140) * 0.4 + wob * 0.3, ey + wob * 0.3], (i < 7 ? -1 : 1) * (6 + r() * 6), w, i); });
    // the top layer, lying forward over the skull
    for (let i = 0; i < 8; i++) { const ex = -44 + i * 14 + r() * 4, ey = -70 + Math.abs(i - 4) * 2; brush([crown[0] + i * 4, crown[1] + 6], [ex + p.sway * 0.5, ey], 8 + r() * 6, 18, 20 + i); }
    // the fringe: clumps from the hairline down to the frame, a gap at the part
    cl.forEach((c) => fillShape(g, c, HAIR, 0.97));
    CLUMPS.forEach(([rx, ry, tx, ty, w], i) => brush([rx, ry - 14], [tx + p.sway, ty], i < 5 ? -4 : 4, w * 0.95, 40 + i));
    // the near side falls over the temple and the top of the ear, ending in a short sideburn
    brush([-30, -96], [-42, -8], -6, 16, 60); brush([-44, -92], [-50, -10], -4, 14, 61); brush([-56, -84], [-60, 8], -3, 14, 62); brush([-66, -76], [-66, 26], -2, 14, 63);
    // sheen: thin lighter strokes riding the clumps where the monitor catches the crown
    for (let i = 0; i < 10; i++) { const ex = -60 + i * 13, ey = -96 - Math.sin((i / 9) * Math.PI) * 30; brush(lerpP(crown, [ex, ey], 0.35), [ex + 6, ey + 8], 5, 3.2, 80 + i, HAIR_HI, 0.55); }
    CLUMPS.forEach(([rx, ry, tx, ty], i) => { if (i % 2) brush([rx + 2, ry - 4], lerpP([rx, ry], [tx + p.sway, ty], 0.7), 2, 2.4, 100 + i, HAIR_HI, 0.45); });
  });

  g.group("plain", () => {
    // the face, open on the lit side, pressed along the shadowed jaw
    pen(g, S([[61, -10], [58, 4], [63, 18], [60, 40], [54, 62]], false), 1.3, seed + 61, 0.5);
    pen(g, S([[54, 60], [45, 80], [36, 93], [25, 99], [13, 97]], false), 2.2, seed + 62, 0.9);
    pen(g, S([[13, 97], [-2, 89], [-17, 76], [-29, 58], [-37, 44]], false), 2.8, seed + 63, 0.92);
    pen(g, S([[-38, 58], [-39, 84], [-41, 104]], false), 1.6, seed + 64, 0.55);
    pen(g, S([[20, 100], [21, 118], [22, 104 + 6]], false), 1.6, seed + 65, 0.5);
    // ear: rim and inner fold
    pen(g, S(EAR, false), 2, seed + 66, 0.85); pen(g, S([[-47, 4], [-53, 12], [-51, 28], [-45, 34]], false), 1.2, seed + 67, 0.55);
    // nose: a light bridge, a firmer tip and nostril
    pen(g, S([[26, 4], [32, 20], [42, 36]], false), 1.3, seed + 68, 0.45, 0.3);
    pen(g, S([[44, 38], [50, 44], [49, 48], [43, 50]], false), 2, seed + 69, 0.85, 0.2);
    pen(g, S([[37, 46], [35, 49], [39, 51]], false), 1.5, seed + 70, 0.75, 0.2);
    // mouth: the parting line with a slight lift at the corners, the philtrum tick, the shadow under the lip
    const sm = p.smile * 3;
    pen(g, S([[18, lipY + 2 - sm], [27, lipY + 2], [34, lipY + 1.5], [45, lipY + 1.5 - sm * 0.6]], false), 1.8, seed + 71, 0.88, 0.2);
    pen(g, [[32, lipY - 8], [33, lipY - 4]], 1, seed + 72, 0.35, 0.2);
    pen(g, S([[25, lipY + 11], [32, lipY + 12], [38, lipY + 10]], false), 1.1, seed + 73, 0.45, 0.2);
    // hair contour: firm at the back, lifted at the crown; each clump's edge
    // a brow glimpsed through the part
    pen(g, S([[14, -17], [21, -20], [28, -19]], false), 2.6, seed + 98, 0.75, 0.2);
  });

  // glasses: tinted lenses, the screen on the far lens, then the frame in solid ink
  const ln = S(lensNear, true, 4), lf = S(lensFar, true, 4);
  g.group("plain", () => {
    fillShape(g, ln, "#dfe9f6", 0.1); fillShape(g, lf, "#dfe9f6", 0.1);
    if (p.screen > 0) clipped(g, lf, () => { fillShape(g, [[30, -15], [51, -17], [51, -3], [30, -1]], "#cfe2ff", 0.36 * p.screen); });
    clipped(g, ln, () => { pen(g, [[-22, 14], [-8, -12]], 3, seed + 100, 0.3, 0.2, "#ffffff"); });
    pen(g, [...ln, ln[0], ln[1]], 5, seed + 101, 0.97, 0.2, "#121016");
    pen(g, [...lf, lf[0], lf[1]], 4, seed + 102, 0.97, 0.2, "#121016");
    pen(g, [[-31, -20], [18, -21]], 7, seed + 103, 0.98, 0.12, "#121016");
    pen(g, [[27, -18], [55, -19]], 5.8, seed + 104, 0.98, 0.12, "#121016");
    pen(g, S([[18, -13], [22, -16], [27, -13]], false), 3.8, seed + 105, 0.97, 0.1, "#121016");
    pen(g, S([[-31, -15], [-38, -11], [-44, -7]], false), 4.2, seed + 106, 0.97, 0.12, "#121016");
    fillShape(g, blob(-27, -18, 2.4, 1.3, seed + 107, 0.05, 8), "#d8dbe4", 0.95);
  });
  g.pop();
};

// ---------------------------------------------------------------- shoulders and jacket (head units, same frame)
export const torso = (g: Gfx, x: number, y: number, s: number, seed = 200) => {
  g.push(x, y, s);
  const body = S([[-54, 128], [-120, 150], [-178, 190], [-206, 260], [-214, 420], [160, 420], [150, 260], [128, 180], [80, 142], [36, 128]]);
  g.group("plain", () => fillShape(g, body, JACKET, 0.96));
  g.group("plain", () => {
    clipped(g, body, () => { for (let i = 0; i < 44; i++) { const xx = -214 + i * 9; pen(g, [[xx, 150], [xx + 2, 300], [xx + 4, 430]], 1.2, seed + 10 + i, 0.3, 0.6, RIB); } });
    // three white stripes over the near shoulder and down the arm: bare paper, a soft grey edge
    for (let k = 0; k < 3; k++) { const o = k * 11; fillShape(g, S([[-62, 124 + o * 0.6], [-120, 146 + o], [-176, 188 + o * 0.7], [-202, 250 + o * 0.2], [-208 + o * 0.9, 330], [-200 + o * 0.9, 330], [-194, 252 + o * 0.2], [-170, 196 + o * 0.7], [-116, 154 + o], [-60, 132 + o * 0.6]]), PAPER, 0.92); }
    for (let k = 0; k < 3; k++) { const o = k * 10; fillShape(g, S([[38, 126 + o * 0.5], [80, 144 + o], [118, 176 + o * 0.6], [124, 182 + o * 0.6], [84, 150 + o], [40, 132 + o * 0.5]]), PAPER, 0.9); }
  });
  // stand collar, zipped to the top: paper white with a cool shadow on the turned side
  const collar = S([[-46, 104], [-16, 112], [18, 112], [34, 104], [38, 138], [14, 150], [-18, 150], [-50, 138]]);
  g.group("plain", () => fillShape(g, collar, PAPER, 1));
  g.group("plain", () => clipped(g, collar, () => fillShape(g, S([[-60, 100], [-18, 110], [-14, 160], [-60, 150]]), COLLAR_SH, 0.45)));
  g.group("plain", () => {
    pen(g, S([[-46, 104], [-16, 112], [18, 112], [34, 104]], false), 1.6, seed + 61, 0.8);
    pen(g, S([[-50, 138], [-18, 150], [14, 150], [38, 138]], false), 2.2, seed + 62, 0.9);
    pen(g, [[-46, 104], [-50, 138]], 1.8, seed + 63, 0.8); pen(g, [[34, 104], [38, 138]], 1.4, seed + 64, 0.6);
    pen(g, S([[4, 113], [6, 150], [10, 260], [12, 420]], false), 2.2, seed + 65, 0.9);
    for (let i = 0; i < 6; i++) pen(g, [[2, 118 + i * 5.5], [8, 118 + i * 5.5]], 1, seed + 70 + i, 0.55, 0.1);
    fillShape(g, S([[1, 114], [8, 114], [9, 128], [2, 128]]), "#3a3944", 1);
    // the jacket's contour: shoulder, sleeve and back
    pen(g, S([[-60, 126], [-120, 150], [-178, 190], [-206, 260], [-214, 420]], false), 3.2, seed + 80, 0.9);
    pen(g, S([[34, 126], [80, 142], [128, 180], [150, 260]], false), 2.4, seed + 81, 0.8);
  });
  g.pop();
};
