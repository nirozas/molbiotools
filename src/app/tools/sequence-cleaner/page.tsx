"use client";

import React, { useState, useEffect } from "react";
import { Scissors, Copy, CheckCircle2, RotateCcw, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function SequenceCleaner() {
  const [dirtyInput, setDirtyInput] = useState<string>("");
  const [cleanOutput, setCleanOutput] = useState<string>("");
  const [formatMode, setFormatMode] = useState<"raw" | "fasta" | "blocks">("blocks");
  const [seqType, setSeqType] = useState<"dna" | "rna" | "protein" | "auto">("auto");
  const [fastaHeader, setFastaHeader] = useState<string>(">Sequence_1");
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ length: 0, removed: 0 });

  useEffect(() => {
    if (!dirtyInput) {
      setCleanOutput("");
      setStats({ length: 0, removed: 0 });
      return;
    }

    // Determine what to strip based on seqType
    let validCharsRegex = /[^A-Za-z]/g; // Default: strip anything not a letter
    if (seqType === "dna") validCharsRegex = /[^ATCGatcgNn]/g;
    else if (seqType === "rna") validCharsRegex = /[^AUGCaugcNn]/g;
    
    // Auto-detect if "auto" is selected (very rudimentary check)
    let appliedRegex = validCharsRegex;
    if (seqType === "auto") {
      // If it has mostly ATCG, assume DNA. This is a simple fallback, so we'll just allow all letters
      appliedRegex = /[^A-Za-z]/g; 
    }

    const originalLength = dirtyInput.length;
    let cleaned = dirtyInput.replace(appliedRegex, "").toUpperCase();
    
    setStats({
      length: cleaned.length,
      removed: originalLength - cleaned.length
    });

    if (formatMode === "raw") {
      setCleanOutput(cleaned);
    } else if (formatMode === "fasta") {
      // FASTA is 80 chars per line usually
      const lines = [];
      for (let i = 0; i < cleaned.length; i += 80) {
        lines.push(cleaned.substring(i, i + 80));
      }
      setCleanOutput(`${fastaHeader}\n${lines.join("\n")}`);
    } else if (formatMode === "blocks") {
      // Blocks of 10, lines of 60
      let formatted = "";
      for (let i = 0; i < cleaned.length; i++) {
        formatted += cleaned[i];
        if ((i + 1) % 10 === 0 && (i + 1) % 60 !== 0 && i !== cleaned.length - 1) {
          formatted += " ";
        }
        if ((i + 1) % 60 === 0 && i !== cleaned.length - 1) {
          formatted += "\n";
        }
      }
      setCleanOutput(formatted);
    }

  }, [dirtyInput, formatMode, seqType, fastaHeader]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center py-10 px-4 md:px-8">
      <div className="w-full max-w-5xl mb-8">
        <Link href="/tools/dna" className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 mb-4 transition-colors">
          <ChevronLeft size={16} className="mr-1" /> Back to DNA Tools
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
          <Scissors className="mr-3 text-emerald-400" size={32} />
          Sequence Cleaner & Formatter
        </h1>
        <p className="text-slate-400">
          Paste messy sequences copied from PDFs, GenBank, or Word documents. This tool instantly strips numbers, spaces, and invisible characters, outputting clean formatting ready for downstream analysis.
        </p>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Input Area */}
        <div className="flex flex-col h-[500px]">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Raw Input (Dirty)</h2>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500">Molecule:</span>
              <select 
                value={seqType} 
                onChange={e => setSeqType(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded px-2 py-1 outline-none"
              >
                <option value="auto">Auto (Any Letters)</option>
                <option value="dna">DNA (ATCGN)</option>
                <option value="rna">RNA (AUGCN)</option>
              </select>
            </div>
          </div>
          <textarea
            value={dirtyInput}
            onChange={(e) => setDirtyInput(e.target.value)}
            className="w-full flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-400 font-mono text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            placeholder="Paste your messy sequence here...
            
Example:
1 atgcgtcgaa 11 tcgatcgatc 21 gctagctagc
31 tcgatcgatc 41 gctagctagc 51 tcgatcgatc"
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-slate-500">Includes {dirtyInput.length} total characters</span>
            <button 
              onClick={() => setDirtyInput("")}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center"
            >
              <RotateCcw size={12} className="mr-1" /> Clear Input
            </button>
          </div>
        </div>

        {/* Output Area */}
        <div className="flex flex-col h-[500px]">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Clean Output</h2>
            <div className="flex items-center space-x-2 bg-slate-800 rounded p-0.5">
              <button 
                onClick={() => setFormatMode("raw")}
                className={`text-xs px-2 py-1 rounded transition-colors ${formatMode === "raw" ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-slate-200"}`}
              >
                Raw
              </button>
              <button 
                onClick={() => setFormatMode("blocks")}
                className={`text-xs px-2 py-1 rounded transition-colors ${formatMode === "blocks" ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-slate-200"}`}
              >
                Blocks
              </button>
              <button 
                onClick={() => setFormatMode("fasta")}
                className={`text-xs px-2 py-1 rounded transition-colors ${formatMode === "fasta" ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-slate-200"}`}
              >
                FASTA
              </button>
            </div>
          </div>
          
          <div className="relative flex-1">
            <textarea
              readOnly
              value={cleanOutput}
              className="w-full h-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-emerald-400 font-mono text-sm outline-none resize-none"
              placeholder="Clean sequence will appear here..."
            />
            
            {formatMode === "fasta" && (
              <div className="absolute top-2 right-2 bg-slate-900 border border-slate-700 rounded shadow p-2 flex items-center z-10">
                <span className="text-xs text-slate-400 mr-2">FASTA Header:</span>
                <input 
                  type="text" 
                  value={fastaHeader}
                  onChange={e => setFastaHeader(e.target.value)}
                  className="bg-slate-800 border-b border-slate-600 text-xs text-white px-1 outline-none w-32 focus:border-emerald-500"
                />
              </div>
            )}
            
            {cleanOutput && (
              <button 
                onClick={handleCopy}
                className="absolute bottom-4 right-4 bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg shadow-lg transition-colors flex items-center justify-center"
                title="Copy to Clipboard"
              >
                {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
              </button>
            )}
          </div>

          <div className="flex justify-between mt-2 px-1">
            <span className="text-xs text-slate-300 font-medium">{stats.length.toLocaleString()} valid bases</span>
            <span className="text-xs text-red-400/80">{stats.removed.toLocaleString()} junk characters stripped</span>
          </div>
        </div>
        
      </div>
    </div>
  );
}
