"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { 
  ArrowLeft, 
  Dna, 
  Copy, 
  RotateCcw, 
  Play, 
  Check, 
  Activity,
  BarChart,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ToolHostProps {
  toolId: string;
  title: string;
  description: string;
  category: string;
}

export default function ToolHost({ toolId, title, description, category }: ToolHostProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const runAnalysis = () => {
    const cleanInput = input.trim().toUpperCase().replace(/[^A-Z]/g, "");
    if (!cleanInput) return;

    let result = "";
    let dataStats: any = null;

    switch (toolId) {
      case "reverse-complement":
        const complement: Record<string, string> = { A: "T", T: "A", C: "G", G: "C", N: "N" };
        result = cleanInput
          .split("")
          .reverse()
          .map(base => complement[base] || base)
          .join("");
        break;

      case "gc-content":
        const gCount = (cleanInput.match(/G/g) || []).length;
        const cCount = (cleanInput.match(/C/g) || []).length;
        const gc = ((gCount + cCount) / cleanInput.length) * 100;
        result = `GC Content: ${gc.toFixed(2)}%\nTotal Bases: ${cleanInput.length}\nG: ${gCount}, C: ${cCount}`;
        dataStats = { gc: gc.toFixed(1), total: cleanInput.length, comp: { G: gCount, C: cCount, A: (cleanInput.match(/A/g) || []).length, T: (cleanInput.match(/T/g) || []).length } };
        break;

      case "transcription":
        result = cleanInput.replace(/T/g, "U");
        break;

      case "translation":
        const codonTable: Record<string, string> = {
            'ATA':'I', 'ATC':'I', 'ATT':'I', 'ATG':'M',
            'ACA':'T', 'ACC':'T', 'ACG':'T', 'ACT':'T',
            'AAC':'N', 'AAT':'N', 'AAA':'K', 'AAG':'K',
            'AGC':'S', 'AGT':'S', 'AGA':'R', 'AGG':'R',
            'CTA':'L', 'CTC':'L', 'CTG':'L', 'CTT':'L',
            'CCA':'P', 'CCC':'P', 'CCG':'P', 'CCT':'P',
            'CAC':'H', 'CAT':'H', 'CAA':'Q', 'CAG':'Q',
            'CGA':'R', 'CGC':'R', 'CGG':'R', 'CGT':'R',
            'GTA':'V', 'GTC':'V', 'GTG':'V', 'GTT':'V',
            'GCA':'A', 'GCC':'A', 'GCG':'A', 'GCT':'A',
            'GAC':'D', 'GAT':'D', 'GAA':'E', 'GAG':'E',
            'GGA':'G', 'GGC':'G', 'GGG':'G', 'GGT':'G',
            'TCA':'S', 'TCC':'S', 'TCG':'S', 'TCT':'S',
            'TTC':'F', 'TTT':'F', 'TTA':'L', 'TTG':'L',
            'TAC':'Y', 'TAT':'Y', 'TAA':'_', 'TAG':'_',
            'TGC':'C', 'TGT':'C', 'TGA':'_', 'TGG':'W',
        };
        let aa = "";
        for (let i = 0; i < cleanInput.length - 2; i += 3) {
            const codon = cleanInput.substring(i, i + 3);
            aa += codonTable[codon] || "?";
        }
        result = aa;
        break;

      default:
        result = "Modular tool logic not yet implemented for this ID.";
    }

    setOutput(result);
    setStats(dataStats);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const accentColor = "#00d4ff";

  return (
    <div style={{ width: "100%", height: "100%", padding: "2rem 1.5rem" }}>
      
      <main style={{ maxWidth: "100%", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <a href="/" style={{ color: "#475569", textDecoration: "none", fontSize: "0.85rem" }}>Home</a>
            <span style={{ color: "#334155" }}>/</span>
            <span style={{ color: "#475569", fontSize: "0.85rem" }}>{category}</span>
            <span style={{ color: "#334155" }}>/</span>
            <span style={{ color: accentColor, fontSize: "0.85rem", fontWeight: 700 }}>{title}</span>
          </div>
          <button 
            onClick={() => window.history.back()}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.4rem", 
              color: "#64748b", 
              background: "none", 
              border: "none", 
              cursor: "pointer", 
              fontSize: "0.85rem",
              fontWeight: 600,
              transition: "color 0.2s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
          >
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>

        {/* Title & Info */}
        <div style={{ marginBottom: "3rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
            <div style={{ padding: "0.5rem", background: `${accentColor}15`, borderRadius: "10px", color: accentColor }}>
              <Dna size={24} />
            </div>
            <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>{title}</h1>
          </div>
          <p style={{ color: "#64748b", fontSize: "1.1rem" }}>{description}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
          {/* Input Area */}
          <div style={{ background: "rgba(15, 23, 42, 0.4)", border: "1px solid rgba(148, 163, 184, 0.1)", borderRadius: "24px", padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <label style={{ color: "#e2e8f0", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Input Sequence (DNA/RNA)</label>
              <span style={{ color: "#475569", fontSize: "0.75rem" }}>FASTA format or raw sequence</span>
            </div>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste sequence here..."
              style={{ 
                width: "100%", 
                height: "200px", 
                background: "rgba(3, 7, 18, 0.5)", 
                border: "1px solid rgba(148, 163, 184, 0.15)", 
                borderRadius: "16px",
                padding: "1.5rem",
                color: "white",
                fontFamily: "monospace",
                fontSize: "1rem",
                outline: "none",
                resize: "none"
              }}
            />
            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button 
                onClick={runAnalysis}
                className="btn-primary" 
                style={{ flex: 1, justifyContent: "center", padding: "1rem" }}
              >
                <Play size={18} fill="white" /> Run Analysis
              </button>
              <button 
                onClick={() => { setInput(""); setOutput(""); setStats(null); }}
                style={{ 
                  background: "rgba(255, 255, 255, 0.05)", 
                  border: "1px solid rgba(255, 255, 255, 0.1)", 
                  color: "#94a3b8",
                  padding: "0 1.5rem",
                  borderRadius: "12px",
                  cursor: "pointer"
                }}
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>

          {/* Output Area */}
          <AnimatePresence>
            {output && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: "rgba(15, 23, 42, 0.4)", border: `1px solid ${accentColor}30`, borderRadius: "24px", padding: "2rem" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                     <Check size={16} color={accentColor} />
                     <span style={{ color: "white", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase" }}>Analysis Result</span>
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    style={{ background: "none", border: "none", color: copied ? accentColor : "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", fontWeight: 600 }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "Copied!" : "Copy Result"}
                  </button>
                </div>

                {stats && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                        <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                            <div style={{ fontSize: "0.7rem", color: "#475569", fontWeight: 700 }}>GC PERCENTAGE</div>
                            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: accentColor }}>{stats.gc}%</div>
                        </div>
                        <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                            <div style={{ fontSize: "0.7rem", color: "#475569", fontWeight: 700 }}>TOTAL BASES</div>
                            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "white" }}>{stats.total}</div>
                        </div>
                    </div>
                )}

                <div style={{ 
                    width: "100%", 
                    background: "rgba(3, 7, 18, 0.8)", 
                    border: "1px solid rgba(0, 212, 255, 0.2)", 
                    borderRadius: "16px",
                    padding: "1.5rem",
                    color: "white",
                    fontFamily: "monospace",
                    fontSize: "1rem",
                    wordBreak: "break-all",
                    maxHeight: "300px",
                    overflowY: "auto"
                }}>
                  {output}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
