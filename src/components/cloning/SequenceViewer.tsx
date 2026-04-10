"use client";

import React, { useRef, useState, useMemo, useEffect } from "react";
import { Annotation, SelectionRange } from "./useSequenceStore";
import { Scissors } from "lucide-react";

interface SequenceViewerProps {
  sequence: string;
  complement: string;
  annotations: Annotation[];
  showComplement: boolean;
  showAminoAcids: boolean;
  translateRange: (start: number, end: number) => string;
  nucsPerRow?: number;
  searchQuery?: string;
  orfTranslations?: { start: number; end: number; aa: string[] }[];
  AA_COLORS?: Record<string, string>;
}

export default function SequenceViewer({
  sequence,
  complement,
  annotations,
  selection,
  onSelectionChange,
  showComplement,
  showAminoAcids,
  translateRange,
  nucsPerRow = 60,
  searchQuery = "",
  orfTranslations = [],
  AA_COLORS = {}
}: SequenceViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const rowHeight = (showComplement ? 80 : 50) + (showAminoAcids ? 45 : 0);

  const totalRows = Math.ceil(sequence.length / nucsPerRow);

  // Simple intersection observer or scroll listener for virtualization
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollTop = containerRef.current.scrollTop;
      const viewportHeight = containerRef.current.clientHeight;
      
      const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - 2);
      const endRow = Math.min(totalRows, Math.ceil((scrollTop + viewportHeight) / rowHeight) + 2);
      
      setVisibleRange({ start: startRow, end: endRow });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      handleScroll(); // Initial check
    }
    return () => container?.removeEventListener("scroll", handleScroll);
  }, [rowHeight, totalRows]);

  const rows = useMemo(() => {
    const r = [];
    for (let i = visibleRange.start; i < visibleRange.end; i++) {
      const startIdx = i * nucsPerRow;
      const endIdx = Math.min(startIdx + nucsPerRow, sequence.length);
      if (startIdx >= sequence.length) break;
      r.push({ startIdx, endIdx, rowIndex: i });
    }
    return r;
  }, [visibleRange, nucsPerRow, sequence.length]);

  const handleMouseDown = (idx: number) => {
    onSelectionChange({ start: idx, end: idx });
  };

  const handleMouseEnter = (idx: number, e: React.MouseEvent) => {
    if (e.buttons === 1 && selection) {
      onSelectionChange({ ...selection, end: idx });
    }
  };

  const isSelected = (idx: number) => {
    if (!selection) return false;
    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);
    return idx >= start && idx <= end;
  };

  const getAnnotationsForRange = (start: number, end: number) => {
    return annotations.filter(ann => 
      (ann.start <= end && ann.end >= start)
    );
  };

  return (
    <div 
      ref={containerRef}
      style={{ 
        height: "600px", 
        overflowY: "auto", 
        background: "#0f172a", 
        padding: "1rem",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.1)",
        fontFamily: "'Roboto Mono', monospace",
        position: "relative"
      }}
    >
      <div style={{ height: totalRows * rowHeight, position: "relative" }}>
        {rows.map(row => (
          <div 
            key={row.rowIndex}
            style={{ 
              position: "absolute", 
              top: row.rowIndex * rowHeight, 
              width: "100%",
              height: rowHeight,
              display: "flex",
              flexDirection: "column",
              paddingBottom: "10px"
            }}
          >
            {/* Index Label */}
            <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "2px" }}>
              {row.startIdx + 1}
            </div>

            {/* Amino Acid Row (ORF Blocks) */}
            {showAminoAcids && (
              <div style={{ display: "flex", height: "22px", marginBottom: "4px", position: "relative" }}>
                 {orfTranslations.map((orf, orfIdx) => {
                   return orf.aa.map((aa, aaIdx) => {
                      const startIdx = orf.start + (aaIdx * 3);
                      // Handle row wrapping
                      if (startIdx < row.startIdx || startIdx >= row.endIdx) return null;
                      
                      return (
                        <div 
                          key={`${orfIdx}-${aaIdx}`}
                          style={{
                            position: "absolute",
                            left: (startIdx - row.startIdx) * 14, // 12px + 2px gap in DNA row
                            width: "40px", // (12px * 3) + (2px * 2) 
                            height: "22px",
                            background: AA_COLORS[aa] || "#94a3b8",
                            color: "white",
                            fontSize: "12px",
                            fontWeight: "900",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            // More pronounced chevron
                            clipPath: "polygon(0% 0%, 88% 0%, 100% 50%, 88% 100%, 0% 100%)",
                            zIndex: 5,
                            textShadow: "0 1px 2px rgba(0,0,0,0.5)"
                          }}
                        >
                          {aa}
                        </div>
                      );
                   });
                 })}
              </div>
            )}

            {/* Sequence Row */}
            <div style={{ display: "flex", gap: "2px", position: "relative" }}>
              {sequence.slice(row.startIdx, row.endIdx).split("").map((nuc, i) => {
                const globalIdx = row.startIdx + i;
                const activeAnn = annotations.find(a => globalIdx >= a.start && globalIdx <= a.end);
                
                // Search highlighting
                const isSearchMatch = searchQuery && sequence.substring(globalIdx, globalIdx + searchQuery.length) === searchQuery;
                const isInSearchRange = searchQuery && Array.from({length: searchQuery.length}).some((_, offset) => {
                  const checkIdx = globalIdx - offset;
                  return checkIdx >= 0 && sequence.substring(checkIdx, checkIdx + searchQuery.length) === searchQuery;
                });

                return (
                  <div 
                    key={i}
                    onMouseDown={() => handleMouseDown(globalIdx)}
                    onMouseEnter={(e) => handleMouseEnter(globalIdx, e)}
                    style={{ 
                      width: "12px", 
                      textAlign: "center",
                      cursor: "text",
                      userSelect: "none",
                      position: "relative",
                      zIndex: 2,
                      background: isInSearchRange ? "rgba(250, 204, 21, 0.4)" : "transparent",
                      borderRadius: isInSearchRange ? "2px" : "0"
                    }}
                  >
                    <span style={{ 
                      color: nuc === 'A' ? '#f43f5e' : nuc === 'T' ? '#00d4ff' : nuc === 'G' ? '#f59e0b' : '#10b981',
                      fontWeight: 700,
                      background: isSelected(globalIdx) ? "rgba(0, 212, 255, 0.3)" : "transparent",
                      borderRadius: "2px",
                      padding: "0 1px"
                    }}>
                      {nuc}
                    </span>
                    
                    {showComplement && (
                      <div style={{ fontSize: "10px", color: "rgba(148,163,184,0.5)" }}>
                        {complement[globalIdx]}
                      </div>
                    )}

                    {/* Annotation Highlight (Directional Arrows) */}
                    {activeAnn && (
                      <div 
                        title={`${activeAnn.label} (${activeAnn.type})`}
                        style={{
                          position: "absolute",
                          bottom: "-6px",
                          left: 0,
                          right: 0,
                          height: "10px",
                          background: activeAnn.color,
                          opacity: 0.8,
                          zIndex: 1,
                          cursor: "help",
                          // Chevron shape based on strand
                          clipPath: activeAnn.strand === "+" 
                            ? (globalIdx === activeAnn.end ? "polygon(0% 0%, 70% 0%, 100% 50%, 70% 100%, 0% 100%)" : "none")
                            : (activeAnn.strand === "-" 
                                ? (globalIdx === activeAnn.start ? "polygon(30% 0%, 100% 0%, 100% 100%, 30% 100%, 0% 50%)" : "none")
                                : "none"
                              ),
                          // Connection logic for continuous blocks
                          marginLeft: globalIdx === activeAnn.start ? "0" : "-1px",
                          marginRight: globalIdx === activeAnn.end ? "0" : "-1px",
                          borderTopRightRadius: (activeAnn.strand === "+" && globalIdx === activeAnn.end) ? "4px" : "0",
                          borderBottomRightRadius: (activeAnn.strand === "+" && globalIdx === activeAnn.end) ? "4px" : "0",
                          borderTopLeftRadius: (activeAnn.strand === "-" && globalIdx === activeAnn.start) ? "4px" : "0",
                          borderBottomLeftRadius: (activeAnn.strand === "-" && globalIdx === activeAnn.start) ? "4px" : "0",
                        }} 
                      />
                    )}
                  </div>
                );
              })}

              {/* Annotation Labels for this row */}
              <div style={{ 
                position: "absolute", 
                top: "100%", 
                left: 0, 
                display: "flex", 
                gap: "8px",
                paddingTop: "6px",
                pointerEvents: "none"
              }}>
                {getAnnotationsForRange(row.startIdx, row.endIdx).map(ann => {
                  // Only show label once per row if the annotation spans multiple rows
                  const isFirstInRow = ann.start >= row.startIdx || row.rowIndex === Math.floor(ann.start / nucsPerRow);
                  if (!isFirstInRow) return null;

                  return (
                    <div 
                      key={ann.id}
                      style={{ 
                        fontSize: "9px", 
                        color: "white", 
                        fontWeight: 800,
                        background: ann.color,
                        padding: "1px 6px",
                        borderRadius: "4px",
                        whiteSpace: "nowrap",
                        boxShadow: `0 2px 4px rgba(0,0,0,0.2)`,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      {ann.type === 'restriction' && <Scissors size={8} />}
                      {ann.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
