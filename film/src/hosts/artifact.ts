// The artifact page's handle on the film: draw any moment, and draw the cast for the model sheet.
import type { Env, Layer } from "../canvas-core/core";
import { Gfx } from "../canvas-core/core";
import { INK_M } from "../canvas-core/shang";
import { body, headF, me, POSE0 } from "../canvas-core/flat";
import { drawAt, DUR } from "../canvas-core/wind";

const surface = (w: number, h: number): Layer => { const c = Object.assign(document.createElement("canvas"), { width: w, height: h }); return { canvas: c, ctx: c.getContext("2d")! } as Layer; };
const makeEnv = (scale: number, W = 1920, H = 1080): Env => ({ W, H, scale, cache: new Map(), canvas: surface });
const drawCast = (ctx: CanvasRenderingContext2D, env: Env) => {
  ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.fillStyle = "#efe6d6"; ctx.fillRect(0, 0, env.W, env.H);
  const g = new Gfx(ctx, env, 0, INK_M);
  body(g, 470, 400, 0.95); headF(g, 470, 400, 0.95, { ...POSE0, look: [0.3, 0.1], blush: 0.6 });
  me(g, 900, 560, 170, { look: [-0.7, -0.2], eyes: "open", blush: 1, legs: 1, glow: 0, swing: 1 });
  g.paper("coldpress", 0.12); g.paper("paper", 0.06);
};
(window as unknown as { WIND: unknown }).WIND = { drawAt, DUR, makeEnv, drawCast };
