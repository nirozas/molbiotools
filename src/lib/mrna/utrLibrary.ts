import { foldMFE } from "./fold";

export interface UTR {
  id: string;
  name: string;
  type: 5 | 3;
  organisms: string[]; // organism ids or ["all"]
  seq: string; // DNA alphabet
  kind: "library" | "designed";
  note: string;
}

const MAMMAL = ["human", "mouse"];

/** Curated, literature-derived starting points (verify before use in a construct). */
export const UTR_LIBRARY: UTR[] = [
  { id: "hba1-5", name: "HBA1 α-globin 5′UTR", type: 5, organisms: MAMMAL, kind: "library",
    seq: "CATAAACCCTGGCGCGCTCGCGGCCCGGCACTCTTCTGGTCCCCACAGACTCAGAGAGAACCCACC",
    note: "Human α-globin; widely used for high-expression mRNA." },
  { id: "hbb-5", name: "HBB β-globin 5′UTR", type: 5, organisms: MAMMAL, kind: "library",
    seq: "ACATTTGCTTCTGACACAACTGTGTTCACTAGCAACCTCAAACAGACACC",
    note: "Human β-globin; short, AU-rich, low structure." },
  { id: "vacc-5", name: "α-globin–derived optimized 5′UTR", type: 5, organisms: MAMMAL, kind: "library",
    seq: "GAATAAACTAGTATTCTTCTGGTCCCCACAGACTCAGAGAGAACCCGCCACC",
    note: "Optimized globin-type leader reported for mRNA therapeutics." },
  { id: "kozak-min", name: "Minimal Kozak leader", type: 5, organisms: MAMMAL.concat("fly"), kind: "library",
    seq: "GCCGCCACC", note: "Shortest strong-initiation context." },
  { id: "pet-5", name: "pET lac-operator / RBS leader", type: 5, organisms: ["ecoli"], kind: "library",
    seq: "GGGGAATTGTGAGCGGATAACAATTCCCCTCTAGAAATAATTTTGTTTAACTTTAAGAAGGAGATATACAT",
    note: "Classic E. coli leader with strong Shine-Dalgarno (AAGGAGAT)." },
  { id: "hbb-3", name: "HBB β-globin 3′UTR", type: 3, organisms: MAMMAL, kind: "library",
    seq: "GCTCGCTTTCTTGCTGTCCAATTTCTATTAAAGGTTCCTTTGTTCCCTAAGTCCAACTACTAAACTGGGGGATATTATGAAGGGCCTTGAGCATCTGGATTCTGCCTAATAAAAAACATTTATTTTCATTGC",
    note: "Human β-globin; long half-life element." },
  { id: "hba1-3", name: "HBA1 α-globin 3′UTR", type: 3, organisms: MAMMAL, kind: "library",
    seq: "GCTGGAGCCTCGGTGGCCATGCTTCTTGCCCCTTGGGCCTCCCCCCAGCCCCTCCTCCCCTTCCTGCACCCGTACCCCCGTGGTCTTTGAATAAAGTCTGAGTGGGCGGC",
    note: "Human α-globin; stabilising, strong poly(A) signal." },
  { id: "sv40-3", name: "SV40 late poly(A)", type: 3, organisms: ["human", "mouse", "fly"], kind: "library",
    seq: "AACTTGTTTATTGCAGCTTATAATGGTTACAAATAAAGCAATAGCATCACAAATTTCACAAATAAAGCATTTTTTTCACTGCATTCTAGTTGTGGTTTGTCCAAACTCATCAATGTATCTTA",
    note: "Efficient cleavage/polyadenylation signal." },
  { id: "t7term-3", name: "T7 terminator", type: 3, organisms: ["ecoli"], kind: "library",
    seq: "CTAGCATAACCCCTTGGGGCCTCTAAACGGGTCTTGAGGGGTTTTTTG",
    note: "Rho-independent terminator hairpin; protects 3′ end." },
];

/* ───────── designed UTRs ───────── */

function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r: () => number, s: string) => s[Math.floor(r() * s.length)];
const rand = (r: () => number, n: number, alphabet: string) =>
  Array.from({ length: n }, () => pick(r, alphabet)).join("");

const KOZAK: Record<string, string> = {
  human: "GCCACC", mouse: "GCCACC", fly: "CAAA", yeast: "AAAA", ecoli: "AAGGAGGAAAAAA",
};

export function designUTR5(orgId: string, seed: number): UTR {
  const r = rng(seed * 7919 + 13);
  let best = "", bestE = 1e9;
  for (let t = 0; t < 12; t++) {
    const len = orgId === "ecoli" ? 6 + Math.floor(r() * 6) : 12 + Math.floor(r() * 20);
    // AU/C-rich, G-poor, ATG-free → low structure, strong scanning
    let body = rand(r, len, orgId === "yeast" ? "AAAAACT" : "AACACTTAAG");
    body = body.replace(/ATG/g, "ACG");
    const s = body + KOZAK[orgId ?? "human"];
    const e = foldMFE(s);
    if (e > -2.5) { best = s; bestE = e; break; }
    if (!best || e < bestE) { best = s; bestE = e; }
  }
  return {
    id: `d5-${orgId}-${seed}`, name: `Designed ${orgId} 5′UTR #${seed}`, type: 5, organisms: [orgId],
    kind: "designed", seq: best,
    note: `Rule-based: ATG-free, low-structure (5′ MFE ${bestE.toFixed(1)}), organism-specific initiation context.`,
  };
}

export function designUTR3(orgId: string, seed: number): UTR {
  const r = rng(seed * 104729 + 7);
  let seq: string;
  if (orgId === "ecoli") {
    const stem = rand(r, 8, "GC");
    const rc = stem.split("").reverse().map((c) => (c === "G" ? "C" : "G")).join("");
    seq = "AA" + stem + "TTCG" + rc + "TTTTTTTT";
  } else if (orgId === "yeast") {
    seq = "TAA" + rand(r, 12, "ATTA").replace(/ATTTA/g, "ATATA") + "TTTTTATA" + rand(r, 10, "AAT") + "AATAAA" + rand(r, 12, "AAAT") + "TAAGAAAAA";
  } else {
    seq = rand(r, 14, "CAGC") + "TGA" + rand(r, 10, "CAGCT").replace(/ATTTA/g, "ACTTA") + "GCCCCTCCCC" + rand(r, 12, "CTGC") + "AATAAA" + rand(r, 16, "GTTGT") + "GTGTTT";
  }
  return {
    id: `d3-${orgId}-${seed}`, name: `Designed ${orgId} 3′${orgId === "ecoli" ? "terminator" : "UTR"} #${seed}`,
    type: 3, organisms: [orgId], kind: "designed", seq,
    note: orgId === "ecoli"
      ? "GC-rich hairpin + U-tract rho-independent terminator."
      : "ARE-free spacer + cleavage/polyadenylation signal (AATAAA) + GU-rich downstream element.",
  };
}

export const libraryFor = (orgId: string, type: 5 | 3) =>
  UTR_LIBRARY.filter((u) => u.type === type && (u.organisms.includes(orgId) || u.organisms.includes("all")));
