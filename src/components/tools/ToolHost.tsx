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
import { SMS2Bridge } from "@/lib/sms2/bridge";
import { SMS2_TOOLS } from "@/lib/sms2/tools_bundle";

interface ToolHostProps {
  toolId: string;
  title: string;
  description: string;
  category: string;
}

const SMS2_MAPPING: Record<string, { script: string; entry: string }> = {
  "dna-stats": { script: "dna_stats", entry: "dnaStats" },
  "protein-stats": { script: "protein_stats", entry: "proteinStats" },
  "translation": { script: "translate", entry: "translate" },
  "transcription": { script: "translate", entry: "translate" },
  "gc-content": { script: "dna_stats", entry: "dnaStats" },
  "orf-finder": { script: "orf_find", entry: "orfFind" },
  "codon-usage": { script: "codon_usage", entry: "codonUsage" },
  "codon-plot": { script: "codon_plot", entry: "codonPlot" },
  "cpg-islands": { script: "cpg_islands", entry: "cpgIslands" },
  "dna-molecular-weight": { script: "dna_mw", entry: "dnaMw" },
  "protein-molecular-weight": { script: "protein_mw", entry: "proteinMw" },
  "protein-isoelectric-point": { script: "protein_iep", entry: "proteinIep" },
  "protein-gravy": { script: "protein_gravy", entry: "proteinGravy" },
  "restriction-digest": { script: "rest_digest", entry: "restDigest" },
  "pcr-primer-stats": { script: "pcr_primer_stats", entry: "pcrPrimerStats" },
  "sequence-statistics": { script: "dna_stats", entry: "dnaStats" },
  "protein-translation": { script: "translate", entry: "translate" },
  "reverse-complement": { script: "sms_common", entry: "reverse" },
  "pairwise-alignment-dna": { script: "pairwise_align_dna", entry: "pairwiseAlignDna" },
  "pairwise-alignment-protein": { script: "pairwise_align_protein", entry: "pairwiseAlignProtein" },
  "ident-sim": { script: "ident_sim", entry: "identSim" },
  "rev-trans": { script: "rev_trans", entry: "revTrans" },
  "multi-rev-trans": { script: "multi_rev_trans", entry: "multiRevTrans" },
};

export default function ToolHost({ toolId, title, description, category }: ToolHostProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const runAnalysis = () => {
    const cleanInput = input.trim().toUpperCase().replace(/[^A-Z]/g, "");
    if (!cleanInput) return;

    if (SMS2_MAPPING[toolId]) {
      const config = SMS2_MAPPING[toolId];
      const bridge = new SMS2Bridge();
      const env = bridge.getEnvironment();
      
      // Standard SMS2 form setup:
      // elements[0] = sequence input
      // elements[4,5,6] = typically dropdowns for genetic code, frames, etc.
      // For now we mock these with common defaults
      const doc = bridge.getMockDocument(input);
      
      // Add more fake elements if needed for specific tools
      // This is a minimal mock for elements requested by legacy scripts
      for (let i = 1; i < 10; i++) {
        (doc.forms[0].elements as any)[i] = { 
          value: "0", 
          options: [{ value: "0" }], 
          selectedIndex: 0 
        };
      }

      try {
        const common = SMS2_TOOLS["sms_common"];
        const toolCode = SMS2_TOOLS[config.script];
        
        // Execute the script
        const fullCode = `${common}\n${toolCode}\nreturn ${config.entry}(theDocument);`;
        const runner = new Function("theDocument", "window", "document", "alert", "outputWindow", fullCode);
        
        runner(doc, env, doc, env.alert, env.outputWindow);
        
        const out = bridge.getOutput();
        // Clean output: remove HTML tags for better display, or keep if we want rich text
        const cleaned = out.content
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/td><td>/gi, " | ")
          .replace(/<[^>]*>/g, "")
          .trim();
          
        setOutput(cleaned || out.content);
        return;
      } catch (err) {
        console.error("SMS2 Run Error:", err);
        setOutput("Analysis Error: " + (err as Error).message);
        return;
      }
    }

    let result = "";
    let dataStats: any = null;

    switch (toolId) {
      // Fallback for custom tools or those not in mapping
      case "transcription":
        result = cleanInput.replace(/T/g, "U");
        break;
      default:
        result = "Modular tool logic not yet established for this ID. Functionality pending backend integration.";
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
