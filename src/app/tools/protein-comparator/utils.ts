// utils.ts
export interface UniProtFeature {
  type: string;
  category: string;
  description: string;
  location: { start: { value: number }, end: { value: number } };
}

export interface UniProtData {
  sequence: string;
  subcellularLocations: string[];
  features: UniProtFeature[];
  organism: string;
  gene: string;
  accession?: string;
}

export async function fetchUniProtData(gene: string, species: string): Promise<UniProtData | null> {
  const url = `https://rest.uniprot.org/uniprotkb/search?query=(gene:${gene})+AND+(organism_name:${species})&fields=sequence,ft_helix,ft_strand,ft_turn,ft_topo_dom,ft_transmem,ft_intramem,ft_domain,cc_subcellular_location,ft_mod_res,ft_carbohyd,ft_lipid,ft_crosslnk,ft_disulfid,accession&format=json`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;

    const result = data.results[0];
    const sequence = result.sequence?.value || "";
    const accession = result.primaryAccession;

    // Parse subcellular locations
    const subcellularLocations: string[] = [];
    if (result.comments) {
      const subcellComments = result.comments.filter((c: any) => c.commentType === "SUBCELLULAR LOCATION");
      for (const comment of subcellComments) {
        if (comment.subcellularLocations) {
          for (const loc of comment.subcellularLocations) {
            subcellularLocations.push(loc.location.value);
          }
        }
      }
    }

    const rawFeatures: UniProtFeature[] = result.features || [];
    const features = rawFeatures.map(f => {
      if (f.type === "Topological domain" && f.description) {
        if (f.description.toLowerCase().includes("cytoplasmic")) return { ...f, type: "Cytoplasmic domain" };
        if (f.description.toLowerCase().includes("extracellular") || f.description.toLowerCase().includes("lumenal") || f.description.toLowerCase().includes("periplasmic")) return { ...f, type: "Extracellular domain" };
      }
      return f;
    });

    return {
      sequence,
      subcellularLocations: Array.from(new Set(subcellularLocations)), // unique
      features,
      organism: species,
      gene: gene,
      accession
    };
  } catch (error) {
    console.error("Error fetching from UniProt:", error);
    return null;
  }
}

export const STANDARD_CODE_TABLE: Record<string, string> = {
  ATA: "I", ATC: "I", ATT: "I", ATG: "M",
  ACA: "T", ACC: "T", ACG: "T", ACT: "T",
  AAC: "N", AAT: "N", AAA: "K", AAG: "K",
  AGC: "S", AGT: "S", AGA: "R", AGG: "R",
  CTA: "L", CTC: "L", CTG: "L", CTT: "L",
  CCA: "P", CCC: "P", CCG: "P", CCT: "P",
  CAC: "H", CAT: "H", CAA: "Q", CAG: "Q",
  CGA: "R", CGC: "R", CGG: "R", CGT: "R",
  GTA: "V", GTC: "V", GTG: "V", GTT: "V",
  GCA: "A", GCC: "A", GCG: "A", GCT: "A",
  GAC: "D", GAT: "D", GAA: "E", GAG: "E",
  GGA: "G", GGC: "G", GGG: "G", GGT: "G",
  TCA: "S", TCC: "S", TCG: "S", TCT: "S",
  TTC: "F", TTT: "F", TTA: "L", TTG: "L",
  TAC: "Y", TAT: "Y", TAA: "*", TAG: "*",
  TGC: "C", TGT: "C", TGA: "*", TGG: "W",
};

export function translateCDS(dna: string): string {
  const cleanDna = dna.replace(/[^ATCGU]/gi, "").toUpperCase().replace(/U/g, "T");
  let protein = "";
  for (let i = 0; i < cleanDna.length - 2; i += 3) {
    const codon = cleanDna.substring(i, i + 3);
    protein += STANDARD_CODE_TABLE[codon] || "X";
  }
  // Strip trailing stop codon if present
  if (protein.endsWith("*")) protein = protein.slice(0, -1);
  return protein;
}

// Kyte-Doolittle Hydropathy scale
const HYDROPATHY: Record<string, number> = {
  A: 1.8, R: -4.5, N: -3.5, D: -3.5, C: 2.5, Q: -3.5, E: -3.5, G: -0.4,
  H: -3.2, I: 4.5, L: 3.8, K: -3.9, M: 1.9, F: 2.8, P: -1.6, S: -0.8,
  T: -0.7, W: -0.9, Y: -1.3, V: 4.2
};

// RasMol Colors
const RASMOL_COLORS: Record<string, string> = {
  D: "#E60A0A", E: "#E60A0A", // Red: Acidic
  C: "#E6E600", M: "#E6E600", // Yellow: Sulfur
  K: "#145AFF", R: "#145AFF", // Blue: Basic
  S: "#FA9600", T: "#FA9600", // Orange: Hydroxyl
  F: "#3232AA", Y: "#3232AA", // Dark blue: Aromatic
  N: "#00DCDC", Q: "#00DCDC", // Cyan: Amide
  G: "#EBEBEB",               // Light grey
  L: "#0F820F", V: "#0F820F", I: "#0F820F", // Green: Aliphatic
  A: "#C8C8C8",               // Dark grey
  W: "#B45AB4",               // Purple
  H: "#8282D2",               // Pale blue
  P: "#DC9682",               // Flesh
  X: "#000000",
  '*': "#000000"
};

