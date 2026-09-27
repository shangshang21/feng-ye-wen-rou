import { Gfx, type P } from "./core";
import { blob, clipped, fillShape, mix, smooth } from "./gallery";
import { INK, PAPER, pen, wet } from "./shang";

// SHANG, SIMPLE. The identity carried by shapes, not by rendering: a 碎盖 silhouette with pointed
// fringe clumps and a small part, big black square frames, a calm small face, the white collar and
// three stripes. Three-quarter view facing picture-right. Head 200 units, crown -122 to chin +86.
// Three looks to choose from:
//   "dot"  — Noritake-style minimal: dot eyes, one-line nose and mouth, thin ink contour.
//   "line" — the same face with calm lidded eyes (a short thick upper lid and a small iris).
//   "cut"  — no ink contour at all: flat shapes only, like cut paper, eyes as dots.

const SKIN = "#f1d5c3", HAIR = "#1d1b27", HAIR_HI = "#4d537a", JACKET = "#23212c", SHADE = "#b7aac4";
const S = (pts: P[], closed = true, per = 8) => smooth(pts, closed, per);
const tip = (p: P): P[] => [p, p];

const FACE: P[] = [[-52, -40], [-40, -74], [0, -86], [40, -76], [57, -44], [61, 0], [54, 38], [38, 68], [18, 86], [-4, 84], [-26, 70], [-44, 44], [-54, 10]];
// 微分碎盖: a low textured crown, clumps of different lengths that curve away from a small part at
// x ~ +15, soft points (two close points, never a spike), narrow gaps between clumps
const hair = (sw: number): P[] => [
  [-50, 14], [-53, 12], [-56, -6], [-64, -12], [-72, -40], [-70, -72], [-56, -96], [-34, -108], [-20, -105], [0, -112], [20, -107], [40, -104], [56 + sw * 0.2, -92], [68 + sw * 0.3, -70], [72 + sw * 0.4, -46],
  [68 + sw * 0.5, -30], [62 + sw, -10], [59 + sw, -8], [54, -22], [48 + sw, -2], [45 + sw, 0], [40, -18], [33 + sw, 0], [30 + sw, 1], [24, -14], [20 + sw, -6],
  [15, -36], // the part
  [10 + sw, -4], [8 + sw, -3], [2, -16], [-4 + sw, 4], [-7 + sw, 5], [-13, -14], [-20 + sw, 2], [-23 + sw, 2], [-28, -14], [-35 + sw, -2], [-38 + sw, -3], [-42, -16], [-47 + sw * 0.5, -8], [-50, -22],
];
const ROOTS: P[] = [[54, -22], [40, -18], [24, -14], [2, -16], [-13, -14], [-28, -14], [-42, -16]];
const lens = (cx: number, cy: number, w: number, h: number): P[] => [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2 + 0.5, cy - h / 2 + 5], [cx + w / 2 - 1, cy + h / 2 - 9], [cx + w / 2 - 6, cy + h / 2], [cx - w / 2 + 6, cy + h / 2], [cx - w / 2, cy + h / 2 - 8], [cx - w / 2 - 0.5, cy - h / 2 + 5]];

export type Look = "dot" | "line" | "cut";
const rim = (g: Gfx, pts: P[], w: number, closed = true, color = "#121016") => { const c = g.cur; g.mark(pts, w); c.save(); c.strokeStyle = color; c.lineWidth = w; c.lineJoin = "round"; c.lineCap = "round"; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (closed) c.closePath(); c.stroke(); c.restore(); };
export type SPose = { look: P; blink: number; smile: number; blush: number; sway: number };
export const SP0: SPose = { look: [0.4, 0.1], blink: 0, smile: 0.2, blush: 0, sway: 0 };

