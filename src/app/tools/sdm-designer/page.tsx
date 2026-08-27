"use client";

import React, { useState, useCallback } from "react";
import { Dna, Settings2, Info, Copy, ChevronLeft, FlaskConical, Zap, CheckCircle2, ArrowDown, ArrowUp, ThermometerSun } from "lucide-react";
import Link from "next/link";

interface SDMResult {
  fwdPrimer: string;
  revPrimer: string;
  tm: number;
  fwdStart: number;  // 0-based index in clean WT sequence
  fwdEnd: number;
  mutStartInFwd: number;  // 0-based position within the primer
  mutEndInFwd: number;
  cleanSeq: string;
  replacementLen: number;
}

function getReverseComplement(seq: string): string {
  const map: Record<string, string> = { A: "T", T: "A", C: "G", G: "C" };
  return seq.split("").reverse().map((b) => map[b] ?? b).join("");
}

function calculateTm(seq: string): number {
  const gc = (seq.match(/[GC]/g) || []).length;
  if (seq.length < 14) return (seq.match(/[AT]/g) || []).length * 2 + gc * 4;
  return 64.9 + 41 * (gc - 16.4) / seq.length;
}

function designPrimers(sequence: string, mutStart: number, mutEnd: number, replacement: string): SDMResult | null {
  const cleanSeq = sequence.replace(/\s/g, "").toUpperCase();
  const rep = replacement.toUpperCase();
  if (!cleanSeq || mutStart < 1 || mutEnd < mutStart || mutEnd > cleanSeq.length) return null;

  const startIdx = mutStart - 1; // 0-based inclusive start of mutation
  const endIdx   = mutEnd;       // 0-based exclusive end of mutation

  const leftFlank  = cleanSeq.substring(0, startIdx);
  const rightFlank = cleanSeq.substring(endIdx);

  // SDM best-practice: 40–80 bp total primer (20–40 bp each flank), Tm ≥ 78°C.
  // Start at 20 bp and grow by 3 each iteration until Tm target met or max reached.
  const MIN_FLANK = 20;
  const MAX_FLANK = 40;
  const TM_TARGET = 78;

  let leftLen  = Math.min(MIN_FLANK, leftFlank.length);
  let rightLen = Math.min(MIN_FLANK, rightFlank.length);
  let fwd = "";

  while (true) {
    const left  = leftFlank.slice(-leftLen);
    const right = rightFlank.slice(0, rightLen);
    fwd = left + rep + right;
    const tm = calculateTm(fwd);

    const canGrowLeft  = leftLen  < leftFlank.length  && leftLen  < MAX_FLANK;
    const canGrowRight = rightLen < rightFlank.length && rightLen < MAX_FLANK;

    if (tm >= TM_TARGET || (!canGrowLeft && !canGrowRight)) break;

    // Grow the shorter flank first to keep the mutation centred
    if (canGrowLeft  && leftLen  <= rightLen) leftLen  = Math.min(leftLen  + 3, MAX_FLANK);
    else if (canGrowRight)                    rightLen = Math.min(rightLen + 3, MAX_FLANK);
    else if (canGrowLeft)                     leftLen  = Math.min(leftLen  + 3, MAX_FLANK);
    else break;
  }

  const actualLeftLen = Math.min(leftLen, leftFlank.length);
  const rev = getReverseComplement(fwd);
  const tm  = calculateTm(fwd);

  // Absolute 0-based position in the WT sequence where the fwd primer starts
  const fwdStartInWT   = startIdx - actualLeftLen;
  const mutStartInFwd  = actualLeftLen; // mutation always starts right after the left flank

  return {
    fwdPrimer: fwd,
    revPrimer: rev,
    tm,
    fwdStart:     Math.max(0, fwdStartInWT),
    fwdEnd:       Math.max(0, fwdStartInWT) + fwd.length,
    mutStartInFwd,
    mutEndInFwd:  mutStartInFwd + rep.length,
    cleanSeq,
    replacementLen: rep.length,
  };
}

