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
};

export default function RunToolPage() {
  const { toolId } = useParams();
  const metadata = TOOL_METADATA[toolId as string] || {
    title: (toolId as string).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: "Bioinformatics analysis utility. (Mock / Not yet established)",
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
