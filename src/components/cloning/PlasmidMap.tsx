"use client";

import React, { useMemo } from "react";
import { Annotation } from "./useSequenceStore";

interface PlasmidMapProps {
  sequenceLength: number;
  annotations: Annotation[];
  name: string;
  circular?: boolean;
}

export default function PlasmidMap({
  sequenceLength,
  annotations,
  name,
  circular = false
}: PlasmidMapProps) {
  const size = 300;
  const center = size / 2;
  const radius = 100;
  const strokeWidth = 10;

  // Conversion from base pair index to coordinates
  const bpToAngle = (bp: number) => (bp / sequenceLength) * 2 * Math.PI - Math.PI / 2;
  const bpToX = (bp: number) => (bp / sequenceLength) * (size - 60) + 30;

  const annotationElements = useMemo(() => {
    return annotations.map((ann) => {
      if (circular) {
        const startAngle = bpToAngle(ann.start);
        const endAngle = bpToAngle(ann.end);
        const x1 = center + radius * Math.cos(startAngle);
        const y1 = center + radius * Math.sin(startAngle);
        const x2 = center + radius * Math.cos(endAngle);
        const y2 = center + radius * Math.sin(endAngle);
        const largeArcFlag = ann.end - ann.start > sequenceLength / 2 ? "1" : "0";
        return (
          <path
            key={ann.id}
            d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`}
            fill="none"
            stroke={ann.color}
            strokeWidth={strokeWidth + 2}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 5px ${ann.color}33)` }}
          />
        );
      } else {
        const x1 = bpToX(ann.start);
        const x2 = bpToX(ann.end);
        return (
          <line
            key={ann.id}
            x1={x1}
            y1={center}
            x2={x2}
            y2={center}
            stroke={ann.color}
            strokeWidth={strokeWidth + 4}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 5px ${ann.color}33)` }}
          />
        );
      }
    });
  }, [annotations, sequenceLength, radius, center, circular]);

  return (
    <div className="flex flex-col items-center bg-slate-900/40 p-6 rounded-3xl border border-slate-800">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
        {circular ? 'Circular Map' : 'Linear Map'}
      </div>
      
      <svg width={size} height={circular ? size : 120} viewBox={`0 0 ${size} ${circular ? size : 120}`}>
        {circular ? (
          <>
            {/* Background Ring */}
            <circle 
              cx={center} cy={center} r={radius} 
              fill="none" stroke="rgba(148, 163, 184, 0.1)" strokeWidth={strokeWidth} 
            />
            {annotationElements}
            {/* Center Labels */}
            <text x={center} y={center - 5} textAnchor="middle" fill="white" style={{ fontSize: "14px", fontWeight: "bold", fontFamily: "Space Grotesk, sans-serif" }}>{name}</text>
            <text x={center} y={center + 15} textAnchor="middle" fill="#64748b" style={{ fontSize: "10px", fontWeight: "bold", fontFamily: "monospace" }}>{sequenceLength.toLocaleString()} BP</text>
          </>
        ) : (
          <>
            {/* Background Line */}
            <line 
              x1={30} y1={center} x2={size - 30} y2={center} 
              stroke="rgba(148, 163, 184, 0.1)" strokeWidth={strokeWidth} strokeLinecap="round"
            />
            {annotationElements}
            {/* Labels */}
            <text x={center} y={center - 25} textAnchor="middle" fill="white" style={{ fontSize: "14px", fontWeight: "bold", fontFamily: "Space Grotesk, sans-serif" }}>{name}</text>
            <text x={center} y={center + 25} textAnchor="middle" fill="#64748b" style={{ fontSize: "10px", fontWeight: "bold", fontFamily: "monospace" }}>{sequenceLength.toLocaleString()} BP</text>
            <text x={30} y={center + 25} textAnchor="start" fill="#475569" style={{ fontSize: "8px" }}>0</text>
            <text x={size - 30} y={center + 25} textAnchor="end" fill="#475569" style={{ fontSize: "8px" }}>{sequenceLength}</text>
          </>
        )}
      </svg>
      
      <div className="w-full mt-6 space-y-2">
        <div className="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-800 pb-1">
          <span>TOPOLOGY</span>
          <span className="text-cyan-400 font-bold">{circular ? 'CIRCULAR' : 'LINEAR'}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-800 pb-1">
          <span>FEATURES</span>
          <span className="text-white font-bold">{annotations.length}</span>
        </div>
      </div>
    </div>
  );
}
