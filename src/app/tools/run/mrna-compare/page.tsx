"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { GitCompare, Trophy, Download } from "lucide-react";
import { MrnaShell, card, inputCls, btn, OrgSelect, Help, ExternalValidation, downloadCsv } from "@/components/mrna/ui";
import { getOrganism } from "@/lib/mrna/codonTables";
import { cleanSeq } from "@/lib/mrna/analysis";
import { computeParams, annotateMrna, loadRecords, toFasta, MrnaRecord, Params, STRUCT_KEY } from "@/lib/mrna/params";
import { PARAM_DEFS, bestIndex } from "@/lib/mrna/paramDefs";

interface Item { rec: MrnaRecord; p: Params }

function parseFasta(text: string, orgId: string): MrnaRecord[] {
  const blocks: { name: string; seq: string; u5?: number; cds?: number }[] = [];
  if (/^\s*>/m.test(text)) {
    let cur: { name: string; seq: string; u5?: number; cds?: number } | null = null;
    for (const line of text.split(/\r?\n/)) {
      if (line.startsWith(">")) {
        const h = line.slice(1).trim();
        cur = { name: h.split(/\s+/)[0] || `seq${blocks.length + 1}`, seq: "",
          u5: h.match(/u5=(\d+)/) ? +h.match(/u5=(\d+)/)![1] : undefined,
          cds: h.match(/cds=(\d+)/) ? +h.match(/cds=(\d+)/)![1] : undefined };
        blocks.push(cur);
      } else if (cur) cur.seq += line;
    }
  } else {
    text.split(/\n\s*\n/).filter((s) => s.trim()).forEach((s, i) => blocks.push({ name: `seq${i + 1}`, seq: s }));
  }
  return blocks.map((b, i) => {
    const seq = cleanSeq(b.seq);
    const a = annotateMrna(seq, b.u5, b.cds);
    return { id: `u${i}`, name: b.name, orgId, ...a };
  }).filter((r) => r.cds.length >= 9);
}

