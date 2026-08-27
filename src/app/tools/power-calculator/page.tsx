'use client';

import React, { useState, useMemo } from 'react';
import { 
  getContinuousPower, 
  getSurvivalPower, 
  getBinaryPower,
  calculateContinuousPowerFromN,
  calculateSurvivalPowerFromN,
  calculateBinaryPowerFromN
} from '@/components/power-calculator/CalculatorLogic';
import PowerCurveChart from '@/components/power-calculator/PowerCurveChart';
import { Info, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type AssayType = 'continuous' | 'survival' | 'binary';

export default function PowerCalculatorPage() {
  const [assayType, setAssayType] = useState<AssayType>('continuous');
  const [targetPower, setTargetPower] = useState<number>(0.8);
  const [alpha, setAlpha] = useState<number>(0.05);
  const [attritionBuffer, setAttritionBuffer] = useState<number>(0.1);

  // Continuous inputs
  const [meanCtrl, setMeanCtrl] = useState<number>(1000);
  const [effectPct, setEffectPct] = useState<number>(0.5);
  const [cv, setCv] = useState<number>(0.25);

  // Survival inputs
  const [medCtrl, setMedCtrl] = useState<number>(20);
  const [medTrt, setMedTrt] = useState<number>(30);

  // Binary inputs
  const [pCtrl, setPCtrl] = useState<number>(0.8);
  const [pTrt, setPTrt] = useState<number>(0.3);

  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const toggleTooltip = (id: string) => {
    setActiveTooltip(activeTooltip === id ? null : id);
  };

  const tooltips: Record<string, string> = {
    targetPower: "Target Power: The probability of correctly detecting a true effect if it exists (usually 80% or 90%). Higher power requires more subjects.",
    alpha: "Alpha (α): The significance level, or probability of a false positive (Type I error). Usually set to 0.05.",
    attritionBuffer: "Attrition Buffer: Extra percentage of subjects added to account for expected dropout or loss during the experiment.",
    meanCtrl: "Mean Control Value: The expected average outcome in the control group (e.g., average tumor volume at endpoint).",
    effectPct: "Expected Treatment Effect: The expected percent reduction in the outcome metric due to the treatment.",
    cv: "Model Variability (CV): Coefficient of Variation (Standard Deviation / Mean). Syngeneic models are usually ~15%, while PDX models can be highly variable (~40%).",
    reqMice: "Required Mice per Group: The mathematically calculated number of subjects needed in EACH experimental group to achieve the target statistical power. This represents the absolute minimum needed to detect an effect.",
    totalCohort: "Total Cohort (with buffer): The total number of subjects to prepare for the entire experiment across ALL groups (2 groups × Required Mice + Attrition Buffer). This accounts for unexpected loss, dropouts, or animals reaching humane endpoints."
  };

  const calculateResults = () => {
    let nRaw = NaN;
    let effectSizeVal = 0;
    
    if (assayType === 'continuous') {
      const meanTrt = meanCtrl * (1 - effectPct);
      const sd = meanCtrl * cv;
      effectSizeVal = Math.abs(meanCtrl - meanTrt) / sd;
      nRaw = getContinuousPower(effectSizeVal, alpha, targetPower);
    } else if (assayType === 'survival') {
      const hr = medCtrl / medTrt;
      nRaw = getSurvivalPower(hr, alpha, targetPower);
    } else if (assayType === 'binary') {
      nRaw = getBinaryPower(pCtrl, pTrt, alpha, targetPower);
    }

    const nCeil = isNaN(nRaw) ? 0 : Math.ceil(nRaw);
    const nBuffered = isNaN(nRaw) ? 0 : Math.ceil(nCeil * (1 + attritionBuffer));
    return { nRaw, nCeil, nBuffered, effectSizeVal };
  };

  const { nCeil, nBuffered, effectSizeVal } = useMemo(calculateResults, [
    assayType, targetPower, alpha, attritionBuffer, 
    meanCtrl, effectPct, cv, medCtrl, medTrt, pCtrl, pTrt
  ]);

  const powerCurveData = useMemo(() => {
    if (isNaN(nCeil) || nCeil === 0) return [];
    const data = [];
    const maxN = Math.max(20, nCeil * 2);
    for (let n = 3; n <= maxN; n++) {
      let power = 0;
      if (assayType === 'continuous') {
        power = calculateContinuousPowerFromN(effectSizeVal, alpha, n);
      } else if (assayType === 'survival') {
        const hr = medCtrl / medTrt;
        power = calculateSurvivalPowerFromN(hr, alpha, n);
      } else if (assayType === 'binary') {
        power = calculateBinaryPowerFromN(pCtrl, pTrt, alpha, n);
      }
      data.push({ n, power: isNaN(power) ? 0 : power * 100 });
    }
    return data;
  }, [nCeil, assayType, effectSizeVal, alpha, medCtrl, medTrt, pCtrl, pTrt]);

  const handleDownload = () => {
    let text = "In Vivo Preclinical Experiment - Power Analysis Report\n";
    text += "=======================================================\n\n";
    text += "Global Settings:\n";
    text += `- Target Power: ${targetPower * 100}%\n`;
    text += `- Alpha (Significance Level): ${alpha}\n`;
    text += `- Attrition Buffer: ${attritionBuffer * 100}%\n\n`;

    text += "Assay Parameters:\n";
    text += `- Assay Type: ${assayType}\n`;
    if (assayType === 'continuous') {
      text += `- Control Mean: ${meanCtrl}\n`;
      text += `- Treatment Mean: ${meanCtrl * (1 - effectPct)}\n`;
      text += `- CV: ${cv * 100}%\n`;
      text += `- Effect Size (Cohen's d): ${effectSizeVal.toFixed(3)}\n`;
    } else if (assayType === 'survival') {
      text += `- Control Median Survival: ${medCtrl}\n`;
      text += `- Treatment Median Survival: ${medTrt}\n`;
      text += `- Expected Hazard Ratio: ${(medCtrl / medTrt).toFixed(3)}\n`;
    } else if (assayType === 'binary') {
      text += `- Control Incidence: ${pCtrl * 100}%\n`;
      text += `- Treatment Incidence: ${pTrt * 100}%\n`;
    }

    text += "\nResults:\n";
    text += `- Required Mice per Group: ${nCeil}\n`;
    text += `- Required Mice per Group (with buffer): ${nBuffered}\n`;
    text += `- Total Cohort Size (2 groups, with buffer): ${nBuffered * 2}\n`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'power_analysis_report.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const TooltipText = ({ id }: { id: string }) => {
    if (activeTooltip !== id) return null;
    return (
      <div className="mt-2 text-xs text-blue-300 bg-blue-900/30 p-2 rounded border border-blue-800/50">
        {tooltips[id]}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-8 px-4 sm:px-6 lg:px-8 font-sans flex flex-col items-center justify-center">
      <div className="max-w-6xl w-full mb-6">
        <Link href="/#calculators" className="inline-flex items-center text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition-colors text-sm font-medium">
          <ArrowLeft size={16} className="mr-2" />
          Back to Lab Calculators
        </Link>
      </div>
      <div className="max-w-6xl w-full flex flex-col md:flex-row gap-8 items-start justify-center">
        
        {/* Sidebar Inputs */}
        <div className="w-full md:w-1/3 glass-card p-6 h-fit shadow-2xl">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center">
            <span className="text-2xl mr-2">🐁</span> Parameters
          </h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-[var(--text-primary)]">Target Power ({Math.round(targetPower * 100)}%)</label>
                <Info size={16} className="text-gray-400 cursor-pointer hover:text-[var(--accent-cyan)] transition-colors" onClick={() => toggleTooltip('targetPower')} />
              </div>
              <input type="range" min="0.7" max="0.95" step="0.01" value={targetPower} onChange={(e) => setTargetPower(parseFloat(e.target.value))} className="w-full accent-[var(--accent-cyan)]" />
              <TooltipText id="targetPower" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-[var(--text-primary)]">Alpha ({alpha})</label>
                <Info size={16} className="text-gray-400 cursor-pointer hover:text-[var(--accent-cyan)] transition-colors" onClick={() => toggleTooltip('alpha')} />
              </div>
              <input type="number" min="0.01" max="0.2" step="0.01" value={alpha} onChange={(e) => setAlpha(parseFloat(e.target.value))} className="w-full p-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-md focus:border-[var(--accent-cyan)] focus:outline-none transition-colors" />
              <TooltipText id="alpha" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-[var(--text-primary)]">Attrition Buffer ({Math.round(attritionBuffer * 100)}%)</label>
                <Info size={16} className="text-gray-400 cursor-pointer hover:text-[var(--accent-cyan)] transition-colors" onClick={() => toggleTooltip('attritionBuffer')} />
              </div>
              <input type="range" min="0" max="0.3" step="0.05" value={attritionBuffer} onChange={(e) => setAttritionBuffer(parseFloat(e.target.value))} className="w-full accent-[var(--accent-cyan)]" />
              <TooltipText id="attritionBuffer" />
            </div>

            <div className="section-divider my-2"></div>

            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Assay Type</label>
              <select value={assayType} onChange={(e) => setAssayType(e.target.value as AssayType)} className="w-full p-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-md focus:border-[var(--accent-cyan)] focus:outline-none transition-colors">
                <option value="continuous">Continuous (e.g., Volume, Weight)</option>
                <option value="survival">Survival (e.g., Kaplan-Meier)</option>
                <option value="binary">Binary (e.g., Metastasis Yes/No)</option>
              </select>
            </div>

            {/* Dynamic Content */}
            <div className="bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.1)] p-4 rounded-lg space-y-4">
              {assayType === 'continuous' && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm text-[var(--text-secondary)]">Mean Control Value</label>
                      <Info size={16} className="text-gray-400 cursor-pointer hover:text-[var(--accent-cyan)] transition-colors" onClick={() => toggleTooltip('meanCtrl')} />
                    </div>
                    <input type="number" min="0.1" step="10" value={meanCtrl} onChange={(e) => setMeanCtrl(parseFloat(e.target.value) || 0.1)} className="w-full p-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-md focus:border-[var(--accent-cyan)] focus:outline-none" />
                    <TooltipText id="meanCtrl" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm text-[var(--text-secondary)]">Expected Treatment Effect (% Red)</label>
                      <Info size={16} className="text-gray-400 cursor-pointer hover:text-[var(--accent-cyan)] transition-colors" onClick={() => toggleTooltip('effectPct')} />
                    </div>
                    <input type="number" min="1" max="99" value={effectPct * 100} onChange={(e) => setEffectPct((parseFloat(e.target.value) || 1) / 100)} className="w-full p-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-md focus:border-[var(--accent-cyan)] focus:outline-none" />
                    <TooltipText id="effectPct" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm text-[var(--text-secondary)]">Model Variability (CV)</label>
                      <Info size={16} className="text-gray-400 cursor-pointer hover:text-[var(--accent-cyan)] transition-colors" onClick={() => toggleTooltip('cv')} />
                    </div>
                    <select value={cv} onChange={(e) => setCv(parseFloat(e.target.value))} className="w-full p-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-md focus:border-[var(--accent-cyan)] focus:outline-none">
                      <option value={0.15}>Low (Syngeneic, ~15%)</option>
                      <option value={0.25}>Moderate (Standard, ~25%)</option>
                      <option value={0.40}>High (PDX, ~40%)</option>
                    </select>
                    <TooltipText id="cv" />
                  </div>
                </>
              )}
              {assayType === 'survival' && (
                <>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1">Median Survival - Control (days)</label>
                    <input type="number" min="1" value={medCtrl} onChange={(e) => setMedCtrl(parseFloat(e.target.value) || 1)} className="w-full p-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-md focus:border-[var(--accent-cyan)] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1">Median Survival - Treatment (days)</label>
                    <input type="number" min="1" value={medTrt} onChange={(e) => setMedTrt(parseFloat(e.target.value) || 1)} className="w-full p-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-md focus:border-[var(--accent-cyan)] focus:outline-none" />
                  </div>
                </>
              )}
              {assayType === 'binary' && (
                <>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1">Incidence in Control (%)</label>
                    <input type="number" min="1" max="99" value={pCtrl * 100} onChange={(e) => setPCtrl((parseFloat(e.target.value) || 1) / 100)} className="w-full p-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-md focus:border-[var(--accent-cyan)] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1">Incidence in Treatment (%)</label>
                    <input type="number" min="0" max="99" value={pTrt * 100} onChange={(e) => setPTrt((parseFloat(e.target.value) || 0) / 100)} className="w-full p-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-md focus:border-[var(--accent-cyan)] focus:outline-none" />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Dashboard */}
        <div className="w-full md:w-2/3 flex flex-col justify-center">
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-4xl font-extrabold text-[var(--text-primary)] tracking-tight text-glow-cyan">In Vivo Power Calculator</h1>
            <p className="text-[var(--text-secondary)] mt-3 text-lg">Calculate the required sample size for your preclinical experiments.</p>
          </div>

          {nCeil > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="glass-card p-8 border-l-4 border-l-[var(--accent-cyan)] text-center relative flex flex-col items-center justify-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <p className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">Required Mice per Group</p>
                    <Info size={16} className="text-gray-400 cursor-pointer hover:text-[var(--accent-cyan)] transition-colors shrink-0" onClick={() => toggleTooltip('reqMice')} />
                  </div>
                  <div className="w-full text-left"><TooltipText id="reqMice" /></div>
                  <p className="text-6xl font-black text-[var(--text-primary)] gradient-text mt-2">{nCeil}</p>
                </div>
                <div className="glass-card p-8 border-l-4 border-l-[var(--accent-emerald)] text-center relative flex flex-col items-center justify-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <p className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">Total Cohort (with buffer)</p>
                    <Info size={16} className="text-gray-400 cursor-pointer hover:text-[var(--accent-cyan)] transition-colors shrink-0" onClick={() => toggleTooltip('totalCohort')} />
                  </div>
                  <div className="w-full text-left"><TooltipText id="totalCohort" /></div>
                  <p className="text-6xl font-black text-[var(--text-primary)] text-green-400 mt-2">{nBuffered * 2}</p>
                  <p className="text-sm text-green-400/80 mt-2 font-medium">+{nBuffered * 2 - nCeil * 2} buffer mice included</p>
                </div>
              </div>

              <div className="mt-8">
                <PowerCurveChart data={powerCurveData} targetPower={targetPower} targetN={nCeil} />
              </div>

              <div className="mt-10 flex justify-center md:justify-end">
                <button 
                  onClick={handleDownload}
                  className="btn-primary w-full md:w-auto"
                >
                  Download Summary Report
                </button>
              </div>
            </>
          ) : (
            <div className="bg-red-900/20 p-6 rounded-xl text-red-400 border border-red-500/30 text-center">
              <p className="font-bold text-lg mb-2">Invalid Parameters</p>
              <p>Please adjust your inputs. The effect size must be non-zero.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
