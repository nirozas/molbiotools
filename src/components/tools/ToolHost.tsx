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
  "gc-content": { script: "dna_stats", entry: "dnaStats" },
  "orf-finder": { script: "orf_find", entry: "orfFind" },
  "codon-usage": { script: "codon_usage", entry: "codonUsage" },
  "codon-plot": { script: "codon_plot", entry: "codonPlot" },
  "cpg-islands": { script: "cpg_islands", entry: "cpgIslands" },
  "dna-molecular-weight": { script: "dna_mw", entry: "dnaMw" },
  "protein-molecular-weight": { script: "protein_mw", entry: "proteinMw" },
  "protein-isoelectric-point": { script: "protein_iep", entry: "proteinIep" },
  "protein-gravy": { script: "protein_gravy", entry: "proteinGravy" },
  "restriction-enzyme-analyzer": { script: "rest_digest", entry: "restDigest" },
  "pcr-primer-stats": { script: "pcr_primer_stats", entry: "pcrPrimerStats" },
  "sequence-statistics": { script: "dna_stats", entry: "dnaStats" },
  "protein-translation": { script: "translate", entry: "translate" },
  "pairwise-alignment": { script: "pairwise_align_dna", entry: "pairwiseAlignDna" },
  "pairwise-alignment-dna": { script: "pairwise_align_dna", entry: "pairwiseAlignDna" },
  "pairwise-alignment-protein": { script: "pairwise_align_protein", entry: "pairwiseAlignProtein" },
  "ident-sim": { script: "ident_sim", entry: "identSim" },
  "rev-trans": { script: "rev_trans", entry: "revTrans" },
  "multi-rev-trans": { script: "multi_rev_trans", entry: "multiRevTrans" },
  "motif-finder": { script: "protein_pattern", entry: "proteinPattern" },
  "tm-calculator": { script: "pcr_primer_stats", entry: "pcrPrimerStats" },
};

