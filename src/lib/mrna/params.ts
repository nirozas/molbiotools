import { Organism, getOrganism } from "./codonTables";
import { cai, gc3, findMotif, cleanSeq, optimize, Strategy, translate } from "./analysis";
import { foldMFE } from "./fold";
import { UTR, UTR_LIBRARY, designUTR3, designUTR5, libraryFor } from "./utrLibrary";

export interface MrnaRecord {
  id: string;
  name: string;
  utr5: string;
  cds: string;
  utr3: string;
  orgId: string;
}

export interface Params {
  length: number; len5: number; lenCds: number; len3: number;
  A: number; T: number; G: number; C: number; AT: number; GC: number; GC3: number; // percent
  mfe: number; mfePerNt: number; mfeApprox: boolean;
  mfe5: number; mfeStart: number;
  cai: number; kozak: number; kozakLabel: string; uorfs: number;
  are: number; cryptPas: number; upa: number; rareClusters: number; homopolymers: number;
  validCds: boolean; hasPolyASignal: boolean;
  stability: number; translation: number; overall: number;
}

const clamp = (x: number, a = 0, b = 100) => Math.max(a, Math.min(b, x));

/** Whole-transcript MFE: exact for ≤300 nt, otherwise sum of non-overlapping 150-nt segments. */
export function mfeLong(seq: string): { mfe: number; approx: boolean } {
  if (seq.length <= 300) return { mfe: foldMFE(seq), approx: false };
  let sum = 0;
  for (let i = 0; i < seq.length; i += 150) {
    const seg = seq.slice(i, i + 150);
    if (seg.length >= 40) sum += foldMFE(seg);
  }
  return { mfe: sum, approx: true };
}

export function computeParams(rec: MrnaRecord, org: Organism, fast = false): Params {
  const { utr5, cds, utr3 } = rec;
  const full = utr5 + cds + utr3;
  const n = full.length || 1;
  const cnt = (c: string) => (full.match(new RegExp(c, "g"))?.length ?? 0);
  const A = (100 * cnt("A")) / n, T = (100 * cnt("T")) / n, G = (100 * cnt("G")) / n, C = (100 * cnt("C")) / n;

  const fiveRegion = full.slice(0, 50);
  const startRegion = (utr5 + cds.slice(0, 30)).slice(-60);
  const mfe5 = fiveRegion.length >= 8 ? foldMFE(fiveRegion) : 0;
  const mfeStart = startRegion.length >= 8 ? foldMFE(startRegion) : 0;
  const { mfe, approx } = fast ? { mfe: NaN, approx: true } : mfeLong(full);
  const mfePerNt = isNaN(mfe) ? NaN : mfe / n;

  const caiV = cai(cds, org);
  const ctx = (utr5.slice(-3) + cds.slice(0, 4)).padStart(7, "N");
  let kz = 0;
  if (ctx[0] === "A" || ctx[0] === "G") kz += 0.6;
  if (ctx[6] === "G") kz += 0.4;
  const kozakLabel = org.id === "ecoli" ? (/AGGAG|GGAGG|AAGGA/.test(utr5.slice(-20)) ? "SD present" : "No SD")
    : kz >= 1 ? "Strong" : kz >= 0.6 ? "Adequate" : kz >= 0.4 ? "Weak" : "Poor";
  if (org.id === "ecoli") kz = /AGGAG|GGAGG|AAGGA/.test(utr5.slice(-20)) ? 1 : 0.2;

  const uorfs = findMotif(utr5, "ATG").length;
  const are = findMotif(full, "ATTTA").length;
  const cryptPas = findMotif(cds, "AATAAA|ATTAAA").length;
  const upa = full.length > 1 ? (findMotif(full, "TA").length / (full.length - 1)) * 100 : 0;
  const homopolymers = findMotif(full, "A{8,}|T{8,}|G{6,}|C{8,}").length;
  let runs = 0, run = 0;
  for (let i = 0; i + 3 <= cds.length; i += 3) {
    const w = org.w[cds.slice(i, i + 3)];
    if (w !== undefined && w < 0.3) { run++; if (run === 3) runs++; } else run = 0;
  }
  const prot = translate(cds);
  const validCds = cds.startsWith("ATG") && cds.length % 3 === 0 && /\*$/.test(prot) && prot.indexOf("*") === prot.length - 1;
  const hasPolyA = /AATAAA|ATTAAA/.test(utr3);
  const gcAll = G + C;

  // ── stability heuristic
  let st = 50 + (caiV - 0.6) * 40 - Math.abs(gcAll - 52) * 0.4;
  if (!isNaN(mfePerNt)) {
    const dens = -mfePerNt;
    st += clamp(dens * 100, 0, 30) * 0.5;
    if (dens > 0.45) st -= (dens - 0.45) * 60;
  }
  st -= are * 4 + Math.max(0, upa - 7) * 1.5 + (runs + homopolymers) * 3 + cryptPas * 4;
  if (hasPolyA) st += 3;

  // ── translation heuristic
  let tr = 40 + kz * 20 - uorfs * 8 + (caiV - 0.6) * 40
    - clamp(-mfe5 - 8, 0, 20) * 0.5 - clamp(-mfeStart - 12, 0, 20) * 0.5 - runs * 3;
  if (utr5.length > 200) tr -= 8;
  if (utr5.length < 8 && org.id !== "ecoli") tr -= 4;
  if (!validCds) tr -= 15;

  const stability = clamp(st), translation = clamp(tr);
  return {
    length: full.length, len5: utr5.length, lenCds: cds.length, len3: utr3.length,
    A, T, G, C, AT: A + T, GC: gcAll, GC3: gc3(cds),
    mfe, mfePerNt, mfeApprox: approx, mfe5, mfeStart,
    cai: caiV, kozak: kz, kozakLabel, uorfs, are, cryptPas, upa, rareClusters: runs, homopolymers,
    validCds, hasPolyASignal: hasPolyA,
    stability, translation, overall: (stability + translation) / 2,
  };
}

