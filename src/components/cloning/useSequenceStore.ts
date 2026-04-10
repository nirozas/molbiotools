import { useState, useCallback, useMemo } from "react";

export interface Annotation {
  id: string;
  label: string;
  start: number; // 0-indexed, inclusive
  end: number;   // 0-indexed, inclusive
  color: string;
  strand: "+" | "-" | "both";
  type: "gene" | "promoter" | "primer" | "restriction" | "cds" | "misc";
}

export interface SelectionRange {
  start: number;
  end: number;
}

export interface SequenceState {
  sequence: string;
  name: string;
  circular: boolean;
  annotations: Annotation[];
  selection: SelectionRange | null;
  hoveredAnnotation: string | null;
  showComplement: boolean;
  showAminoAcids: boolean;
  nucsPerRow: number;
  searchQuery: string;
  translationMode: 'off' | 'auto' | 'manual';
  manualTranslationStart: number | null;
}

const AA_COLORS: Record<string, string> = {
  // Acidic
  'D': '#ef4444', 'E': '#ef4444',
  // Basic
  'K': '#3b82f6', 'R': '#3b82f6', 'H': '#3b82f6',
  // Polar
  'S': '#ec4899', 'T': '#ec4899', 'N': '#ec4899', 'Q': '#ec4899',
  // Hydrophobic
  'A': '#94a3b8', 'V': '#94a3b8', 'L': '#94a3b8', 'I': '#94a3b8', 'M': '#10b981', 'F': '#fbbf24', 'W': '#fbbf24', 'P': '#fbbf24',
  'C': '#facc15', 'G': '#94a3b8',
  // Stop
  '_': '#dc2626',
};

const COMMON_ENZYMES = [
  { name: "EcoRI", site: "GAATTC", color: "#ef4444" },
  { name: "BamHI", site: "GGATCC", color: "#3b82f6" },
  { name: "HindIII", site: "AAGCTT", color: "#10b981" },
  { name: "XhoI", site: "CTCGAG", color: "#8b5cf6" },
  { name: "NotI", site: "GCGGCCGC", color: "#f43f5e" },
  { name: "PstI", site: "CTGCAG", color: "#00d4ff" },
  { name: "SalI", site: "GTCGAC", color: "#10b981" },
  { name: "SmaI", site: "CCCGGG", color: "#f59e0b" },
];

const GENETIC_CODE: Record<string, string> = {
  ATA: 'I', ATC: 'I', ATT: 'I', ATG: 'M',
  ACA: 'T', ACC: 'T', ACG: 'T', ACT: 'T',
  AAC: 'N', AAT: 'N', AAA: 'K', AAG: 'K',
  AGC: 'S', AGT: 'S', AGA: 'R', AGG: 'R',
  CTA: 'L', CTC: 'L', CTG: 'L', CTT: 'L',
  CCA: 'P', CCC: 'P', CCG: 'P', CCT: 'P',
  CAC: 'H', CAT: 'H', CAA: 'Q', CAG: 'Q',
  CGA: 'R', CGC: 'R', CGG: 'R', CGT: 'R',
  GTA: 'V', GTC: 'V', GTG: 'V', GTT: 'V',
  GCA: 'A', GCC: 'A', GCG: 'A', GCT: 'A',
  GAC: 'D', GAT: 'D', GAA: 'E', GAG: 'E',
  GGA: 'G', GGC: 'G', GGG: 'G', GGT: 'G',
  TCA: 'S', TCC: 'S', TCG: 'S', TCT: 'S',
  TTC: 'F', TTT: 'F', TTA: 'L', TTG: 'L',
  TAC: 'Y', TAT: 'Y', TAA: '_', TAG: '_',
  TGC: 'C', TGT: 'C', TGA: '_', TGG: 'W',
};

const COMPLEMENT_MAP: Record<string, string> = {
  A: "T", T: "A", G: "C", C: "G",
  a: "t", t: "a", g: "c", c: "g",
  N: "N", n: "n", R: "Y", Y: "R",
  "-": "-",
};

