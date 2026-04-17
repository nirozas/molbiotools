"use client";

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileJson, Table, Layers, Zap, Filter, ZoomIn, ZoomOut, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';

interface Peptide { sequence: string; start_position: number; end_position: number; affinity_score: string; rank: number; binder_level: string; allele: string; }
interface MHCVisualizerProps { data: { original_sequence: string; peptides: Peptide[]; }; currentClass: 'I' | 'II'; meta?: any; }

const AA_COLORS: Record<string, { bg: string, text: string }> = {
    'D': { bg: '#E60A0A', text: '#FFFFFF' }, 'E': { bg: '#E60A0A', text: '#FFFFFF' },
    'R': { bg: '#145AFF', text: '#FFFFFF' }, 'K': { bg: '#145AFF', text: '#FFFFFF' },
    'S': { bg: '#FA9600', text: '#000000' }, 'T': { bg: '#FA9600', text: '#000000' },
    'N': { bg: '#00DCDC', text: '#000000' }, 'Q': { bg: '#00DCDC', text: '#000000' },
    'C': { bg: '#E6E600', text: '#000000' }, 'M': { bg: '#E6E600', text: '#000000' },
    'G': { bg: '#EBEBEB', text: '#000000' }, 'P': { bg: '#C8C8C8', text: '#000000' },
    'A': { bg: '#0F820F', text: '#FFFFFF' }, 'V': { bg: '#0F820F', text: '#FFFFFF' },
    'I': { bg: '#0F820F', text: '#FFFFFF' }, 'L': { bg: '#0F820F', text: '#FFFFFF' },
    'F': { bg: '#3232AA', text: '#FFFFFF' }, 'Y': { bg: '#3232AA', text: '#FFFFFF' },
    'W': { bg: '#3232AA', text: '#FFFFFF' }, 'H': { bg: '#8282D2', text: '#000000' },
};
const getAAColor = (aa: string) => AA_COLORS[aa.toUpperCase()] || { bg: '#808080', text: '#FFFFFF' };

const BASE_CHAR_WIDTH = 24;
const TRACK_HEIGHT = 20;