export const simpleHead = (g: Gfx, x: number, y: number, s: number, style: Look, p: SPose, seed = 1) => {
  g.push(x, y, s);
  const lined = style !== "cut", face = S(FACE), hs = S(hair(p.sway), true, 5);
  // neck, collar and shoulders first; the head sits on them
  const neck = S([[-30, 50], [22, 60], [24, 120], [-32, 120]]);
  wet(g, neck, mix(SKIN, SHADE, 0.35), { alpha: 0.6, seed: seed + 1, pool: 0.2, dx: 0, dy: 2, shrink: 1 });
  const body = S([[-44, 114], [-110, 132], [-150, 168], [-164, 240], [-166, 300], [150, 300], [140, 220], [114, 158], [70, 124], [30, 112]]);
  g.group("plain", () => {
    fillShape(g, body, JACKET, 0.97);
    for (let k = 0; k < 3; k++) { const o = k * 9; fillShape(g, S([[-46, 114 + o * 0.5], [-106, 132 + o], [-146, 166 + o * 0.6], [-160, 230 + o * 0.1], [-166 + o, 300], [-159 + o, 300], [-153, 232 + o * 0.1], [-139, 172 + o * 0.6], [-102, 139 + o], [-44, 120 + o * 0.5]]), PAPER, 0.93); }
    for (let k = 0; k < 3; k++) { const o = k * 8; fillShape(g, S([[32, 114 + o * 0.4], [70, 128 + o], [104, 152 + o * 0.6], [109, 157 + o * 0.6], [73, 134 + o], [34, 120 + o * 0.4]]), PAPER, 0.9); }
    const collar = S([[-36, 94], [-8, 102], [22, 100], [34, 92], [37, 124], [12, 134], [-14, 134], [-40, 124]]);
    fillShape(g, collar, PAPER, 1);
    clipped(g, collar, () => fillShape(g, S([[-50, 90], [-10, 100], [-8, 140], [-50, 140]]), "#c3c8dc", 0.5));
    if (lined) { pen(g, [...collar, collar[0], collar[1]], 1.8, seed + 2, 0.85, 0.3); pen(g, S([[-44, 114], [-110, 132], [-150, 168], [-164, 240], [-166, 300]], false), 2.6, seed + 3, 0.85); }
    pen(g, S([[2, 102], [3, 134], [5, 300]], false), 1.8, seed + 4, lined ? 0.85 : 0.5, 0.2, lined ? INK : "#55536a");
  });
  // face and ear
  wet(g, face, SKIN, { alpha: 0.62, seed: seed + 5, pool: 0.15, dx: 1, dy: 2, shrink: 1 });
  wet(g, S([[-54, -20], [-40, -24], [-38, 30], [-20, 74], [-26, 70], [-44, 44], [-54, 10]]), SHADE, { alpha: 0.2, seed: seed + 6, pool: 0, dx: 0, dy: 0, shrink: 1 });
  const ear = S([[-50, 2], [-62, -2], [-66, 14], [-60, 30], [-50, 32]]);
  wet(g, ear, mix(SKIN, "#e9a595", 0.3), { alpha: 0.65, seed: seed + 7, pool: 0.2, dx: 0, dy: 1, shrink: 1 });
  if (p.blush > 0) { wet(g, blob(-14, 46, 11, 6, seed + 8, 0.2, 10), "#ef8e8a", { alpha: 0.18 * p.blush, seed: seed + 8, pool: 0, dx: 0, dy: 0, shrink: 1 }); wet(g, blob(44, 44, 8, 5, seed + 9, 0.2, 10), "#ef8e8a", { alpha: 0.15 * p.blush, seed: seed + 9, pool: 0, dx: 0, dy: 0, shrink: 1 }); }

  g.group("plain", () => {
    if (lined) { pen(g, S([[57, -44], [61, 0], [54, 38], [38, 68], [18, 86], [-4, 84], [-26, 70], [-44, 44]], false), 2.2, seed + 10, 0.9); pen(g, S([[-50, 4], [-62, -2], [-66, 14], [-60, 30], [-50, 32]], false), 1.8, seed + 11, 0.8); }
    // eyes
    const eye = (cx: number, cy: number, k: number) => {
      const lx = p.look[0] * 3, ly = p.look[1] * 2;
      if (p.blink > 0.5 || p.smile > 0.85) { pen(g, S([[cx - 6 * k, cy + 1], [cx, cy + (p.smile > 0.85 ? -3 : 3)], [cx + 6 * k, cy + 1]], false), 2.4, seed + 20 + k, 0.95, 0.1); return; }
      if (style === "line") {
        fillShape(g, blob(cx + lx, cy + 3 + ly, 4.2 * k, 4.6, seed + 21, 0.03, 10), "#1a1418", 1);
        fillShape(g, blob(cx + lx + 1.4, cy + 1.6 + ly, 1.2, 1.1, seed + 22, 0.03, 6), "#ffffff", 0.9);
        pen(g, S([[cx - 8 * k, cy + 1], [cx - 2, cy - 2], [cx + 4 * k, cy - 2], [cx + 9 * k, cy]], false), 3.2, seed + 23 + k, 0.97, 0.1);
      } else fillShape(g, blob(cx + lx, cy + ly, 3.6 * k, 4.4, seed + 24 + k, 0.03, 10), "#1a1418", 1);
    };
    eye(-14, 18, 1); eye(36, 18, 0.85);
    // nose and mouth, one mark each
    pen(g, S([[20, 38], [24, 47], [18, 50]], false), lined ? 1.8 : 1.4, seed + 30, lined ? 0.8 : 0.5, 0.1, lined ? INK : "#b88d86");
    const sm = p.smile * 3;
    pen(g, S([[6, 64 - sm * 0.5], [14, 65 + sm * 0.4], [22, 64 - sm * 0.5]], false), 1.9, seed + 31, 0.85, 0.1, lined ? INK : "#b0655f");
  });
  // hair: one confident shape; a few strands of sheen; no flyaways
  g.group("plain", () => {
    fillShape(g, hs, HAIR, 0.97);
    ROOTS.forEach(([rx, ry], i) => pen(g, S([[rx - 4, ry - 30], [rx - 1, ry - 16], [rx, ry - 2]], false), 1.6, seed + 40 + i, 0.55, 0.2, HAIR_HI));
    [[-46, -86, -30, -96], [-18, -96, 2, -100], [20, -96, 38, -92]].forEach(([a, b, c, d], i) => pen(g, S([[a, b], [(a + c) / 2, Math.min(b, d) - 3], [c, d]], false), 3, seed + 48 + i, 0.5, 0.2, HAIR_HI));
    if (lined) pen(g, S(hair(p.sway).slice(3, 15), false, 5), 2.2, seed + 50, 0.8, 0.3);
  });
  // glasses: the one thing drawn heavy
  const ln = S(lens(-14, 18, 44, 36), true, 4), lf = S(lens(36, 18, 32, 34), true, 4);
  g.group("plain", () => {
    fillShape(g, ln, "#e3ecf7", 0.12); fillShape(g, lf, "#e3ecf7", 0.12);
    clipped(g, ln, () => pen(g, [[-28, 28], [-18, 6]], 3, seed + 60, 0.35, 0.1, "#ffffff"));
    rim(g, ln, 4.6); rim(g, lf, 4.2);
    rim(g, [[-36, 1.5], [8, 0.5]], 6.5, false); rim(g, [[20, 1.5], [52, 1]], 5.8, false);
    rim(g, S([[8, 7], [14, 4.5], [20, 7]], false), 3.4, false);
    rim(g, S([[-36, 4], [-46, 6], [-54, 8]], false), 4, false);
    fillShape(g, blob(-32, 3, 2.4, 1.3, seed + 67, 0.05, 8), "#d8dbe4", 0.95);
  });
  g.pop();
};
