"use client";

import React, { useState } from 'react';
import { Beaker, Activity, Terminal, Sparkles, Cpu, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import AnalysisForm from './AnalysisForm';
import MHCVisualizer from './MHCVisualizer';

const API_BASE = "http://localhost:3001/api";

interface Peptide {
    sequence: string;
    start_position: number;
    end_position: number;
    affinity_score: string;
    rank: number;
    binder_level: string;
    allele: string;
}

interface AnalysisResults {
    original_sequence: string;
    peptides: Peptide[];
}

export default function MainApp() {
    const [results, setResults] = useState<AnalysisResults | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mhcClass, setMhcClass] = useState<'I' | 'II'>('I');

    const handleRunAnalysis = async (formData: any) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${API_BASE}/predict`, formData);
            setResults(response.data);
            setTimeout(() => {
                document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } catch (err) {
            setError("Analysis failed. Please check your sequences and try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Per-class accent colors (kept for the form widgets & visualizer)
    const isClassI = mhcClass === 'I';
    const accentColor = isClassI ? '#60a5fa' : '#fb7185';   // blue-400 / rose-400
    const accentGlow  = isClassI
        ? 'rgba(96,165,250,0.25)'
        : 'rgba(251,113,133,0.25)';

    return (
        <div
            style={{
                minHeight: '100%',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontFamily: 'Inter, sans-serif',
                position: 'relative',
                overflowX: 'hidden',
            }}
        >
            {/* ── Background blobs ── */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    width: '700px',
                    height: '700px',
                    borderRadius: '50%',
                    background: isClassI
                        ? 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(244,63,94,0.10) 0%, transparent 70%)',
                    filter: 'blur(80px)',
                    pointerEvents: 'none',
                    zIndex: 0,
                    transition: 'background 1s ease',
                }}
            />
            <div
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    width: '500px',
                    height: '500px',
                    borderRadius: '50%',
                    background: isClassI
                        ? 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
                    filter: 'blur(80px)',
                    pointerEvents: 'none',
                    zIndex: 0,
                    transition: 'background 1s ease',
                }}
            />

            <div style={{ position: 'relative', zIndex: 1, width: '100%', margin: '0', padding: '3rem 2rem 5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                  <button 
                    onClick={() => window.history.back()}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "0.4rem", 
                      color: "#64748b", 
                      background: "none", 
                      border: "none", 
                      cursor: "pointer", 
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      transition: "color 0.2s"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                    Go Back
                  </button>
                </div>

                {/* ── Header ── */}
                <header style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{
                            display: 'inline-flex',
                            padding: '1rem',
                            borderRadius: '20px',
                            marginBottom: '1.25rem',
                            background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}44)`,
                            border: `1px solid ${accentColor}40`,
                            boxShadow: `0 0 32px ${accentGlow}`,
                            transition: 'all 0.8s ease',
                        }}
                    >
                        <Beaker size={36} style={{ color: accentColor, transition: 'color 0.8s ease' }} />
                    </motion.div>

                    <h1
                        style={{
                            fontFamily: 'Space Grotesk, Inter, sans-serif',
                            fontSize: 'clamp(2rem, 5vw, 3rem)',
                            fontWeight: 800,
                            letterSpacing: '-0.03em',
                            color: '#f0f6ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.6rem',
                            marginBottom: '0.75rem',
                        }}
                    >
                        <Sparkles size={26} style={{ color: accentColor, transition: 'color 0.8s ease' }} />
                        MHC Predictor Pro
                    </h1>

                    <p style={{ fontSize: '1rem', color: '#64748b', maxWidth: '520px', margin: '0 auto 1.25rem', lineHeight: 1.6 }}>
                        High-precision peptide binding analysis using NetMHCpan-4.1 &amp; 4.3 algorithms.
                    </p>

                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.35rem 1.1rem',
                            borderRadius: '50px',
                            background: `${accentColor}14`,
                            border: `1px solid ${accentColor}35`,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: accentColor,
                            transition: 'all 0.8s ease',
                        }}
                    >
                        {isClassI ? <Cpu size={13} /> : <Zap size={13} />}
                        {isClassI ? 'MHC Class I · 8–12-mer' : 'MHC Class II · 13–16-mer'}
                    </div>
                </header>

                {/* ── Form card ── */}
                <motion.section
                    layout
                    style={{
                        background: 'rgba(12,22,45,0.85)',
                        border: '1px solid rgba(148,163,184,0.08)',
                        borderRadius: '24px',
                        padding: '2.5rem',
                        backdropFilter: 'blur(16px)',
                        boxShadow: `0 0 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)`,
                        marginBottom: '2.5rem',
                    }}
                >
                    <AnalysisForm
                        onRun={handleRunAnalysis}
                        loading={loading}
                        onClassChange={(c: 'I' | 'II') => setMhcClass(c)}
                    />
                </motion.section>

                {/* ── Error banner ── */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: 'rgba(244,63,94,0.1)',
                            border: '1px solid rgba(244,63,94,0.3)',
                            borderRadius: '12px',
                            padding: '1rem 1.5rem',
                            color: '#fb7185',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            marginBottom: '1.5rem',
                        }}
                    >
                        {error}
                    </motion.div>
                )}

                {/* ── Results ── */}
                <div id="results-section">
                    <AnimatePresence mode="wait">
                        {loading && (
                            <motion.div
                                key="loader"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '5rem 0',
                                    gap: '1.5rem',
                                }}
                            >
                                <div style={{ position: 'relative' }}>
                                    <div
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            borderRadius: '50%',
                                            border: `4px solid ${accentColor}25`,
                                            borderTopColor: accentColor,
                                            animation: 'spin 0.8s linear infinite',
                                        }}
                                    />
                                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                    <Beaker
                                        size={28}
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%,-50%)',
                                            color: accentColor,
                                        }}
                                    />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <h3
                                        style={{
                                            fontFamily: 'Space Grotesk, sans-serif',
                                            fontSize: '1.25rem',
                                            fontWeight: 800,
                                            color: accentColor,
                                            marginBottom: '0.4rem',
                                        }}
                                    >
                                        Processing Sequence…
                                    </h3>
                                    <p style={{ color: '#475569', fontSize: '0.875rem' }}>
                                        Querying bio-servers and mapping alleles
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {results && !loading && (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                            >
                                {/* Results header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0 0.25rem' }}>
                                    <div
                                        style={{
                                            width: '40px',
                                            height: '3px',
                                            borderRadius: '2px',
                                            background: `linear-gradient(90deg, ${accentColor}, transparent)`,
                                        }}
                                    />
                                    <h2
                                        style={{
                                            fontFamily: 'Space Grotesk, sans-serif',
                                            fontSize: '1.1rem',
                                            fontWeight: 800,
                                            color: '#f0f6ff',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.1em',
                                        }}
                                    >
                                        Analysis Results
                                    </h2>
                                </div>
                                <MHCVisualizer data={results} currentClass={mhcClass} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── Footer ── */}
            <footer
                style={{
                    position: 'relative',
                    zIndex: 1,
                    padding: '1.5rem 2rem',
                    borderTop: '1px solid rgba(148,163,184,0.06)',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '2.5rem',
                    flexWrap: 'wrap',
                }}
            >
                {[
                    { icon: <Activity size={14} />, label: 'Real-time Predictions' },
                    { icon: <Terminal size={14} />, label: 'Standard DTU API' },
                ].map(({ icon, label }) => (
                    <span
                        key={label}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: '#334155',
                        }}
                    >
                        {icon}
                        {label}
                    </span>
                ))}
            </footer>

            {/* ── Attribution Section ── */}
            <div
                style={{
                    position: 'relative',
                    zIndex: 1,
                    paddingBottom: '3rem',
                    textAlign: 'center',
                    opacity: 0.6,
                }}
            >
                <div
                    style={{
                        display: 'inline-flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.7rem',
                        color: '#64748b',
                        maxWidth: '400px',
                    }}
                >
                    <div style={{ height: '1px', width: '30px', background: 'rgba(148,163,184,0.2)', marginBottom: '0.5rem' }} />
                    <p style={{ margin: 0 }}>
                        Predictions powered by <strong>NetMHCpan</strong> & <strong>NetMHCIIpan</strong>
                    </p>
                    <p style={{ margin: 0, fontSize: '0.65rem' }}>
                        Special thanks to <strong>DTU Health Tech; Department of Health Technology</strong> for providing the underlying bio-computational services.
                    </p>
                    <a 
                        href="https://services.healthtech.dtu.dk/" 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ color: accentColor, textDecoration: 'none', fontWeight: 600, marginTop: '0.2rem' }}
                    >
                        Official Service Page ↗
                    </a>
                </div>
            </div>
        </div>
    );
}
