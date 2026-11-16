/* Simplified stack-based RNA folding (Zuker-lite) with traceback.
   Banded implementation: base pairs are limited to a maximum span L (like RNAfold --maxBPspan),
   giving O(n·L²) time and O(n·L) memory, so multi-kilobase mRNAs can be folded without limits.
   When L >= n-1 the result is the exact global minimum for this energy model. */

const STACKS: Record<string, number> = {
  "AA/UU": -0.93, "AU/UA": -1.10, "UA/AU": -1.33, "CU/GA": -2.08, "CA/GU": -2.11,
  "GU/CA": -2.24, "GA/CU": -2.35, "CG/GC": -2.36, "GG/CC": -3.26, "GC/CG": -3.42,
};
for (const k of Object.keys(STACKS)) {
  const [t, b] = k.split("/");
  const sym = `${b[1]}${b[0]}/${t[1]}${t[0]}`;
  if (!(sym in STACKS)) STACKS[sym] = STACKS[k];
}

export const canPair = (a: string, b: string) =>
  (a === "A" && b === "U") || (a === "U" && b === "A") ||
  (a === "G" && b === "C") || (a === "C" && b === "G") ||
  (a === "G" && b === "U") || (a === "U" && b === "G");

export function stackE(a: string, b: string, c: string, d: string): number {
  const k = `${a}${c}/${b}${d}`;
  return k in STACKS ? STACKS[k] : -1.3;
}

const INF = 1e9;
const hp = (len: number) => 4.5 + 1.75 * 0.616 * Math.log(Math.max(len, 3) / 3);

function core(s: string, maxSpan: number) {
  const n = s.length;
  const L = Math.max(4, Math.min(maxSpan, n - 1));
  const w = L + 1;
  const V = new Float32Array(n * w).fill(INF);
  const W = new Float32Array(n * w);

  for (let d = 4; d <= L; d++) {
    for (let i = 0; i + d < n; i++) {
      const j = i + d;
      const ij = i * w + d;
      if (canPair(s[i], s[j])) {
        let best = hp(d - 1);
        const inner = V[(i + 1) * w + (d - 2)];
        if (inner < INF) best = Math.min(best, stackE(s[i], s[j], s[i + 1], s[j - 1]) + inner);
        const kmax = Math.min(i + 9, j - 4);
        for (let k = i + 1; k < kmax; k++) {
          const lmin = Math.max(k + 4, j - 9 + (k - i - 1));
          const kBase = k * w - k;
          for (let l = j - 1; l >= lmin; l--) {
            if (k === i + 1 && l === j - 1) continue;
            const v = V[kBase + l];
            if (v >= INF) continue;
            const c = v + 1.5 + 0.3 * ((k - i - 1) + (j - l - 1));
            if (c < best) best = c;
          }
        }
        const i1Base = (i + 1) * w - (i + 1);
        for (let k = i + 5; k < j - 5; k++) {
          const a = W[i1Base + k];
          if (a >= -1e-6) continue;
          const b = W[(k + 1) * w + (j - k - 2)];
          if (b < -1e-6) {
            const c = a + b + 3.4;
            if (c < best) best = c;
          }
        }
        V[ij] = best;
      }
      let wv = Math.min(W[(i + 1) * w + (d - 1)], W[ij - 1]);
      const vij = V[ij];
      if (vij < INF && vij + 0.5 < wv) wv = vij + 0.5;
      const iBase = i * w - i;
      for (let k = i + 4; k <= j - 5; k++) {
        const a = W[iBase + k];
        if (a >= -1e-6) continue;
        const c = a + W[(k + 1) * w + (j - k - 1)];
        if (c < wv) wv = c;
      }
      W[ij] = wv < 0 ? wv : 0;
    }
  }

  // exterior loop (unbounded transcript length; individual stems limited by L)
  const F = new Float64Array(n + 1);
  for (let j = 0; j < n; j++) {
    let f = F[j];
    const imin = Math.max(0, j - L);
    for (let i = imin; i <= j - 4; i++) {
      const v = V[i * w + (j - i)];
      if (v < INF) {
        const c = F[i] + v + 0.5;
        if (c < f) f = c;
      }
    }
    F[j + 1] = f;
  }
  return { V, W, F, w, L };
}

export function defaultSpanForLength(n: number): number {
  if (n <= 450) return Infinity;
  if (n <= 1500) return 250;
  if (n <= 4000) return 200;
  return 150;
}

export function foldMFE(dna: string, maxSpan = Infinity): number {
  const s = dna.replace(/T/g, "U");
  if (s.length < 8) return 0;
  return core(s, maxSpan).F[s.length];
}

export interface FoldResult {
  seq: string; // RNA
  mfe: number;
  pairs: [number, number][];
  pt: number[]; // pair table, -1 if unpaired
  dotBracket: string;
  maxSpan: number;
}