const DEMO_SEQUENCE =
  "ATGAAAGCAATTTTCGTACTGAAAGGTTTTGTTGGTTTTTTAATCAGTTTTTTAATCAGTTTTAATCAGTTTAAA" +
  "GTTTTAATCAGTTTTAATCAGTTTTAATCAGTTTAAAGTTTTAATCAGTTTTAATCAGTTTTAATCAGTTTAAA" +
  "GCAATTTTCGTACTGAAAGGTTTTGTTGGTTTTTTAATCAGTTTTTTAATCAGTTTTAATCAGTTTAAAGTTTT" +
  "AATCAGTTTTAATCAGTTTTAATCAGTTTAAAGCAATTTTCGTACTGAAAGGTTTTGTTGGTTTTTTAATCAGTT" +
  "TTTTAATCAGTTTTAATCAGTTTAAAGTTTTAATCAGTTTTAATCAGTTTTAATCAGTTTAAAGCAATTTTCGTA" +
  "CTGAAAGGTTTTGTTGGTTTTTTAATCAGTTTTTTAATCAGTTTTAATCAGTTTAAAGTTTTAATCAGTTTTAATC" +
  "AGTTTTAATCAGTTTAAATGA";

const DEMO_ANNOTATIONS: Annotation[] = [
  { id: "1", label: "Start Codon", start: 0, end: 2, color: "#10b981", strand: "+", type: "misc" },
  { id: "2", label: "Signal Peptide", start: 0, end: 71, color: "#00d4ff", strand: "+", type: "cds" },
  { id: "3", label: "Repeat Region A", start: 72, end: 145, color: "#f59e0b", strand: "+", type: "gene" },
  { id: "4", label: "Promoter -35", start: 200, end: 230, color: "#ec4899", strand: "-", type: "promoter" },
  { id: "5", label: "EcoRI Site", start: 310, end: 315, color: "#8b5cf6", strand: "both", type: "restriction" },
  { id: "6", label: "Stop Codon", start: DEMO_SEQUENCE.length - 3, end: DEMO_SEQUENCE.length - 1, color: "#f43f5e", strand: "+", type: "misc" },
];

