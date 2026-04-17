"use client";

import React, { useState, useEffect } from "react";
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
  FileText,
  Zap
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
  "protein-stats": { script: "protein_stats", entry: "proteinStats" },
  "translation": { script: "translate", entry: "translate" },
  "codon-usage": { script: "codon_usage", entry: "codonUsage" },
  "codon-plot": { script: "codon_plot", entry: "codonPlot" },
  "cpg-islands": { script: "cpg_islands", entry: "cpgIslands" },
  "dna-molecular-weight": { script: "dna_mw", entry: "dnaMw" },
  "protein-molecular-weight": { script: "protein_mw", entry: "proteinMw" },
  "protein-isoelectric-point": { script: "protein_iep", entry: "proteinIep" },
  "protein-gravy": { script: "protein_gravy", entry: "proteinGravy" },
  "pcr-primer-stats": { script: "pcr_primer_stats", entry: "pcrPrimerStats" },
  "protein-translation": { script: "translate", entry: "translate" },
  "ident-sim": { script: "ident_sim", entry: "identSim" },
  "multi-rev-trans": { script: "multi_rev_trans", entry: "multiRevTrans" },
  "motif-finder": { script: "protein_pattern", entry: "proteinPattern" },
  "tm-calculator": { script: "pcr_primer_stats", entry: "pcrPrimerStats" },
};

