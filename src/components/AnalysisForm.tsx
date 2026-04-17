"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Check, FileText, X, MousePointer2, Zap, Cpu, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const ORGANISMS = [
    { id: 'Human', name: 'Human (Homo sapiens)', prefixes: ['HLA-', 'DRB'] },
    { id: 'Mouse', name: 'Mouse (Mus musculus)', prefixes: ['H-2-'] },
    { id: 'Macaque', name: 'Macaque (Macaca mulatta)', prefixes: ['Mamu-', 'Patr-', 'Gogo-'] },
    { id: 'Swine', name: 'Swine (Sus scrofa)', prefixes: ['SLA-'] },
    { id: 'Cattle', name: 'Cattle (Bos taurus)', prefixes: ['BoLA-'] },
    { id: 'Dog', name: 'Dog (Canis familiaris)', prefixes: ['DLA-'] },
];

const API_BASE = "http://localhost:3001/api";

interface Organism { id: string; name: string; prefixes: string[]; }
interface AnalysisFormProps { onRun: (data: any) => void; loading: boolean; onClassChange?: (mhcClass: 'I' | 'II') => void; }

const Label = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#334155', letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: '0.65rem' }}>{children}</div>
);
const SectionCard = ({ children, accent }: { children: React.ReactNode; accent: string }) => (
    <div style={{ background: 'rgba(8,15,32,0.7)', border: `1px solid ${accent}25`, borderRadius: '16px', padding: '1.4rem' }}>{children}</div>
);

