"use client";

import React, { useMemo, useState } from "react";
import { Dna, Activity, Rocket, Wand2, Copy } from "lucide-react";
import Navbar from "@/components/Navbar";
import ToolPageLayout from "@/components/ToolPageLayout";
import { Score, Stat, card, inputCls, btn, OrgSelect, ExternalValidation, downloadCsv } from "@/components/mrna/ui";
import { getOrganism } from "@/lib/mrna/codonTables";
import {
  analyzeStability, analyzeTranslation, optimize, cleanSeq, Strategy,
} from "@/lib/mrna/analysis";

type Tab = "stability" | "translation" | "optimizer";

const TABS: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "stability", label: "Stability Profiler", icon: Activity, desc: "GC, folding ΔG, decay motifs, codon optimality" },
  { id: "translation", label: "Translation Potential", icon: Rocket, desc: "Kozak, uORFs, 5′ structure, CAI" },
  { id: "optimizer", label: "Codon Optimizer", icon: Wand2, desc: "Organism-specific synonymous recoding" },
];

const EXAMPLE_CDS =
  "ATGAAAACCGCTTACATTGCCAAGCAGCGTCAGATTTCCTTCGTGAAGTCCCACTTCTCCCGGCAGCTGGAGGAGCGCCTGGGCCTGATCGAGGTGCAGGCCCCCATCCTGTCCCGGGTGGGCGACGGCACCCAGGACAACCTGAGCGGCGCCGAGAAGGCCGTGCAGGTGAAGGTGAAGGCCCTGCCCGACGCCCAGTTCGAGGTGGTGCACAGCCTGGCCAAGTGGAAGCGGCAGACCCTGGGCCAGCACGACTTCAGCGCCGGCGAGGGCCTGTACACCCACATGAAGGCCCTGCGGCCCGACTAA";


