"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Network } from "lucide-react";
import { MrnaShell, card, inputCls, btn, Stat, Help, ExternalValidation, download, downloadCsv } from "@/components/mrna/ui";
import { cleanSeq } from "@/lib/mrna/analysis";
import { foldStructure, layoutStructure, defaultSpanForLength, FoldResult } from "@/lib/mrna/fold";
import { analyzeStructure, StructureReport } from "@/lib/mrna/structure";
import { annotateMrna, MrnaRecord, STRUCT_KEY } from "@/lib/mrna/params";

type ColorMode = "base" | "paired" | "region" | "local";
type SpanChoice = "auto" | "150" | "250" | "400" | "inf";

const BASE_COL: Record<string, string> = { A: "#f59e0b", U: "#38bdf8", G: "#10b981", C: "#f43f5e" };
const BASE_NAMES: Record<string, string> = { A: "Adenine", U: "Uracil", G: "Guanine", C: "Cytosine" };
const REGION_COL = { u5: "#f59e0b", cds: "#38bdf8", u3: "#a78bfa" };
const LOCAL_GRADIENT = "linear-gradient(90deg, hsl(200,80%,55%), hsl(120,80%,55%), hsl(40,80%,55%))";

const SAMPLE =
  "GGGAGACCCAAGCUGGCUAGCGCCACCAUGGUGAGCAAGGGCGAGGAGCUGUUCACCGGGGUGGUGCCCAUCCUGGUCGAGCUGGACGGCGACGUAAACGGCCACAAGUUCAGCGUGUCCGGCGAGGGCGAGGGCGAUGCCACCUACGGCAAGCUGACCCUGAAGUUCAUCUGCACCACCGGCAAGCUGCCCGUGCCCUGGCCCACCCUCGUGACCACCCUGACC";