export function foldStructure(dna: string, maxSpan = defaultSpanForLength(dna.length)): FoldResult {
  const s = dna.replace(/T/g, "U");
  const n = s.length;
  const pt = new Array(n).fill(-1);
  if (n < 8) return { seq: s, mfe: 0, pairs: [], pt, dotBracket: ".".repeat(n), maxSpan: n };
  const { V, W, F, w, L } = core(s, maxSpan);
  const eq = (a: number, b: number) => Math.abs(a - b) < 1e-3;
  const vi = (i: number, j: number) => i * w + (j - i);
  const stack: { t: "F" | "W" | "V"; i: number; j: number }[] = [{ t: "F", i: 0, j: n }];
  while (stack.length) {
    const { t, i, j } = stack.pop()!;
    if (t === "F") {
      if (j <= 0) continue;
      if (eq(F[j], F[j - 1])) { stack.push({ t: "F", i: 0, j: j - 1 }); continue; }
      for (let a = Math.max(0, j - 1 - L); a <= j - 5; a++) {
        const v = V[vi(a, j - 1)];
        if (v < INF && eq(F[j], F[a] + v + 0.5)) {
          stack.push({ t: "F", i: 0, j: a }, { t: "V", i: a, j: j - 1 });
          break;
        }
      }
    } else if (t === "W") {
      if (j - i < 4) continue;
      const wv = W[vi(i, j)];
      if (Math.abs(wv) < 1e-6) continue;
      if (eq(wv, W[vi(i + 1, j)])) stack.push({ t: "W", i: i + 1, j });
      else if (eq(wv, W[vi(i, j - 1)])) stack.push({ t: "W", i, j: j - 1 });
      else if (V[vi(i, j)] < INF && eq(wv, V[vi(i, j)] + 0.5)) stack.push({ t: "V", i, j });
      else {
        for (let k = i + 4; k <= j - 5; k++) {
          if (eq(wv, W[vi(i, k)] + W[vi(k + 1, j)])) {
            stack.push({ t: "W", i, j: k }, { t: "W", i: k + 1, j });
            break;
          }
        }
      }
    } else {
      pt[i] = j; pt[j] = i;
      const v = V[vi(i, j)];
      if (eq(v, hp(j - i - 1))) continue;
      const inner = V[vi(i + 1, j - 1)];
      if (inner < INF && eq(v, stackE(s[i], s[j], s[i + 1], s[j - 1]) + inner)) {
        stack.push({ t: "V", i: i + 1, j: j - 1 });
        continue;
      }
      let done = false;
      const kmax = Math.min(i + 9, j - 4);
      for (let k = i + 1; k < kmax && !done; k++) {
        const lmin = Math.max(k + 4, j - 9 + (k - i - 1));
        for (let l = j - 1; l >= lmin; l--) {
          if (k === i + 1 && l === j - 1) continue;
          const vv = V[vi(k, l)];
          if (vv >= INF) continue;
          if (eq(v, vv + 1.5 + 0.3 * ((k - i - 1) + (j - l - 1)))) {
            stack.push({ t: "V", i: k, j: l });
            done = true;
            break;
          }
        }
      }
      if (done) continue;
      for (let k = i + 5; k < j - 5; k++) {
        const a = W[vi(i + 1, k)], b = W[vi(k + 1, j - 1)];
        if (a < -1e-6 && b < -1e-6 && eq(v, a + b + 3.4)) {
          stack.push({ t: "W", i: i + 1, j: k }, { t: "W", i: k + 1, j: j - 1 });
          break;
        }
      }
    }
  }
  const pairs: [number, number][] = [];
  const chars: string[] = new Array(n);
  for (let i = 0; i < n; i++) {
    if (pt[i] > i) pairs.push([i, pt[i]]);
    chars[i] = pt[i] === -1 ? "." : pt[i] > i ? "(" : ")";
  }
  return { seq: s, mfe: F[n], pairs, pt, dotBracket: chars.join(""), maxSpan: L };
}

/* ───────── 2D layout (loop-based regular-polygon layout) ───────── */

export function layoutStructure(pt: number[]): { x: number[]; y: number[] } {
  const n = pt.length;
  const x = new Array(n).fill(0), y = new Array(n).fill(0);
  type P = [number, number];
  const todo: { i: number; j: number; P0: P; Pm1: P }[] = [{ i: -1, j: n, P0: [1, 0], Pm1: [0, 0] }];
  while (todo.length) {
    const { i, j, P0, Pm1 } = todo.pop()!;
    const vid: number[] = [i];
    const stems: { ta: number; k: number; p: number }[] = [];
    let k = i + 1;
    while (k < j) {
      if (pt[k] > k) {
        stems.push({ ta: vid.length, k, p: pt[k] });
        vid.push(k, pt[k]);
        k = pt[k] + 1;
      } else { vid.push(k); k++; }
    }
    vid.push(j);
    const m = vid.length;
    const ex = P0[0] - Pm1[0], ey = P0[1] - Pm1[1];
    const d = Math.hypot(ex, ey) || 1;
    const apothem = d / (2 * Math.tan(Math.PI / m));
    const R = d / (2 * Math.sin(Math.PI / m));
    const cx = (P0[0] + Pm1[0]) / 2 + (-ey / d) * apothem;
    const cy = (P0[1] + Pm1[1]) / 2 + (ex / d) * apothem;
    const th0 = Math.atan2(P0[1] - cy, P0[0] - cx);
    const pos: P[] = [];
    for (let t = 0; t < m; t++) {
      const a = th0 + (2 * Math.PI * t) / m;
      pos.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
    }
    for (let t = 1; t < m - 1; t++) { x[vid[t]] = pos[t][0]; y[vid[t]] = pos[t][1]; }
    for (const st of stems) todo.push({ i: st.k, j: st.p, P0: pos[st.ta], Pm1: pos[st.ta + 1] });
  }
  return { x, y };
}
