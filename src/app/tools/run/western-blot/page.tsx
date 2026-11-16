"use client";

import React, { useMemo, useState } from "react";
import {
  Layers, Plus, Trash2, Search, Loader2, Download, ExternalLink, AlertCircle, Sparkles,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import ToolPageLayout from "@/components/ToolPageLayout";
import { GELS, LADDERS, LadderBand, gelMobility, parseCustomLadder } from "@/lib/wb/ladders";
import {
  PROTEIN_COLORS, ResolvedProtein, TAGS, WB_ORGANISMS,
  calcMwKda, calcTheoreticalPI, cleanProteinSeq, countNGlycoSites, lookupProtein,
} from "@/lib/wb/proteinMw";

interface ProteinSlot {
  id: string;
  mode: "id" | "seq";
  identifier: string;
  organismId: string;
  customOrg: string;
  seqInput: string;
  label: string;
  color: string;
  tagId: string;
  customTagKda: number;
  resolved: ResolvedProtein | null;
  loading: boolean;
  error: string | null;
}

const MAX_PROTEINS = 6;

const DEMO_TP53 =
  "MEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPDDIEQWFTEDPGPDEAPRMPEAAPPVAPAPAAPTPAAPAPAPSWPLSSSVPSQKTYQGSYGFRLGFLHSGTAKSVTCTYSPALNKMFCQLAKTCPVQLWVDSTPPPGTRVRAMAIYKQSQHMTEVVRRCPHHERCSDSDGLAPPQHLIRVEGNLRVEYLDDRNTFRHSVVVPYEPPEVGSDCTTIHYNYMCNSSCMGGMNRRPILTIITLEDSSGNLLGRNSFEVRVCACPGRDRRTEEENLRKKGEPHHELPPGSTKRALPNNTSSSPQPKKKPLDGEYFTLQIRGRERFEMFRELNEALELKDAQAGKEPGGSRAHSSHLKSKKGQSTSRHKKLMFKTEGPDSD";
const DEMO_EGFP =
  "MVSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGKLTLKFICTTGKLPVPWPTLVTTLTYGVQCFSRYPDHMKQHDFFKSAMPEGYVQERTIFFKDDGNYKTRAEVKFEGDTLVNRIELKGIDFKEDGNILGHKLEYNYNSHNVYIMADKQKNGIKVNFKIRHNIEDGSVQLADHYQQNTPIGDGPVLLPDNHYLSTQSALSKDPNEKRDHMVLLEFVTAAGITLGMDELYK";
const DEMO_GAPDH =
  "MGKVKVGVNGFGRIGRLVTRAAFNSGKVDIVAINDPFIDLNYMVYMFQYDSTHGKFHGTVKAENGKLVINGNPITIFQERDPSKIKWGDAGAEYVVESTGVFTTMEKAGAHLQGGAKRVIISAPSADAPMFVMGVNHEKYDNSLKIISNASCTTNCLAPLAKVIHDNFGIVEGLMTTVHAITATQKTVDGPSGKLWRDGRGALQNIIPASTGAAKAVGKVIPELNGKLTGMAFRVPTANVSVVDLTCRLEKPAKYDDIKKVVKQASEGPLKGILGYTEHQVVSSDFNSDTHSSTFDAGAGIALNDHFVKLISWYDNEFGYSNRVVDLMAHMASKE";

function buildSeqProtein(seqRaw: string, label: string): ResolvedProtein | null {
  const header = seqRaw.match(/^>\s*([^\r\n]+)/m)?.[1]?.trim();
  const seq = cleanProteinSeq(seqRaw);
  if (!seq.length) return null;
  return {
    name: label.trim() || header?.split(/\s+/)[0] || "Custom Protein",
    accession: "AA Sequence",
    organism: "User-supplied",
    sequence: seq,
    length: seq.length,
    mwKda: calcMwKda(seq),
    pI: calcTheoreticalPI(seq),
    nGlyco: countNGlycoSites(seq),
    chains: [],
    source: "Sequence",
  };
}

function makeSlot(idx: number, overrides: Partial<ProteinSlot> = {}): ProteinSlot {
  return {
    id: `p-${idx}-${Math.random().toString(36).slice(2, 7)}`,
    mode: "id",
    identifier: "",
    organismId: "9606",
    customOrg: "",
    seqInput: "",
    label: "",
    color: PROTEIN_COLORS[idx % PROTEIN_COLORS.length],
    tagId: "none",
    customTagKda: 0,
    resolved: null,
    loading: false,
    error: null,
    ...overrides,
  };
}

const INITIAL_SLOTS: ProteinSlot[] = [
  makeSlot(0, {
    mode: "seq",
    identifier: "TP53",
    label: "TP53 (Human)",
    seqInput: DEMO_TP53,
    resolved: buildSeqProtein(DEMO_TP53, "TP53"),
  }),
  makeSlot(1, {
    mode: "seq",
    identifier: "GAPDH",
    label: "GAPDH (Human)",
    seqInput: DEMO_GAPDH,
    resolved: buildSeqProtein(DEMO_GAPDH, "GAPDH"),
  }),
  makeSlot(2, {
    mode: "seq",
    identifier: "EGFP",
    label: "EGFP (Tag control)",
    seqInput: DEMO_EGFP,
    resolved: buildSeqProtein(DEMO_EGFP, "EGFP"),
  }),
];

const card = "bg-slate-950 border border-slate-800 rounded-2xl p-5";
const inputCls =
  "w-full bg-slate-900/70 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500/60";
const btn =
  "px-3.5 py-2 rounded-xl border text-xs font-semibold bg-purple-500/10 border-purple-500/40 text-purple-300 hover:bg-purple-500/20 transition disabled:opacity-40 cursor-pointer";

type LayoutMode = "both" | "separate" | "multiplex";

interface ComputedBand {
  slotId: string;
  laneIdx: number;
  name: string;
  color: string;
  baseMw: number;
  tagKda: number;
  totalMw: number;
  y: number;
  prot: ResolvedProtein;
}

export default function WesternBlotVisualizer() {
  const [slots, setSlots] = useState<ProteinSlot[]>(INITIAL_SLOTS);
  const [ladderId, setLadderId] = useState<string>("biorad-dual");
  const [customLadder, setCustomLadder] = useState("250, 100, 75, 50, 37, 25, 20");
  const [gelId, setGelId] = useState<string>("10");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("both");
  const [blotTheme, setBlotTheme] = useState<"light" | "dark">("light");
  const [prestainedLadder, setPrestainedLadder] = useState<boolean>(false);
  const [showCleaved, setShowCleaved] = useState<boolean>(true);
  const [blotTitle, setBlotTitle] = useState("Predicted Western Blot");
  const [hoverBand, setHoverBand] = useState<{
    title: string;
    mw: number;
    y: number;
    detail: string;
    color: string;
  } | null>(null);

  const gel = GELS.find((g) => g.id === gelId) ?? GELS[3];
  const ladderBands: LadderBand[] = useMemo(() => {
    if (ladderId === "custom") return parseCustomLadder(customLadder);
    return LADDERS.find((l) => l.id === ladderId)?.bands ?? LADDERS[0].bands;
  }, [ladderId, customLadder]);

  const updateSlot = (id: string, patch: Partial<ProteinSlot>) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const addSlot = () => {
    if (slots.length >= MAX_PROTEINS) return;
    setSlots((prev) => [...prev, makeSlot(prev.length)]);
  };

  const removeSlot = (id: string) => {
    if (slots.length <= 1) return;
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const resolveOne = async (slot: ProteinSlot) => {
    if (slot.mode === "seq") {
      const r = buildSeqProtein(slot.seqInput, slot.label);
      updateSlot(slot.id, {
        resolved: r,
        error: r ? null : "Paste a valid amino acid sequence.",
      });
      return;
    }
    if (!slot.identifier.trim()) {
      updateSlot(slot.id, { error: "Enter a gene name, Gene ID, UniProt, Ensembl, or RefSeq ID." });
      return;
    }
    updateSlot(slot.id, { loading: true, error: null });
    try {
      const r = await lookupProtein(slot.identifier, slot.organismId, slot.customOrg);
      updateSlot(slot.id, {
        loading: false,
        resolved: r,
        label: slot.label.trim() ? slot.label : r.name,
        error: null,
      });
    } catch (e) {
      updateSlot(slot.id, {
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const resolveAll = async () => {
    await Promise.all(slots.map((s) => resolveOne(s)));
  };

  const loadLookupExample = async () => {
    const preset: ProteinSlot[] = [
      makeSlot(0, { mode: "id", identifier: "NFKB1", organismId: "9606", label: "NFKB1 (p105/p50)" }),
      makeSlot(1, { mode: "id", identifier: "TP53", organismId: "9606", label: "TP53" }),
      makeSlot(2, { mode: "id", identifier: "ACTB", organismId: "9606", label: "ACTB" }),
      makeSlot(3, { mode: "id", identifier: "GAPDH", organismId: "9606", label: "GAPDH" }),
    ];
    setSlots(preset);
    await Promise.all(
      preset.map(async (s) => {
        try {
          const r = await lookupProtein(s.identifier, s.organismId);
          setSlots((prev) => prev.map((x) => (x.id === s.id ? { ...x, resolved: r, loading: false, error: null } : x)));
        } catch (err) {
          setSlots((prev) =>
            prev.map((x) => (x.id === s.id ? { ...x, loading: false, error: err instanceof Error ? err.message : String(err) } : x)),
          );
        }
      }),
    );
  };

  // Resolved protein bands
  const activeProteins: ComputedBand[] = useMemo(() => {
    const out: ComputedBand[] = [];
    slots.forEach((s, idx) => {
      const prot = s.mode === "seq" ? buildSeqProtein(s.seqInput, s.label) : s.resolved;
      if (!prot) return;
      const tagKda =
        s.tagId === "custom" ? s.customTagKda : (TAGS.find((t) => t.id === s.tagId)?.kDa ?? 0);
      const totalMw = Math.max(0.5, prot.mwKda + tagKda);
      out.push({
        slotId: s.id,
        laneIdx: idx,
        name: s.label.trim() || prot.name,
        color: s.color,
        baseMw: prot.mwKda,
        tagKda,
        totalMw,
        y: 0,
        prot,
      });
    });
    return out;
  }, [slots]);

  // SVG geometry
  const GEL_TOP = 38;
  const GEL_H = 380;
  const AXIS_X = 64;
  const LANE_W = 78;
  const LANE_GAP = 14;

  const lanes = useMemo(() => {
    const list: { kind: "marker" | "protein" | "multiplex"; label: string; band?: ComputedBand }[] = [
      { kind: "marker", label: "Markers" },
    ];
    if (layoutMode !== "multiplex") {
      activeProteins.forEach((b) => list.push({ kind: "protein", label: b.name, band: b }));
    }
    if (layoutMode === "both" || layoutMode === "multiplex") {
      if (activeProteins.length > 1 || layoutMode === "multiplex") {
        list.push({ kind: "multiplex", label: "Overlay" });
      }
    }
    return list;
  }, [layoutMode, activeProteins]);

  const gelW = Math.max(220, lanes.length * LANE_W + (lanes.length + 1) * LANE_GAP);
  const svgW = AXIS_X + gelW + 24;
  const svgH = GEL_TOP + GEL_H + 54;

  const yOf = (mw: number) => GEL_TOP + gelMobility(mw, gel) * GEL_H;

  // Smart Y-label layout to avoid overlapping adjacent kDa labels
  const ladderPositioned = useMemo(() => {
    const sorted = [...ladderBands].sort((a, b) => b.mw - a.mw);
    let lastLabelY = -999;
    return sorted.map((b) => {
      const y = yOf(b.mw);
      const labelY = Math.max(y, lastLabelY + 13);
      lastLabelY = labelY;
      return { ...b, y, labelY };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ladderBands, gel]);

  const isLight = blotTheme === "light";
  const bgMembrane = isLight ? "#dedede" : "#0b1220";
  const borderCol = isLight ? "#1e293b" : "#475569";
  const textCol = isLight ? "#0f172a" : "#e2e8f0";
  const markerDefaultCol = isLight ? "#09090b" : "#e2e8f0";

  const exportSvg = () => {
    const svg = document.getElementById("wb-gel-svg");
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "western_blot_gel.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPng = () => {
    const svg = document.getElementById("wb-gel-svg");
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const url = URL.createObjectURL(new Blob([data], { type: "image/svg+xml;charset=utf-8" }));
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = svgW * scale;
      canvas.height = svgH * scale;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = isLight ? "#ffffff" : "#030712";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = "western_blot_gel.png";
        a.click();
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ["Name", "Source", "Accession", "Organism", "Length (aa)", "Polypeptide MW (kDa)", "Tag Shift (kDa)", "Expected WB Band (kDa)", "Theoretical pI", "N-Glyco Motifs", "Cleaved Chains", "Color", "Sequence"],
      ...activeProteins.map((b) => [
        b.name,
        b.prot.source,
        b.prot.accession,
        b.prot.organism,
        b.prot.length,
        b.baseMw.toFixed(2),
        b.tagKda.toFixed(2),
        b.totalMw.toFixed(2),
        b.prot.pI.toFixed(2),
        b.prot.nGlyco,
        b.prot.chains.map((c) => `${c.label} (${c.mwKda.toFixed(1)} kDa)`).join(" | "),
        b.color,
        b.prot.sequence,
      ]),
    ];
    const csv = "\ufeff" + rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "western_blot_proteins.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200">
      <Navbar />
      <div className="h-16" />
      <ToolPageLayout>
        <main className="max-w-6xl mx-auto p-6 md:p-10 w-full">
          <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                <Layers size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Western Blot Gel Visualizer</h1>
                <p className="text-slate-400 text-sm">
                  Predict SDS-PAGE migration &amp; visualize up to 6 proteins in distinct colors against standard kDa markers.
                </p>
              </div>
            </div>
            <button onClick={loadLookupExample} className={btn + " flex items-center gap-1.5"}>
              <Sparkles size={14} /> Load Live Example (NFKB1, TP53, ACTB, GAPDH)
            </button>
          </header>

          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* Left column: Protein inputs & gel settings */}
            <div className="lg:col-span-6 space-y-5">
              <div className={card + " space-y-4"}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    Proteins of Interest ({slots.length}/{MAX_PROTEINS})
                  </h2>
                  <div className="flex gap-2">
                    <button onClick={resolveAll} className={btn + " flex items-center gap-1"}>
                      <Search size={13} /> Fetch All IDs
                    </button>
                    <button onClick={addSlot} disabled={slots.length >= MAX_PROTEINS} className={btn + " flex items-center gap-1"}>
                      <Plus size={13} /> Add Protein
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {slots.map((s, idx) => {
                    const liveProt = s.mode === "seq" ? buildSeqProtein(s.seqInput, s.label) : s.resolved;
                    const tagKda =
                      s.tagId === "custom" ? s.customTagKda : (TAGS.find((t) => t.id === s.tagId)?.kDa ?? 0);
                    return (
                      <div key={s.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={s.color}
                              onChange={(e) => updateSlot(s.id, { color: e.target.value })}
                              title="Pick band color"
                              className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                            />
                            <span className="text-xs font-bold text-white">Protein {idx + 1}</span>
                            {liveProt && (
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-200">
                                {(liveProt.mwKda + tagKda).toFixed(1)} kDa · {liveProt.length} aa
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[11px]">
                              <button
                                onClick={() => updateSlot(s.id, { mode: "id" })}
                                className={`px-2 py-0.5 rounded-md ${s.mode === "id" ? "bg-purple-500/20 text-purple-300 font-semibold" : "text-slate-500"}`}
                              >
                                Gene / ID
                              </button>
                              <button
                                onClick={() => updateSlot(s.id, { mode: "seq" })}
                                className={`px-2 py-0.5 rounded-md ${s.mode === "seq" ? "bg-purple-500/20 text-purple-300 font-semibold" : "text-slate-500"}`}
                              >
                                AA Sequence
                              </button>
                            </div>
                            {slots.length > 1 && (
                              <button
                                onClick={() => removeSlot(s.id)}
                                title="Remove protein"
                                className="text-slate-500 hover:text-rose-400 p-1"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        {s.mode === "id" ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                              <input
                                value={s.identifier}
                                onChange={(e) => updateSlot(s.id, { identifier: e.target.value })}
                                onKeyDown={(e) => { if (e.key === "Enter") resolveOne(s); }}
                                placeholder="Gene, UniProt, Ensembl, GeneID, RefSeq (e.g. TP53, P04637, 7157)"
                                className={inputCls + " sm:col-span-6"}
                              />
                              <select
                                value={s.organismId}
                                onChange={(e) => updateSlot(s.id, { organismId: e.target.value })}
                                className={inputCls + " sm:col-span-4"}
                              >
                                {WB_ORGANISMS.map((o) => (
                                  <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => resolveOne(s)}
                                disabled={s.loading}
                                className={btn + " sm:col-span-2 flex items-center justify-center gap-1"}
                              >
                                {s.loading ? <Loader2 size={13} className="animate-spin" /> : "Fetch"}
                              </button>
                            </div>
                            {s.organismId === "custom" && (
                              <input
                                value={s.customOrg}
                                onChange={(e) => updateSlot(s.id, { customOrg: e.target.value })}
                                placeholder="Organism scientific name or NCBI TaxID (e.g. Bos taurus or 9913)"
                                className={inputCls}
                              />
                            )}
                          </div>
                        ) : (
                          <textarea
                            value={s.seqInput}
                            onChange={(e) => updateSlot(s.id, { seqInput: e.target.value, error: null })}
                            placeholder="Paste 1-letter amino acid sequence (optional >FASTA header)…"
                            className={inputCls + " h-20 font-mono text-xs"}
                          />
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            value={s.label}
                            onChange={(e) => updateSlot(s.id, { label: e.target.value })}
                            placeholder={liveProt ? `Lane label (default: ${liveProt.name})` : "Optional lane label"}
                            className={inputCls + " !py-1.5 text-xs"}
                          />
                          <div className="flex gap-1.5">
                            <select
                              value={s.tagId}
                              onChange={(e) => updateSlot(s.id, { tagId: e.target.value })}
                              className={inputCls + " !py-1.5 text-xs"}
                            >
                              {TAGS.map((t) => (
                                <option key={t.id} value={t.id}>{t.label}</option>
                              ))}
                              <option value="custom">Custom tag (+kDa)…</option>
                            </select>
                            {s.tagId === "custom" && (
                              <input
                                type="number"
                                step="0.1"
                                value={s.customTagKda}
                                onChange={(e) => updateSlot(s.id, { customTagKda: parseFloat(e.target.value) || 0 })}
                                className={inputCls + " !w-20 !py-1.5 text-xs"}
                                placeholder="+kDa"
                              />
                            )}
                          </div>
                        </div>

                        {s.error && (
                          <p className="text-xs text-rose-400 flex items-center gap-1.5">
                            <AlertCircle size={13} /> {s.error}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gel & Marker Settings */}
              <div className={card + " space-y-4"}>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Marker (Ladder) &amp; Gel Settings
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 uppercase block mb-1">Protein Ladder (Marker)</label>
                    <select value={ladderId} onChange={(e) => setLadderId(e.target.value)} className={inputCls}>
                      {LADDERS.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                      <option value="custom">Custom kDa ladder…</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 uppercase block mb-1">Gel Percentage / Type</label>
                    <select value={gelId} onChange={(e) => setGelId(e.target.value)} className={inputCls}>
                      {GELS.map((g) => (
                        <option key={g.id} value={g.id}>{g.name} — {g.note}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {ladderId === "custom" && (
                  <div>
                    <label className="text-[11px] text-slate-400 uppercase block mb-1">Custom Ladder Bands (kDa, comma-separated)</label>
                    <input
                      value={customLadder}
                      onChange={(e) => setCustomLadder(e.target.value)}
                      placeholder="e.g. 250, 150, 100, 75, 50, 37, 25, 20, 15, 10"
                      className={inputCls + " font-mono"}
                    />
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 uppercase block mb-1">Lane Display</label>
                    <select value={layoutMode} onChange={(e) => setLayoutMode(e.target.value as LayoutMode)} className={inputCls}>
                      <option value="both">Separate Lanes + Multiplex Overlay</option>
                      <option value="separate">Separate Lanes Only</option>
                      <option value="multiplex">Multiplex Overlay Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 uppercase block mb-1">Gel Style &amp; Title</label>
                    <div className="flex gap-2">
                      <select
                        value={blotTheme}
                        onChange={(e) => setBlotTheme(e.target.value as "light" | "dark")}
                        className={inputCls + " !w-40"}
                      >
                        <option value="light">Publication Light</option>
                        <option value="dark">Dark Fluorescence</option>
                      </select>
                      <input
                        value={blotTitle}
                        onChange={(e) => setBlotTitle(e.target.value)}
                        placeholder="Blot title"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={prestainedLadder} onChange={(e) => setPrestainedLadder(e.target.checked)} />
                    Prestained ladder band colors
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={showCleaved} onChange={(e) => setShowCleaved(e.target.checked)} />
                    Show UniProt cleaved chains (fainter bands)
                  </label>
                </div>
              </div>
            </div>

            {/* Right column: W.B Gel Visualizer */}
            <div className="lg:col-span-6 space-y-5">
              <div className={card}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white">Western Blot Gel Preview</h2>
                    <p className="text-[11px] text-slate-500">Hover any band to read exact kDa &amp; migration notes</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={exportSvg} className={btn}>SVG</button>
                    <button onClick={exportPng} className={btn}>PNG</button>
                    <button onClick={exportCsv} className={btn + " flex items-center gap-1"}>
                      <Download size={12} /> CSV
                    </button>
                  </div>
                </div>

                <div
                  className="overflow-x-auto rounded-xl p-4 flex justify-center"
                  style={{ background: isLight ? "#ffffff" : "#020617", border: "1px solid rgba(148,163,184,0.18)" }}
                >
                  <svg
                    id="wb-gel-svg"
                    xmlns="http://www.w3.org/2000/svg"
                    width={svgW}
                    height={svgH}
                    viewBox={`0 0 ${svgW} ${svgH}`}
                    onMouseLeave={() => setHoverBand(null)}
                  >
                    <rect width="100%" height="100%" fill={isLight ? "#ffffff" : "#020617"} />

                    {/* Title */}
                    {blotTitle.trim() && (
                      <text
                        x={AXIS_X + gelW / 2}
                        y={20}
                        textAnchor="middle"
                        fontSize={13}
                        fontWeight={700}
                        fill={textCol}
                      >
                        {blotTitle} ({gel.name})
                      </text>
                    )}

                    {/* kDa Axis header */}
                    <text x={AXIS_X - 8} y={GEL_TOP - 8} textAnchor="end" fontSize={12} fontWeight={800} fill={textCol}>
                      kDa
                    </text>

                    {/* Gel membrane */}
                    <rect
                      x={AXIS_X}
                      y={GEL_TOP}
                      width={gelW}
                      height={GEL_H}
                      fill={bgMembrane}
                      rx={2}
                    />
                    {/* L-shaped axis border matching publication blot */}
                    <line x1={AXIS_X} y1={GEL_TOP} x2={AXIS_X} y2={GEL_TOP + GEL_H} stroke={borderCol} strokeWidth={2} />
                    <line x1={AXIS_X} y1={GEL_TOP + GEL_H} x2={AXIS_X + gelW} y2={GEL_TOP + GEL_H} stroke={borderCol} strokeWidth={2} />

                    {/* Subtle lane dividers */}
                    {lanes.map((_, li) => {
                      const lx = AXIS_X + LANE_GAP + li * (LANE_W + LANE_GAP);
                      return (
                        <rect
                          key={`lane-bg-${li}`}
                          x={lx}
                          y={GEL_TOP + 2}
                          width={LANE_W}
                          height={GEL_H - 4}
                          fill={isLight ? "rgba(0,0,0,0.025)" : "rgba(255,255,255,0.025)"}
                        />
                      );
                    })}

                    {/* Ladder kDa labels & marker lane bands */}
                    {ladderPositioned.map((b, bi) => {
                      const mx = AXIS_X + LANE_GAP;
                      const bandCol = prestainedLadder && b.color ? b.color : markerDefaultCol;
                      const h = b.thick ? 7 : 5;
                      return (
                        <g
                          key={`lad-${bi}`}
                          onMouseEnter={() =>
                            setHoverBand({
                              title: `Ladder Marker: ${b.mw} kDa`,
                              mw: b.mw,
                              y: b.y,
                              detail: LADDERS.find((l) => l.id === ladderId)?.name || "Custom ladder",
                              color: bandCol,
                            })
                          }
                          className="cursor-pointer"
                        >
                          <line x1={AXIS_X - 5} y1={b.y} x2={AXIS_X} y2={b.y} stroke={borderCol} strokeWidth={1.2} />
                          <text
                            x={AXIS_X - 8}
                            y={b.labelY + 4}
                            textAnchor="end"
                            fontSize={11}
                            fontWeight={700}
                            fill={textCol}
                          >
                            {b.mw}
                          </text>
                          <rect
                            x={mx + 12}
                            y={b.y - h / 2}
                            width={LANE_W - 24}
                            height={h}
                            rx={1}
                            fill={bandCol}
                          />
                        </g>
                      );
                    })}

                    {/* Protein lanes & Overlay lane */}
                    {lanes.map((lane, li) => {
                      if (lane.kind === "marker") return null;
                      const lx = AXIS_X + LANE_GAP + li * (LANE_W + LANE_GAP);
                      const bandsToDraw: ComputedBand[] =
                        lane.kind === "protein" && lane.band ? [lane.band] : activeProteins;

                      return (
                        <g key={`lane-${li}`}>
                          {bandsToDraw.map((b, bi) => {
                            const by = yOf(b.totalMw);
                            const bw = LANE_W - 20;
                            const bx = lx + 10;
                            return (
                              <g key={`${b.slotId}-${bi}`}>
                                {/* Optional cleaved / mature peptide chains (faint) */}
                                {showCleaved &&
                                  b.prot.chains.map((ch, ci) => {
                                    const cmw = ch.mwKda + b.tagKda;
                                    const cy = yOf(cmw);
                                    return (
                                      <rect
                                        key={`ch-${ci}`}
                                        x={bx + 2}
                                        y={cy - 2.5}
                                        width={bw - 4}
                                        height={5}
                                        rx={1}
                                        fill={b.color}
                                        opacity={0.4}
                                        className="cursor-pointer"
                                        onMouseEnter={() =>
                                          setHoverBand({
                                            title: `${b.name} — ${ch.label}`,
                                            mw: cmw,
                                            y: cy,
                                            detail: `Processed/cleaved chain (${ch.start}–${ch.end} aa) annotated in UniProt`,
                                            color: b.color,
                                          })
                                        }
                                      />
                                    );
                                  })}
                                {/* Main expected band */}
                                <rect
                                  x={bx}
                                  y={by - 3.5}
                                  width={bw}
                                  height={7}
                                  rx={1.5}
                                  fill={b.color}
                                  opacity={lane.kind === "multiplex" ? 0.92 : 1}
                                  className="cursor-pointer"
                                  onMouseEnter={() =>
                                    setHoverBand({
                                      title: `${b.name} (${b.prot.accession})`,
                                      mw: b.totalMw,
                                      y: by,
                                      detail: `${b.prot.length} aa · base ${b.baseMw.toFixed(2)} kDa${b.tagKda ? ` + ${b.tagKda.toFixed(2)} kDa tag` : ""} · pI ${b.prot.pI.toFixed(2)}`,
                                      color: b.color,
                                    })
                                  }
                                />
                              </g>
                            );
                          })}
                        </g>
                      );
                    })}

                    {/* Hover guide line */}
                    {hoverBand && (
                      <line
                        x1={AXIS_X}
                        y1={hoverBand.y}
                        x2={AXIS_X + gelW}
                        y2={hoverBand.y}
                        stroke={hoverBand.color}
                        strokeWidth={1.2}
                        strokeDasharray="4 3"
                      />
                    )}

                    {/* Bottom lane labels */}
                    {lanes.map((lane, li) => {
                      const cx = AXIS_X + LANE_GAP + li * (LANE_W + LANE_GAP) + LANE_W / 2;
                      const short = lane.label.length > 11 ? lane.label.slice(0, 10) + "…" : lane.label;
                      return (
                        <g key={`lbl-${li}`}>
                          {lane.band && (
                            <circle cx={cx} cy={GEL_TOP + GEL_H + 12} r={3.5} fill={lane.band.color} />
                          )}
                          <text
                            x={cx}
                            y={GEL_TOP + GEL_H + 28}
                            textAnchor="middle"
                            fontSize={11}
                            fontWeight={700}
                            fill={textCol}
                          >
                            {short}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Hover readout */}
                <div className="mt-3 min-h-[24px] text-xs flex flex-wrap items-center justify-between gap-2">
                  {hoverBand ? (
                    <span className="flex items-center gap-2 text-slate-200">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: hoverBand.color }} />
                      <b>{hoverBand.title}</b> — <span className="font-mono text-purple-300">{hoverBand.mw.toFixed(2)} kDa</span>
                      <span className="text-slate-400">({hoverBand.detail})</span>
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      Each protein renders in its assigned color; toggle &ldquo;Overlay&rdquo; to compare all proteins in one lane.
                    </span>
                  )}
                </div>

                {/* Color legend */}
                {activeProteins.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                    {activeProteins.map((b) => (
                      <span key={b.slotId} className="inline-flex items-center gap-1.5 text-slate-300">
                        <span className="w-3 h-2 rounded-sm inline-block" style={{ background: b.color }} />
                        <b>{b.name}</b>
                        <span className="font-mono text-slate-400">{b.totalMw.toFixed(1)} kDa</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary Table */}
          {activeProteins.length > 0 && (
            <div className={card + " mt-6"}>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">
                Expected Band Summary &amp; Migration Notes
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 text-left">Protein</th>
                      <th className="py-2 text-left">Source / ID</th>
                      <th className="py-2 text-right">Length</th>
                      <th className="py-2 text-right">Base MW</th>
                      <th className="py-2 text-right">Tag</th>
                      <th className="py-2 text-right">Expected Band</th>
                      <th className="py-2 text-right">pI</th>
                      <th className="py-2 text-right">N-Glyco</th>
                      <th className="py-2 text-left pl-4">Migration / Processing Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeProteins.map((b) => {
                      const notes: string[] = [];
                      if (b.prot.pI < 5) notes.push("Very acidic (may run slightly higher on SDS-PAGE)");
                      if (b.prot.nGlyco > 0) notes.push(`${b.prot.nGlyco} N-X-S/T motif(s) — glycosylation adds ~2–3 kDa/site`);
                      if (b.prot.chains.length > 0) {
                        notes.push(`Cleaved chains: ${b.prot.chains.map((c) => `${c.label} (~${(c.mwKda + b.tagKda).toFixed(1)} kDa)`).join(", ")}`);
                      }
                      return (
                        <tr key={b.slotId} className="border-t border-slate-900">
                          <td className="py-2 font-semibold text-white">
                            <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ background: b.color }} />
                            {b.name}
                          </td>
                          <td className="py-2 text-slate-400">{b.prot.source}: {b.prot.accession}</td>
                          <td className="py-2 text-right font-mono">{b.prot.length} aa</td>
                          <td className="py-2 text-right font-mono">{b.baseMw.toFixed(2)} kDa</td>
                          <td className="py-2 text-right font-mono">{b.tagKda ? `+${b.tagKda.toFixed(2)}` : "–"}</td>
                          <td className="py-2 text-right font-mono font-bold text-purple-300">{b.totalMw.toFixed(2)} kDa</td>
                          <td className="py-2 text-right font-mono">{b.prot.pI.toFixed(2)}</td>
                          <td className="py-2 text-right font-mono">{b.prot.nGlyco}</td>
                          <td className="py-2 pl-4 text-slate-400">{notes.join(" · ") || "Standard migration expected"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* External validation links */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mt-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              External Validation Tools
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { name: "ExPASy Compute pI/Mw", url: "https://web.expasy.org/compute_pi/", note: "Validate exact theoretical molecular weight (Da) & isoelectric point." },
                { name: "UniProtKB", url: "https://www.uniprot.org/", note: "Inspect isoforms, signal peptides, cleavage products & PTMs." },
                { name: "The Human Protein Atlas", url: "https://www.proteinatlas.org/", note: "Cross-check experimental Western blot antibody bands & cell-line blots." },
              ].map((it) => (
                <a
                  key={it.url}
                  href={it.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-800/90 bg-slate-900/40 px-3.5 py-2.5 hover:border-purple-500/40 hover:bg-slate-900/80 transition group"
                >
                  <div>
                    <div className="text-xs font-semibold text-purple-300 group-hover:text-purple-200">{it.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{it.note}</div>
                  </div>
                  <ExternalLink size={14} className="text-slate-500 group-hover:text-purple-300 shrink-0 mt-0.5" />
                </a>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-600 mt-6">
            Band positions use an empirical Ferguson log-MW migration curve calibrated per gel percentage; post-translational
            modifications (glycosylation, ubiquitination, phosphorylation) or extreme charge/hydrophobicity can shift apparent kDa on SDS-PAGE.
          </p>
        </main>
      </ToolPageLayout>
    </div>
  );
}
