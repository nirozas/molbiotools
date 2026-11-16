"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, Copy, Download, GitCompare, Network } from "lucide-react";
import { MrnaShell, card, inputCls, btn, Stat, OrgSelect, download, Help, ExternalValidation, downloadCsv } from "@/components/mrna/ui";
import { getOrganism } from "@/lib/mrna/codonTables";
import {
  generateCandidates, Candidate, Goal, UtrMode, saveRecords, toFasta, STRUCT_KEY, findOrfs, Orf, annotateMrna, MrnaRecord,
} from "@/lib/mrna/params";
import { cleanSeq } from "@/lib/mrna/analysis";
import { libraryFor } from "@/lib/mrna/utrLibrary";
import { PARAM_DEFS } from "@/lib/mrna/paramDefs";

const SAMPLE =
  "MKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAEKAVQVKVKALPDAQFEVVHSLAKWKRQTLGQHDFSAGEGLYTHMKALRPDEDRLSPLHSVYVDQWDWERVMGDGERQFSTLKSTVEAIWAGIKATEAAVSEEFGLAPFLPDQIHFVHSQELLSRYPDLDAKGRERAIAKDLGAVFLVGIGGKLSDGHRHDVRAPDYDDWSTPSELGHAGLNGDILVWNPVLEDAFELSSMGIRVDADTLKHQLALTGDEDRLELEWHQALLRGEMPQTIGGGIGQSRLTMLLLQLPHIGQVQAGVWPAAVRESVAGLL*";

const MODES: { id: UtrMode; label: string }[] = [
  { id: "auto", label: "Auto – organism library + designed" },
  { id: "library", label: "Pick from organism library" },
  { id: "designed", label: "Designed (rule-based)" },
  { id: "custom", label: "Custom sequence" },
  { id: "none", label: "None" },
];