/** Render a primer sequence with a per-base aligned ruler and mutation highlighting */
function PrimerDisplay({
  primer,
  label,
  color,
  mutStart,
  mutEnd,
  onCopy,
  tm,
}: {
  primer: string;
  label: string;
  color: "rose" | "blue";
  mutStart: number;
  mutEnd: number;
  onCopy: () => void;
  tm: number;
}) {
  const colorCls = color === "rose" ? "text-rose-400 border-rose-500/30 bg-rose-500/5" : "text-blue-400 border-blue-500/30 bg-blue-500/5";
  const labelCls = color === "rose" ? "text-rose-400" : "text-blue-400";
  const gcPct = Math.round(((primer.match(/[GC]/g) || []).length / primer.length) * 100);

  // Each base gets its own cell, ruler and base are stacked inside the same cell.
  // This guarantees the ruler number lands directly above its base — no offset math.
  const CELL = "inline-flex flex-col items-center font-mono shrink-0";

  const cells = primer.split("").map((base, i) => {
    const isMut = i >= mutStart && i < mutEnd;
    const pos = i + 1; // 1-based display position

    // Show tick label every 10 bases (right-aligned so "10" sits at position 10)
    // We show the number at pos 10, 20, 30… and a small tick at pos 5, 15, 25…
    const rulerLabel =
      pos % 10 === 0 ? (
        <span className="text-[9px] text-slate-500 leading-none whitespace-nowrap"
          style={{ marginLeft: `${-(String(pos).length - 1) * 0.55}ch` }}>
          {pos}
        </span>
      ) : pos % 5 === 0 ? (
        <span className="text-[9px] text-slate-700 leading-none">·</span>
      ) : (
        <span className="text-[9px] leading-none opacity-0">·</span> // spacer so height is consistent
      );

    return (
      <span
        key={i}
        className={CELL}
        title={`Position ${pos}${isMut ? " ★ MUTATED" : ""}`}
      >
        {rulerLabel}
        <span
          className={
            isMut
              ? "font-bold text-red-400 underline decoration-red-400 decoration-2 underline-offset-1"
              : "text-slate-200"
          }
        >
          {base}
        </span>
      </span>
    );
  });

  return (
    <div className={`rounded-lg p-4 border ${colorCls}`}>
      <div className="flex justify-between items-center mb-3">
        <span className={`font-semibold text-sm ${labelCls}`}>{label}</span>
        <button
          className="text-slate-500 hover:text-white transition-colors p-1"
          onClick={onCopy}
          title="Copy to clipboard"
        >
          <Copy size={14} />
        </button>
      </div>

      {/* Sequence with inline ruler */}
      <div className="font-mono text-sm bg-slate-950 px-3 py-2 rounded border border-slate-800 overflow-x-auto">
        <div className="flex flex-nowrap">{cells}</div>
      </div>

      {/* Stats */}
      <div className="mt-2 grid grid-cols-3 text-xs text-slate-500 gap-2">
        <span className="bg-slate-800 rounded px-2 py-1 text-center">
          <span className="block text-slate-300 font-medium">{primer.length}</span> bp
        </span>
        <span className="bg-slate-800 rounded px-2 py-1 text-center">
          <span className="block text-slate-300 font-medium">{gcPct}%</span> GC
        </span>
        <span className="bg-slate-800 rounded px-2 py-1 text-center">
          <span className={`block font-medium ${tm >= 72 ? "text-emerald-400" : "text-amber-400"}`}>
            {tm.toFixed(1)}°C
          </span> Tm
        </span>
      </div>
    </div>
  );
}