export function useSequenceStore() {
  const [state, setState] = useState<SequenceState>({
    sequence: DEMO_SEQUENCE,
    name: "pUC19-demo",
    circular: false,
    annotations: DEMO_ANNOTATIONS,
    selection: null,
    hoveredAnnotation: null,
    showComplement: true,
    showAminoAcids: false,
    nucsPerRow: 60,
    searchQuery: "",
    translationMode: 'off',
    manualTranslationStart: null,
  });

  const setSequence = useCallback((seq: string) => {
    setState((s) => ({ ...s, sequence: seq.toUpperCase().replace(/[^ATGCNRYSWKMBDHV\-]/gi, "N") }));
  }, []);

  const setName = useCallback((name: string) => {
    setState((s) => ({ ...s, name }));
  }, []);

  const setSelection = useCallback((sel: SelectionRange | null) => {
    setState((s) => ({ ...s, selection: sel }));
  }, []);

  const setHoveredAnnotation = useCallback((id: string | null) => {
    setState((s) => ({ ...s, hoveredAnnotation: id }));
  }, []);

  const toggleComplement = useCallback(() => {
    setState((s) => ({ ...s, showComplement: !s.showComplement }));
  }, []);

  const toggleAminoAcids = useCallback(() => {
    setState((s) => ({ ...s, showAminoAcids: !s.showAminoAcids }));
  }, []);

  const setNucsPerRow = useCallback((n: number) => {
    setState((s) => ({ ...s, nucsPerRow: n }));
  }, []);

  const toggleCircular = useCallback(() => {
    setState((s) => ({ ...s, circular: !s.circular }));
  }, []);

  const importSequence = useCallback((name: string, seq: string) => {
    const cleanSeq = seq.toUpperCase().replace(/[^ATGCNRYSWKMBDHV\-]/gi, "N");
    setState((s) => ({
      ...s,
      name,
      sequence: cleanSeq,
      annotations: [],
      selection: null
    }));
  }, []);

  const setSearchQuery = useCallback((q: string) => {
    setState(s => ({ ...s, searchQuery: q.toUpperCase() }));
  }, []);

  const setTranslationMode = useCallback((mode: 'off' | 'auto' | 'manual') => {
    setState(s => ({ ...s, translationMode: mode, showAminoAcids: mode !== 'off' }));
  }, [state.showAminoAcids]);

  const setManualTranslationStart = useCallback((start: number | null) => {
    setState(s => ({ ...s, manualTranslationStart: start }));
  }, []);

  const orfTranslations = useMemo(() => {
    if (state.translationMode === 'off') return [];
    
    if (state.translationMode === 'manual' && state.manualTranslationStart !== null) {
        let aa: string[] = [];
        for (let j = state.manualTranslationStart; j < state.sequence.length - 2; j += 3) {
            const codon = state.sequence.substring(j, j + 3);
            const res = GENETIC_CODE[codon] || "X";
            aa.push(res);
            if (res === "_") break;
        }
        return [{ start: state.manualTranslationStart, end: state.manualTranslationStart + aa.length * 3 - 1, aa }];
    }

    if (state.translationMode === 'auto') {
        const orfs: { start: number; end: number; aa: string[] }[] = [];
        let i = 0;
        while (i < state.sequence.length - 2) {
          if (state.sequence.substring(i, i + 3) === "ATG") {
            let currentOrf = "";
            let j = i;
            while (j < state.sequence.length - 2) {
              const codon = state.sequence.substring(j, j + 3);
              const aa = GENETIC_CODE[codon] || "X";
              currentOrf += aa;
              if (aa === "_") break;
              j += 3;
            }
            orfs.push({ 
              start: i, 
              end: Math.min(j + 2, state.sequence.length - 1), 
              aa: currentOrf.split("") 
            });
            i = j + 3;
          } else {
            i++;
          }
        }
        return orfs;
    }
    return [];
  }, [state.sequence, state.translationMode, state.manualTranslationStart]);

  const findRestrictionSites = useCallback(() => {
    const newAnns: Annotation[] = [];
    COMMON_ENZYMES.forEach(enz => {
      let pos = state.sequence.indexOf(enz.site);
      while (pos !== -1) {
        newAnns.push({
          id: `enz-${enz.name}-${pos}`,
          label: enz.name,
          start: pos,
          end: pos + enz.site.length - 1,
          color: enz.color,
          strand: "both",
          type: "restriction"
        });
        pos = state.sequence.indexOf(enz.site, pos + 1);
      }
    });
    setState(s => ({ ...s, annotations: [...s.annotations, ...newAnns] }));
  }, [state.sequence, state.annotations]);

  const translateRange = useCallback((start: number, end: number) => {
    const seq = state.sequence.slice(start, end + 1);
    let aa = "";
    for (let i = 0; i < seq.length - 2; i += 3) {
      const codon = seq.substring(i, i + 3);
      aa += GENETIC_CODE[codon] || "X";
    }
    return aa;
  }, [state.sequence]);

  const addAnnotation = useCallback((ann: Omit<Annotation, "id">) => {
    setState((s) => ({
      ...s,
      annotations: [...s.annotations, { ...ann, id: Date.now().toString() }],
    }));
  }, []);

  const removeAnnotation = useCallback((id: string) => {
    setState((s) => ({ ...s, annotations: s.annotations.filter((a) => a.id !== id) }));
  }, []);

  const gcContent = useMemo(() => {
    const gc = (state.sequence.match(/[GC]/g) || []).length;
    return (gc / state.sequence.length * 100).toFixed(1);
  }, [state.sequence]);

  const complement = useMemo(
    () => state.sequence.split("").map((n) => COMPLEMENT_MAP[n] ?? "N").join(""),
    [state.sequence]
  );

  const reverseComplement = useMemo(
    () => complement.split("").reverse().join(""),
    [complement]
  );

  const selectedSequence = useMemo(() => {
    if (!state.selection) return "";
    return state.sequence.slice(state.selection.start, state.selection.end + 1);
  }, [state.sequence, state.selection]);

  const selectedComplement = useMemo(() => {
    if (!state.selection) return "";
    return complement.slice(state.selection.start, state.selection.end + 1);
  }, [complement, state.selection]);

  const copyToClipboard = useCallback(
    (text: string) => navigator.clipboard.writeText(text),
    []
  );

  return {
    ...state,
    complement,
    reverseComplement,
    selectedSequence,
    selectedComplement,
    gcContent,
    setSequence,
    setName,
    setSelection,
    setHoveredAnnotation,
    toggleComplement,
    toggleAminoAcids,
    setNucsPerRow,
    toggleCircular,
    importSequence,
    findRestrictionSites,
    translateRange,
    setSearchQuery,
    setTranslationMode,
    setManualTranslationStart,
    addAnnotation,
    removeAnnotation,
    copyToClipboard,
    orfTranslations,
    AA_COLORS,
  };
}
