"use client";

import React, { useState, useRef } from "react";
import { 
  ScatterChart,
  Scatter,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from "recharts";
import * as XLSX from "xlsx";
import Link from "next/link";
import { toPng } from 'html-to-image';
import { 
  OutlierDataRow, 
  OutlierAnalysisResult, 
  detectOutliers 
} from "@/components/outlier-detector/OutlierLogic";
import { 
  Activity, 
  Upload, 
  Plus, 
  Trash2, 
  RefreshCw,
  Camera,
  Download,
  AlertTriangle,
  ChevronLeft
} from "lucide-react";

export default function OutlierDetector() {
  const [activeRows, setActiveRows] = useState<any[]>([
    { id: "Sample 1", value: "10", group: "Control" },
    { id: "Sample 2", value: "12", group: "Control" },
    { id: "Sample 3", value: "11", group: "Control" },
    { id: "Sample 4", value: "9", group: "Control" },
    { id: "Sample 5", value: "10", group: "Control" },
    { id: "Sample 6", value: "85", group: "Control" }, // obvious outlier
    { id: "Sample 7", value: "45", group: "Treatment" },
    { id: "Sample 8", value: "42", group: "Treatment" },
    { id: "Sample 9", value: "48", group: "Treatment" },
    { id: "Sample 10", value: "44", group: "Treatment" },
    { id: "Sample 11", value: "46", group: "Treatment" },
    { id: "Sample 12", value: "2", group: "Treatment" }, // obvious outlier
  ]);

  const [pastedData, setPastedData] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [results, setResults] = useState<OutlierAnalysisResult | null>(null);

  const colors = [
    "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"
  ];
  const getGroupColor = (index: number) => colors[index % colors.length];

  const handleRowChange = (index: number, field: string, value: string) => {
    const newRows = [...activeRows];
    newRows[index][field] = value;
    setActiveRows(newRows);
  };

  const addRow = () => {
    setActiveRows([...activeRows, { id: "", value: "", group: "Control" }]);
  };

  const removeRow = (index: number) => {
    const newRows = [...activeRows];
    newRows.splice(index, 1);
    if (newRows.length === 0) {
      newRows.push({ id: "", value: "", group: "Control" });
    }
    setActiveRows(newRows);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = document.getElementById(`outlier-input-${rowIndex - 1}-${colIndex}`);
      if (prev) prev.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = document.getElementById(`outlier-input-${rowIndex + 1}-${colIndex}`);
      if (next) next.focus();
    }
  };

  const handleTablePaste = (e: React.ClipboardEvent<HTMLInputElement>, startRowIndex: number, startColIndex: number) => {
    const paste = e.clipboardData.getData("text");
    if (!paste) return;
    
    const lines = paste.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length <= 1 && !paste.includes('\t')) return;
    
    e.preventDefault();
    
    const newRows = [...activeRows];
    const keys = ["id", "value", "group"];
    
    for (let r = 0; r < lines.length; r++) {
      const cells = lines[r].split('\t');
      const targetRowIndex = startRowIndex + r;
      
      if (targetRowIndex >= newRows.length) {
        newRows.push({ id: "", value: "", group: "" });
      }
      
      for (let c = 0; c < cells.length; c++) {
        const targetColIndex = startColIndex + c;
        if (targetColIndex < 3) {
          const val = cells[c].trim();
          if (val) (newRows[targetRowIndex] as any)[keys[targetColIndex]] = val;
        }
      }
    }
    setActiveRows(newRows);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    if (!pasted) return;

    const lines = pasted.split(/\r?\n/).filter(line => line.trim() !== "");
    const parsedRows: any[] = [];
    
    lines.forEach((line, i) => {
      const cells = line.split('\t');
      if (i === 0 && (cells[0].toLowerCase() === "id" || cells[0].toLowerCase() === "sample")) {
        return; 
      }
      if (cells.length >= 2) {
        parsedRows.push({
          id: cells[0]?.trim() || "",
          value: cells[1]?.trim() || "",
          group: cells[2]?.trim() || "Control",
        });
      }
    });

    if (parsedRows.length > 0) setActiveRows(parsedRows);
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
      
      const parsedRows: any[] = [];
      let startIdx = 0;
      
      if (json.length > 0 && typeof json[0][0] === 'string' && json[0][0].toLowerCase().includes('id')) {
        startIdx = 1;
      }

      for (let i = startIdx; i < json.length; i++) {
        const row = json[i];
        if (row.length >= 2) {
          parsedRows.push({
            id: row[0]?.toString() || "",
            value: row[1]?.toString() || "",
            group: row[2]?.toString() || "Control",
          });
        }
      }

      if (parsedRows.length > 0) setActiveRows(parsedRows);
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const runAnalysis = () => {
    const cleanData: OutlierDataRow[] = activeRows
      .map(row => ({
        id: row.id || "Unknown",
        value: parseFloat(row.value),
        group: row.group || "Unknown"
      }))
      .filter(row => !isNaN(row.value));

    const out = detectOutliers(cleanData);
    setResults(out);
  };

  const downloadPlot = async () => {
    const exportContainer = document.getElementById("outlier-export-container");
    if (!exportContainer) return;

    try {
      const dataUrl = await toPng(exportContainer, {
        backgroundColor: '#0f172a',
        pixelRatio: 2,
        style: { transform: 'scale(1)', transformOrigin: 'top left' }
      });
      
      const link = document.createElement("a");
      link.download = "outlier_analysis.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export image", err);
    }
  };

  const exportCSV = () => {
    if (!results) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Group,Value,Z-Score,Is_Grubbs_Outlier,Is_Tukey_Outlier\n";
    
    results.rows.forEach((r) => {
      const row = [
        r.id,
        r.group,
        r.value,
        r.zScore.toFixed(4),
        r.isGrubbsOutlier,
        r.isTukeyOutlier
      ];
      csvContent += row.join(",") + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "outlier_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format data for Scatter plot
  const chartData: any[] = [];
  if (results) {
    // Add jitter to x-axis for visual separation
    results.rows.forEach(r => {
      const groupIndex = results.summaries.findIndex(s => s.group === r.group);
      const jitter = (Math.random() - 0.5) * 0.4;
      chartData.push({
        ...r,
        x: groupIndex + 1 + jitter, // 1-indexed group position
        groupLabel: r.group
      });
    });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-[calc(100vh-4rem)] flex flex-col justify-center text-slate-200">
      <div className="w-full space-y-6">
      
        <Link href="/tools/stats" className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 w-fit">
          <ChevronLeft size={16} className="mr-1" /> Back to Experimental Design & Statistics
        </Link>

        <header className="mb-4">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <AlertTriangle className="text-amber-500" />
            Outlier Detector
          </h1>
          <p className="text-slate-400 mt-2">
            Identify statistical outliers using Grubbs' Extreme Studentized Deviate and Tukey's Fences.
          </p>
        </header>

        {/* Algorithm Explanation */}
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 text-sm text-amber-200/80 mb-2">
          <h3 className="text-amber-300 font-semibold mb-1">How this works:</h3>
          <p className="mb-2">
            This tool applies two distinct statistical methods to flag extreme values that may be experimental errors:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Grubbs' Test:</strong> A parametric test that assumes the underlying data follows a normal distribution. It detects outliers by calculating the maximum absolute Z-score (|Z|) and comparing it to a critical value derived from the t-distribution at &alpha; = 0.05. It is highly sensitive to extreme deviations in normally distributed data.</li>
            <li><strong>Tukey's Fences:</strong> A non-parametric, robust method based on the Interquartile Range (IQR). Values falling below Q1 - 1.5 &times; IQR or above Q3 + 1.5 &times; IQR are flagged. This method does not assume normality and is less influenced by the outliers themselves.</li>
          </ul>
        </div>

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
                Columns: Sample ID, Value, Group
              </div>

              <div className="max-h-96 overflow-y-auto mb-4 border border-slate-700/50 rounded bg-slate-900/50">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-slate-800/80 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 font-medium">ID</th>
                      <th className="px-3 py-2 font-medium">Value</th>
                      <th className="px-3 py-2 font-medium">Group</th>
                      <th className="px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRows.map((row, i) => (
                      <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="p-1">
                          <input
                            id={`outlier-input-${i}-0`}
                            type="text"
                            value={row.id}
                            onChange={(e) => handleRowChange(i, "id", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, i, 0)}
                            onPaste={(e) => handleTablePaste(e, i, 0)}
                            className="w-full bg-transparent border-none text-slate-300 px-2 py-1 focus:ring-1 focus:ring-blue-500 rounded"
                            placeholder="Sample"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            id={`outlier-input-${i}-1`}
                            type="number"
                            value={row.value}
                            onChange={(e) => handleRowChange(i, "value", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, i, 1)}
                            onPaste={(e) => handleTablePaste(e, i, 1)}
                            className="w-full bg-transparent border-none text-slate-300 px-2 py-1 focus:ring-1 focus:ring-blue-500 rounded"
                            placeholder="Value"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            id={`outlier-input-${i}-2`}
                            type="text"
                            value={row.group}
                            onChange={(e) => handleRowChange(i, "group", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, i, 2)}
                            onPaste={(e) => handleTablePaste(e, i, 2)}
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
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 rounded text-sm text-white font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} /> Detect
                </button>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <textarea
                  className="w-full h-16 bg-slate-900/50 border border-slate-700 rounded p-2 text-xs text-slate-400 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Or click here and paste from Excel (ID, Value, Group)..."
                  onPaste={handlePaste}
                  onChange={() => {}}
                  value={pastedData}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Visualization & Stats */}
          <div id="outlier-export-container" className="lg:col-span-2 space-y-6">
            
            {/* Chart Card */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 shadow-xl backdrop-blur-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">Value Distribution (Jitter Plot)</h2>
                {results && (
                  <button
                    onClick={downloadPlot}
                    className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded text-slate-300 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Camera size={16} /> Export Plot
                  </button>
                )}
              </div>
              
              <div className="h-96 w-full relative bg-slate-900/20 rounded-lg p-2">
                {!results ? (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                    Add data and click Detect to generate plot
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        type="number" 
                        dataKey="x" 
                        name="Group"
                        domain={[0, results.summaries.length + 1]}
                        ticks={Array.from({ length: results.summaries.length }, (_, i) => i + 1)}
                        tickFormatter={(val) => results.summaries[val - 1]?.group || ""}
                        stroke="#94a3b8" 
                        tick={{ fill: '#94a3b8', fontSize: 14, fontWeight: 'bold' }} 
                      />
                      <YAxis 
                        type="number" 
                        dataKey="value" 
                        name="Value" 
                        stroke="#94a3b8" 
                        tick={{ fill: '#94a3b8' }} 
                      />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            let status = "Normal";
                            let statusColor = "text-emerald-400";
                            if (data.isGrubbsOutlier && data.isTukeyOutlier) {
                              status = "Grubbs & Tukey Outlier";
                              statusColor = "text-red-400 font-bold";
                            } else if (data.isGrubbsOutlier) {
                              status = "Grubbs Outlier";
                              statusColor = "text-red-400 font-bold";
                            } else if (data.isTukeyOutlier) {
                              status = "Tukey Outlier";
                              statusColor = "text-red-400 font-bold";
                            }

                            return (
                              <div className="bg-slate-800 border border-slate-600 p-3 rounded-lg shadow-2xl">
                                <p className="text-white font-bold mb-1 border-b border-slate-600 pb-1">{data.id}</p>
                                <p className="text-slate-300 text-sm">Group: <span className="text-white font-medium">{data.groupLabel}</span></p>
                                <p className="text-slate-300 text-sm">Value: <span className="text-white font-medium">{data.value}</span></p>
                                <p className={`text-sm mt-1 ${statusColor}`}>{status}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      
                      <Scatter name="Samples" data={chartData} isAnimationActive={true}>
                        {chartData.map((entry, index) => {
                          const groupIndex = results.summaries.findIndex(s => s.group === entry.group);
                          const isOutlier = entry.isGrubbsOutlier || entry.isTukeyOutlier;
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={isOutlier ? "#ef4444" : getGroupColor(groupIndex)} // red if outlier
                              stroke={isOutlier ? "#b91c1c" : "transparent"}
                              strokeWidth={2}
                            />
                          );
                        })}
                      </Scatter>

                      {/* Add reference lines for means */}
                      {results.summaries.map((s, i) => (
                        <ReferenceLine 
                          key={`mean-${i}`}
                          segment={[{ x: i + 0.6, y: s.mean }, { x: i + 1.4, y: s.mean }]}
                          stroke="#94a3b8"
                          strokeWidth={2}
                        />
                      ))}
                    </ScatterChart>
                  </ResponsiveContainer>
                )}
              </div>
              
              {results && (
                <div className="flex gap-4 justify-center mt-4 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div> Outlier
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-slate-400"></div> Group Mean
                  </div>
                </div>
              )}
            </div>

            {/* Stats Card */}
            {results && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 shadow-xl backdrop-blur-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">Outlier Analysis Results</h2>
                  <button
                    onClick={exportCSV}
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
                  >
                    <Download size={14} /> Export CSV
                  </button>
                </div>
                
                <div className="overflow-x-auto mb-6">
                  <h3 className="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider">Detected Outliers</h3>
                  {results.rows.filter(r => r.isGrubbsOutlier || r.isTukeyOutlier).length > 0 ? (
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase text-slate-400 border-b border-slate-700/50">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Sample ID</th>
                          <th className="px-4 py-3 font-semibold">Group</th>
                          <th className="px-4 py-3 font-semibold">Value</th>
                          <th className="px-4 py-3 font-semibold">Z-Score</th>
                          <th className="px-4 py-3 font-semibold">Grubbs Test</th>
                          <th className="px-4 py-3 font-semibold">Tukey Fence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.rows.filter(r => r.isGrubbsOutlier || r.isTukeyOutlier).map((res, i) => (
                          <tr key={res.id + i} className="border-b border-slate-700/30 bg-red-950/20">
                            <td className="px-4 py-3 font-medium text-slate-200">{res.id}</td>
                            <td className="px-4 py-3 text-slate-300">{res.group}</td>
                            <td className="px-4 py-3 font-mono text-slate-300">{res.value}</td>
                            <td className="px-4 py-3 font-mono text-slate-300">{res.zScore.toFixed(2)}</td>
                            <td className="px-4 py-3">
                              {res.isGrubbsOutlier ? <span className="text-red-400 font-semibold">Outlier</span> : <span className="text-slate-500">Normal</span>}
                            </td>
                            <td className="px-4 py-3">
                              {res.isTukeyOutlier ? <span className="text-red-400 font-semibold">Outlier</span> : <span className="text-slate-500">Normal</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 rounded text-emerald-400 text-center">
                      No outliers detected in the dataset.
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <h3 className="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider">Group Statistics</h3>
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase text-slate-400 border-b border-slate-700/50">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Group</th>
                        <th className="px-4 py-3 font-semibold">N</th>
                        <th className="px-4 py-3 font-semibold">Mean</th>
                        <th className="px-4 py-3 font-semibold">SD</th>
                        <th className="px-4 py-3 font-semibold">Q1</th>
                        <th className="px-4 py-3 font-semibold">Median</th>
                        <th className="px-4 py-3 font-semibold">Q3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.summaries.map((s, i) => (
                        <tr key={s.group} className="border-b border-slate-700/30">
                          <td className="px-4 py-3 font-medium text-slate-200 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getGroupColor(i) }}></span>
                            {s.group}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-300">{s.count}</td>
                          <td className="px-4 py-3 font-mono text-slate-300">{s.mean.toFixed(2)}</td>
                          <td className="px-4 py-3 font-mono text-slate-300">{s.stdDev.toFixed(2)}</td>
                          <td className="px-4 py-3 font-mono text-slate-300">{s.q1.toFixed(2)}</td>
                          <td className="px-4 py-3 font-mono text-slate-300">{s.median.toFixed(2)}</td>
                          <td className="px-4 py-3 font-mono text-slate-300">{s.q3.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
