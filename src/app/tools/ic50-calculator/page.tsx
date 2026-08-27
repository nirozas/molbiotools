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
  ScatterChart,
  Scatter,
  ComposedChart
} from "recharts";
import * as XLSX from "xlsx";
import Link from "next/link";
import { toPng } from 'html-to-image';
import { 
  DoseResponseDataRow, 
  CurveFitResult, 
  fitDoseResponseCurves 
} from "@/components/ic50-calculator/CurveFitLogic";
import { 
  Activity, 
  Upload, 
  Plus, 
  Trash2, 
  RefreshCw,
  Camera,
  Download,
  Info,
  ChevronLeft
} from "lucide-react";

export default function IC50Calculator() {
  const [activeRows, setActiveRows] = useState<any[]>([
    { concentration: "100", response: "5", group: "Drug A" },
    { concentration: "10", response: "15", group: "Drug A" },
    { concentration: "1", response: "50", group: "Drug A" },
    { concentration: "0.1", response: "85", group: "Drug A" },
    { concentration: "0.01", response: "95", group: "Drug A" },
    { concentration: "100", response: "50", group: "Drug B" },
    { concentration: "10", response: "60", group: "Drug B" },
    { concentration: "1", response: "80", group: "Drug B" },
    { concentration: "0.1", response: "95", group: "Drug B" },
    { concentration: "0.01", response: "100", group: "Drug B" },
  ]);

  const [pastedData, setPastedData] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<DoseResponseDataRow[]>([]);
  const [results, setResults] = useState<CurveFitResult[]>([]);

  // Colors for different groups
  const colors = [
    "#3b82f6", // blue-500
    "#10b981", // emerald-500
    "#f59e0b", // amber-500
    "#ec4899", // pink-500
    "#8b5cf6", // violet-500
    "#06b6d4", // cyan-500
  ];

  const getGroupColor = (index: number) => colors[index % colors.length];

  const handleRowChange = (index: number, field: string, value: string) => {
    const newRows = [...activeRows];
    newRows[index][field] = value;
    setActiveRows(newRows);
  };

  const addRow = () => {
    setActiveRows([...activeRows, { concentration: "", response: "", group: "Drug A" }]);
  };

  const removeRow = (index: number) => {
    const newRows = [...activeRows];
    newRows.splice(index, 1);
    if (newRows.length === 0) {
      newRows.push({ concentration: "", response: "", group: "Drug A" });
    }
    setActiveRows(newRows);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = document.getElementById(`ic50-input-${rowIndex - 1}-${colIndex}`);
      if (prev) prev.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = document.getElementById(`ic50-input-${rowIndex + 1}-${colIndex}`);
      if (next) next.focus();
    }
  };

  const handleTablePaste = (e: React.ClipboardEvent<HTMLInputElement>, startRowIndex: number, startColIndex: number) => {
    const paste = e.clipboardData.getData("text");
    if (!paste) return;
    
    const lines = paste.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length <= 1 && !paste.includes('\t')) {
      return; 
    }
    
    e.preventDefault();
    
    const newRows = [...activeRows];
    const keys = ["concentration", "response", "group"];
    
    for (let r = 0; r < lines.length; r++) {
      const cells = lines[r].split('\t');
      const targetRowIndex = startRowIndex + r;
      
      if (targetRowIndex >= newRows.length) {
        newRows.push({ concentration: "", response: "", group: "" });
      }
      
      for (let c = 0; c < cells.length; c++) {
        const targetColIndex = startColIndex + c;
        if (targetColIndex < 3) {
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
    if (!pasted) return;

    const lines = pasted.split(/\r?\n/).filter(line => line.trim() !== "");
    const parsedRows: any[] = [];
    
    lines.forEach((line, i) => {
      const cells = line.split('\t');
      if (i === 0 && (cells[0].toLowerCase() === "concentration" || cells[0].toLowerCase() === "conc")) {
        return; // skip header
      }
      if (cells.length >= 2) {
        parsedRows.push({
          concentration: cells[0]?.trim() || "",
          response: cells[1]?.trim() || "",
          group: cells[2]?.trim() || "Control",
        });
      }
    });

    if (parsedRows.length > 0) {
      setActiveRows(parsedRows);
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
      
      const parsedRows: any[] = [];
      let startIdx = 0;
      
      if (json.length > 0 && typeof json[0][0] === 'string' && json[0][0].toLowerCase().includes('conc')) {
        startIdx = 1; // skip header
      }

      for (let i = startIdx; i < json.length; i++) {
        const row = json[i];
        if (row.length >= 2) {
          parsedRows.push({
            concentration: row[0]?.toString() || "",
            response: row[1]?.toString() || "",
            group: row[2]?.toString() || "Control",
          });
        }
      }

      if (parsedRows.length > 0) {
        setActiveRows(parsedRows);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const runAnalysis = () => {
    const cleanData: DoseResponseDataRow[] = activeRows
      .map(row => ({
        concentration: parseFloat(row.concentration),
        response: parseFloat(row.response),
        group: row.group || "Unknown"
      }))
      .filter(row => !isNaN(row.concentration) && !isNaN(row.response));

    setData(cleanData);
    const fitResults = fitDoseResponseCurves(cleanData);
    setResults(fitResults);
  };

  const downloadPlot = async () => {
    const exportContainer = document.getElementById("ic50-export-container");
    if (!exportContainer) return;

    try {
      const dataUrl = await toPng(exportContainer, {
        backgroundColor: '#0f172a',
        pixelRatio: 2,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const link = document.createElement("a");
      link.download = "ic50_dose_response.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export image", err);
    }
  };

  const exportCSV = () => {
    if (results.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Group,IC50,HillSlope,R_Squared,Min_Response,Max_Response\n";
    
    results.forEach((res) => {
      const row = [
        res.group,
        res.ic50?.toFixed(4) || "N/A",
        res.hillSlope?.toFixed(4) || "N/A",
        res.rSquared?.toFixed(4) || "N/A",
        res.min?.toFixed(4) || "N/A",
        res.max?.toFixed(4) || "N/A",
      ];
      csvContent += row.join(",") + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ic50_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reformat data for ComposedChart.
  // We must merge all values sharing the exact same X coordinate into a single object,
  // otherwise Recharts will break the Line paths because it sees nulls between points.
  const pointsMap = new Map<number, any>();
  
  const mergePoint = (x: number, key: string, value: number) => {
    // Round x slightly to avoid floating point mismatch when merging
    const rx = Number(x.toPrecision(6));
    if (!pointsMap.has(rx)) pointsMap.set(rx, { x: rx });
    pointsMap.get(rx)[key] = value;
  };

  results.forEach((res) => {
    res.points.forEach(p => mergePoint(p.x, `${res.group}_scatter`, p.y));
    res.curve.forEach(p => mergePoint(p.x, `${res.group}_curve`, p.y));
  });

  const chartPoints = Array.from(pointsMap.values()).sort((a, b) => a.x - b.x);

  // Generate clean logarithmic ticks for the X-axis (e.g., 0.01, 0.1, 1, 10, 100)
  let ticks: number[] = [];
  let minDomain: number | 'auto' = 'auto';
  let maxDomain: number | 'auto' = 'auto';
  
  if (chartPoints.length > 0) {
    const minX = chartPoints[0].x;
    const maxX = chartPoints[chartPoints.length - 1].x;
    const logMin = Math.floor(Math.log10(minX));
    const logMax = Math.ceil(Math.log10(maxX));
    
    for (let i = logMin; i <= logMax; i++) {
      ticks.push(Math.pow(10, i));
    }
    
    minDomain = Math.pow(10, logMin);
    maxDomain = Math.pow(10, logMax);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-[calc(100vh-4rem)] flex flex-col justify-center text-slate-200">
      <div className="w-full space-y-6">
      
        <Link href="/tools/stats" className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 w-fit">
          <ChevronLeft size={16} className="mr-1" /> Back to Experimental Design & Statistics
        </Link>

        <header className="mb-4">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BeakerIcon />
            IC50 Dose-Response Calculator
          </h1>
          <p className="text-slate-400 mt-2">
            Calculate IC50/EC50 values using 4-Parameter Logistic (4PL) non-linear regression.
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
                Columns: Concentration, Response (e.g. % Viability), Group
              </div>

              <div className="max-h-96 overflow-y-auto mb-4 border border-slate-700/50 rounded bg-slate-900/50">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-slate-800/80 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 font-medium">Conc.</th>
                      <th className="px-3 py-2 font-medium">Response</th>
                      <th className="px-3 py-2 font-medium">Group</th>
                      <th className="px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRows.map((row, i) => (
                      <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="p-1">
                          <input
                            id={`ic50-input-${i}-0`}
                            type="number"
                            value={row.concentration}
                            onChange={(e) => handleRowChange(i, "concentration", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, i, 0)}
                            onPaste={(e) => handleTablePaste(e, i, 0)}
                            className="w-full bg-transparent border-none text-slate-300 px-2 py-1 focus:ring-1 focus:ring-blue-500 rounded"
                            placeholder="e.g. 10"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            id={`ic50-input-${i}-1`}
                            type="number"
                            value={row.response}
                            onChange={(e) => handleRowChange(i, "response", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, i, 1)}
                            onPaste={(e) => handleTablePaste(e, i, 1)}
                            className="w-full bg-transparent border-none text-slate-300 px-2 py-1 focus:ring-1 focus:ring-blue-500 rounded"
                            placeholder="e.g. 50"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            id={`ic50-input-${i}-2`}
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
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} /> Analyze
                </button>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <textarea
                  className="w-full h-16 bg-slate-900/50 border border-slate-700 rounded p-2 text-xs text-slate-400 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Or click here and paste from Excel (Conc, Response, Group)..."
                  onPaste={handlePaste}
                  onChange={() => {}}
                  value={pastedData}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Visualization & Stats */}
          <div id="ic50-export-container" className="lg:col-span-2 space-y-6">
            
            {/* Chart Card */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 shadow-xl backdrop-blur-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">Dose-Response Curve</h2>
                {results.length > 0 && (
                  <button
                    onClick={downloadPlot}
                    className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded text-slate-300 transition-colors flex items-center gap-2 text-sm"
                    title="Download Plot as PNG"
                  >
                    <Camera size={16} /> Export Plot
                  </button>
                )}
              </div>
              
              <div className="h-96 w-full relative bg-slate-900/20 rounded-lg p-2">
                {results.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                    Add data and click Analyze to generate plot
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartPoints} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="x" 
                        type="number" 
                        scale="log" 
                        domain={[minDomain, maxDomain]} 
                        ticks={ticks.length > 0 ? ticks : undefined}
                        tickFormatter={(val) => val >= 1 ? val.toString() : val.toExponential(1)}
                        stroke="#94a3b8" 
                        tick={{ fill: '#94a3b8', fontSize: 12 }} 
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        tick={{ fill: '#94a3b8', fontSize: 12 }} 
                        label={{ value: 'Response', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                        labelFormatter={(val) => `Concentration: ${val}`}
                      />
                      <Legend verticalAlign="top" height={36} />
                      
                      {results.map((res, i) => (
                        <React.Fragment key={res.group}>
                          {/* Scatter Points */}
                          <Scatter 
                            name={`${res.group} (Data)`} 
                            dataKey={`${res.group}_scatter`} 
                            fill={getGroupColor(i)} 
                            isAnimationActive={false}
                            legendType="circle"
                          />
                          {/* Fitted Curve */}
                          <Line 
                            type="monotone" 
                            name={`${res.group} (Fit)`} 
                            dataKey={`${res.group}_curve`} 
                            stroke={getGroupColor(i)} 
                            strokeWidth={3} 
                            dot={false}
                            activeDot={false}
                            isAnimationActive={true}
                            connectNulls={true}
                            legendType="plainline"
                          />
                        </React.Fragment>
                      ))}
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Stats Card */}
            {results.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 shadow-xl backdrop-blur-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">4PL Regression Results</h2>
                  <button
                    onClick={exportCSV}
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
                  >
                    <Download size={14} /> Export CSV
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase text-slate-400 border-b border-slate-700/50">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Group</th>
                        <th className="px-4 py-3 font-semibold">IC50</th>
                        <th className="px-4 py-3 font-semibold">Hill Slope</th>
                        <th className="px-4 py-3 font-semibold">R²</th>
                        <th className="px-4 py-3 font-semibold">Min</th>
                        <th className="px-4 py-3 font-semibold">Max</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((res, i) => (
                        <tr key={res.group} className="border-b border-slate-700/30">
                          <td className="px-4 py-3 font-medium text-slate-200 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getGroupColor(i) }}></span>
                            {res.group}
                          </td>
                          <td className="px-4 py-3">
                            {res.ic50 !== null ? (
                              <span className="font-mono text-emerald-400 font-bold">{res.ic50.toFixed(4)}</span>
                            ) : (
                              <span className="text-slate-500">Failed</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-300">{res.hillSlope?.toFixed(3) || "-"}</td>
                          <td className="px-4 py-3 font-mono text-slate-300">{res.rSquared?.toFixed(4) || "-"}</td>
                          <td className="px-4 py-3 font-mono text-slate-300">{res.min?.toFixed(2) || "-"}</td>
                          <td className="px-4 py-3 font-mono text-slate-300">{res.max?.toFixed(2) || "-"}</td>
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

function BeakerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
      <path d="M4.5 3h15"></path>
      <path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"></path>
      <path d="M6 14h12"></path>
    </svg>
  );
}
