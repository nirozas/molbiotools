"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Plus, Trash2, Loader2, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface SeqEntry { utr5: string; cds: string; utr3: string; }

interface JobEntry {
  index: number;
  taskId: string;
  cds: string;
  status: "pending" | "running" | "success" | "error";
  result?: any;
  error?: string;
  expanded: boolean;
}

const DEFAULT_SEQ: SeqEntry = { utr5: "", cds: "", utr3: "" };

const ACCENT = "#00d4ff";
const GREEN  = "#10b981";
const RED    = "#f43f5e";

// ─── Shared style helpers ──────────────────────────────────────────────────

const fieldStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(3,7,18,0.5)",
  border: "1px solid rgba(148,163,184,0.15)",
  borderRadius: "12px",
  padding: "0.85rem 1rem",
  color: "white",
  fontFamily: "monospace",
  fontSize: "0.95rem",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "0.82rem",
  fontWeight: 600,
  display: "block",
  marginBottom: "0.4rem",
};

// ─── Score extraction from result ─────────────────────────────────────────

function extractScores(result: any): { label: string; value: string; good: boolean }[] {
  if (!result) return [];
  const rows: { label: string; value: string; good: boolean }[] = [];

  // mRNAid returns different shapes; adapt defensively
  const seqData = result.sequences?.[0] ?? result;

  if (seqData.CAI !== undefined)
    rows.push({ label: "CAI Score", value: Number(seqData.CAI).toFixed(3), good: seqData.CAI >= 0.7 });

  if (seqData.MFE !== undefined)
    rows.push({ label: "MFE (kcal/mol)", value: Number(seqData.MFE).toFixed(2), good: seqData.MFE <= -20 });

  if (seqData.GC_content !== undefined)
    rows.push({ label: "GC Content (%)", value: (Number(seqData.GC_content) * 100).toFixed(1), good: true });

  if (seqData.uridine_content !== undefined)
    rows.push({ label: "Uridine Content (%)", value: (Number(seqData.uridine_content) * 100).toFixed(1), good: seqData.uridine_content < 0.25 });

  return rows;
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function MrnaOptimizationPage() {
  const [sequences, setSequences]       = useState<SeqEntry[]>([{ ...DEFAULT_SEQ }]);
  const [organism, setOrganism]         = useState("Homo Sapiens");
  const [criterion, setCriterion]       = useState("Match codon usage");
  const [uridine, setUridine]           = useState(false);
  const [preciseMfe, setPreciseMfe]     = useState(false);
  const [avoidMotifs, setAvoidMotifs]   = useState("");
  const [gcMin, setGcMin]               = useState("30");
  const [gcMax, setGcMax]               = useState("70");
  const [gcWindow, setGcWindow]         = useState("100");
  const [entropyWin, setEntropyWin]     = useState("30");
  const [numSeqs, setNumSeqs]           = useState("1");

  const [jobs, setJobs]                 = useState<JobEntry[]>([]);
  const [running, setRunning]           = useState(false);
  const [globalError, setGlobalError]   = useState("");

  // ── Sequence CRUD ────────────────────────────────────────────────────────

  const addSeq = () => sequences.length < 6 && setSequences(s => [...s, { ...DEFAULT_SEQ }]);
  const delSeq = (i: number) => setSequences(s => s.filter((_, idx) => idx !== i));
  const patchSeq = (i: number, key: keyof SeqEntry, val: string) => {
    setSequences(s => s.map((e, idx) => idx === i ? { ...e, [key]: val } : e));
  };

  // ── Polling ──────────────────────────────────────────────────────────────

  const pollJob = useCallback(async (taskId: string, jobIdx: number) => {
    const maxAttempts = 60; // 5 min max at 5s interval
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(r => setTimeout(r, 5000));

      try {
        const res = await fetch(`/api/mrnaid/status/${taskId}`);
        const data = await res.json();

        if (data.error) {
          setJobs(prev => prev.map((j, i) => i === jobIdx ? { ...j, status: "error", error: data.error } : j));
          return;
        }

        const state: string = data.state ?? data.status ?? "";

        if (state.toLowerCase() === "success" || state.toLowerCase() === "finished") {
          setJobs(prev => prev.map((j, i) => i === jobIdx ? { ...j, status: "success", result: data } : j));
          return;
        }

        if (state.toLowerCase() === "failure" || state.toLowerCase() === "failed") {
          setJobs(prev => prev.map((j, i) => i === jobIdx ? { ...j, status: "error", error: data.result ?? "Job failed" } : j));
          return;
        }

        // still running – setJobs stays "running"
      } catch {
        // network blip; keep polling
      }
    }

    setJobs(prev => prev.map((j, i) => i === jobIdx ? { ...j, status: "error", error: "Timed out after 5 minutes" } : j));
  }, []);

  // ── Run ──────────────────────────────────────────────────────────────────

  const run = async () => {
    setGlobalError("");
    if (!sequences.some(s => s.cds.trim())) {
      setGlobalError("At least one CDS is required.");
      return;
    }

    setRunning(true);
    setJobs([]);

    try {
      const res = await fetch("/api/mrnaid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mrnaConfig: { sequences, organism, criterion, uridineDepletion: uridine, preciseMfe, avoidMotifs, gcMin, gcMax, gcWindow: gcWindow, entropyWindow: entropyWin, numSequences: numSeqs } }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setGlobalError(data.error ?? `HTTP ${res.status}`);
        setRunning(false);
        return;
      }

      const submitted: JobEntry[] = data.jobs.map((j: any) => ({
        ...j,
        status: "running",
        expanded: false,
      }));

      setJobs(submitted);

      // Start polling all jobs concurrently
      submitted.forEach((job, idx) => pollJob(job.taskId, idx));

    } catch (e: any) {
      setGlobalError(e.message);
    } finally {
      setRunning(false);
    }
  };

  // ── Comparison summary ───────────────────────────────────────────────────

  const doneJobs = jobs.filter(j => j.status === "success");
  const bestCai = doneJobs.reduce((best, j) => {
    const cai = j.result?.sequences?.[0]?.CAI ?? j.result?.CAI ?? -Infinity;
    return cai > (best?.result?.sequences?.[0]?.CAI ?? best?.result?.CAI ?? -Infinity) ? j : best;
  }, null as JobEntry | null);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at top, #0d1628 0%, #030712 60%)", padding: "2rem 1.5rem" }}>
      <main style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <a href="/" style={{ color: "#475569", textDecoration: "none", fontSize: "0.85rem" }}>Home</a>
            <span style={{ color: "#334155" }}>/</span>
            <span style={{ color: ACCENT, fontSize: "0.85rem", fontWeight: 700 }}>mRNA Optimization</span>
          </div>
          <button onClick={() => window.history.back()} style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#64748b", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>

        {/* Title */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "white", letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
            mRNA Optimization
          </h1>
          <p style={{ color: "#64748b", fontSize: "1.05rem" }}>
            RNA folding, stability &amp; translation potential · powered by{" "}
            <a href="https://mrnaid.dichlab.org" target="_blank" rel="noreferrer" style={{ color: ACCENT }}>mrnaid.dichlab.org</a>
          </p>
        </div>

        <div style={{ display: "grid", gap: "2rem" }}>

          {/* ── Sequences ─────────────────────────────────────────────── */}
          <section style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(148,163,184,0.1)", borderRadius: "24px", padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ color: "white", fontSize: "1.1rem", fontWeight: 700 }}>Sequence Data</h2>
              <button
                onClick={addSeq}
                disabled={sequences.length >= 6}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: sequences.length >= 6 ? "#1e293b" : ACCENT, color: sequences.length >= 6 ? "#475569" : "black", border: "none", borderRadius: "10px", padding: "0.55rem 1.1rem", fontWeight: 700, fontSize: "0.85rem", cursor: sequences.length >= 6 ? "not-allowed" : "pointer" }}
              >
                <Plus size={16} /> Add Sequence ({sequences.length}/6)
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {sequences.map((seq, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: "rgba(0,0,0,0.25)", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(148,163,184,0.1)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <span style={{ color: "white", fontWeight: 700 }}>Sequence {i + 1}</span>
                    {i > 0 && (
                      <button onClick={() => delSeq(i)} style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: "8px", color: RED, cursor: "pointer", padding: "0.3rem 0.7rem", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                  </div>
                  <div style={{ display: "grid", gap: "1rem" }}>
                    <div>
                      <label style={labelStyle}>5′ UTR <span style={{ color: "#475569" }}>(optional)</span></label>
                      <input value={seq.utr5} onChange={e => patchSeq(i, "utr5", e.target.value)} style={fieldStyle} placeholder="5' flanking sequence..." />
                    </div>
                    <div>
                      <label style={labelStyle}>Coding Sequence (CDS) <span style={{ color: RED }}>*</span></label>
                      <textarea value={seq.cds} onChange={e => patchSeq(i, "cds", e.target.value)} rows={3} style={{ ...fieldStyle, resize: "vertical" }} placeholder="ATGAAAGCA..." />
                    </div>
                    <div>
                      <label style={labelStyle}>3′ UTR <span style={{ color: "#475569" }}>(optional)</span></label>
                      <input value={seq.utr3} onChange={e => patchSeq(i, "utr3", e.target.value)} style={fieldStyle} placeholder="3' flanking sequence..." />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ── Parameters ────────────────────────────────────────────── */}
          <section style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(148,163,184,0.1)", borderRadius: "24px", padding: "2rem" }}>
            <h2 style={{ color: "white", fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.5rem" }}>Optimization Parameters</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>

              <div>
                <label style={labelStyle}>Codon Usage Organism</label>
                <select value={organism} onChange={e => setOrganism(e.target.value)} style={fieldStyle}>
                  <option>Homo Sapiens</option>
                  <option>Mus musculus</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Optimization Criterion</label>
                <select value={criterion} onChange={e => setCriterion(e.target.value)} style={fieldStyle}>
                  <option>Match codon usage</option>
                  <option>Maximize Codon Adaptation Index (CAI)</option>
                  <option>Match dinucleotides usage</option>
                  <option>Match codon pair usage</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Avoid Motifs</label>
                <input value={avoidMotifs} onChange={e => setAvoidMotifs(e.target.value)} style={fieldStyle} placeholder="EcoRI, UUU, ..." />
              </div>

              <div>
                <label style={labelStyle}>Number of Output Sequences (per input)</label>
                <input type="number" min="1" max="10" value={numSeqs} onChange={e => setNumSeqs(e.target.value)} style={fieldStyle} />
              </div>

              {/* Toggles */}
              <div style={{ gridColumn: "1/-1", display: "flex", gap: "2.5rem", paddingTop: "0.5rem" }}>
                {[
                  { label: "Uridine depletion", val: uridine, set: setUridine },
                  { label: "Use more precise MFE estimation", val: preciseMfe, set: setPreciseMfe },
                ].map(({ label, val, set }) => (
                  <label key={label} style={{ display: "flex", alignItems: "center", gap: "0.65rem", cursor: "pointer", color: "#e2e8f0", fontSize: "0.9rem", fontWeight: 600 }}>
                    <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} style={{ width: "18px", height: "18px", accentColor: ACCENT, cursor: "pointer" }} />
                    {label}
                  </label>
                ))}
              </div>

              {/* GC Content */}
              <div style={{ gridColumn: "1/-1", borderTop: "1px solid rgba(148,163,184,0.1)", paddingTop: "1.5rem" }}>
                <label style={{ ...labelStyle, fontSize: "0.9rem", color: "white", marginBottom: "1rem" }}>Global GC Content (%)</label>
                <div style={{ display: "flex", gap: "1.5rem" }}>
                  {[{ name: "MIN", val: gcMin, set: setGcMin }, { name: "MAX", val: gcMax, set: setGcMax }].map(f => (
                    <div key={f.name} style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <label style={{ ...labelStyle, marginBottom: 0, width: "40px" }}>{f.name}</label>
                      <input type="number" value={f.val} onChange={e => f.set(e.target.value)} style={{ ...fieldStyle, flex: 1 }} />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Window size for local GC content</label>
                <input type="number" value={gcWindow} onChange={e => setGcWindow(e.target.value)} style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Entropy Window Size</label>
                <input type="number" value={entropyWin} onChange={e => setEntropyWin(e.target.value)} style={fieldStyle} />
              </div>

            </div>
          </section>

          {/* ── Submit ────────────────────────────────────────────────── */}
          {globalError && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: "rgba(244,63,94,0.1)", border: `1px solid ${RED}`, borderRadius: "16px", padding: "1rem 1.5rem", color: RED, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <AlertTriangle size={20} /> {globalError}
            </motion.div>
          )}

          <button
            onClick={run}
            disabled={running}
            style={{ width: "100%", background: running ? "#1e293b" : `linear-gradient(135deg, ${ACCENT}, #6366f1)`, color: running ? "#94a3b8" : "white", border: "none", borderRadius: "16px", padding: "1.25rem", fontSize: "1.1rem", fontWeight: 800, cursor: running ? "not-allowed" : "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", boxShadow: running ? "none" : "0 4px 24px rgba(0,212,255,0.25)", transition: "all 0.3s" }}
          >
            {running ? <><Loader2 size={22} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} /> Submitting Jobs...</> : <><Zap size={22} /> Execute Optimization Sweep</>}
          </button>

          {/* ── Job Tracker ───────────────────────────────────────────── */}
          <AnimatePresence>
            {jobs.length > 0 && (
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(148,163,184,0.1)", borderRadius: "24px", padding: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <h2 style={{ color: "white", fontSize: "1.1rem", fontWeight: 700 }}>Job Results</h2>
                  {bestCai && (
                    <span style={{ background: "rgba(16,185,129,0.15)", border: `1px solid ${GREEN}`, color: GREEN, borderRadius: "20px", padding: "0.3rem 0.9rem", fontSize: "0.8rem", fontWeight: 700 }}>
                      Best CAI → Sequence {bestCai.index}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {jobs.map((job, idx) => {
                    const scores = extractScores(job.result);
                    return (
                      <motion.div key={job.taskId} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ background: "rgba(0,0,0,0.25)", borderRadius: "16px", border: `1px solid ${job.status === "success" ? GREEN + "40" : job.status === "error" ? RED + "40" : "rgba(148,163,184,0.1)"}`, overflow: "hidden" }}>
                        <div
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", cursor: job.status === "success" ? "pointer" : "default" }}
                          onClick={() => job.status === "success" && setJobs(prev => prev.map((j, i) => i === idx ? { ...j, expanded: !j.expanded } : j))}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <span style={{ fontWeight: 700, color: "white" }}>Sequence {job.index}</span>
                            <span style={{ color: "#64748b", fontSize: "0.8rem", fontFamily: "monospace" }}>{job.cds}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            {job.status === "running" && <Loader2 size={18} color={ACCENT} style={{ animation: "spin 1s linear infinite" }} />}
                            {job.status === "success" && <CheckCircle size={18} color={GREEN} />}
                            {job.status === "error" && <AlertTriangle size={18} color={RED} />}
                            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: job.status === "success" ? GREEN : job.status === "error" ? RED : ACCENT }}>
                              {job.status === "running" ? "Processing..." : job.status === "success" ? "Complete" : job.status === "error" ? "Error" : "Pending"}
                            </span>
                            {job.status === "success" && (job.expanded ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />)}
                          </div>
                        </div>

                        <AnimatePresence>
                          {job.status === "success" && job.expanded && (
                            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden", borderTop: "1px solid rgba(148,163,184,0.1)" }}>
                              <div style={{ padding: "1.5rem" }}>
                                {scores.length > 0 ? (
                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                                    {scores.map(s => (
                                      <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                                        <div style={{ fontSize: "0.7rem", color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
                                        <div style={{ fontSize: "1.75rem", fontWeight: 800, color: s.good ? GREEN : RED }}>{s.value}</div>
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                                <details>
                                  <summary style={{ color: "#64748b", cursor: "pointer", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Raw JSON response</summary>
                                  <pre style={{ background: "rgba(0,0,0,0.4)", padding: "1rem", borderRadius: "10px", color: "#94a3b8", fontSize: "0.78rem", overflowX: "auto", whiteSpace: "pre-wrap", maxHeight: "260px", overflowY: "auto" }}>
                                    {JSON.stringify(job.result, null, 2)}
                                  </pre>
                                </details>
                              </div>
                            </motion.div>
                          )}
                          {job.status === "error" && (
                            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid rgba(244,63,94,0.2)", color: "#fca5a5", fontSize: "0.85rem" }}>{job.error}</div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Comparison Table */}
                {doneJobs.length > 1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: "2rem", padding: "1.5rem", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: "16px" }}>
                    <h3 style={{ color: ACCENT, fontWeight: 700, marginBottom: "1rem" }}>Comparative Summary</h3>
                    <table style={{ width: "100%", borderCollapse: "collapse", color: "white", fontSize: "0.88rem" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(148,163,184,0.15)" }}>
                          <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", color: "#64748b", fontWeight: 700 }}>Sequence</th>
                          <th style={{ textAlign: "right", padding: "0.5rem 0.75rem", color: "#64748b", fontWeight: 700 }}>CAI</th>
                          <th style={{ textAlign: "right", padding: "0.5rem 0.75rem", color: "#64748b", fontWeight: 700 }}>MFE (kcal/mol)</th>
                          <th style={{ textAlign: "right", padding: "0.5rem 0.75rem", color: "#64748b", fontWeight: 700 }}>GC (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doneJobs.map(j => {
                          const scores = extractScores(j.result);
                          const get = (l: string) => scores.find(s => s.label.startsWith(l))?.value ?? "—";
                          const isBest = bestCai?.index === j.index;
                          return (
                            <tr key={j.taskId} style={{ borderBottom: "1px solid rgba(148,163,184,0.07)", background: isBest ? "rgba(16,185,129,0.05)" : "transparent" }}>
                              <td style={{ padding: "0.6rem 0.75rem" }}>
                                Sequence {j.index}{isBest && <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", color: GREEN, fontWeight: 700 }}>★ BEST</span>}
                              </td>
                              <td style={{ textAlign: "right", padding: "0.6rem 0.75rem", color: GREEN }}>{get("CAI")}</td>
                              <td style={{ textAlign: "right", padding: "0.6rem 0.75rem" }}>{get("MFE")}</td>
                              <td style={{ textAlign: "right", padding: "0.6rem 0.75rem" }}>{get("GC Content")}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </motion.div>
                )}
              </motion.section>
            )}
          </AnimatePresence>

        </div>
      </main>

      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