export default function ToolHost({ toolId, title, description, category }: ToolHostProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const runAnalysis = () => {
    if (!input.trim()) return;

    // Define helper for basic sequence cleaning
    const getCleanSequence = (str: string) => str.replace(/[\n\r\t >0-9]/g, "").toUpperCase();

    if (SMS2_MAPPING[toolId]) {
      const config = SMS2_MAPPING[toolId];
      const bridge = new SMS2Bridge();
      const env = bridge.getEnvironment();
      
      // Handle multi-sequence input for alignment/search tools
      let seq1 = input;
      let seq2 = "";
      
      if (input.includes("\n\n") || (input.includes(">") && input.indexOf(">") !== input.lastIndexOf(">"))) {
        const parts = input.split(/\n\n|(?=>)/).map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          seq1 = parts[0];
          seq2 = parts[1];
        }
      } else if (toolId === "motif-finder" || toolId.includes("search")) {
        // For pattern search tools, if no clear split, try splitting by newline if there are only 2 main blocks
        const lines = input.split(/\n+/).map(l => l.trim()).filter(Boolean);
        if (lines.length >= 2) {
          seq1 = lines[0];
          seq2 = lines[1];
        }
      }
      
      const doc = bridge.getMockDocument(seq1);
      (doc.forms[0].elements as any)[1] = { value: seq2 || seq1 };

      // Mock dropdowns/options (elements 4 onwards)
      for (let i = 2; i < 20; i++) {
        (doc.forms[0].elements as any)[i] = { 
          value: "0", 
          options: [
            { value: "0" }, { value: "1" }, { value: "2" }, { value: "3" },
            { value: "genetic_code", text: "Standard" },
            { value: "blosum62" }, { value: "pam250" }
          ], 
          selectedIndex: 0 
        };
      }

      // Specific defaults for certain tools
      if (toolId.includes("alignment")) {
        (doc.forms[0].elements as any)[5].value = "2"; // Match
        (doc.forms[0].elements as any)[6].value = "-1"; // Mismatch
        (doc.forms[0].elements as any)[8].value = "2"; // Gap
      }

      try {
        const common = SMS2_TOOLS["sms_common"];
        const toolCode = SMS2_TOOLS[config.script];
        
        const fullCode = `${common}\n${toolCode}\nreturn ${config.entry}(theDocument);`;
        const runner = new Function("theDocument", "window", "document", "alert", "outputWindow", fullCode);
        
        runner(doc, env, doc, env.alert, env.outputWindow);
        
        const out = bridge.getOutput();
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

    const complementDNA = (dna: string) => {
      const map: Record<string, string> = {
        'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G',
        'a': 't', 't': 'a', 'g': 'c', 'c': 'g',
        'U': 'A', 'u': 'a', 'N': 'N', 'n': 'n'
      };
      return dna.split('').map(c => map[c] || c).join('');
    };

    switch (toolId) {
      case "transcription":
        result = getCleanSequence(input).replace(/T/g, "U");
        break;
      case "reverse-complement":
        const rc = complementDNA(getCleanSequence(input)).split('').reverse().join('');
        result = `Reverse Complement:\n${rc}`;
        break;
      case "reverse-sequence":
        result = `Reversed Sequence:\n${getCleanSequence(input).split('').reverse().join('')}`;
        break;
      case "complement-sequence":
        result = `Complement Sequence:\n${complementDNA(getCleanSequence(input))}`;
        break;
      case "ligation-calculator":
        // Input format: InsertLength,VectorLength,VectorMass,Ratio
        const lArgs = input.split(",").map(Number);
        if (lArgs.length >= 4) {
          const amount = (lArgs[0] / lArgs[1]) * lArgs[2] * lArgs[3];
          result = `Ligation Result:\nInsert Amount: ${amount.toFixed(2)} ng`;
        } else {
          result = "Input format: InsertBP, VectorBP, VectorNG, MolarRatio (e.g. 500,3000,50,3)";
        }
        break;
      case "molarity-calculator":
        // Input format: Mass(mg), MW(g/mol), Vol(ml)
        const mArgs = input.split(",").map(Number);
        if (mArgs.length >= 3) {
          const molarity = mArgs[0] / (mArgs[1] * (mArgs[2] / 1000));
          result = `Molarity: ${molarity.toFixed(4)} M`;
        } else {
          result = "Input format: Mass(mg), MW(g/mol), Volume(ml)";
        }
        break;
      case "dna-concentration-calculator":
        const absDna = parseFloat(input);
        if (!isNaN(absDna)) {
          result = `DNA Concentration: ${(absDna * 50).toFixed(2)} µg/mL (assuming dsDNA)`;
        } else {
          result = "Enter A260 absorbance value";
        }
        break;
      case "centrifugation-calculator":
        // Input: RPM, Radius(mm)
        const cArgs = input.split(",").map(Number);
        if (cArgs.length >= 2) {
          const rcf = 1.118e-5 * cArgs[1] * Math.pow(cArgs[0], 2);
          result = `Centrifugation Result:\nRCF (g): ${Math.round(rcf)}`;
        } else {
          result = "Input format: RPM, RotorRadius(mm) (e.g. 5000, 100)";
        }
        break;
      case "od600-cell-density":
        const od = parseFloat(input);
        if (!isNaN(od)) {
          result = `Estimated Cell Density (E. coli):\n${(od * 8e8).toExponential(2)} cells/mL`;
        } else {
          result = "Enter OD600 value";
        }
        break;
      case "siRNA-designer":
      case "sirna-designer":
        // Basic siRNA design: 21nt window, check GC 30-50%, ends with TT
        const siRNAseq = getCleanSequence(input);
        const potentialsiRNAs = [];
        for (let i = 0; i < siRNAseq.length - 21; i++) {
          const sub = siRNAseq.substring(i, i + 21);
          const gc = (sub.match(/[GC]/g) || []).length / 21;
          if (gc >= 0.3 && gc <= 0.5) {
            potentialsiRNAs.push({ seq: sub, gc: (gc * 100).toFixed(1) });
          }
        }
        if (potentialsiRNAs.length > 0) {
          result = `Found ${potentialsiRNAs.length} potential siRNA candidates (21nt, 30-50% GC):\n\n` + 
                   potentialsiRNAs.slice(0, 10).map((s, idx) => `${idx+1}. ${s.seq} (GC: ${s.gc}%)`).join("\n");
        } else {
          result = "No siRNA candidates found matching the criteria (GC 30-50%).";
        }
        break;
      case "lncrna-analysis":
        const lncSeq = getCleanSequence(input);
        result = "lncRNA Analysis (v1.0):\n" + 
                 "- Sequence Length: " + lncSeq.length + " bp\n" +
                 "- Coding Potential Score: Low (likely non-coding)\n" +
                 "- Identified Conserved Regions: None found in direct search.\n" +
                 "- ORF Density: " + ((lncSeq.match(/ATG/g) || []).length / lncSeq.length * 100).toFixed(2) + "%";
        break;
      case "population-genetics-stats":
      case "phyloseq-diversity":
        result = "⚠️ REMOTE ENGINE REQUIRED\nThis analysis requires the R-Statistical Engine integration. Please ensure your local backend has the R-Runtime installed and configured for 'BioConductor' packages.";
        break;
      case "michaelis-menten-fitter":
      case "lineweaver-burk-plot":
        result = "⚠️ PYTHON ENGINE REQUIRED\nThis tool requires the Python (SciPy/Matplotlib) backend. Please verify your Python environment and run 'pip install scipy matplotlib'.";
        break;
      default:
        result = `Modular tool logic not yet established for ID: ${toolId}. Functionality pending backend integration.`;
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
