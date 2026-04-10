"use client";

import React, { useState } from "react";
import { Copy, RefreshCw, ArrowRightLeft, FileText, LayoutGrid, Type } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import ToolPageLayout from "@/components/ToolPageLayout";

const AA_MAP: Record<string, { three: string; full: string }> = {
  A: { three: "Ala", full: "Alanine" },
  C: { three: "Cys", full: "Cysteine" },
  D: { three: "Asp", full: "Aspartic Acid" },
  E: { three: "Glu", full: "Glutamic Acid" },
  F: { three: "Phe", full: "Phenylalanine" },
  G: { three: "Gly", full: "Glycine" },
  H: { three: "His", full: "Histidine" },
  I: { three: "Ile", full: "Isoleucine" },
  K: { three: "Lys", full: "Lysine" },
  L: { three: "Leu", full: "Leucine" },
  M: { three: "Met", full: "Methionine" },
  N: { three: "Asn", full: "Asparagine" },
  P: { three: "Pro", full: "Proline" },
  Q: { three: "Gln", full: "Glutamine" },
  R: { three: "Arg", full: "Arginine" },
  S: { three: "Ser", full: "Serine" },
  T: { three: "Thr", full: "Threonine" },
  V: { three: "Val", full: "Valine" },
  W: { three: "Trp", full: "Tryptophan" },
  Y: { three: "Tyr", full: "Tyrosine" },
};

const REVERSE_MAP: Record<string, string> = {};
Object.entries(AA_MAP).forEach(([one, data]) => {
  REVERSE_MAP[data.three.toUpperCase()] = one;
  REVERSE_MAP[data.full.toUpperCase()] = one;
});

export default function AAConverterPage() {
  const [input, setInput] = useState("");
  const [outputFormat, setOutputFormat] = useState<"one" | "three" | "full">("three");
  const [copied, setCopied] = useState(false);

  const convert = (seq: string) => {
    if (!seq) return "";
    
    // Normalize: remove common noise but keep spaces/newlines as separators
    const raw = seq.trim();
    const parts = raw.split(/[\s,\-]+/).filter(Boolean);
    
    // Check if parts look like 3-letter/full names exclusively
    const isMultiCharNotation = parts.length > 0 && parts.every(p => 
        p.length >= 3 && (REVERSE_MAP[p.toUpperCase()] !== undefined)
    );

    let residues: string[] = [];

    if (isMultiCharNotation) {
        // Confirmed 3-letter or full names
        residues = parts.map(p => REVERSE_MAP[p.toUpperCase()] || "?");
    } else {
        // Fallback to 1-letter codes, ignoring any non-AA characters
        const oneLetterString = raw.toUpperCase().replace(/[^A-Z]/g, "");
        residues = oneLetterString.split("");
    }

    if (outputFormat === "one") return residues.join("");
    if (outputFormat === "three") return residues.map(r => AA_MAP[r]?.three || "?").join("-");
    if (outputFormat === "full") return residues.map(r => AA_MAP[r]?.full || "?").join(" ");
    return "";
  };

  const output = convert(input);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200">
      <Navbar />
      <div className="h-16" />
      <ToolPageLayout>
        <main className="max-w-4xl mx-auto p-6 md:p-12">
          <header className="mb-12">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                  <ArrowRightLeft size={24} />
               </div>
               <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">AA Notation Converter</h1>
                  <p className="text-slate-500">Transform protein sequences between single-letter, triple-letter, and full name notations.</p>
               </div>
            </div>
          </header>

          <div className="grid gap-8">
            {/* Input Area */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Input Sequence</label>
                <div className="text-[10px] text-slate-600 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                  Supports mix/one/three/full notations
                </div>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. MKTAY or Met-Lys-Thr-Ala-Tyr..."
                className="w-full h-40 bg-slate-950 border border-slate-800 rounded-2xl p-6 font-mono text-lg focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/5 transition-all"
              />
            </section>

            {/* Controls */}
            <section className="flex flex-wrap items-center gap-4">
                <div className="bg-slate-950 border border-slate-800 p-1.5 rounded-2xl flex gap-2">
                    {[
                        { id: "one", label: "Single", icon: Type },
                        { id: "three", label: "Triple", icon: LayoutGrid },
                        { id: "full", label: "Full Name", icon: FileText }
                    ].map(fmt => (
                        <button
                          key={fmt.id}
                          onClick={() => setOutputFormat(fmt.id as any)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            outputFormat === fmt.id 
                                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" 
                                : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
                          }`}
                        >
                           <fmt.icon size={14} />
                           {fmt.label}
                        </button>
                    ))}
                </div>
                
                <button 
                  onClick={() => setInput("")}
                  className="px-6 py-3 rounded-2xl border border-slate-800 hover:bg-slate-900 text-slate-400 transition-all text-sm font-bold"
                >
                  Clear
                </button>
            </section>

            {/* Output Area */}
            <section className="space-y-4">
               <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Converted Result</label>
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <Copy size={14} />
                  {copied ? "Copied!" : "Copy Result"}
                </button>
              </div>
              <div className="w-full min-h-[160px] bg-slate-900/50 border border-slate-800 rounded-3xl p-8 font-mono text-lg break-all leading-relaxed transition-all">
                 {output || <span className="text-slate-700 italic">Results will appear here...</span>}
              </div>
            </section>
          </div>
        </main>
      </ToolPageLayout>
    </div>
  );
}