/** Visual diagram of WT sequence with primer spans aligned per-base */
function SequenceMap({ result, mutStart, mutEnd }: { result: SDMResult; mutStart: number; mutEnd: number }) {
  const { cleanSeq, fwdStart, fwdEnd } = result;
  const revStart = fwdStart;
  const revEnd = fwdEnd;

  // Shared cell style — every cell is exactly 1ch wide in a monospace font
  // We use inline-flex to stack the 5 elements (ruler, fwdBar, base, antisenseBase, revBar) in a single column per char
  const CELL = "inline-flex flex-col items-center justify-end font-mono text-xs w-[1ch] shrink-0";

  // Build per-character cells and let CSS flex-wrap handle the row breaking automatically
  const cells = cleanSeq.split("").map((base, absIdx) => {
    const isMut = absIdx >= mutStart - 1 && absIdx < mutEnd;
    const inFwd = absIdx >= fwdStart && absIdx < fwdEnd;
    const inRev = absIdx >= revStart && absIdx < revEnd;
    const pos = absIdx + 1;

    // Show tick label every 10 bases (right-aligned so "10" sits at position 10)
    // We show the number at pos 10, 20, 30… and a small tick at pos 5, 15, 25…
    const rulerLabel =
      pos % 10 === 0 ? (
        <span className="text-[9px] text-slate-500 leading-none whitespace-nowrap mb-[1px]"
          style={{ marginLeft: `${-(String(pos).length - 1) * 0.55}ch` }}>
          {pos}
        </span>
      ) : pos % 5 === 0 ? (
        <span className="text-[9px] text-slate-700 leading-none mb-[1px]">·</span>
      ) : (
        <span className="text-[9px] leading-none opacity-0 mb-[1px]">·</span> // spacer so height is consistent
      );

    // Fwd bar: solid line ABOVE the base (for bases inside fwd span)
    const fwdBar = (
      <span
        key="f"
        className={[
          "block w-full h-[3px] rounded-sm mb-[1px]",
          inFwd ? "bg-rose-500" : "bg-transparent",
        ].join(" ")}
      />
    );

    // Base character (Sense strand)
    const baseChar = (
      <span
        key="b"
        className={[
          isMut ? "font-bold text-red-400" : inFwd ? "text-emerald-300" : "text-slate-400",
        ].join(" ")}
        title={`Sense bp ${pos}${isMut ? " ★ MUTATED" : ""}`}
      >
        {base}
      </span>
    );

    // Antisense character
    const compMap: Record<string, string> = { A: "T", T: "A", C: "G", G: "C" };
    const compBase = compMap[base] ?? base;
    const antisenseChar = (
      <span
        key="ab"
        className={[
          isMut ? "font-bold text-red-400" : inRev ? "text-emerald-300" : "text-slate-500",
        ].join(" ")}
        title={`Antisense bp ${pos}${isMut ? " ★ MUTATED" : ""}`}
      >
        {compBase}
      </span>
    );

    // Rev bar: solid line BELOW the antisense base (for bases inside rev span)
    const revBar = (
      <span
        key="r"
        className={[
          "block w-full h-[3px] rounded-sm mt-[1px]",
          inRev ? "bg-blue-500" : "bg-transparent",
        ].join(" ")}
      />
    );

    return (
      <span key={absIdx} className={CELL}>
        {rulerLabel}
        {fwdBar}
        {baseChar}
        {antisenseChar}
        {revBar}
      </span>
    );
  });

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 p-4">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Sequence Map</h3>
      <p className="text-[10px] text-slate-500 mb-3">
        <span className="text-rose-400 font-bold">▬</span> Forward primer (above, sense) &nbsp;|&nbsp;
        <span className="text-blue-400 font-bold">▬</span> Reverse primer (below, antisense) &nbsp;|&nbsp;
        <span className="text-red-400 font-bold">★</span> Mutated bases
      </p>

      {/* Legend labels row */}
      <div className="flex items-center gap-6 mb-3 text-[10px]">
        <span className="flex items-center gap-1 text-rose-400"><ArrowDown size={10} /> Fwd primer → (sense strand)</span>
        <span className="flex items-center gap-1 text-blue-400"><ArrowUp size={10} /> Rev primer ← (antisense strand)</span>
      </div>

      {/* Sequence with auto-wrap */}
      <div className="flex flex-wrap gap-y-4 mb-3 leading-none">
        {cells}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-2 text-[11px] text-slate-400 border-t border-slate-800 pt-3">
        <span className="flex items-center gap-1"><span className="w-3 h-1.5 bg-rose-500 rounded inline-block" /> Fwd primer span</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1.5 bg-blue-500 rounded inline-block" /> Rev primer span</span>
        <span className="flex items-center gap-1 text-red-400 font-bold">A</span><span>Mutated bases (bold red)</span>
        <span className="flex items-center gap-1 text-emerald-300">A</span><span>Primer WT flanks</span>
        <span className="flex items-center gap-1 text-slate-400">A</span><span>Outside primer region</span>
      </div>
    </div>
  );
}