/* ───────── ORF annotation of a full transcript ───────── */

export function annotateMrna(seq: string, u5Len?: number, cdsLen?: number) {
  if (u5Len !== undefined && cdsLen !== undefined && u5Len + cdsLen <= seq.length) {
    return { utr5: seq.slice(0, u5Len), cds: seq.slice(u5Len, u5Len + cdsLen), utr3: seq.slice(u5Len + cdsLen) };
  }
  let best: { s: number; e: number } | null = null;
  for (const s of findMotif(seq, "ATG")) {
    let e = s + 3;
    let stop = false;
    while (e + 3 <= seq.length) {
      const c = seq.slice(e, e + 3);
      e += 3;
      if (c === "TAA" || c === "TAG" || c === "TGA") { stop = true; break; }
    }
    if (!stop) e = s + Math.floor((seq.length - s) / 3) * 3;
    if (stop && e - s >= 90) { best = { s, e }; break; }
    if (!best || e - s > best.e - best.s) best = { s, e };
  }
  if (!best) return { utr5: "", cds: seq.slice(0, seq.length - (seq.length % 3)), utr3: seq.slice(seq.length - (seq.length % 3)) };
  return { utr5: seq.slice(0, best.s), cds: seq.slice(best.s, best.e), utr3: seq.slice(best.e) };
}

/* ───────── ORF finder (CDS detection) ───────── */

export interface Orf {
  strand: "+" | "-";
  start: number;      // 0-based on the strand's own sequence
  end: number;        // exclusive
  frame: number;
  hasStop: boolean;
  len: number;        // nt
  aa: number;
  protein: string;
  utr5: string;
  cds: string;
  utr3: string;
}

/** All ATG-initiated ORFs (≥ minAa codons), longest first. Non-nested: the outermost ATG per stop codon. */
export function findOrfs(input: string, opts: { minAa?: number; reverse?: boolean } = {}): Orf[] {
  const minAa = opts.minAa ?? 30;
  const orfs: Orf[] = [];
  const scan = (seq: string, strand: "+" | "-") => {
    for (let frame = 0; frame < 3; frame++) {
      let i = frame;
      while (i + 3 <= seq.length) {
        if (seq.slice(i, i + 3) !== "ATG") { i += 3; continue; }
        let e = i;
        let stop = false;
        while (e + 3 <= seq.length) {
          const c = seq.slice(e, e + 3);
          e += 3;
          if (c === "TAA" || c === "TAG" || c === "TGA") { stop = true; break; }
        }
        const cds = seq.slice(i, e);
        const prot = translate(cds);
        const aa = prot.replace(/\*$/, "").length;
        if (aa >= minAa) {
          orfs.push({
            strand, start: i, end: e, frame, hasStop: stop, len: cds.length, aa,
            protein: prot, utr5: seq.slice(0, i), cds, utr3: seq.slice(e),
          });
        }
        i = e; // continue after this ORF (skips nested ATGs in the same frame)
      }
    }
  };
  scan(input, "+");
  if (opts.reverse) {
    const rc = input.split("").reverse().map((c) => ({ A: "T", T: "A", G: "C", C: "G" } as Record<string, string>)[c] ?? "N").join("");
    scan(rc, "-");
  }
  return orfs.sort((a, b) => b.len - a.len);
}

/* ───────── candidate generation ───────── */

export type UtrMode = "auto" | "library" | "designed" | "custom" | "none";
export type Goal = "stability" | "translation" | "balanced";

export interface GenOptions {
  input: string;
  orgId: string;        // host organism (codon usage + UTR library)
  n: number;
  goal: Goal;
  gcRange: [number, number];
  avoid: string[];
  mode5: UtrMode; mode3: UtrMode;
  pick5: string[]; pick3: string[];
  custom5: string; custom3: string;
  seed: number;
}

