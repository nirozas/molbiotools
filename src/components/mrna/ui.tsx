"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { HelpEntry, helpFor } from "@/lib/mrna/help";
import Navbar from "@/components/Navbar";
import ToolPageLayout from "@/components/ToolPageLayout";
import { ORGANISMS } from "@/lib/mrna/codonTables";

export const card = "bg-slate-950 border border-slate-800 rounded-2xl p-5";
export const inputCls =
  "w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50";
export const btn =
  "px-4 py-2.5 rounded-xl border text-sm font-semibold bg-cyan-500/10 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 transition disabled:opacity-40";

const NAV = [
  { href: "/tools/run/mrna-suite", label: "Analyzer" },
  { href: "/tools/run/mrna-designer", label: "Designer" },
  { href: "/tools/run/mrna-compare", label: "Comparer" },
  { href: "/tools/run/mrna-structure", label: "2D Structure" },
];

export function MrnaShell({ title, desc, icon: Icon, active, children }: {
  title: string; desc: string; icon: React.ElementType; active: string; children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-200">
      <Navbar />
      <div className="h-16" />
      <ToolPageLayout>
        <main className="max-w-6xl mx-auto p-6 md:p-10 w-full">
          <div className="flex flex-wrap gap-2 mb-6">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href}
                className={`text-xs px-3 py-1.5 rounded-lg border ${n.href === active ? "border-cyan-500/40 text-cyan-300 bg-cyan-500/10" : "border-slate-800 text-slate-500 hover:text-white"}`}>
                {n.label}
              </Link>
            ))}
          </div>
          <header className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
              <Icon size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
              <p className="text-slate-500">{desc}</p>
            </div>
          </header>
          {children}
          <p className="text-xs text-slate-600 mt-10">
            Scores are heuristic estimates; folding uses a simplified stack-based energy model (not ViennaRNA) and
            codon tables are approximate. Validate critical constructs experimentally.
          </p>
        </main>
      </ToolPageLayout>
    </div>
  );
}

/** "?" icon that shows what a parameter means and its impact. */
export function Help({ label, entry }: { label?: string; entry?: HelpEntry }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const e = entry ?? (label ? helpFor(label) : undefined);
  if (!e) return null;
  const show = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const w = 288;
    setPos({ x: Math.max(8, Math.min(window.innerWidth - w - 8, r.left - w / 2 + 8)), y: r.bottom + 6 });
  };
  return (
    <>
      <span
        role="button" tabIndex={0} aria-label={`Help: ${label ?? ""}`}
        onMouseEnter={(ev) => show(ev.currentTarget)} onMouseLeave={() => setPos(null)}
        onFocus={(ev) => show(ev.currentTarget)} onBlur={() => setPos(null)}
        onClick={(ev) => { ev.stopPropagation(); if (pos) setPos(null); else show(ev.currentTarget); }}
        className="inline-flex items-center justify-center w-4 h-4 ml-1 rounded-full border border-slate-600 text-[10px] leading-none text-slate-400 hover:text-cyan-300 hover:border-cyan-400 cursor-help align-middle normal-case font-bold"
      >?</span>
      {pos && (
        <span style={{ position: "fixed", left: pos.x, top: pos.y, width: 288, zIndex: 1000 }}
          className="block text-left normal-case tracking-normal font-sans bg-slate-900 border border-cyan-500/40 rounded-xl p-3 shadow-2xl pointer-events-none">
          {label && <span className="block text-xs font-bold text-white mb-1">{label}</span>}
          <span className="block text-xs text-slate-300 mb-1.5">{e.what}</span>
          <span className="block text-[11px] text-cyan-300"><b>Impact:</b> {e.impact}</span>
        </span>
      )}
    </>
  );
}

export function Score({ value, label }: { value: number; label: string }) {
  const color = value >= 70 ? "#10b981" : value >= 45 ? "#f59e0b" : "#f43f5e";
  return (
    <div className={card + " text-center"}>
      <div className="text-4xl font-bold" style={{ color }}>{value.toFixed(0)}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">{label}<Help label={label} /></div>
    </div>
  );
}

export function Stat({ k, v, hint }: { k: string; v: string | number; hint?: string }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3" title={hint}>
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{k}<Help label={k} /></div>
      <div className="text-lg font-mono text-white">{v}</div>
    </div>
  );
}

/* ───────── CSV ───────── */

export function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((r) => r.map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
}

export function downloadCsv(name: string, rows: (string | number)[][]) {
  download(name, "\ufeff" + toCsv(rows), "text/csv;charset=utf-8");
}

export function CsvButton({ name, rows }: { name: string; rows: () => (string | number)[][] }) {
  return (
    <button className={btn} onClick={() => downloadCsv(name, rows())}>⬇ Export CSV</button>
  );
}

export function OrgSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      {ORGANISMS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
  );
}

export function download(name: string, text: string, mime = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export interface ExternalRef {
  name: string;
  url: string;
  note: string;
}

export function ExternalValidation({ items }: { items: ExternalRef[] }) {
  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mt-6">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
        External Validation Tools
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((it) => (
          <a
            key={it.url}
            href={it.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start justify-between gap-3 rounded-xl border border-slate-800/90 bg-slate-900/40 px-3.5 py-2.5 hover:border-cyan-500/40 hover:bg-slate-900/80 transition group"
          >
            <div>
              <div className="text-xs font-semibold text-cyan-300 group-hover:text-cyan-200">{it.name}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{it.note}</div>
            </div>
            <ExternalLink size={14} className="text-slate-500 group-hover:text-cyan-300 shrink-0 mt-0.5" />
          </a>
        ))}
      </div>
    </div>
  );
}