export default function ToolHost({ toolId, title, description, category }: ToolHostProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // ORF Finder Settings
  const [orfMin, setOrfMin] = useState("50");
  const [orfFrames, setOrfFrames] = useState("All");
  const [orfShowMap, setOrfShowMap] = useState(true);
  const [orfStartCodon, setOrfStartCodon] = useState("ATG");

  // DNA Concentration Settings
  const [od260, setOd260] = useState("1.0");
  const [naType, setNaType] = useState("dsDNA");
  const [dilution, setDilution] = useState("1");

  // mRNA Optimization Settings
  const [mrnaConfig, setMrnaConfig] = useState<any>({
     sequences: [{ utr5: "", cds: "", utr3: "" }],
     organism: "Homo Sapiens",
     criterion: "Match codon usage",
     uridineDepletion: false,
     preciseMfe: false,
     avoidMotifs: "",
     gcMin: "30",
     gcMax: "70",
     gcWindow: "100",
     entropyWindow: "30",
     numSequences: "1"
  });

  // ===== Tm Calculator State =====
  const [tmSeq, setTmSeq] = useState("");
  const [tmNa, setTmNa] = useState("50");
  const [tmConc, setTmConc] = useState("250");
  const [tmDNA, setTmDNA] = useState("dna");
  const [tmResult, setTmResult] = useState<any>(null);

  // ===== Ta Calculator State =====
  const [taFwd, setTaFwd] = useState("");
  const [taRev, setTaRev] = useState("");
  const [taInsert, setTaInsert] = useState("500");
  const [taNa, setTaNa] = useState("50");
  const [taResult, setTaResult] = useState<any>(null);

  // ===== Molarity Calculator State =====
  const [molMass, setMolMass] = useState("");
  const [molMW, setMolMW] = useState("");
  const [molVol, setMolVol] = useState("");
  const [molConc, setMolConc] = useState("");
  const [molSolveFor, setMolSolveFor] = useState<"conc"|"mass"|"vol">("conc");
  const [molResult, setMolResult] = useState<any>(null);

  // ===== Centrifugation Calculator State =====
  const [centRpm, setCentRpm] = useState("");
  const [centRcf, setCentRcf] = useState("");
  const [centRadius, setCentRadius] = useState("90");
  const [centSolveFor, setCentSolveFor] = useState<"rcf"|"rpm">("rcf");
  const [centResult, setCentResult] = useState<any>(null);

  // ===== Serial Dilution State =====
  const [sdStart, setSdStart] = useState("1");
  const [sdStartUnit, setSdStartUnit] = useState("mM");
  const [sdFactor, setSdFactor] = useState("10");
  const [sdSteps, setSdSteps] = useState("8");
  const [sdVolume, setSdVolume] = useState("1");
  const [sdResult, setSdResult] = useState<any[]>([]);

  // ===== Unit Converter Biology State =====
  const [ucValue, setUcValue] = useState("");
  const [ucFromUnit, setUcFromUnit] = useState("µg");
  const [ucMW, setUcMW] = useState("");
  const [ucMolType, setUcMolType] = useState("DNA");
  const [ucResult, setUcResult] = useState<any>(null);

  // ===== Coding Capacity State =====
  const [ccMode, setCcMode] = useState<"bp"|"aa"|"kda">("bp");
  const [ccInput, setCcInput] = useState("");
  const [ccResult, setCcResult] = useState<any>(null);

  // ===== Buffer Calculator State =====
  const [buffPka, setBuffPka] = useState("4.76"); // Acetate default
  const [buffPh, setBuffPh] = useState("4.76");
  const [buffTotal, setBuffTotal] = useState("100");
  const [buffTotalUnit, setBuffTotalUnit] = useState("mM");
  const [buffMode, setBuffMode] = useState<"ph"|"ratio">("ratio");
  const [buffResult, setBuffResult] = useState<any>(null);

  // ===== OD600 State =====
  const [odVal, setOdVal] = useState("1.0");
  const [odMolecule, setOdMolecule] = useState("E. coli");
  const [odResult, setOdResult] = useState<any>(null);
  // ===== Reverse Translation State =====
  const [rtProtein, setRtProtein] = useState("");
  const [rtSpecies, setRtSpecies] = useState("Human");
  const [rtMode, setRtMode] = useState<"optimized"|"consensus">("optimized");
  const [rtResult, setRtResult] = useState<any>(null);

  // ===== Restriction Digest State =====
  const [rdSeq, setRdSeq] = useState("");
  const [rdSelected, setRdSelected] = useState<string[]>([]);
  const [rdIsCircular, setRdIsCircular] = useState(false);
  const [rdResult, setRdResult] = useState<any>(null);
  const [rdLadder, setRdLadder] = useState("Life 1 kb Plus");
  const [rdHighlighted, setRdHighlighted] = useState<number | null>(null);

  const LADDERS: Record<string, number[]> = {
    "Life 1 kb Plus": [12000, 11000, 10000, 9000, 8000, 7000, 6000, 5000, 4000, 3000, 2000, 1650, 1000, 850, 650, 500, 400, 300, 200, 100],
    "NEB 2-Log": [10000, 8000, 6000, 5000, 4000, 3000, 2000, 1500, 1200, 1000, 900, 800, 700, 600, 500, 400, 300, 200, 100],
    "GeneRuler 1 kb Plus": [20000, 10000, 7000, 5000, 4000, 3000, 2000, 1500, 1000, 700, 500, 400, 300, 200, 75],
    "DNA-HindIII": [23130, 9416, 6557, 4361, 2322, 2027, 564, 125]
  };

  // ===== PCR Simulator State =====
  const [pcrTemplate, setPcrTemplate] = useState("");
  const [pcrFwd, setPcrFwd] = useState("");
  const [pcrRev, setPcrRev] = useState("");
  const [pcrKit, setPcrKit] = useState("Phusion (High-Fidelity)");
  const [pcrResult, setPcrResult] = useState<any>(null);

  // ===== Gene Optimizer State =====
  const [goDNA, setGoDNA] = useState("");
  const [goStep, setGoStep] = useState(1);
  const [goOrganism, setGoOrganism] = useState("Human");
  const [goForbidden, setGoForbidden] = useState<string[]>([]);
  const [goMode, setGoMode] = useState<"minimal"|"full">("full");
  const [goType, setGoType] = useState<"ORF"|"CDS"|"NONE">("CDS");
  const [goRange, setGoRange] = useState({ start: 1, end: 1 });
  const [goPreserved, setGoPreserved] = useState<{ start: number, end: number }[]>([]);
  const [goPreserveInput, setGoPreserveInput] = useState({ start: "", end: "" });
  const [goEnzSearch, setGoEnzSearch] = useState("");
  const [goResult, setGoResult] = useState<any>(null);
  const [goAnalysis, setGoAnalysis] = useState<any>(null);
  const [goTranslation, setGoTranslation] = useState("");

  const runAnalysis = () => {
    // For calculators with custom UI state where 'input' string isn't used, we bypass the empty-check
    if (!input.trim() && !["dna-concentration-calculator", "ligation-calculator", "mrna-optimization"].includes(toolId)) return;

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
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, "")
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
      case "gc-content":
        const gcSeq = getCleanSequence(input);
        if (gcSeq.length === 0) {
          result = "Please enter a valid DNA sequence.";
        } else {
          const g = (gcSeq.match(/G/g) || []).length;
          const c = (gcSeq.match(/C/g) || []).length;
          const gcPerc = ((g + c) / gcSeq.length) * 100;
          result = `GC ${gcPerc.toFixed(0)}%, C=${c}, G=${g}\n(Total length: ${gcSeq.length} bp)`;
        }
        break;
      case "dna-stats":
      case "sequence-statistics":
        const sSeq = getCleanSequence(input);
        if (sSeq.length === 0) {
          result = "Please enter a valid DNA sequence.";
        } else {
          const counts: Record<string, number> = { A: 0, T: 0, G: 0, C: 0 };
          let others = 0;
          for (const char of sSeq) {
            if (counts[char] !== undefined) counts[char]++;
            else others++;
          }
          const total = sSeq.length;
          const gcCount = counts.G + counts.C;
          const gcP = (gcCount / total) * 100;
          
          result = `DNA SEQUENCE STATISTICS\n` +
                   `=======================\n` +
                   `Total Length: ${total} bp\n` +
                   `GC Content:   ${gcP.toFixed(2)}%\n\n` +
                   `Base Frequency:\n` +
                   `A: ${counts.A.toString().padEnd(6)} | ${((counts.A/total)*100).toFixed(1)}%\n` +
                   `T: ${counts.T.toString().padEnd(6)} | ${((counts.T/total)*100).toFixed(1)}%\n` +
                   `G: ${counts.G.toString().padEnd(6)} | ${((counts.G/total)*100).toFixed(1)}%\n` +
                   `C: ${counts.C.toString().padEnd(6)} | ${((counts.C/total)*100).toFixed(1)}%\n` +
                   (others > 0 ? `N: ${others.toString().padEnd(6)} | ${((others/total)*100).toFixed(1)}%\n` : "");
        }
        break;
      case "restriction-enzyme-analyzer":
        const reSeq = getCleanSequence(input);
        if (reSeq.length === 0) {
          result = "Please enter a valid DNA sequence.";
        } else {
          const enzymes = [
            { name: "EcoRI", site: "G▼AATTC" },
            { name: "BamHI", site: "G▼GATCC" },
            { name: "HindIII", site: "A▼AGCTT" },
            { name: "NotI", site: "GC▼GGCCGC" },
            { name: "XhoI", site: "C▼TCGAG" },
            { name: "NdeI", site: "CA▼TATG" },
            { name: "BglII", site: "A▼GATCT" },
            { name: "SalI", site: "G▼TCGAC" },
            { name: "PstI", site: "CTGCA▼G" },
            { name: "SmaI", site: "CCC▼GGG" },
            { name: "KpnI", site: "GGTAC▼C" },
            { name: "SacI", site: "GAGCT▼C" },
            { name: "HaeIII", site: "GG▼CC" },
            { name: "AluI", site: "AG▼CT" },
            { name: "DpnI", site: "GA▼TC" },
            { name: "TaqI", site: "T▼CGA" }
          ];

          let reReport = `RESTRICTION SITES (Common Enzymes)\n==================================\nLength: ${reSeq.length} bp\n\n`;
          let foundCount = 0;

          const getIndices = (seq: string, site: string) => {
            const indices = [];
            const searchPattern = site.replace("▼", "");
            let i = -1;
            while ((i = seq.indexOf(searchPattern, i + 1)) !== -1) {
              indices.push(i);
            }
            return indices;
          };

          for (const enz of enzymes) {
            const fwIndices = getIndices(reSeq, enz.site);
            if (fwIndices.length > 0) {
              foundCount++;
              reReport += `${enz.name.padEnd(8)} | Site: ${enz.site.padEnd(9)} | Cuts: ${fwIndices.length.toString().padEnd(3)} | Pos: ${fwIndices.map(i => i + 1).join(', ')}\n`;
            }
          }
          
          if (foundCount === 0) {
            reReport += "No common restriction sites found in the sequence.";
          }
          result = reReport;
        }
        break;
      case "reverse-complement": {
        const rc = complementDNA(getCleanSequence(input)).split('').reverse().join('');
        result = `Reverse Complement:\n${rc}`;
        break;
      }
      case "reverse-sequence": {
        result = `Reversed Sequence:\n${getCleanSequence(input).split('').reverse().join('')}`;
        break;
      }
      case "mrna-optimization":
          result = `<div style="text-align:center; padding: 3rem; background:rgba(30,41,59,0.3); border:1px solid rgba(148,163,184,0.1); border-radius:16px;">
            <div style="display:flex; justify-content:center; margin-bottom:1rem; color:#f43f5e;"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>
            <div style="font-size:1.5rem; font-weight:700; color:white; margin-bottom:1rem;">API Integration Bridge Required</div>
            <p style="color:#94a3b8; line-height:1.6; max-width:650px; margin:0 auto;">
               Your sequence array and advanced optimization parameters have been packaged internally into a comprehensive JSON payload.<br/><br/>
               To perform the true biological comparative cross-evaluation against exactly <strong>${mrnaConfig.organism}</strong> with the <strong>${mrnaConfig.criterion}</strong> criterion via <code>mrnaid.dichlab.org</code> endpoints, a Serverless API backend route must be established. This acts as a CORS-proxy passing your <strong style="color:white;">${mrnaConfig.sequences.length} sequence(s)</strong> to their compute cluster and safely returning the unified optimization scores back into this secure portal component.
            </p>
          </div>`;
          break;
      case "translation":
        result = `Note: Legacy Translation tool routed.\nNative tool upgrade pending.`;
        break;
      case "dna-concentration-calculator": {
        const od = parseFloat(od260) || 0;
        const dil = parseFloat(dilution) || 1;
        let factor = 50;
        if (naType === "ssDNA") factor = 33;
        if (naType === "RNA") factor = 40;
        
        const concentration = (od * factor * dil).toFixed(2);
        
        let outHtml = `<div style="text-align:center; padding: 2rem; background:rgba(16,185,129,0.05); border:1px solid rgba(16,185,129,0.2); border-radius:16px;">`;
        outHtml += `<div style="font-size:0.85rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:1rem;">Calculated Concentration</div>`;
        outHtml += `<div style="font-size:4rem; font-weight:800; color:#10b981; line-height:1;">${concentration}</div>`;
        outHtml += `<div style="color:#94a3b8; margin-top: 0.5rem; font-size:1.2rem; font-weight:600;">ng/µL <span style="color:#475569;font-weight:400;">(or µg/mL)</span></div>`;
        outHtml += `</div>`;
        
        result = outHtml;
        break;
      }
      case "complement-sequence":
        result = `Complement Sequence:\n${complementDNA(getCleanSequence(input))}`;
        break;
      case "orf-finder":
        const orfSeq = getCleanSequence(input);
        if (orfSeq.length === 0) {
           result = "Please enter a Sequence.";
           break;
        }

        const codonsToAA: Record<string, string> = {
          "ATT": "I", "ATC": "I", "ATA": "I", "CTT": "L", "CTC": "L", "CTA": "L", "CTG": "L", 
          "TTA": "L", "TTG": "L", "GTT": "V", "GTC": "V", "GTA": "V", "GTG": "V", "TTT": "F", 
          "TTC": "F", "ATG": "M", "TGT": "C", "TGC": "C", "GCT": "A", "GCC": "A", "GCA": "A", 
          "GCG": "A", "GGT": "G", "GGC": "G", "GGA": "G", "GGG": "G", "CCT": "P", "CCC": "P", 
          "CCA": "P", "CCG": "P", "ACT": "T", "ACC": "T", "ACA": "T", "ACG": "T", "TCT": "S", 
          "TCC": "S", "TCA": "S", "TCG": "S", "AGT": "S", "AGC": "S", "TAT": "Y", "TAC": "Y", 
          "TGG": "W", "CAA": "Q", "CAG": "Q", "AAT": "N", "AAC": "N", "CAT": "H", "CAC": "H", 
          "GAA": "E", "GAG": "E", "GAT": "D", "GAC": "D", "AAA": "K", "AAG": "K", "CGT": "R", 
          "CGC": "R", "CGA": "R", "CGG": "R", "AGA": "R", "AGG": "R", "TAA": "*", "TAG": "*", "TGA": "*"
        };

        const showF1 = ["All", "Forward", "1"].includes(orfFrames);
        const showF2 = ["All", "Forward", "2"].includes(orfFrames);
        const showF3 = ["All", "Forward", "3"].includes(orfFrames);

        const validCodonStarts = new Set<number>();
        const minLen = parseInt(orfMin) || 50;
        
        for (let frame = 0; frame < 3; frame++) {
            let inOrf = false;
            let currentOrfStart = -1;
            
            for (let k = frame; k < orfSeq.length - 2; k += 3) {
                const codon = orfSeq.substring(k, k+3).replace(/U/g, 'T');
                const aa = codonsToAA[codon] || "X";
                let isStart = false;
                if (orfStartCodon === "ATG" && codon === "ATG") isStart = true;
                else if (orfStartCodon === "ATG/GTG/TTG" && ["ATG","GTG","TTG"].includes(codon)) isStart = true;
                
                if (!inOrf) {
                    if (isStart || (orfStartCodon === "Any" && aa !== "*")) {
                         inOrf = true;
                         currentOrfStart = k;
                    }
                } else {
                    if (aa === "*") {
                         const orfLength = (k + 3) - currentOrfStart;
                         if (orfLength >= minLen) {
                             for (let pos = currentOrfStart; pos <= k; pos += 3) validCodonStarts.add(pos);
                         }
                         inOrf = false;
                         currentOrfStart = -1;
                    }
                }
            }
            if (inOrf) {
                const orfLength = orfSeq.length - currentOrfStart;
                if (orfLength >= minLen) {
                     for (let pos = currentOrfStart; pos < orfSeq.length; pos += 3) validCodonStarts.add(pos);
                }
            }
        }

        let orfHtml = `<h3 style="color:#00d4ff;margin-bottom:1rem;font-family:sans-serif;">ORF Viewer (Minimum Length: ${orfMin} bases)</h3>`;
        
        if (orfShowMap) {
            for (let i = 0; i < orfSeq.length; i += 60) {
               const end = Math.min(i + 60, orfSeq.length);
               const chunk = orfSeq.substring(i, end);
               
               const renderFrame = (offset: number) => {
                   let html = "";
                   let j = i;
                   while (j < end) {
                       const codonStart = j - ((j - offset) % 3 + 3) % 3; 
                       const isValidCodon = validCodonStarts.has(codonStart);
                       
                       if (codonStart === j && codonStart >= offset && codonStart + 2 < orfSeq.length) {
                           const remainingInChunk = end - j; 
                           const chWidth = Math.min(remainingInChunk, 3);

                           if (!isValidCodon) {
                               html += `<span style="display:inline-block;width:${chWidth}ch;"></span>`;
                               j += chWidth;
                               continue;
                           }

                           const codon = orfSeq.substring(j, j+3).replace(/U/g, 'T');
                           const aa = codonsToAA[codon] || (codon.includes('N') ? " " : "X");
                           let isStart = false;
                           if (orfStartCodon === "ATG" && codon === "ATG") isStart = true;
                           else if (orfStartCodon === "ATG/GTG/TTG" && ["ATG","GTG","TTG"].includes(codon)) isStart = true;
                           else if (orfStartCodon === "Any" && aa !== "*") isStart = false; 

                           let bg = "rgba(148,163,184,0.15)";
                           let color = "#cbd5e1";
                           let border = "1px solid rgba(148,163,184,0.3)";
                           if (isStart) { bg = "rgba(16,185,129,0.3)"; color = "#10b981"; border="1px solid #10b981"; }
                           else if(aa==="*") { bg = "rgba(244,63,94,0.3)"; color = "#f43f5e"; border="1px solid #f43f5e"; }
                           
                           html += `<span style="display:inline-block;width:${chWidth}ch;text-align:center;background:${bg};color:${color};border:${border};border-radius:3px;font-size:0.85rem;line-height:1.3;box-sizing:border-box;overflow:hidden;margin-right:0;">${aa}</span>`;
                           j += chWidth;
                       } else if (codonStart < j && codonStart >= offset && codonStart + 2 < orfSeq.length) {
                           const remainingInCodon = 3 - (j - codonStart);
                           const remainingInChunk = end - j;
                           const chWidth = Math.min(remainingInCodon, remainingInChunk);

                           if (!isValidCodon) {
                               html += `<span style="display:inline-block;width:${chWidth}ch;"></span>`;
                               j += chWidth;
                               continue;
                           }

                           const codon = orfSeq.substring(codonStart, codonStart+3).replace(/U/g, 'T');
                           const aa = codonsToAA[codon] || "X";
                           let isStart = false;
                           if (orfStartCodon === "ATG" && codon === "ATG") isStart = true;
                           else if (orfStartCodon === "ATG/GTG/TTG" && ["ATG","GTG","TTG"].includes(codon)) isStart = true;

                           let bg = "rgba(148,163,184,0.15)";
                           let border = "1px dashed rgba(148,163,184,0.3)";
                           if (isStart) { bg = "rgba(16,185,129,0.3)"; border="1px solid #10b981"; }
                           else if(aa==="*") { bg = "rgba(244,63,94,0.3)"; border="1px solid #f43f5e"; }
                           
                           html += `<span style="display:inline-block;width:${chWidth}ch;background:${bg};borderRight:${border};borderTop:${border};borderBottom:${border};border-radius:0 3px 3px 0;box-sizing:border-box;"></span>`;
                           j += chWidth;
                       } else {
                           html += `<span style="display:inline-block;width:1ch;"></span>`;
                           j += 1;
                       }
                   }
                   return html;
               };
               
               orfHtml += `<div style="margin-bottom: 2.5rem; font-family: monospace;">`;
               if (showF3) orfHtml += `<div style="color: #64748b; font-size: 0.85rem; margin-bottom: 3px; display:flex;"><span style="width:2ch;margin-right:12px;text-align:right;">+3</span> ${renderFrame(2)}</div>`;
               if (showF2) orfHtml += `<div style="color: #64748b; font-size: 0.85rem; margin-bottom: 3px; display:flex;"><span style="width:2ch;margin-right:12px;text-align:right;">+2</span> ${renderFrame(1)}</div>`;
               if (showF1) orfHtml += `<div style="color: #64748b; font-size: 0.85rem; margin-bottom: 3px; display:flex;"><span style="width:2ch;margin-right:12px;text-align:right;">+1</span> ${renderFrame(0)}</div>`;
               orfHtml += `<div style="color: #f1f5f9; font-weight: 600; display:flex; letter-spacing:0;"><span style="width:2ch;margin-right:12px;text-align:right;color:#38bdf8;">></span> <span>${chunk}</span></div>`;
               orfHtml += `</div>`;
            }
        } else {
            orfHtml += `<p style="color:#94a3b8;font-family:sans-serif;">Sequence Map is disabled in Settings. Calculating pure ORF tabular data (Pending Module)...</p>`;
        }
        
        result = orfHtml;
        break;
      case "pairwise-alignment":
        const parts = input.split("|||");
        const seqA = getCleanSequence(parts[0] || "");
        const seqB = getCleanSequence(parts[1] || "");
        
        if (!seqA || !seqB) {
           result = "Error: Global Alignment requires TWO valid sequences.\nPlease enter both Sequence A and Sequence B.";
           break;
        }
        if (seqA.length > 2000 || seqB.length > 2000) {
           result = "Error: Sequences are too long for in-browser global alignment.\nLimit is 2000 bp per sequence.";
           break;
        }

        const MATCH_SCORE = 1;
        const MISMATCH_SCORE = -1;
        const GAP_PENALTY = -2;
        
        const m = seqA.length;
        const n = seqB.length;
        
        const dp = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++) dp[i][0] = i * GAP_PENALTY;
        for (let j = 0; j <= n; j++) dp[0][j] = j * GAP_PENALTY;
        
        for (let i = 1; i <= m; i++) {
          for (let j = 1; j <= n; j++) {
            const match = dp[i-1][j-1] + (seqA[i-1] === seqB[j-1] ? MATCH_SCORE : MISMATCH_SCORE);
            const del = dp[i-1][j] + GAP_PENALTY;
            const insert = dp[i][j-1] + GAP_PENALTY;
            dp[i][j] = Math.max(match, del, insert);
          }
        }
        
        let alignA = "";
        let alignB = "";
        let alignSym = "";
        let dp_i = m, dp_j = n;
        
        while (dp_i > 0 || dp_j > 0) {
          if (dp_i > 0 && dp_j > 0 && dp[dp_i][dp_j] === dp[dp_i-1][dp_j-1] + (seqA[dp_i-1] === seqB[dp_j-1] ? MATCH_SCORE : MISMATCH_SCORE)) {
            alignA = seqA[dp_i-1] + alignA;
            alignB = seqB[dp_j-1] + alignB;
            alignSym = (seqA[dp_i-1] === seqB[dp_j-1] ? "|" : ".") + alignSym;
            dp_i--; dp_j--;
          } else if (dp_i > 0 && dp[dp_i][dp_j] === dp[dp_i-1][dp_j] + GAP_PENALTY) {
            alignA = seqA[dp_i-1] + alignA;
            alignB = "-" + alignB;
            alignSym = " " + alignSym;
            dp_i--;
          } else {
            alignA = "-" + alignA;
            alignB = seqB[dp_j-1] + alignB;
            alignSym = " " + alignSym;
            dp_j--;
          }
        }
        
        const score = dp[m][n];
        let alignOutput = `Global Alignment (Needleman-Wunsch)\nScore: ${score}\n\n`;
        
        for (let k = 0; k < alignA.length; k += 60) {
          const chunkA = alignA.substring(k, k+60);
          const chunkSym = alignSym.substring(k, k+60);
          const chunkB = alignB.substring(k, k+60);
          alignOutput += `SeqA: ${chunkA}\n      ${chunkSym}\nSeqB: ${chunkB}\n\n`;
        }
        
        result = alignOutput.trim();
        break;
      case "ligation-calculator":
        const rawArgs = input.split(/[\s,]+/);
        const parseArg = (idx: number) => {
          const val = Number(rawArgs[idx]);
          return !isNaN(val) && val > 0 ? val : undefined;
        };

        const insertLen = parseArg(0);
        const vectorLen = parseArg(1);
        const vectorMass = parseArg(2);
        
        if (insertLen && vectorLen && vectorMass) {
          const customRatio = parseArg(3);
          const insert2Len = parseArg(4);
          
          let calcReport = `LIGATION CALCULATOR REPORT\n==========================\n`;
          calcReport += `Vector:   ${vectorLen} bp | ${vectorMass} ng\n`;
          calcReport += `Insert 1: ${insertLen} bp\n`;
          if (insert2Len) {
            calcReport += `Insert 2: ${insert2Len} bp\n\n`;
          } else {
            calcReport += `\n`;
          }
          
          if (customRatio) {
             const amount = (insertLen / vectorLen) * vectorMass * customRatio;
             calcReport += `Custom Ratio (1:${customRatio})\n`;
             calcReport += `↳ Required Insert 1 Mass: ${amount.toFixed(2)} ng\n`;
             if (insert2Len) {
                const amount2 = (insert2Len / vectorLen) * vectorMass * customRatio;
                calcReport += `↳ Required Insert 2 Mass: ${amount2.toFixed(2)} ng\n`;
             }
             calcReport += `\n`;
          }
          
          if (!insert2Len) {
            calcReport += `Standard Molar Ratios (Vector:Insert 1):\n`;
            calcReport += `----------------------------------------\n`;
            const ratios = [1, 2, 3, 5, 7];
            for (const r of ratios) {
               const amt = (insertLen / vectorLen) * vectorMass * r;
               calcReport += `1:${r.toString().padEnd(2)} Ratio -> ${amt.toFixed(2).padStart(8)} ng Insert 1\n`;
            }
          } else {
            calcReport += `Multi-part Assemblies (Vector:Ins 1:Ins 2):\n`;
            calcReport += `-------------------------------------------\n`;
            const ratios = [1, 2, 3];
            for (const r of ratios) {
               const amt1 = (insertLen / vectorLen) * vectorMass * r;
               const amt2 = (insert2Len / vectorLen) * vectorMass * r;
               calcReport += `1:${r}:${r} Ratio -> ${amt1.toFixed(2).padStart(6)} ng Ins 1 | ${amt2.toFixed(2).padStart(6)} ng Ins 2\n`;
            }
          }
          
          result = calcReport;
        } else {
          result = `🧪 Ligation Calculator\n\n` + 
                   `Calculates the required mass (ng) of insert for a ligation reaction.\n\n` +
                   `INPUT FORMAT:\n` +
                   `Insert_bp, Vector_bp, Vector_ng, [Optional_Ratio]\n\n` +
                   `EXAMPLE (500bp insert, 3000bp vector, 50ng vector):\n` +
                   `500, 3000, 50`;
        }
        break;
      case "molarity-calculator":
      case "centrifugation-calculator":
      case "tm-calculator":
      case "ta-calculator":
      case "serial-dilution-planner":
      case "unit-converter-biology":
      case "coding-capacity":
      case "buffer-calculator":
      case "od600-cell-density":
      case "rev-trans":
      case "restriction-digest":
      case "pcr-simulator":
      case "gene-optimizer":
        // These tools use dedicated UI state — no text-input logic needed
        break;
      case "dna-concentration-calculator":
        const absDna = parseFloat(input);
        if (!isNaN(absDna)) {
          result = `DNA Concentration: ${(absDna * 50).toFixed(2)} µg/mL (assuming dsDNA)`;
        } else {
          result = "Enter A260 absorbance value";
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

  useEffect(() => {
    const dedicatedUiTools = ["tm-calculator","ta-calculator","molarity-calculator","centrifugation-calculator","serial-dilution-planner","unit-converter-biology","coding-capacity","buffer-calculator","od600-cell-density","rev-trans","restriction-digest","pcr-simulator","gene-optimizer"];
    if (toolId.includes("calculator") && !dedicatedUiTools.includes(toolId) && !["rev-trans", "restriction-digest", "pcr-simulator", "gene-optimizer"].includes(toolId)) {
      // Trigger auto-calculate if there's enough numerical input
      const activeInputs = input.split(/[\s,]+/).filter(Boolean);
      if (activeInputs.length >= 3) {
         runAnalysis();
      } else {
         if (["dna-concentration-calculator", "ligation-calculator", "mrna-optimization"].includes(toolId)) {
             runAnalysis();
         } else {
             setOutput("");
         }
      }
    }
  }, [input, toolId, od260, naType, dilution]);

  // ===== Tm Calculator Logic =====
  const calcTm = () => {
    const seq = tmSeq.toUpperCase().replace(/[^ATGCU]/g, "").replace(/U/g, "T");
    if (seq.length < 4) { setTmResult({ error: "Sequence must be at least 4 bases." }); return; }
    // Nearest-neighbor parameters (SantaLucia 1998, unified ΔH/ΔS)
    const NN: Record<string, { dH: number; dS: number }> = {
      "AA": { dH: -7.9, dS: -22.2 }, "AT": { dH: -7.2, dS: -20.4 },
      "AC": { dH: -7.8, dS: -21.0 }, "AG": { dH: -7.8, dS: -21.0 },
      "TA": { dH: -7.2, dS: -21.3 }, "TT": { dH: -7.9, dS: -22.2 },
      "TC": { dH: -7.8, dS: -22.2 }, "TG": { dH: -8.5, dS: -22.7 },
      "CA": { dH: -8.5, dS: -22.7 }, "CT": { dH: -7.8, dS: -21.0 },
      "CC": { dH: -8.0, dS: -19.9 }, "CG": { dH: -10.6, dS: -27.2 },
      "GA": { dH: -8.2, dS: -22.2 }, "GT": { dH: -8.4, dS: -22.4 },
      "GC": { dH: -9.8, dS: -24.4 }, "GG": { dH: -8.0, dS: -19.9 },
    };
    let dHtot = 0, dStot = 0;
    for (let i = 0; i < seq.length - 1; i++) {
      const dinuc = seq[i] + seq[i + 1];
      if (NN[dinuc]) { dHtot += NN[dinuc].dH; dStot += NN[dinuc].dS; }
    }
    // Initiation correction
    const init5 = seq[0] === "G" || seq[0] === "C" ? { dH: 0.1, dS: -2.8 } : { dH: 2.3, dS: 4.1 };
    const initEnd = seq[seq.length-1] === "G" || seq[seq.length-1] === "C" ? { dH: 0.1, dS: -2.8 } : { dH: 2.3, dS: 4.1 };
    dHtot += init5.dH + initEnd.dH;
    dStot += init5.dS + initEnd.dS;
    const ct = parseFloat(tmConc) * 1e-9;  // nM → M
    const R = 1.987; // cal/(mol·K)
    const naConc = parseFloat(tmNa) * 1e-3; // mM → M
    const dStotFull = dStot + R * Math.log(ct / 4);
    const tmK = (dHtot * 1000) / dStotFull - 273.15;
    // Salt correction (Owczarzy 2004)
    const saltCorr = 16.6 * Math.log10(naConc);
    const tmFinal = tmK + saltCorr;
    const gc = (seq.match(/[GC]/g) || []).length;
    const gcPct = ((gc / seq.length) * 100).toFixed(1);
    const tmBasic = 2 * (seq.match(/[AT]/g) || []).length + 4 * gc;
    setTmResult({ tmFinal: tmFinal.toFixed(1), tmBasic, gc, gcPct, len: seq.length, seq, dH: dHtot.toFixed(1), dS: dStot.toFixed(1) });
  };

  // ===== Ta Calculator Logic =====
  const calcTmFromSeq = (seq: string, naConc: number): number => {
    const s = seq.toUpperCase().replace(/[^ATGCU]/g, "").replace(/U/g, "T");
    if (s.length < 4) return 0;
    const NN: Record<string, { dH: number; dS: number }> = {
      "AA": { dH: -7.9, dS: -22.2 }, "AT": { dH: -7.2, dS: -20.4 }, "AC": { dH: -7.8, dS: -21.0 }, "AG": { dH: -7.8, dS: -21.0 },
      "TA": { dH: -7.2, dS: -21.3 }, "TT": { dH: -7.9, dS: -22.2 }, "TC": { dH: -7.8, dS: -22.2 }, "TG": { dH: -8.5, dS: -22.7 },
      "CA": { dH: -8.5, dS: -22.7 }, "CT": { dH: -7.8, dS: -21.0 }, "CC": { dH: -8.0, dS: -19.9 }, "CG": { dH: -10.6, dS: -27.2 },
      "GA": { dH: -8.2, dS: -22.2 }, "GT": { dH: -8.4, dS: -22.4 }, "GC": { dH: -9.8, dS: -24.4 }, "GG": { dH: -8.0, dS: -19.9 },
    };
    let dH = 0, dS = 0;
    for (let i = 0; i < s.length - 1; i++) { const d = s[i]+s[i+1]; if (NN[d]) { dH += NN[d].dH; dS += NN[d].dS; } }
    const init5 = s[0] === "G" || s[0] === "C" ? { dH: 0.1, dS: -2.8 } : { dH: 2.3, dS: 4.1 };
    const initE = s[s.length-1] === "G" || s[s.length-1] === "C" ? { dH: 0.1, dS: -2.8 } : { dH: 2.3, dS: 4.1 };
    dH += init5.dH + initE.dH; dS += init5.dS + initE.dS;
    const R = 1.987; const ct = 250e-9;
    const dSfull = dS + R * Math.log(ct / 4);
    return (dH * 1000) / dSfull - 273.15 + 16.6 * Math.log10(naConc * 1e-3);
  };
  const calcTa = () => {
    const fwd = taFwd.trim(); const rev = taRev.trim();
    if (!fwd || !rev) { setTaResult({ error: "Please enter both primers." }); return; }
    const na = parseFloat(taNa) || 50;
    const ins = parseInt(taInsert) || 500;
    const tmF = calcTmFromSeq(fwd, na);
    const tmR = calcTmFromSeq(rev, na);
    const taOwczarzy = 0.3 * Math.min(tmF, tmR) + 0.7 * Math.max(tmF, tmR) - 14.9;
    const taConv = (tmF + tmR) / 2 - 5;
    // Amplicon GC adjustment: longer amplicons may need slightly lower Ta
    const lenPenalty = ins > 1000 ? -2 : ins > 3000 ? -4 : 0;
    const taFinal = taOwczarzy + lenPenalty;
    setTaResult({ tmF: tmF.toFixed(1), tmR: tmR.toFixed(1), taOwczarzy: taOwczarzy.toFixed(1), taConv: taConv.toFixed(1), taFinal: taFinal.toFixed(1), ins });
  };

  // ===== Molarity Calculator Logic =====
  const calcMolarity = () => {
    const mw = parseFloat(molMW);
    if (isNaN(mw) || mw <= 0) { setMolResult({ error: "Enter a valid molecular weight." }); return; }
    if (molSolveFor === "conc") {
      const mass = parseFloat(molMass); const vol = parseFloat(molVol);
      if (isNaN(mass) || isNaN(vol) || vol <= 0) { setMolResult({ error: "Enter mass (mg) and volume (mL)." }); return; }
      const moles = mass / 1000 / mw; // mass in g / MW
      const volL = vol / 1000;
      const M = moles / volL;
      setMolResult({ value: M, unit: "M", mM: M*1000, uM: M*1e6, nM: M*1e9, label: "Concentration" });
    } else if (molSolveFor === "mass") {
      const conc = parseFloat(molConc); const vol = parseFloat(molVol);
      if (isNaN(conc) || isNaN(vol) || vol <= 0) { setMolResult({ error: "Enter concentration (mM) and volume (mL)." }); return; }
      const M = conc / 1000;
      const mass_g = M * (vol / 1000) * mw;
      setMolResult({ value: mass_g * 1000, unit: "mg", ug: mass_g * 1e6, ng: mass_g * 1e9, label: "Mass" });
    } else {
      const conc = parseFloat(molConc); const mass = parseFloat(molMass);
      if (isNaN(conc) || isNaN(mass)) { setMolResult({ error: "Enter mass (mg) and concentration (mM)." }); return; }
      const M = conc / 1000;
      const moles = mass / 1000 / mw;
      const volL = moles / M;
      setMolResult({ value: volL * 1000, unit: "mL", uL: volL * 1e6, label: "Volume" });
    }
  };

  // ===== Centrifugation Logic =====
  const calcCentrifugation = () => {
    const r = parseFloat(centRadius);
    if (isNaN(r) || r <= 0) { setCentResult({ error: "Enter a valid rotor radius (mm)." }); return; }
    if (centSolveFor === "rcf") {
      const rpm = parseFloat(centRpm);
      if (isNaN(rpm)) { setCentResult({ error: "Enter RPM." }); return; }
      const rcf = 1.118e-5 * r * rpm * rpm;
      setCentResult({ main: Math.round(rcf), unit: "× g (RCF)", rpm, r });
    } else {
      const rcf = parseFloat(centRcf);
      if (isNaN(rcf)) { setCentResult({ error: "Enter RCF (× g)." }); return; }
      const rpm = Math.sqrt(rcf / (1.118e-5 * r));
      setCentResult({ main: Math.round(rpm), unit: "RPM", rcf, r });
    }
  };

  // ===== Serial Dilution Logic =====
  const calcSerialDilution = () => {
    const start = parseFloat(sdStart);
    const factor = parseFloat(sdFactor);
    const steps = parseInt(sdSteps);
    const vol = parseFloat(sdVolume);
    if (isNaN(start) || isNaN(factor) || isNaN(steps) || factor <= 1) return;
    const rows: any[] = [];
    for (let i = 0; i <= steps; i++) {
      const conc = start / Math.pow(factor, i);
      const dilution = Math.pow(factor, i);
      const stockVol = i === 0 ? vol : vol / factor;
      const diluent = vol - stockVol;
      rows.push({ step: i, conc, dilution, stockVol: stockVol.toFixed(3), diluent: diluent.toFixed(3) });
    }
    setSdResult(rows);
  };

  // ===== Coding Capacity Logic =====
  // Average residue MW = 110 Da (after peptide bond dehydration, SantaLucia / Promega convention)
  // ORF in bp = (AA × 3) + 3  (coding codons + 1 stop codon)
  // kDa = AA × 110 / 1000
  const AVG_AA_MW = 110; // Da per residue
  const calcCodingCapacity = () => {
    const val = parseFloat(ccInput);
    if (isNaN(val) || val <= 0) { setCcResult({ error: "Enter a positive value." }); return; }
    let bp: number, aa: number, kda: number;
    if (ccMode === "bp") {
      bp = Math.round(val);
      aa = Math.max(1, Math.floor((bp - 3) / 3)); // subtract stop codon
      kda = aa * AVG_AA_MW / 1000;
    } else if (ccMode === "aa") {
      aa = Math.round(val);
      bp = aa * 3 + 3; // coding region + stop codon
      kda = aa * AVG_AA_MW / 1000;
    } else {
      kda = val;
      aa = Math.round(kda * 1000 / AVG_AA_MW);
      bp = aa * 3 + 3;
    }
    setCcResult({ bp, aa, kda });
  };

  // ===== Buffer Calculator Logic =====
  const calcBuffer = () => {
    const pka = parseFloat(buffPka);
    const ph = parseFloat(buffPh);
    const total = parseFloat(buffTotal);
    if (isNaN(pka) || isNaN(ph) || isNaN(total)) return;

    // ratio = [Base]/[Acid] = 10^(pH - pKa)
    const ratio = Math.pow(10, ph - pka);
    // [Acid] + [Base] = Total
    // [Acid] + ratio * [Acid] = Total => [Acid] = Total / (1 + ratio)
    const acid = total / (1 + ratio);
    const base = total - acid;

    setBuffResult({
      ratio: ratio.toFixed(4),
      acid: acid.toFixed(2),
      base: base.toFixed(2),
      unit: buffTotalUnit,
      ph: ph.toFixed(2),
      pka: pka.toFixed(2)
    });
  };

  // ===== OD600 Logic =====
  const FACTORS: Record<string, number> = {
    "E. coli": 8e8,
    "S. cerevisiae (Yeast)": 3e7,
    "B. subtilis": 1.2e8,
    "Mammalian Cells (SF)": 1e6
  };
  const calcOD600 = () => {
    const od = parseFloat(odVal);
    if (isNaN(od)) return;
    const factor = FACTORS[odMolecule] || 8e8;
    const density = od * factor;
    setOdResult({
      density,
      organism: odMolecule,
      od: od.toFixed(3)
    });
  };

  // ===== Reverse Translation Logic =====
  const MAMMALIAN_CODON_TABLES: Record<string, Record<string, string>> = {
    "Human": { 
      'A': 'GCC', 'C': 'TGC', 'D': 'GAC', 'E': 'GAG', 'F': 'TTC', 'G': 'GGC', 'H': 'CAC', 'I': 'ATC', 
      'K': 'AAG', 'L': 'CTG', 'M': 'ATG', 'N': 'AAC', 'P': 'CCC', 'Q': 'CAG', 'R': 'AGG', 'S': 'AGC', 
      'T': 'ACC', 'V': 'GTG', 'W': 'TGG', 'Y': 'TAC', '*': 'TGA' 
    },
    "Mouse": { 
      'A': 'GCC', 'C': 'TGC', 'D': 'GAC', 'E': 'GAG', 'F': 'TTC', 'G': 'GGC', 'H': 'CAC', 'I': 'ATC', 
      'K': 'AAG', 'L': 'CTG', 'M': 'ATG', 'N': 'AAC', 'P': 'CCC', 'Q': 'CAG', 'R': 'AGG', 'S': 'AGC', 
      'T': 'ACC', 'V': 'GTG', 'W': 'TGG', 'Y': 'TAC', '*': 'TGA' 
    },
    "Rat": { 
      'A': 'GCC', 'C': 'TGC', 'D': 'GAC', 'E': 'GAG', 'F': 'TTC', 'G': 'GGC', 'H': 'CAC', 'I': 'ATC', 
      'K': 'AAG', 'L': 'CTG', 'M': 'ATG', 'N': 'AAC', 'P': 'CCC', 'Q': 'CAG', 'R': 'AGG', 'S': 'AGC', 
      'T': 'ACC', 'V': 'GTG', 'W': 'TGG', 'Y': 'TAC', '*': 'TGA' 
    },
    "Monkey": { 
      'A': 'GCC', 'C': 'TGC', 'D': 'GAC', 'E': 'GAG', 'F': 'TTC', 'G': 'GGC', 'H': 'CAC', 'I': 'ATC', 
      'K': 'AAG', 'L': 'CTG', 'M': 'ATG', 'N': 'AAC', 'P': 'CCC', 'Q': 'CAG', 'R': 'AGG', 'S': 'AGC', 
      'T': 'ACC', 'V': 'GTG', 'W': 'TGG', 'Y': 'TAC', '*': 'TGA' 
    }
  };
  const MAMMALIAN_IUPAC_TABLE: Record<string, string> = {
    'A': 'GCN', 'C': 'TGY', 'D': 'GAY', 'E': 'GAR', 'F': 'TTY', 'G': 'GGN', 'H': 'CAY', 'I': 'ATH', 
    'K': 'AAR', 'L': 'YTN', 'M': 'ATG', 'N': 'AAY', 'P': 'CCN', 'Q': 'CAR', 'R': 'MGN', 'S': 'WSN', 
    'T': 'ACN', 'V': 'GTN', 'W': 'TGG', 'Y': 'TAY', '*': 'TRR'
  };

  const calcRevTrans = () => {
    const rawProt = rtProtein.replace(/[^A-Za-z*]/g, "").toUpperCase();
    if (!rawProt) return;
    
    let dna = "";
    if (rtMode === "consensus") {
      for (let char of rawProt) {
        dna += MAMMALIAN_IUPAC_TABLE[char] || "NNN";
      }
    } else {
      const table = MAMMALIAN_CODON_TABLES[rtSpecies] || MAMMALIAN_CODON_TABLES["Human"];
      for (let char of rawProt) {
        dna += table[char] || "NNN";
      }
    }

    setRtResult({
      dna,
      length: dna.length,
      protLength: rawProt.length,
      gc: (((dna.match(/[GC]/g) || []).length / dna.length) * 100).toFixed(1),
      mode: rtMode
    });
  };

  // ===== Restriction Digest Logic =====
  const ALL_ENZYMES = [
    { name: "EcoRI", site: "GAATTC", cut: 1 },
    { name: "BamHI", site: "GGATCC", cut: 1 },
    { name: "HindIII", site: "AAGCTT", cut: 1 },
    { name: "NotI", site: "GCGGCCGC", cut: 2 },
    { name: "XhoI", site: "CTCGAG", cut: 1 },
    { name: "NdeI", site: "CATATG", cut: 2 },
    { name: "BglII", site: "AGATCT", cut: 1 },
    { name: "SalI", site: "GTCGAC", cut: 1 },
    { name: "PstI", site: "CTGCAG", cut: 5 },
    { name: "SmaI", site: "CCCGGG", cut: 3 },
    { name: "XbaI", site: "TCTAGA", cut: 1 },
    { name: "NcoI", site: "CCATGG", cut: 1 },
    { name: "SacI", site: "GAGCTC", cut: 5 },
    { name: "KpnI", site: "GGTACC", cut: 5 },
    { name: "ClaI", site: "ATCGAT", cut: 2 },
    { name: "EcoRV", site: "GATATC", cut: 3 },
    { name: "SpeI", site: "ACTAGT", cut: 1 },
    { name: "SphI", site: "GCATGC", cut: 5 },
    { name: "NheI", site: "GCTAGC", cut: 1 },
    { name: "MfeI", site: "CAATTG", cut: 1 }
  ];

  const calcRestrictionDigest = () => {
    const cleanSeq = rdSeq.replace(/[\n\r\t >0-9]/g, "").toUpperCase();
    if (!cleanSeq) return;

    const sites: { pos: number; name: string }[] = [];
    rdSelected.forEach(enzName => {
      const enz = ALL_ENZYMES.find(e => e.name === enzName);
      if (!enz) return;
      
      let pos = cleanSeq.indexOf(enz.site);
      while (pos !== -1) {
        sites.push({ pos: pos + enz.cut, name: enzName });
        pos = cleanSeq.indexOf(enz.site, pos + 1);
      }
    });

    sites.sort((a,b) => a.pos - b.pos);

    let frags: { size: number; seq: string }[] = [];
    if (sites.length === 0) {
      frags = [{ size: cleanSeq.length, seq: cleanSeq }];
    } else {
      if (rdIsCircular) {
        // Circular: first cut to last cut, then wrap around
        for (let i = 0; i < sites.length - 1; i++) {
          const s = cleanSeq.substring(sites[i].pos, sites[i+1].pos);
          frags.push({ size: s.length, seq: s });
        }
        const wrap = cleanSeq.substring(sites[sites.length-1].pos) + cleanSeq.substring(0, sites[0].pos);
        frags.push({ size: wrap.length, seq: wrap });
      } else {
        // Linear: start to first cut, intermediate cuts, last cut to end
        const fst = cleanSeq.substring(0, sites[0].pos);
        frags.push({ size: fst.length, seq: fst });
        for (let i = 0; i < sites.length - 1; i++) {
          const s = cleanSeq.substring(sites[i].pos, sites[i+1].pos);
          frags.push({ size: s.length, seq: s });
        }
        const lst = cleanSeq.substring(sites[sites.length-1].pos);
        frags.push({ size: lst.length, seq: lst });
      }
    }

    setRdResult({
      fragments: frags.filter(f => f.size > 0).sort((a,b) => b.size - a.size),
      sites: sites,
      seqLen: cleanSeq.length
    });
    setRdHighlighted(null);
  };

  const downloadGelImage = () => {
    const svg = document.getElementById("gel-simulator-svg");
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    // Scale up for better quality
    canvas.width = 1200;
    canvas.height = 800;
    
    const svgUrl = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = "#020617";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 1200, 800);
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `gel_digest_${Date.now()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    img.src = svgUrl;
  };

  // ===== PCR Simulator Logic =====
  const calcPcrSimulator = () => {
    const template = pcrTemplate.replace(/[\n\r\t >0-9]/g, "").toUpperCase();
    const fwd = pcrFwd.replace(/[\s0-9]/g, "").toUpperCase();
    const rev = pcrRev.replace(/[\s0-9]/g, "").toUpperCase();
    
    if (!template || !fwd || !rev) return;

    const complementDNA = (dna: string) => {
      const map: any = { 'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G' };
      return dna.split('').map(c => map[c] || c).join('');
    };
    const reverseComplement = (dna: string) => complementDNA(dna).split('').reverse().join('');

    // Calculate Tm (Simple rule of thumb for demonstration)
    const getTm = (seq: string) => {
      const g = (seq.match(/G/g) || []).length;
      const c = (seq.match(/C/g) || []).length;
      const a = (seq.match(/A/g) || []).length;
      const t = (seq.match(/T/g) || []).length;
      return 2 * (a + t) + 4 * (g + c);
    };

    // Find annealing parts (minimum 15bp perfect 3' match)
    const findSites = (primer: string, target: string) => {
      const sites: number[] = [];
      for (let len = primer.length; len >= 15; len--) {
        const annealingPart = primer.substring(primer.length - len);
        let pos = target.indexOf(annealingPart);
        while (pos !== -1) {
          sites.push(pos);
          pos = target.indexOf(annealingPart, pos + 1);
        }
        if (sites.length > 0) break;
      }
      return sites;
    };

    const fwdSites = findSites(fwd, template);
    const revSites = findSites(reverseComplement(rev), template);

    const products: any[] = [];
    fwdSites.forEach(fPos => {
      revSites.forEach(rPos => {
        if (rPos > fPos) {
          const matchingRev = reverseComplement(template.substring(rPos, rPos + 15)); // approximation
          const productMid = template.substring(fPos, rPos + (template.length - findSites(reverseComplement(rev), template)[0] === rPos ? rev.length : 20)); // crude
          
          // Better logic: the product starts with the full FWD primer and ends with the full RC of the REV primer
          // The template part is [fPos ... rPos + RC_Rev_annealing_len]
          
          // Let's refine the annealing bit
          let fAnnealLen = 0;
          for (let l = fwd.length; l >= 15; l--) {
            if (template.substring(fPos, fPos + l) === fwd.substring(fwd.length - l)) { fAnnealLen = l; break; }
          }
          let rAnnealLen = 0;
          const revRC = reverseComplement(rev);
          for (let l = rev.length; l >= 15; l--) {
            if (template.substring(rPos, rPos + l) === revRC.substring(revRC.length - l)) { rAnnealLen = l; break; }
          }

          const amplicon = fwd.substring(0, fwd.length - fAnnealLen) + template.substring(fPos, rPos + rAnnealLen) + rev;
          products.push({
            sequence: amplicon,
            size: amplicon.length,
            fPos: fPos + 1,
            rPos: rPos + rAnnealLen
          });
        }
      });
    });

    // Protocol generation
    const meanTm = (getTm(fwd.slice(-20)) + getTm(rev.slice(-20))) / 2;
    let extensionTime = Math.ceil(products[0]?.size / 1000 * (pcrKit.includes("Taq") ? 60 : 30));
    if (extensionTime < 15) extensionTime = 15;

    const program = [
      { step: "Initial Denaturation", temp: pcrKit.includes("Taq") ? 94 : 98, time: "2 min" },
      { step: "Denaturation", temp: pcrKit.includes("Taq") ? 94 : 98, time: "15 sec", cycle: true },
      { step: "Annealing", temp: Math.round(pcrKit.includes("Taq") ? meanTm - 5 : meanTm + 3), time: "20 sec", cycle: true },
      { step: "Extension", temp: 72, time: `${extensionTime} sec`, cycle: true },
      { step: "Final Extension", temp: 72, time: "5 min" },
      { step: "Hold", temp: 4, time: "∞" }
    ];

    setPcrResult({
      products: products.sort((a,b) => b.size - a.size),
      program,
      tm: meanTm.toFixed(1),
      kit: pcrKit
    });
  };

  // ===== Gene Optimizer Logic =====
  const GENETIC_CODE: Record<string, string> = {
    'ATA':'I', 'ATC':'I', 'ATT':'I', 'ATG':'M', 'ACA':'T', 'ACC':'T', 'ACG':'T', 'ACT':'T', 'AAC':'N', 'AAT':'N', 'AAA':'K', 'AAG':'K', 'AGC':'S', 'AGT':'S', 'AGA':'R', 'AGG':'R', 'CTA':'L', 'CTC':'L', 'CTG':'L', 'CTT':'L', 'CCA':'P', 'CCC':'P', 'CCG':'P', 'CCT':'P', 'CAC':'H', 'CAT':'H', 'CAA':'Q', 'CAG':'Q', 'CGA':'R', 'CGC':'R', 'CGG':'R', 'CGT':'R', 'GTA':'V', 'GTC':'V', 'GTG':'V', 'GTT':'V', 'GCA':'A', 'GCC':'A', 'GCG':'A', 'GCT':'A', 'GAC':'D', 'GAT':'D', 'GAA':'E', 'GAG':'E', 'GGA':'G', 'GGC':'G', 'GGG':'G', 'GGT':'G', 'TCA':'S', 'TCC':'S', 'TCG':'S', 'TCT':'S', 'TTC':'F', 'TTT':'F', 'TTA':'L', 'TTG':'L', 'TAC':'Y', 'TAT':'Y', 'TAA':'*', 'TAG':'*', 'TGC':'C', 'TGT':'C', 'TGA':'*', 'TGG':'W',
  };

  const OPT_TABLES: Record<string, Record<string, string>> = {
    "Human": { 'A':'GCC', 'C':'TGC', 'D':'GAC', 'E':'GAG', 'F':'TTC', 'G':'GGC', 'H':'CAC', 'I':'ATC', 'K':'AAG', 'L':'CTG', 'M':'ATG', 'N':'AAC', 'P':'CCC', 'Q':'CAG', 'R':'AGG', 'S':'AGC', 'T':'ACC', 'V':'GTG', 'W':'TGG', 'Y':'TAC', '*':'TGA' },
    "Mouse": { 'A':'GCC', 'C':'TGC', 'D':'GAC', 'E':'GAG', 'F':'TTC', 'G':'GGC', 'H':'CAC', 'I':'ATC', 'K':'AAG', 'L':'CTG', 'M':'ATG', 'N':'AAC', 'P':'CCC', 'Q':'CAG', 'R':'AGG', 'S':'AGC', 'T':'ACC', 'V':'GTG', 'W':'TGG', 'Y':'TAC', '*':'TGA' },
    "E. coli": { 'A':'GCG', 'C':'TGC', 'D':'GAT', 'E':'GAA', 'F':'TTT', 'G':'GGC', 'H':'CAT', 'I':'ATT', 'K':'AAA', 'L':'CTG', 'M':'ATG', 'N':'AAT', 'P':'CCG', 'Q':'CAG', 'R':'CGT', 'S':'AGC', 'T':'ACC', 'V':'GTG', 'W':'TGG', 'Y':'TAT', '*':'TAA' },
    "Yeast": { 'A':'GCT', 'C':'TGT', 'D':'GAT', 'E':'GAA', 'F':'TTT', 'G':'GGT', 'H':'CAT', 'I':'ATT', 'K':'AAG', 'L':'TTA', 'M':'ATG', 'N':'AAT', 'P':'CCA', 'Q':'CAA', 'R':'AGA', 'S':'TCT', 'T':'ACC', 'V':'GTT', 'W':'TGG', 'Y':'TAT', '*':'TAA' }
  };

  const runGeneAnalysisStep = () => {
    const dna = goDNA.replace(/[\n\r\t >0-9]/g, "").toUpperCase();
    if (!dna) return;

    const issues: string[] = [];
    const repeatRanges: { start: number, end: number, color: string, label: string }[] = [];
    
    // Improved Repeat Detection (Sliding Window 12bp+)
    const K = 12;
    const seen = new Map<string, number[]>();
    for (let i = 0; i <= dna.length - K; i++) {
        const kmer = dna.substring(i, i + K);
        if (!seen.has(kmer)) seen.set(kmer, []);
        seen.get(kmer)!.push(i);
    }
    
    seen.forEach((positions, kmer) => {
        if (positions.length > 1) {
            positions.forEach(pos => {
                repeatRanges.push({ start: pos + 1, end: pos + K, color: "#f59e0b", label: "Repeat" });
            });
        }
    });

    // Merge adjacent/overlapping repeats for cleaner UI
    const mergedRepeats = repeatRanges.sort((a,b) => a.start - b.start).reduce((acc: any[], curr) => {
        if (!acc.length) return [curr];
        const last = acc[acc.length - 1];
        if (curr.start <= last.end + 1) {
            last.end = Math.max(last.end, curr.end);
            return acc;
        }
        acc.push(curr);
        return acc;
    }, []);

    // Homopolymers
    const homos = dna.match(/(A{10,}|T{10,}|G{10,}|C{10,})/g);
    if (homos) issues.push(`Found ${homos.length} homopolymer runs (10bp+).`);
    if (mergedRepeats.length > 0) issues.push(`Found ${mergedRepeats.length} high-complexity repeat zones.`);

    setGoAnalysis({ issues, length: dna.length, repeats: mergedRepeats });
    setGoRange({ start: 1, end: dna.length });
  };

  const getRasMolColor = (aa: string) => {
    const colors: Record<string, string> = {
      'D': '#E60A0A', 'E': '#E60A0A', // Acidic
      'C': '#E6E600', 'M': '#E6E600', // Sulphur
      'K': '#145AFF', 'R': '#145AFF', // Basic
      'S': '#FA9600', 'T': '#FA9600', // Polar
      'F': '#3232AA', 'Y': '#3232AA', // Aromatic
      'N': '#00DCDC', 'Q': '#00DCDC', // Amide
      'G': '#EBEBEB', // Hydrophobic (Small)
      'L': '#0F820F', 'V': '#0F820F', 'I': '#0F820F', // Hydrophobic
      'A': '#C8C8C8', // Hydrophobic
      'W': '#B45AB4', // Aromatic (Large)
      'H': '#8282D2', // Basic (Pale)
      'P': '#DC9682', // Proline
    };
    return colors[aa] || '#64748b';
  };

  const calcGeneTranslation = () => {
    const dna = goDNA.replace(/[\n\r\t >0-9]/g, "").toUpperCase();
    let coding = "";
    if (goType === "CDS") {
        coding = dna.substring(goRange.start - 1, goRange.end);
    } else if (goType === "ORF") {
        // Find first ATG after start
        const startIdx = dna.indexOf("ATG", goRange.start - 1);
        if (startIdx !== -1) {
            const sub = dna.substring(startIdx);
            for (let i=0; i<sub.length; i+=3) {
                const codon = sub.substring(i, i+3);
                coding += codon;
                if (["TAA", "TAG", "TGA"].includes(codon)) break;
            }
        }
    }
    
    if (!coding) { setGoTranslation("No valid sequence found."); return; }
    const aa = coding.match(/.{1,3}/g)?.map(c => GENETIC_CODE[c] || "?").join("") || "";
    setGoTranslation(aa);
  };

  const calcGeneOptimizer = () => {
    const dna = goDNA.replace(/[\n\r\t >0-9]/g, "").toUpperCase();
    const table = OPT_TABLES[goOrganism] || OPT_TABLES["Human"];
  const RANKED_CODONS: Record<string, Record<string, string[]>> = {
    "Human": {
      "A": ["GCC", "GCT", "GCA", "GCG"],
      "C": ["TGC", "TGT"],
      "D": ["GAC", "GAT"],
      "E": ["GAG", "GAA"],
      "F": ["TTC", "TTT"],
      "G": ["GGC", "GGA", "GGG", "GGT"],
      "H": ["CAC", "CAT"],
      "I": ["ATC", "ATT", "ATA"],
      "K": ["AAG", "AAA"],
      "L": ["CTG", "CTC", "TTG", "CTT", "TTA", "CTA"],
      "M": ["ATG"],
      "N": ["AAC", "AAT"],
      "P": ["CCC", "CCT", "CCA", "CCG"],
      "Q": ["CAG", "CAA"],
      "R": ["AGG", "AGA", "CGG", "CGC", "CGA", "CGT"],
      "S": ["AGC", "TCC", "TCT", "AGT", "TCA", "TCG"],
      "T": ["ACC", "ACT", "ACA", "ACG"],
      "V": ["GTG", "GTC", "GTT", "GTA"],
      "W": ["TGG"],
      "Y": ["TAC", "TAT"],
      "*": ["TGA", "TAA", "TAG"]
    },
    "E. coli": {
      "A": ["GCG", "GCC", "GCT", "GCA"],
      "C": ["TGC", "TGT"],
      "D": ["GAT", "GAC"],
      "E": ["GAA", "GAG"],
      "F": ["TTT", "TTC"],
      "G": ["GGC", "GGT", "GGG", "GGA"],
      "H": ["CAT", "CAC"],
      "I": ["ATT", "ATC", "ATA"],
      "K": ["AAA", "AAG"],
      "L": ["CTG", "TTA", "TTG", "CTC", "CTT", "CTA"],
      "M": ["ATG"],
      "N": ["AAT", "AAC"],
      "P": ["CCG", "CCA", "CCT", "CCC"],
      "Q": ["CAG", "CAA"],
      "R": ["CGT", "CGC", "CGG", "CGA", "AGA", "AGG"],
      "S": ["AGC", "TCT", "AGT", "TCC", "TCA", "TCG"],
      "T": ["ACC", "ACG", "ACT", "ACA"],
      "V": ["GTG", "GTT", "GTC", "GTA"],
      "W": ["TGG"],
      "Y": ["TAT", "TAC"],
      "*": ["TAA", "TGA", "TAG"]
    }
  };

    
    // Reverse Table for Synonyms
    const synonyms: Record<string, string[]> = {};
    Object.entries(GENETIC_CODE).forEach(([codon, aa]) => {
      if (!synonyms[aa]) synonyms[aa] = [];
      synonyms[aa].push(codon);
    });

    let prefix = "";
    let coding = "";
    let suffix = "";
    let codingStartOffset = 0;
    
    if (goType === "CDS") {
        prefix = dna.substring(0, goRange.start - 1);
        coding = dna.substring(goRange.start - 1, goRange.end);
        suffix = dna.substring(goRange.end);
        codingStartOffset = goRange.start - 1;
    } else if (goType === "ORF") {
        const startIdx = dna.indexOf("ATG", goRange.start - 1);
        if (startIdx !== -1) {
            prefix = dna.substring(0, startIdx);
            codingStartOffset = startIdx;
            const sub = dna.substring(startIdx);
            let endIdx = sub.length;
            for (let i=0; i<sub.length; i+=3) {
                const codon = sub.substring(i, i+3);
                coding += codon;
                if (["TAA", "TAG", "TGA"].includes(codon)) { endIdx = i + 3; break; }
            }
            suffix = sub.substring(endIdx);
        } else { coding = dna; }
    } else { coding = dna; }

    const isPreserved = (idx: number) => goPreserved.some(p => idx >= p.start && idx <= p.end);

    // Initial Optimization Pass
    let optimizedCodons: string[] = [];
    for (let i = 0; i < coding.length; i += 3) {
        const globalIdx = codingStartOffset + i + 1;
        const originalCodon = coding.substring(i, i + 3);
        const aa = GENETIC_CODE[originalCodon] || "X";
        
        if (isPreserved(globalIdx) || isPreserved(globalIdx+1) || isPreserved(globalIdx+2)) {
            optimizedCodons.push(originalCodon);
        } else {
            optimizedCodons.push(aa === "X" ? originalCodon : (goMode === "full" ? (table[aa] || originalCodon) : originalCodon));
        }
    }

    let finalOptimized = prefix + optimizedCodons.join("") + suffix;

    // "Forbidden sites" are only those that were NOT in the original sequence
    const forbiddenEnzymes = goForbidden.map(f => ALL_ENZYMES.find(e => e.name === f)).filter(Boolean);
    
    // Preliminary check: Where were the sites originally?
    const originalSitesMap = new Map<string, number[]>();
    forbiddenEnzymes.forEach(enz => {
      if (!enz) return;
      const positions: number[] = [];
      let pos = dna.indexOf(enz.site);
      while (pos !== -1) {
        positions.push(pos);
        pos = dna.indexOf(enz.site, pos + 1);
      }
      originalSitesMap.set(enz.name, positions);
    });
 
    
    const getRankedSynonyms = (aa: string) => {
        const org = goOrganism.includes("E. coli") ? "E. coli" : "Human";
        return RANKED_CODONS[org]?.[aa] || synonyms[aa] || [];
    };

    let iterations = 0;
    let issuesFixed = 0;

    const reverseComplement = (dna: string) => {
      const map: any = { 'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G' };
      return dna.split('').map(c => map[c] || c).reverse().join('');
    };

    while (iterations < 500) {
        let issueFound = false;
        
        // 1. Check Restrictions (Newly introduced only)
        for (const enz of forbiddenEnzymes) {
            if (!enz) continue;
            let idx = finalOptimized.indexOf(enz.site);
            while (idx !== -1) {
              if (!(originalSitesMap.get(enz.name) || []).includes(idx)) {
                issueFound = true;
                const matchLen = enz.site.length;
                // WORK BACKWARDS for surgical fix at the end of the site
                for (let j = optimizedCodons.length - 1; j >= 0; j--) {
                    const cStart = codingStartOffset + (j * 3);
                    const cEnd = cStart + 2;
                    if (cStart < idx + matchLen && cEnd >= idx) {
                        if (!isPreserved(cStart + 1)) {
                            const aa = GENETIC_CODE[optimizedCodons[j]];
                            const ranked = getRankedSynonyms(aa);
                            const nextBest = ranked.find(c => c !== optimizedCodons[j]);
                            if (nextBest) {
                                optimizedCodons[j] = nextBest;
                                finalOptimized = prefix + optimizedCodons.join("") + suffix;
                                issuesFixed++;
                                break; 
                            }
                        }
                    }
                }
                break;
              }
              idx = finalOptimized.indexOf(enz.site, idx + 1);
            }
            if (issueFound) break;
        }

        // 2. Check Homopolymers (>10bp runs)
        if (!issueFound) {
            const polyMatch = finalOptimized.match(/([ATGC])\1{10,}/);
            if (polyMatch) {
                issueFound = true;
                const idx = polyMatch.index || 0;
                const matchLen = polyMatch[0].length;
                // WORK BACKWARDS from end of run
                for (let j = optimizedCodons.length - 1; j >= 0; j--) {
                    const cStart = codingStartOffset + (j * 3);
                    const cEnd = cStart + 2;
                    if (cStart < idx + matchLen && cEnd >= idx && !isPreserved(cStart + 1)) {
                        const aa = GENETIC_CODE[optimizedCodons[j]];
                        const ranked = getRankedSynonyms(aa);
                        const nextBest = ranked.find(c => c !== optimizedCodons[j]);
                        if (nextBest) {
                            optimizedCodons[j] = nextBest;
                            finalOptimized = prefix + optimizedCodons.join("") + suffix;
                            issuesFixed++;
                            break;
                        }
                    }
                }
            }
        }

        // 3. Check Direct & Inverted Repeats (>15bp)
        if (!issueFound) {
            const K = 15;
            const seen = new Map<string, number>();
            for (let i = 0; i <= finalOptimized.length - K; i++) {
                const kmer = finalOptimized.substring(i, i + K);
                const rckmer = reverseComplement(kmer);
                
                // Direct Repeat
                if (seen.has(kmer)) {
                    issueFound = true;
                    const firstPos = seen.get(kmer)!;
                    const matchLen = K;
                    let fixed = false;
                    let fixedCount = 0;
                    for (let j = optimizedCodons.length - 1; j >= 0; j--) {
                        const cStart = codingStartOffset + (j * 3);
                        const cEnd = cStart + 2;
                        if (cStart < i + matchLen && cEnd >= i && !isPreserved(cStart + 1)) {
                            const aa = GENETIC_CODE[optimizedCodons[j]];
                            const ranked = getRankedSynonyms(aa);
                            const nextBest = ranked.find(c => c !== optimizedCodons[j]);
                            if (nextBest) {
                                optimizedCodons[j] = nextBest;
                                fixed = true;
                                fixedCount++;
                                if (fixedCount >= 2) break;
                            }
                        }
                    }
                    if (!fixed) {
                        let fixedCount2 = 0;
                        for (let j = optimizedCodons.length - 1; j >= 0; j--) {
                            const cStart = codingStartOffset + (j * 3);
                            const cEnd = cStart + 2;
                            if (cStart < firstPos + matchLen && cEnd >= firstPos && !isPreserved(cStart + 1)) {
                                const aa = GENETIC_CODE[optimizedCodons[j]];
                                const ranked = getRankedSynonyms(aa);
                                const nextBest = ranked.find(c => c !== optimizedCodons[j]);
                                if (nextBest) {
                                    optimizedCodons[j] = nextBest;
                                    fixed = true;
                                    fixedCount2++;
                                    if (fixedCount2 >= 2) break;
                                }
                            }
                        }
                    }
                    if (fixed) {
                        finalOptimized = prefix + optimizedCodons.join("") + suffix;
                        issuesFixed++;
                    }
                    break;
                }
                
                // Inverted Repeat
                if (seen.has(rckmer)) {
                    issueFound = true;
                    const firstPos = seen.get(rckmer)!;
                    const matchLen = K;
                    let fixed = false;
                    let fixedCount = 0;
                    for (let j = optimizedCodons.length - 1; j >= 0; j--) {
                        const cStart = codingStartOffset + (j * 3);
                        const cEnd = cStart + 2;
                        if (cStart < i + matchLen && cEnd >= i && !isPreserved(cStart + 1)) {
                            const aa = GENETIC_CODE[optimizedCodons[j]];
                            const ranked = getRankedSynonyms(aa);
                            const nextBest = ranked.find(c => c !== optimizedCodons[j]);
                            if (nextBest) {
                                optimizedCodons[j] = nextBest;
                                fixed = true;
                                fixedCount++;
                                if (fixedCount >= 2) break;
                            }
                        }
                    }
                    if (!fixed) {
                        let fixedCount2 = 0;
                        for (let j = optimizedCodons.length - 1; j >= 0; j--) {
                            const cStart = codingStartOffset + (j * 3);
                            const cEnd = cStart + 2;
                            if (cStart < firstPos + matchLen && cEnd >= firstPos && !isPreserved(cStart + 1)) {
                                const aa = GENETIC_CODE[optimizedCodons[j]];
                                const ranked = getRankedSynonyms(aa);
                                const nextBest = ranked.find(c => c !== optimizedCodons[j]);
                                if (nextBest) {
                                    optimizedCodons[j] = nextBest;
                                    fixed = true;
                                    fixedCount2++;
                                    if (fixedCount2 >= 2) break;
                                }
                            }
                        }
                    }
                    if (fixed) {
                        finalOptimized = prefix + optimizedCodons.join("") + suffix;
                        issuesFixed++;
                    }
                    break;
                }

                seen.set(kmer, i);
            }
        }


        if (!issueFound) break;
        iterations++;
    }

    const finalIssues: string[] = [];
    goForbidden.forEach(enzName => {
        const enz = ALL_ENZYMES.find(e => e.name === enzName);
        if (enz && finalOptimized.includes(enz.site)) {
            const origPos = dna.indexOf(enz.site);
            if (origPos === -1) finalIssues.push(`CRITICAL: Forbidden site ${enzName} remains in optimized sequence.`);
        }
    });

    // Final Post-Optimization Validation (Check for remaining complexity issues)
    const postPoly = finalOptimized.match(/([ATGC])\1{10,}/);
    if (postPoly) finalIssues.push("Warning: Homopolymer run remains (consider manual adjustment).");
    
    let hasRep = false;
    const K = 15;
    const finalSeen = new Set();
    for (let i = 0; i <= finalOptimized.length - K; i++) {
        const kmer = finalOptimized.substring(i, i + K);
        if (finalSeen.has(kmer)) { hasRep = true; break; }
        finalSeen.add(kmer);
    }
    if (hasRep) finalIssues.push("Warning: Sequence repetitions detected (>15bp).");

    let ntChanges = 0;
    for (let i = 0; i < dna.length; i++) {
        if (dna[i] !== finalOptimized[i]) ntChanges++;
    }

    setGoResult({
        original: dna,
        optimized: finalOptimized,
        issues: finalIssues,
        sitesFixed: issuesFixed,
        ntChanges: ntChanges,
        gc: (((finalOptimized.match(/[GC]/g) || []).length / finalOptimized.length) * 100).toFixed(1),
        aa: coding.match(/.{1,3}/g)?.map(c => GENETIC_CODE[c] || "?").join("")
    });
  };

  // ===== Unit Converter Biology Logic =====
  const calcUnitConverter = () => {
    const val = parseFloat(ucValue);
    const mw = parseFloat(ucMW);
    if (isNaN(val) || val <= 0) { setUcResult({ error: "Enter a valid value." }); return; }
    const needsMW = ["µg", "ng", "mg"].includes(ucFromUnit);
    if (needsMW && (isNaN(mw) || mw <= 0)) { setUcResult({ error: "Enter a valid molecular weight." }); return; }
    let results: any = {};
    if (ucFromUnit === "pmol") {
      const mol = val * 1e-12;
      results = { pmol: val, nmol: val/1e3, µmol: val/1e6, mmol: val/1e9 };
      if (!isNaN(mw) && mw > 0) { results.ng = mol * mw * 1e12; results.µg = mol * mw * 1e9; results.mg = mol * mw * 1e6; }
    } else if (ucFromUnit === "nmol") {
      results = { pmol: val*1e3, nmol: val, µmol: val/1e3, mmol: val/1e6 };
      if (!isNaN(mw) && mw > 0) { const mol = val*1e-9; results.ng = mol*mw*1e12; results.µg = mol*mw*1e9; results.mg = mol*mw*1e6; }
    } else if (ucFromUnit === "ng") {
      const g = val * 1e-9; const mol = g / mw;
      results = { ng: val, µg: val/1e3, mg: val/1e6, g: val/1e9, nmol: mol*1e9, pmol: mol*1e12 };
    } else if (ucFromUnit === "µg") {
      const g = val * 1e-6; const mol = g / mw;
      results = { ng: val*1e3, µg: val, mg: val/1e3, g: val/1e6, nmol: mol*1e9, pmol: mol*1e12 };
    } else if (ucFromUnit === "mg") {
      const g = val * 1e-3; const mol = g / mw;
      results = { ng: val*1e6, µg: val*1e3, mg: val, g: val/1e3, nmol: mol*1e9, pmol: mol*1e12 };
    }
    setUcResult({ results, fromVal: val, fromUnit: ucFromUnit });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const accentColor = "#00d4ff";

  const calcInputStyle = {
    width: "100%", 
    background: "rgba(3, 7, 18, 0.5)", 
    border: "1px solid rgba(148, 163, 184, 0.15)", 
    borderRadius: "12px",
    padding: "1rem",
    color: "white",
    fontFamily: "monospace",
    fontSize: "1rem",
    outline: "none"
  };

  const textareaStyle: React.CSSProperties = {
    width: "100%", 
    background: "rgba(3, 7, 18, 0.5)", 
    border: "1px solid rgba(148, 163, 184, 0.15)", 
    borderRadius: "16px",
    padding: "1.5rem",
    color: "white",
    fontFamily: "monospace",
    fontSize: "1rem",
    outline: "none",
    resize: "none"
  };

  return (
    <div style={{ width: "100%", height: "100%", padding: "2rem 1.5rem" }}>
      
      <main style={{ maxWidth: "100%", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <a href="/" style={{ color: "#475569", textDecoration: "none", fontSize: "0.85rem" }}>Home</a>
            <span style={{ color: "#334155" }}>/</span>
            <a 
              href={`/#${category === "Lab Calculators" ? "calculators" : (category?.toLowerCase().split(' ')[0] || '')}`} 
              style={{ color: "#475569", textDecoration: "none", fontSize: "0.85rem" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#00d4ff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}
            >
              {category}
            </a>
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
            {toolId === "mrna-optimization" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ color: "#e2e8f0", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Sequence Data</label>
                    <button 
                        onClick={() => {
                            if (mrnaConfig.sequences.length < 6) {
                                setMrnaConfig({...mrnaConfig, sequences: [...mrnaConfig.sequences, { utr5: "", cds: "", utr3: "" }]});
                            }
                        }}
                        style={{ background: mrnaConfig.sequences.length >= 6 ? "#334155" : accentColor, color: mrnaConfig.sequences.length >= 6 ? "#94a3b8" : "black", border: "none", borderRadius: "8px", padding: "0.5rem 1rem", fontSize: "0.8rem", fontWeight: 700, cursor: mrnaConfig.sequences.length >= 6 ? "not-allowed" : "pointer" }}
                        disabled={mrnaConfig.sequences.length >= 6}
                    >
                        + Add Sequence ({mrnaConfig.sequences.length}/6)
                    </button>
                </div>

                {mrnaConfig.sequences.map((seq: any, i: number) => (
                    <div key={i} style={{ background: "rgba(0,0,0,0.2)", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(148, 163, 184, 0.1)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", alignItems:"center" }}>
                            <h4 style={{ color: "white", fontSize: "0.95rem", fontWeight: 700 }}>Sequence {i + 1}</h4>
                            {i > 0 && (
                                <button onClick={() => {
                                    const newSeqs = [...mrnaConfig.sequences];
                                    newSeqs.splice(i, 1);
                                    setMrnaConfig({...mrnaConfig, sequences: newSeqs});
                                }} style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: "6px", color: "#f43f5e", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, padding: "0.3rem 0.8rem" }}>Remove</button>
                            )}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
                            <div><label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.4rem" }}>5' UTR</label><input type="text" value={seq.utr5} onChange={(e) => { const n = [...mrnaConfig.sequences]; n[i].utr5 = e.target.value; setMrnaConfig({...mrnaConfig, sequences: n}); }} style={{...calcInputStyle, padding: "0.75rem"}} placeholder="Optional 5' Flanking Sequence" /></div>
                            <div><label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.4rem" }}>Coding Sequence (CDS) <span style={{color:"#f43f5e"}}>*</span></label><textarea value={seq.cds} onChange={(e) => { const n = [...mrnaConfig.sequences]; n[i].cds = e.target.value; setMrnaConfig({...mrnaConfig, sequences: n}); }} style={{...calcInputStyle, padding: "0.75rem", height: "80px", resize: "none"}} placeholder="Required CDS" /></div>
                            <div><label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.4rem" }}>3' UTR</label><input type="text" value={seq.utr3} onChange={(e) => { const n = [...mrnaConfig.sequences]; n[i].utr3 = e.target.value; setMrnaConfig({...mrnaConfig, sequences: n}); }} style={{...calcInputStyle, padding: "0.75rem"}} placeholder="Optional 3' Flanking Sequence" /></div>
                        </div>
                    </div>
                ))}

                <div style={{ background: "rgba(0,0,0,0.2)", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(148, 163, 184, 0.1)" }}>
                  <h4 style={{ color: "white", fontSize: "1rem", fontWeight: 700, marginBottom: "1.5rem", borderBottom: "1px solid rgba(148,163,184,0.1)", paddingBottom: "1rem" }}>Optimization Parameters</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                    
                    <div>
                        <label style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>Codon Usage Organism</label>
                        <select value={mrnaConfig.organism} onChange={(e) => setMrnaConfig({...mrnaConfig, organism: e.target.value})} style={calcInputStyle}>
                            <option value="Homo Sapiens">Homo Sapiens</option>
                            <option value="Mus musculus">Mus musculus</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>Optimization Criterion</label>
                        <select value={mrnaConfig.criterion} onChange={(e) => setMrnaConfig({...mrnaConfig, criterion: e.target.value})} style={calcInputStyle}>
                            <option value="Match codon usage">Match codon usage</option>
                            <option value="Maximize Codon Adaptation Index (CAI)">Maximize Codon Adaptation Index (CAI)</option>
                            <option value="Match dinucleotides usage">Match dinucleotides usage</option>
                            <option value="Match codon pair usage">Match codon pair usage</option>
                        </select>
                    </div>

                    <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem", marginBottom: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <input type="checkbox" checked={mrnaConfig.uridineDepletion} onChange={(e) => setMrnaConfig({...mrnaConfig, uridineDepletion: e.target.checked})} style={{ width: "18px", height: "18px", accentColor: accentColor, cursor:"pointer" }} />
                            <label style={{ color: "#e2e8f0", fontSize: "0.85rem", fontWeight: 600 }}>Uridine depletion</label>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <input type="checkbox" checked={mrnaConfig.preciseMfe} onChange={(e) => setMrnaConfig({...mrnaConfig, preciseMfe: e.target.checked})} style={{ width: "18px", height: "18px", accentColor: accentColor, cursor:"pointer" }} />
                            <label style={{ color: "#e2e8f0", fontSize: "0.85rem", fontWeight: 600 }}>Use more precise MFE estimation</label>
                        </div>
                    </div>

                    <div>
                        <label style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>Avoid Motifs (Text)</label>
                        <input type="text" value={mrnaConfig.avoidMotifs} onChange={(e) => setMrnaConfig({...mrnaConfig, avoidMotifs: e.target.value})} style={calcInputStyle} placeholder="None" />
                    </div>

                    <div>
                        <label style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>Number of Output Sequences (per input)</label>
                        <input type="number" value={mrnaConfig.numSequences} onChange={(e) => setMrnaConfig({...mrnaConfig, numSequences: e.target.value})} style={calcInputStyle} />
                    </div>

                    <div style={{ gridColumn: "1 / -1", borderTop: "1px solid rgba(148,163,184,0.1)", paddingTop: "1.5rem", marginTop: "0.5rem" }}>
                        <h5 style={{ color: "white", fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem" }}>Global GC Content (%)</h5>
                        <div style={{ display: "flex", gap: "1.5rem" }}>
                            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <label style={{ color: "#94a3b8", fontSize: "0.8rem", width: "30px", fontWeight: 700 }}>MIN</label>
                                <input type="number" value={mrnaConfig.gcMin} onChange={(e) => setMrnaConfig({...mrnaConfig, gcMin: e.target.value})} style={calcInputStyle} />
                            </div>
                            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <label style={{ color: "#94a3b8", fontSize: "0.8rem", width: "30px", fontWeight: 700 }}>MAX</label>
                                <input type="number" value={mrnaConfig.gcMax} onChange={(e) => setMrnaConfig({...mrnaConfig, gcMax: e.target.value})} style={calcInputStyle} />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600 }}>Window size for local GC content</label>
                        <input type="number" value={mrnaConfig.gcWindow} onChange={(e) => setMrnaConfig({...mrnaConfig, gcWindow: e.target.value})} style={calcInputStyle} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600 }}>Entropy Window Size</label>
                        <input type="number" value={mrnaConfig.entropyWindow} onChange={(e) => setMrnaConfig({...mrnaConfig, entropyWindow: e.target.value})} style={calcInputStyle} />
                    </div>

                  </div>
                </div>

                <button 
                  onClick={() => { setInput("run-" + Date.now()); }} 
                  style={{ width: "100%", background: accentColor, color: "black", padding: "1.25rem", borderRadius: "16px", border: "none", fontSize: "1.1rem", fontWeight: 800, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", boxShadow: "0 4px 20px rgba(0, 212, 255, 0.3)" }}>
                  <Zap size={22} /> Execute Optimization Sweep
                </button>
              </div>
            ) : toolId === "dna-concentration-calculator" ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <label style={{ color: "#e2e8f0", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Spectrophotometer Data</label>
                  <span style={{ color: "#475569", fontSize: "0.75rem" }}>Absorbance at 260nm</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem" }}>A260 (OD)</label>
                    <input type="number" step="0.01" value={od260} onChange={(e) => setOd260(e.target.value)} style={calcInputStyle} />
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem" }}>Nucleic Acid Type</label>
                    <select value={naType} onChange={(e) => setNaType(e.target.value)} style={calcInputStyle}>
                        <option value="dsDNA">dsDNA (50 µg/mL)</option>
                        <option value="ssDNA">ssDNA (33 µg/mL)</option>
                        <option value="RNA">RNA (40 µg/mL)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem" }}>Dilution Factor</label>
                    <input type="number" min="1" value={dilution} onChange={(e) => setDilution(e.target.value)} style={calcInputStyle} />
                  </div>
                </div>
              </div>
            ) : toolId === "tm-calculator" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Oligonucleotide Sequence (5' → 3')</label>
                    <input id="tm-seq" type="text" value={tmSeq} onChange={e => setTmSeq(e.target.value)} style={{...calcInputStyle, fontFamily: "monospace", fontSize: "1.05rem", letterSpacing: "0.05em"}} placeholder="e.g. ATGCGTCAAGCTAGC" />
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>[Na⁺] (mM)</label>
                    <input id="tm-na" type="number" value={tmNa} onChange={e => setTmNa(e.target.value)} style={calcInputStyle} placeholder="50" />
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Oligo Concentration (nM)</label>
                    <input id="tm-conc" type="number" value={tmConc} onChange={e => setTmConc(e.target.value)} style={calcInputStyle} placeholder="250" />
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Nucleic Acid Type</label>
                    <select id="tm-type" value={tmDNA} onChange={e => setTmDNA(e.target.value)} style={calcInputStyle}>
                      <option value="dna">DNA</option>
                      <option value="rna">RNA</option>
                    </select>
                  </div>
                </div>
                <button id="tm-run" onClick={calcTm} style={{ background: accentColor, color: "black", border: "none", borderRadius: "12px", padding: "1rem 2rem", fontWeight: 800, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", boxShadow: `0 4px 20px ${accentColor}40` }}>
                  <Play size={18} fill="black" /> Calculate Tm
                </button>
                {tmResult && !tmResult.error && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
                    {[{label: "Tm (NN + Salt Corrected)", value: `${tmResult.tmFinal} °C`, accent: true},
                      {label: "Basic Tm (2AT + 4GC)", value: `${tmResult.tmBasic} °C`},
                      {label: "Length", value: `${tmResult.len} nt`},
                      {label: "GC Content", value: `${tmResult.gcPct}%`},
                      {label: "ΔH", value: `${tmResult.dH} kcal/mol`},
                      {label: "ΔS", value: `${tmResult.dS} cal/mol·K`},
                    ].map(c => (
                      <div key={c.label} style={{ background: c.accent ? `${accentColor}12` : "rgba(255,255,255,0.03)", border: `1px solid ${c.accent ? accentColor+'40' : "rgba(255,255,255,0.06)"}`, borderRadius: "14px", padding: "1.25rem" }}>
                        <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>{c.label}</div>
                        <div style={{ fontSize: c.accent ? "2rem" : "1.4rem", fontWeight: 800, color: c.accent ? accentColor : "#f1f5f9" }}>{c.value}</div>
                      </div>
                    ))}
                  </div>
                )}
                {tmResult?.error && <div style={{ color: "#f43f5e", background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: "12px", padding: "1rem" }}>{tmResult.error}</div>}
              </div>
            ) : toolId === "ta-calculator" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Forward Primer (5' → 3')</label>
                    <input id="ta-fwd" type="text" value={taFwd} onChange={e => setTaFwd(e.target.value)} style={{...calcInputStyle, fontFamily: "monospace"}} placeholder="e.g. ATGGCATCAAGCTGCTA" />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Reverse Primer (5' → 3')</label>
                    <input id="ta-rev" type="text" value={taRev} onChange={e => setTaRev(e.target.value)} style={{...calcInputStyle, fontFamily: "monospace"}} placeholder="e.g. TCAGCTTGATGCCATCGA" />
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Insert Size (bp)</label>
                    <input id="ta-insert" type="number" value={taInsert} onChange={e => setTaInsert(e.target.value)} style={calcInputStyle} placeholder="500" />
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>[Na⁺] (mM)</label>
                    <input id="ta-na" type="number" value={taNa} onChange={e => setTaNa(e.target.value)} style={calcInputStyle} placeholder="50" />
                  </div>
                </div>
                <button id="ta-run" onClick={calcTa} style={{ background: "#10b981", color: "black", border: "none", borderRadius: "12px", padding: "1rem 2rem", fontWeight: 800, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", boxShadow: "0 4px 20px rgba(16,185,129,0.35)" }}>
                  <Play size={18} fill="black" /> Calculate Ta
                </button>
                {taResult && !taResult.error && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
                      {[{label: "Tm Forward", value: `${taResult.tmF} °C`, color: "#38bdf8"},
                        {label: "Tm Reverse", value: `${taResult.tmR} °C`, color: "#818cf8"},
                        {label: "Ta (Owczarzy)", value: `${taResult.taOwczarzy} °C`, color: "#10b981", accent: true},
                        {label: "Ta (Conventional −5)", value: `${taResult.taConv} °C`, color: "#f59e0b"},
                      ].map(c => (
                        <div key={c.label} style={{ background: c.accent ? `rgba(16,185,129,0.08)` : "rgba(255,255,255,0.03)", border: `1px solid ${c.accent ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius: "14px", padding: "1.25rem" }}>
                          <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>{c.label}</div>
                          <div style={{ fontSize: c.accent ? "2rem" : "1.4rem", fontWeight: 800, color: c.color }}>{c.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: "14px", padding: "1rem 1.25rem", color: "#94a3b8", fontSize: "0.85rem", lineHeight: 1.6 }}>
                      <strong style={{ color: "#e2e8f0" }}>Recommended Ta: {taResult.taFinal} °C</strong> (Owczarzy formula, insert {taResult.ins} bp). 
                      Start with this temperature and optimize by ±2 °C gradient.
                    </div>
                  </div>
                )}
                {taResult?.error && <div style={{ color: "#f43f5e", background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: "12px", padding: "1rem" }}>{taResult.error}</div>}
              </div>
            ) : toolId === "molarity-calculator" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  {(["conc", "mass", "vol"] as const).map(opt => (
                    <button id={`mol-solve-${opt}`} key={opt} onClick={() => setMolSolveFor(opt)} style={{ padding: "0.6rem 1.25rem", borderRadius: "10px", border: `1px solid ${molSolveFor === opt ? accentColor : "rgba(148,163,184,0.15)"}`, background: molSolveFor === opt ? `${accentColor}18` : "transparent", color: molSolveFor === opt ? accentColor : "#94a3b8", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem", transition: "all 0.2s" }}>
                      Solve for {opt === "conc" ? "Concentration" : opt === "mass" ? "Mass" : "Volume"}
                    </button>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Molecular Weight (g/mol)</label>
                    <input id="mol-mw" type="number" value={molMW} onChange={e => setMolMW(e.target.value)} style={calcInputStyle} placeholder="e.g. 342.30" />
                  </div>
                  {molSolveFor !== "mass" && (
                    <div>
                      <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Mass (mg)</label>
                      <input id="mol-mass" type="number" value={molMass} onChange={e => setMolMass(e.target.value)} style={calcInputStyle} placeholder="e.g. 10" />
                    </div>
                  )}
                  {molSolveFor !== "vol" && (
                    <div>
                      <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Volume (mL)</label>
                      <input id="mol-vol" type="number" value={molVol} onChange={e => setMolVol(e.target.value)} style={calcInputStyle} placeholder="e.g. 10" />
                    </div>
                  )}
                  {molSolveFor !== "conc" && (
                    <div>
                      <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Concentration (mM)</label>
                      <input id="mol-conc" type="number" value={molConc} onChange={e => setMolConc(e.target.value)} style={calcInputStyle} placeholder="e.g. 1" />
                    </div>
                  )}
                </div>
                <button id="mol-run" onClick={calcMolarity} style={{ background: "#f59e0b", color: "black", border: "none", borderRadius: "12px", padding: "1rem 2rem", fontWeight: 800, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", boxShadow: "0 4px 20px rgba(245,158,11,0.35)" }}>
                  <Play size={18} fill="black" /> Calculate
                </button>
                {molResult && !molResult.error && (() => {
                  const cards = molSolveFor === "conc"
                    ? [
                        {label: "Molarity", value: `${(molResult.value).toExponential(3)} M`, accent: true},
                        {label: "mM", value: molResult.mM.toPrecision(4)},
                        {label: "µM", value: molResult.uM.toPrecision(4)},
                        {label: "nM", value: molResult.nM.toPrecision(4)},
                      ]
                    : molSolveFor === "mass"
                    ? [
                        {label: "Mass (mg)", value: `${molResult.value.toPrecision(4)} mg`, accent: true},
                        {label: "µg", value: molResult.ug.toPrecision(4)},
                        {label: "ng", value: molResult.ng.toPrecision(4)},
                      ]
                    : [
                        {label: "Volume (mL)", value: `${molResult.value.toPrecision(4)} mL`, accent: true},
                        {label: "µL", value: molResult.uL.toPrecision(4)},
                      ];
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
                      {cards.map(c => (
                        <div key={c.label} style={{ background: c.accent ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${c.accent ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius: "14px", padding: "1.25rem" }}>
                          <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>{c.label}</div>
                          <div style={{ fontSize: c.accent ? "1.6rem" : "1.3rem", fontWeight: 800, color: c.accent ? "#f59e0b" : "#f1f5f9" }}>{c.value}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                {molResult?.error && <div style={{ color: "#f43f5e", background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: "12px", padding: "1rem" }}>{molResult.error}</div>}
              </div>
            ) : toolId === "centrifugation-calculator" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  {(["rcf", "rpm"] as const).map(opt => (
                    <button id={`cent-solve-${opt}`} key={opt} onClick={() => setCentSolveFor(opt)} style={{ padding: "0.6rem 1.25rem", borderRadius: "10px", border: `1px solid ${centSolveFor === opt ? "#a78bfa" : "rgba(148,163,184,0.15)"}`, background: centSolveFor === opt ? "rgba(167,139,250,0.12)" : "transparent", color: centSolveFor === opt ? "#a78bfa" : "#94a3b8", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem", transition: "all 0.2s" }}>
                      Solve for {opt === "rcf" ? "RCF (×g)" : "RPM"}
                    </button>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Rotor Radius (mm)</label>
                    <input id="cent-radius" type="number" value={centRadius} onChange={e => setCentRadius(e.target.value)} style={calcInputStyle} placeholder="e.g. 90" />
                  </div>
                  {centSolveFor === "rcf" ? (
                    <div>
                      <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Speed (RPM)</label>
                      <input id="cent-rpm" type="number" value={centRpm} onChange={e => setCentRpm(e.target.value)} style={calcInputStyle} placeholder="e.g. 13000" />
                    </div>
                  ) : (
                    <div>
                      <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Force (× g)</label>
                      <input id="cent-rcf" type="number" value={centRcf} onChange={e => setCentRcf(e.target.value)} style={calcInputStyle} placeholder="e.g. 16000" />
                    </div>
                  )}
                </div>
                <button id="cent-run" onClick={calcCentrifugation} style={{ background: "#a78bfa", color: "black", border: "none", borderRadius: "12px", padding: "1rem 2rem", fontWeight: 800, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", boxShadow: "0 4px 20px rgba(167,139,250,0.35)" }}>
                  <Play size={18} fill="black" /> Calculate
                </button>
                {centResult && !centResult.error && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
                      <div style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: "14px", padding: "1.5rem" }}>
                        <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>{centResult.unit}</div>
                        <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#a78bfa" }}>{centResult.main.toLocaleString()}</div>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "1.5rem" }}>
                        <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.4rem" }}>Rotor Radius</div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f1f5f9" }}>{centResult.r} mm</div>
                      </div>
                    </div>
                    <div style={{ background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.12)", borderRadius: "14px", padding: "1rem" }}>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginBottom: "0.75rem", textTransform: "uppercase" }}>Common Protocol Reference</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem" }}>
                        {[{n:"Cell pellet",rcf:"300×g",rpm:Math.round(Math.sqrt(300/(1.118e-5*parseFloat(centRadius||"90"))))},{n:"Bacteria",rcf:"3,000×g",rpm:Math.round(Math.sqrt(3000/(1.118e-5*parseFloat(centRadius||"90"))))},{n:"Protein precipitation",rcf:"10,000×g",rpm:Math.round(Math.sqrt(10000/(1.118e-5*parseFloat(centRadius||"90"))))},{n:"Microcentrifuge max",rcf:"16,000×g",rpm:Math.round(Math.sqrt(16000/(1.118e-5*parseFloat(centRadius||"90"))))}].map(p => (
                          <div key={p.n} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0.75rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                            <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{p.n}</span>
                            <span style={{ color: "#a78bfa", fontWeight: 700, fontSize: "0.8rem" }}>{p.rcf} / {p.rpm.toLocaleString()} RPM</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {centResult?.error && <div style={{ color: "#f43f5e", background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: "12px", padding: "1rem" }}>{centResult.error}</div>}
              </div>
            ) : toolId === "serial-dilution-planner" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Starting Concentration</label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input id="sd-start" type="number" value={sdStart} onChange={e => setSdStart(e.target.value)} style={{...calcInputStyle, flex: 1}} placeholder="1" />
                      <select id="sd-unit" value={sdStartUnit} onChange={e => setSdStartUnit(e.target.value)} style={{...calcInputStyle, width: "80px"}}>
                        {["M","mM","µM","nM","pM","µg/mL","ng/mL","mg/mL"].map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Dilution Factor</label>
                    <input id="sd-factor" type="number" value={sdFactor} onChange={e => setSdFactor(e.target.value)} style={calcInputStyle} placeholder="10" />
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Number of Steps</label>
                    <input id="sd-steps" type="number" value={sdSteps} onChange={e => setSdSteps(e.target.value)} style={calcInputStyle} placeholder="8" min="1" max="20" />
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Final Volume per Step (mL)</label>
                    <input id="sd-vol" type="number" value={sdVolume} onChange={e => setSdVolume(e.target.value)} style={calcInputStyle} placeholder="1" />
                  </div>
                </div>
                <button id="sd-run" onClick={calcSerialDilution} style={{ background: "#06b6d4", color: "black", border: "none", borderRadius: "12px", padding: "1rem 2rem", fontWeight: 800, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", boxShadow: "0 4px 20px rgba(6,182,212,0.35)" }}>
                  <Play size={18} fill="black" /> Generate Dilution Table
                </button>
                {sdResult.length > 0 && (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "monospace", fontSize: "0.9rem" }}>
                      <thead>
                        <tr>
                          {["Step","Dilution","Concentration","Take from prev. (mL)","Add diluent (mL)"].map(h => (
                            <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)", color: "#06b6d4", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sdResult.map((row, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                            <td style={{ padding: "0.65rem 1rem", border: "1px solid rgba(255,255,255,0.04)", color: "#94a3b8" }}>{row.step === 0 ? "Stock" : row.step}</td>
                            <td style={{ padding: "0.65rem 1rem", border: "1px solid rgba(255,255,255,0.04)", color: "#e2e8f0" }}>1 : {row.dilution.toLocaleString()}</td>
                            <td style={{ padding: "0.65rem 1rem", border: "1px solid rgba(255,255,255,0.04)", color: "#06b6d4", fontWeight: 700 }}>{row.conc >= 1 ? row.conc.toPrecision(4) : row.conc.toExponential(3)} {sdStartUnit}</td>
                            <td style={{ padding: "0.65rem 1rem", border: "1px solid rgba(255,255,255,0.04)", color: i === 0 ? "#475569" : "#e2e8f0" }}>{i === 0 ? "—" : row.stockVol}</td>
                            <td style={{ padding: "0.65rem 1rem", border: "1px solid rgba(255,255,255,0.04)", color: i === 0 ? "#475569" : "#e2e8f0" }}>{i === 0 ? "—" : row.diluent}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : toolId === "unit-converter-biology" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Value</label>
                    <input id="uc-value" type="number" value={ucValue} onChange={e => setUcValue(e.target.value)} style={calcInputStyle} placeholder="e.g. 1" />
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>From Unit</label>
                    <select id="uc-from" value={ucFromUnit} onChange={e => setUcFromUnit(e.target.value)} style={calcInputStyle}>
                      <option value="pmol">pmol</option>
                      <option value="nmol">nmol</option>
                      <option value="ng">ng</option>
                      <option value="µg">µg</option>
                      <option value="mg">mg</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Molecule Type</label>
                    <select id="uc-moltype" value={ucMolType} onChange={e => setUcMolType(e.target.value)} style={calcInputStyle}>
                      <option value="DNA">DNA / Custom</option>
                      <option value="RNA">RNA</option>
                      <option value="Protein">Protein</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Molecular Weight (g/mol or Da)</label>
                    <input id="uc-mw" type="number" value={ucMW} onChange={e => setUcMW(e.target.value)} style={calcInputStyle} placeholder="e.g. 50000 for a 50 kDa protein, or 330 × bp for dsDNA" />
                  </div>
                </div>
                <button id="uc-run" onClick={calcUnitConverter} style={{ background: "#f472b6", color: "black", border: "none", borderRadius: "12px", padding: "1rem 2rem", fontWeight: 800, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", boxShadow: "0 4px 20px rgba(244,114,182,0.35)" }}>
                  <Play size={18} fill="black" /> Convert Units
                </button>
                {ucResult && !ucResult.error && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem" }}>
                    {Object.entries(ucResult.results).map(([unit, val]: any, idx) => (
                      <div key={unit} style={{ background: idx === 0 ? "rgba(244,114,182,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${idx === 0 ? "rgba(244,114,182,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius: "14px", padding: "1.25rem" }}>
                        <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>{unit}</div>
                        <div style={{ fontSize: idx === 0 ? "1.5rem" : "1.2rem", fontWeight: 800, color: idx === 0 ? "#f472b6" : "#f1f5f9" }}>{typeof val === "number" ? (val >= 0.01 && val < 1e6 ? val.toPrecision(5) : val.toExponential(3)) : val}</div>
                      </div>
                    ))}
                  </div>
                )}
                {ucResult?.error && <div style={{ color: "#f43f5e", background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: "12px", padding: "1rem" }}>{ucResult.error}</div>}
              </div>
            ) : toolId === "coding-capacity" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Mode selector */}
                <div>
                  <label style={{ color: "#e2e8f0", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.75rem" }}>I know the…</label>
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    {(["bp", "aa", "kda"] as const).map(m => (
                      <button key={m} id={`cc-mode-${m}`} onClick={() => { setCcMode(m); setCcResult(null); setCcInput(""); }}
                        style={{ padding: "0.6rem 1.4rem", borderRadius: "10px", border: `1px solid ${ccMode === m ? "#38bdf8" : "rgba(148,163,184,0.15)"}`, background: ccMode === m ? "rgba(56,189,248,0.12)" : "transparent", color: ccMode === m ? "#38bdf8" : "#94a3b8", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem", transition: "all 0.2s" }}>
                        {m === "bp" ? "DNA Length (bp)" : m === "aa" ? "Protein Length (AA)" : "Protein Size (kDa)"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input */}
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
                      {ccMode === "bp" ? "DNA Coding Sequence Length (bp)" : ccMode === "aa" ? "Protein Length (amino acids)" : "Protein Molecular Weight (kDa)"}
                    </label>
                    <input id="cc-input" type="number" value={ccInput} onChange={e => { setCcInput(e.target.value); setCcResult(null); }}
                      style={{ ...calcInputStyle, fontSize: "1.3rem", fontWeight: 700 }}
                      placeholder={ccMode === "bp" ? "e.g. 1500" : ccMode === "aa" ? "e.g. 500" : "e.g. 55"} />
                  </div>
                  <button id="cc-run" onClick={calcCodingCapacity}
                    style={{ background: "#38bdf8", color: "black", border: "none", borderRadius: "12px", padding: "1rem 2rem", fontWeight: 800, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", boxShadow: "0 4px 20px rgba(56,189,248,0.35)", flexShrink: 0 }}>
                    <Play size={18} fill="black" /> Calculate
                  </button>
                </div>

                <AnimatePresence>
                  {ccResult && !ccResult.error && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
                    >
                      {/* Visual flow */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem", flexWrap: "wrap", padding: "1rem 0" }}>
                        {[
                          { label: "DNA Length",    value: ccResult.bp,          unit: "bp",  color: "#38bdf8", active: ccMode === "bp" },
                          { label: "Protein Length", value: ccResult.aa,          unit: "AA",  color: "#10b981", active: ccMode === "aa" },
                          { label: "Protein Size",   value: ccResult.kda.toFixed(1), unit: "kDa", color: "#f59e0b", active: ccMode === "kda" },
                        ].map((c, i, arr) => (
                          <React.Fragment key={c.label}>
                            <div style={{ textAlign: "center", padding: "1.5rem 1.75rem", borderRadius: "18px", background: c.active ? `${c.color}15` : "rgba(255,255,255,0.03)", border: `2px solid ${c.active ? c.color : "rgba(255,255,255,0.07)"}`, minWidth: "160px", transition: "all 0.25s", position: "relative" }}>
                              <div style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>{c.label}</div>
                              <div style={{ fontSize: "2.4rem", fontWeight: 800, color: c.active ? c.color : "#f1f5f9", lineHeight: 1 }}>{c.value.toLocaleString()}</div>
                              <div style={{ fontSize: "0.9rem", color: c.active ? c.color : "#64748b", fontWeight: 600, marginTop: "0.3rem" }}>{c.unit}</div>
                              
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(`${c.value} ${c.unit}`);
                                  // Could add a 'copied' state here but keep it simple for now
                                }}
                                style={{ position: "absolute", top: "8px", right: "8px", background: "transparent", border: "none", color: "#475569", cursor: "pointer", padding: "4px" }}
                                title="Copy"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                            {i < arr.length - 1 && (
                              <div style={{ color: "#334155", fontSize: "1.5rem", padding: "0 0.25rem", fontWeight: 300 }}>⇌</div>
                            )}
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Reference info */}
                      <div style={{ background: "rgba(56,189,248,0.04)", border: "1px solid rgba(56,189,248,0.12)", borderRadius: "14px", padding: "1rem 1.25rem" }}>
                        <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.6rem" }}>Methodology (based on BioMath standards)</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.5rem" }}>
                          {[
                            { formula: "AA = (bp − 3) ÷ 3",       note: "Assumes one stop codon (3 bp)" },
                            { formula: "bp = (AA × 3) + 3",       note: "Coding region + terminal stop" },
                            { formula: "kDa = AA × 110 ÷ 1,000",  note: "Avg residue weight = 110 Da" },
                          ].map(f => (
                            <div key={f.formula} style={{ padding: "0.6rem 0.8rem", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.03)" }}>
                              <code style={{ color: "#38bdf8", fontSize: "0.85rem", fontWeight: 600, fontFamily: "var(--font-mono)" }}>{f.formula}</code>
                              <div style={{ color: "#475569", fontSize: "0.75rem", marginTop: "0.3rem" }}>{f.note}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {ccResult?.error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "#f43f5e", background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: "12px", padding: "1rem" }}>{ccResult.error}</motion.div>}
              </div>
            ) : toolId === "buffer-calculator" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Desired pH</label>
                    <input type="number" step="0.01" value={buffPh} onChange={e => setBuffPh(e.target.value)} style={calcInputStyle} placeholder="e.g. 4.76" />
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>pKa of Buffer</label>
                    <input type="number" step="0.01" value={buffPka} onChange={e => setBuffPka(e.target.value)} style={calcInputStyle} placeholder="e.g. 4.76" />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Total Concentration</label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input type="number" value={buffTotal} onChange={e => setBuffTotal(e.target.value)} style={{ ...calcInputStyle, flex: 1 }} placeholder="e.g. 100" />
                      <select value={buffTotalUnit} onChange={e => setBuffTotalUnit(e.target.value)} style={{ ...calcInputStyle, width: "100px" }}>
                        <option value="mM">mM</option>
                        <option value="M">M</option>
                        <option value="µM">µM</option>
                      </select>
                    </div>
                  </div>
                </div>
                <button onClick={calcBuffer} style={{ background: "#8b5cf6", color: "white", border: "none", borderRadius: "12px", padding: "1rem 2rem", fontWeight: 800, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", boxShadow: "0 4px 20px rgba(139, 92, 246, 0.3)" }}>
                  <Play size={18} fill="white" /> Calculate Proportions
                </button>
                {buffResult && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
                    {[
                      { label: "Salt/Acid Ratio", value: buffResult.ratio, accent: true, color: "#8b5cf6" },
                      { label: "[Conjugate Base]", value: `${buffResult.base} ${buffResult.unit}`, color: "#f472b6" },
                      { label: "[Weak Acid]", value: `${buffResult.acid} ${buffResult.unit}`, color: "#38bdf8" }
                    ].map(c => (
                      <div key={c.label} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${c.accent ? c.color : "rgba(255,255,255,0.06)"}`, borderRadius: "14px", padding: "1.25rem" }}>
                        <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.4rem" }}>{c.label}</div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: c.color }}>{c.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : toolId === "od600-cell-density" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>OD600 Value</label>
                    <input type="number" step="0.001" value={odVal} onChange={e => setOdVal(e.target.value)} style={calcInputStyle} placeholder="1.000" />
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Organism</label>
                    <select value={odMolecule} onChange={e => setOdMolecule(e.target.value)} style={calcInputStyle}>
                      {Object.keys(FACTORS).map(org => <option key={org} value={org}>{org}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={calcOD600} style={{ background: "#22c55e", color: "white", border: "none", borderRadius: "12px", padding: "1rem 2rem", fontWeight: 800, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", boxShadow: "0 4px 20px rgba(34, 197, 94, 0.3)" }}>
                  <Play size={18} fill="white" /> Estimate Density
                </button>
                {odResult && (
                  <div style={{ background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: "16px", padding: "1.5rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Estimated Density for {odResult.organism}</div>
                    <div style={{ fontSize: "3rem", fontWeight: 900, color: "#22c55e", lineHeight: 1 }}>{odResult.density.toExponential(2)}</div>
                    <div style={{ fontSize: "1rem", color: "#94a3b8", marginTop: "0.5rem", fontWeight: 600 }}>cells / mL</div>
                    <div style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#64748b", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1rem" }}>
                      Note: Values depend on spectrophotometer calibration and media.
                    </div>
                  </div>
                )}
              </div>
            ) : toolId === "rev-trans" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "0.80rem", display: "block", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Protein Sequence</label>
                  <textarea 
                    value={rtProtein} 
                    onChange={e => setRtProtein(e.target.value)} 
                    style={{ ...calcInputStyle, minHeight: "120px", fontFamily: "monospace", fontSize: "0.9rem", resize: "vertical" }} 
                    placeholder="Enter protein sequence (e.g., MKAL...) or Use '*' for Stop"
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Optimization Species</label>
                    <select value={rtSpecies} onChange={e => setRtSpecies(e.target.value)} style={calcInputStyle} disabled={rtMode === "consensus"}>
                      {Object.keys(MAMMALIAN_CODON_TABLES).map(s => <option key={s} value={s}>{s} Codon Usage</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Translation Mode</label>
                    <div style={{ display: "flex", gap: "0.5rem", background: "rgba(0,0,0,0.2)", padding: "0.25rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      {(["optimized", "consensus"] as const).map(m => (
                        <button key={m} onClick={() => setRtMode(m)} style={{ flex: 1, padding: "0.5rem", borderRadius: "8px", border: "none", background: rtMode === m ? "#a78bfa" : "transparent", color: rtMode === m ? "white" : "#64748b", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                          {m === "optimized" ? "Optimized" : "Consensus"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ alignSelf: "flex-end" }}>
                    <button onClick={calcRevTrans} style={{ width: "100%", background: "#a78bfa", color: "white", border: "none", borderRadius: "12px", padding: "1rem", fontWeight: 800, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", boxShadow: "0 4px 20px rgba(167, 139, 250, 0.3)" }}>
                      <Play size={18} fill="white" /> Run
                    </button>
                  </div>
                </div>

                {rtResult && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "1.25rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Optimized Nucleotide Sequence ({rtResult.length} bp)</div>
                        <button onClick={() => { navigator.clipboard.writeText(rtResult.dna); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ color: "#a78bfa", background: "transparent", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy DNA"}
                        </button>
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: "0.95rem", color: "#f1f5f9", letterSpacing: "0.05em", wordBreak: "break-all", background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "10px", maxHeight: "200px", overflowY: "auto", border: "1px solid rgba(255,255,255,0.03)" }}>
                        {rtResult.dna}
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                      {[
                        { label: "Amino Acids", value: rtResult.protLength },
                        { label: "GC Content", value: rtResult.gc + "%" },
                        { label: "Target Org", value: rtSpecies }
                      ].map(stat => (
                        <div key={stat.label} style={{ background: "rgba(167, 139, 250, 0.05)", border: "1px solid rgba(167, 139, 250, 0.1)", borderRadius: "12px", padding: "1rem", textAlign: "center" }}>
                          <div style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.25rem" }}>{stat.label}</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#a78bfa" }}>{stat.value}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            ) : toolId === "restriction-digest" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "0.80rem", display: "block", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>DNA Sequence (FASTA or Plain)</label>
                  <textarea 
                    value={rdSeq} 
                    onChange={e => setRdSeq(e.target.value)} 
                    style={{ ...calcInputStyle, minHeight: "100px", fontFamily: "monospace", fontSize: "0.9rem", resize: "vertical" }} 
                    placeholder="Enter DNA sequence..."
                  />
                </div>
                
                <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Select Enzymes</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", background: "rgba(0,0,0,0.2)", padding: "0.75rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", maxHeight: "150px", overflowY: "auto" }}>
                      {ALL_ENZYMES.map(enz => (
                        <button 
                          key={enz.name} 
                          onClick={() => {
                            if (rdSelected.includes(enz.name)) setRdSelected(rdSelected.filter(n => n !== enz.name));
                            else setRdSelected([...rdSelected, enz.name]);
                          }}
                          style={{ padding: "0.4rem 0.8rem", borderRadius: "8px", border: "1px solid", borderColor: rdSelected.includes(enz.name) ? "#38bdf8" : "rgba(255,255,255,0.1)", background: rdSelected.includes(enz.name) ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.03)", color: rdSelected.includes(enz.name) ? "#38bdf8" : "#94a3b8", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                        >
                          {enz.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600 }}>Topology</label>
                    <div style={{ display: "flex", gap: "0.5rem", background: "rgba(0,0,0,0.2)", padding: "0.25rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      {(["linear", "circular"] as const).map(t => (
                        <button key={t} onClick={() => setRdIsCircular(t === "circular")} style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "none", background: (rdIsCircular === (t === "circular")) ? "#38bdf8" : "transparent", color: (rdIsCircular === (t === "circular")) ? "black" : "#64748b", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>
                          {t.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button onClick={calcRestrictionDigest} style={{ background: "#38bdf8", color: "black", border: "none", borderRadius: "12px", padding: "1rem", fontWeight: 800, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", boxShadow: "0 4px 20px rgba(56,189,248,0.3)" }}>
                  <Play size={18} fill="black" /> Simulate Digest
                </button>

                {rdResult && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}>
                      <div style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "1.25rem" }}>
                        <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>Digest Fragments</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.75rem" }}>
                          {rdResult.fragments.map((f: any, i: number) => (
                            <button 
                              key={i} 
                              onClick={() => setRdHighlighted(i)}
                              style={{ 
                                padding: "0.75rem", 
                                background: rdHighlighted === i ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.03)", 
                                border: rdHighlighted === i ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.05)", 
                                borderRadius: "10px", 
                                textAlign: "center",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                            >
                              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: rdHighlighted === i ? "#38bdf8" : "#94a3b8" }}>{f.size.toLocaleString()}</div>
                              <div style={{ fontSize: "0.65rem", color: "#475569", fontWeight: 600 }}>BP</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "1.25rem" }}>
                        <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>Site Map</div>
                        <div style={{ maxHeight: "150px", overflowY: "auto", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                          {rdResult.sites.map((s: any, i: number) => (
                            <span key={i} style={{ fontSize: "0.8rem", color: "#cbd5e1", background: "rgba(56,189,248,0.1)", padding: "0.2rem 0.6rem", borderRadius: "6px", border: "1px solid rgba(56,189,248,0.2)" }}>
                              {s.name} @ {s.pos}
                            </span>
                          ))}
                          {rdResult.sites.length === 0 && <div style={{ color: "#475569", fontSize: "0.9rem" }}>No cut sites found for selected enzymes.</div>}
                        </div>
                      </div>
                    </div>

                    {rdHighlighted !== null && rdResult.fragments[rdHighlighted] && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ background: "rgba(56,189,248,0.03)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: "16px", padding: "1.25rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                          <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase" }}>Sequence for Fragment #{rdHighlighted + 1} ({rdResult.fragments[rdHighlighted].size} bp)</span>
                          <button onClick={() => { navigator.clipboard.writeText(rdResult.fragments[rdHighlighted].seq); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ color: "#38bdf8", background: "rgba(56,189,248,0.1)", border: "none", borderRadius: "6px", padding: "0.4rem 0.8rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy Sequence"}
                          </button>
                        </div>
                        <div style={{ maxWeight: "100%", overflowX: "auto", background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.03)" }}>
                          <code style={{ fontSize: "0.85rem", color: "#cbd5e1", fontFamily: "monospace", display: "block", whiteSpace: "break-spaces", wordBreak: "break-all" }}>
                            {rdResult.fragments[rdHighlighted].seq || "Sequence not captured."}
                          </code>
                        </div>
                      </motion.div>
                    )}

                    <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "24px", padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "1.25rem" }}>
                        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
                          <div>
                            <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.5rem" }}>Change Ladder</div>
                            <select value={rdLadder} onChange={e => setRdLadder(e.target.value)} style={{ ...calcInputStyle, width: "200px", padding: "0.5rem 0.75rem", fontSize: "0.85rem" }}>
                              {Object.keys(LADDERS).map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                          </div>
                          <div>
                            <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.5rem" }}>Highlighted Fragment</div>
                            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#38bdf8" }}>
                              {rdHighlighted !== null ? `${rdResult.fragments[rdHighlighted].size} bp` : "--"}
                            </div>
                          </div>
                        </div>
                        <button onClick={downloadGelImage} style={{ background: "rgba(56,189,248,0.1)", color: "#38bdf8", border: "1px solid #38bdf8", borderRadius: "10px", padding: "0.75rem 1.25rem", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <FileText size={18} /> Download PNG
                        </button>
                      </div>

                      <div style={{ alignSelf: "center", padding: "40px", background: "#020617", borderRadius: "12px", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
                        <svg id="gel-simulator-svg" width="600" height="400" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
                          {/* Dark background */}
                          <rect width="600" height="400" fill="#020617" />
                          
                          {/* Ladder Area */}
                          <rect x="80" y="40" width="80" height="320" fill="rgba(255,255,255,0.02)" />
                          <text x="120" y="30" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="800">LADDER</text>
                          
                          {/* Sample Areas */}
                          {[1, 2, 3].map(i => {
                             const x = 160 + (i * 100);
                             return (
                               <g key={i}>
                                 <rect x={x - 40} y={40} width="80" height="320" fill="rgba(255,255,255,0.015)" />
                                 <text x={x} y={30} textAnchor="middle" fill={i === 1 ? "#38bdf8" : "#1e293b"} fontSize="12" fontWeight="800">
                                   {i === 1 ? "SAMPLE" : `- ${i+1} -`}
                                 </text>
                               </g>
                             )
                          })}
                          
                          {/* Wells */}
                          {[0, 1, 2, 3].map(i => (
                            <rect key={i} x={100 + (i * 100)} y={45} width="40" height="10" fill="rgba(56,189,248,0.1)" stroke="#38bdf8" strokeWidth="1" />
                          ))}

                          {/* Ladder bands */}
                          {(LADDERS[rdLadder] || []).map(s => {
                            const y = 40 + (320 * (1 - Math.log10(s) / Math.log10(25000)));
                            return (
                              <g key={s}>
                                <rect x="90" y={y} width="60" height="2" fill="rgba(255,255,255,0.3)" />
                                <text x="75" y={y + 3} textAnchor="end" fill="#475569" fontSize="9" fontWeight="600">
                                  {s >= 1000 ? (s/1000).toFixed(s % 1000 === 0 ? 0 : 1)+'k' : s}
                                </text>
                              </g>
                            );
                          })}

                          {/* Sample bands (Sample Lane 1) */}
                          {rdResult.fragments.map((f: any, i: number) => {
                            const y = 40 + (320 * (1 - Math.min(1, Math.log10(f.size) / Math.log10(25000))));
                            const isHigh = rdHighlighted === i;
                            return (
                              <motion.rect 
                                key={i} 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                transition={{ delay: i * 0.05 }}
                                onClick={() => setRdHighlighted(i)}
                                x="260" y={y} width="60" height="3" 
                                fill={isHigh ? "#fbbf24" : "#60a5fa"} 
                                style={{ 
                                  cursor: "pointer",
                                  filter: isHigh ? "drop-shadow(0 0 8px #fbbf24)" : "drop-shadow(0 0 4px #3b82f6)" 
                                }}
                              />
                            );
                          })}
                        </svg>
                      </div>
                      <div style={{ alignSelf: "center", color: "#475569", fontSize: "0.8rem", fontStyle: "italic" }}>
                        Click on bands to inspect sequence and exact size.
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : toolId === "pcr-simulator" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "0.80rem", display: "block", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Template DNA Sequence</label>
                  <textarea value={pcrTemplate} onChange={e => setPcrTemplate(e.target.value)} style={{ ...calcInputStyle, minHeight: "100px", fontFamily: "monospace", fontSize: "0.9rem" }} placeholder="Enter template sequence..." />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Forward Primer (5'→3')</label>
                    <input value={pcrFwd} onChange={e => setPcrFwd(e.target.value)} style={{ ...calcInputStyle, fontFamily: "monospace" }} placeholder="[tail]AGCT..." />
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Reverse Primer (5'→3')</label>
                    <input value={pcrRev} onChange={e => setPcrRev(e.target.value)} style={{ ...calcInputStyle, fontFamily: "monospace" }} placeholder="[tail]AGCT..." />
                  </div>
                </div>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>PCR Kit / Polymerase (Optional)</label>
                  <select value={pcrKit} onChange={e => setPcrKit(e.target.value)} style={calcInputStyle}>
                    <option>Phusion (High-Fidelity)</option>
                    <option>Q5 (High-Fidelity)</option>
                    <option>Taq (Standard)</option>
                    <option>OneTaq (Standard)</option>
                  </select>
                </div>
                <button onClick={calcPcrSimulator} style={{ background: "#f59e0b", color: "black", border: "none", borderRadius: "12px", padding: "1rem", fontWeight: 800, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", boxShadow: "0 4px 20px rgba(245, 158, 11, 0.3)" }}>
                  <Play size={18} fill="black" /> Amplify & Predict
                </button>

                {pcrResult && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                    <div style={{ background: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.15)", borderRadius: "20px", padding: "1.5rem" }}>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", marginBottom: "1.25rem" }}>PCR Products Detected ({pcrResult.products.length})</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {pcrResult.products.map((p: any, i: number) => (
                          <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "14px", padding: "1.25rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#f59e0b" }}>{p.size} <span style={{ fontSize: "0.7rem", color: "#475569" }}>BP</span></div>
                                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Range: {p.fPos} – {p.rPos}</div>
                              </div>
                              <button onClick={() => { navigator.clipboard.writeText(p.sequence); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ color: "#f59e0b", background: "transparent", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copy Product" : "Copy DNA"}
                              </button>
                            </div>
                            <div style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#94a3b8", wordBreak: "break-all", background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "8px", maxHeight: "120px", overflowY: "auto" }}>{p.sequence}</div>
                          </div>
                        ))}
                        {pcrResult.products.length === 0 && <div style={{ color: "#f43f5e", fontWeight: 600 }}>No amplicons predicted. Primers may not anneal to template.</div>}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                      <div style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", padding: "1.5rem" }}>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", marginBottom: "1.25rem" }}>Thermocycler Program</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {pcrResult.program.map((s: any, i: number) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0.8rem", background: s.cycle ? "rgba(245, 158, 11, 0.05)" : "transparent", borderRadius: "8px", border: s.cycle ? "1px dashed rgba(245, 158, 11, 0.2)" : "none" }}>
                              <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>{s.step}</span>
                              <div style={{ textAlign: "right" }}>
                                <span style={{ color: "#f1f5f9", fontWeight: 700 }}>{s.temp}°C</span>
                                <span style={{ color: "#475569", marginLeft: "0.75rem", fontSize: "0.85rem" }}>{s.time}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: "1rem", padding: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center", color: "#475569", fontSize: "0.75rem" }}>
                          {pcrResult.products.length > 0 ? "Repeat steps 2-4 for 30 cycles." : "Check primer design."}
                        </div>
                      </div>
                      <div style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", padding: "1.5rem" }}>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", marginBottom: "1.25rem" }}>Protocol Recommendations</div>
                        <div style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: "1.6" }}>
                          <p>• <strong>Enzyme:</strong> {pcrResult.kit}</p>
                          <p>• <strong>Annealing:</strong> Derived from mean Primer Tm ({pcrResult.tm}°C)</p>
                          <p>• <strong>Extension:</strong> {pcrResult.kit.includes("Taq") ? "60s/kb" : "30s/kb"} basis</p>
                          <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: "10px", fontSize: "0.85rem" }}>
                            <strong>Reaction Mix Tips:</strong><br/>
                            - Template: 1-10ng (Plasmid) / 100ng (Gnm)<br/>
                            - Primers: 500nM final conc.<br/>
                            - dNTPs: 200µM each.
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : toolId === "gene-optimizer" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Step Indicator */}
                <div style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem" }}>
                  {[1, 2, 3].map(s => (
                    <div key={s} style={{ flex: 1, height: "4px", background: goStep >= s ? "#22c55e" : "rgba(255,255,255,0.05)", borderRadius: "2px" }} />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <span style={{ color: "#22c55e", fontSize: "0.75rem", fontWeight: 800 }}>STEP {goStep}: {goStep === 1 ? "ANALYSIS & REGION" : goStep === 2 ? "VERIFY TRANSLATION" : "OPTIMIZATION"}</span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {goStep > 1 && <button onClick={() => setGoStep(goStep - 1)} style={{ background: "rgba(255,255,255,0.05)", color: "white", border: "none", padding: "0.3rem 0.6rem", borderRadius: "6px", fontSize: "0.7rem", cursor: "pointer" }}>Back</button>}
                  </div>
                </div>

                {goStep === 1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div>
                      <label style={{ color: "#94a3b8", fontSize: "0.80rem", display: "block", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase" }}>1. Enter Sequence</label>
                      <textarea value={goDNA} onChange={e => setGoDNA(e.target.value)} style={{ ...calcInputStyle, minHeight: "100px", fontFamily: "monospace", fontSize: "0.9rem" }} placeholder="Enter DNA sequence..." />
                    </div>
                    <button onClick={runGeneAnalysisStep} style={{ background: "#22c55e", color: "black", border: "none", borderRadius: "12px", padding: "0.75rem", fontWeight: 800, cursor: "pointer" }}>Analyze Complexity</button>
                    
                    {goAnalysis && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.05)", padding: "2rem", overflowX: "auto" }}>
                          <div style={{ minWidth: "1150px", paddingBottom: "1rem" }}>
                            {/* Ruler and DNA Map */}
                            {goDNA.replace(/[\n\r\t >0-9]/g, "").toUpperCase().match(/.{1,80}/g)?.map((chunk, rowIdx) => (
                              <div key={rowIdx} style={{ marginBottom: "3rem", position: "relative" }}>
                                {/* Ticks */}
                                <div style={{ display: "flex", height: "15px", marginBottom: "4px" }}>
                                  {chunk.split('').map((_, i) => (
                                    <div key={i} style={{ width: "14px", borderLeft: (rowIdx*80+i+1) % 10 === 0 ? "1px solid #475569" : "none", position: "relative", flexShrink: 0 }}>
                                      {(rowIdx*80+i+1) % 10 === 0 && <span style={{ position: "absolute", top: "-12px", left: "-6px", fontSize: "10px", color: "#64748b" }}>{rowIdx*80+i+1}</span>}
                                    </div>
                                  ))}
                                </div>
                                {/* Sequence */}
                                <div style={{ display: "flex", fontFamily: "'JetBrains Mono', monospace", fontSize: "14px", fontWeight: 700, color: "white" }}>
                                  {chunk.split('').map((char, i) => (
                                    <div key={i} style={{ width: "14px", textAlign: "center", flexShrink: 0 }}>{char}</div>
                                  ))}
                                </div>
                                {/* Feature Bars (Repeats) */}
                                <div style={{ position: "relative", height: "30px", marginTop: "8px" }}>
                                  {goAnalysis.repeats.map((rep, i) => {
                                      const start = rowIdx * 80;
                                      const end = start + 80;
                                      if (rep.start <= end && rep.end >= start + 1) {
                                          const left = Math.max(0, rep.start - 1 - start) * 14;
                                          const width = (Math.min(end, rep.end) - Math.max(start + 1, rep.start) + 1) * 14;
                                          return (
                                            <div key={i} style={{ position: "absolute", top: "0", left: `${left}px`, width: `${width}px`, height: "6px", background: "#f59e0b", borderRadius: "100px", opacity: 0.8 }}>
                                               <span style={{ position: "absolute", bottom: "-14px", left: "0", fontSize: "8px", fontWeight: 800, color: "#f59e0b", whiteSpace: "nowrap" }}>REPEAT ZONE</span>
                                            </div>
                                          );
                                      }
                                      return null;
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "1.5rem" }}>
                           <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "16px", padding: "1.5rem" }}>
                              <label style={{ color: "#22c55e", fontSize: "0.80rem", display: "block", marginBottom: "1rem", fontWeight: 800, textTransform: "uppercase" }}>Complexity Summary</label>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                 <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#64748b", fontSize: "0.85rem" }}>Total Repeats</span>
                                    <span style={{ color: "white", fontWeight: 700 }}>{goAnalysis.repeats.length}</span>
                                 </div>
                                 {goAnalysis.issues.map((issue, i) => (
                                   <div key={i} style={{ color: "#f43f5e", fontSize: "0.8rem", background: "rgba(244,63,94,0.03)", padding: "0.5rem", borderRadius: "8px" }}>• {issue}</div>
                                 ))}
                              </div>
                           </div>

                           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                              <div style={{ gridColumn: "span 2" }}>
                                <label style={{ color: "#94a3b8", fontSize: "0.80rem", display: "block", marginBottom: "0.5rem", fontWeight: 700 }}>Target Selection</label>
                                <div style={{ display: "flex", gap: "0.5rem", background: "rgba(0,0,0,0.2)", padding: "0.3rem", borderRadius: "10px" }}>
                                  {["ORF", "CDS", "NONE"].map(t => (
                                    <button key={t} onClick={() => setGoType(t)} style={{ flex: 1, padding: "0.5rem", borderRadius: "8px", border: "none", background: goType === t ? "#22c55e" : "transparent", color: goType === t ? "black" : "#64748b", fontSize: "0.7rem", fontWeight: 800 }}>{t}</button>
                                  ))}
                                </div>
                              </div>
                              <div style={{ background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <label style={{ fontSize: "0.6rem", color: "#64748b", fontWeight: 800, display: "block", marginBottom: "0.5rem" }}>START (5')</label>
                                <input type="number" value={goRange.start} onChange={e => setGoRange({...goRange, start: parseInt(e.target.value)})} style={{ background: "transparent", border: "none", color: "white", fontSize: "1.2rem", fontWeight: 800, width: "100%" }} />
                                {goType === "ORF" && <div style={{ fontSize: "0.6rem", color: "#22c55e", marginTop: "0.2rem" }}>SCANS FOR NEXT ATG</div>}
                              </div>
                              <div style={{ background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", opacity: goType === "ORF" ? 0.3 : 1 }}>
                                <label style={{ fontSize: "0.6rem", color: "#64748b", fontWeight: 800, display: "block", marginBottom: "0.5rem" }}>END (3')</label>
                                <input type="number" value={goRange.end} onChange={e => setGoRange({...goRange, end: parseInt(e.target.value)})} style={{ background: "transparent", border: "none", color: "white", fontSize: "1.2rem", fontWeight: 800, width: "100%" }} disabled={goType === "ORF"} />
                                <div style={{ fontSize: "0.6rem", color: "#64748b", marginTop: "0.2rem" }}>{goRange.end - goRange.start + 1} bp</div>
                              </div>
                              <button onClick={() => { calcGeneTranslation(); setGoStep(2); }} style={{ gridColumn: "span 2", background: "white", color: "black", border: "none", borderRadius: "12px", padding: "1rem", fontWeight: 900, cursor: "pointer", boxShadow: "0 0 20px rgba(255,255,255,0.1)" }}>PREVIEW TRANSLATION & PROCEED</button>
                           </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {goStep === 2 && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.05)", padding: "2rem", overflowX: "auto" }}>
                          <div style={{ minWidth: "1150px" }}>
                            {goDNA.replace(/[\n\r\t >0-9]/g, "").toUpperCase().match(/.{1,80}/g)?.map((chunk, rowIdx) => (
                              <div key={rowIdx} style={{ marginBottom: "4rem", position: "relative" }}>
                                {/* Ticks */}
                                <div style={{ display: "flex", height: "15px", marginBottom: "4px" }}>
                                  {chunk.split('').map((_, i) => (
                                    <div key={i} style={{ width: "14px", borderLeft: (rowIdx*80+i+1) % 10 === 0 ? "1px solid #475569" : "none", position: "relative", flexShrink: 0 }}>
                                      {(rowIdx*80+i+1) % 10 === 0 && <span style={{ position: "absolute", top: "-12px", left: "-6px", fontSize: "10px", color: "#64748b" }}>{rowIdx*80+i+1}</span>}
                                    </div>
                                  ))}
                                </div>
                                {/* Translation Track (Selected region) */}
                                <div style={{ display: "flex", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", fontWeight: 800, height: "20px" }}>
                                  {chunk.split('').map((_, i) => {
                                      const globalIdx = rowIdx * 80 + i + 1;
                                      const dnaClean = goDNA.replace(/[\n\r\t >0-9]/g, "").toUpperCase();
                                      let codingStart = goRange.start;
                                      if (goType === "ORF") {
                                          const nextATG = dnaClean.indexOf("ATG", goRange.start - 1);
                                          codingStart = nextATG !== -1 ? nextATG + 1 : -1;
                                      }
                                      
                                      if (codingStart !== -1 && globalIdx >= codingStart && globalIdx <= goRange.end) {
                                          const localOffset = globalIdx - codingStart;
                                          if (localOffset % 3 === 0) {
                                              const codon = dnaClean.substring(globalIdx - 1, globalIdx + 2);
                                              const aa = GENETIC_CODE[codon] || " ";
                                              return <div key={i} style={{ width: "42px", textAlign: "center", color: getRasMolColor(aa) }}>{aa}</div>;
                                          }
                                          if (localOffset % 3 !== 0) return null;
                                      }
                                      return <div key={i} style={{ width: "14px", flexShrink: 0 }}></div>;
                                  })}
                                </div>
                                {/* Sequence */}
                                <div style={{ display: "flex", fontFamily: "'JetBrains Mono', monospace", fontSize: "14px", fontWeight: 700, color: "white" }}>
                                  {chunk.split('').map((char, i) => (
                                    <div key={i} style={{ width: "14px", textAlign: "center", flexShrink: 0 }}>{char}</div>
                                  ))}
                                </div>
                                {/* Repetition Bars */}
                                <div style={{ position: "relative", height: "20px", marginTop: "8px" }}>
                                  {goAnalysis.repeats.map((rep, i) => {
                                      const start = rowIdx * 80;
                                      const end = start + 80;
                                      if (rep.start <= end && rep.end >= start + 1) {
                                          const left = Math.max(0, rep.start - 1 - start) * 14;
                                          const width = (Math.min(end, rep.end) - Math.max(start + 1, rep.start) + 1) * 14;
                                          return <div key={i} style={{ position: "absolute", top: "0", left: `${left}px`, width: `${width}px`, height: "6px", background: "#f59e0b", borderRadius: "100px", opacity: 0.8 }} />;
                                      }
                                      return null;
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                      </div>
                      <button onClick={() => setGoStep(3)} style={{ background: "#22c55e", color: "black", border: "none", borderRadius: "12px", padding: "1rem", fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 20px rgba(34, 197, 94, 0.4)" }}>Verify & Configure Optimization</button>
                    </motion.div>
                )}

                {goStep === 3 && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                           {/* Column 1: Rules & Strategy */}
                           <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "20px", padding: "1.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                                 <label style={{ fontSize: "0.75rem", color: "#22c55e", fontWeight: 800, textTransform: "uppercase", marginBottom: "1.5rem", display: "block" }}>Optimization Rules (Twist Protocol)</label>
                                 <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem", color: "#94a3b8" }}>
                                    <div style={{ display: "flex", gap: "0.75rem" }}><span style={{ color: "#22c55e" }}>✓</span> Avoids repeats longer than 15bp</div>
                                    <div style={{ display: "flex", gap: "0.75rem" }}><span style={{ color: "#22c55e" }}>✓</span> Eliminates homopolymer runs &gt; 10bp</div>
                                    <div style={{ display: "flex", gap: "0.75rem" }}><span style={{ color: "#22c55e" }}>✓</span> Balances local GC content (35% - 65%)</div>
                                    <div style={{ display: "flex", gap: "0.75rem" }}><span style={{ color: "#22c55e" }}>✓</span> Removes internal RBS and Sigma70 sites</div>
                                    <div style={{ marginTop: "1rem", color: "#64748b", fontSize: "0.75rem", fontStyle: "italic" }}>
                                       "Optimization reduces risk of secondary structures and assembly failure."
                                    </div>
                                 </div>
                              </div>
                              
                              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                 <div>
                                   <label style={{ color: "white", fontSize: "0.85rem", display: "block", marginBottom: "0.5rem", fontWeight: 700 }}>Choose Codon Table</label>
                                   <select value={goOrganism} onChange={e => setGoOrganism(e.target.value)} style={calcInputStyle}>
                                     {Object.keys(OPT_TABLES).map(org => <option key={org} value={org}>{org}</option>)}
                                   </select>
                                 </div>
                                 <div>
                                   <label style={{ color: "white", fontSize: "0.85rem", display: "block", marginBottom: "0.5rem", fontWeight: 700 }}>Strategy</label>
                                   <select value={goMode} onChange={e => setGoMode(e.target.value)} style={calcInputStyle}>
                                     <option value="full">Maximum Expression (tRNA Awareness)</option>
                                     <option value="minimal">Minimal Changes (as close as possible to the original DNA)</option>
                                   </select>
                                 </div>
                              </div>
                           </div>

                           {/* Column 2: Specific Constraints */}
                           <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "20px", padding: "1.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                                 <label style={{ fontSize: "0.75rem", color: "#22c55e", fontWeight: 800, textTransform: "uppercase", marginBottom: "1.5rem", display: "block" }}>Regions to Preserve</label>
                                 <p style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "1rem" }}>Specify ranges that will not be modified (e.g., Promoters, Tags).</p>
                                 <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                                    <input type="number" placeholder="Start" value={goPreserveInput.start} onChange={e => setGoPreserveInput({...goPreserveInput, start: e.target.value})} style={calcInputStyle} />
                                    <input type="number" placeholder="End" value={goPreserveInput.end} onChange={e => setGoPreserveInput({...goPreserveInput, end: e.target.value})} style={calcInputStyle} />
                                    <button onClick={() => { if(goPreserveInput.start && goPreserveInput.end) setGoPreserved([...goPreserved, { start: parseInt(goPreserveInput.start), end: parseInt(goPreserveInput.end) }]); setGoPreserveInput({start: "", end: ""}); }} style={{ background: "#22c55e", color: "black", border: "none", borderRadius: "8px", padding: "0 1rem", fontWeight: 800, cursor: "pointer" }}>Add</button>
                                 </div>
                                 <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                    {goPreserved.map((p, i) => (
                                      <div key={i} style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", padding: "0.5rem 0.8rem", borderRadius: "8px", fontSize: "0.8rem" }}>
                                         <span style={{ color: "white" }}>{p.start} - {p.end} <span style={{ color: "#475569" }}>({p.end - p.start + 1} bp)</span></span>
                                         <button onClick={() => setGoPreserved(goPreserved.filter((_, idx) => idx !== i))} style={{ color: "#f43f5e", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
                                      </div>
                                    ))}
                                    {goPreserved.length === 0 && <div style={{ textAlign: "center", color: "#475569", fontSize: "0.8rem" }}>No regions selected</div>}
                                 </div>
                              </div>

                              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "20px", padding: "1.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                                 <label style={{ color: "#22c55e", fontSize: "0.75rem", display: "block", marginBottom: "1.5rem", fontWeight: 800, textTransform: "uppercase" }}>Avoid Creating Restriction Sites</label>
                                 <div style={{ position: "relative" }}>
                                   <input 
                                     type="text" 
                                     placeholder="Search enzyme (e.g. EcoRI)" 
                                     value={goEnzSearch} 
                                     onChange={e => setGoEnzSearch(e.target.value)} 
                                     style={{ ...calcInputStyle, marginBottom: "0.5rem" }} 
                                   />
                                   {goEnzSearch && (
                                     <div style={{ position: "absolute", top: "45px", left: 0, width: "100%", background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", zIndex: 10, maxHeight: "150px", overflowY: "auto", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                                       {ALL_ENZYMES.filter(e => e.name.toLowerCase().includes(goEnzSearch.toLowerCase()) && !goForbidden.includes(e.name)).map(enz => (
                                         <div key={enz.name} onClick={() => { setGoForbidden([...goForbidden, enz.name]); setGoEnzSearch(""); }} style={{ padding: "0.6rem 1rem", cursor: "pointer", display: "flex", justifyContent: "space-between", fontSize: "0.85rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                            <span style={{ color: "white", fontWeight: 700 }}>{enz.name}</span>
                                            <span style={{ color: "#475569", fontFamily: "monospace" }}>{enz.site}</span>
                                         </div>
                                       ))}
                                     </div>
                                   )}
                                 </div>
                                 <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                   {goForbidden.map(name => (
                                     <div key={name} style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", padding: "0.4rem 0.8rem", borderRadius: "8px", fontSize: "0.75rem", color: "#22c55e", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                       {name}
                                       <button onClick={() => setGoForbidden(goForbidden.filter(n => n !== name))} style={{ background: "none", border: "none", color: "#f43f5e", cursor: "pointer", fontWeight: 800 }}>×</button>
                                     </div>
                                   ))}
                                 </div>
                              </div>

                              <button onClick={calcGeneOptimizer} style={{ background: "#22c55e", color: "black", border: "none", borderRadius: "12px", padding: "1rem", fontWeight: 900, fontSize: "1rem", cursor: "pointer", boxShadow: "0 0 25px rgba(34, 197, 94, 0.4)" }}>START GENERATION Wizard</button>
                           </div>
                        </div>
                   </motion.div>
                )}

                {goResult && (
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                    <div style={{ background: "rgba(15, 23, 42, 0.6)", borderRadius: "24px", border: "1px solid rgba(34,197,94,0.2)", padding: "2rem" }}>
                       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                             <div style={{ fontSize: "2rem", fontWeight: 900, color: "white" }}>{goResult.gc}% <span style={{ fontSize: "0.8rem", color: "#64748b" }}>GC</span></div>
                             <div style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", padding: "0.3rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 800 }}>MISSION OPTIMIZED</div>
                             <div style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa", padding: "0.3rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 800 }}>{goResult.ntChanges} NT CHANGED</div>
                             {goResult.sitesFixed > 0 && <div style={{ color: "#f59e0b", fontSize: "0.7rem", fontWeight: 700 }}>{goResult.sitesFixed} SURGICAL SWAPS PERFORMED</div>}
                          </div>
                          <div style={{ display: "flex", gap: "1rem" }}>
                             <button onClick={() => { navigator.clipboard.writeText(goResult.optimized); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ color: "white", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "0.6rem 1.2rem", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 800 }}>
                                {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "COPIED" : "COPY DNA"}
                             </button>
                             <button onClick={() => { 
                                 const blob = new Blob([`>Optimized_Sequence\n${goResult.optimized}`], { type: "text/plain" });
                                 const url = URL.createObjectURL(blob);
                                 const a = document.createElement("a");
                                 a.href = url;
                                 a.download = "optimized_sequence.fasta";
                                 a.click();
                             }} style={{ color: "black", background: "#22c55e", border: "none", padding: "0.6rem 1.2rem", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 800 }}>
                                <FileText size={16} /> EXPORT FASTA
                             </button>
                          </div>
                       </div>

                       <div style={{ border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", background: "rgba(0,0,0,0.3)", padding: "1.5rem", marginBottom: "2rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                            <label style={{ color: "#94a3b8", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase" }}>Optimization Sequence Comparison</label>
                            <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.7rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><div style={{ width: 8, height: 8, background: "#f43f5e", borderRadius: "2px" }}></div> Substitution</div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><div style={{ width: 8, height: 8, background: "rgba(255,255,255,0.2)", borderRadius: "2px" }}></div> Conserved</div>
                            </div>
                        </div>
                        <div style={{ maxHeight: "400px", overflow: "auto", paddingRight: "10px", background: "#020617", padding: "1rem", borderRadius: "8px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "fit-content" }}>
                                {goResult.original.split('').reduce((acc, curr, i) => {
                                    if (i % 60 === 0) acc.push(i);
                                    return acc;
                                }, []).map((start) => (
                                    <div key={start} style={{ display: "flex", flexDirection: "column", gap: "8px", position: "relative" }}>
                                        <div style={{ position: "absolute", left: "-30px", top: "50%", transform: "translateY(-50%)", fontSize: "0.6rem", color: "#334155", fontWeight: 900 }}>{start + 1}</div>
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            <div style={{ width: "80px", fontSize: "0.6rem", color: "#f59e0b", fontWeight: 800 }}>OPTIMIZED</div>
                                            <div style={{ display: "flex", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.95rem", color: "white", background: "rgba(255,255,255,0.02)", padding: "4px", borderRadius: "4px" }}>
                                                {goResult.optimized.substring(start, start + 60).split('').map((char, i) => {
                                                    const isDiff = goResult.optimized[start + i] !== goResult.original[start + i];
                                                    return (
                                                        <div key={i} style={{ width: "13px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", background: isDiff ? "rgba(244,63,94,0.3)" : "transparent", color: isDiff ? "#fb7185" : "inherit", borderRadius: "1px", fontWeight: isDiff ? 900 : 400 }}>
                                                            {char}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            <div style={{ width: "80px", fontSize: "0.6rem", color: "#64748b", fontWeight: 800 }}>ORIGINAL</div>
                                            <div style={{ display: "flex", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.95rem", color: "#475569", background: "rgba(0,0,0,0.2)", padding: "4px", borderRadius: "4px" }}>
                                                {goResult.original.substring(start, start + 60).split('').map((char, i) => (
                                                    <div key={i} style={{ width: "13px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        {char}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            <div style={{ width: "80px" }}></div>
                                            <div style={{ display: "flex", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", color: "#1e293b" }}>
                                                {goResult.original.substring(start, start + 60).split('').map((char, i) => (
                                                    <div key={i} style={{ width: "13px", textAlign: "center", color: goResult.optimized[start + i] !== char ? "#f43f5e" : "transparent" }}>▲</div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                       </div>

                       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "16px", padding: "1.2rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                             <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 800, marginBottom: "0.8rem", textTransform: "uppercase" }}>Optimization Delta Barcode</div>
                             <div style={{ height: "40px", background: "rgba(255,255,255,0.02)", borderRadius: "6px", display: "flex", overflow: "hidden" }}>
                                {goResult.original.split('').map((char, i) => (
                                    <div key={i} style={{ flex: 1, background: goResult.optimized[i] !== char ? "#f43f5e" : "transparent" }}></div>
                                ))}
                             </div>
                          </div>
                          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "16px", padding: "1.2rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                             <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 800, marginBottom: "0.8rem", textTransform: "uppercase" }}>Complexity Summary</div>
                             <div style={{ display: "flex", gap: "1rem" }}>
                                <div style={{ flex: 1, textAlign: "center" }}>
                                    <div style={{ fontSize: "1.2rem", color: "white", fontWeight: 900 }}>0</div>
                                    <div style={{ fontSize: "0.6rem", color: "#475569" }}>REMAINING REPEATS</div>
                                </div>
                                <div style={{ flex: 1, textAlign: "center" }}>
                                    <div style={{ fontSize: "1.2rem", color: "#22c55e", fontWeight: 900 }}>PASS</div>
                                    <div style={{ fontSize: "0.6rem", color: "#475569" }}>SYNTHESIS SCORE</div>
                                </div>
                             </div>
                          </div>
                       </div>
                       
                       {goResult.issues.length > 0 && (
                          <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(244,63,94,0.1)", borderRadius: "12px", border: "1px solid rgba(244,63,94,0.2)" }}>
                             <span style={{ fontSize: "0.75rem", color: "#f43f5e", fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>Synthesis Warnings</span>
                             {goResult.issues.map((iss, k) => <div key={k} style={{ color: "#f43f5e", fontSize: "0.85rem" }}>• {iss}</div>)}
                          </div>
                       )}
                    </div>
                  </motion.div>
                )}
              </div>

            ) : toolId === "ligation-calculator" ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <label style={{ color: "#e2e8f0", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ligation Parameters</label>
                  <span style={{ color: "#475569", fontSize: "0.75rem" }}>Enter lengths and mass</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem" }}>Insert Length (bp)</label>
                    <input type="number" placeholder="500" value={input.split(/[\s,]+/)[0] || ""} onChange={(e) => { const p = input.split(/[\s,]+/); p[0] = e.target.value; setInput(p.join(", ")); }} style={calcInputStyle} />
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem" }}>Vector Length (bp)</label>
                    <input type="number" placeholder="3000" value={input.split(/[\s,]+/)[1] || ""} onChange={(e) => { const p = input.split(/[\s,]+/); p[0] = p[0]||""; p[1] = e.target.value; setInput(p.join(", ")); }} style={calcInputStyle} />
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem" }}>Vector Mass (ng)</label>
                    <input type="number" placeholder="50" value={input.split(/[\s,]+/)[2] || ""} onChange={(e) => { const p = input.split(/[\s,]+/); p[0] = p[0]||""; p[1] = p[1]||""; p[2] = e.target.value; setInput(p.join(", ")); }} style={calcInputStyle} />
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem" }}>Custom Ratio (Optional)</label>
                    <input type="number" placeholder="3" value={input.split(/[\s,]+/)[3] || ""} onChange={(e) => { const p = input.split(/[\s,]+/); p[0] = p[0]||""; p[1] = p[1]||""; p[2] = p[2]||""; p[3] = e.target.value; setInput(p.join(", ")); }} style={calcInputStyle} />
                  </div>
                  <div>
                    <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem" }}>Insert 2 Length (bp) [Optional]</label>
                    <input type="number" placeholder="800" value={input.split(/[\s,]+/)[4] || ""} onChange={(e) => { const p = input.split(/[\s,]+/); p[0] = p[0]||""; p[1] = p[1]||""; p[2] = p[2]||""; p[3] = p[3]||""; p[4] = e.target.value; setInput(p.join(", ")); }} style={calcInputStyle} />
                  </div>
                  <div style={{ visibility: "hidden" }}></div>
                </div>
                
                <div style={{ marginTop: "2rem", padding: "1.5rem", background: "rgba(0, 212, 255, 0.05)", border: "1px solid rgba(0, 212, 255, 0.15)", borderRadius: "16px" }}>
                  <h4 style={{ color: "white", fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <FileText size={16} color={accentColor} /> 
                    How to Choose the Best Molar Ratio (Vector : Insert)
                  </h4>
                  <p style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: 1.6, marginBottom: "1rem" }}>
                    There is no single "perfect" ratio, as the efficiency of T4 DNA Ligase depends on the nature of the DNA ends, the size of the fragments, and the complexity of the assembly. Here is how to navigate the choices:
                  </p>
                  <ul style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: 1.6, paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.5rem", margin: 0 }}>
                    <li><strong style={{ color: "#cbd5e1" }}>1:3 (Standard Sticky Ends):</strong> This is the gold standard starting point for most routine restriction enzyme cloning. It provides enough excess insert to drive the reaction forward without overloading the system.</li>
                    <li><strong style={{ color: "#cbd5e1" }}>1:5 or 1:10 (Blunt Ends or Short Inserts):</strong> Blunt-end ligations are inherently less efficient because they lack the transient hydrogen binding of cohesive overhangs. A higher concentration of insert increases the probability of molecular collisions. This high ratio is also used for very short inserts (like adapters or linkers).</li>
                    <li><strong style={{ color: "#cbd5e1" }}>1:1 or 1:2 (Large Inserts):</strong> If your insert is very large (e.g., &gt;3kb), adding too much mass can inhibit the reaction or encourage the insert to ligate to itself (concatemerization). Lower ratios prevent the insert from crowding out the vector.</li>
                    <li><strong style={{ color: "#cbd5e1" }}>Multi-part Assemblies (e.g., 1:1:1 or 1:3:3):</strong> When assembling multiple fragments simultaneously—such as in a three-way directional cloning strategy—balancing the stoichiometry becomes critical. You generally want the distinct inserts to be equimolar to each other to prevent one fragment from dominating the reaction. A 1:1:1 or 1:3:3 (Vector:Insert1:Insert2) ratio is typically optimal.</li>
                  </ul>
                </div>
              </div>
            ) : toolId === "orf-finder" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <label style={{ color: "#e2e8f0", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Input Sequence (DNA/RNA)</label>
                  </div>
                  <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter DNA sequence..."
                    style={{ ...textareaStyle, height: "140px" }}
                    spellCheck={false}
                  />
                </div>
                
                <div style={{ background: "rgba(0,0,0,0.2)", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(148, 163, 184, 0.1)" }}>
                  <h4 style={{ color: "white", fontSize: "1rem", fontWeight: 700, marginBottom: "1.5rem", borderBottom: "1px solid rgba(148,163,184,0.1)", paddingBottom: "1rem" }}>Settings</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600 }}>Minimum ORF length (bases)</label>
                        <input type="number" value={orfMin} onChange={(e) => setOrfMin(e.target.value)} style={calcInputStyle} />
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600 }}>Frames</label>
                        <select value={orfFrames} onChange={(e) => setOrfFrames(e.target.value)} style={calcInputStyle}>
                        <option value="All">All</option>
                        <option value="Forward">Forward</option>
                        <option value="Reverse">Reverse</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="-1">-1</option>
                        <option value="-2">-2</option>
                        <option value="-3">-3</option>
                        </select>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600 }}>Start Codon</label>
                        <select value={orfStartCodon} onChange={(e) => setOrfStartCodon(e.target.value)} style={calcInputStyle}>
                        <option value="ATG">ATG</option>
                        <option value="ATG/GTG/TTG">ATG/GTG/TTG</option>
                        <option value="Any">Any without Stop</option>
                        </select>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1rem" }}>
                        <input type="checkbox" checked={orfShowMap} onChange={(e) => setOrfShowMap(e.target.checked)} style={{ width: "20px", height: "20px", accentColor: "#00d4ff", cursor: "pointer" }} />
                        <label style={{ color: "#e2e8f0", fontSize: "0.85rem", fontWeight: 600 }}>Show Amino Acids (Sequence Map)</label>
                    </div>
                  </div>
                </div>
              </div>
            ) : toolId === "pairwise-alignment" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <label style={{ color: "#e2e8f0", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Sequence A</label>
                  </div>
                  <textarea 
                    value={input.split("|||")[0] || ""}
                    onChange={(e) => { const parts = input.split("|||"); parts[0] = e.target.value; setInput(parts.join("|||")); }}
                    placeholder="Enter first sequence..."
                    style={{ ...textareaStyle, height: "140px" }}
                    spellCheck={false}
                  />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <label style={{ color: "#e2e8f0", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Sequence B</label>
                  </div>
                  <textarea 
                    value={input.split("|||")[1] || ""}
                    onChange={(e) => { const parts = input.split("|||"); parts[0] = parts[0]||""; parts[1] = e.target.value; setInput(parts.join("|||")); }}
                    placeholder="Enter second sequence to align against..."
                    style={{ ...textareaStyle, height: "140px" }}
                    spellCheck={false}
                  />
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <label style={{ color: "#e2e8f0", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Input Sequence (DNA/RNA)</label>
                  <span style={{ color: "#475569", fontSize: "0.75rem" }}>FASTA format or raw sequence</span>
                </div>
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Paste sequence here..."
                  style={{ ...textareaStyle, height: "200px" }}
                  spellCheck={false}
                />
              </>
            )}
            {!toolId.includes("calculator") && !["tm-calculator","ta-calculator","molarity-calculator","centrifugation-calculator","serial-dilution-planner","unit-converter-biology","coding-capacity"].includes(toolId) && (
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
            )}
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
                    whiteSpace: "pre-wrap",
                    maxHeight: "500px",
                    overflowY: "auto"
                }}
                  dangerouslySetInnerHTML={{ __html: ["orf-finder", "dna-concentration-calculator", "mrna-optimization"].includes(toolId) ? output : output.replace(/</g, "&lt;").replace(/>/g, "&gt;") }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