export interface Candidate {
  rec: MrnaRecord;
  params: Params;
  strategy: Strategy;
  utr5: UTR | null;
  utr3: UTR | null;
  changed: number;
  rank: number;
}

function utrPool(orgId: string, type: 5 | 3, mode: UtrMode, picks: string[], custom: string, seed: number): (UTR | null)[] {
  const lib = libraryFor(orgId, type);
  const design = (k: number) =>
    Array.from({ length: k }, (_, i) => (type === 5 ? designUTR5(orgId, seed + i) : designUTR3(orgId, seed + i)));
  switch (mode) {
    case "none": return [null];
    case "custom": {
      const s = cleanSeq(custom);
      return s ? [{ id: "custom", name: "Custom", type, organisms: [orgId], kind: "library", seq: s, note: "User supplied" }] : [null];
    }
    case "library": {
      const sel = UTR_LIBRARY.filter((u) => u.type === type && picks.includes(u.id));
      const l = sel.length ? sel : lib;
      return l.length ? l : design(3);
    }
    case "designed": return design(4);
    default: return [...lib, ...design(3)];
  }
}

export function generateCandidates(o: GenOptions): { candidates: Candidate[]; protein: string; warnings: string[] } {
  const org = getOrganism(o.orgId);
  const warnings: string[] = [];
  const raw = o.input.trim().replace(/^>.*$/gm, "");
  const isProt = /[^ACGTUacgtu\s]/.test(raw);
  const seq = isProt ? raw.replace(/[^A-Za-z*]/g, "").toUpperCase() : cleanSeq(raw);
  const pool5 = utrPool(o.orgId, 5, o.mode5, o.pick5, o.custom5, o.seed);
  const pool3 = utrPool(o.orgId, 3, o.mode3, o.pick3, o.custom3, o.seed + 100);
  const strategies: Strategy[] = ["max", "gc", "match", "match", "gc"];
  const poolSize = Math.min(40, Math.max(4 * o.n, 8));
  const seen = new Set<string>();
  const scored: Candidate[] = [];

  const goalScore = (p: Params) =>
    o.goal === "stability" ? p.stability : o.goal === "translation" ? p.translation : p.overall;

  let protein = "";
  for (let t = 0; t < poolSize; t++) {
    const strategy = strategies[t % strategies.length];
    const opt = optimize(seq, { org, strategy, gcTarget: o.gcRange, avoid: o.avoid, seed: o.seed + t * 17 });
    protein = opt.protein;
    if (opt.remainingMotifs.length && t === 0) warnings.push(`Could not remove: ${opt.remainingMotifs.join(", ")}`);
    const u5 = pool5[t % pool5.length];
    const u3 = pool3[Math.floor(t / Math.max(1, pool5.length)) % pool3.length];
    const rec: MrnaRecord = {
      id: `cand-${t}`, name: "", orgId: o.orgId,
      utr5: u5?.seq ?? "", cds: opt.dna, utr3: u3?.seq ?? "",
    };
    const key = rec.utr5 + rec.cds + rec.utr3;
    if (seen.has(key)) continue;
    seen.add(key);
    scored.push({ rec, params: computeParams(rec, org, true), strategy, utr5: u5, utr3: u3, changed: opt.changedCodons, rank: 0 });
  }
  // prescreen with the fast (structure-free) score, then compute full parameters for the finalists
  scored.sort((a, b) => goalScore(b.params) - goalScore(a.params));
  const finalists = scored.slice(0, Math.min(scored.length, Math.max(o.n * 2, o.n)));
  finalists.forEach((c) => (c.params = computeParams(c.rec, org, false)));
  finalists.sort((a, b) => goalScore(b.params) - goalScore(a.params));
  const top = finalists.slice(0, o.n);
  top.forEach((c, i) => {
    c.rank = i + 1;
    c.rec.name = `mRNA_${i + 1}`;
  });
  if (top.length < o.n) warnings.push(`Only ${top.length} unique candidates could be generated with the chosen options.`);
  return { candidates: top, protein, warnings };
}

/* ───────── shared storage between tools ───────── */

export const STORE_KEY = "mrna_suite_records";
export const STRUCT_KEY = "mrna_suite_structure";

export function saveRecords(recs: MrnaRecord[]) {
  if (typeof window !== "undefined") localStorage.setItem(STORE_KEY, JSON.stringify(recs));
}
export function loadRecords(): MrnaRecord[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); } catch { return []; }
}
export function toFasta(rec: MrnaRecord, rna = false) {
  const s = rec.utr5 + rec.cds + rec.utr3;
  return `>${rec.name} org=${rec.orgId} u5=${rec.utr5.length} cds=${rec.cds.length}\n${rna ? s.replace(/T/g, "U") : s}`;
}
