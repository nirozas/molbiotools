"use client";

import React from "react";
import { useParams } from "next/navigation";
import ToolHost from "@/components/tools/ToolHost";
import Navbar from "@/components/Navbar";
import ToolPageLayout from "@/components/ToolPageLayout";

const TOOL_METADATA: Record<string, { title: string; description: string; category: string }> = {
  "reverse-complement": {
    title: "Reverse Complement",
    description: "Generate the reverse complement of a DNA sequence. Supports IUPAC codes.",
    category: "DNA Tools",
  },
  "gc-content": {
    title: "GC Content Calculator",
    description: "Calculate the percentage of Guanine and Cytosine bases and show base composition statistics.",
    category: "DNA Tools",
  },
  "sequence-statistics": {
    title: "DNA Stats",
    description: "Generate comprehensive statistics for DNA sequences including base counts and percentages.",
    category: "DNA Tools",
  },
  "transcription": {
    title: "DNA to RNA Transcription",
    description: "Convert a DNA sequence into its corresponding mRNA transcript (T ↔ U).",
    category: "RNA Tools",
  },
  "translation": {
    title: "Protein Translation",
    description: "Translate a nucleotide sequence (DNA) into an amino acid sequence using various genetic codes.",
    category: "Protein Tools",
  },
  "orf-finder": {
    title: "ORF Finder",
    description: "Search for open reading frames (ORFs) in DNA sequences across multiple reading frames.",
    category: "RNA Tools",
  },
  "codon-usage": {
    title: "Codon Usage Table",
    description: "Calculate codon frequency and distribution in DNA sequences.",
    category: "RNA Tools",
  },
  "protein-stats": {
    title: "Protein Stats",
    description: "Calculate molecular weight, isoelectric point, and residue composition for amino acid sequences.",
    category: "Protein Tools",
  },
  "rev-trans": {
    title: "Reverse Translation",
    description: "Convert a protein sequence back into DNA with optimized or consensus codons.",
    category: "Protein Tools",
  },
  "cpg-islands": {
    title: "CpG Islands Finder",
    description: "Identify regions with high frequency of CpG sites as potential CpG islands.",
    category: "DNA Tools",
  },
  "restriction-enzyme-analyzer": {
    title: "Restriction Enzyme Analyzer",
    description: "Find restriction sites in your sequence, formatted in a convenient table.",
    category: "DNA Tools",
  },
  "gene-optimizer": {
    title: "Gene Optimizer & Complexity Checker",
    description: "Evaluate DNA synthesis complexity (repeats, GC extremeness) and perform codon optimization for mammalian and microbial expression plants.",
    category: "DNA Tools",
  },
  "pcr-simulator": {
    title: "In-Silico PCR Simulator",
    description: "Predict PCR amplicons using template DNA and primers with hanging tails. Generates optimized thermocycler programs for various polymerases.",
    category: "DNA Tools",
  },
  "restriction-digest": {
    title: "Restriction Digest & Gel Simulator",
    description: "Simulate a double or single digest and visualize fragment migration on an agarose gel with standard 1kb ladders.",
    category: "DNA Tools",
  },
  "ligation-calculator": {
    title: "Ligation Calculator",
    description: "Optimal insert:vector ratios and mass calculation for standard and custom molar ratios.",
    category: "Lab Calculators",
  },
  "pairwise-alignment": {
    title: "Pairwise Alignment",
    description: "Align two sequences against each other using an optimized Needleman-Wunsch algorithm.",
    category: "Alignment & BLAST",
  },
  "tm-calculator": {
    title: "Tm Calculator",
    description: "Calculate the melting temperature (Tm) of oligonucleotides using the nearest-neighbor thermodynamic model with salt correction.",
    category: "Lab Calculators",
  },
  "ta-calculator": {
    title: "Ta Calculator",
    description: "Calculate the optimal PCR annealing temperature (Ta) for two primers and an insert, accounting for primer Tm and amplicon characteristics.",
    category: "Lab Calculators",
  },
  "molarity-calculator": {
    title: "Molarity Calculator",
    description: "Convert between mass, molecular weight, volume, and concentration (M, mM, µM, nM) for solutions.",
    category: "Lab Calculators",
  },
  "centrifugation-calculator": {
    title: "Centrifugation Calculator",
    description: "Bidirectional conversion between RPM and RCF (×g) using rotor radius. Includes common protocol reference table.",
    category: "Lab Calculators",
  },
  "serial-dilution-planner": {
    title: "Serial Dilution Planner",
    description: "Plan serial dilution series with custom dilution factor, starting concentration, and number of steps.",
    category: "Lab Calculators",
  },
  "unit-converter-biology": {
    title: "Unit Converter (Biology)",
    description: "Convert between biological units: pmol ↔ µg ↔ µM for nucleic acids and proteins using molecular weight.",
    category: "Lab Calculators",
  },
  "coding-capacity": {
    title: "Coding Capacity of DNA",
    description: "Bidirectional calculator: convert between DNA coding length (bp), protein length (amino acids), and protein size (kDa).",
    category: "Lab Calculators",
  },
  "buffer-calculator": {
    title: "Buffer Calculator",
    description: "Calculate the required quantities of acid and base to achieve a desired pH using the Henderson-Hasselbalch equation.",
    category: "Lab Calculators",
  },
  "od600-cell-density": {
    title: "OD600 Cell Density Estimator",
    description: "Estimate cell density (cells/mL) from OD600 measurements for common organisms like E. coli and yeast.",
    category: "Lab Calculators",
  },
};

export default function RunToolPage() {
  const { toolId } = useParams();
  const metadata = TOOL_METADATA[toolId as string] || {
    title: (toolId as string).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: "Bioinformatics analysis utility.",
    category: "Generic Tools",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar />
      <div style={{ height: "64px", flexShrink: 0 }} />
      <ToolPageLayout>
        <ToolHost 
          toolId={toolId as string} 
          title={metadata.title} 
          description={metadata.description} 
          category={metadata.category} 
        />
      </ToolPageLayout>
    </div>
  );
}
