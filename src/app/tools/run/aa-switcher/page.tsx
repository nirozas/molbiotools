"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  ArrowRightLeft, 
  Dna, 
  Layers, 
  Settings2, 
  ArrowRight,
  Check,
  X,
  Plus,
  Trash2,
  Zap,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import ToolPageLayout from "@/components/ToolPageLayout";

// ─── Constants & Types ───────────────────────────────────────────────────────

const GENETIC_CODE: Record<string, string> = {
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

const AA_TO_CODONS: Record<string, string[]> = {};
Object.entries(GENETIC_CODE).forEach(([codon, aa]) => {
    if (!AA_TO_CODONS[aa]) AA_TO_CODONS[aa] = [];
    AA_TO_CODONS[aa].push(codon);
});

interface SequenceElement {
    aa: string;
    codon: string;
    index: number; // codon index
}

// ─── Components ─────────────────────────────────────────────────────────────

const AA_PROPS: Record<string, { rasmol: string }> = {
  A: { rasmol: '#C8C8C8' }, R: { rasmol: '#145AFF' }, N: { rasmol: '#00DCDC' },
  D: { rasmol: '#E60A0A' }, C: { rasmol: '#E6E600' }, E: { rasmol: '#E60A0A' },
  Q: { rasmol: '#00DCDC' }, G: { rasmol: '#EBEBEB' }, H: { rasmol: '#8282D2' },
  I: { rasmol: '#0F820F' }, L: { rasmol: '#0F820F' }, K: { rasmol: '#145AFF' },
  M: { rasmol: '#E6E600' }, F: { rasmol: '#3232C8' }, P: { rasmol: '#DC143C' },
  S: { rasmol: '#FA9600' }, T: { rasmol: '#FA9600' }, W: { rasmol: '#B45AB4' },
  Y: { rasmol: '#3232C8' }, V: { rasmol: '#0F820F' },
};

export default function AASwitcherPage() {
    const [rawInput, setRawInput] = useState("");
    const [inputType, setInputType] = useState<"dna" | "aa">("dna");
    const [elements, setElements] = useState<SequenceElement[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [isMutating, setIsMutating] = useState(false);
    const [targetAA, setTargetAA] = useState("");
    const [fragmentTargets, setFragmentTargets] = useState<Record<number, { aa: string; codon: string }>>({});

    const getAAColor = (aa: string) => AA_PROPS[aa]?.rasmol || "#475569";

    // Initialize fragmentTargets when opening the modal for multiple indices
    useEffect(() => {
        if (isMutating && selectedIndices.length > 1) {
            const initial: Record<number, { aa: string; codon: string }> = {};
            selectedIndices.forEach(idx => {
                const el = elements[idx];
                initial[idx] = { aa: el.aa, codon: el.codon };
            });
            setFragmentTargets(initial);
        }
    }, [isMutating, selectedIndices]);

    const updateFragmentTarget = (idx: number, aa: string, codon: string) => {
        setFragmentTargets(prev => ({
            ...prev,
            [idx]: { aa, codon }
        }));
    };

    const applyFragmentMutation = () => {
        const newElements = [...elements];
        Object.entries(fragmentTargets).forEach(([idx, data]) => {
            const index = parseInt(idx);
            if (newElements[index]) {
                newElements[index] = { ...newElements[index], aa: data.aa, codon: data.codon };
            }
        });
        setElements(newElements);
        setIsMutating(false);
        setSelectedIndices([]);
    };

    // Initialize sequence elements from input
    useEffect(() => {
        if (!rawInput) {
            setElements([]);
            return;
        }

        const clean = rawInput.toUpperCase().replace(/[^A-Z]/g, '');
        let newElements: SequenceElement[] = [];

        if (inputType === "dna") {
            for (let i = 0; i < clean.length; i += 3) {
                const codon = clean.substring(i, i + 3);
                if (codon.length === 3) {
                    newElements.push({
                        aa: GENETIC_CODE[codon] || "?",
                        codon: codon,
                        index: i / 3
                    });
                }
            }
        } else {
            // If AA input, we don't know the best codon, use first available
            newElements = clean.split("").map((aa, i) => ({
                aa,
                codon: AA_TO_CODONS[aa]?.[0] || "???",
                index: i
            }));
        }
        setElements(newElements);
        setSelectedIndices([]);
    }, [rawInput, inputType]);

    const handleAASelection = (index: number, multiSelect: boolean) => {
        if (multiSelect) {
            setSelectedIndices(prev => 
                prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index].sort((a,b) => a-b)
            );
        } else {
            setSelectedIndices([index]);
            setIsMutating(true);
        }
    };

    const applyMutation = (targetAA: string, targetCodon: string) => {
        if (selectedIndices.length === 0) return;
        
        const newElements = [...elements];
        selectedIndices.forEach(idx => {
            if (newElements[idx]) {
                newElements[idx] = { ...newElements[idx], aa: targetAA, codon: targetCodon };
            }
        });
        setElements(newElements);
        setIsMutating(false);
        setTargetAA("");
    };

    const getCodonDiffHtml = (original: string, target: string) => {
        return target.split("").map((nt, i) => {
            const isDiff = nt !== original[i];
            return (
                <span key={i} className={isDiff ? "text-red-500 font-black" : "text-slate-400 font-bold"}>
                    {nt}
                </span>
            );
        });
    };

    const selectedAAString = selectedIndices.map(i => elements[i]?.aa).join("");

    return (
        <div className="min-h-screen bg-[#030712] text-slate-200">
            <Navbar />
            <div className="h-16" />
            <ToolPageLayout>
                <main className="max-w-6xl mx-auto p-6 md:p-12">
                    
                    <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                                <ArrowRightLeft size={28} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-white tracking-widest uppercase">AA Switcher</h1>
                                <p className="text-slate-500 font-medium">Coordinate-aware amino acid mutagenesis and codon optimization.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800">
                             <button 
                                onClick={() => setInputType(p => p === 'dna' ? 'aa' : 'dna')}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-300"
                             >
                                Switch to {inputType === 'dna' ? 'Protein' : 'DNA'} Input
                             </button>
                             <button onClick={() => { setRawInput(""); setElements([]); }} className="px-4 py-2 hover:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-500">Reset</button>
                        </div>
                    </header>

                    <div className="grid gap-8">
                        
                        {/* Input Section */}
                        <div className="relative group">
                            <div className="absolute -top-3 left-6 px-3 py-1 bg-[#030712] border border-slate-800 rounded-full text-[10px] font-black text-cyan-400 tracking-widest z-10">
                                {inputType.toUpperCase()} SOURCE SEQUENCE
                            </div>
                            <textarea 
                                value={rawInput}
                                onChange={e => setRawInput(e.target.value)}
                                placeholder={`Paste your ${inputType.toUpperCase()} sequence here...`}
                                className="w-full h-32 bg-slate-950 border-2 border-slate-800 rounded-[2.5rem] p-8 font-mono text-sm uppercase tracking-widest focus:outline-none focus:border-cyan-500/40 focus:ring-8 focus:ring-cyan-500/5 transition-all scrollbar-hide"
                            />
                        </div>

                        {/* Interactive Visualization */}
                        <div className="bg-slate-950 border border-slate-800 rounded-[3rem] p-10 md:p-14 min-h-[500px] shadow-2xl relative overflow-hidden">
                            <div className="flex flex-wrap gap-x-1 gap-y-12">
                                {elements.map((el, i) => {
                                    const isSelected = selectedIndices.includes(i);
                                    const rasmolColor = getAAColor(el.aa);
                                    return (
                                        <div 
                                            key={i} 
                                            className="group/el flex flex-col items-center cursor-pointer relative"
                                            onClick={(e) => handleAASelection(i, e.shiftKey || e.metaKey || e.ctrlKey)}
                                        >
                                            {/* AA display */}
                                            <div 
                                                style={{ 
                                                    color: isSelected ? "#fff" : rasmolColor,
                                                    background: isSelected ? "var(--cyan-500, #06b6d4)" : `${rasmolColor}10`
                                                }}
                                                className={`
                                                w-10 h-10 flex items-center justify-center rounded-xl text-xl font-black transition-all duration-300
                                                ${isSelected 
                                                    ? "shadow-[0_0_20px_rgba(6,182,212,0.5)] scale-110 z-10" 
                                                    : "border border-slate-800 group-hover/el:border-slate-700 group-hover/el:bg-slate-800"}
                                            `}>
                                                {el.aa}
                                            </div>
                                            
                                            {/* Codon display */}
                                            <div className="absolute -bottom-6 flex flex-col items-center">
                                                <div className="text-[10px] font-mono font-bold text-slate-600 group-hover/el:text-slate-400 tracking-tighter transition-colors">
                                                    {el.codon}
                                                </div>
                                                <div className="text-[8px] font-black text-slate-800">
                                                    #{i+1}
                                                </div>
                                            </div>

                                            {/* Selected Marker */}
                                            {isSelected && (
                                                <motion.div 
                                                    layoutId="selection-glow"
                                                    className="absolute -inset-2 bg-cyan-500/10 rounded-2xl blur-lg -z-10" 
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                                {elements.length === 0 && (
                                    <div className="w-full h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-[3rem] text-slate-800">
                                        <Dna size={48} className="mb-4 opacity-20" />
                                        <p className="text-sm font-black uppercase tracking-[0.3em] opacity-40">Awaiting Molecular Data</p>
                                    </div>
                                )}
                            </div>

                            {/* Floating Multi-Select Toolbar */}
                            <AnimatePresence>
                                {selectedIndices.length > 0 && !isMutating && (
                                    <motion.div 
                                        initial={{ y: 50, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: 50, opacity: 0 }}
                                        className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700/50 rounded-2xl p-4 shadow-2xl flex items-center gap-6 z-50 backdrop-blur-xl"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Selected Fragment</span>
                                            <span className="text-xl font-black text-white font-mono tracking-widest leading-none">{selectedAAString}</span>
                                        </div>
                                        <div className="h-8 w-px bg-slate-800" />
                                        <button 
                                            onClick={() => setIsMutating(true)}
                                            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-xs font-black text-white transition-all shadow-lg shadow-cyan-500/20"
                                        >
                                            MUTATE SELECTION
                                        </button>
                                        <button 
                                            onClick={() => setSelectedIndices([])}
                                            className="p-2 text-slate-500 hover:text-slate-200 transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Summary / Result Box */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Export Final Sequence</h3>
                            <div className="flex flex-col gap-4">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-slate-600 uppercase">AA:</span>
                                    <div className="p-4 bg-slate-950 rounded-xl font-mono text-sm break-all border border-slate-800/50 text-cyan-400">
                                        {elements.map(e => e.aa).join("") || "..."}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-slate-600 uppercase">DNA:</span>
                                    <div className="p-4 bg-slate-950 rounded-xl font-mono text-sm break-all border border-slate-800/50 text-slate-400">
                                        {elements.map(e => e.codon).join("") || "..."}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </ToolPageLayout>

            {/* Mutagenesis Modal */}
            <AnimatePresence>
                {isMutating && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMutating(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="relative w-full max-w-2xl bg-[#030712] border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl"
                        >
                            <div className="p-10">
                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Mutagenesis Target</h2>
                                        <p className="text-slate-500 text-sm">Select the target amino acid and choose the encoding codon.</p>
                                    </div>
                                    <button onClick={() => setIsMutating(false)} className="p-2 text-slate-600 hover:text-white transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {selectedIndices.length > 1 ? (
                                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                            {selectedIndices.map((idx) => {
                                                const el = elements[idx];
                                                const target = fragmentTargets[idx] || { aa: el.aa, codon: el.codon };
                                                const rasmolColor = getAAColor(el.aa);
                                                
                                                return (
                                                    <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-[10px] font-black text-slate-500">#{idx + 1}</div>
                                                                <div className="flex items-center gap-2">
                                                                    <span style={{ color: rasmolColor }} className="text-lg font-black">{el.aa}</span>
                                                                    <ArrowRight size={14} className="text-slate-700" />
                                                                    <select 
                                                                        value={target.aa}
                                                                        onChange={(e) => updateFragmentTarget(idx, e.target.value, AA_TO_CODONS[e.target.value][0])}
                                                                        className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-sm font-black text-cyan-400 outline-none"
                                                                    >
                                                                        {Object.keys(AA_TO_CODONS).sort().map(aa => <option key={aa} value={aa}>{aa}</option>)}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Codon Optimization</div>
                                                        </div>

                                                        <div className="flex flex-wrap gap-2">
                                                            {AA_TO_CODONS[target.aa]?.map(c => (
                                                                <button 
                                                                    key={c}
                                                                    onClick={() => updateFragmentTarget(idx, target.aa, c)}
                                                                    className={`px-3 py-2 rounded-xl border font-mono text-xs transition-all ${
                                                                        target.codon === c 
                                                                            ? "bg-cyan-500/20 border-cyan-500 text-cyan-300" 
                                                                            : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                                                                    }`}
                                                                >
                                                                    {getCodonDiffHtml(el.codon, c)}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div className="pt-4 sticky bottom-0 bg-[#030712]">
                                                <button 
                                                    onClick={applyFragmentMutation}
                                                    className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-cyan-600/20"
                                                >
                                                    Apply All Changes to Fragment
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-10">
                                            {/* Selection Preview */}
                                            <div className="flex items-center gap-6 p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                                                <div className="text-center">
                                                    <span className="text-[10px] font-black text-slate-600 block mb-1">ORIGINAL</span>
                                                    <span className="text-2xl font-mono font-black text-slate-400">{selectedAAString}</span>
                                                </div>
                                                <ArrowRight className="text-slate-700" size={24} />
                                                <div className="text-center">
                                                    <span className="text-[10px] font-black text-cyan-500 block mb-1">MUTATE TO</span>
                                                    <span className="text-2xl font-mono font-black text-white">{targetAA || "?"}</span>
                                                </div>
                                            </div>

                                            {/* AA Grid */}
                                            <div>
                                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 block">1. Select Target Amino Acid</label>
                                                <div className="grid grid-cols-7 gap-2">
                                                    {Object.keys(AA_TO_CODONS).sort().map(aa => (
                                                        <button 
                                                            key={aa}
                                                            onClick={() => setTargetAA(aa)}
                                                            className={`
                                                                h-12 rounded-xl text-lg font-black transition-all
                                                                ${targetAA === aa 
                                                                    ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30" 
                                                                    : "bg-slate-900 text-slate-500 hover:bg-slate-800 hover:text-slate-300"}
                                                            `}
                                                        >
                                                            {aa}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Codon Options */}
                                            <AnimatePresence>
                                                {targetAA && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        className="pt-6 border-t border-slate-800"
                                                    >
                                                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 block">2. Select Codon</label>
                                                        <div className="grid sm:grid-cols-2 gap-4">
                                                            {AA_TO_CODONS[targetAA]?.map(codon => {
                                                                const originalCodon = elements[selectedIndices[0]]?.codon || "???";
                                                                return (
                                                                    <button 
                                                                        key={codon}
                                                                        onClick={() => applyMutation(targetAA, codon)}
                                                                        className="group/cd bg-slate-900/30 hover:bg-cyan-500/10 border border-slate-800 hover:border-cyan-500/40 p-5 rounded-2xl flex items-center justify-between transition-all"
                                                                    >
                                                                        <div className="flex flex-col items-start gap-1">
                                                                            <div className="text-2xl font-mono tracking-[0.2em]">
                                                                                {getCodonDiffHtml(originalCodon, codon)}
                                                                            </div>
                                                                            <span className="text-[9px] font-black text-slate-600 uppercase">Changes: {
                                                                                codon.split("").filter((nt, i) => nt !== originalCodon[i]).length
                                                                            } nt</span>
                                                                        </div>
                                                                        <Plus size={20} className="text-slate-700 group-hover/cd:text-cyan-400" />
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