/** PCR Reaction & Cycling conditions panel */
function ReactionProtocol({ tm }: { tm: number }) {
  const annealingTemp = Math.max(55, tm - 5);
  const components = [
    { name: "2× Phusion/Q5 HiFi Master Mix", volume: "12.5 µL" },
    { name: "Forward SDM Primer (10 µM)", volume: "1.25 µL" },
    { name: "Reverse SDM Primer (10 µM)", volume: "1.25 µL" },
    { name: "Template Plasmid DNA (10–50 ng)", volume: "~1 µL" },
    { name: "Nuclease-free ddH₂O", volume: "to 25 µL" },
  ];

  const cycles = [
    { step: "Initial Denaturation", temp: "98°C", time: "30 sec", note: "1×" },
    { step: "Denaturation", temp: "98°C", time: "10 sec", note: "18–25×" },
    { step: "Annealing", temp: `${annealingTemp.toFixed(0)}°C`, time: "30 sec", note: "18–25×", highlight: true },
    { step: "Extension", temp: "72°C", time: "30 sec/kb", note: "18–25×" },
    { step: "Final Extension", temp: "72°C", time: "5 min", note: "1×" },
    { step: "Hold", temp: "4°C", time: "∞", note: "" },
  ];

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-xl backdrop-blur-sm space-y-5">
      <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-2 flex items-center gap-2">
        <FlaskConical size={18} className="text-amber-400" />
        SDM Reaction Setup
      </h2>

      {/* Components */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Reaction Components (25 µL)</h3>
        <table className="w-full text-sm">
          <tbody>
            {components.map((c, i) => (
              <tr key={i} className="border-b border-slate-700/50 last:border-0">
                <td className="py-1.5 pr-3 text-slate-300">{c.name}</td>
                <td className="py-1.5 text-right font-mono text-emerald-400 whitespace-nowrap">{c.volume}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cycling */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
          <ThermometerSun size={12} /> PCR Cycling Program
        </h3>
        <div className="space-y-1">
          {cycles.map((c, i) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded px-3 py-1.5 text-sm ${
                c.highlight ? "bg-amber-500/10 border border-amber-500/30" : "bg-slate-900/60"
              }`}
            >
              <span className="text-slate-300 w-40">{c.step}</span>
              <span className={`font-mono font-bold ${c.highlight ? "text-amber-400" : "text-white"}`}>{c.temp}</span>
              <span className="text-slate-400 font-mono">{c.time}</span>
              <span className="text-slate-500 text-xs w-14 text-right">{c.note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Post-PCR */}
      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300 space-y-1">
        <p className="font-semibold">Post-PCR Steps (QuikChange Protocol)</p>
        <p>1. Add <strong>1 µL DpnI</strong> restriction enzyme to digest the methylated template plasmid. Incubate 37°C × 1 hour.</p>
        <p>2. Transform 2–5 µL of DpnI-treated product into <strong>competent E. coli</strong> (e.g., XL10-Gold or DH5α).</p>
        <p>3. Pick colonies and confirm mutation by <strong>Sanger sequencing</strong>.</p>
      </div>
    </div>
  );
}

// Example: KRAS-like sequence ~180 bp. Codon 12 (GGT→GAT, Gly→Asp, G12D hotspot) is at positions 91–93.
const EXAMPLE_SEQUENCE =
  "ATGGCCAGGTACGCGCTGCGCGAGGTGCAGTTCAAGCAGCTGACCATCGACGTGGACGACGGCCTGCAGCAGCGGATCTTCGTG" +
  "ACCAAGGGTCTGGACCACATGCACAAGTACGGCATCGTGGACATCATGGAGCAGAAGTGCAAGCAGGAGATCGGCAAGCGCATC" +
  "GAGGAGCTGGTGTAA";

export default function SDMPrimerDesigner() {
  const [sequence, setSequence] = useState<string>(EXAMPLE_SEQUENCE);
  const [mutationStart, setMutationStart] = useState<number>(91);
  const [mutationEnd, setMutationEnd] = useState<number>(93);
  const [replacement, setReplacement] = useState<string>("GAT");
  const [result, setResult] = useState<SDMResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasDesigned, setHasDesigned] = useState(false);

  const handleDesign = useCallback(() => {
    setError(null);
    const cleanSeq = sequence.replace(/\s/g, "").toUpperCase();
    if (!cleanSeq) { setError("Please enter a Wild-Type sequence."); return; }
    if (mutationStart < 1 || mutationEnd < mutationStart) { setError("Invalid mutation positions."); return; }
    if (mutationEnd > cleanSeq.length) { setError(`Mutation end (${mutationEnd}) exceeds sequence length (${cleanSeq.length}).`); return; }
    if (!replacement.trim()) { setError("Please enter a replacement sequence."); return; }

    const r = designPrimers(sequence, mutationStart, mutationEnd, replacement);
    if (!r) { setError("Could not design primers — check your inputs."); return; }
    setResult(r);
    setHasDesigned(true);
  }, [sequence, mutationStart, mutationEnd, replacement]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center py-10 px-4 md:px-8">
      <div className="w-full max-w-5xl mb-8">
        <Link href="/tools/dna" className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 mb-4 transition-colors">
          <ChevronLeft size={16} className="mr-1" /> Back to DNA Tools
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
          <Dna className="mr-3 text-rose-400" size={32} />
          Site-Directed Mutagenesis (SDM) Designer
        </h1>
        <p className="text-slate-400">
          Design overlapping primers for QuikChange-style SDM. Specify the wild-type sequence and the desired mutation to instantly generate optimized primers and a complete reaction protocol.
        </p>
      </div>

      <div className="w-full max-w-5xl space-y-6">

        {/* --- Input Card --- */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-xl backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2 flex items-center gap-2">
            <Settings2 size={18} className="text-rose-400" /> Mutation Setup
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sequence input */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Wild-Type Sequence <span className="text-slate-500">(paste 40–80 bp surrounding your target site)</span>
              </label>
              <textarea
                value={sequence}
                onChange={(e) => { setSequence(e.target.value); setHasDesigned(false); }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-rose-500 transition-colors h-20"
                placeholder="Paste ~50 bp surrounding your mutation site..."
                spellCheck={false}
              />
              <p className="text-xs text-slate-500 mt-1">Position 1 = the first character above. Centre your target codon within the window.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Mutation Start Position (bp)</label>
              <input
                type="number"
                value={mutationStart}
                onChange={(e) => { setMutationStart(Number(e.target.value)); setHasDesigned(false); }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-rose-500"
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Mutation End Position (bp, inclusive)</label>
              <input
                type="number"
                value={mutationEnd}
                onChange={(e) => { setMutationEnd(Number(e.target.value)); setHasDesigned(false); }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-rose-500"
                min={1}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-1">Replacement Bases</label>
              <input
                type="text"
                value={replacement}
                onChange={(e) => { setReplacement(e.target.value); setHasDesigned(false); }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono uppercase focus:outline-none focus:border-rose-500"
                placeholder="e.g. TTA (Stop codon) | GCC (point mutation)"
              />
            </div>
          </div>

          {/* DESIGN BUTTON */}
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleDesign}
              className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-rose-900/40 transition-all active:scale-95"
            >
              <Zap size={18} />
              Design SDM Primers
            </button>
            {hasDesigned && result && (
              <span className="flex items-center gap-1 text-sm text-emerald-400">
                <CheckCircle2 size={16} /> Primers designed
              </span>
            )}
            {error && <span className="text-sm text-red-400">{error}</span>}
          </div>
        </div>

        {/* --- Results (only shown after Design clicked) --- */}
        {result && hasDesigned && (
          <>
            {/* Sequence Map */}
            <SequenceMap result={result} mutStart={mutationStart} mutEnd={mutationEnd} />

            {/* Primers side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PrimerDisplay
                primer={result.fwdPrimer}
                label="→ Forward Primer (Sense Strand)"
                color="rose"
                mutStart={result.mutStartInFwd}
                mutEnd={result.mutEndInFwd}
                onCopy={() => navigator.clipboard.writeText(result.fwdPrimer)}
                tm={result.tm}
              />
              <PrimerDisplay
                primer={result.revPrimer}
                label="← Reverse Primer (Antisense)"
                color="blue"
                mutStart={result.fwdPrimer.length - result.mutEndInFwd}
                mutEnd={result.fwdPrimer.length - result.mutStartInFwd}
                onCopy={() => navigator.clipboard.writeText(result.revPrimer)}
                tm={result.tm}
              />
            </div>

            {/* Tm warning */}
            {result.tm < 72 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex items-start gap-2">
                <Info size={16} className="shrink-0 mt-0.5" />
                <p>Primer Tm ({result.tm.toFixed(1)}°C) is below the recommended 78°C for QuikChange SDM. Consider extending your input sequence window so longer flanking regions can be used, or switching to a newer overlap-extension protocol.</p>
              </div>
            )}

            {/* Reaction Protocol */}
            <ReactionProtocol tm={result.tm} />
          </>
        )}
      </div>
    </div>
  );
}