export default function MHCVisualizer({ data, currentClass, meta }: MHCVisualizerProps) {
    const { original_sequence, peptides } = data;
    const [hoveredPeptide, setHoveredPeptide] = useState<Peptide | null>(null);
    const [selectedAlleleFilter, setSelectedAlleleFilter] = useState<string>('All');
    const [zoomLevel, setZoomLevel] = useState<number>(1);
    const [showExportLabels, setShowExportLabels] = useState<boolean>(false);
    const exportRef = useRef<HTMLDivElement>(null);

    const allelesPresent: string[] = [...new Set(peptides.map((p: Peptide) => p.allele))];

    const alleleTracks = useMemo(() => {
        const tracks: Record<string, { layers: Peptide[][] }> = {};
        const allelesToProcess = selectedAlleleFilter === 'All' ? allelesPresent : [selectedAlleleFilter];
        
        allelesToProcess.forEach(a => {
            const alleleHits = peptides.filter(p => p.allele === a).sort((x, y) => x.start_position - y.start_position);
            const layers: Peptide[][] = [];
            alleleHits.forEach(pep => {
                let placed = false;
                for (const layer of layers) {
                    const lastPep = layer[layer.length - 1];
                    // If we show large export labels, we need more horizontal gap to prevent text overlap,
                    // or we rely on the layers. We add 3 to require gap between peptides of same layer.
                    if (pep.start_position > lastPep.end_position + (showExportLabels ? 2 : 1)) {
                        layer.push(pep); placed = true; break;
                    }
                }
                if (!placed) layers.push([pep]);
            });
            tracks[a] = { layers };
        });
        return tracks;
    }, [peptides, allelesPresent, selectedAlleleFilter, showExportLabels]);

    const binderCounts = {
        strong: peptides.filter(p => p.binder_level === 'Strong' && (selectedAlleleFilter === 'All' || p.allele === selectedAlleleFilter)).length,
        weak: peptides.filter(p => p.binder_level === 'Weak' && (selectedAlleleFilter === 'All' || p.allele === selectedAlleleFilter)).length
    };

    const downloadCSV = () => {
        const headers = ["Allele", "Sequence", "Start", "End", "Rank", "Score", "Level"];
        const rows = peptides.filter(p => selectedAlleleFilter === 'All' || p.allele === selectedAlleleFilter).map(p => [p.allele, p.sequence, p.start_position, p.end_position, p.rank, p.affinity_score, p.binder_level]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "mhc_predictions.csv";
        link.click();
    };

    const exportAsImage = async () => {
        if (!exportRef.current) return;
        const originalZoom = zoomLevel;
        setZoomLevel(1); // Standardize zoom for clean crisp export

        // Wait a tick for React to render un-zoomed
        setTimeout(async () => {
            try {
                const canvas = await html2canvas(exportRef.current!, { backgroundColor: '#0f172a', scale: 2 });
                const link = document.createElement('a');
                link.download = 'mhc_mapping_export.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            } catch (err) { console.error('Failed to export image', err); }
            setZoomLevel(originalZoom); // Restore
        }, 100);
    };

    const themeColor = currentClass === 'I' ? '#2563eb' : '#e11d48';
    const CHAR_WIDTH = BASE_CHAR_WIDTH * zoomLevel;
    const layerSpacing = showExportLabels ? 80 : 4; // Massively expand spacing for labels

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem', fontFamily:'sans-serif' }}>
            <div style={{ display:'flex', gap:'1.5rem', alignItems:'stretch' }}>
                <div style={{ background:'rgba(15,23,42,0.6)', border:`1px solid ${themeColor}30`, borderRadius:'16px', padding:'1.5rem', flex:'1.5', display:'flex', flexDirection:'column', justifyContent:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.75rem' }}>
                        <Filter size={16} color={themeColor} />
                        <span style={{ fontSize:'0.75rem', fontWeight:800, color:'#94a3b8', letterSpacing:'0.1em', textTransform:'uppercase' }}>Filter by Allele</span>
                    </div>
                    <select value={selectedAlleleFilter} onChange={(e) => setSelectedAlleleFilter(e.target.value)}
                        style={{ width:'100%', padding:'0.75rem', borderRadius:'8px', background:'rgba(5,11,24,0.8)', color:'white', border:`1px solid ${themeColor}50`, outline:'none', cursor:'pointer' }}>
                        <option value="All">All Alleles ({allelesPresent.length})</option>
                        {allelesPresent.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
                
                <div style={{ background:'rgba(15,23,42,0.6)', border:`1px solid ${themeColor}30`, borderRadius:'16px', padding:'1.5rem', flex:'1', display:'flex', flexDirection:'column', justifyContent:'center' }}>
                    <div style={{ fontSize:'0.75rem', fontWeight:800, color:'#94a3b8', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'0.75rem' }}>Zoom Controls</div>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                        <button onClick={() => setZoomLevel(Math.max(0.2, zoomLevel - 0.2))} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'white', padding:'0.5rem', borderRadius:'6px', cursor:'pointer' }}><ZoomOut size={16}/></button>
                        <span style={{ color:'white', fontSize:'0.8rem', fontWeight:800, minWidth:'40px', textAlign:'center' }}>{Math.round(zoomLevel*100)}%</span>
                        <button onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.2))} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'white', padding:'0.5rem', borderRadius:'6px', cursor:'pointer' }}><ZoomIn size={16}/></button>
                    </div>
                </div>

                <div style={{ display:'flex', gap:'1.5rem', flex:'2' }}>
                    {[
                        { label: 'Strong Binders', val: binderCounts.strong, col: '#f472b6' }, 
                        { label: 'Weak Binders', val: binderCounts.weak, col: '#86efac' }
                    ].map((s,i) => (
                        <div key={i} style={{ background:'rgba(15,23,42,0.6)', border:`1px solid ${s.col}30`, borderRadius:'16px', padding:'1.5rem', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1 }}>
                            <div style={{ fontSize:'2.5rem', fontWeight:900, color:s.col, lineHeight:1 }}>{s.val}</div>
                            <div style={{ fontSize:'0.75rem', fontWeight:800, color:'#94a3b8', letterSpacing:'0.1em', textTransform:'uppercase', marginTop:'0.5rem' }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ background:'rgba(15,23,42,0.8)', border:`1px solid ${themeColor}40`, borderRadius:'24px' }}>
                <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
                    <div style={{ fontSize:'0.85rem', fontWeight:800, color:'#e2e8f0', letterSpacing:'0.05em', textTransform:'uppercase', display:'flex', gap:'1.5rem', alignItems:'center' }}>
                        <span>Protein Layout Mapping</span>
                        <div style={{ display:'flex', gap:'1rem' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}><div style={{ width:'12px', height:'12px', background:'#f472b6', borderRadius:'3px' }}/> <span style={{fontSize:'0.7rem', color:'#94a3b8'}}>Strong Binder</span></div>
                            <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}><div style={{ width:'12px', height:'12px', background:'#86efac', borderRadius:'3px' }}/> <span style={{fontSize:'0.7rem', color:'#94a3b8'}}>Weak Binder</span></div>
                        </div>
                    </div>
                    <div style={{ display:'flex', gap:'0.75rem' }}>
                        <button onClick={() => setShowExportLabels(!showExportLabels)} style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:showExportLabels?`${themeColor}33`:'transparent', border:`1px solid ${themeColor}50`, color:showExportLabels?'#fff':themeColor, padding:'0.4rem 1rem', borderRadius:'8px', cursor:'pointer', fontSize:'0.75rem', fontWeight:700 }}>
                            <Layers size={14} /> TAG LABELS: {showExportLabels ? 'ON' : 'OFF'}
                        </button>
                        <button onClick={exportAsImage} style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'transparent', border:`1px solid ${themeColor}50`, color:themeColor, padding:'0.4rem 1rem', borderRadius:'8px', cursor:'pointer', fontSize:'0.75rem', fontWeight:700 }}>
                            <ImageIcon size={14} /> EXPORT PNG
                        </button>
                        <button onClick={downloadCSV} style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'transparent', border:`1px solid ${themeColor}50`, color:themeColor, padding:'0.4rem 1rem', borderRadius:'8px', cursor:'pointer', fontSize:'0.75rem', fontWeight:700 }}>
                            <Table size={14} /> EXPORT CSV
                        </button>
                    </div>
                </div>

                <div style={{ padding:'1.5rem', overflowX:'auto', paddingTop: '3rem', paddingBottom: '2.5rem' }} className="custom-scroll">
                    <div ref={exportRef} style={{ position:'relative', minWidth:'max-content', background:'rgba(15,23,42,0.8)', padding:'1.5rem', borderRadius:'12px', boxSizing:'border-box' }}>
                        {meta && (
                            <div style={{ paddingBottom: '1.5rem', marginBottom: '1.5rem', borderBottom: `1px solid ${themeColor}30` }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f0f6ff', marginBottom: '0.4rem', letterSpacing: '0.02em' }}>
                                    {meta.sequenceName ? meta.sequenceName : 'Untitled Sequence'}
                                </div>
                                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                                    <span><span style={{ color: '#475569' }}>DATE:</span> {new Date().toLocaleDateString()}</span>
                                    <span><span style={{ color: '#475569' }}>CLASS:</span> MHC-{currentClass}</span>
                                    <span><span style={{ color: '#475569' }}>ORGANISM:</span> {meta.organism}</span>
                                    <span><span style={{ color: '#475569' }}>ALLELES:</span> {meta.alleles?.join(', ')}</span>
                                </div>
                            </div>
                        )}
                        <div style={{ display:'flex', alignItems:'flex-end', gap:0, marginBottom:'1.5rem' }}>
                            <div style={{ width:'120px', flexShrink:0, fontSize:'0.7rem', fontWeight:700, color:'#64748b' }}>Sequence</div>
                            <div style={{ display:'flex', position: 'relative', marginTop:'1rem' }}>
                                {original_sequence.split('').map((_, i) => (
                                    (i + 1) % 10 === 0 && (
                                        <div key={`num-${i}`} style={{ position: 'absolute', top: '-18px', left: `${(i) * CHAR_WIDTH}px`, width: `${CHAR_WIDTH}px`, textAlign: 'center', fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>{i + 1}</div>
                                    )
                                ))}
                                {original_sequence.length > 0 && <div style={{ position: 'absolute', top: '-18px', left: '0px', width: `${CHAR_WIDTH}px`, textAlign: 'center', fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>1</div>}
                                
                                {original_sequence.split('').map((aa, i) => {
                                    const col = getAAColor(aa);
                                    return (
                                        <div key={i} style={{ width:`${CHAR_WIDTH}px`, display:'flex', flexDirection:'column', alignItems:'center' }}>
                                            <div style={{ width:'100%', height:'22px', background:col.bg, color:col.text, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', fontWeight:900, fontFamily:'monospace' }}>
                                                {aa}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
                            {Object.entries(alleleTracks).map(([allele, { layers }]) => (
                                <div key={allele} style={{ display:'flex' }}>
                                    <div style={{ width:'120px', flexShrink:0, fontSize:'0.75rem', fontWeight:800, color:'#e2e8f0', marginTop:'2px' }}>
                                        {allele}
                                    </div>
                                    <div style={{ position:'relative', width: `${original_sequence.length * CHAR_WIDTH}px`, height:`${layers.length * (TRACK_HEIGHT + layerSpacing)}px` }}>
                                        {layers.map((layerPeps, lIdx) => (
                                            layerPeps.map((pep, pIdx) => {
                                                const w = (pep.end_position - pep.start_position + 1) * CHAR_WIDTH;
                                                const x = (pep.start_position - 1) * CHAR_WIDTH;
                                                const bg = pep.binder_level === 'Strong' ? '#f472b6' : '#86efac';
                                                const borderCol = pep.binder_level === 'Strong' ? '#be185d' : '#166534';
                                                const textCol = pep.binder_level === 'Strong' ? '#4c0519' : '#064e3b';
                                                
                                                return (
                                                    <div key={`${lIdx}-${pIdx}`} style={{ position:'absolute', top: `${lIdx * (TRACK_HEIGHT + layerSpacing)}px`, left: `${x}px`, width: `${w}px` }}>
                                                        <div 
                                                            onMouseEnter={() => setHoveredPeptide(pep)}
                                                            onMouseLeave={() => setHoveredPeptide(null)}
                                                            style={{ 
                                                                width: '100%', height: `${TRACK_HEIGHT}px`,
                                                                background: bg, border:`1px solid ${borderCol}`, borderRadius:'3px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex: hoveredPeptide===pep ? 50 : 1, transition:'transform 0.1s', transform: hoveredPeptide===pep && !showExportLabels ? 'scaleY(1.3) scaleX(1.02)' : 'none'
                                                            }}>
                                                            {(w > 30 || showExportLabels) && <span style={{ fontSize:'0.6rem', fontWeight:800, color:textCol }}>{pep.binder_level === 'Strong' ? 'SB' : 'WB'}</span>}
                                                            
                                                            <AnimatePresence>
                                                                {hoveredPeptide === pep && !showExportLabels && (
                                                                    <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:-TRACK_HEIGHT-25 }} exit={{ opacity:0, y:-10 }}
                                                                        style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', background:'rgba(15,23,42,0.98)', border:`1px solid ${bg}`, padding:'0.85rem', borderRadius:'8px', zIndex:100, minWidth:'180px', pointerEvents:'none', boxShadow:'0 10px 40px rgba(0,0,0,0.8)' }}>
                                                                        <div style={{ color:'white', fontSize:'0.9rem', fontWeight:800, letterSpacing:'0.1em' }}>{pep.sequence}</div>
                                                                        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.5rem', fontSize:'0.7rem' }}>
                                                                            <span style={{color:'#94a3b8'}}>Rank</span><span style={{color:bg, fontWeight:700}}>{pep.rank}%</span>
                                                                        </div>
                                                                        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.2rem', fontSize:'0.7rem' }}>
                                                                            <span style={{color:'#94a3b8'}}>Score</span><span style={{color:'white', fontWeight:700}}>{pep.affinity_score}</span>
                                                                        </div>
                                                                        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.2rem', fontSize:'0.7rem' }}>
                                                                            <span style={{color:'#94a3b8'}}>Pos</span><span style={{color:'white', fontWeight:700}}>{pep.start_position} - {pep.end_position}</span>
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>

                                                        {/* Permanent Data Box + Line Dropdown for Image Export Mode */}
                                                        {showExportLabels && (
                                                            <div style={{ position:'absolute', top:`${TRACK_HEIGHT}px`, left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center' }}>
                                                                <svg width="2" height="15" style={{ overflow:'visible' }}>
                                                                    <line x1="1" y1="0" x2="1" y2="15" stroke={bg} strokeWidth="2" />
                                                                </svg>
                                                                <div style={{ background: 'rgba(5,11,24,0.95)', border: `1px solid ${bg}80`, borderRadius: '6px', padding: '0.4rem 0.6rem', textAlign: 'center', minWidth: '90px' }}>
                                                                    <div style={{ color:'white', fontSize:'0.65rem', fontWeight:800, letterSpacing:'0.05em', marginBottom:'2px' }}>{pep.sequence}</div>
                                                                    <div style={{ display:'flex', justifyContent:'space-between', gap:'0.5rem', fontSize:'0.55rem' }}>
                                                                        <span style={{color:'#94a3b8'}}>RNK</span><span style={{color:bg, fontWeight:700}}>{pep.rank}%</span>
                                                                    </div>
                                                                    <div style={{ display:'flex', justifyContent:'space-between', gap:'0.5rem', fontSize:'0.55rem' }}>
                                                                        <span style={{color:'#94a3b8'}}>SCR</span><span style={{color:'white', fontWeight:700}}>{pep.affinity_score}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                .custom-scroll::-webkit-scrollbar { height: 12px; }
                .custom-scroll::-webkit-scrollbar-track { background: rgba(15,23,42,0.5); border-radius: 8px; }
                .custom-scroll::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.3); border-radius: 8px; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(148,163,184,0.5); }
            `}</style>
        </div>
    );
}
