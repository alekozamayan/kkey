/**
 * Karplus–Strong plucked string, rendered into an AudioBuffer.
 * Pure function so it can be unit-tested without an AudioContext.
 */
export function karplusStrong(
  freq: number,
  sampleRate: number,
  seconds: number,
  opts: { damping?: number; brightness?: number; seed?: number } = {},
): Float32Array<ArrayBuffer> {
  const damping = opts.damping ?? 0.996;
  const brightness = opts.brightness ?? 0.5;
  const n = Math.max(2, Math.round(sampleRate / freq));
  const out = new Float32Array(Math.floor(sampleRate * seconds));
  const buf = new Float32Array(n);
  // Deterministic PRNG so tests are reproducible.
  let s = opts.seed ?? 12345;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  // Excitation: noise, low-passed by `brightness` (a plectrum is bright).
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const r = rand() * 2 - 1;
    prev = brightness * r + (1 - brightness) * prev;
    buf[i] = prev;
  }
  let idx = 0;
  for (let i = 0; i < out.length; i++) {
    const cur = buf[idx] ?? 0;
    const next = buf[(idx + 1) % n] ?? 0;
    out[i] = cur;
    buf[idx] = damping * 0.5 * (cur + next);
    idx = (idx + 1) % n;
  }
  return out;
}
