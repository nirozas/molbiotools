"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Upload,
  Plus,
  Trash2,
  RefreshCw,
  Info,
  Download,
  ClipboardPaste,
  ChevronLeft,
  Camera
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import * as XLSX from "xlsx";
import Link from "next/link";
import { toPng } from 'html-to-image';
import { 
  SurvivalDataRow, 
  calculateKaplanMeier, 
  calculateLogRankTest 
} from "@/components/kaplan-meier/SurvivalLogic";

// Distinct colors for up to 10 groups
const GROUP_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
  "#6366f1", // indigo
];

function getGroupColor(index: number) {
  return GROUP_COLORS[index % GROUP_COLORS.length];
}

export default function KaplanMeierPage() {
  const [data, setData] = useState<SurvivalDataRow[]>([]);
  const [groups, setGroups] = useState<string[]>(["Control", "Treatment"]);
  
  // Table state
  const [pastedData, setPastedData] = useState<string>("");
  const [activeRows, setActiveRows] = useState<any[]>(
    Array.from({ length: 10 }).map((_, i) => ({ id: `Subject ${i + 1}`, time: "", status: "", group: i < 5 ? "Control" : "Treatment" }))
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  const handleRowChange = (index: number, field: string, value: string) => {
    const newRows = [...activeRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setActiveRows(newRows);
  };

  const addRow = () => {
    setActiveRows([
      ...activeRows,
      { id: `Subject ${activeRows.length + 1}`, time: "", status: "", group: groups[0] || "" }
    ]);
  };

  const removeRow = (index: number) => {
    const newRows = [...activeRows];
    newRows.splice(index, 1);
    if (newRows.length === 0) {
      newRows.push({ id: "Subject 1", time: "", status: "1", group: "Control" });
    }
    setActiveRows(newRows);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = document.getElementById(`km-input-${rowIndex - 1}-${colIndex}`);
      if (prev) prev.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = document.getElementById(`km-input-${rowIndex + 1}-${colIndex}`);
      if (next) next.focus();
    }
  };

  const handleTablePaste = (e: React.ClipboardEvent<HTMLInputElement>, startRowIndex: number, startColIndex: number) => {
    const paste = e.clipboardData.getData("text");
    if (!paste) return;
    
    const lines = paste.split(/\r?\n/).filter(line => line.trim() !== "");
    // If it's a single value without tabs, just let the normal paste happen
    if (lines.length <= 1 && !paste.includes('\t')) {
      return; 
    }
    
    e.preventDefault();
    
    const newRows = [...activeRows];
    const keys = ["id", "time", "status", "group"];
    
    for (let r = 0; r < lines.length; r++) {
      const cells = lines[r].split('\t');
      const targetRowIndex = startRowIndex + r;
      
      // Expand table if needed
      if (targetRowIndex >= newRows.length) {
        newRows.push({ id: "", time: "", status: "", group: "" });
      }
      
      for (let c = 0; c < cells.length; c++) {
        const targetColIndex = startColIndex + c;
        if (targetColIndex < 4) {
          const val = cells[c].trim();
          if (val) {
             (newRows[targetRowIndex] as any)[keys[targetColIndex]] = val;
          }
        }
      }
    }
    
    setActiveRows(newRows);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    processPastedText(pasted);
  };

  const processPastedText = (text: string) => {
    const rows = text.trim().split("\n").map(r => r.split(/\t|,/));
    const newActiveRows: any[] = [];
    const newGroups = new Set<string>();

    rows.forEach((row, i) => {
      // Skip header if it contains letters in the second column
      if (i === 0 && isNaN(Number(row[1]))) return;

      const id = row[0] || `S${i+1}`;
      const time = row[1] || "";
      const status = row[2] || "";
      const group = row[3] || "Group 1";

      if (group) newGroups.add(group);

      newActiveRows.push({ id, time, status, group });
    });

    if (newActiveRows.length > 0) {
      setActiveRows(newActiveRows);
      if (newGroups.size > 0) {
        setGroups(Array.from(newGroups));
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const json = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      if (json.length > 0) {
        const text = json.map(r => r.join("\t")).join("\n");
        processPastedText(text);
      }
    };
    reader.readAsBinaryString(file);
  };

  const runAnalysis = () => {
    const validData: SurvivalDataRow[] = [];
    const uniqueGroups = new Set<string>();

    activeRows.forEach(row => {
      const time = parseFloat(row.time);
      const status = parseInt(row.status, 10);
      
      if (!isNaN(time) && !isNaN(status) && (status === 0 || status === 1) && row.group) {
        validData.push({ time, status, group: row.group });
        uniqueGroups.add(row.group);
      }
    });

    setData(validData);
    if (uniqueGroups.size > 0) {
      setGroups(Array.from(uniqueGroups).sort());
    }
  };

  // --- Calculations ---

  const { survivalCurves, logRank, chartData, maxTime } = useMemo(() => {
    if (data.length === 0) return { survivalCurves: [], logRank: null, chartData: [], maxTime: 100 };

    const curves = calculateKaplanMeier(data);
    const lr = calculateLogRankTest(data);

    // Merge points for Recharts LineChart
    let allTimes = new Set<number>();
    allTimes.add(0);
    curves.forEach(c => c.points.forEach(p => allTimes.add(p.time)));
    
    const sortedTimes = Array.from(allTimes).sort((a, b) => a - b);
    const maximumTime = sortedTimes[sortedTimes.length - 1];

    const cData = sortedTimes.map(t => {
      const point: any = { time: t };
      curves.forEach(c => {
        // Find the last point <= t
        let lastSurv = 1.0;
        for (let i = 0; i < c.points.length; i++) {
          if (c.points[i].time <= t) lastSurv = c.points[i].survival;
          else break;
        }
        point[c.group] = lastSurv;
      });
      return point;
    });

    return { survivalCurves: curves, logRank: lr, chartData: cData, maxTime: maximumTime };
  }, [data]);

  // Extract censored points for rendering tick marks
  const censoredPoints = useMemo(() => {
    const points: any[] = [];
    survivalCurves.forEach((c, gIdx) => {
      c.points.filter(p => p.censored > 0).forEach(p => {
        points.push({
          time: p.time,
          survival: p.survival,
          group: c.group,
          color: getGroupColor(gIdx)
        });
      });
    });
    return points;
  }, [survivalCurves]);

  const downloadCSV = () => {
    if (survivalCurves.length === 0) return;
    
    let csv = "Group,Time,Survival Probability,At Risk,Events,Censored\n";
    survivalCurves.forEach(curve => {
      curve.points.forEach(p => {
        csv += `${curve.group},${p.time},${p.survival.toFixed(4)},${p.atRisk},${p.events},${p.censored}\n`;
      });
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "survival_analysis_results.csv";
    link.href = url;
    link.click();
  };

  const downloadPlot = async () => {
    const exportContainer = document.getElementById("survival-export-container");
    if (!exportContainer) return;

    try {
      // html-to-image natively handles modern CSS, Tailwind, and Recharts SVGs perfectly.
      const dataUrl = await toPng(exportContainer, {
        backgroundColor: '#0f172a', // Solid slate-900 background
        pixelRatio: 2, // High resolution
        style: {
          // Reset any potential transform/scaling issues during capture
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const link = document.createElement("a");
      link.download = "survival_analysis_full.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export image", err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-[calc(100vh-4rem)] flex flex-col justify-center text-slate-200">
      <div className="w-full space-y-6">
      
        <Link href="/tools/stats" className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 w-fit">
        <ChevronLeft size={16} className="mr-1" /> Back to Experimental Design & Statistics
      </Link>

      <header className="mb-4">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <ActivityIcon />
          Survival Analysis (Kaplan-Meier)
        </h1>
        <p className="text-slate-400 mt-2">
          Plot Kaplan-Meier survival curves and calculate Log-rank (Mantel-Cox) p-values.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Data */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Data Input</h2>
              <div className="flex gap-2">
                <input 
                  type="file" 
                  accept=".csv, .xlsx" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded text-slate-300 transition-colors tooltip"
                  title="Upload Excel/CSV"
                >
                  <Upload size={16} />
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-400 mb-4">
              Columns: Subject ID, Time (e.g. Days), Status (1=Event, 0=Censored), Group
            </div>

            <div className="max-h-96 overflow-y-auto mb-4 border border-slate-700/50 rounded bg-slate-900/50">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-slate-800/80 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 font-medium">ID</th>
                    <th className="px-3 py-2 font-medium">Time</th>
                    <th className="px-3 py-2 font-medium">
                      <div className="flex items-center gap-1">
                        Status
                        <div title="1 (Event): Subject experienced the event (e.g. death or tumor size reached).&#10;0 (Censored): Subject dropped out early, or survived until the study ended.">
                          <Info size={14} className="text-slate-400 cursor-help hover:text-blue-400 transition-colors" />
                        </div>
                      </div>
                    </th>
                    <th className="px-3 py-2 font-medium">Group</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {activeRows.map((row, i) => (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="p-1">
                        <input
                          id={`km-input-${i}-0`}
                          type="text"
                          value={row.id}
                          onChange={(e) => handleRowChange(i, "id", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, i, 0)}
                          onPaste={(e) => handleTablePaste(e, i, 0)}
                          className="w-full bg-transparent border-none text-slate-300 px-2 py-1 focus:ring-1 focus:ring-blue-500 rounded"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          id={`km-input-${i}-1`}
                          type="number"
                          value={row.time}
                          onChange={(e) => handleRowChange(i, "time", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, i, 1)}
                          onPaste={(e) => handleTablePaste(e, i, 1)}
                          className="w-full bg-transparent border-none text-slate-300 px-2 py-1 focus:ring-1 focus:ring-blue-500 rounded"
                          placeholder="e.g. 14"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          id={`km-input-${i}-2`}
                          type="number"
                          value={row.status}
                          onChange={(e) => handleRowChange(i, "status", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, i, 2)}
                          onPaste={(e) => handleTablePaste(e, i, 2)}
                          className="w-full bg-transparent border-none text-slate-300 px-2 py-1 focus:ring-1 focus:ring-blue-500 rounded"
                          placeholder="1 or 0"
                          min="0"
                          max="1"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          id={`km-input-${i}-3`}
                          type="text"
                          value={row.group}
                          onChange={(e) => handleRowChange(i, "group", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, i, 3)}
                          onPaste={(e) => handleTablePaste(e, i, 3)}
                          className="w-full bg-transparent border-none text-slate-300 px-2 py-1 focus:ring-1 focus:ring-blue-500 rounded"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <button onClick={() => removeRow(i)} className="text-slate-500 hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <button
                onClick={addRow}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add Row
              </button>
              <button
                onClick={runAnalysis}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} /> Analyze
              </button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <textarea
                className="w-full h-16 bg-slate-900/50 border border-slate-700 rounded p-2 text-xs text-slate-400 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Or click here and paste from Excel (ID, Time, Status, Group)..."
                onPaste={handlePaste}
                onChange={() => {}}
                value={pastedData}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Visualization & Stats */}
        <div id="survival-export-container" className="lg:col-span-2 space-y-6">
          
          {/* Chart Card */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Survival Curve</h2>
              {data.length > 0 && (
                <button
                  onClick={downloadPlot}
                  className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded text-slate-300 transition-colors flex items-center gap-2 text-sm"
                  title="Download Plot as PNG"
                >
                  <Camera size={16} /> Export Plot
                </button>
              )}
            </div>
            
            <div id="survival-chart-container" className="h-96 w-full relative bg-slate-900/20 rounded-lg p-2">
              {data.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                  Add data and click Analyze to generate plot
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="time" 
                      type="number" 
                      domain={[0, 'dataMax']}
                      stroke="#64748b" 
                      tick={{ fill: '#64748b' }} 
                      tickCount={10}
                      label={{ value: 'Time', position: 'bottom', fill: '#64748b' }}
                    />
                    <YAxis 
                      domain={[0, 1]} 
                      tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                      stroke="#64748b" 
                      tick={{ fill: '#64748b' }} 
                      label={{ value: 'Survival Probability', angle: -90, position: 'insideLeft', fill: '#64748b' }}
                    />
                    <RechartsTooltip 
                      formatter={(value: any) => [`${(Number(value) * 100).toFixed(1)}%`, 'Survival']}
                      labelFormatter={(label) => `Time: ${label}`}
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#334155', color: '#f1f5f9' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    
                    {groups.map((group, i) => (
                      <Line 
                        key={group}
                        type="stepAfter"
                        dataKey={group} 
                        stroke={getGroupColor(i)} 
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6 }}
                        isAnimationActive={false}
                      />
                    ))}

                    {/* Censored Ticks */}
                    {censoredPoints.map((cp, i) => (
                      <ReferenceDot 
                        key={`censor-${i}`}
                        x={cp.time} 
                        y={cp.survival} 
                        r={3} 
                        fill={cp.color} 
                        stroke="white" 
                        strokeWidth={1}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Stats Card */}
          {data.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 shadow-xl backdrop-blur-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">Statistical Results</h2>
                <button
                  onClick={downloadCSV}
                  className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded text-slate-300 transition-colors flex items-center gap-2 text-sm"
                  title="Download Stats as CSV"
                >
                  <Download size={16} /> Export CSV
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Group Statistics</h3>
                  <div className="overflow-hidden border border-slate-700 rounded-lg">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-900/80">
                        <tr>
                          <th className="px-3 py-2 text-slate-300">Group</th>
                          <th className="px-3 py-2 text-slate-300">N</th>
                          <th className="px-3 py-2 text-slate-300">Events</th>
                          <th className="px-3 py-2 text-slate-300">Median Survival</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {survivalCurves.map((curve, i) => (
                          <tr key={curve.group} className="bg-slate-800/30">
                            <td className="px-3 py-2 flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getGroupColor(i) }}></span>
                              {curve.group}
                            </td>
                            <td className="px-3 py-2">{curve.totalSubjects}</td>
                            <td className="px-3 py-2">{curve.totalEvents}</td>
                            <td className="px-3 py-2">{curve.medianSurvival !== null ? curve.medianSurvival : "Undefined"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Log-Rank (Mantel-Cox) Test</h3>
                  {logRank && logRank.pValue !== null ? (
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex flex-col gap-2">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                        <span className="text-slate-400">P-Value</span>
                        <span className={`font-mono text-lg font-bold ${logRank.pValue < 0.05 ? 'text-emerald-400' : 'text-slate-200'}`}>
                          {logRank.pValue < 0.0001 ? "< 0.0001" : logRank.pValue.toFixed(4)}
                          {logRank.pValue < 0.05 && <span className="ml-2 text-emerald-400">*</span>}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Chi-Square (χ²)</span>
                        <span className="text-slate-300 font-mono">{logRank.chiSquare?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Degrees of Freedom (df)</span>
                        <span className="text-slate-300 font-mono">{logRank.df}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex flex-col items-center justify-center text-slate-500 text-sm h-full">
                      Insufficient data for Log-rank test.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      </div>
    </div>
  );
}

function ActivityIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  );
}
