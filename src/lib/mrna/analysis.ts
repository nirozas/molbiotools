import { foldMFE } from "./fold";
import { AA_TO_CODONS, CODON_TO_AA, Organism } from "./codonTables";

/* ───────────── helpers ───────────── */

export function cleanSeq(s: string): string {
  return s
    .replace(/^>.*$/gm, "")
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase()
    .replace(/U/g, "T");
}

export const gcPct = (s: string) =>
  s.length ? (100 * (s.match(/[GC]/g)?.length ?? 0)) / s.length : 0;

function codons(cds: string): string[] {
  const out: string[] = [];
  for (let i = 0; i + 3 <= cds.length; i += 3) out.push(cds.slice(i, i + 3));
  return out;
}

export function gc3(cds: string): number {
  const cs = codons(cds);
  if (!cs.length) return 0;
  return (100 * cs.filter((c) => c[2] === "G" || c[2] === "C").length) / cs.length;
}

export function cai(cds: string, org: Organism): number {
  const cs = codons(cds).filter((c) => CODON_TO_AA[c] && CODON_TO_AA[c] !== "*" && c !== "ATG" && c !== "TGG");
  if (!cs.length) return 0;
  const logSum = cs.reduce((a, c) => a + Math.log(Math.max(org.w[c], 0.01)), 0);
  return Math.exp(logSum / cs.length);
}

export function translate(cds: string): string {
  return codons(cds).map((c) => CODON_TO_AA[c] ?? "X").join("");
}

/* folding lives in fold.ts */
export { foldMFE };

/** Windowed folding ΔG: window 120, step 60. */
export function windowedFold(dna: string, win = 120, step = 60) {
  const out: { start: number; dG: number }[] = [];
  if (dna.length <= win) return [{ start: 0, dG: foldMFE(dna) }];
  for (let i = 0; i < dna.length; i += step) {
    const w = dna.slice(i, i + win);
    if (w.length < 40) break;
    out.push({ start: i, dG: foldMFE(w) });
    if (i + win >= dna.length) break;
  }
  return out;
}

/* ───────────── motif utilities ───────────── */

export function findMotif(seq: string, motif: string | RegExp): number[] {
  const re = typeof motif === "string" ? new RegExp(motif, "g") : new RegExp(motif.source, "g");
  const hits: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(seq))) {
    hits.push(m.index);
    re.lastIndex = m.index + 1;
  }
  return hits;
}

const clamp = (x: number, a = 0, b = 100) => Math.max(a, Math.min(b, x));

/* ───────────── stability ───────────── */

export interface StabilityResult {
  length: number;
  gc: number;
  gc3: number;
  cai: number;
  meanWindowDG: number; // kcal/mol per 120-nt window
  dGPerNt: number;
  windows: { start: number; dG: number }[];
  are: number[];
  pas: number[];
  drach: number;
  upa: number;
  homopolymers: number;
  rareCodonRuns: number;
  score: number;
  flags: string[];
}

export function analyzeStability(full: string, cds: string, org: Organism): StabilityResult {
  const windows = windowedFold(full);
  const meanW = windows.reduce((a, w) => a + w.dG, 0) / windows.length;
  const dGPerNt = meanW / Math.min(120, full.length);
  const are = findMotif(full, "ATTTA");
  const pas = findMotif(full, "AATAAA|ATTAAA");
  const drach = findMotif(full, "[AGT][AG]AC[ACT]").length;
  const upa = full.length > 1 ? (findMotif(full, "TA").length / (full.length - 1)) * 100 : 0;
  const homo = findMotif(full, "A{8,}|T{8,}|G{6,}|C{8,}").length;
  const cs = codons(cds);
  let runs = 0, run = 0;
  for (const c of cs) {
    if (org.w[c] !== undefined && org.w[c] < 0.3) { run++; if (run === 3) runs++; } else run = 0;
  }
  const g = gcPct(full), c = cai(cds, org);

  // heuristic composite: structure & codon optimality help, decay motifs hurt
  let score = 50;
  score += clamp(-dGPerNt * 100, 0, 30) * 0.5;         // moderate structure stabilises
  score += (c - 0.6) * 40;                              // codon optimality ↔ stability
  score -= Math.abs(g - 52) * 0.4;                      // GC far from optimum
  score -= are.length * 4;
  score -= Math.max(0, upa - 7) * 1.5;
  score -= runs * 3 + homo * 3;
  score = clamp(score);

  const flags: string[] = [];
  if (are.length) flags.push(`${are.length} AU-rich ATTTA motif(s) – ARE-mediated decay risk`);
  if (c < 0.7) flags.push("Low CAI – suboptimal codons can accelerate decay");
  if (g < 35 || g > 65) flags.push(`GC content ${g.toFixed(1)}% outside 35-65%`);
  if (runs) flags.push(`${runs} rare-codon cluster(s) (≥3 consecutive)`);
  if (upa > 10) flags.push("High UpA dinucleotide frequency (RNase-sensitive)");
  const pasCds = findMotif(cds, "AATAAA|ATTAAA").length;
  if (pasCds) flags.push(`${pasCds} cryptic poly(A) signal(s) inside CDS`);
  if (dGPerNt < -0.45) flags.push("Very strong secondary structure");

  return {
    length: full.length, gc: g, gc3: gc3(cds), cai: c, meanWindowDG: meanW, dGPerNt, windows,
    are, pas, drach, upa, homopolymers: homo, rareCodonRuns: runs, score, flags,
  };
}

