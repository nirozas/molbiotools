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
}

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

  const addAnnotation = useCallback((ann: Omit<Annotation, "id">) => {
    setState((s) => ({
      ...s,
      annotations: [...s.annotations, { ...ann, id: Date.now().toString() }],
    }));
  }, []);

  const removeAnnotation = useCallback((id: string) => {
    setState((s) => ({ ...s, annotations: s.annotations.filter((a) => a.id !== id) }));
  }, []);

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
    setSequence,
    setName,
    setSelection,
    setHoveredAnnotation,
    toggleComplement,
    toggleAminoAcids,
    setNucsPerRow,
    addAnnotation,
    removeAnnotation,
    copyToClipboard,
  };
}
