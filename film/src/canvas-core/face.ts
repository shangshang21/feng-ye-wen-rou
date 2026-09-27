import { Gfx, type Ctx, type Env } from "./core";
import type { Film } from "./film";
import { PAPER, INK_M } from "./shang";
import { simpleHead, SP0 } from "./simple";

// Three simple looks side by side, same pose, for him to pick one.
export const drawFace = (ctx: Ctx, _frame: number, env: Env) => {
  const g = new Gfx(ctx, env, 0, INK_M);
  ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0);
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, env.W, env.H);
  simpleHead(g, 520, 480, 2.1, "dot", SP0, 11);
  simpleHead(g, 1400, 480, 2.1, "line", SP0, 21);
  ctx.fillStyle = "#6a6070"; ctx.font = "44px serif"; ctx.textAlign = "center";
  ["A", "B"].forEach((t, i) => ctx.fillText(t, 520 + i * 880, 100));
  g.paper("coldpress", 0.16); g.paper("paper", 0.08);
};
export const face: Film = { meta: { title: "face study", W: 1920, H: 1080, fps: 24, bpm: 60, durationFrames: 1 }, assets: { images: {} }, shots: [{ id: "face", start: 0, end: 1, draw: drawFace }] };