/* ───────────── translation potential ───────────── */

export interface TranslationResult {
  validCDS: boolean;
  issues: string[];
  kozak: { score: number; minus3: string; plus4: string; label: string };
  uorfs: number;
  utrLen: number;
  utrGC: number;
  fiveDG: number;
  cai: number;
  gc3: number;
  rareClusters: number;
  score: number;
}

export function analyzeTranslation(utr5: string, cds: string, org: Organism): TranslationResult {
  const issues: string[] = [];
  if (!cds.startsWith("ATG")) issues.push("CDS does not start with ATG");
  if (cds.length % 3) issues.push("CDS length is not a multiple of 3");
  const prot = translate(cds);
  const stopIdx = prot.indexOf("*");
  if (stopIdx !== -1 && stopIdx < prot.length - 1) issues.push(`Internal stop codon at codon ${stopIdx + 1}`);
  if (!/[*]$/.test(prot)) issues.push("No terminal stop codon");

  const ctx = (utr5.slice(-3) + cds.slice(0, 4)).padStart(7, "N");
  const minus3 = ctx[0], plus4 = ctx[6];
  let kz = 0;
  if (minus3 === "A" || minus3 === "G") kz += 0.6;
  if (plus4 === "G") kz += 0.4;
  const kozakLabel = kz >= 1 ? "Strong" : kz >= 0.6 ? "Adequate" : kz >= 0.4 ? "Weak" : "Poor";

  // upstream ATGs (uORFs) in 5'UTR
  const uorfs = findMotif(utr5, "ATG").length;
  const fiveRegion = (utr5 + cds.slice(0, 30)).slice(-60);
  const fiveDG = fiveRegion.length >= 8 ? foldMFE(fiveRegion) : 0;
  const c = cai(cds, org);
  const cs = codons(cds);
  let clusters = 0, run = 0;
  for (const cd of cs) {
    if (org.w[cd] !== undefined && org.w[cd] < 0.3) { run++; if (run === 3) clusters++; } else run = 0;
  }

  let score = 40;
  score += kz * 20;
  score -= uorfs * 8;
  score += (c - 0.6) * 40;
  score -= clamp(-fiveDG - 12, 0, 20) * 0.8; // strong 5' structure blocks scanning
  if (utr5.length > 200) score -= 8;
  if (utr5.length < 10) score -= 3;
  score -= clusters * 3;
  if (issues.length) score -= 15;

  return {
    validCDS: issues.length === 0, issues,
    kozak: { score: kz, minus3, plus4, label: kozakLabel },
    uorfs, utrLen: utr5.length, utrGC: gcPct(utr5), fiveDG, cai: c, gc3: gc3(cds),
    rareClusters: clusters, score: clamp(score),
  };
}

/* ───────────── codon optimization ───────────── */

export type Strategy = "max" | "match" | "gc";

export interface OptimizeOptions {
  org: Organism;
  strategy: Strategy;
  gcTarget?: [number, number];
  avoid?: string[]; // DNA motifs (restriction sites etc.)
  seed?: number;
}

function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function reverseComplement(s: string) {
  const m: Record<string, string> = { A: "T", T: "A", G: "C", C: "G" };
  return s.split("").reverse().map((x) => m[x] ?? "N").join("");
}

export function backTranslate(protein: string, o: OptimizeOptions): string {
  const rand = rng(o.seed ?? 42);
  const out: string[] = [];
  for (const aa of protein) {
    const opts = AA_TO_CODONS[aa];
    if (!opts) continue;
    if (o.strategy === "max" || o.strategy === "gc") {
      out.push([...opts].sort((a, b) => o.org.usage[b] - o.org.usage[a])[0]);
    } else {
      const tot = opts.reduce((a, c) => a + o.org.usage[c], 0);
      let r = rand() * tot, pick = opts[0];
      for (const c of opts) { r -= o.org.usage[c]; if (r <= 0) { pick = c; break; } }
      out.push(pick);
    }
  }
  return out.join("");
}