export function getRasMolColor(aa: string): string {
  return RASMOL_COLORS[aa.toUpperCase()] || "#ffffff";
}

export function getPolarityColor(aa: string): string {
  // Simple polarity color coding
  // Nonpolar: green, Polar: blue, Acidic: red, Basic: blue/purple
  const polar = ["S", "T", "Y", "N", "Q"];
  const nonpolar = ["G", "A", "V", "L", "I", "M", "F", "W", "P", "C"];
  const acidic = ["D", "E"];
  const basic = ["K", "R", "H"];
  
  if (polar.includes(aa.toUpperCase())) return "#3b82f6"; // blue-500
  if (nonpolar.includes(aa.toUpperCase())) return "#10b981"; // emerald-500
  if (acidic.includes(aa.toUpperCase())) return "#ef4444"; // red-500
  if (basic.includes(aa.toUpperCase())) return "#a855f7"; // purple-500
  return "#94a3b8";
}

export function calculateProperties(seq: string) {
  let hydroSum = 0;
  let polarCount = 0;
  let nonpolarCount = 0;
  let charge = 0;

  for (const aa of seq.toUpperCase()) {
    hydroSum += HYDROPATHY[aa] || 0;
    const color = getPolarityColor(aa);
    if (color === "#3b82f6") polarCount++;
    if (color === "#10b981") nonpolarCount++;
    if (color === "#ef4444") charge -= 1;
    if (color === "#a855f7") charge += 1;
  }

  return {
    gravy: seq.length ? (hydroSum / seq.length).toFixed(3) : 0,
    polarPct: seq.length ? ((polarCount / seq.length) * 100).toFixed(1) : 0,
    nonpolarPct: seq.length ? ((nonpolarCount / seq.length) * 100).toFixed(1) : 0,
    charge
  };
}

// Simple Needleman-Wunsch algorithm for global alignment
export function alignSequences(seq1: string, seq2: string): { aligned1: string, aligned2: string, score: number, identity: number } {
  if (!seq1 || !seq2) return { aligned1: seq1, aligned2: seq2, score: 0, identity: 0 };
  
  // For extremely long sequences, NW is O(N*M) and can block the main thread.
  // We'll put a hard limit and just pad if it's too long.
  if (seq1.length * seq2.length > 250000) { // e.g., 500x500
    const maxLen = Math.max(seq1.length, seq2.length);
    let identity = 0;
    for (let i = 0; i < Math.min(seq1.length, seq2.length); i++) {
      if (seq1[i] === seq2[i]) identity++;
    }
    return {
      aligned1: seq1.padEnd(maxLen, "-"),
      aligned2: seq2.padEnd(maxLen, "-"),
      score: 0,
      identity: (identity / maxLen) * 100
    };
  }

  const match = 1;
  const mismatch = -1;
  const gap = -1;

  const matrix: number[][] = [];
  const trace: number[][] = []; // 0: diag, 1: up, 2: left

  for (let i = 0; i <= seq1.length; i++) {
    matrix[i] = [i * gap];
    trace[i] = [1];
  }
  for (let j = 0; j <= seq2.length; j++) {
    matrix[0][j] = j * gap;
    trace[0][j] = 2;
  }
  trace[0][0] = 0;

  for (let i = 1; i <= seq1.length; i++) {
    for (let j = 1; j <= seq2.length; j++) {
      const scoreDiag = matrix[i - 1][j - 1] + (seq1[i - 1] === seq2[j - 1] ? match : mismatch);
      const scoreUp = matrix[i - 1][j] + gap;
      const scoreLeft = matrix[i][j - 1] + gap;

      const maxScore = Math.max(scoreDiag, scoreUp, scoreLeft);
      matrix[i][j] = maxScore;

      if (maxScore === scoreDiag) trace[i][j] = 0;
      else if (maxScore === scoreUp) trace[i][j] = 1;
      else trace[i][j] = 2;
    }
  }

  let aligned1 = "";
  let aligned2 = "";
  let i = seq1.length;
  let j = seq2.length;
  let matches = 0;

  while (i > 0 || j > 0) {
    if (trace[i] && trace[i][j] === 0) {
      aligned1 = seq1[i - 1] + aligned1;
      aligned2 = seq2[j - 1] + aligned2;
      if (seq1[i - 1] === seq2[j - 1]) matches++;
      i--;
      j--;
    } else if (trace[i] && trace[i][j] === 1) {
      aligned1 = seq1[i - 1] + aligned1;
      aligned2 = "-" + aligned2;
      i--;
    } else {
      aligned1 = "-" + aligned1;
      aligned2 = seq2[j - 1] + aligned2;
      j--;
    }
  }

  return {
    aligned1,
    aligned2,
    score: matrix[seq1.length][seq2.length],
    identity: (matches / Math.max(aligned1.length, 1)) * 100
  };
}