export default function MrnaSuite() {
  const [tab, setTab] = useState<Tab>("stability");
  const [orgId, setOrgId] = useState("human");
  const [utr5, setUtr5] = useState("GGGAGACCCAAGCUGGCUAGCGCCACC");
  const [cds, setCds] = useState(EXAMPLE_CDS);
  const [utr3, setUtr3] = useState("");
  const [strategy, setStrategy] = useState<Strategy>("max");
  const [avoid, setAvoid] = useState("GAATTC, GGATCC");
  const [gcMin, setGcMin] = useState(45);
  const [gcMax, setGcMax] = useState(60);
  const [optInput, setOptInput] = useState(EXAMPLE_CDS);
  const [optOrg, setOptOrg] = useState("ecoli");
  const [copied, setCopied] = useState(false);

  const org = getOrganism(orgId);
  const u5 = cleanSeq(utr5), c = cleanSeq(cds), u3 = cleanSeq(utr3);

  const stability = useMemo(
    () => (tab === "stability" && c.length >= 9 ? analyzeStability(u5 + c + u3, c, org) : null),
    [tab, u5, c, u3, org],
  );
  const translation = useMemo(
    () => (tab === "translation" && c.length >= 9 ? analyzeTranslation(u5, c, org) : null),
    [tab, u5, c, org],
  );
  const optimized = useMemo(() => {
    if (tab !== "optimizer") return null;
    const raw = optInput.trim();
    const isProt = /[^ACGTUacgtu\s>]/.test(raw.replace(/^>.*$/gm, ""));
    const seq = isProt ? raw.replace(/^>.*$/gm, "").replace(/[^A-Za-z*]/g, "").toUpperCase() : cleanSeq(raw);
    if (seq.length < 3) return null;
    return optimize(seq, {
      org: getOrganism(optOrg), strategy, gcTarget: [gcMin, gcMax],
      avoid: avoid.split(/[,\s]+/).filter(Boolean),
    });
  }, [tab, optInput, optOrg, strategy, gcMin, gcMax, avoid]);

  const copy = (t: string) => {
    navigator.clipboard.writeText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };


  const csvStability = () => {
    if (!stability) return;
    const s = stability;
    downloadCsv("mrna_stability.csv", [
      ["Parameter", "Value"],
      ["Organism", org.name], ["Length", s.length], ["GC %", s.gc.toFixed(2)], ["GC3 %", s.gc3.toFixed(2)],
      ["CAI", s.cai.toFixed(3)], ["Mean window dG (kcal/mol)", s.meanWindowDG.toFixed(2)],
      ["dG per nt", s.dGPerNt.toFixed(4)], ["ATTTA count", s.are.length], ["Poly(A) signals", s.pas.length],
      ["DRACH motifs", s.drach], ["UpA %", s.upa.toFixed(2)], ["Homopolymers", s.homopolymers],
      ["Rare-codon clusters", s.rareCodonRuns], ["Stability score", s.score.toFixed(1)],
      ["Findings", s.flags.join(" | ")],
      [], ["Window start", "dG (kcal/mol)"], ...s.windows.map((w) => [w.start + 1, w.dG.toFixed(2)]),
    ]);
  };
  const csvTranslation = () => {
    if (!translation) return;
    const r = translation;
    downloadCsv("mrna_translation.csv", [
      ["Parameter", "Value"],
      ["Organism", org.name], ["Valid CDS", r.validCDS ? "yes" : "no"], ["Issues", r.issues.join(" | ")],
      ["Kozak score", r.kozak.score], ["Kozak label", r.kozak.label], ["-3 base", r.kozak.minus3], ["+4 base", r.kozak.plus4],
      ["uORFs", r.uorfs], ["5'UTR length", r.utrLen], ["5'UTR GC %", r.utrGC.toFixed(2)],
      ["5' dG (60nt)", r.fiveDG.toFixed(2)], ["CAI", r.cai.toFixed(3)], ["GC3 %", r.gc3.toFixed(2)],
      ["Rare-codon clusters", r.rareClusters], ["Translation score", r.score.toFixed(1)],
    ]);
  };
  const csvOptimizer = () => {
    if (!optimized) return;
    const o = optimized;
    downloadCsv("mrna_codon_optimization.csv", [
      ["Parameter", "Value"],
      ["Target organism", getOrganism(optOrg).name], ["Strategy", strategy],
      ["CAI before", isNaN(o.before.cai) ? "" : o.before.cai.toFixed(3)], ["CAI after", o.after.cai.toFixed(3)],
      ["GC % after", o.after.gc.toFixed(2)], ["GC3 % after", o.after.gc3.toFixed(2)],
      ["Codons changed", o.changedCodons], ["Total codons", o.totalCodons],
      ["Unremoved motifs", o.remainingMotifs.join(" | ")],
      ["Protein", o.protein], ["Optimized DNA", o.dna],
    ]);
  };

  const Inputs = (
    <div className="grid gap-4">
      <div className="grid md:grid-cols-3 gap-4">
        <div><label className="text-xs text-slate-500 uppercase">5′ UTR</label>
          <textarea className={inputCls + " h-24"} value={utr5} onChange={(e) => setUtr5(e.target.value)} /></div>
        <div><label className="text-xs text-slate-500 uppercase">CDS (ATG…stop)</label>
          <textarea className={inputCls + " h-24"} value={cds} onChange={(e) => setCds(e.target.value)} /></div>
        <div><label className="text-xs text-slate-500 uppercase">3′ UTR</label>
          <textarea className={inputCls + " h-24"} value={utr3} onChange={(e) => setUtr3(e.target.value)} /></div>
      </div>
      <div className="max-w-sm"><label className="text-xs text-slate-500 uppercase">Host organism</label>
        <OrgSelect value={orgId} onChange={setOrgId} /></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200">
      <Navbar />
      <div className="h-16" />
      <ToolPageLayout>
        <main className="max-w-5xl mx-auto p-6 md:p-12">
          <header className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
              <Dna size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">mRNA Analyzer Suite</h1>
              <p className="text-slate-500">Stability, translation potential and organism-specific codon optimization — runs entirely in your browser.</p>
            </div>
          </header>

          <div className="flex flex-wrap gap-2 mb-8">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition ${
                  tab === t.id ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300" : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"}`}>
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-500 mb-6">{TABS.find((t) => t.id === tab)?.desc}</p>

          {tab === "stability" && (
            <div className="grid gap-6">
              {Inputs}
              {stability && (
                <>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="space-y-3"><Score value={stability.score} label="Stability score" /><button className={btn + " w-full"} onClick={csvStability}>⬇ Export CSV</button></div>
                    <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Stat k="Length" v={stability.length} />
                      <Stat k="GC %" v={stability.gc.toFixed(1)} />
                      <Stat k="GC3 %" v={stability.gc3.toFixed(1)} />
                      <Stat k="CAI" v={stability.cai.toFixed(3)} hint="Codon Adaptation Index vs host" />
                      <Stat k="Mean ΔG / 120nt" v={stability.meanWindowDG.toFixed(1)} hint="kcal/mol, approximate folding" />
                      <Stat k="ATTTA (ARE)" v={stability.are.length} />
                      <Stat k="DRACH (m6A)" v={stability.drach} />
                      <Stat k="UpA %" v={stability.upa.toFixed(1)} />
                    </div>
                  </div>
                  <div className={card}>
                    <h3 className="font-bold text-white mb-3">Findings</h3>
                    {stability.flags.length ? (
                      <ul className="list-disc ml-5 space-y-1 text-sm text-amber-300">{stability.flags.map((f) => <li key={f}>{f}</li>)}</ul>
                    ) : <p className="text-sm text-emerald-400">No major destabilising features detected.</p>}
                  </div>
                  <div className={card}>
                    <h3 className="font-bold text-white mb-3">Folding profile (ΔG per 120-nt window)</h3>
                    <div className="flex items-end gap-1 h-32">
                      {stability.windows.map((w) => {
                        const h = Math.min(100, Math.abs(w.dG) * 1.6);
                        return <div key={w.start} title={`${w.start}: ${w.dG.toFixed(1)} kcal/mol`}
                          className="flex-1 bg-cyan-500/60 rounded-t" style={{ height: `${h}%` }} />;
                      })}
                    </div>
                  </div>
                </>
              )}
              <ExternalValidation items={[
                { name: "ViennaRNA RNAfold WebServer", url: "http://rna.tbi.univie.ac.at/cgi-bin/RNAfold.cgi", note: "Validate full Turner-parameter folding MFE & base-pair probabilities." },
                { name: "AREsite2", url: "http://rna.tbi.univie.ac.at/AREsite", note: "Cross-check AU-, GU- and U-rich mRNA decay motifs & RBP sites." },
              ]} />
            </div>
          )}

          {tab === "translation" && (
            <div className="grid gap-6">
              {Inputs}
              {translation && (
                <>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="space-y-3"><Score value={translation.score} label="Translation potential" /><button className={btn + " w-full"} onClick={csvTranslation}>⬇ Export CSV</button></div>
                    <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Stat k="Kozak" v={translation.kozak.label} hint={`-3: ${translation.kozak.minus3}, +4: ${translation.kozak.plus4}`} />
                      <Stat k="uORFs (ATG)" v={translation.uorfs} />
                      <Stat k="5′UTR length" v={translation.utrLen} />
                      <Stat k="5′ ΔG (60nt)" v={translation.fiveDG.toFixed(1)} />
                      <Stat k="CAI" v={translation.cai.toFixed(3)} />
                      <Stat k="GC3 %" v={translation.gc3.toFixed(1)} />
                      <Stat k="Rare clusters" v={translation.rareClusters} />
                      <Stat k="5′UTR GC %" v={translation.utrGC.toFixed(1)} />
                    </div>
                  </div>
                  <div className={card}>
                    <h3 className="font-bold text-white mb-2">CDS validation</h3>
                    {translation.validCDS
                      ? <p className="text-sm text-emerald-400">Valid ORF: starts with ATG, in-frame, single terminal stop.</p>
                      : <ul className="list-disc ml-5 text-sm text-rose-400">{translation.issues.map((i) => <li key={i}>{i}</li>)}</ul>}
                  </div>
                </>
              )}
              <ExternalValidation items={[
                { name: "TIsigner", url: "https://tisigner.com", note: "Validate 5′ translation-initiation accessibility & start-codon opening energy." },
                { name: "Salis Lab RBS Calculator / De Novo DNA", url: "https://salislab.net/software/", note: "Thermodynamic translation initiation rate & 5′ leader modeling." },
              ]} />
            </div>
          )}

          {tab === "optimizer" && (
            <div className="grid gap-6">
              <div><label className="text-xs text-slate-500 uppercase">DNA/RNA CDS or protein sequence</label>
                <textarea className={inputCls + " h-32"} value={optInput} onChange={(e) => setOptInput(e.target.value)} /></div>
              <div className="grid md:grid-cols-3 gap-4">
                <div><label className="text-xs text-slate-500 uppercase">Target organism</label>
                  <OrgSelect value={optOrg} onChange={setOptOrg} /></div>
                <div><label className="text-xs text-slate-500 uppercase">Strategy</label>
                  <select className={inputCls + " !p-3"} value={strategy} onChange={(e) => setStrategy(e.target.value as Strategy)}>
                    <option value="max">Maximize CAI (most frequent codon)</option>
                    <option value="match">Match host codon frequencies</option>
                    <option value="gc">Maximize CAI within GC range</option>
                  </select></div>
                <div><label className="text-xs text-slate-500 uppercase">Avoid sites (comma-separated)</label>
                  <input className={inputCls + " !p-3"} value={avoid} onChange={(e) => setAvoid(e.target.value)} /></div>
              </div>
              {strategy === "gc" && (
                <div className="flex gap-4 items-center text-sm">
                  GC range % <input type="number" className={inputCls + " !w-24 !p-2"} value={gcMin} onChange={(e) => setGcMin(+e.target.value)} />
                  – <input type="number" className={inputCls + " !w-24 !p-2"} value={gcMax} onChange={(e) => setGcMax(+e.target.value)} />
                </div>
              )}
              {optimized && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <Stat k="CAI before" v={isNaN(optimized.before.cai) ? "–" : optimized.before.cai.toFixed(3)} />
                    <Stat k="CAI after" v={optimized.after.cai.toFixed(3)} />
                    <Stat k="GC % after" v={optimized.after.gc.toFixed(1)} />
                    <Stat k="GC3 % after" v={optimized.after.gc3.toFixed(1)} />
                    <Stat k="Codons changed" v={`${optimized.changedCodons}/${optimized.totalCodons}`} />
                  </div>
                  {optimized.remainingMotifs.length > 0 && (
                    <p className="text-sm text-amber-300">Could not remove: {optimized.remainingMotifs.join(", ")}</p>
                  )}
                  {optimized.log.map((l) => <p key={l} className="text-xs text-slate-500">{l}</p>)}
                  <div className={card}>
                    <div className="flex justify-between mb-2">
                      <h3 className="font-bold text-white">Optimized sequence <button className="ml-3 text-xs text-cyan-400" onClick={csvOptimizer}>⬇ Export CSV</button></h3>
                      <button onClick={() => copy(optimized.dna)} className="text-xs flex items-center gap-1 text-cyan-400">
                        <Copy size={12} /> {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="font-mono text-xs break-all text-slate-300">{optimized.dna}</p>
                  </div>
                </>
              )}
              <ExternalValidation items={[
                { name: "JCat (Java Codon Adaptation Tool)", url: "http://www.jcat.de/", note: "Cross-check organism-specific CAI & codon optimization." },
                { name: "IDT Codon Optimization Tool", url: "https://www.idtdna.com/CodonOpt", note: "Validate codon usage, complexity & synthesis compatibility." },
              ]} />
            </div>
          )}

          <p className="text-xs text-slate-600 mt-10">
            Scores are heuristic estimates built from published determinants (codon optimality, GC, AU-rich elements, Kozak
            context, uORFs, secondary structure). Codon tables are approximate; folding uses a simplified stack-based model.
            Validate critical constructs experimentally.
          </p>
        </main>
      </ToolPageLayout>
    </div>
  );
}
