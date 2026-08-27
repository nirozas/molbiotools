"use client";

import React, { useState, useRef } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import * as XLSX from "xlsx";
import Link from "next/link";
import { toPng } from 'html-to-image';
import { 
  FDRDataRow, 
  FDRAnalysisResult, 
  calculateFDR 
} from "@/components/fdr-calculator/FDRLogic";
import { 
  Activity, 
  Upload, 
  Plus, 
  Trash2, 
  RefreshCw,
  Camera,
  Download,
  Filter,
  ChevronLeft
} from "lucide-react";

export default function FDRCalculator() {
  const [activeRows, setActiveRows] = useState<any[]>([
    { id: "Gene A", pValue: "0.001" },
    { id: "Gene B", pValue: "0.015" },
    { id: "Gene C", pValue: "0.024" },
    { id: "Gene D", pValue: "0.045" },
    { id: "Gene E", pValue: "0.080" },
    { id: "Gene F", pValue: "0.150" },
    { id: "Gene G", pValue: "0.300" },
    { id: "Gene H", pValue: "0.850" },
  ]);

  const [pastedData, setPastedData] = useState("");
  const [fdrThreshold, setFdrThreshold] = useState("0.05");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [results, setResults] = useState<FDRAnalysisResult | null>(null);

  const handleRowChange = (index: number, field: string, value: string) => {
    const newRows = [...activeRows];
    newRows[index][field] = value;
    setActiveRows(newRows);
  };

  const addRow = () => {
    setActiveRows([...activeRows, { id: "", pValue: "" }]);
  };

  const removeRow = (index: number) => {
    const newRows = [...activeRows];
    newRows.splice(index, 1);
    if (newRows.length === 0) {
      newRows.push({ id: "", pValue: "" });
    }
    setActiveRows(newRows);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = document.getElementById(`fdr-input-${rowIndex - 1}-${colIndex}`);
      if (prev) prev.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = document.getElementById(`fdr-input-${rowIndex + 1}-${colIndex}`);
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
    const keys = ["id", "pValue"];
    
    for (let r = 0; r < lines.length; r++) {
      const cells = lines[r].split('\t');
      const targetRowIndex = startRowIndex + r;
      
      if (targetRowIndex >= newRows.length) {
        newRows.push({ id: "", pValue: "" });
      }
      
      for (let c = 0; c < cells.length; c++) {
        const targetColIndex = startColIndex + c;
        if (targetColIndex < 2) {
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
      if (i === 0 && (cells[0].toLowerCase() === "id" || cells[0].toLowerCase().includes("gene"))) {
        return; 
      }
      if (cells.length >= 2) {
        parsedRows.push({
          id: cells[0]?.trim() || "",
          pValue: cells[1]?.trim() || "",
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
            pValue: row[1]?.toString() || "",
          });
        }
      }

      if (parsedRows.length > 0) setActiveRows(parsedRows);
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const runAnalysis = () => {
    const cleanData: FDRDataRow[] = activeRows
      .map(row => ({
        id: row.id || "Unknown",
        pValue: parseFloat(row.pValue),
      }))
      .filter(row => !isNaN(row.pValue) && row.pValue >= 0 && row.pValue <= 1);

    const fdrVal = parseFloat(fdrThreshold);
    if (isNaN(fdrVal) || fdrVal <= 0 || fdrVal > 1) {
      alert("Invalid FDR Threshold.");
      return;
    }

    const out = calculateFDR(cleanData, fdrVal);
    setResults(out);
  };

  const downloadPlot = async () => {
    const exportContainer = document.getElementById("fdr-export-container");
    if (!exportContainer) return;

    try {
      const dataUrl = await toPng(exportContainer, {
        backgroundColor: '#0f172a',
        pixelRatio: 2,
        style: { transform: 'scale(1)', transformOrigin: 'top left' }
      });
      
      const link = document.createElement("a");
      link.download = "fdr_analysis.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export image", err);
    }
  };

  const exportCSV = () => {
    if (!results) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Rank,P-Value,Q-Value,Is_Significant\n";
    
    results.rows.forEach((r) => {
      const row = [
        r.id,
        r.rank,
        r.pValue,
        r.qValue.toFixed(6),
        r.isSignificant
      ];
      csvContent += row.join(",") + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "fdr_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = results?.rows || [];

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-[calc(100vh-4rem)] flex flex-col justify-center text-slate-200">
      <div className="w-full space-y-6">
      
        <Link href="/tools/stats" className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 w-fit">
          <ChevronLeft size={16} className="mr-1" /> Back to Experimental Design & Statistics
        </Link>

        <header className="mb-4">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Filter className="text-purple-500" />
            False Discovery Rate (FDR) Calculator
          </h1>
          <p className="text-slate-400 mt-2">
            Calculate Benjamini-Hochberg adjusted p-values (q-values) to correct for multiple testing.
          </p>
        </header>

        {/* Algorithm Explanation */}
        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 text-sm text-purple-200/80 mb-2">
          <h3 className="text-purple-300 font-semibold mb-1">How this works:</h3>
          <p className="mb-2">
            When performing hundreds or thousands of statistical tests (like RNA-seq or high-throughput screens), a standard p-value &lt; 0.05 will yield many false positives by pure chance. The <strong>Benjamini-Hochberg (BH)</strong> step-up procedure controls the False Discovery Rate.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>P-values are sorted from smallest to largest and assigned a rank (<em>i</em>).</li>
            <li>The BH critical value is calculated as (<em>i</em> / <em>m</em>) &times; <em>Q</em>, where <em>m</em> is the total number of tests and <em>Q</em> is your False Discovery Rate threshold.</li>
            <li>The Adjusted P-Value (q-value) represents the minimum FDR threshold at which that test would be considered significant.</li>
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

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">FDR Threshold (Q)</label>
                <input
                  type="number"
                  value={fdrThreshold}
                  onChange={(e) => setFdrThreshold(e.target.value)}
                  step="0.01"
                  min="0"
                  max="1"
                  className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 px-3 py-2 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="text-xs text-slate-400 mb-4">
                Columns: Identifier, P-Value
              </div>

              <div className="max-h-96 overflow-y-auto mb-4 border border-slate-700/50 rounded bg-slate-900/50">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-slate-800/80 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 font-medium">Identifier</th>
                      <th className="px-3 py-2 font-medium">P-Value</th>
                      <th className="px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRows.map((row, i) => (
                      <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="p-1">
                          <input
                            id={`fdr-input-${i}-0`}
                            type="text"
                            value={row.id}
                            onChange={(e) => handleRowChange(i, "id", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, i, 0)}
                            onPaste={(e) => handleTablePaste(e, i, 0)}
                            className="w-full bg-transparent border-none text-slate-300 px-2 py-1 focus:ring-1 focus:ring-blue-500 rounded"
                            placeholder="e.g. Gene A"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            id={`fdr-input-${i}-1`}
                            type="number"
                            value={row.pValue}
                            onChange={(e) => handleRowChange(i, "pValue", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, i, 1)}
                            onPaste={(e) => handleTablePaste(e, i, 1)}
                            className="w-full bg-transparent border-none text-slate-300 px-2 py-1 focus:ring-1 focus:ring-blue-500 rounded"
                            placeholder="e.g. 0.05"
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
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 rounded text-sm text-white font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} /> Adjust
                </button>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <textarea
                  className="w-full h-16 bg-slate-900/50 border border-slate-700 rounded p-2 text-xs text-slate-400 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Or click here and paste from Excel (ID, P-Value)..."
                  onPaste={handlePaste}
                  onChange={() => {}}
                  value={pastedData}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Visualization & Stats */}
          <div id="fdr-export-container" className="lg:col-span-2 space-y-6">
            
            {/* Chart Card */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 shadow-xl backdrop-blur-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">Significance Plot</h2>
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
                    Add data and click Adjust to generate plot
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="rank" 
                        type="number" 
                        name="Rank"
                        stroke="#94a3b8" 
                        tick={{ fill: '#94a3b8', fontSize: 12 }} 
                        label={{ value: 'Rank', position: 'insideBottomRight', offset: -10, style: { fill: '#94a3b8' } }}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        tick={{ fill: '#94a3b8', fontSize: 12 }} 
                        label={{ value: 'Probability Value', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                        formatter={(value: any, name: any) => [Number(value).toFixed(4), name]}
                        labelFormatter={(val) => `Rank: ${val}`}
                      />
                      <Legend verticalAlign="top" height={36} />
                      
                      <Line 
                        type="monotone" 
                        dataKey="pValue" 
                        name="Raw P-Value" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#3b82f6' }}
                        activeDot={{ r: 5 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="qValue" 
                        name="Adjusted Q-Value" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#10b981' }}
                        activeDot={{ r: 5 }}
                      />
                      <ReferenceLine 
                        y={results.fdrThreshold} 
                        stroke="#ef4444" 
                        strokeDasharray="3 3" 
                        label={{ position: 'right', value: `FDR = ${results.fdrThreshold}`, fill: '#ef4444', fontSize: 12 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Stats Card */}
            {results && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 shadow-xl backdrop-blur-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">Adjustment Results</h2>
                  <div className="flex items-center gap-4">
                    <span className="text-sm px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/30">
                      Significant Tests: {results.totalSignificant} / {results.rows.length}
                    </span>
                    <button
                      onClick={exportCSV}
                      className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
                    >
                      <Download size={14} /> Export CSV
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto max-h-[400px] border border-slate-700/50 rounded bg-slate-900/30">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-slate-800/80 sticky top-0 z-10 text-slate-400">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Rank</th>
                        <th className="px-4 py-3 font-semibold">Identifier</th>
                        <th className="px-4 py-3 font-semibold">Raw P-Value</th>
                        <th className="px-4 py-3 font-semibold">Adjusted Q-Value</th>
                        <th className="px-4 py-3 font-semibold text-center">Significance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.rows.map((res, i) => (
                        <tr key={res.id + i} className={`border-b border-slate-700/30 ${res.isSignificant ? 'bg-emerald-950/10' : ''}`}>
                          <td className="px-4 py-2 text-slate-400">{res.rank}</td>
                          <td className="px-4 py-2 font-medium text-slate-200">{res.id}</td>
                          <td className="px-4 py-2 font-mono text-slate-300">{res.pValue}</td>
                          <td className="px-4 py-2 font-mono text-slate-300">
                            {res.isSignificant ? (
                              <span className="text-emerald-400 font-semibold">{res.qValue.toFixed(5)}</span>
                            ) : (
                              res.qValue.toFixed(5)
                            )}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {res.isSignificant ? (
                              <span className="text-emerald-500 font-bold">Yes</span>
                            ) : (
                              <span className="text-slate-500">No</span>
                            )}
                          </td>
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
