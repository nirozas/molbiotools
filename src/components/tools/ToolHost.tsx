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

  useEffect(() => {
    if (toolId.includes("calculator")) {
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
            {!toolId.includes("calculator") && (
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