function badMotifs(avoid: string[]): string[] {
  const base = ["ATTTA", "AATAAA", "AAAAAAA", "TTTTTTT", "GGGGGG", "CCCCCCC"];
  const extra = avoid.flatMap((m) => [m, reverseComplement(m)]);
  return Array.from(new Set([...base, ...extra].filter(Boolean)));
}

export interface OptimizeResult {
  dna: string;
  before: { cai: number; gc: number; gc3: number };
  after: { cai: number; gc: number; gc3: number };
  protein: string;
  changedCodons: number;
  totalCodons: number;
  remainingMotifs: string[];
  log: string[];
}

export function optimize(input: string, o: OptimizeOptions): OptimizeResult {
  const log: string[] = [];
  const isProtein = /[^ACGTN]/.test(input);
  let protein = isProtein ? input.replace(/[^A-Z*]/g, "") : translate(input);
  const hadStop = protein.endsWith("*");
  protein = protein.replace(/\*+$/, "");
  const origCds = isProtein ? "" : input.slice(0, protein.length * 3);

  const codonsArr = codons(backTranslate(protein, o));
  const motifs = badMotifs((o.avoid ?? []).map((m) => m.toUpperCase().replace(/[^ACGT]/g, "")).filter(Boolean));
  const gcRange = o.gcTarget ?? [40, 60];

  const score = (cs: string[], idx: number, cand: string) => o.org.w[cand];

  // GC-target adjustment
  if (o.strategy === "gc") {
    const gcOf = () => gcPct(codonsArr.join(""));
    let guard = 0;
    while ((gcOf() < gcRange[0] || gcOf() > gcRange[1]) && guard++ < 5000) {
      const up = gcOf() < gcRange[0];
      let bestI = -1, bestCost = Infinity, bestC = "";
      codonsArr.forEach((c, i) => {
        for (const alt of AA_TO_CODONS[CODON_TO_AA[c]]) {
          if (alt === c) continue;
          const d = (alt.match(/[GC]/g)?.length ?? 0) - (c.match(/[GC]/g)?.length ?? 0);
          if ((up && d <= 0) || (!up && d >= 0)) continue;
          const cost = o.org.w[c] - o.org.w[alt];
          if (cost < bestCost) { bestCost = cost; bestI = i; bestC = alt; }
        }
      });
      if (bestI < 0) break;
      codonsArr[bestI] = bestC;
    }
    log.push(`GC adjusted to ${gcOf().toFixed(1)}% (target ${gcRange[0]}–${gcRange[1]}%)`);
  }

  // motif repair
  let seq = codonsArr.join("");
  const remaining: string[] = [];
  for (let pass = 0; pass < 20; pass++) {
    let fixedAny = false;
    for (const m of motifs) {
      for (const pos of findMotif(seq, m)) {
        const first = Math.floor(pos / 3), last = Math.floor((pos + m.length - 1) / 3);
        let best: { i: number; c: string; w: number } | null = null;
        for (let i = first; i <= last; i++) {
          for (const alt of AA_TO_CODONS[CODON_TO_AA[codonsArr[i]]]) {
            if (alt === codonsArr[i]) continue;
            const trial = codonsArr.slice(); trial[i] = alt;
            const ts = trial.join("");
            if (findMotif(ts, m).length < findMotif(seq, m).length && !motifs.some((x) => x !== m && findMotif(ts, x).length > findMotif(seq, x).length)) {
              if (!best || o.org.w[alt] > best.w) best = { i, c: alt, w: o.org.w[alt] };
            }
          }
        }
        if (best) { codonsArr[best.i] = best.c; seq = codonsArr.join(""); fixedAny = true; break; }
      }
    }
    if (!fixedAny) break;
  }
  for (const m of motifs) if (findMotif(seq, m).length) remaining.push(m);
  if (!remaining.length) log.push(`Removed/avoided ${motifs.length} motif(s) (incl. ATTTA, AATAAA, homopolymers)`);

  const dna = seq + (hadStop || isProtein ? "TAA" : "");
  const changed = origCds ? codons(origCds).filter((c, i) => c !== codonsArr[i]).length : codonsArr.length;
  void score;
  return {
    dna,
    protein,
    before: origCds
      ? { cai: cai(origCds, o.org), gc: gcPct(origCds), gc3: gc3(origCds) }
      : { cai: NaN, gc: NaN, gc3: NaN },
    after: { cai: cai(seq, o.org), gc: gcPct(seq), gc3: gc3(seq) },
    changedCodons: changed,
    totalCodons: codonsArr.length,
    remainingMotifs: remaining,
    log,
  };
}
