// Codon usage (frequency per thousand codons), approximated from Kazusa-style tables.
// Order of codons below: see CODON_ORDER. Values are approximate and intended for
// relative-adaptiveness (CAI-style) calculations, not as authoritative references.

export const CODON_ORDER = [
  "TTT","TTC","TTA","TTG","CTT","CTC","CTA","CTG","ATT","ATC","ATA","ATG","GTT","GTC","GTA","GTG",
  "TCT","TCC","TCA","TCG","CCT","CCC","CCA","CCG","ACT","ACC","ACA","ACG","GCT","GCC","GCA","GCG",
  "TAT","TAC","TAA","TAG","CAT","CAC","CAA","CAG","AAT","AAC","AAA","AAG","GAT","GAC","GAA","GAG",
  "TGT","TGC","TGA","TGG","CGT","CGC","CGA","CGG","AGT","AGC","AGA","AGG","GGT","GGC","GGA","GGG",
];

export const AA_TABLE = "FFLLLLLLIIIMVVVVSSSSPPPPTTTTAAAAYY**HHQQNNKKDDEECC*WRRRRSSRRGGGG";

export const CODON_TO_AA: Record<string, string> = {};
export const AA_TO_CODONS: Record<string, string[]> = {};
CODON_ORDER.forEach((c, i) => {
  const aa = AA_TABLE[i];
  CODON_TO_AA[c] = aa;
  (AA_TO_CODONS[aa] ||= []).push(c);
});

const raw: Record<string, number[]> = {
  human: [
    17.6,20.3,7.7,12.9,13.2,19.6,7.2,39.6,16.0,20.8,7.5,22.0,11.0,14.5,7.1,28.1,
    15.2,17.7,12.2,4.4,17.5,19.8,16.9,6.9,13.1,18.9,15.1,6.1,18.4,27.7,15.8,7.4,
    12.2,15.3,1.0,0.8,10.9,15.1,12.3,34.2,17.0,19.1,24.4,31.9,21.8,25.1,29.0,39.6,
    10.6,12.6,1.6,13.2,4.5,10.4,6.2,11.4,12.1,19.5,12.2,12.0,10.8,22.2,16.5,16.5,
  ],
  mouse: [
    17.2,21.8,6.7,13.4,13.4,20.3,7.8,39.3,15.5,21.5,7.1,22.3,10.1,14.4,7.1,28.5,
    16.2,17.2,11.8,4.3,18.8,18.1,17.2,6.1,13.3,18.2,15.0,5.2,20.0,25.4,16.0,5.3,
    12.7,16.1,1.0,0.7,11.1,15.1,11.8,34.5,16.9,20.1,22.5,33.8,22.5,24.5,28.4,40.2,
    11.0,12.2,1.3,12.8,4.7,9.1,6.5,10.4,12.2,18.2,11.8,11.7,11.4,20.5,17.0,15.3,
  ],
  ecoli: [
    22.0,16.6,13.9,13.7,11.0,11.0,3.9,52.6,30.4,25.0,4.4,27.8,18.3,15.3,10.9,26.3,
    8.5,8.6,7.2,8.9,7.0,5.5,8.4,23.2,8.9,23.4,7.1,14.4,15.3,25.6,20.2,33.7,
    16.2,12.2,2.0,0.2,12.9,9.7,15.4,28.9,17.7,21.7,33.6,10.3,32.2,19.1,39.4,17.8,
    5.2,6.5,1.0,15.2,20.9,22.0,3.6,5.4,8.8,16.0,2.1,1.2,24.7,29.6,8.0,11.1,
  ],
  yeast: [
    26.1,18.4,26.2,27.2,12.3,5.4,13.4,10.5,30.1,17.2,17.8,20.9,22.1,11.8,11.8,10.8,
    23.5,14.2,18.7,8.6,13.5,6.8,18.3,5.3,20.3,12.7,17.8,8.0,21.2,12.6,16.2,6.2,
    18.8,14.8,1.1,0.5,13.6,7.8,27.3,12.1,35.7,24.8,41.9,30.8,37.6,20.2,45.6,19.2,
    8.1,4.8,0.7,10.4,6.4,2.6,3.0,1.7,14.2,9.8,21.3,9.2,23.9,9.8,10.9,6.0,
  ],
  fly: [
    17.0,23.1,5.2,17.0,11.2,16.3,8.0,42.9,20.3,24.1,8.5,22.4,15.2,17.3,8.0,29.8,
    11.8,18.0,10.5,16.0,10.6,19.0,14.2,17.6,13.5,21.5,12.0,13.9,18.4,29.7,14.3,15.2,
    14.6,18.5,0.8,0.6,11.5,15.0,14.0,33.7,24.0,26.5,17.5,41.5,36.0,26.0,28.0,40.0,
    9.0,13.0,1.0,11.0,9.0,16.0,8.0,9.0,10.0,16.0,5.0,5.0,12.0,26.0,12.0,10.0,
  ],
};

export interface Organism {
  id: string;
  name: string;
  usage: Record<string, number>; // per thousand
  w: Record<string, number>; // relative adaptiveness (CAI weights)
}

const NAMES: Record<string, string> = {
  human: "Homo sapiens (human)",
  mouse: "Mus musculus (mouse)",
  ecoli: "Escherichia coli K-12",
  yeast: "Saccharomyces cerevisiae",
  fly: "Drosophila melanogaster",
};

export const ORGANISMS: Organism[] = Object.keys(raw).map((id) => {
  const usage: Record<string, number> = {};
  CODON_ORDER.forEach((c, i) => (usage[c] = raw[id][i]));
  const w: Record<string, number> = {};
  for (const aa of Object.keys(AA_TO_CODONS)) {
    const max = Math.max(...AA_TO_CODONS[aa].map((c) => usage[c]));
    AA_TO_CODONS[aa].forEach((c) => (w[c] = usage[c] / max));
  }
  return { id, name: NAMES[id], usage, w };
});

export const getOrganism = (id: string) => ORGANISMS.find((o) => o.id === id) ?? ORGANISMS[0];
