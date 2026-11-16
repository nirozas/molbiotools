import { Params } from "./params";

export interface ParamDef {
  key: keyof Params;
  label: string;
  group: "composition" | "structure" | "codon" | "features" | "scores";
  fmt: (v: number) => string;
  /** how to decide the "best" value in a comparison */
  best: "high" | "low" | "target" | "none";
  target?: number;
  hint: string;
}

const p1 = (v: number) => (isFinite(v) ? v.toFixed(1) : "–");
const p2 = (v: number) => (isFinite(v) ? v.toFixed(2) : "–");
const p3 = (v: number) => (isFinite(v) ? v.toFixed(3) : "–");
const int = (v: number) => String(Math.round(v));

export const PARAM_DEFS: ParamDef[] = [
  { key: "length", label: "Length (nt)", group: "composition", fmt: int, best: "none", hint: "Total transcript length (excl. poly(A))" },
  { key: "len5", label: "5′UTR (nt)", group: "composition", fmt: int, best: "none", hint: "5′UTR length" },
  { key: "lenCds", label: "CDS (nt)", group: "composition", fmt: int, best: "none", hint: "Coding sequence length" },
  { key: "len3", label: "3′UTR (nt)", group: "composition", fmt: int, best: "none", hint: "3′UTR length" },
  { key: "A", label: "A ratio %", group: "composition", fmt: p1, best: "none", hint: "Adenine fraction" },
  { key: "T", label: "T/U ratio %", group: "composition", fmt: p1, best: "none", hint: "Thymine/uracil fraction" },
  { key: "G", label: "G ratio %", group: "composition", fmt: p1, best: "none", hint: "Guanine fraction" },
  { key: "C", label: "C ratio %", group: "composition", fmt: p1, best: "none", hint: "Cytosine fraction" },
  { key: "AT", label: "AT ratio %", group: "composition", fmt: p1, best: "none", hint: "A+T/U fraction" },
  { key: "GC", label: "GC ratio %", group: "composition", fmt: p1, best: "target", target: 52, hint: "GC content (≈50–55% is typically most robust)" },
  { key: "GC3", label: "GC3 %", group: "composition", fmt: p1, best: "target", target: 55, hint: "GC at 3rd codon position" },
  { key: "mfe", label: "MFE (kcal/mol)", group: "structure", fmt: p1, best: "none", hint: "Minimum free energy of the full mRNA (segmented if >300 nt)" },
  { key: "mfePerNt", label: "MFE / nt", group: "structure", fmt: p3, best: "target", target: -0.25, hint: "Folding density: moderate is best" },
  { key: "mfe5", label: "5_MFE (first 50 nt)", group: "structure", fmt: p1, best: "high", hint: "MFE of the 5′ end – less negative = more accessible" },
  { key: "mfeStart", label: "Start-codon MFE", group: "structure", fmt: p1, best: "high", hint: "MFE of the region around the AUG" },
  { key: "cai", label: "CAI", group: "codon", fmt: p3, best: "high", hint: "Codon Adaptation Index vs host" },
  { key: "kozak", label: "Initiation context", group: "codon", fmt: p2, best: "high", hint: "Kozak (eukaryotes) / Shine-Dalgarno (E. coli)" },
  { key: "uorfs", label: "uORFs (5′ ATG)", group: "features", fmt: int, best: "low", hint: "Upstream start codons" },
  { key: "are", label: "ATTTA (ARE)", group: "features", fmt: int, best: "low", hint: "AU-rich decay motifs" },
  { key: "cryptPas", label: "Cryptic polyA in CDS", group: "features", fmt: int, best: "low", hint: "AATAAA/ATTAAA inside the CDS" },
  { key: "upa", label: "UpA %", group: "features", fmt: p1, best: "low", hint: "UA dinucleotide frequency (RNase-sensitive)" },
  { key: "rareClusters", label: "Rare-codon clusters", group: "features", fmt: int, best: "low", hint: "≥3 consecutive rare codons" },
  { key: "homopolymers", label: "Homopolymers", group: "features", fmt: int, best: "low", hint: "Long single-base runs" },
  { key: "stability", label: "Stability score", group: "scores", fmt: p1, best: "high", hint: "Heuristic 0–100" },
  { key: "translation", label: "Translation score", group: "scores", fmt: p1, best: "high", hint: "Heuristic 0–100" },
  { key: "overall", label: "Overall score", group: "scores", fmt: p1, best: "high", hint: "Mean of stability and translation" },
];

/** Index (or indices) of the best value for a row; null when not comparable. */
export function bestIndex(def: ParamDef, values: number[]): number | null {
  if (def.best === "none" || values.length < 2) return null;
  const ok = values.map((v, i) => ({ v, i })).filter((x) => isFinite(x.v));
  if (!ok.length) return null;
  const score = (v: number) =>
    def.best === "high" ? v : def.best === "low" ? -v : -Math.abs(v - (def.target ?? 0));
  ok.sort((a, b) => score(b.v) - score(a.v));
  if (ok.length > 1 && score(ok[0].v) === score(ok[1].v)) return null;
  return ok[0].i;
}
