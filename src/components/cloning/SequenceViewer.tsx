"use client";

import React, { useRef, useState, useMemo, useEffect } from "react";
import { Annotation, SelectionRange } from "./useSequenceStore";

interface SequenceViewerProps {
  sequence: string;
  complement: string;
  annotations: Annotation[];
  selection: SelectionRange | null;
  onSelectionChange: (sel: SelectionRange | null) => void;
  showComplement: boolean;
  nucsPerRow?: number;
}

export default function SequenceViewer({
  sequence,
  complement,
  annotations,
  selection,
  onSelectionChange,
  showComplement,
  nucsPerRow = 60
}: SequenceViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const rowHeight = showComplement ? 80 : 50;

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

            {/* Sequence Row */}
            <div style={{ display: "flex", gap: "2px", position: "relative" }}>
              {sequence.slice(row.startIdx, row.endIdx).split("").map((nuc, i) => {
                const globalIdx = row.startIdx + i;
                const activeAnn = annotations.find(a => globalIdx >= a.start && globalIdx <= a.end);
                
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
                      zIndex: 2
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

                    {/* Annotation Highlight */}
                    {activeAnn && (
                      <div style={{
                        position: "absolute",
                        bottom: "-4px",
                        left: 0,
                        right: 0,
                        height: "3px",
                        background: activeAnn.color,
                        borderRadius: "1px",
                        opacity: 0.6
                      }} />
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
                gap: "10px",
                paddingTop: "4px"
              }}>
                {getAnnotationsForRange(row.startIdx, row.endIdx).map(ann => (
                  <div 
                    key={ann.id}
                    style={{ 
                      fontSize: "9px", 
                      color: ann.color, 
                      fontWeight: 700,
                      background: `${ann.color}22`,
                      padding: "0 4px",
                      borderRadius: "4px",
                      border: `1px solid ${ann.color}44`,
                      whiteSpace: "nowrap"
                    }}
                  >
                    {ann.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
