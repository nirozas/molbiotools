"use client";

import React from "react";
import { useParams } from "next/navigation";
import ToolHost from "@/components/tools/ToolHost";
import Navbar from "@/components/Navbar";
import ToolPageLayout from "@/components/ToolPageLayout";

const TOOL_METADATA: Record<string, { title: string; description: string; category: string }> = {
  "reverse-complement": {
    title: "Reverse Complement",
    description: "Generate the reverse complement of a DNA sequence. A ↔ T, C ↔ G.",
    category: "DNA Tools",
  },
  "gc-content": {
    title: "GC Content Calculator",
    description: "Calculate the percentage of Guanine and Cytosine bases in a DNA/RNA sequence.",
    category: "DNA Tools",
  },
  "transcription": {
    title: "DNA to RNA Transcription",
    description: "Convert a DNA sequence into its corresponding mRNA transcript (T ↔ U).",
    category: "RNA Tools",
  },
  "translation": {
    title: "Protein Translation",
    description: "Translate a nucleotide sequence (DNA) into an amino acid sequence using the standard genetic code.",
    category: "Protein Tools",
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