export default function MrnaStructure() {
  const [text, setText] = useState(SAMPLE);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(0);
  const [spanChoice, setSpanChoice] = useState<SpanChoice>("auto");
  const [regions, setRegions] = useState<{ u5: number; cds: number } | null>(null);
  const [fold, setFold] = useState<FoldResult | null>(null);
  const [offset, setOffset] = useState(0);
  const [rep, setRep] = useState<StructureReport | null>(null);
  const [mode, setMode] = useState<ColorMode>("region");
  const [zoom, setZoom] = useState(1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [hover, setHover] = useState<{ idx: number; cx: number; cy: number } | null>(null);
  const [profHover, setProfHover] = useState<{ pos: number; val: number } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const zoomRef = useRef(1);
  const anchorRef = useRef<{ ux: number; uy: number; vx: number; vy: number } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STRUCT_KEY);
      if (raw) {
        const r: MrnaRecord = JSON.parse(raw);
        setText((r.utr5 + r.cds + r.utr3).replace(/T/g, "U"));
        setRegions({ u5: r.utr5.length, cds: r.cds.length });
        localStorage.removeItem(STRUCT_KEY);
      }
    } catch { /* ignore */ }
  }, []);

  const seqLen = useMemo(() => cleanSeq(text).length, [text]);

  const run = () => {
    const seq = cleanSeq(text);
    if (seq.length < 8) { setMsg("Enter a sequence of at least 8 nt."); return; }
    const a = Math.max(1, from) - 1;
    const b = to > 0 ? Math.min(seq.length, to) : seq.length;
    if (b - a < 8) { setMsg("Selected region must be at least 8 nt."); return; }
    setMsg("");
    setHover(null);
    setBusy(true);
    setTimeout(() => {
      const len = b - a;
      const maxSpan =
        spanChoice === "auto" ? defaultSpanForLength(len)
          : spanChoice === "inf" ? Infinity : Number(spanChoice);
      const reg = regions ?? (() => { const x = annotateMrna(seq); return { u5: x.utr5.length, cds: x.cds.length }; })();
      const f = foldStructure(seq.slice(a, b), maxSpan);
      const sc = reg.u5 - a;
      setFold(f); setOffset(a); setRegions(reg);
      setRep(analyzeStructure(f, sc >= 0 && sc < f.seq.length ? sc : null));
      setTo(b); setFrom(a + 1);
      setBusy(false);
    }, 30);
  };

  const geo = useMemo(() => {
    if (!fold) return null;
    const { x, y } = layoutStructure(fold.pt);
    const S = 18;
    const minX = Math.min(...x), maxX = Math.max(...x), minY = Math.min(...y), maxY = Math.max(...y);
    const pad = 24;
    return {
      x: x.map((v) => (v - minX) * S + pad),
      y: y.map((v) => (v - minY) * S + pad),
      w: Math.max(100, (maxX - minX) * S + pad * 2),
      h: Math.max(100, (maxY - minY) * S + pad * 2),
    };
  }, [fold]);

  const fitZoom = () => {
    if (!geo) return;
    const f = Math.min(1.2, Math.max(0.12, Math.min(820 / geo.w, 540 / geo.h)));
    const next = Number(f.toFixed(2));
    anchorRef.current = null;
    zoomRef.current = next;
    setZoom(next);
  };

  useEffect(() => {
    if (geo) fitZoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo]);

  const zoomAround = useCallback((targetZoom: number, clientX: number, clientY: number) => {
    const prev = zoomRef.current;
    const next = Math.min(4, Math.max(0.1, Number(targetZoom.toFixed(3))));
    if (Math.abs(next - prev) < 1e-4) return;
    const el = scrollRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const vx = Number.isFinite(clientX) ? clientX - r.left : r.width / 2;
      const vy = Number.isFinite(clientY) ? clientY - r.top : r.height / 2;
      if (!anchorRef.current) {
        anchorRef.current = {
          ux: (el.scrollLeft + vx) / prev,
          uy: (el.scrollTop + vy) / prev,
          vx,
          vy,
        };
      } else {
        anchorRef.current.vx = vx;
        anchorRef.current.vy = vy;
      }
    }
    zoomRef.current = next;
    setZoom(next);
  }, []);

  useLayoutEffect(() => {
    zoomRef.current = zoom;
    const el = scrollRef.current;
    const a = anchorRef.current;
    if (el && a) {
      el.scrollLeft = Math.max(0, a.ux * zoom - a.vx);
      el.scrollTop = Math.max(0, a.uy * zoom - a.vy);
      anchorRef.current = null;
    }
  }, [zoom]);

  const hasView = Boolean(fold && rep && geo);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !hasView) return;

    const distOf = (t: TouchList) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const midOf = (t: TouchList) => ({
      x: (t[0].clientX + t[1].clientX) / 2,
      y: (t[0].clientY + t[1].clientY) / 2,
    });

    let prevDist = 0;
    let gestureBase = zoomRef.current;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        setHover(null);
        prevDist = distOf(e.touches);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const d = distOf(e.touches);
        if (prevDist > 0 && d > 0) {
          const m = midOf(e.touches);
          zoomAround(zoomRef.current * (d / prevDist), m.x, m.y);
        }
        prevDist = d;
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) prevDist = 0;
    };
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = Math.exp(-e.deltaY * 0.01);
        zoomAround(zoomRef.current * factor, e.clientX, e.clientY);
      }
    };
    interface WebKitGestureEvent extends Event {
      scale: number;
      clientX: number;
      clientY: number;
    }
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      gestureBase = zoomRef.current;
    };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      const ge = e as WebKitGestureEvent;
      zoomAround(gestureBase * ge.scale, ge.clientX, ge.clientY);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("gesturestart", onGestureStart, { passive: false });
    el.addEventListener("gesturechange", onGestureChange, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("gesturestart", onGestureStart);
      el.removeEventListener("gesturechange", onGestureChange);
    };
  }, [hasView, zoomAround]);

  const paths = useMemo(() => {
    if (!fold || !geo) return { backbone: "", gc: "", au: "" };
    const bb: string[] = [];
    for (let i = 0; i < geo.x.length; i++) {
      bb.push(`${i === 0 ? "M" : "L"}${geo.x[i].toFixed(1)},${geo.y[i].toFixed(1)}`);
    }
    const gc: string[] = [], au: string[] = [];
    for (const [i, j] of fold.pairs) {
      const seg = `M${geo.x[i].toFixed(1)},${geo.y[i].toFixed(1)}L${geo.x[j].toFixed(1)},${geo.y[j].toFixed(1)}`;
      const k = fold.seq[i] + fold.seq[j];
      if (k === "GC" || k === "CG") gc.push(seg); else au.push(seg);
    }
    return { backbone: bb.join(""), gc: gc.join(""), au: au.join("") };
  }, [fold, geo]);

  const regionOf = (i: number) => {
    if (!regions) return "cds";
    const g = i + offset;
    return g < regions.u5 ? "u5" : g < regions.u5 + regions.cds ? "cds" : "u3";
  };
  const regionLabel = (i: number) => {
    const r = regionOf(i);
    return r === "u5" ? "5′UTR" : r === "u3" ? "3′UTR" : "CDS";
  };
  const colorOf = (i: number) => {
    if (!fold || !rep) return "#64748b";
    if (mode === "base") return BASE_COL[fold.seq[i]] ?? "#64748b";
    if (mode === "paired") return fold.pt[i] === -1 ? "#475569" : "#10b981";
    if (mode === "local") { const v = rep.pairedProfile[i]; return `hsl(${200 - v * 160},80%,55%)`; }
    return REGION_COL[regionOf(i) as "u5" | "cds" | "u3"];
  };
  const startIdx = regions ? regions.u5 - offset : -1;
  const isStart = (i: number) => startIdx >= 0 && i >= startIdx && i < startIdx + 3;

  const onSvgMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!geo || !svgRef.current || !wrapRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const sx = ((e.clientX - rect.left) / rect.width) * geo.w;
    const sy = ((e.clientY - rect.top) / rect.height) * geo.h;
    const maxR = Math.max(12, 16 / zoom);
    let best = -1, bestD2 = maxR * maxR;
    for (let i = 0; i < geo.x.length; i++) {
      const dx = geo.x[i] - sx, dy = geo.y[i] - sy;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) { bestD2 = d2; best = i; }
    }
    if (best === -1) { if (hover) setHover(null); return; }
    const wr = wrapRef.current.getBoundingClientRect();
    setHover({ idx: best, cx: e.clientX - wr.left, cy: e.clientY - wr.top });
  };

  const hovIdx = hover?.idx ?? null;
  const hovPartner = hovIdx !== null && fold ? fold.pt[hovIdx] : -1;
  const hovCodon =
    hovIdx !== null && regions && regionOf(hovIdx) === "cds"
      ? Math.floor((hovIdx + offset - regions.u5) / 3) + 1
      : null;

  return (
    <MrnaShell title="mRNA 2D Structure" icon={Network} active="/tools/run/mrna-structure"
      desc="Predict the minimum-free-energy secondary structure for transcripts of any length, draw it, and analyze its strengths and characteristics.">
      <div className="grid gap-5">
        <div>
          <label className="text-xs text-slate-500 uppercase">mRNA sequence (5′UTR + CDS + 3′UTR; DNA or RNA · {seqLen} nt)</label>
          <textarea className={inputCls + " h-28"} value={text} onChange={(e) => { setText(e.target.value); setRegions(null); }} />
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div><label className="text-xs text-slate-500 uppercase">From (nt)</label>
            <input type="number" className={inputCls + " !w-28"} value={from} onChange={(e) => setFrom(+e.target.value || 1)} /></div>
          <div><label className="text-xs text-slate-500 uppercase">To (nt, 0 = full)</label>
            <input type="number" className={inputCls + " !w-28"} value={to} onChange={(e) => setTo(+e.target.value || 0)} /></div>
          <div>
            <label className="text-xs text-slate-500 uppercase">Max pair span <Help label="Max pair span" /></label>
            <select className={inputCls + " !w-36"} value={spanChoice} onChange={(e) => setSpanChoice(e.target.value as SpanChoice)}>
              <option value="auto">Auto (fast)</option>
              <option value="150">150 nt</option>
              <option value="250">250 nt</option>
              <option value="400">400 nt</option>
              <option value="inf">Unlimited</option>
            </select>
          </div>
          <button className={btn} onClick={run} disabled={busy}>{busy ? "Folding…" : "Fold & analyze"}</button>
          <span className="text-xs text-slate-500">
            Folds the full sequence ({seqLen} nt) with no length cap; use From/To to inspect a sub-region.
          </span>
        </div>
        {msg && <p className="text-sm text-amber-300">{msg}</p>}

        {fold && rep && geo && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <Stat k="Length" v={`${rep.n} nt`} />
              <Stat k="MFE" v={`${rep.mfe.toFixed(1)}`} hint="kcal/mol (simplified model)" />
              <Stat k="MFE / nt" v={rep.mfePerNt.toFixed(3)} />
              <Stat k="Base pairs" v={rep.pairs} />
              <Stat k="Paired %" v={rep.pairedPct.toFixed(0)} />
              <Stat k="Character" v={rep.character.split(" ")[0]} hint={rep.character} />
            </div>

            {fold.maxSpan < rep.n - 1 && (
              <p className="text-xs text-slate-500">
                Folded all {rep.n} nt using banded DP (max base-pair span: {fold.maxSpan} nt). Change &ldquo;Max pair span&rdquo; to Unlimited for unrestricted long-range folding.
              </p>
            )}

            <div className={card}>
              <div className="flex flex-wrap items-center gap-3 mb-3 text-xs">
                <span className="text-slate-400">Colour:</span>
                {([["region", "Region"], ["base", "Base"], ["paired", "Paired"], ["local", "Local density"]] as const).map(([m, l]) => (
                  <button key={m} onClick={() => setMode(m)} className={`px-2 py-1 rounded border ${mode === m ? "border-cyan-500/50 text-cyan-300" : "border-slate-800 text-slate-500"}`}>{l}</button>
                ))}
                <span className="ml-auto flex items-center gap-2 text-slate-400">
                  Zoom ({Math.round(zoom * 100)}%)
                  <input type="range" min={0.1} max={4} step={0.05} value={zoom} onChange={(e) => setZoom(+e.target.value)} />
                  <button className="px-2 py-0.5 rounded border border-slate-700 text-slate-300 hover:border-cyan-500/50" onClick={fitZoom}>Fit</button>
                </span>
                <button className="text-cyan-400" onClick={() => {
                  const svg = document.getElementById("mrna-svg");
                  if (svg) download("mrna_structure.svg", svg.outerHTML, "image/svg+xml");
                }}>SVG</button>
                <button className="text-cyan-400" onClick={() => downloadCsv("mrna_structure_analysis.csv", [
                  ["Parameter", "Value"],
                  ["Region (nt)", `${offset + 1}-${offset + rep.n}`], ["Length", rep.n], ["Max BP span", fold.maxSpan],
                  ["MFE (kcal/mol)", rep.mfe.toFixed(2)], ["MFE / nt", rep.mfePerNt.toFixed(4)],
                  ["Base pairs", rep.pairs], ["Paired %", rep.pairedPct.toFixed(1)],
                  ["Character", rep.character], ["GC pairs", rep.gcPairs], ["AU pairs", rep.auPairs], ["GU pairs", rep.guPairs],
                  ["Longest stem (bp)", rep.longestHelix], ["Hairpins", rep.counts.hairpin], ["Multiloops", rep.counts.multi],
                  ["Bulges", rep.counts.bulge], ["Internal loops", rep.counts.internal], ["Long-range pairs", rep.longRange],
                  ["Start-codon accessibility", rep.startAccessible === null ? "n/a" : rep.startAccessible.toFixed(3)],
                  ["5' end paired", rep.end5Paired.toFixed(3)], ["3' end paired", rep.end3Paired.toFixed(3)],
                  ["Strengths", rep.strengths.join(" | ")], ["Liabilities", rep.weaknesses.join(" | ")],
                  ["Sequence (RNA)", fold.seq], ["Dot-bracket", fold.dotBracket],
                  [], ["Stem 5' start", "Stem 5' end", "Stem 3' start", "Stem 3' end", "bp", "GC %", "Span"],
                  ...rep.helices.map((h) => [h.start5 + offset + 1, h.end5 + offset + 1, h.end3 + offset + 1, h.start3 + offset + 1, h.len, h.gcPct.toFixed(0), h.span]),
                  [], ["Position i", "Base i", "Position j", "Base j"],
                  ...fold.pairs.map(([i, j]) => [i + offset + 1, fold.seq[i], j + offset + 1, fold.seq[j]]),
                ])}>⬇ CSV</button>
              </div>

              {/* Color meanings for every view mode */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 mb-2 bg-slate-900/60 border border-slate-800/80 rounded-xl px-3 py-2">
                {mode === "region" && (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-slate-500 font-semibold">Regions:</span>
                    <span style={{ color: REGION_COL.u5 }}>● 5′UTR</span>
                    <span style={{ color: REGION_COL.cds }}>● CDS</span>
                    <span style={{ color: REGION_COL.u3 }}>● 3′UTR</span>
                  </div>
                )}
                {mode === "base" && (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-slate-500 font-semibold">Nucleotides:</span>
                    {(["A", "U", "G", "C"] as const).map((b) => (
                      <span key={b} className="inline-flex items-center gap-1 font-medium" style={{ color: BASE_COL[b] }}>
                        ● {b} ({BASE_NAMES[b]})
                      </span>
                    ))}
                  </div>
                )}
                {mode === "paired" && (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-slate-500 font-semibold">Pairing state:</span>
                    <span className="text-emerald-400">● Paired (in stem)</span>
                    <span className="text-slate-400">● Unpaired (loop / ssRNA)</span>
                  </div>
                )}
                {mode === "local" && (
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-slate-500 font-semibold">Local paired density (11-nt window):</span>
                    <span className="text-sky-400">0% open / unpaired</span>
                    <span className="inline-block w-28 h-2.5 rounded-full border border-slate-700" style={{ background: LOCAL_GRADIENT }} />
                    <span className="text-emerald-400">50% mixed</span>
                    <span className="text-amber-400">100% dense stem</span>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
                  <span><span className="text-emerald-400 font-bold">━</span> G–C pair</span>
                  <span><span className="text-slate-400 font-bold">━</span> A–U / G–U pair</span>
                  <span className="text-white">◎ start codon</span>
                  <span className="text-cyan-400/80">Hover a base to inspect nt · Pinch (2 fingers) to zoom</span>
                </div>
              </div>

              <div ref={wrapRef} className="relative">
                <div
                  ref={scrollRef}
                  className="overflow-auto border border-slate-900 rounded-xl bg-[#020617]"
                  style={{ maxHeight: 640, touchAction: "pan-x pan-y" }}
                >
                  <svg
                    ref={svgRef}
                    id="mrna-svg"
                    xmlns="http://www.w3.org/2000/svg"
                    width={geo.w * zoom}
                    height={geo.h * zoom}
                    viewBox={`0 0 ${geo.w} ${geo.h}`}
                    onMouseMove={onSvgMove}
                    onMouseLeave={() => setHover(null)}
                    className="cursor-crosshair block"
                  >
                    <rect width="100%" height="100%" fill="#020617" />
                    <path d={paths.au} fill="none" stroke="#94a3b8" strokeWidth={1.5} opacity={0.75} />
                    <path d={paths.gc} fill="none" stroke="#10b981" strokeWidth={2.5} opacity={0.85} />
                    <path d={paths.backbone} fill="none" stroke="#475569" strokeWidth={1.2} />
                    {geo.x.map((_, i) => (
                      <g key={i}>
                        <circle
                          cx={geo.x[i]}
                          cy={geo.y[i]}
                          r={rep.n > 250 ? 4.5 : 7.5}
                          fill={colorOf(i)}
                          stroke={isStart(i) ? "#fff" : "none"}
                          strokeWidth={2}
                        />
                        {rep.n <= 250 && (
                          <text x={geo.x[i]} y={geo.y[i] + 3.5} fontSize={9} textAnchor="middle" fill="#020617" fontWeight={700} style={{ pointerEvents: "none" }}>
                            {fold.seq[i]}
                          </text>
                        )}
                      </g>
                    ))}
                    {hovIdx !== null && hovPartner !== -1 && (
                      <line
                        x1={geo.x[hovIdx]} y1={geo.y[hovIdx]}
                        x2={geo.x[hovPartner]} y2={geo.y[hovPartner]}
                        stroke="#22d3ee" strokeWidth={3} opacity={0.95}
                      />
                    )}
                    {hovIdx !== null && hovPartner !== -1 && (
                      <circle
                        cx={geo.x[hovPartner]} cy={geo.y[hovPartner]}
                        r={rep.n > 250 ? 9 : 11}
                        fill="none" stroke="#22d3ee" strokeWidth={2} strokeDasharray="3 2"
                      />
                    )}
                    {hovIdx !== null && (
                      <g style={{ pointerEvents: "none" }}>
                        <circle
                          cx={geo.x[hovIdx]} cy={geo.y[hovIdx]}
                          r={10}
                          fill={colorOf(hovIdx)} stroke="#ffffff" strokeWidth={2.5}
                        />
                        <text x={geo.x[hovIdx]} y={geo.y[hovIdx] + 3.5} fontSize={10} textAnchor="middle" fill="#020617" fontWeight={800}>
                          {fold.seq[hovIdx]}
                        </text>
                      </g>
                    )}
                    <circle cx={geo.x[0]} cy={geo.y[0]} r={12} fill="none" stroke="#fff" strokeDasharray="2 2" />
                    <text x={geo.x[0] - 6} y={geo.y[0] - 16} fontSize={11} fill="#fff">5′</text>
                    <circle cx={geo.x[rep.n - 1]} cy={geo.y[rep.n - 1]} r={12} fill="none" stroke="#fff" strokeDasharray="2 2" />
                    <text x={geo.x[rep.n - 1] - 6} y={geo.y[rep.n - 1] - 16} fontSize={11} fill="#fff">3′</text>
                  </svg>
                </div>

                {hover && hovIdx !== null && (
                  <div
                    style={{
                      left: Math.min(Math.max(8, hover.cx + 14), (wrapRef.current?.clientWidth ?? 400) - 245),
                      top: Math.max(8, hover.cy > 110 ? hover.cy - 98 : hover.cy + 16),
                    }}
                    className="pointer-events-none absolute z-20 w-60 rounded-xl bg-slate-900/95 border border-cyan-500/50 p-2.5 shadow-2xl text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-2 font-bold text-white">
                        <span
                          className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold text-slate-950"
                          style={{ background: BASE_COL[fold.seq[hovIdx]] ?? "#94a3b8" }}
                        >
                          {fold.seq[hovIdx]}
                        </span>
                        nt {hovIdx + offset + 1} ({BASE_NAMES[fold.seq[hovIdx]] ?? fold.seq[hovIdx]})
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {isStart(hovIdx) ? "Start codon" : regionLabel(hovIdx)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      {hovPartner === -1 ? (
                        <span className="text-slate-400">Unpaired (open / loop)</span>
                      ) : (
                        <span>
                          Paired with <b className="text-cyan-300">nt {hovPartner + offset + 1} ({fold.seq[hovPartner]})</b> [{fold.seq[hovIdx]}–{fold.seq[hovPartner]}]
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex justify-between">
                      <span>Local paired (win 11): <b className="text-white">{(rep.pairedProfile[hovIdx] * 100).toFixed(0)}%</b></span>
                      {hovCodon !== null && <span>Codon #{hovCodon}</span>}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-400 mt-2 h-4">
                {hovIdx !== null
                  ? `nt ${hovIdx + offset + 1}: ${fold.seq[hovIdx]} (${BASE_NAMES[fold.seq[hovIdx]] ?? fold.seq[hovIdx]}) · ${regionLabel(hovIdx)}${hovCodon !== null ? ` (codon ${hovCodon})` : ""} · ${hovPartner === -1 ? "unpaired" : `paired with nt ${hovPartner + offset + 1} (${fold.seq[hovPartner]})`} · ${(rep.pairedProfile[hovIdx] * 100).toFixed(0)}% local paired`
                  : "Move your cursor over any base in the structure to see its nucleotide, position, region and base-pair partner."}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className={card}>
                <h3 className="font-bold text-emerald-400 mb-2">Strengths</h3>
                <ul className="list-disc ml-5 text-sm text-slate-300 space-y-1">{rep.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
              </div>
              <div className={card}>
                <h3 className="font-bold text-amber-400 mb-2">Liabilities</h3>
                <ul className="list-disc ml-5 text-sm text-slate-300 space-y-1">{rep.weaknesses.map((s) => <li key={s}>{s}</li>)}</ul>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-3">
              <Stat k="GC / AU / GU pairs" v={`${rep.gcPairs} / ${rep.auPairs} / ${rep.guPairs}`} />
              <Stat k="Longest stem" v={`${rep.longestHelix} bp`} />
              <Stat k="Hairpins / multi" v={`${rep.counts.hairpin} / ${rep.counts.multi}`} />
              <Stat k="Bulges / internal" v={`${rep.counts.bulge} / ${rep.counts.internal}`} />
              <Stat k="Long-range pairs" v={rep.longRange} hint=">100 nt apart" />
              <Stat k="Start-codon accessibility" v={rep.startAccessible === null ? "n/a" : `${(rep.startAccessible * 100).toFixed(0)}%`} />
              <Stat k="5′ end paired" v={`${(rep.end5Paired * 100).toFixed(0)}%`} />
              <Stat k="3′ end paired" v={`${(rep.end3Paired * 100).toFixed(0)}%`} />
            </div>

            <div className={card}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <h3 className="font-bold text-white">
                  Paired-density profile (window 11)
                  <Help label="Paired-density profile (window 11)" />
                </h3>
                <span className="text-xs text-cyan-300 font-mono">
                  {profHover ? `nt ${profHover.pos}: ${(profHover.val * 100).toFixed(0)}% paired` : "Hover bars to inspect"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                At each base <i>i</i>, computes the fraction of paired nucleotides across the surrounding 11-nt sliding window (<i>i</i>−5 to <i>i</i>+5).
                Taller, warmer bars mark rigid double-stranded stems; short blue bars mark open single-stranded loops.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mb-3 bg-slate-900/60 border border-slate-800/80 rounded-xl px-3 py-1.5">
                <span className="text-sky-400 font-medium">Blue (0% paired): open / accessible (easier ribosome binding & scanning)</span>
                <span className="inline-block w-24 h-2 rounded-full border border-slate-700" style={{ background: LOCAL_GRADIENT }} />
                <span className="text-emerald-400 font-medium">Green (~50%): mixed</span>
                <span className="text-amber-400 font-medium">Orange (100%): dense stem (nuclease-resistant, harder to unwind)</span>
              </div>
              <div className="flex items-end h-20 gap-px" onMouseLeave={() => setProfHover(null)}>
                {(() => {
                  const step = Math.max(1, Math.floor(rep.n / 200));
                  const bars: { i: number; v: number }[] = [];
                  for (let i = 0; i < rep.n; i += step) bars.push({ i, v: rep.pairedProfile[i] });
                  return bars.map(({ i, v }) => (
                    <div
                      key={i}
                      onMouseEnter={() => setProfHover({ pos: i + offset + 1, val: v })}
                      className="flex-1 rounded-t hover:opacity-80 transition-opacity"
                      style={{ height: `${Math.max(4, v * 100)}%`, background: `hsl(${200 - v * 160},80%,55%)` }}
                    />
                  ));
                })()}
              </div>
            </div>

            <div className={card}>
              <h3 className="font-bold text-white mb-2">Top stems</h3>
              <table className="text-xs w-full">
                <thead className="text-slate-500"><tr><th className="text-left">5′ strand</th><th className="text-left">3′ strand</th><th>bp</th><th>GC %</th><th>span</th></tr></thead>
                <tbody>
                  {rep.helices.slice(0, 8).map((h, i) => (
                    <tr key={i} className="border-t border-slate-900 text-center font-mono">
                      <td className="text-left">{h.start5 + offset + 1}–{h.end5 + offset + 1}</td>
                      <td className="text-left">{h.end3 + offset + 1}–{h.start3 + offset + 1}</td>
                      <td>{h.len}</td><td>{h.gcPct.toFixed(0)}</td><td>{h.span}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={card}>
              <div className="flex justify-between mb-2">
                <h3 className="font-bold text-white">Dot-bracket</h3>
                <button className="text-xs text-cyan-400" onClick={() => navigator.clipboard.writeText(`${fold.seq}\n${fold.dotBracket}`)}>copy</button>
              </div>
              <pre className="text-[10px] leading-4 font-mono text-slate-300 whitespace-pre-wrap break-all">{fold.seq}{"\n"}{fold.dotBracket}</pre>
            </div>
          </>
        )}
        <ExternalValidation items={[
          { name: "ViennaRNA RNAfold WebServer", url: "http://rna.tbi.univie.ac.at/cgi-bin/RNAfold.cgi", note: "Validate exact Turner-2004 MFE fold & dot-bracket notation." },
          { name: "LinearFold Web Server", url: "http://linearfold.org/", note: "Validate linear-time folding predictions on full multi-kilobase mRNAs." },
          { name: "forna (ViennaRNA)", url: "http://rna.tbi.univie.ac.at/forna/", note: "Paste dot-bracket output to cross-check 2D topology & layout." },
        ]} />
      </div>
    </MrnaShell>
  );
}
