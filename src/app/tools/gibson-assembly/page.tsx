"use client";

import React, { useState } from "react";
import { Calculator, Plus, Trash2, Info, ArrowRight, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface Insert {
  id: string;
  name: string;
  length: number;
  concentration: number | "";
  ratio: number;
}

export default function GibsonAssemblyCalculator() {
  const [vectorLength, setVectorLength] = useState<number | "">(3000);
  const [vectorMass, setVectorMass] = useState<number | "">(100);
  const [vectorConcentration, setVectorConcentration] = useState<number | "">(50);

  const [inserts, setInserts] = useState<Insert[]>([
    { id: "1", name: "Insert 1", length: 1000, concentration: 50, ratio: 2 }
  ]);

  const addInsert = () => {
    const newId = (inserts.length + 1).toString();
    setInserts([
      ...inserts,
      { id: newId, name: `Insert ${newId}`, length: 1000, concentration: "", ratio: 2 }
    ]);
  };

  const removeInsert = (id: string) => {
    setInserts(inserts.filter(insert => insert.id !== id));
  };

  const updateInsert = (id: string, field: keyof Insert, value: any) => {
    setInserts(inserts.map(insert => 
      insert.id === id ? { ...insert, [field]: value } : insert
    ));
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center py-10 px-4 md:px-8">
      <div className="w-full max-w-5xl mb-8">
        <Link href="/tools/dna" className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 mb-4 transition-colors">
          <ChevronLeft size={16} className="mr-1" /> Back to DNA Tools
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
          <Calculator className="mr-3 text-emerald-400" size={32} />
          Gibson / HiFi Assembly Calculator
        </h1>
        <p className="text-slate-400">
          Calculate the exact mass (ng) and volume (µL) of vector and inserts required for a seamless cloning reaction (Gibson Assembly or NEBuilder HiFi).
        </p>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Input Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Vector Configuration */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-xl backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-white mb-4 border-b border-slate-700 pb-2">Vector Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Length (bp)</label>
                <input
                  type="number"
                  value={vectorLength}
                  onChange={(e) => setVectorLength(e.target.value ? Number(e.target.value) : "")}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="e.g. 3000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Target Mass (ng)</label>
                <input
                  type="number"
                  value={vectorMass}
                  onChange={(e) => setVectorMass(e.target.value ? Number(e.target.value) : "")}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="e.g. 50-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Concentration (ng/µL) <span className="text-slate-500 text-xs">Optional</span></label>
                <input
                  type="number"
                  value={vectorConcentration}
                  onChange={(e) => setVectorConcentration(e.target.value ? Number(e.target.value) : "")}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="e.g. 50"
                />
              </div>
            </div>
          </div>

          {/* Inserts Configuration */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
              <h2 className="text-xl font-semibold text-white">Inserts</h2>
              <button 
                onClick={addInsert}
                className="flex items-center text-sm bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-3 py-1.5 rounded-lg transition-colors font-medium"
              >
                <Plus size={16} className="mr-1" /> Add Insert
              </button>
            </div>

            <div className="space-y-4">
              {inserts.map((insert, index) => (
                <div key={insert.id} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 relative group">
                  {inserts.length > 1 && (
                    <button 
                      onClick={() => removeInsert(insert.id)}
                      className="absolute top-2 right-2 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  
                  <div className="mb-3 w-3/4">
                    <input
                      type="text"
                      value={insert.name}
                      onChange={(e) => updateInsert(insert.id, "name", e.target.value)}
                      className="bg-transparent border-b border-slate-700 text-emerald-400 font-medium px-1 py-1 focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="Insert Name"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Length (bp)</label>
                      <input
                        type="number"
                        value={insert.length}
                        onChange={(e) => updateInsert(insert.id, "length", e.target.value ? Number(e.target.value) : "")}
                        className="w-full bg-slate-800 border border-slate-700 rounded text-sm px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Molar Ratio (Insert:Vector)</label>
                      <input
                        type="number"
                        value={insert.ratio}
                        onChange={(e) => updateInsert(insert.id, "ratio", e.target.value ? Number(e.target.value) : "")}
                        className="w-full bg-slate-800 border border-slate-700 rounded text-sm px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        step="0.5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Conc (ng/µL) <span className="text-slate-500">Opt</span></label>
                      <input
                        type="number"
                        value={insert.concentration}
                        onChange={(e) => updateInsert(insert.id, "concentration", e.target.value ? Number(e.target.value) : "")}
                        className="w-full bg-slate-800 border border-slate-700 rounded text-sm px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300 flex items-start">
              <Info size={16} className="mr-2 mt-0.5 shrink-0" />
              <p>For 1-2 inserts, a molar ratio of 2:1 (Insert:Vector) is recommended. For 3+ inserts, a ratio of 3:1 is recommended.</p>
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="space-y-6">
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-xl backdrop-blur-sm sticky top-6">
            <h2 className="text-xl font-semibold text-white mb-4 border-b border-slate-700 pb-2">Reaction Mix</h2>
            
            {!vectorLength || !vectorMass ? (
              <div className="text-center py-10 text-slate-500">
                Please provide Vector Length and Target Mass to see results.
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Vector Result */}
                <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 flex justify-between items-center">
                  <div>
                    <span className="block text-sm font-medium text-slate-300">Vector</span>
                    {vectorConcentration && (
                      <span className="text-xs text-slate-500">{vectorConcentration} ng/µL</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="block text-lg font-bold text-white">{vectorMass} <span className="text-sm font-normal text-slate-400">ng</span></span>
                    {vectorConcentration ? (
                      <span className="text-sm text-emerald-400 font-medium">{(vectorMass / vectorConcentration).toFixed(2)} µL</span>
                    ) : (
                      <span className="text-sm text-slate-600">- µL</span>
                    )}
                  </div>
                </div>

                {/* Insert Results */}
                {inserts.map(insert => {
                  const isValid = insert.length && insert.ratio;
                  const mass = isValid ? (vectorMass * insert.length * insert.ratio) / vectorLength : 0;
                  const volume = (isValid && insert.concentration) ? mass / insert.concentration : null;

                  return (
                    <div key={`res-${insert.id}`} className="bg-slate-900 rounded-lg p-3 border border-slate-700 flex justify-between items-center">
                      <div>
                        <span className="block text-sm font-medium text-emerald-400">{insert.name}</span>
                        {insert.concentration && (
                          <span className="text-xs text-slate-500">{insert.concentration} ng/µL</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="block text-lg font-bold text-white">
                          {isValid ? mass.toFixed(1) : "0"} <span className="text-sm font-normal text-slate-400">ng</span>
                        </span>
                        {volume !== null ? (
                          <span className="text-sm text-emerald-400 font-medium">{volume.toFixed(2)} µL</span>
                        ) : (
                          <span className="text-sm text-slate-600">- µL</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Total Summary */}
                <div className="mt-6 pt-4 border-t border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Reaction Assembly</h3>
                  
                  {(() => {
                    let totalVol = 0;
                    let missingVol = false;
                    
                    if (vectorConcentration) totalVol += (vectorMass / vectorConcentration);
                    else missingVol = true;
                    
                    inserts.forEach(insert => {
                      if (insert.length && insert.ratio && insert.concentration) {
                        const mass = (vectorMass * insert.length * insert.ratio) / vectorLength;
                        totalVol += (mass / insert.concentration);
                      } else {
                        missingVol = true;
                      }
                    });

                    return (
                      <div className="bg-slate-900 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-slate-300">DNA Volume:</span>
                          <span className="font-mono text-white">
                            {missingVol ? "Need concentrations" : `${totalVol.toFixed(2)} µL`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-slate-300">Master Mix (2x):</span>
                          <span className="font-mono text-white">10.00 µL</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-700 border-dashed">
                          <span className="text-slate-300">ddH2O:</span>
                          <span className="font-mono text-blue-400 font-bold">
                            {missingVol ? "..." : `${Math.max(0, 10 - totalVol).toFixed(2)} µL`}
                          </span>
                        </div>
                        
                        {!missingVol && totalVol > 10 && (
                          <div className="mt-3 text-xs text-red-400 bg-red-900/20 border border-red-900/50 p-2 rounded">
                            DNA volume exceeds 10 µL. You must concentrate your DNA or scale up the reaction to 40 µL.
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
