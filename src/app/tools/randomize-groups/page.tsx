'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Dices, Download, Info, Plus, Trash2, X, Upload } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ErrorBar,
  ScatterChart, Scatter, Cell, ZAxis, Legend, ComposedChart, Customized
} from 'recharts';
import { simpleRandomization, stratifiedRandomization, calculateGroupStats } from '@/components/randomize-groups/RandomizationLogic';
import { parseFile } from '@/components/randomize-groups/DataParser';

interface MouseRow {
  id: string;
  mouseId: string;
  characteristics: string[];
}

const GROUP_COLORS = [
  'text-blue-400 bg-blue-900/20 border-blue-500/30',
  'text-emerald-400 bg-emerald-900/20 border-emerald-500/30',
  'text-purple-400 bg-purple-900/20 border-purple-500/30',
  'text-amber-400 bg-amber-900/20 border-amber-500/30',
  'text-rose-400 bg-rose-900/20 border-rose-500/30',
  'text-cyan-400 bg-cyan-900/20 border-cyan-500/30',
  'text-orange-400 bg-orange-900/20 border-orange-500/30',
  'text-pink-400 bg-pink-900/20 border-pink-500/30',
  'text-lime-400 bg-lime-900/20 border-lime-500/30',
  'text-indigo-400 bg-indigo-900/20 border-indigo-500/30',
];

const GROUP_ROW_COLORS = [
  'bg-blue-900/10 hover:bg-blue-900/20',
  'bg-emerald-900/10 hover:bg-emerald-900/20',
  'bg-purple-900/10 hover:bg-purple-900/20',
  'bg-amber-900/10 hover:bg-amber-900/20',
  'bg-rose-900/10 hover:bg-rose-900/20',
  'bg-cyan-900/10 hover:bg-cyan-900/20',
  'bg-orange-900/10 hover:bg-orange-900/20',
  'bg-pink-900/10 hover:bg-pink-900/20',
  'bg-lime-900/10 hover:bg-lime-900/20',
  'bg-indigo-900/10 hover:bg-indigo-900/20',
];

const HEX_COLORS = [
  '#60a5fa', '#34d399', '#c084fc', '#fbbf24', '#fb7185', 
  '#22d3ee', '#fb923c', '#f472b6', '#a3e635', '#818cf8'
];

const getGroupColor = (groupName: string, allGroups: string[]) => {
  const idx = allGroups.indexOf(groupName);
  if (idx === -1) return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
  return GROUP_COLORS[idx % GROUP_COLORS.length];
};

const getGroupRowColor = (groupName: string, allGroups: string[]) => {
  const idx = allGroups.indexOf(groupName);
  if (idx === -1) return 'bg-[var(--bg-secondary)]/10 hover:bg-[var(--bg-secondary)]/30';
  return GROUP_ROW_COLORS[idx % GROUP_ROW_COLORS.length];
};

const getGroupHex = (groupName: string, allGroups: string[]) => {
  const idx = allGroups.indexOf(groupName);
  if (idx === -1) return '#9ca3af';
  return HEX_COLORS[idx % HEX_COLORS.length];
};

// Seeded pseudo-random for stable jitter between renders
const seededRandom = (seed: number) => {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
};

const BoxPlotShape = (props: any) => {
  const { x, y, width, height, payload, allGroups } = props;
  if (isNaN(y) || isNaN(height)) return null;

  const { group, q1, median, q3, min, max } = payload;
  const fill = getGroupHex(group, allGroups);

  // Recharts gives us the exact pixel rect for [q1, q3].
  // We can derive the pixel-to-value ratio to draw the whiskers!
  const valueRange = Math.abs(q3 - q1);
  const pixelsPerUnit = valueRange === 0 ? 0 : height / valueRange;
  
  // y is the top of the bar (Q3, since SVG y grows downwards and Q3 > Q1)
  const topValue = Math.max(q1, q3);
  
  const getY = (val: number) => y + (topValue - val) * pixelsPerUnit;

  const yMin = getY(min);
  const yMax = getY(max);
  const yMed = getY(median);
  const cx = x + width / 2;
  const halfW = width / 2;

  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* Whisker vertical line */}
      <line x1={cx} y1={yMax} x2={cx} y2={yMin} stroke={fill} strokeWidth={1.5} strokeOpacity={0.6} />
      {/* Upper whisker cap */}
      <line x1={cx - halfW * 0.4} y1={yMax} x2={cx + halfW * 0.4} y2={yMax} stroke={fill} strokeWidth={2} strokeOpacity={0.8} />
      {/* Lower whisker cap */}
      <line x1={cx - halfW * 0.4} y1={yMin} x2={cx + halfW * 0.4} y2={yMin} stroke={fill} strokeWidth={2} strokeOpacity={0.8} />
      {/* IQR box */}
      <rect x={x} y={y} width={width} height={height} fill={fill} fillOpacity={0.15} stroke={fill} strokeWidth={2} strokeOpacity={0.9} rx={3} />
      {/* Median line */}
      <line x1={x} y1={yMed} x2={x + width} y2={yMed} stroke={fill} strokeWidth={3} strokeOpacity={1} />
    </g>
  );
};