export default function MrnaDesigner() {
  const [input, setInput] = useState(SAMPLE);
  const [orgId, setOrgId] = useState("human");
  const [n, setN] = useState(5);
  const [goal, setGoal] = useState<Goal>("balanced");
  const [gcMin, setGcMin] = useState(45);
  const [gcMax, setGcMax] = useState(60);
  const [avoid, setAvoid] = useState("GAATTC, GGATCC");
  const [mode5, setMode5] = useState<UtrMode>("auto");
  const [mode3, setMode3] = useState<UtrMode>("auto");
  const [pick5, setPick5] = useState<string[]>([]);
  const [pick3, setPick3] = useState<string[]>([]);
  const [custom5, setCustom5] = useState("");
  const [custom3, setCustom3] = useState("");
  const [seed, setSeed] = useState(1);
  const [rna, setRna] = useState(true);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Candidate[] | null>(null);
  const [warn, setWarn] = useState<string[]>([]);
  const [open, setOpen] = useState<number | null>(0);
  const [msg, setMsg] = useState("");
  const [detectOn, setDetectOn] = useState(false);
  const [revStrand, setRevStrand] = useState(false);
  const [minAa, setMinAa] = useState(30);
  const [keepUtrs, setKeepUtrs] = useState(true);
  const [detectedOrig, setDetectedOrig] = useState<{ utr5: string; cds: string; utr3: string } | null>(null);
  const [origRec, setOrigRec] = useState<MrnaRecord | null>(null);

  const isNuc = useMemo(() => !/[^ACGTUacgtu\s>\d]/.test(input.replace(/^>.*$/gm, "")) && cleanSeq(input).length >= 3, [input]);
  const orfs: Orf[] = useMemo(
    () => (detectOn && isNuc ? findOrfs(cleanSeq(input), { minAa, reverse: revStrand }).slice(0, 8) : []),
    [detectOn, isNuc, input, minAa, revStrand],
  );
  const applyOrf = (o: Orf) => {
    setDetectedOrig({ utr5: o.utr5, cds: o.cds, utr3: o.utr3 });
    setInput(o.cds);
    if (keepUtrs) {
      if (o.utr5) { setMode5("custom"); setCustom5(o.utr5); }
      if (o.utr3) { setMode3("custom"); setCustom3(o.utr3); }
    }
    setMsg(`CDS selected: ${o.aa} aa (${o.len} nt)${keepUtrs && (o.utr5 || o.utr3) ? "; detected UTRs set as custom UTRs." : "."}`);
    setDetectOn(false);
  };

  const toggle = (arr: string[], id: string, set: (v: string[]) => void) =>
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const run = () => {
    setBusy(true); setMsg("");
    setTimeout(() => {
      try {
        const out = generateCandidates({
          input, orgId, n, goal, gcRange: [gcMin, gcMax],
          avoid: avoid.split(/[,\s]+/).filter(Boolean),
          mode5, mode3, pick5, pick3, custom5, custom3, seed,
        });
        let orig: MrnaRecord | null = null;
        if (isNuc) {
          const seq = cleanSeq(input);
          if (detectedOrig && detectedOrig.cds === seq) {
            orig = { id: "orig", name: "Original", orgId, ...detectedOrig };
          } else if (seq.length >= 9) {
            const a = annotateMrna(seq);
            if (a.cds.length >= 9) orig = { id: "orig", name: "Original", orgId, ...a };
          }
        }
        setOrigRec(orig);
        setRes(out.candidates); setWarn(out.warnings); setOpen(0);
      } catch (e) { setMsg(String(e)); }
      setBusy(false);
    }, 30);
  };

  const seqOf = (c: Candidate) => {
    const s = c.rec.utr5 + c.rec.cds + c.rec.utr3;
    return rna ? s.replace(/T/g, "U") : s;
  };
  const sendCompare = () => {
    if (!res) return;
    const list = origRec ? [origRec, ...res.map((c) => c.rec)] : res.map((c) => c.rec);
    saveRecords(list);
    setMsg(origRec
      ? `Saved Original + ${res.length} candidate(s) for Comparer.`
      : `Saved ${res.length} candidate(s) for Comparer (protein input has no original nucleotide mRNA).`);
  };
  const csv = () => {
    if (!res) return;
    const head = ["Name", "Strategy", "5'UTR", "3'UTR", ...PARAM_DEFS.map((d) => d.label), "5'UTR seq", "CDS seq", "3'UTR seq", "Full mRNA"];
    const rows = res.map((c) => [
      c.rec.name, c.strategy, c.utr5?.name ?? "-", c.utr3?.name ?? "-",
      ...PARAM_DEFS.map((d) => d.fmt(c.params[d.key] as number)),
      c.rec.utr5, c.rec.cds, c.rec.utr3, c.rec.utr5 + c.rec.cds + c.rec.utr3,
    ]);
    downloadCsv("mrna_candidates.csv", [head, ...rows]);
  };

  const UtrPicker = (type: 5 | 3, mode: UtrMode, setMode: (m: UtrMode) => void, picks: string[], setPicks: (v: string[]) => void, custom: string, setCustom: (s: string) => void) => (
    <div className={card + " space-y-3"}>
      <label className="text-xs text-slate-500 uppercase">{type}′ UTR source</label>
      <select className={inputCls} value={mode} onChange={(e) => setMode(e.target.value as UtrMode)}>
        {MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
      </select>
      {mode === "library" && (
        <div className="space-y-1">
          {libraryFor(orgId, type).length === 0 && <p className="text-xs text-amber-300">No curated entries for this organism – designed UTRs will be used.</p>}
          {libraryFor(orgId, type).map((u) => (
            <label key={u.id} className="flex items-start gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={picks.includes(u.id)} onChange={() => toggle(picks, u.id, setPicks)} />
              <span><b className="text-slate-300">{u.name}</b> <span className="text-slate-500">({u.seq.length} nt) – {u.note}</span></span>
            </label>
          ))}
          <p className="text-[10px] text-slate-600">Nothing ticked = use all.</p>
        </div>
      )}
      {mode === "custom" && <textarea className={inputCls + " h-20"} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Paste UTR sequence" />}
    </div>
  );

  return (
    <MrnaShell title="mRNA Designer" icon={Sparkles} active="/tools/run/mrna-designer"
      desc="Generate up to 10 optimized mRNAs (codons + UTRs) for your organism, with full parameter profiles.">
      <div className="grid gap-5">
        <div>
          <label className="text-xs text-slate-500 uppercase">Protein (1-letter) or coding DNA/RNA</label>
          <textarea className={inputCls + " h-32"} value={input} onChange={(e) => { setInput(e.target.value); setDetectedOrig(null); }} />
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <button className={btn} disabled={!isNuc} onClick={() => setDetectOn((v) => !v)}
              title={isNuc ? "" : "Paste a DNA/RNA transcript to detect its CDS"}>
              🔎 Detect CDS{detectOn ? " (hide)" : ""}
            </button>
            {!isNuc && <span className="text-xs text-slate-500">Paste a full mRNA / transcript (DNA or RNA) to detect the coding sequence.</span>}
          </div>
          {detectOn && isNuc && (
            <div className={card + " mt-3 space-y-3"}>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="font-bold text-white">Detected open reading frames</span>
                <label className="flex items-center gap-1">min length (aa)
                  <input type="number" className={inputCls + " !w-20 !p-1"} value={minAa} onChange={(e) => setMinAa(Math.max(5, +e.target.value || 30))} /></label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={revStrand} onChange={(e) => setRevStrand(e.target.checked)} /> also search reverse strand</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={keepUtrs} onChange={(e) => setKeepUtrs(e.target.checked)} /> keep detected UTRs as custom UTRs</label>
              </div>
              {orfs.length === 0 && <p className="text-sm text-amber-300">No ATG-initiated ORF ≥ {minAa} aa found. Lower the minimum length or check the strand.</p>}
              {orfs.map((o, i) => (
                <div key={i} className={`border rounded-xl p-3 ${i === 0 ? "border-emerald-500/40" : "border-slate-800"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-300">
                      {i === 0 && <b className="text-emerald-400 mr-2">LONGEST</b>}
                      strand {o.strand} · frame {o.frame + 1} · nt {o.start + 1}–{o.end} · <b>{o.aa} aa</b> ({o.len} nt) ·
                      {" "}<span className={o.hasStop ? "text-emerald-400" : "text-amber-300"}>{o.hasStop ? "has stop codon" : "no stop codon (truncated)"}</span>
                      {" "}· 5′UTR {o.utr5.length} nt · 3′UTR {o.utr3.length} nt
                    </span>
                    <button className={btn + " !py-1.5 !text-xs"} onClick={() => applyOrf(o)}>Use this CDS</button>
                  </div>
                  <p className="font-mono text-[11px] text-slate-500 mt-1 break-all">{o.protein.slice(0, 90)}{o.protein.length > 90 ? "…" : ""}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          <div><label className="text-xs text-slate-500 uppercase">Host organism</label><OrgSelect value={orgId} onChange={setOrgId} /></div>
          <div><label className="text-xs text-slate-500 uppercase">Candidates (1–10)</label>
            <input type="number" min={1} max={10} className={inputCls} value={n} onChange={(e) => setN(Math.max(1, Math.min(10, +e.target.value || 1)))} /></div>
          <div><label className="text-xs text-slate-500 uppercase">Optimize for</label>
            <select className={inputCls} value={goal} onChange={(e) => setGoal(e.target.value as Goal)}>
              <option value="balanced">Balanced (stability + translation)</option>
              <option value="stability">mRNA stability</option>
              <option value="translation">Translation efficiency</option>
            </select></div>
          <div><label className="text-xs text-slate-500 uppercase">Random seed</label>
            <input type="number" className={inputCls} value={seed} onChange={(e) => setSeed(+e.target.value || 0)} /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="text-xs text-slate-500 uppercase">Avoid sites (comma-separated)</label>
            <input className={inputCls} value={avoid} onChange={(e) => setAvoid(e.target.value)} /></div>
          <div className="flex items-end gap-2 text-sm">GC range %
            <input type="number" className={inputCls + " !w-24"} value={gcMin} onChange={(e) => setGcMin(+e.target.value)} />–
            <input type="number" className={inputCls + " !w-24"} value={gcMax} onChange={(e) => setGcMax(+e.target.value)} /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {UtrPicker(5, mode5, setMode5, pick5, setPick5, custom5, setCustom5)}
          {UtrPicker(3, mode3, setMode3, pick3, setPick3, custom3, setCustom3)}
        </div>
        <div className="flex items-center gap-3">
          <button className={btn} onClick={run} disabled={busy}>{busy ? "Designing…" : "Generate candidates"}</button>
          <span className="text-xs text-slate-500">Host: {getOrganism(orgId).name}</span>
        </div>
        {msg && <p className="text-sm text-amber-300">{msg}</p>}
        {warn.map((w) => <p key={w} className="text-sm text-amber-300">{w}</p>)}

        {res && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <button className={btn} onClick={sendCompare}><GitCompare size={14} className="inline mr-1" />Save for Comparer</button>
              <Link href="/tools/run/mrna-compare" onClick={sendCompare} className={btn}>Open Comparer →</Link>
              <button className={btn} onClick={csv}><Download size={14} className="inline mr-1" />CSV</button>
              <button className={btn} onClick={() => download("mrna_candidates.fasta", res.map((c) => toFasta(c.rec, rna)).join("\n"))}>FASTA</button>
              <label className="text-xs text-slate-400 flex items-center gap-1"><input type="checkbox" checked={rna} onChange={(e) => setRna(e.target.checked)} /> show as RNA (U)</label>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-2xl">
              <table className="text-xs w-full">
                <thead className="bg-slate-900 text-slate-400">
                  <tr>
                    <th className="p-2 text-left">#</th><th className="p-2 text-left">5′UTR</th><th className="p-2 text-left">3′UTR</th>
                    {PARAM_DEFS.filter((d) => d.group !== "composition" || ["GC", "A", "T", "G", "C", "AT", "GC3", "length"].includes(d.key)).map((d) => (
                      <th key={d.key} className="p-2 text-right whitespace-nowrap">{d.label}<Help label={d.label} /></th>))}
                  </tr>
                </thead>
                <tbody>
                  {res.map((c, i) => (
                    <tr key={i} onClick={() => setOpen(open === i ? null : i)} className="border-t border-slate-800 hover:bg-slate-900/60 cursor-pointer">
                      <td className="p-2 font-bold text-cyan-300">{c.rank}</td>
                      <td className="p-2 whitespace-nowrap">{c.utr5?.name ?? "–"}</td>
                      <td className="p-2 whitespace-nowrap">{c.utr3?.name ?? "–"}</td>
                      {PARAM_DEFS.filter((d) => d.group !== "composition" || ["GC", "A", "T", "G", "C", "AT", "GC3", "length"].includes(d.key)).map((d) => (
                        <td key={d.key} className="p-2 text-right font-mono">{d.fmt(c.params[d.key] as number)}</td>))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {open !== null && res[open] && (
              <div className={card + " space-y-3"}>
                <h3 className="font-bold text-white">{res[open].rec.name} – details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Stat k="Codon strategy" v={res[open].strategy} />
                  <Stat k="Codons changed" v={res[open].changed} />
                  <Stat k="Initiation" v={res[open].params.kozakLabel} />
                  <Stat k="Valid ORF" v={res[open].params.validCds ? "yes" : "no"} />
                </div>
                {[res[open].utr5, res[open].utr3].map((u, k) => u && (
                  <p key={k} className="text-xs text-slate-400"><b>{k ? "3′" : "5′"}UTR:</b> {u.name} ({u.kind}) – {u.note}</p>
                ))}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Full mRNA ({seqOf(res[open]).length} nt)</span>
                    <span className="flex gap-3">
                      <button className="text-cyan-400" onClick={() => navigator.clipboard.writeText(seqOf(res[open]))}><Copy size={12} className="inline" /> copy</button>
                      <Link className="text-cyan-400" href="/tools/run/mrna-structure" onClick={() => localStorage.setItem(STRUCT_KEY, JSON.stringify(res[open].rec))}><Network size={12} className="inline" /> 2D structure</Link>
                    </span>
                  </div>
                  <p className="font-mono text-xs break-all text-slate-300">
                    <span className="text-amber-300">{rna ? res[open].rec.utr5.replace(/T/g, "U") : res[open].rec.utr5}</span>
                    <span>{rna ? res[open].rec.cds.replace(/T/g, "U") : res[open].rec.cds}</span>
                    <span className="text-purple-300">{rna ? res[open].rec.utr3.replace(/T/g, "U") : res[open].rec.utr3}</span>
                  </p>
                  <p className="text-[10px] text-slate-600 mt-1"><span className="text-amber-300">5′UTR</span> · CDS · <span className="text-purple-300">3′UTR</span></p>
                </div>
              </div>
            )}
          </>
        )}
        <ExternalValidation items={[
          { name: "mRNAid (DichLab)", url: "https://mrnaid.dichlab.org/", note: "Benchmark full mRNA + UTR optimization, CAI, MFE & 5_MFE." },
          { name: "LinearDesign (CodeRNA)", url: "https://www.coderna.ai/jobs", note: "Validate joint codon optimality & structural stability optimization." },
        ]} />
      </div>
    </MrnaShell>
  );
}
