import { FoldResult } from "./fold";

export interface Helix { start5: number; end5: number; start3: number; end3: number; len: number; gcPct: number; span: number }
export interface Loop { type: "hairpin" | "bulge" | "internal" | "multi"; size: number; at: number }

export interface StructureReport {
  n: number; mfe: number; mfePerNt: number;
  pairs: number; pairedPct: number;
  gcPairs: number; auPairs: number; guPairs: number;
  helices: Helix[]; longestHelix: number;
  loops: Loop[]; counts: Record<Loop["type"], number>;
  longRange: number; // pairs spanning > 100 nt
  pairedProfile: number[]; // smoothed paired fraction (window 11)
  startAccessible: number | null; // fraction unpaired in -15..+15 around start codon
  end5Paired: number; end3Paired: number;
  character: string;
  strengths: string[]; weaknesses: string[];
}

export function analyzeStructure(f: FoldResult, startCodonPos: number | null): StructureReport {
  const { seq, pt, pairs } = f;
  const n = seq.length;
  let gc = 0, au = 0, gu = 0;
  for (const [i, j] of pairs) {
    const k = seq[i] + seq[j];
    if (k === "GC" || k === "CG") gc++; else if (k === "AU" || k === "UA") au++; else gu++;
  }

  // helices = maximal runs of stacked pairs
  const helices: Helix[] = [];
  const used = new Set<number>();
  for (const [i, j] of pairs) {
    if (used.has(i)) continue;
    let a = i, b = j, len = 1, g = 0;
    used.add(a);
    const isGC = (x: number, y: number) => (seq[x] + seq[y] === "GC" || seq[x] + seq[y] === "CG" ? 1 : 0);
    g += isGC(a, b);
    while (pt[a + 1] === b - 1 && a + 1 < b - 1) { a++; b--; used.add(a); len++; g += isGC(a, b); }
    helices.push({ start5: i, end5: a, start3: b, end3: j, len, gcPct: (100 * g) / len, span: j - i });
  }
  helices.sort((x, y) => y.len - x.len || y.gcPct - x.gcPct);

  // loops: walk each closing pair
  const loops: Loop[] = [];
  for (const [i, j] of pairs) {
    const inner: number[] = [];
    let k = i + 1, unp = 0;
    while (k < j) {
      if (pt[k] > k) { inner.push(k); k = pt[k] + 1; } else { unp++; k++; }
    }
    if (inner.length === 0) loops.push({ type: "hairpin", size: unp, at: i });
    else if (inner.length === 1) {
      const c = inner[0], cp = pt[c];
      const l5 = c - i - 1, l3 = j - cp - 1;
      if (l5 === 0 && l3 === 0) continue; // stack
      loops.push({ type: l5 === 0 || l3 === 0 ? "bulge" : "internal", size: l5 + l3, at: i });
    } else loops.push({ type: "multi", size: unp, at: i });
  }
  const counts = { hairpin: 0, bulge: 0, internal: 0, multi: 0 } as Record<Loop["type"], number>;
  loops.forEach((l) => counts[l.type]++);

  const profile: number[] = [];
  for (let i = 0; i < n; i++) {
    let s = 0, c = 0;
    for (let k = Math.max(0, i - 5); k <= Math.min(n - 1, i + 5); k++) { s += pt[k] !== -1 ? 1 : 0; c++; }
    profile.push(s / c);
  }
  const frac = (a: number, b: number) => {
    a = Math.max(0, a); b = Math.min(n, b);
    if (b <= a) return 0;
    let p = 0;
    for (let i = a; i < b; i++) if (pt[i] !== -1) p++;
    return p / (b - a);
  };
  const startAccessible = startCodonPos === null ? null : 1 - frac(startCodonPos - 15, startCodonPos + 18);
  const end5Paired = frac(0, 30), end3Paired = frac(n - 30, n);
  const longRange = pairs.filter(([i, j]) => j - i > 100).length;
  const pairedPct = n ? (100 * pairs.length * 2) / n : 0;
  const mfePerNt = n ? f.mfe / n : 0;

  const character =
    mfePerNt > -0.15 ? "Loosely structured" : mfePerNt > -0.35 ? "Moderately structured" : "Highly structured";

  const strengths: string[] = [], weaknesses: string[] = [];
  if (helices[0] && helices[0].len >= 6) strengths.push(`Strong stem of ${helices[0].len} bp (${helices[0].gcPct.toFixed(0)}% GC) at ${helices[0].start5 + 1}–${helices[0].end3 + 1} – protects against nucleases.`);
  if (gc / Math.max(1, pairs.length) > 0.55) strengths.push(`GC-rich stems (${((100 * gc) / Math.max(1, pairs.length)).toFixed(0)}% GC pairs) give high thermodynamic stability.`);
  if (mfePerNt <= -0.2 && mfePerNt > -0.4) strengths.push("Moderate overall folding – favours half-life without blocking ribosome passage.");
  if (startAccessible !== null && startAccessible >= 0.7) strengths.push(`Start codon region is ${(startAccessible * 100).toFixed(0)}% accessible – good for initiation.`);
  if (end5Paired < 0.35) strengths.push("5′ end is largely unpaired (cap-proximal scanning-friendly).");
  if (startAccessible !== null && startAccessible < 0.5) weaknesses.push(`Start codon region only ${(startAccessible * 100).toFixed(0)}% accessible – may impede initiation.`);
  if (end5Paired > 0.6) weaknesses.push("5′ end strongly paired – may hinder cap binding / 43S scanning.");
  if (mfePerNt < -0.4) weaknesses.push("Very dense structure – may stall ribosomes / hinder translation elongation.");
  if (mfePerNt > -0.1) weaknesses.push("Very little structure – exposed to endonuclease attack.");
  if (longRange > 6) weaknesses.push(`${longRange} long-range pairs (>100 nt) – complex, possibly unstable folding landscape.`);
  if (counts.multi > 4) weaknesses.push(`${counts.multi} multiloops – branched topology can be kinetically trapped.`);
  if (!strengths.length) strengths.push("No standout stabilising features.");
  if (!weaknesses.length) weaknesses.push("No major structural liabilities detected.");

  return {
    n, mfe: f.mfe, mfePerNt, pairs: pairs.length, pairedPct, gcPairs: gc, auPairs: au, guPairs: gu,
    helices, longestHelix: helices[0]?.len ?? 0, loops, counts, longRange,
    pairedProfile: profile, startAccessible, end5Paired, end3Paired, character, strengths, weaknesses,
  };
}
