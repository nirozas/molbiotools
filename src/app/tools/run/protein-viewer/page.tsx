"use client";

import React, { useState, useMemo } from "react";
import { 
  Palette, 
  Info, 
  Settings2, 
  Download, 
  Layers, 
  Droplets, 
  Zap, 
  AlertTriangle,
  Beaker
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import ToolPageLayout from "@/components/ToolPageLayout";

// ─── Data Definitions ───────────────────────────────────────────────────────

interface AAProperty {
  one: string;
  three: string;
  name: string;
  rasmol: string;
  polarity: 'nonpolar' | 'polar' | 'basic' | 'acidic';
  hydrophobicity: number; // Kyte-Doolittle scale
  type: 'Aliphatic' | 'Aromatic' | 'Sulphur' | 'Basic' | 'Acidic' | 'Aliphatic hydroxyl' | 'Proline' | 'Amide';
  trnaClass: 'I' | 'II';
}

const AA_PROPS: Record<string, AAProperty> = {
  A: { one: 'A', three: 'Ala', name: 'Alanine', rasmol: '#C8C8C8', polarity: 'nonpolar', hydrophobicity: 1.8, type: 'Aliphatic', trnaClass: 'II' },
  R: { one: 'R', three: 'Arg', name: 'Arginine', rasmol: '#145AFF', polarity: 'basic', hydrophobicity: -4.5, type: 'Basic', trnaClass: 'I' },
  N: { one: 'N', three: 'Asn', name: 'Asparagine', rasmol: '#00DCDC', polarity: 'polar', hydrophobicity: -3.5, type: 'Amide', trnaClass: 'II' },
  D: { one: 'D', three: 'Asp', name: 'Aspartic Acid', rasmol: '#E60A0A', polarity: 'acidic', hydrophobicity: -3.5, type: 'Acidic', trnaClass: 'II' },
  C: { one: 'C', three: 'Cys', name: 'Cysteine', rasmol: '#E6E600', polarity: 'polar', hydrophobicity: 2.5, type: 'Sulphur', trnaClass: 'I' },
  E: { one: 'E', three: 'Glu', name: 'Glutamic Acid', rasmol: '#E60A0A', polarity: 'acidic', hydrophobicity: -3.5, type: 'Acidic', trnaClass: 'I' },
  Q: { one: 'Q', three: 'Gln', name: 'Glutamine', rasmol: '#00DCDC', polarity: 'polar', hydrophobicity: -3.5, type: 'Amide', trnaClass: 'I' },
  G: { one: 'G', three: 'Gly', name: 'Glycine', rasmol: '#EBEBEB', polarity: 'nonpolar', hydrophobicity: -0.4, type: 'Aliphatic', trnaClass: 'II' },
  H: { one: 'H', three: 'His', name: 'Histidine', rasmol: '#8282D2', polarity: 'basic', hydrophobicity: -3.2, type: 'Basic', trnaClass: 'II' },
  I: { one: 'I', three: 'Ile', name: 'Isoleucine', rasmol: '#0F820F', polarity: 'nonpolar', hydrophobicity: 4.5, type: 'Aliphatic', trnaClass: 'I' },
  L: { one: 'L', three: 'Leu', name: 'Leucine', rasmol: '#0F820F', polarity: 'nonpolar', hydrophobicity: 3.8, type: 'Aliphatic', trnaClass: 'I' },
  K: { one: 'K', three: 'Lys', name: 'Lysine', rasmol: '#145AFF', polarity: 'basic', hydrophobicity: -3.9, type: 'Basic', trnaClass: 'II' },
  M: { one: 'M', three: 'Met', name: 'Methionine', rasmol: '#E6E600', polarity: 'nonpolar', hydrophobicity: 1.9, type: 'Sulphur', trnaClass: 'I' },
  F: { one: 'F', three: 'Phe', name: 'Phenylalanine', rasmol: '#3232C8', polarity: 'nonpolar', hydrophobicity: 2.8, type: 'Aromatic', trnaClass: 'II' },
  P: { one: 'P', three: 'Pro', name: 'Proline', rasmol: '#DC143C', polarity: 'nonpolar', hydrophobicity: -1.6, type: 'Proline', trnaClass: 'II' },
  S: { one: 'S', three: 'Ser', name: 'Serine', rasmol: '#FA9600', polarity: 'polar', hydrophobicity: -0.8, type: 'Aliphatic hydroxyl', trnaClass: 'II' },
  T: { one: 'T', three: 'Thr', name: 'Threonine', rasmol: '#FA9600', polarity: 'polar', hydrophobicity: -0.7, type: 'Aliphatic hydroxyl', trnaClass: 'II' },
  W: { one: 'W', three: 'Trp', name: 'Tryptophan', rasmol: '#B45AB4', polarity: 'nonpolar', hydrophobicity: -0.9, type: 'Aromatic', trnaClass: 'I' },
  Y: { one: 'Y', three: 'Tyr', name: 'Tyrosine', rasmol: '#3232C8', polarity: 'polar', hydrophobicity: -1.3, type: 'Aromatic', trnaClass: 'I' },
  V: { one: 'V', three: 'Val', name: 'Valine', rasmol: '#0F820F', polarity: 'nonpolar', hydrophobicity: 4.2, type: 'Aliphatic', trnaClass: 'I' },
};

const POLARITY_COLORS = { nonpolar: '#94a3b8', polar: '#ec4899', basic: '#3b82f6', acidic: '#ef4444' };
const TYPE_COLORS = { 
  Aliphatic: '#94a3b8', 
  Aromatic: '#8b5cf6', 
  Sulphur: '#eab308', 
  Basic: '#3b82f6', 
  Acidic: '#ef4444', 
  'Aliphatic hydroxyl': '#10b981', 
  Proline: '#f43f5e', 
  Amide: '#06b6d4' 
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function ProteinViewerPage() {
  const [sequence, setSequence] = useState("");
  const [mode, setMode] = useState<'rasmol' | 'polarity' | 'hydrophobicity' | 'type' | 'trna' | 'liability'>('rasmol');
  const [showLabels, setShowLabels] = useState(true);

  const cleanSeq = useMemo(() => sequence.toUpperCase().replace(/[^A-Z]/g, ''), [sequence]);

  const liabilitySites = useMemo(() => {
    const sites: { index: number; type: string; color: string }[] = [];
    for (let i = 0; i < cleanSeq.length; i++) {
        const sub1 = cleanSeq.substring(i, i + 3);
        const sub2 = cleanSeq.substring(i, i + 2);

        // N-Linked Glycosylation: N-X-S/T where X != P
        if (cleanSeq[i] === 'N' && i + 2 < cleanSeq.length) {
            if (cleanSeq[i+1] !== 'P' && (cleanSeq[i+2] === 'S' || cleanSeq[i+2] === 'T')) {
                sites.push({ index: i, type: 'N-Glyco', color: '#ff00ff' });
            }
        }
        // Asparagine Deamidation: NG
        if (sub2 === 'NG') sites.push({ index: i, type: 'Deamid', color: '#ff8800' });
        // Oxidation: M, W
        if (cleanSeq[i] === 'M' || cleanSeq[i] === 'W') sites.push({ index: i, type: 'Oxid', color: '#00ffff' });
        // Aspartate Isomerization: DG, DS
        if (sub2 === 'DG' || sub2 === 'DS') sites.push({ index: i, type: 'Isomer', color: '#ffff00' });
    }
    return sites;
  }, [cleanSeq]);

  const getStyle = (aa: string, index: number): React.CSSProperties => {
    const props = AA_PROPS[aa];
    if (!props) return { color: '#475569' };

    switch (mode) {
      case 'rasmol': return { color: props.rasmol };
      case 'polarity': return { color: POLARITY_COLORS[props.polarity] };
      case 'type': return { color: (TYPE_COLORS as any)[props.type] || '#ccc' };
      case 'trna': return { color: props.trnaClass === 'I' ? '#00d4ff' : '#f59e0b' };
      case 'hydrophobicity': {
        const intensity = (props.hydrophobicity + 4.5) / 9; // normalized 0-1
        return { color: `hsl(${120 * (1 - intensity)}, 70%, 50%)` };
      }
      case 'liability': {
        const site = liabilitySites.find(s => s.index === index);
        return { color: site ? site.color : '#334155', fontWeight: site ? '900' : 'normal' };
      }
      default: return {};
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200">
      <Navbar />
      <div className="h-16" />
      <ToolPageLayout>
        <main className="max-w-6xl mx-auto p-6 md:p-12">
          
          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                  <Palette size={28} />
               </div>
               <div>
                  <h1 className="text-4xl font-black text-white tracking-widest uppercase">Protein Visualizer</h1>
                  <p className="text-slate-500 font-medium">High-resolution sequence property mapping and liability screening.</p>
               </div>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800">
               <button onClick={() => setSequence("")} className="px-4 py-2 hover:bg-slate-800 rounded-xl text-xs font-bold transition-all text-slate-400">Clear</button>
               <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold transition-all text-white shadow-lg shadow-indigo-500/20 flex items-center gap-2">
                  <Download size={14} /> Export Map
               </button>
            </div>
          </header>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Sidebar Controls */}
            <aside className="lg:col-span-3 space-y-6">
               <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 space-y-6 backdrop-blur-xl">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block">Visual Mode</label>
                    <div className="grid gap-2">
                        {[
                            { id: 'rasmol', label: 'RasMol CPK', icon: Palette },
                            { id: 'polarity', label: 'Polarity', icon: Zap },
                            { id: 'hydrophobicity', label: 'Hydrophobicity', icon: Droplets },
                            { id: 'type', label: 'Chemical Type', icon: Beaker },
                            { id: 'trna', label: 'tRNA Class', icon: Layers },
                            { id: 'liability', label: 'Liability Sites', icon: AlertTriangle }
                        ].map(m => (
                            <button
                                key={m.id}
                                onClick={() => setMode(m.id as any)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                                    mode === m.id 
                                    ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-300" 
                                    : "bg-transparent border-transparent text-slate-500 hover:bg-slate-900 hover:text-slate-300"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <m.icon size={16} />
                                    <span className="text-xs font-bold">{m.label}</span>
                                </div>
                                {mode === m.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />}
                            </button>
                        ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-800">
                     <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                            type="checkbox" 
                            checked={showLabels} 
                            onChange={e => setShowLabels(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200 transition-colors">Show Legend Tooltips</span>
                     </label>
                  </div>
               </div>

               {/* Mode Info Box */}
               <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4">
                  <div className="flex gap-3">
                     <Info size={16} className="text-indigo-400 shrink-0" />
                     <p className="text-[11px] leading-relaxed text-indigo-300/70">
                        {mode === 'liability' && "Liability screening detects motifs like N-Glyco (N-X-S/T), N-deamidation (NG), and oxidation-prone residues (M, W)."}
                        {mode === 'rasmol' && "Standard RasMol/CPK color scheme for structural representation."}
                        {mode === 'hydrophobicity' && "Heatmap based on the Kyte-Doolittle scale. Red = Hydrophobic, Green = Hydrophilic."}
                        {mode === 'trna' && "Classification based on aminoacyl-tRNA synthetase evolutionary lineages."}
                     </p>
                  </div>
               </div>
            </aside>

            {/* Main Content Area */}
            <div className="lg:col-span-9 space-y-8">
               
               {/* Input */}
               <div className="relative group">
                  <textarea 
                    value={sequence}
                    onChange={e => setSequence(e.target.value)}
                    placeholder="Paste AA sequence here..."
                    className="w-full h-32 bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 font-mono text-sm uppercase focus:outline-none focus:border-indigo-500/40 focus:ring-8 focus:ring-indigo-500/5 transition-all scrollbar-hide"
                  />
                  <div className="absolute right-4 bottom-4 text-[10px] font-black text-slate-600">
                    {cleanSeq.length} AMINO ACIDS
                  </div>
               </div>

               {/* Visualization Workspace */}
               <div className="bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 min-h-[400px]">
                  <div className="flex flex-wrap gap-x-2 gap-y-3 font-mono text-xl md:text-2xl lg:text-3xl font-black">
                     {cleanSeq.split("").map((aa, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.005 }}
                          className="relative group/aa"
                        >
                           <span style={getStyle(aa, i)} className="transition-colors duration-300">{aa}</span>
                           
                           <AnimatePresence>
                             {showLabels && (
                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover/aa:opacity-100 transition-all pointer-events-none z-50">
                                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-2xl min-w-[120px]">
                                     <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{AA_PROPS[aa]?.name || aa}</div>
                                     <div className="text-[9px] text-slate-400 mt-1 flex flex-col gap-0.5">
                                        <span>Type: {AA_PROPS[aa]?.type}</span>
                                        <span>Polar: {AA_PROPS[aa]?.polarity}</span>
                                        <span>KD: {AA_PROPS[aa]?.hydrophobicity}</span>
                                     </div>
                                     {mode === 'liability' && liabilitySites.find(s => s.index === i) && (
                                         <div className="mt-2 text-[9px] font-bold text-red-400 flex items-center gap-1">
                                            <AlertTriangle size={10} /> {liabilitySites.find(s => s.index === i)?.type}
                                         </div>
                                     )}
                                     <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-slate-800 rotate-45 -mt-1" />
                                  </div>
                               </div>
                             )}
                           </AnimatePresence>
                        </motion.div>
                     ))}
                     {cleanSeq.length === 0 && (
                        <div className="w-full h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-700">
                           <Layers size={48} className="mb-4 opacity-20" />
                           <p className="text-sm font-bold uppercase tracking-widest">Awaiting sequence data</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* Legend Bar */}
               <div className="flex flex-wrap items-center gap-6 px-4">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Color Key:</span>
                  <div className="flex flex-wrap items-center gap-4">
                     {mode === 'polarity' && Object.entries(POLARITY_COLORS).map(([label, color]) => (
                        <div key={label} className="flex items-center gap-2">
                           <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                           <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
                        </div>
                     ))}
                     {mode === 'trna' && (
                        <>
                           <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Class I</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Class II</span>
                           </div>
                        </>
                     )}
                     {mode === 'liability' && (
                        <div className="flex flex-wrap gap-4">
                           <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-[#ff00ff]" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase">N-Glyco</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-[#ff8800]" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Deamidation</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-[#00ffff]" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Oxidation</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-[#ffff00]" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Isomerization</span>
                           </div>
                        </div>
                     )}
                  </div>
               </div>

               {/* Detailed Liability Descriptions */}
               <AnimatePresence>
                {mode === 'liability' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    {[
                      { 
                        title: "N-Linked Glycosylation (N-Glyco)", 
                        desc: "Consensus motif N-X-S/T (where X is any amino acid except Proline). Sites where carbohydrate chains are enzymatically attached, crucial for folding and stability.",
                        color: "#ff00ff"
                      },
                      { 
                        title: "Asparagine Deamidation (Deamid)", 
                        desc: "Occurrence of Asparagine (N) followed by Glycine (G). A chemical degradation reaction that can impact protein shelf-life and binding affinity.",
                        color: "#ff8800"
                      },
                      { 
                        title: "Protein Oxidation (Oxid)", 
                        desc: "Primarily affects Methionine (M) and Tryptophan (W) residues. Can be induced by light or reactive oxygen species, often leading to aggregation.",
                        color: "#00ffff"
                      },
                      { 
                        title: "Aspartate Isomerization (Isomer)", 
                        desc: "Commonly occurs at Aspartate (D) followed by Glycine (G) or Serine (S). Leads to the formation of isoaspartate, which can alter backbone structure.",
                        color: "#ffff00"
                      }
                    ].map(site => (
                      <div key={site.title} className="bg-slate-900/40 border border-slate-800/50 p-5 rounded-3xl flex gap-4">
                         <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ background: site.color }} />
                         <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1.5">{site.title}</h4>
                            <p className="text-[11px] leading-relaxed text-slate-500 font-medium">{site.desc}</p>
                         </div>
                      </div>
                    ))}
                  </motion.div>
                )}
               </AnimatePresence>
            </div>
          </div>
        </main>
      </ToolPageLayout>
    </div>
  );
}
