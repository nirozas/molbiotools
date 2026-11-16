export interface OrganismOption {
  id: string; // UniProt taxid or "any"
  name: string;
  ensembl: string;
}

export const WB_ORGANISMS: OrganismOption[] = [
  { id: "9606", name: "Human (Homo sapiens)", ensembl: "homo_sapiens" },
  { id: "10090", name: "Mouse (Mus musculus)", ensembl: "mus_musculus" },
  { id: "10116", name: "Rat (Rattus norvegicus)", ensembl: "rattus_norvegicus" },
  { id: "7955", name: "Zebrafish (Danio rerio)", ensembl: "danio_rerio" },
  { id: "7227", name: "Fruit fly (Drosophila melanogaster)", ensembl: "drosophila_melanogaster" },
  { id: "6239", name: "C. elegans", ensembl: "caenorhabditis_elegans" },
  { id: "559292", name: "Yeast (S. cerevisiae)", ensembl: "saccharomyces_cerevisiae" },
  { id: "83333", name: "E. coli K-12", ensembl: "escherichia_coli" },
  { id: "3702", name: "Arabidopsis thaliana", ensembl: "arabidopsis_thaliana" },
  { id: "9031", name: "Chicken (Gallus gallus)", ensembl: "gallus_gallus" },
  { id: "any", name: "Any / Auto-detect", ensembl: "" },
  { id: "custom", name: "Custom organism name / taxID…", ensembl: "" },
];

export const PROTEIN_COLORS = [
  "#22d3ee", // Cyan
  "#f43f5e", // Rose
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#a78bfa", // Violet
  "#ec4899", // Pink
];

export interface TagOption {
  id: string;
  label: string;
  kDa: number;
}

export const TAGS: TagOption[] = [
  { id: "none", label: "No tag (native)", kDa: 0 },
  { id: "his6", label: "6×His (+0.84 kDa)", kDa: 0.84 },
  { id: "flag", label: "FLAG (+1.01 kDa)", kDa: 1.01 },
  { id: "ha", label: "HA (+1.10 kDa)", kDa: 1.1 },
  { id: "myc", label: "c-Myc (+1.20 kDa)", kDa: 1.2 },
  { id: "v5", label: "V5 (+1.42 kDa)", kDa: 1.42 },
  { id: "3xflag", label: "3×FLAG (+2.73 kDa)", kDa: 2.73 },
  { id: "gst", label: "GST (+26.0 kDa)", kDa: 26.0 },
  { id: "mcherry", label: "mCherry (+26.7 kDa)", kDa: 26.7 },
  { id: "egfp", label: "EGFP (+26.9 kDa)", kDa: 26.9 },
  { id: "mbp", label: "MBP (+42.5 kDa)", kDa: 42.5 },
];

// Average residue molecular weights (Da, monoisotopic/average IUPAC)
const AA_MASS: Record<string, number> = {
  A: 71.0788, R: 156.1875, N: 114.1038, D: 115.0886, C: 103.1388,
  E: 129.1155, Q: 128.1307, G: 57.0519, H: 137.1411, I: 113.1594,
  L: 113.1594, K: 128.1741, M: 131.1926, F: 147.1766, P: 97.1167,
  S: 87.0782, T: 101.1051, W: 186.2132, Y: 163.176, V: 99.1326,
  U: 150.0388, O: 237.3018, X: 110.0, B: 114.5962, Z: 128.6231,
};

export function cleanProteinSeq(raw: string): string {
  return raw
    .replace(/^>.*$/gm, "")
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase();
}

export function calcMwKda(aaSeq: string): number {
  const s = cleanProteinSeq(aaSeq);
  if (!s.length) return 0;
  let da = 18.01528; // H2O termini
  for (const ch of s) da += AA_MASS[ch] ?? 110.0;
  return da / 1000;
}

const PKA_POS: Record<string, number> = { K: 10.8, R: 12.5, H: 6.5 };
const PKA_NEG: Record<string, number> = { D: 3.9, E: 4.1, C: 8.5, Y: 10.1 };