const JitterScatterShape = (props: any) => {
  const { cx, cy, payload, allGroups, index, setHoveredDot, hoveredDot } = props;
  if (cx === undefined || cy === undefined || isNaN(cy)) return null;

  // Jitter based on index
  const jitter = (seededRandom(index) - 0.5) * 30; // 30px spread
  const fill = getGroupHex(payload.group, allGroups);
  const isHovered = hoveredDot === index;

  return (
    <circle
      cx={cx + jitter}
      cy={cy}
      r={isHovered ? 7 : 5}
      fill={fill}
      fillOpacity={isHovered ? 1 : 0.75}
      stroke={isHovered ? '#fff' : fill}
      strokeWidth={isHovered ? 2 : 1}
      style={{ cursor: 'pointer', transition: 'r 0.1s, fill-opacity 0.1s' }}
      onMouseEnter={() => setHoveredDot(index)}
      onMouseLeave={() => setHoveredDot(null)}
    />
  );
};

export default function RandomizeGroupsPage() {
  // Groups State (Tag Input)
  const [groups, setGroups] = useState<string[]>(['Group 1', 'Group 2']);
  const [groupInput, setGroupInput] = useState('');

  // Column State
  const [covariateCols, setCovariateCols] = useState<string[]>(['Characteristic 1']);

  // Data Table State
  const [rows, setRows] = useState<MouseRow[]>(
    Array.from({ length: 10 }, (_, i) => ({
      id: crypto.randomUUID(),
      mouseId: `M${i + 1}`,
      characteristics: ['']
    }))
  );

  // Results State
  const [results, setResults] = useState<Record<string, any>[] | null>(null);
  const [isStratified, setIsStratified] = useState(false);
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);

  // Group Tag Handlers
  const addGroup = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !groups.includes(trimmed)) {
      setGroups([...groups, trimmed]);
    }
  };

  const handleGroupKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const parts = groupInput.split(',').map(s => s.trim()).filter(Boolean);
      parts.forEach(addGroup);
      setGroupInput('');
    }
  };

  const removeGroup = (groupToRemove: string) => {
    setGroups(groups.filter(g => g !== groupToRemove));
  };

  // Column Handlers
  const addCovariateColumn = () => {
    if (covariateCols.length >= 5) {
      alert("Maximum of 5 covariates allowed.");
      return;
    }
    setCovariateCols([...covariateCols, `Characteristic ${covariateCols.length + 1}`]);
    setRows(rows.map(r => ({ ...r, characteristics: [...r.characteristics, ''] })));
  };

  const removeCovariateColumn = (colIndex: number) => {
    if (covariateCols.length <= 1) return;
    const newCols = [...covariateCols];
    newCols.splice(colIndex, 1);
    setCovariateCols(newCols);
    setRows(rows.map(r => {
      const newChars = [...r.characteristics];
      newChars.splice(colIndex, 1);
      return { ...r, characteristics: newChars };
    }));
  };

  // Table Handlers
  const handleRowChange = (id: string, field: 'mouseId' | number, value: string) => {
    setRows(rows.map(row => {
      if (row.id !== id) return row;
      if (field === 'mouseId') return { ...row, mouseId: value };
      const newChars = [...row.characteristics];
      newChars[field as number] = value;
      return { ...row, characteristics: newChars };
    }));
  };

  const addRow = () => {
    setRows([...rows, { id: crypto.randomUUID(), mouseId: `M${rows.length + 1}`, characteristics: Array(covariateCols.length).fill('') }]);
  };

  const removeRow = (id: string) => {
    setRows(rows.filter(row => row.id !== id));
  };

  const handleTableKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, field: 'mouseId' | number) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (rowIndex > 0) {
        const id = field === 'mouseId' ? `input-mouseId-${rowIndex - 1}` : `input-char-${rowIndex - 1}-${field}`;
        document.getElementById(id)?.focus();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (rowIndex < rows.length - 1) {
        const id = field === 'mouseId' ? `input-mouseId-${rowIndex + 1}` : `input-char-${rowIndex + 1}-${field}`;
        document.getElementById(id)?.focus();
      }
    }
  };

  const clearTable = () => {
    if (window.confirm("Are you sure you want to clear all data?")) {
      setRows([]);
      setResults(null);
    }
  };

  // Paste handling for table
  const handlePaste = useCallback((e: React.ClipboardEvent, rowIndex: number, field: 'mouseId' | number) => {
    const paste = e.clipboardData.getData('text');
    if (!paste) return;

    // Split by newlines, then by tabs or commas
    const lines = paste.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length <= 1 && !paste.includes('\t') && !paste.includes(',')) {
      return; // Single cell paste, let default behavior happen
    }

    e.preventDefault();
    
    const newRows = [...rows];
    let currentRowIdx = rowIndex;

    // Determine how many columns to expand if pasting many columns
    const maxColsInPaste = Math.max(...lines.map(l => l.split(/[\t,]/).length));
    const isPastingIntoMouseId = field === 'mouseId';
    const neededCols = isPastingIntoMouseId ? maxColsInPaste - 1 : maxColsInPaste + (field as number);
    
    let currentCovariateCols = [...covariateCols];
    while (currentCovariateCols.length < neededCols && currentCovariateCols.length < 5) {
      currentCovariateCols.push(`Characteristic ${currentCovariateCols.length + 1}`);
    }
    setCovariateCols(currentCovariateCols);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const cells = line.split(/[\t,]/).map(c => c.trim());
      
      // If we ran out of existing rows, create a new one
      if (currentRowIdx >= newRows.length) {
        newRows.push({ id: crypto.randomUUID(), mouseId: '', characteristics: Array(currentCovariateCols.length).fill('') });
      } else {
        // Ensure row has enough characteristic slots
        while (newRows[currentRowIdx].characteristics.length < currentCovariateCols.length) {
          newRows[currentRowIdx].characteristics.push('');
        }
      }

      if (isPastingIntoMouseId) {
        newRows[currentRowIdx].mouseId = cells[0] || '';
        for (let c = 1; c < cells.length && c - 1 < currentCovariateCols.length; c++) {
          newRows[currentRowIdx].characteristics[c - 1] = cells[c] || '';
        }
      } else {
        const startIdx = field as number;
        for (let c = 0; c < cells.length && startIdx + c < currentCovariateCols.length; c++) {
          newRows[currentRowIdx].characteristics[startIdx + c] = cells[c] || '';
        }
      }
      
      currentRowIdx++;
    }
    
    setRows(newRows);
  }, [rows, covariateCols]);

  // Bulk Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await parseFile(file);
      if (result.data.length > 0) {
        const idCol = result.headers[0];
        const covCols = result.headers.slice(1, 6); // Up to 5 covariates
        
        if (covCols.length > 0) {
          setCovariateCols(covCols);
        } else {
          setCovariateCols(['Characteristic 1']);
        }

        const newRows = result.data.map((row, idx) => {
          const chars = covCols.length > 0 
            ? covCols.map(col => String(row[col] ?? '')) 
            : [''];
          return {
            id: crypto.randomUUID(),
            mouseId: String(row[idCol] || `M${idx+1}`),
            characteristics: chars
          };
        }).filter(r => r.mouseId.trim() !== '' || r.characteristics.some(c => c.trim() !== ''));
        
        setRows(newRows);
        setResults(null);
      }
    } catch (err) {
      alert("Error parsing file.");
    }
    // Reset file input
    e.target.value = '';
  };

  const runRandomization = () => {
    if (groups.length < 2) {
      alert("Please define at least 2 groups.");
      return;
    }

    const validRows = rows.filter(r => r.mouseId.trim() !== '');
    if (validRows.length === 0) {
      alert("Please enter some mice IDs.");
      return;
    }

    // Determine which covariates are actually being used (have valid numbers in at least one row)
    const activeCovariateIndices = covariateCols.map((_, idx) => idx).filter(idx => 
      validRows.some(r => r.characteristics[idx].trim() !== '' && !isNaN(Number(r.characteristics[idx])))
    );
    
    if (activeCovariateIndices.length > 0) {
      // Stratified
      const dataToStratify = validRows.map(r => {
        const obj: Record<string, any> = { "Mouse ID": r.mouseId, _rawRow: r };
        activeCovariateIndices.forEach(idx => {
          obj[covariateCols[idx]] = Number(r.characteristics[idx]) || 0;
        });
        return obj;
      });
      
      const activeCovariateKeys = activeCovariateIndices.map(idx => covariateCols[idx]);
      const res = stratifiedRandomization(dataToStratify, groups, activeCovariateKeys);
      
      // Map back to format
      const formatted = res.map(r => {
        const formattedRow: Record<string, any> = {
          "Mouse ID": r["Mouse ID"],
        };
        activeCovariateIndices.forEach(idx => {
          formattedRow[covariateCols[idx]] = r._rawRow.characteristics[idx];
        });
        formattedRow["Assigned Group"] = r.Group;
        return formattedRow;
      });
      setResults(formatted);
      setIsStratified(true);
    } else {
      // Simple
      const assignments = simpleRandomization(validRows.length, groups);
      const res = validRows.map((r, idx) => ({
        "Mouse ID": r.mouseId,
        "Assigned Group": assignments[idx]
      }));
      setResults(res);
      setIsStratified(false);
    }
  };

  const exportCSV = () => {
    if (!results || results.length === 0) return;
    const headers = Object.keys(results[0]);
    const csvContent = [
      headers.join(','),
      ...results.map(row => headers.map(h => `"${row[h] !== undefined ? row[h] : ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "randomization_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats for multiple covariates
  const activeCovariatesInResults = useMemo(() => {
    if (!results || !isStratified) return [];
    const headers = Object.keys(results[0]);
    return headers.filter(h => h !== 'Mouse ID' && h !== 'Assigned Group');
  }, [results, isStratified]);

  const statsDataDict = useMemo(() => {
    if (!results || !isStratified) return {};
    const dict: Record<string, any[]> = {};
    for (const cov of activeCovariatesInResults) {
      dict[cov] = calculateGroupStats(results, cov);
    }
    return dict;
  }, [results, isStratified, activeCovariatesInResults]);

  const scatterData = useMemo(() => {
    if (!results || !isStratified) return [];
    
    // For 2 covariates, we do a 2D scatter plot
    if (activeCovariatesInResults.length === 2) {
      const cov1 = activeCovariatesInResults[0];
      const cov2 = activeCovariatesInResults[1];
      return results.map(r => ({
        group: r['Assigned Group'],
        x: Number(r[cov1]),
        y: Number(r[cov2]),
        id: r['Mouse ID']
      })).filter(r => !isNaN(r.x) && !isNaN(r.y));
    }
    
    // Otherwise just 1D distribution of the primary covariate
    const primaryCov = activeCovariatesInResults[0];
    return results.map(r => ({
      group: r['Assigned Group'],
      value: Number(r[primaryCov]),
      id: r['Mouse ID']
    })).filter(r => !isNaN(r.value));
  }, [results, isStratified, activeCovariatesInResults]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-8 px-4 sm:px-6 lg:px-8 font-sans flex flex-col items-center justify-start">
      <div className="max-w-6xl w-full mb-6 flex justify-between items-center">
        <Link href="/#calculators" className="inline-flex items-center text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition-colors text-sm font-medium">
          <ArrowLeft size={16} className="mr-2" />
          Back to Lab Calculators
        </Link>
      </div>

      <div className="max-w-6xl w-full mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-[var(--text-primary)] tracking-tight text-glow-blue mb-3">
          <Dices className="inline-block mr-3 mb-1 text-blue-500" size={40} />
          Group Randomization
        </h1>
        <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
          Assign subjects into experimental groups evenly. Use custom groups, paste your data directly, and automatically balance on a covariate.
        </p>
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Data Input */}
        <div className="lg:col-span-6 space-y-6">
          {/* Groups Config */}
          <div className="glass-card p-6 border-t-4 border-t-purple-500">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center">
              1. Define Groups
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-3">Type a group name and press Enter. You can paste multiple names separated by commas.</p>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {groups.map(g => (
                <span key={g} className="px-3 py-1 bg-purple-900/30 text-purple-300 rounded-full text-sm font-medium border border-purple-800/50 flex items-center gap-1">
                  {g}
                  <button onClick={() => removeGroup(g)} className="hover:text-red-400 transition-colors ml-1"><X size={14} /></button>
                </span>
              ))}
            </div>
            <input 
              type="text" 
              value={groupInput}
              onChange={e => setGroupInput(e.target.value)}
              onKeyDown={handleGroupKeyDown}
              placeholder="e.g. Vehicle, Low Dose, High Dose..."
              className="w-full p-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:border-purple-500 focus:outline-none text-sm"
            />
          </div>

          {/* Data Table Config */}
          <div className="glass-card p-6 border-t-4 border-t-blue-500 flex flex-col h-[600px]">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center">
                2. Enter Data
              </h2>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer text-xs text-blue-400 hover:text-blue-300 flex items-center transition-colors">
                  <Upload size={14} className="mr-1" /> Bulk Upload CSV/Excel
                  <input type="file" className="hidden" accept=".csv,.txt,.xls,.xlsx" onChange={handleFileUpload} />
                </label>
                <button onClick={clearTable} className="text-xs text-red-400 hover:text-red-300 flex items-center">
                  <Trash2 size={14} className="mr-1" /> Clear
                </button>
              </div>
            </div>
            
            <div className="bg-blue-900/20 border border-blue-500/20 rounded p-3 mb-4 text-xs text-blue-200 flex justify-between items-center">
              <div>
                <Info size={14} className="inline mr-1 -mt-0.5" />
                You can paste columns directly from Excel!
              </div>
              <button onClick={addCovariateColumn} className="text-blue-300 hover:text-blue-200 border border-blue-500/50 px-2 py-1 rounded bg-blue-900/30 flex items-center">
                <Plus size={12} className="mr-1" /> Add Covariate
              </button>
            </div>

            <div className="flex-grow overflow-auto border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-secondary)]/30 relative">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-[var(--bg-secondary)] sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-3 font-semibold text-[var(--text-secondary)] border-b border-[var(--border-subtle)] min-w-[120px]">Mouse ID</th>
                    {covariateCols.map((col, cIdx) => (
                      <th key={cIdx} className="p-3 font-semibold text-[var(--text-secondary)] border-b border-[var(--border-subtle)] min-w-[150px] relative group">
                        {col} (Opt.)
                        {covariateCols.length > 1 && (
                          <button onClick={() => removeCovariateColumn(cIdx)} className="absolute right-2 top-3 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X size={14} />
                          </button>
                        )}
                      </th>
                    ))}
                    <th className="w-10 border-b border-[var(--border-subtle)]"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.id} className="border-b border-[var(--border-subtle)]/30 hover:bg-[var(--bg-secondary)]/50 group">
                      <td className="p-0 border-r border-[var(--border-subtle)]/30">
                        <input 
                          id={`input-mouseId-${idx}`}
                          type="text" 
                          value={row.mouseId} 
                          onChange={(e) => handleRowChange(row.id, 'mouseId', e.target.value)}
                          onKeyDown={(e) => handleTableKeyDown(e, idx, 'mouseId')}
                          onPaste={(e) => handlePaste(e, idx, 'mouseId')}
                          className="w-full h-full p-3 bg-transparent focus:outline-none focus:bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                          placeholder={`M${idx+1}`}
                        />
                      </td>
                      {covariateCols.map((_, cIdx) => (
                        <td key={cIdx} className="p-0 border-r border-[var(--border-subtle)]/30">
                          <input 
                            id={`input-char-${idx}-${cIdx}`}
                            type="text" 
                            value={row.characteristics[cIdx] || ''} 
                            onChange={(e) => handleRowChange(row.id, cIdx, e.target.value)}
                            onKeyDown={(e) => handleTableKeyDown(e, idx, cIdx)}
                            onPaste={(e) => handlePaste(e, idx, cIdx)}
                            className="w-full h-full p-3 bg-transparent focus:outline-none focus:bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                            placeholder="e.g. 150.5"
                          />
                        </td>
                      ))}
                      <td className="p-0 text-center align-middle">
                        <button onClick={() => removeRow(row.id)} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={addRow} className="w-full p-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] flex items-center justify-center transition-colors">
                <Plus size={16} className="mr-1" /> Add Row
              </button>
            </div>
            
            <button onClick={runRandomization} className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex justify-center items-center shadow-lg">
              <Dices className="mr-2" size={20} /> Generate Randomization
            </button>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-6">
          <div className="glass-card p-6 h-full flex flex-col">
            {!results ? (
              <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] py-20">
                <Dices size={48} className="mb-4 opacity-30" />
                <p className="text-lg mb-2">Ready to Randomize</p>
                <p className="text-sm opacity-70 text-center max-w-sm">Enter your mice and define your groups on the left, then click Generate to assign them.</p>
              </div>
            ) : (
              <div className="animate-fade-in flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Results</h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1 flex flex-wrap items-center gap-2">
                      Mode: <span className="text-blue-400 font-medium">{isStratified ? "Structured (Covariate Balanced)" : "Simple Randomization"}</span>
                      {isStratified && <span className="text-[10px] bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">Variance-Minimized (10,000 iter)</span>}
                    </p>
                  </div>
                  <button onClick={exportCSV} className="text-sm flex items-center bg-[var(--bg-secondary)] hover:bg-gray-700 text-white px-4 py-2 rounded-lg border border-[var(--border-subtle)] transition-colors">
                    <Download size={16} className="mr-2" /> Export CSV
                  </button>
                </div>

                {/* Optional Charts */}
                {isStratified && activeCovariatesInResults.length > 0 && (
                  <div className="flex flex-col gap-4 mb-6">
                    {/* Box Plot + Scatter Chart */}
                    <div className="relative h-72 w-full bg-[var(--bg-secondary)]/30 rounded-xl p-3 border border-[var(--border-subtle)] flex-shrink-0">
                      <h3 className="text-xs font-semibold text-[var(--text-secondary)] text-center mb-1">
                        {activeCovariatesInResults.length === 2 ? `2D Distribution: ${activeCovariatesInResults[0]} vs ${activeCovariatesInResults[1]}` : `Subject Distribution & Stats: ${activeCovariatesInResults[0]}`}
                      </h3>
                      <ResponsiveContainer width="100%" height="100%">
                        {activeCovariatesInResults.length === 2 ? (
                          <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="x" type="number" name={activeCovariatesInResults[0]} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} domain={['auto', 'auto']} />
                            <YAxis dataKey="y" type="number" name={activeCovariatesInResults[1]} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} domain={['auto', 'auto']} width={35} />
                            <ZAxis dataKey="id" type="category" name="Mouse ID" />
                            <RechartsTooltip 
                              cursor={{ strokeDasharray: '3 3' }}
                              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                              formatter={(val: any, name: any, props: any) => {
                                return [Number(val).toFixed(2), name];
                              }}
                              labelFormatter={() => ''}
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-slate-800 border border-slate-600 p-2 rounded shadow-lg text-xs">
                                      <p className="font-bold text-white mb-1">Mouse ID: {data.id}</p>
                                      <p className="text-slate-300">Group: {data.group}</p>
                                      <p className="text-slate-300">{activeCovariatesInResults[0]}: {Number(data.x).toFixed(2)}</p>
                                      <p className="text-slate-300">{activeCovariatesInResults[1]}: {Number(data.y).toFixed(2)}</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Scatter name="Mice" data={scatterData}>
                              {scatterData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getGroupHex(entry.group, groups)} />
                              ))}
                            </Scatter>
                          </ScatterChart>
                        ) : (
                          <ComposedChart
                            data={statsDataDict[activeCovariatesInResults[0]].map((d: any) => ({ ...d, iqr: [d.q1, d.q3] }))}
                            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                              dataKey="group"
                              type="category"
                              allowDuplicatedCategory={false}
                              stroke="#94a3b8"
                              tick={{ fill: '#94a3b8', fontSize: 11 }}
                              axisLine={{ stroke: '#475569' }}
                              tickLine={false}
                            />
                            <YAxis
                              stroke="#94a3b8"
                              tick={{ fill: '#94a3b8', fontSize: 10 }}
                              domain={(() => {
                                const cov = activeCovariatesInResults[0];
                                const stats = statsDataDict[cov];
                                if (!stats || stats.length === 0) return ['auto', 'auto'];
                                const allMin = Math.min(...stats.map((s: any) => s.min));
                                const allMax = Math.max(...stats.map((s: any) => s.max));
                                const pad = (allMax - allMin) * 0.1 || 1;
                                return [allMin - pad, allMax + pad];
                              })()}
                              width={40}
                              axisLine={{ stroke: '#475569' }}
                              tickLine={false}
                            />
                            {/* Draws the IQR box and whiskers for each group */}
                            <Bar 
                              dataKey="iqr" 
                              shape={<BoxPlotShape allGroups={groups} />} 
                              isAnimationActive={false} 
                              barSize={50}
                            />
                            
                            {/* Draws the jittered scatter dots */}
                            <Scatter 
                              data={scatterData} 
                              dataKey="value" 
                              shape={<JitterScatterShape allGroups={groups} setHoveredDot={setHoveredDot} hoveredDot={hoveredDot} />} 
                              isAnimationActive={false} 
                            />
                          </ComposedChart>
                        )}
                      </ResponsiveContainer>

                      {/* Hovered dot tooltip */}
                      {hoveredDot !== null && scatterData[hoveredDot] && (() => {
                        const d = scatterData[hoveredDot] as any;
                        return (
                          <div className="absolute top-2 right-2 bg-slate-800 border border-slate-600 p-2 rounded shadow-lg text-xs pointer-events-none z-20">
                            <p className="font-bold text-white mb-1">Mouse ID: {d.id}</p>
                            <p className="text-slate-300">Group: {d.group}</p>
                            {'value' in d && <p className="text-slate-300">Value: {Number(d.value).toFixed(2)}</p>}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Result Table */}
                <div className="flex-grow overflow-auto border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-secondary)]/20 min-h-[250px]">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-[var(--bg-secondary)] sticky top-0 z-10 shadow-sm">
                      <tr>
                        {Object.keys(results[0]).map(key => (
                          <th key={key} className="p-3 font-semibold text-[var(--text-secondary)] border-b border-[var(--border-subtle)] whitespace-nowrap">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, idx) => {
                        const rowColorClass = getGroupRowColor(r['Assigned Group'], groups);
                        return (
                          <tr key={idx} className={`border-b border-[var(--border-subtle)]/50 ${rowColorClass}`}>
                            {Object.keys(r).map(key => {
                            const isGroupCol = key === 'Assigned Group';
                            const groupColorClass = isGroupCol ? getGroupColor(r[key], groups) : '';
                            return (
                              <td key={key} className={`p-3 text-[var(--text-primary)] whitespace-nowrap`}>
                                {isGroupCol ? (
                                  <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${groupColorClass}`}>
                                    {r[key]}
                                  </span>
                                ) : (
                                  r[key]
                                )}
                              </td>
                            );
                          })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Result Stats Summary */}
                {isStratified && activeCovariatesInResults.map(cov => (
                  <div key={cov} className="mt-4">
                    <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase">{cov} Stats</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {statsDataDict[cov].map((stat: any) => {
                        const colorClass = getGroupColor(stat.group, groups);
                        return (
                          <div key={stat.group} className={`p-2 rounded-lg border text-center ${colorClass}`}>
                            <p className="text-[10px] font-medium mb-0.5 truncate opacity-80">{stat.group}</p>
                            <p className="text-sm font-bold">{stat.count} mice</p>
                            <p className="text-[10px] mt-0.5 opacity-90">Avg: {stat.mean.toFixed(2)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                {isStratified && (
                  <p className="text-[10px] text-[var(--text-secondary)] mt-6 text-center opacity-60">
                    * The randomization engine uses a <strong>Variance Minimization</strong> algorithm. It mathematically equalizes all covariates using Z-scores, evaluates 10,000 random permutations, and strictly selects the one that produces the lowest composite variance between the group means.
                  </p>
                )}
                
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
