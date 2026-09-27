import { Gfx, type Ctx, type Env, type Layer } from "./core";
import type { Film, Shot } from "./film";
import { INK_M } from "./shang";
import { H, W, sDesk, sGalaxy, sGrow, sMoon, sMorning, sRain } from "./scenes";

// 《风也温柔》v2 — the film. Six scenes on a 3/4 waltz grid: 90 bpm at 24 fps is a 16-frame beat,
// a 2-second bar; every cut lands on a bar line. Each scene draws into its own layer; the camera is
// applied when the layer is composited, and each cut is a 0.42 s dissolve from the scene before.

const FPS = 24, BPM = 90, XF = 0.42;
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
type Cam = [number, number, number];
type Scene = { id: string; t0: number; t1: number; draw: (g: Gfx, t: number, env: Env) => void; cam: (t: number) => Cam };

export const SCENES: Scene[] = [
  { id: "galaxy", t0: 0, t1: 4, draw: sGalaxy, cam: (t) => { const p = ease(clamp(t / 3.4)); return [lerp(960, 1150, p), lerp(540, 420, p), 1 + 0.3 * p]; } },
  { id: "desk", t0: 4, t1: 10, draw: sDesk, cam: (t) => [940, 560, 1 + 0.05 * ease(clamp(t / 6))] },
  { id: "rain", t0: 10, t1: 16, draw: sRain, cam: (t) => [960 + t * 4, 540, 1.03] },
  { id: "grow", t0: 16, t1: 22, draw: sGrow, cam: () => [960, 540, 1] },
  { id: "moon", t0: 22, t1: 28, draw: sMoon, cam: (t) => [940, 560, 1.08 - 0.08 * ease(clamp(t / 6))] },
  { id: "morning", t0: 28, t1: 34, draw: sMorning, cam: (t) => [930, 560, 1 + 0.04 * ease(clamp(t / 6))] },
];
export const DUR = 34;

const layer = (env: Env, key: string): Layer => { const k = `wind:layer:${key}:${env.scale}`; let L = env.cache.get(k) as Layer | undefined; if (!L) { L = env.canvas(Math.round(W * env.scale), Math.round(H * env.scale)); env.cache.set(k, L); } return L; };
const paint = (env: Env, sc: Scene, t: number, L: Layer) => {
  const c = L.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; c.clearRect(0, 0, W * env.scale, H * env.scale);
  c.setTransform(env.scale, 0, 0, env.scale, 0, 0); sc.draw(new Gfx(c, env, 0, INK_M), t, env);
};
const put = (ctx: Ctx, env: Env, L: Layer, cam: Cam, alpha: number) => {
  const k = env.scale, z = Math.max(1, cam[2]), cx = clamp(cam[0], W / (2 * z), W - W / (2 * z)), cy = clamp(cam[1], H / (2 * z), H - H / (2 * z));
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = true;
  ctx.translate((W * k) / 2, (H * k) / 2); ctx.scale(z, z); ctx.translate(-cx * k, -cy * k); ctx.drawImage(L.canvas as CanvasImageSource, 0, 0); ctx.restore();
};
const finish = (ctx: Ctx, env: Env) => {
  const g = new Gfx(ctx, env, 0, INK_M); ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0);
  g.paper("coldpress", 0.1); g.paper("paper", 0.06);
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 1.05); v.addColorStop(0, "rgba(20,16,30,0)"); v.addColorStop(1, "rgba(20,16,30,0.35)"); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
};

// draw the whole film at time T (seconds): also what the artifact's player calls directly
export const drawAt = (ctx: Ctx, T: number, env: Env) => {
  let i = SCENES.findIndex((s) => T < s.t1); if (i < 0) i = SCENES.length - 1;
  const sc = SCENES[i], t = T - sc.t0;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#141930"; ctx.fillRect(0, 0, W * env.scale, H * env.scale);
  if (i > 0 && t < XF) { const pv = SCENES[i - 1], B = layer(env, "B"); paint(env, pv, pv.t1 - pv.t0 + t, B); put(ctx, env, B, pv.cam(pv.t1 - pv.t0 + t), 1); }
  const A = layer(env, "A"); paint(env, sc, t, A); put(ctx, env, A, sc.cam(t), i > 0 && t < XF ? ease(t / XF) : 1);
  finish(ctx, env);
};

const shots: Shot[] = SCENES.map((s) => ({ id: s.id, start: s.t0 * FPS, end: s.t1 * FPS, draw: (ctx: Ctx, local: number, env: Env) => drawAt(ctx, s.t0 + local / FPS, env) }));
export const wind: Film = {
  meta: { title: "风也温柔", W, H, fps: FPS, bpm: BPM, durationFrames: DUR * FPS, kind: "story" },
  assets: { images: {} },
  shots,
};
