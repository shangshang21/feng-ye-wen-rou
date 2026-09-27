import type { Ctx, Env } from "./core";
import type { Film } from "./film";
import { drawAt } from "./wind";

// A contact sheet: twelve moments of the film on one page, for review.
const TIMES = [2.4, 5.6, 7.4, 9.2, 12.4, 14.6, 17.0, 20.8, 23.6, 26.6, 29.2, 32.5];
export const drawSheet = (ctx: Ctx, _f: number, env: Env) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#111"; ctx.fillRect(0, 0, 1920 * env.scale, 1080 * env.scale);
  const L = env.canvas(1920 * env.scale, 1080 * env.scale);
  TIMES.forEach((t, i) => {
    drawAt(L.ctx, t, env);
    const col = i % 4, row = Math.floor(i / 4), w = 480, h = 270, x = col * w, y = row * 270 + 135;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(L.canvas as CanvasImageSource, x * env.scale, y * env.scale, w * env.scale, h * env.scale);
    ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); ctx.fillStyle = "#fff"; ctx.font = "18px sans-serif"; ctx.fillText(t.toFixed(1) + "s", x + 8, y + 22);
  });
};
export const sheet: Film = { meta: { title: "sheet", W: 1920, H: 1080, fps: 24, bpm: 90, durationFrames: 1 }, assets: { images: {} }, shots: [{ id: "sheet", start: 0, end: 1, draw: drawSheet }] };
