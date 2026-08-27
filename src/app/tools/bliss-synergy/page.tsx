"use client";

import React, { useState, useRef } from "react";
import { 
  BarChart, 
  Bar, 
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
  BlissDataRow, 
  BlissAnalysisResult, 
  calculateBliss 
} from "@/components/bliss-synergy/BlissLogic";
import { 
  Activity, 
  Upload, 
  Plus, 
  Trash2, 
  RefreshCw,
  Camera,
  Download,
  Combine,
  ChevronLeft
} from "lucide-react";

export default function BlissSynergy() {
  const [activeRows, setActiveRows] = useState<any[]>([
    { id: "Dose Pair 1", drugAInhibition: "20", drugBInhibition: "30", comboInhibition: "60" },
    { id: "Dose Pair 2", drugAInhibition: "40", drugBInhibition: "40", comboInhibition: "95" }, // Synergy
    { id: "Dose Pair 3", drugAInhibition: "50", drugBInhibition: "50", comboInhibition: "75" }, // Additive (E = 0.5+0.5 - 0.25 = 0.75)
    { id: "Dose Pair 4", drugAInhibition: "80", drugBInhibition: "20", comboInhibition: "70" }, // Antagonism
  ]);

  const [pastedData, setPastedData] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [results, setResults] = useState<BlissAnalysisResult | null>(null);

  const handleRowChange = (index: number, field: string, value: string) => {
    const newRows = [...activeRows];
    newRows[index][field] = value;
    setActiveRows(newRows);
  };

  const addRow = () => {
    setActiveRows([...activeRows, { id: "", drugAInhibition: "", drugBInhibition: "", comboInhibition: "" }]);
  };

  const removeRow = (index: number) => {
    const newRows = [...activeRows];
    newRows.splice(index, 1);
    if (newRows.length === 0) {
      newRows.push({ id: "", drugAInhibition: "", drugBInhibition: "", comboInhibition: "" });
    }
    setActiveRows(newRows);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = document.getElementById(`bliss-input-${rowIndex - 1}-${colIndex}`);
      if (prev) prev.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = document.getElementById(`bliss-input-${rowIndex + 1}-${colIndex}`);
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
    const keys = ["id", "drugAInhibition", "drugBInhibition", "comboInhibition"];
    
    for (let r = 0; r < lines.length; r++) {
      const cells = lines[r].split('\t');
      const targetRowIndex = startRowIndex + r;
      
      if (targetRowIndex >= newRows.length) {
        newRows.push({ id: "", drugAInhibition: "", drugBInhibition: "", comboInhibition: "" });
      }
      
      for (let c = 0; c < cells.length; c++) {
        const targetColIndex = startColIndex + c;
        if (targetColIndex < 4) {
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
      if (i === 0 && (cells[0].toLowerCase() === "id" || cells[0].toLowerCase().includes("dose"))) {
        return; 
      }
      if (cells.length >= 3) {
        parsedRows.push({
          id: cells[0]?.trim() || "",
          drugAInhibition: cells[1]?.trim() || "",
          drugBInhibition: cells[2]?.trim() || "",
          comboInhibition: cells[3]?.trim() || "",
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
        if (row.length >= 3) {
          parsedRows.push({
            id: row[0]?.toString() || "",
            drugAInhibition: row[1]?.toString() || "",
            drugBInhibition: row[2]?.toString() || "",
            comboInhibition: row[3]?.toString() || "",
          });
        }
      }

      if (parsedRows.length > 0) setActiveRows(parsedRows);
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const runAnalysis = () => {
    const cleanData: BlissDataRow[] = activeRows
      .map(row => ({
        id: row.id || "Unknown",
        drugAInhibition: parseFloat(row.drugAInhibition),
        drugBInhibition: parseFloat(row.drugBInhibition),
        comboInhibition: parseFloat(row.comboInhibition),
      }))
      .filter(row => !isNaN(row.drugAInhibition) && !isNaN(row.drugBInhibition) && !isNaN(row.comboInhibition));

    const out = calculateBliss(cleanData);
    setResults(out);
  };

  const downloadPlot = async () => {
    const exportContainer = document.getElementById("bliss-export-container");
    if (!exportContainer) return;

    try {
      const dataUrl = await toPng(exportContainer, {
        backgroundColor: '#0f172a',
        pixelRatio: 2,
        style: { transform: 'scale(1)', transformOrigin: 'top left' }
      });
      
      const link = document.createElement("a");
      link.download = "bliss_synergy_analysis.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export image", err);
    }
  };

  const exportCSV = () => {
    if (!results) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,DrugA_Inhibition_%,DrugB_Inhibition_%,Combo_Inhibition_%,Expected_Bliss_%,Synergy_Score,Interpretation\n";
    
    results.rows.forEach((r) => {
      const row = [
        r.id,
        r.drugAInhibition,
        r.drugBInhibition,
        r.comboInhibition,
        r.expectedBliss.toFixed(2),
        r.synergyScore.toFixed(2),
        r.interpretation
      ];
      csvContent += row.join(",") + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "bliss_synergy.csv");
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
            <Combine className="text-rose-500" />
            Bliss Synergy Calculator
          </h1>
          <p className="text-slate-400 mt-2">
            Calculate drug combination effects (Synergy/Antagonism) using the Bliss Independence model.
          </p>
        </header>

        {/* Algorithm Explanation */}
        <div className="bg-rose-900/20 border border-rose-500/30 rounded-lg p-4 text-sm text-rose-200/80 mb-2">
          <h3 className="text-rose-300 font-semibold mb-1">How this works:</h3>
          <p className="mb-2">
            The <strong>Bliss Independence Model</strong> assumes that two drugs act independently through completely different mechanisms. The expected combined effect (if they do not interact) is calculated probabilistically.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Expected Bliss:</strong> E<sub>A</sub> + E<sub>B</sub> - (E<sub>A</sub> &times; E<sub>B</sub>), where E is the fractional inhibition (0 to 1) of Drug A and Drug B alone.</li>
            <li><strong>Synergy Score:</strong> The difference between the <em>Observed Combination Inhibition</em> and the <em>Expected Bliss Inhibition</em>.</li>
            <li><strong>Interpretation:</strong> A positive score (&gt; 0) indicates <strong>Synergy</strong> (the drugs enhance each other). A negative score (&lt; 0) indicates <strong>Antagonism</strong> (the drugs block each other). Scores near 0 are <strong>Additive</strong>.</li>
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
                Input % Inhibition for Drug A, Drug B, and the Combination.
              </div>

              <div className="max-h-96 overflow-y-auto mb-4 border border-slate-700/50 rounded bg-slate-900/50">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-slate-800/80 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 font-medium">ID</th>
                      <th className="px-3 py-2 font-medium" title="Drug A % Inhibition">% A</th>
                      <th className="px-3 py-2 font-medium" title="Drug B % Inhibition">% B</th>
                      <th className="px-3 py-2 font-medium" title="Combination % Inhibition">% A+B</th>
                      <th className="px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRows.map((row, i) => (
                      <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="p-1">
                          <input
                            id={`bliss-input-${i}-0`}
                            type="text"
                            value={row.id}
                            onChange={(e) => handleRowChange(i, "id", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, i, 0)}
                            onPaste={(e) => handleTablePaste(e, i, 0)}
                            className="w-full bg-transparent border-none text-slate-300 px-1 py-1 focus:ring-1 focus:ring-blue-500 rounded"
                            placeholder="Pair 1"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            id={`bliss-input-${i}-1`}
                            type="number"
                            value={row.drugAInhibition}
                            onChange={(e) => handleRowChange(i, "drugAInhibition", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, i, 1)}
                            onPaste={(e) => handleTablePaste(e, i, 1)}
                            className="w-full bg-transparent border-none text-slate-300 px-1 py-1 focus:ring-1 focus:ring-blue-500 rounded"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            id={`bliss-input-${i}-2`}
                            type="number"
                            value={row.drugBInhibition}
                            onChange={(e) => handleRowChange(i, "drugBInhibition", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, i, 2)}
                            onPaste={(e) => handleTablePaste(e, i, 2)}
                            className="w-full bg-transparent border-none text-slate-300 px-1 py-1 focus:ring-1 focus:ring-blue-500 rounded"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            id={`bliss-input-${i}-3`}
                            type="number"
                            value={row.comboInhibition}
                            onChange={(e) => handleRowChange(i, "comboInhibition", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, i, 3)}
                            onPaste={(e) => handleTablePaste(e, i, 3)}
                            className="w-full bg-transparent border-none text-slate-300 px-1 py-1 focus:ring-1 focus:ring-blue-500 rounded"
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
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 rounded text-sm text-white font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} /> Calculate
                </button>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <textarea
                  className="w-full h-16 bg-slate-900/50 border border-slate-700 rounded p-2 text-xs text-slate-400 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Or click here and paste from Excel (ID, Drug A %, Drug B %, Combo %)..."
                  onPaste={handlePaste}
                  onChange={() => {}}
                  value={pastedData}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Visualization & Stats */}
          <div id="bliss-export-container" className="lg:col-span-2 space-y-6">
            
            {/* Chart Card */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 shadow-xl backdrop-blur-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">Synergy Scores</h2>
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
                    Add data and click Calculate to generate plot
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="id" 
                        stroke="#94a3b8" 
                        tick={{ fill: '#94a3b8', fontSize: 12 }} 
                        angle={-45}
                        textAnchor="end"
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        tick={{ fill: '#94a3b8', fontSize: 12 }} 
                        label={{ value: 'Bliss Synergy Score', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                        formatter={(value: any, name: string) => [Number(value).toFixed(2), name === 'synergyScore' ? 'Synergy Score' : name]}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      />
                      <ReferenceLine y={0} stroke="#94a3b8" />
                      <Bar dataKey="synergyScore" name="Synergy Score" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.synergyScore > 5 ? "#10b981" : entry.synergyScore < -5 ? "#ef4444" : "#94a3b8"} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              
              {results && (
                <div className="flex justify-center gap-6 mt-6">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div> Synergy (&gt; 5)
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <div className="w-3 h-3 rounded-full bg-slate-400"></div> Additive (-5 to 5)
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div> Antagonism (&lt; -5)
                  </div>
                </div>
              )}
            </div>

            {/* Stats Card */}
            {results && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 shadow-xl backdrop-blur-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">Results Summary</h2>
                  <button
                    onClick={exportCSV}
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
                  >
                    <Download size={14} /> Export CSV
                  </button>
                </div>
                
                <div className="overflow-x-auto max-h-[400px] border border-slate-700/50 rounded bg-slate-900/30">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-slate-800/80 sticky top-0 z-10 text-slate-400">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Identifier</th>
                        <th className="px-4 py-3 font-semibold text-right">Expected Effect</th>
                        <th className="px-4 py-3 font-semibold text-right">Observed Effect</th>
                        <th className="px-4 py-3 font-semibold text-right">Synergy Score</th>
                        <th className="px-4 py-3 font-semibold text-center">Interpretation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.rows.map((res, i) => (
                        <tr key={res.id + i} className="border-b border-slate-700/30">
                          <td className="px-4 py-3 font-medium text-slate-200">{res.id}</td>
                          <td className="px-4 py-3 font-mono text-slate-300 text-right">{res.expectedBliss.toFixed(2)}%</td>
                          <td className="px-4 py-3 font-mono text-slate-300 text-right">{res.comboInhibition.toFixed(2)}%</td>
                          <td className="px-4 py-3 font-mono text-slate-300 text-right font-bold">
                            {res.synergyScore > 0 ? '+' : ''}{res.synergyScore.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {res.interpretation === "Synergistic" && <span className="text-emerald-400 font-semibold px-2 py-1 bg-emerald-500/10 rounded">Synergistic</span>}
                            {res.interpretation === "Antagonistic" && <span className="text-red-400 font-semibold px-2 py-1 bg-red-500/10 rounded">Antagonistic</span>}
                            {res.interpretation === "Additive" && <span className="text-slate-400 font-medium px-2 py-1 bg-slate-700/50 rounded">Additive</span>}
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