export default function AnalysisForm({ onRun, loading, onClassChange }: AnalysisFormProps) {
    const [sequence, setSequence] = useState('');
    const [sequenceName, setSequenceName] = useState('');
    const [organism, setOrganism] = useState<Organism>(ORGANISMS[0]);
    const [mhcClass, setMhcClass] = useState<'I' | 'II'>('I');
    const [lengths, setLengths] = useState<string[]>(['9']);
    const [allAlleles, setAllAlleles] = useState<string[]>([]);
    const [selectedAlleles, setSelectedAlleles] = useState<string[]>([]);
    const [alleleQuery, setAlleleQuery] = useState('');
    const [showAlleleList, setShowAlleleList] = useState(false);
    const [loadingAlleles, setLoadingAlleles] = useState(false);
    const [strongThreshold, setStrongThreshold] = useState(0.5);
    const [weakThreshold, setWeakThreshold] = useState(2.0);
    const alleleRef = useRef<HTMLDivElement>(null);

    const isClassI = mhcClass === 'I';
    const accent = isClassI ? '#60a5fa' : '#fb7185';
    const accentSolid = isClassI ? '#1d4ed8' : '#be123c';

    useEffect(() => {
        if (mhcClass === 'I') {
            setStrongThreshold(0.5); setWeakThreshold(2.0);
            if (!lengths.some(l => ['8', '9', '10', '11', '12'].includes(l))) setLengths(['9']);
            if (onClassChange) onClassChange('I');
        } else {
            setStrongThreshold(1.0); setWeakThreshold(5.0);
            if (!lengths.some(l => ['13', '14', '15', '16', '17'].includes(l))) setLengths(['15']);
            if (onClassChange) onClassChange('II');
        }
        setSelectedAlleles([]);
        setAllAlleles([]);
        fetchAlleles();
    }, [mhcClass]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => { if (alleleRef.current && !alleleRef.current.contains(e.target as Node)) setShowAlleleList(false); };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const fetchAlleles = async () => {
        setLoadingAlleles(true);
        try { 
            const res = await axios.get(`${API_BASE}/alleles`, { params: { mhcClass } }); 
            if (Array.isArray(res.data)) {
                setAllAlleles(res.data); 
            } else {
                console.error("Alleles response is not an array:", res.data);
            }
        }
        catch (err) { console.error("Failed to fetch alleles", err); }
        finally { setLoadingAlleles(false); }
    };

    const filteredAlleles = useMemo(() => {
        const query = alleleQuery.toLowerCase().replace(/[^a-z0-9]/g, '');
        return allAlleles.filter(a => {
            const matchesPrefix = organism.prefixes.some(p => a.toUpperCase().startsWith(p.toUpperCase()));
            if (!matchesPrefix) return false;
            
            if (!query) return true;
            
            const normalizedAllele = a.toLowerCase().replace(/[^a-z0-9]/g, '');
            return normalizedAllele.includes(query);
        }).slice(0, 120);
    }, [allAlleles, organism, alleleQuery]);

    const handleAutoDetect = async () => {
        if (/^[ATCGN\s]+$/i.test(sequence.trim())) {
            try { const res = await axios.post(`${API_BASE}/translate`, { sequence }); setSequence(res.data.translated); }
            catch (e) { console.error(e); }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onRun({ sequenceName, sequence: sequence.toUpperCase().replace(/\s/g, ''), mhcClass, organism: organism.id, lengths: lengths.join(','), alleles: selectedAlleles, strongThreshold, weakThreshold });
    };

    const toggleLength = (len: string) => setLengths(prev => prev.includes(len) ? (prev.length > 1 ? prev.filter(l => l !== len) : prev) : [...prev, len]);
    const toggleAllele = (a: string) => setSelectedAlleles(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
    const canSubmit = !loading && selectedAlleles.length > 0 && sequence.trim().length > 0;

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {(['I', 'II'] as const).map(cls => {
                    const active = mhcClass === cls;
                    const ca = cls === 'I' ? '#60a5fa' : '#fb7185';
                    const cs = cls === 'I' ? '#1d4ed8' : '#be123c';
                    const Icon = cls === 'I' ? Cpu : Zap;
                    return (
                        <motion.button key={cls} type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setMhcClass(cls)}
                            style={{ position: 'relative', overflow: 'hidden', padding: '1.5rem 1rem', borderRadius: '18px', border: `2px solid ${active ? ca : 'rgba(148,163,184,0.1)'}`, background: active ? `linear-gradient(135deg, ${cs}dd, ${cs}99)` : 'rgba(10,18,38,0.9)', color: active ? 'white' : '#475569', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', boxShadow: active ? `0 0 28px ${ca}45` : 'none', transition: 'all 0.35s ease' }}>
                            {active && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(255,255,255,0.12),transparent)', pointerEvents: 'none' }} />}
                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? 'rgba(255,255,255,0.2)' : `${ca}18`, border: `1px solid ${ca}30` }}>
                                <Icon size={20} style={{ color: active ? 'white' : ca }} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' as const, opacity: 0.7, marginBottom: '0.2rem' }}>Protein Type</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.02em' }}>MHC Class {cls}</div>
                            </div>
                            {active && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', background: 'rgba(255,255,255,0.85)', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Check size={12} style={{ color: cs }} />
                                </motion.div>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            <SectionCard accent={accent}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: `${accent}20`, border: `1px solid ${accent}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={13} style={{ color: accent }} />
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#e2e8f0' }}>Sequence Configuration</span>
                    </div>
                    <button type="button" onClick={handleAutoDetect} style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.05em', padding: '0.35rem 0.85rem', borderRadius: '7px', background: `${accent}15`, border: `1px solid ${accent}35`, color: accent, cursor: 'pointer' }}>
                        DETECT &amp; TRANSLATE DNA
                    </button>
                </div>
                <input
                    type="text"
                    value={sequenceName}
                    onChange={e => setSequenceName(e.target.value)}
                    placeholder="Sequence Name (optional)"
                    style={{
                        width: '100%', padding: '0.75rem', borderRadius: '8px',
                        background: 'rgba(5,11,24,0.6)', color: '#cbd5e1',
                        border: `1px solid ${accent}30`, outline: 'none', marginBottom: '1rem',
                        fontSize: '0.85rem', boxSizing: 'border-box'
                    }}
                />
                <textarea value={sequence} onChange={e => setSequence(e.target.value)} required placeholder="Enter amino acid or DNA sequence…"
                    style={{ width: '100%', minHeight: '110px', borderRadius: '10px', padding: '0.85rem', fontSize: '0.85rem', fontFamily: 'monospace', resize: 'vertical', background: 'rgba(5,11,24,0.85)', color: '#cbd5e1', border: `1px solid ${accent}30`, outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                    onFocus={e => e.currentTarget.style.borderColor = accent}
                    onBlur={e => e.currentTarget.style.borderColor = `${accent}30`} />
            </SectionCard>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <SectionCard accent={accent}>
                    <Label>Target Peptide Lengths</Label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                        {(isClassI ? ['8', '9', '10', '11', '12'] : ['13', '14', '15', '16', '17']).map(l => {
                            const sel = lengths.includes(l);
                            return (
                                <motion.button key={l} type="button" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={() => toggleLength(l)}
                                    style={{ width: '48px', height: '48px', borderRadius: '11px', border: `2px solid ${sel ? accent : 'rgba(148,163,184,0.12)'}`, background: sel ? `linear-gradient(135deg, ${accentSolid}cc, ${accentSolid}88)` : 'rgba(10,18,38,0.9)', color: sel ? 'white' : '#4b5563', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px', boxShadow: sel ? `0 0 14px ${accent}45` : 'none', transition: 'all 0.2s ease' }}>
                                    <span>{l}</span>
                                    {sel && <span style={{ fontSize: '0.48rem', opacity: 0.8 }}>MER</span>}
                                </motion.button>
                            );
                        })}
                    </div>
                </SectionCard>
                <SectionCard accent={accent}>
                    <Label>Organism Source</Label>
                    <div style={{ position: 'relative' }}>
                        <select value={organism.id} onChange={e => { const f = ORGANISMS.find(o => o.id === e.target.value); if (f) setOrganism(f); }}
                            style={{ width: '100%', padding: '0.7rem 2.2rem 0.7rem 0.85rem', borderRadius: '9px', background: 'rgba(5,11,24,0.85)', color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 600, border: `1px solid ${accent}30`, outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                            {ORGANISMS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                        <ChevronDown size={14} style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
                    </div>
                </SectionCard>
            </div>

            <SectionCard accent={accent}>
                <Label>Target Alleles Selection</Label>
                <div ref={alleleRef} style={{ position: 'relative', marginBottom: '0.75rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
                        <input type="text" value={alleleQuery}
                            onChange={e => { setAlleleQuery(e.target.value); setShowAlleleList(true); }}
                            onFocus={() => setShowAlleleList(true)}
                            placeholder={`Search ${isClassI ? 'HLA-A02:01' : 'DRB1*01:01'} or click to browse all…`}
                            style={{ width: '100%', padding: '0.7rem 0.8rem 0.7rem 2.35rem', borderRadius: '9px', background: 'rgba(5,11,24,0.85)', color: '#cbd5e1', fontSize: '0.82rem', border: `1px solid ${showAlleleList ? accent : accent + '30'}`, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }} />
                    </div>
                    <AnimatePresence>
                        {showAlleleList && (
                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                style={{ position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0, background: 'rgba(6,12,28,0.98)', border: `1px solid ${accent}40`, borderRadius: '12px', zIndex: 100, maxHeight: '280px', overflowY: 'auto', overflowX: 'hidden', backdropFilter: 'blur(20px)', boxShadow: `0 20px 50px rgba(0,0,0,0.6)` }}
                                className="no-scrollbar">
                                <div style={{ padding: '0.4rem' }}>
                                    {loadingAlleles ? (
                                        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: accent, animation: 'spin 0.8s linear infinite', margin: '0 auto 0.5rem' }} />
                                            Retrieving allele database…
                                        </div>
                                    ) : filteredAlleles.length > 0 ? (
                                        filteredAlleles.map(a => {
                                            const sel = selectedAlleles.includes(a);
                                            return (
                                                <button key={a} type="button"
                                                    onMouseDown={(e) => { 
                                                        e.preventDefault(); // Keep focus on input
                                                        toggleAllele(a); 
                                                    }}
                                                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', textAlign: 'left', background: sel ? `${accent}25` : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s ease', margin: '1px 0' }}
                                                    onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = `${accent}12`; }}
                                                    onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: sel ? 700 : 500, color: sel ? accent : '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '0.5rem' }} title={a}>
                                                        {a}
                                                    </span>
                                                    {sel && (
                                                        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
                                                            <Check size={14} style={{ color: accent, flexShrink: 0 }} />
                                                        </motion.div>
                                                    )}
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                                            {allAlleles.length === 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    <span style={{ color: '#fb7185' }}>Failed to load alleles.</span>
                                                    <span style={{ fontSize: '0.75rem' }}>Check if backend server is running on port 3001.</span>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                    <span>No matching alleles found.</span>
                                                    <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>Try removing special characters or checking the organism.</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {!loadingAlleles && filteredAlleles.length > 0 && (
                                    <div style={{ padding: '0.6rem 0.85rem', borderTop: `1px solid rgba(148,163,184,0.1)`, fontSize: '0.7rem', color: '#475569', fontWeight: 600, background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>
                                            {filteredAlleles.length >= 120 ? 'Showing first 120 matches' : `${filteredAlleles.length} alleles available`}
                                        </span>
                                        <button 
                                            type="button" 
                                            onClick={() => setShowAlleleList(false)}
                                            style={{ color: accent, background: 'none', border: 'none', fontWeight: 800, cursor: 'pointer', padding: '2px 6px' }}
                                        >
                                            DONE
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                {selectedAlleles.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {selectedAlleles.map(a => (
                            <motion.div key={a} initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.35rem 0.25rem 0.7rem', background: `${accent}18`, border: `1px solid ${accent}35`, borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, color: accent }}>
                                {a}
                                <button type="button" onClick={() => toggleAllele(a)} style={{ background: `${accent}25`, border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: accent }}>
                                    <X size={9} />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div style={{ fontSize: '0.72rem', color: '#1e293b', fontStyle: 'italic' }}>No alleles selected — click search field to browse</div>
                )}
            </SectionCard>

            <SectionCard accent={accent}>
                <Label>Binder % Rank Thresholds</Label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    {[
                        { label: 'Strong Binder (%Rank ≤)', value: strongThreshold, min: 0.1, max: 2, step: 0.1, color: '#f43f5e', setter: setStrongThreshold },
                        { label: 'Weak Binder (%Rank ≤)', value: weakThreshold, min: 0.5, max: 10, step: 0.5, color: '#f59e0b', setter: setWeakThreshold },
                    ].map(({ label, value, min, max, step, color, setter }) => (
                        <div key={label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                <span style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 600 }}>{label}</span>
                                <span style={{ fontSize: '0.88rem', fontWeight: 900, color }}>{value.toFixed(1)}%</span>
                            </div>
                            <input type="range" min={min} max={max} step={step} value={value}
                                onChange={e => setter(parseFloat(e.target.value))}
                                style={{ width: '100%', accentColor: color, cursor: 'pointer' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.15rem' }}>
                                <span style={{ fontSize: '0.58rem', color: '#1e293b' }}>{min}%</span>
                                <span style={{ fontSize: '0.58rem', color: '#1e293b' }}>{max}%</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: '0.7rem', padding: '0.55rem 0.8rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '0.7rem', color: '#475569', lineHeight: 1.5 }}>
                    Strong: %Rank ≤ <strong style={{ color: '#f43f5e' }}>{strongThreshold.toFixed(1)}%</strong> &nbsp;·&nbsp; Weak: %Rank ≤ <strong style={{ color: '#f59e0b' }}>{weakThreshold.toFixed(1)}%</strong>
                </div>
            </SectionCard>

            <motion.button type="submit" disabled={!canSubmit} whileHover={canSubmit ? { scale: 1.01 } : {}} whileTap={canSubmit ? { scale: 0.98 } : {}}
                style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.04em', textTransform: 'uppercase' as const, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', cursor: canSubmit ? 'pointer' : 'not-allowed', border: 'none', background: canSubmit ? `linear-gradient(135deg, ${accentSolid}, ${isClassI ? '#7c3aed' : '#9f1239'})` : 'rgba(15,23,42,0.7)', color: canSubmit ? 'white' : '#1e293b', boxShadow: canSubmit ? `0 0 28px ${accent}35` : 'none', transition: 'all 0.3s ease' }}>
                {loading ? (
                    <><div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />Analyzing via DTU NetMHCpan (Expect 30-90s)…</>
                ) : (
                    <><MousePointer2 size={16} />Execute Predictive Analysis</>
                )}
            </motion.button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </form>
    );
}