export default function MrnaCompare() {
  const [orgId, setOrgId] = useState("human");
  const [text, setText] = useState("");
  const [items, setItems] = useState<Item[] | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const id = setTimeout(() => {
      const r = loadRecords();
      if (r.length) {
        const oid = r[0].orgId || "human";
        setText(r.map((x) => toFasta(x)).join("\n"));
        setOrgId(oid);
        const list = r.slice(0, 11);
        if (list.length >= 2) {
          const org = getOrganism(oid);
          setItems(list.map((rec) => ({ rec, p: computeParams(rec, org) })));
          setMsg(`Loaded ${list.length} sequences (${list[0].name === "Original" ? "Original first + candidates" : "from Designer"}).`);
        }
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const compare = () => {
    const org = getOrganism(orgId);
    const all = parseFasta(text, orgId);
    const recs = all.slice(0, 11);
    if (recs.length < 2) { setMsg("Provide at least 2 sequences (FASTA with '>' headers, or separated by blank lines)."); setItems(null); return; }
    setMsg(all.length > 11 ? "Limited to the first 11 sequences." : "");
    setTimeout(() => setItems(recs.map((rec) => ({ rec, p: computeParams(rec, org) }))), 20);
  };

  const winner = (key: "stability" | "translation" | "overall") =>
    items ? items.reduce((b, x) => (x.p[key] > b.p[key] ? x : b), items[0]) : null;

  const why = (w: Item, key: "stability" | "translation" | "overall") => {
    if (!items) return [];
    const relevant = PARAM_DEFS.filter((d) => d.best !== "none" && !["stability", "translation", "overall"].includes(d.key as string) &&
      (key === "overall" || (key === "stability"
        ? ["cai", "GC", "mfePerNt", "are", "upa", "rareClusters", "cryptPas", "homopolymers"].includes(d.key as string)
        : ["cai", "kozak", "uorfs", "mfe5", "mfeStart", "rareClusters"].includes(d.key as string))));
    const out: string[] = [];
    for (const d of relevant) {
      const idx = bestIndex(d, items.map((x) => x.p[d.key] as number));
      if (idx !== null && items[idx] === w) out.push(`best ${d.label} (${d.fmt(w.p[d.key] as number)})`);
    }
    return out.slice(0, 6);
  };

  const csv = () => {
    if (!items) return;
    const head = ["Parameter", ...items.map((i) => i.rec.name)];
    const rows = PARAM_DEFS.map((d) => [d.label, ...items.map((i) => d.fmt(i.p[d.key] as number))]);
    const win = W ? [[], ["Best for stability", W.stability.rec.name], ["Best for translation", W.translation.rec.name], ["Best overall", W.overall.rec.name]] : [];
    downloadCsv("mrna_comparison.csv", [head, ...rows, ...win]);
  };

  const W = items && { stability: winner("stability")!, translation: winner("translation")!, overall: winner("overall")! };

  return (
    <MrnaShell title="mRNA Comparer" icon={GitCompare} active="/tools/run/mrna-compare"
      desc="Compare 2–10 mRNAs side by side and pick the best for stability, translation and overall.">
      <div className="grid gap-5">
        <div>
          <label className="text-xs text-slate-500 uppercase">mRNAs (FASTA; full transcripts – the ORF is auto-detected, or use headers from the Designer)</label>
          <textarea className={inputCls + " h-48"} value={text} onChange={(e) => setText(e.target.value)}
            placeholder={">mRNA_A\nGCCACCATGAAA...\n>mRNA_B\n..."} />
        </div>
        <div className="grid md:grid-cols-3 gap-4 items-end">
          <div><label className="text-xs text-slate-500 uppercase">Host organism</label><OrgSelect value={orgId} onChange={setOrgId} /></div>
          <button className={btn} onClick={compare}>Compare</button>
          <Link href="/tools/run/mrna-designer" className="text-xs text-cyan-400">Need candidates? Use the Designer →</Link>
        </div>
        {msg && <p className="text-sm text-amber-300">{msg}</p>}

        {items && W && (
          <>
            <div className="grid md:grid-cols-3 gap-4">
              {([["stability", "Best for stability"], ["translation", "Best for translation"], ["overall", "Best overall"]] as const).map(([k, label]) => (
                <div key={k} className={card + " border-emerald-500/30"}>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs uppercase font-bold"><Trophy size={14} /> {label}</div>
                  <div className="text-2xl font-bold text-white mt-1">{W[k].rec.name}</div>
                  <div className="text-sm text-slate-400">score {W[k].p[k].toFixed(1)}/100</div>
                  <ul className="text-xs text-slate-500 mt-2 list-disc ml-4">
                    {why(W[k], k).map((r) => <li key={r}>{r}</li>)}
                    {why(W[k], k).length === 0 && <li>highest combined weighted score</li>}
                  </ul>
                </div>
              ))}
            </div>

            <div className={card}>
              <h3 className="font-bold text-white mb-3">Scores</h3>
              <div className="space-y-2">
                {items.map((it) => (
                  <div key={it.rec.id} className="grid grid-cols-[110px_1fr] gap-3 items-center text-xs">
                    <span className="truncate text-slate-300">{it.rec.name}</span>
                    <div className="space-y-1">
                      {([["stability", "#38bdf8"], ["translation", "#a78bfa"], ["overall", "#10b981"]] as const).map(([k, col]) => (
                        <div key={k} className="flex items-center gap-2">
                          <div className="h-2 rounded" style={{ width: `${it.p[k]}%`, background: col }} />
                          <span className="text-slate-500 font-mono">{k.slice(0, 4)} {it.p[k].toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button className={btn} onClick={csv}><Download size={14} className="inline mr-1" />CSV</button>
            </div>
            <div className="overflow-x-auto border border-slate-800 rounded-2xl">
              <table className="text-xs w-full">
                <thead className="bg-slate-900 text-slate-400">
                  <tr><th className="p-2 text-left">Parameter</th>
                    {items.map((it) => <th key={it.rec.id} className="p-2 text-right whitespace-nowrap">{it.rec.name}</th>)}</tr>
                </thead>
                <tbody>
                  {PARAM_DEFS.map((d) => {
                    const vals = items.map((it) => it.p[d.key] as number);
                    const b = bestIndex(d, vals);
                    return (
                      <tr key={d.key} className="border-t border-slate-800">
                        <td className="p-2 text-slate-400">{d.label}<Help label={d.label} /></td>
                        {vals.map((v, i) => (
                          <td key={i} className={`p-2 text-right font-mono ${b === i ? "bg-emerald-500/15 text-emerald-300 font-bold" : ""}`}>{d.fmt(v)}</td>
                        ))}
                      </tr>
                    );
                  })}
                  <tr className="border-t border-slate-800">
                    <td className="p-2 text-slate-400">Structure</td>
                    {items.map((it) => (
                      <td key={it.rec.id} className="p-2 text-right">
                        <Link className="text-cyan-400" href="/tools/run/mrna-structure"
                          onClick={() => localStorage.setItem(STRUCT_KEY, JSON.stringify(it.rec))}>view</Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-600">Green = best value per parameter (higher CAI / 5_MFE, fewer motifs, GC and MFE/nt closest to the optimum). Composition rows are informational.</p>
          </>
        )}
        <ExternalValidation items={[
          { name: "CAIcal / E-CAI (URV)", url: "http://genomes.urv.es/CAIcal/", note: "Cross-check CAI, GC/GC3 & expected CAI across multiple candidates." },
          { name: "mRNAid (DichLab)", url: "https://mrnaid.dichlab.org/", note: "Validate comparative folding MFE, 5_MFE & organism codon optimality." },
        ]} />
      </div>
    </MrnaShell>
  );
}
