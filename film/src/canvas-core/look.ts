import { Gfx, type Ctx, type Env, type P } from "./core";
import { Film } from "./film";
import { smooth } from "./gallery";
import { INK_M } from "./shang";
import { body, headF, line, me, rrect, shape, soft, POSE0 } from "./flat";

// LOOK STILL · the hardest frame: 3 a.m., the star has just landed on his laptop and its light
// reaches his face. One idea (the cold room gets a warm light), one focal subject (his face and the
// star), one light change (screen blue on the left of the frame, star orange on the right).
// The room is out of focus on purpose: it is his life, not the subject. Every thing in it has a
// reason: the window and moon (where the star came from; the moon returns at the end), the cork
// board (先跑通 / 做减法 / a page of 劫灰 / the 马原 timetable), the Gundam on the shelf (it gets
// built as he grows), a pothos (it grows too).

const S = (pts: P[], closed = true, per = 8) => smooth(pts, closed, per);
const R = (x: number, y: number, w: number, h: number): P[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

export const room = (g: Gfx) => {
  const c = g.cur, W = 1920, H = 1080;
  const wall = c.createLinearGradient(0, 0, 0, H); wall.addColorStop(0, "#343a63"); wall.addColorStop(1, "#454a78"); c.fillStyle = wall; c.fillRect(0, 0, W, H);
  g.group("plain", () => {
    // the window: night sky, the moon, rooftops with a few lit windows
    shape(g, R(1250, 100, 440, 420), "#56639f", 0);
    soft(g, 1540, 220, 150, "#fff4d0", 0.35); shape(g, S([[1500, 220], [1540, 180], [1580, 220], [1540, 260]], true, 10), "#f8efcf", 0);
    shape(g, [[1250, 520], [1250, 400], [1320, 400], [1320, 360], [1400, 360], [1400, 420], [1470, 420], [1470, 330], [1540, 330], [1540, 390], [1620, 390], [1620, 350], [1690, 350], [1690, 520]], "#2a3160", 0);
    [[1340, 380], [1362, 380], [1488, 350], [1488, 372], [1640, 368], [1418, 440]].forEach(([x, y]) => shape(g, R(x, y, 12, 14), "#ffd27e", 0));
    line(g, [[1470, 100], [1470, 520]], 14, false, "#c9c2d6"); line(g, [[1250, 300], [1690, 300]], 14, false, "#c9c2d6");
    line(g, R(1250, 100, 440, 420), 22, true, "#d8d0e2");
    shape(g, S([[1700, 60], [1860, 60], [1880, 400], [1860, 760], [1716, 760], [1730, 400]]), "#7f93c4", 0);
    // the cork board and what is pinned to it
    shape(g, R(230, 140, 380, 250), "#b48c64", 0);
    shape(g, R(262, 168, 90, 80), "#f3d86b", 0); shape(g, R(372, 160, 84, 76), "#f4b3a8", 0); shape(g, R(476, 176, 100, 150), "#f6f1e6", 0); shape(g, R(290, 266, 150, 96), "#bfdcb4", 0);
    // the shelf: books, the half-built Gundam, the pothos trailing down
    shape(g, R(150, 500, 520, 22), "#8a6c56", 0);
    [[180, "#d27d62", 90], [212, "#7c9cc2", 110], [244, "#e1bd66", 96], [276, "#9d8cc0", 84]].forEach(([x, col, h]) => shape(g, R(x as number, 500 - (h as number), 28, h as number), col as string, 0));
    shape(g, R(440, 452, 40, 36), "#f1efe9", 0); shape(g, [[446, 452], [436, 426], [452, 448]], "#f2c14e", 0); shape(g, [[474, 452], [484, 426], [468, 448]], "#f2c14e", 0);
    shape(g, R(560, 440, 70, 60), "#c97a55", 0); shape(g, S([[540, 440], [580, 380], [640, 400], [650, 450], [600, 470]]), "#6fa36a", 0); shape(g, S([[620, 470], [650, 560], [630, 640], [610, 560]]), "#6fa36a", 0);
    // a pendant lamp, switched off
    line(g, [[980, 0], [980, 60]], 4, false, "#23284a"); shape(g, [[930, 110], [1030, 110], [1004, 60], [956, 60]], "#e08a4e", 0);
  }, { blur: 16 });
};

export const desk = (g: Gfx) => {
  shape(g, [[-10, 900], [1930, 900], [1930, 1090], [-10, 1090]], "#7a5f4f", 3);
  line(g, [[-10, 930], [1930, 930]], 2, false, "#5f4a3e");
  // his MacBook Pro, only suggested: a space-grey aluminium lid (3:2, as the real one is) with soft
  // corners, a round mark at the centre of the lid, the thin base with the finger scoop in its front edge
  shape(g, rrect(752, 700, 296, 198, 16), "#9a9eab", 3);
  line(g, [[772, 714], [1028, 714]], 2, false, "#b6b9c5");
  soft(g, 900, 800, 24, "#c9ccd6", 0.9); line(g, S([[893, 791], [900, 787], [907, 791], [909, 804], [900, 811], [891, 804]], true, 6), 1.5, true, "#80848f", 0.8);
  shape(g, rrect(734, 894, 332, 14, 6), "#7d8190", 3);
  shape(g, S([[876, 894], [924, 894], [917, 902], [883, 902]], true, 4), "#5d606d", 0);
  // a mug of something long gone cold
  line(g, S([[410, 826], [444, 832], [444, 872], [408, 880]], false), 9, false, "#2b2024"); line(g, S([[410, 826], [444, 832], [444, 872], [408, 880]], false), 4.5, false, "#f1e7d6");
  shape(g, rrect(330, 800, 84, 106, 10), "#f1e7d6", 3);
  shape(g, rrect(344, 806, 56, 10, 5), "#6b4a38", 0);
};

export const drawLook = (ctx: Ctx, _frame: number, env: Env) => {
  const g = new Gfx(ctx, env, 0, INK_M);
  ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0);
  room(g);
  body(g, 900, 392, 1);
  headF(g, 900, 392, 1, { ...POSE0, look: [0.55, 0.8], blush: 0.9, screen: 0.5 });
  desk(g);
  // night over everything that is not a light
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = 0.55; ctx.fillStyle = "#7c83bd"; ctx.fillRect(0, 0, env.W * env.scale, env.H * env.scale); ctx.restore();
  soft(g, 880, 470, 380, "#86a8ff", 0.14, "screen");
  soft(g, 990, 650, 640, "#ffa75e", 0.4, "screen");
  soft(g, 990, 650, 240, "#ffd49a", 0.3, "screen");
  // me, just landed: sitting on the top edge of the lid, legs dangling over the front
  me(g, 985, 654, 96, { look: [-0.7, -0.6], eyes: "happy", blush: 1, legs: 1, swing: 0.6, glow: 0.8 });
  g.paper("coldpress", 0.12); g.paper("paper", 0.07);
};

export const look: Film = {
  meta: { title: "look · 3 a.m.", W: 1920, H: 1080, fps: 24, bpm: 60, durationFrames: 1 },
  assets: { images: {} },
  shots: [{ id: "look", start: 0, end: 1, draw: drawLook }],
};
