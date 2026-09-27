import type { Ctx, Env } from "./core";
import type { Film } from "./film";
import { drawAt } from "./wind";
// one moment at full size, for a close look: PROBE_T is edited per look
export const PROBE_T = 8.6;
export const probe: Film = { meta: { title: "probe", W: 1920, H: 1080, fps: 24, bpm: 90, durationFrames: 1 }, assets: { images: {} }, shots: [{ id: "probe", start: 0, end: 1, draw: (ctx: Ctx, _f: number, env: Env) => drawAt(ctx, PROBE_T, env) }] };