export function calcTheoreticalPI(aaSeq: string): number {
  const s = cleanProteinSeq(aaSeq);
  if (!s.length) return 7;
  const counts: Record<string, number> = {};
  for (const ch of s) counts[ch] = (counts[ch] ?? 0) + 1;

  const netCharge = (ph: number) => {
    let q = 1 / (1 + Math.pow(10, ph - 8.6)) - 1 / (1 + Math.pow(10, 3.6 - ph));
    for (const [aa, pk] of Object.entries(PKA_POS)) {
      if (counts[aa]) q += counts[aa] / (1 + Math.pow(10, ph - pk));
    }
    for (const [aa, pk] of Object.entries(PKA_NEG)) {
      if (counts[aa]) q -= counts[aa] / (1 + Math.pow(10, pk - ph));
    }
    return q;
  };

  let lo = 0, hi = 14;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (netCharge(mid) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function countNGlycoSites(aaSeq: string): number {
  const s = cleanProteinSeq(aaSeq);
  let n = 0;
  for (let i = 0; i + 2 < s.length; i++) {
    if (s[i] === "N" && s[i + 1] !== "P" && (s[i + 2] === "S" || s[i + 2] === "T")) n++;
  }
  return n;
}

export interface CleavedChain {
  label: string;
  start: number;
  end: number;
  mwKda: number;
}

export interface ResolvedProtein {
  name: string;
  accession: string;
  organism: string;
  sequence: string;
  length: number;
  mwKda: number;
  pI: number;
  nGlyco: number;
  chains: CleavedChain[];
  source: "UniProt" | "Ensembl" | "Sequence";
}

interface UniProtFeatureJson {
  type?: string;
  description?: string;
  location?: { start?: { value?: number }; end?: { value?: number } };
}

interface UniProtEntryJson {
  primaryAccession?: string;
  uniProtkbId?: string;
  organism?: { scientificName?: string; commonName?: string };
  proteinDescription?: {
    recommendedName?: { fullName?: { value?: string } };
    submissionNames?: { fullName?: { value?: string } }[];
  };
  genes?: { geneName?: { value?: string } }[];
  sequence?: { value?: string; length?: number; molWeight?: number };
  features?: UniProtFeatureJson[];
}

function parseUniProtEntry(entry: UniProtEntryJson, fallbackName: string): ResolvedProtein | null {
  const seq = entry.sequence?.value ?? "";
  if (!seq) return null;
  const gene = entry.genes?.[0]?.geneName?.value;
  const pname =
    entry.proteinDescription?.recommendedName?.fullName?.value ??
    entry.proteinDescription?.submissionNames?.[0]?.fullName?.value;
  const org = entry.organism?.scientificName ?? entry.organism?.commonName ?? "Unknown";
  const mwKda = entry.sequence?.molWeight ? entry.sequence.molWeight / 1000 : calcMwKda(seq);

  const chains: CleavedChain[] = [];
  for (const f of entry.features ?? []) {
    if (f.type !== "Chain" && f.type !== "Peptide") continue;
    const s = f.location?.start?.value;
    const e = f.location?.end?.value;
    if (!s || !e || s < 1 || e > seq.length) continue;
    // Only record sub-fragments noticeably different from full-length (>3 kDa or >15 aa shorter)
    if (seq.length - (e - s + 1) < 15) continue;
    const sub = seq.slice(s - 1, e);
    const cmw = calcMwKda(sub);
    if (cmw >= 3) {
      chains.push({
        label: f.description || `${f.type} (${s}–${e})`,
        start: s,
        end: e,
        mwKda: cmw,
      });
    }
  }

  return {
    name: gene || pname || entry.uniProtkbId || fallbackName,
    accession: entry.primaryAccession || entry.uniProtkbId || fallbackName,
    organism: org,
    sequence: seq,
    length: seq.length,
    mwKda,
    pI: calcTheoreticalPI(seq),
    nGlyco: countNGlycoSites(seq),
    chains: chains.slice(0, 4),
    source: "UniProt",
  };
}

const FIELDS = "accession,id,gene_primary,protein_name,organism_name,sequence,ft_chain,ft_peptide";

async function searchUniProt(query: string): Promise<UniProtEntryJson | null> {
  const url = `https://rest.uniprot.org/uniprotkb/search?query=${encodeURIComponent(query)}&fields=${FIELDS}&size=3&format=json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.results?.[0] ?? null;
}

function orgClause(organismId: string, customOrg: string): string {
  if (organismId === "any") return "";
  if (organismId === "custom") {
    const c = customOrg.trim();
    if (!c) return "";
    return /^\d+$/.test(c) ? `(organism_id:${c})` : `(organism_name:"${c}")`;
  }
  return `(organism_id:${organismId})`;
}

async function resolveFromEnsembl(id: string): Promise<ResolvedProtein | null> {
  const clean = id.trim().toUpperCase();
  if (clean.startsWith("ENSP")) {
    const res = await fetch(`https://rest.ensembl.org/sequence/id/${clean}?type=protein`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const d = await res.json();
    if (!d.seq) return null;
    return {
      name: clean,
      accession: clean,
      organism: "Ensembl",
      sequence: d.seq,
      length: d.seq.length,
      mwKda: calcMwKda(d.seq),
      pI: calcTheoreticalPI(d.seq),
      nGlyco: countNGlycoSites(d.seq),
      chains: [],
      source: "Ensembl",
    };
  }
  const res = await fetch(`https://rest.ensembl.org/lookup/id/${clean}?expand=1`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const d = await res.json();
  let trId: string | undefined;
  if (d.Translation?.id) trId = d.Translation.id;
  else if (Array.isArray(d.Transcript)) {
    const tr = d.Transcript.find((t: { is_canonical?: number; Translation?: { id?: string } }) => t.is_canonical && t.Translation?.id)
      ?? d.Transcript.find((t: { Translation?: { id?: string } }) => t.Translation?.id);
    trId = tr?.Translation?.id;
  }
  if (!trId) return null;
  const seqRes = await fetch(`https://rest.ensembl.org/sequence/id/${trId}?type=protein`, {
    headers: { Accept: "application/json" },
  });
  if (!seqRes.ok) return null;
  const sd = await seqRes.json();
  if (!sd.seq) return null;
  return {
    name: d.display_name || clean,
    accession: trId,
    organism: (d.species || "Ensembl").replace(/_/g, " "),
    sequence: sd.seq,
    length: sd.seq.length,
    mwKda: calcMwKda(sd.seq),
    pI: calcTheoreticalPI(sd.seq),
    nGlyco: countNGlycoSites(sd.seq),
    chains: [],
    source: "Ensembl",
  };
}

/** Resolve Gene name, Gene ID, UniProt, Ensembl, RefSeq, or other identifier + organism. */
export async function lookupProtein(
  rawId: string,
  organismId: string,
  customOrg = "",
): Promise<ResolvedProtein> {
  const id = rawId.trim();
  if (!id) throw new Error("Enter a gene name or identifier.");

  // 1. Direct UniProt accession or entry name (e.g. P04637, P53_HUMAN)
  const isUniProtAcc = /^([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2})$/i.test(id);
  const isEntryName = /^[A-Z0-9]+_[A-Z0-9]+$/i.test(id);
  if (isUniProtAcc || isEntryName) {
    const r = await fetch(`https://rest.uniprot.org/uniprotkb/${encodeURIComponent(id)}.json`);
    if (r.ok) {
      const parsed = parseUniProtEntry(await r.json(), id);
      if (parsed) return parsed;
    }
  }

  // 2. Ensembl IDs (ENSG / ENST / ENSP)
  if (/^ENS[A-Z]*[GTP]\d+/i.test(id)) {
    const oc = orgClause(organismId, customOrg);
    const xrefHit = await searchUniProt(oc ? `(xref:ensembl-${id}) AND ${oc}` : `(xref:ensembl-${id})`).catch(() => null);
    if (xrefHit) {
      const parsed = parseUniProtEntry(xrefHit, id);
      if (parsed) return parsed;
    }
    const ens = await resolveFromEnsembl(id).catch(() => null);
    if (ens) return ens;
  }

  // 3. NCBI Gene ID (numeric) or RefSeq (NP_/XP_/NM_/XM_)
  const oc = orgClause(organismId, customOrg);
  if (/^\d+$/.test(id)) {
    const q = oc ? `((xref:geneid-${id}) OR ${id}) AND ${oc}` : `(xref:geneid-${id})`;
    const hit = (await searchUniProt(`${q} AND (reviewed:true)`)) ?? (await searchUniProt(q));
    const parsed = hit && parseUniProtEntry(hit, id);
    if (parsed) return parsed;
  }

  if (/^([NXW]P_|[NX][MR]_)\d+/i.test(id)) {
    const q = `(xref:refseq-${id}) OR (${id})`;
    const hit = (await searchUniProt(oc ? `(${q}) AND ${oc}` : q)) ?? (await searchUniProt(q));
    const parsed = hit && parseUniProtEntry(hit, id);
    if (parsed) return parsed;
  }

  // 4. Gene symbol / general identifier + Organism (prefer exact reviewed Swiss-Prot match)
  const qExact = oc ? `(gene_exact:${id}) AND ${oc}` : `(gene_exact:${id})`;
  const qBroad = oc ? `(${id}) AND ${oc}` : `(${id})`;
  const hit =
    (await searchUniProt(`${qExact} AND (reviewed:true)`)) ??
    (await searchUniProt(qExact)) ??
    (await searchUniProt(`${qBroad} AND (reviewed:true)`)) ??
    (await searchUniProt(qBroad));

  const parsed = hit && parseUniProtEntry(hit, id);
  if (parsed) return parsed;

  throw new Error(`No protein found for "${id}"${oc ? " in the selected organism" : ""}. Try a UniProt ID or paste the AA sequence.`);
}
