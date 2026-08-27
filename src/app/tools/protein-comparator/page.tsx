"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, GitCompare, Play, Settings2, Database, AlignLeft, Activity, Info, Search, FileText } from "lucide-react";
import { fetchUniProtData, translateCDS, calculateProperties, alignSequences, getRasMolColor, getPolarityColor, UniProtData, UniProtFeature } from "./utils";
import MolstarViewer from "./MolstarViewer";

type InputMode = "uniprot" | "manual";
type SeqType = "dna" | "aa";

interface ProteinInput {
  mode: InputMode;
  gene: string;
  species: string;
  manualSeq: string;
  seqType: SeqType;
}

const InputPanel = ({ prot, setProt, title }: { prot: ProteinInput, setProt: (p: ProteinInput) => void, title: string }) => (
  <div className="bg-slate-900 rounded-xl border border-slate-700/50 p-4 space-y-4">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
      <div className="flex bg-slate-800 rounded-lg p-0.5">
        <button onClick={() => setProt({ ...prot, mode: "uniprot" })} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${prot.mode === "uniprot" ? "bg-indigo-500/20 text-indigo-400" : "text-slate-400 hover:text-slate-200"}`}>Database</button>
        <button onClick={() => setProt({ ...prot, mode: "manual" })} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${prot.mode === "manual" ? "bg-indigo-500/20 text-indigo-400" : "text-slate-400 hover:text-slate-200"}`}>Manual</button>
      </div>
    </div>

    {prot.mode === "uniprot" ? (
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Gene Symbol</label>
          <input type="text" value={prot.gene} onChange={e => setProt({ ...prot, gene: e.target.value })} placeholder="e.g. TP53" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Species</label>
          <input type="text" list={`species-list-${title.replace(/\s/g, '')}`} value={prot.species} onChange={e => setProt({ ...prot, species: e.target.value })} placeholder="e.g. human" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors" />
          <datalist id={`species-list-${title.replace(/\s/g, '')}`}>
            <option value="human" />
            <option value="mouse" />
            <option value="rat" />
            <option value="zebrafish" />
            <option value="drosophila" />
            <option value="c. elegans" />
            <option value="yeast" />
            <option value="e. coli" />
          </datalist>
        </div>
      </div>
    ) : (
      <div className="space-y-3">
        <div className="flex bg-slate-800/50 w-fit rounded-lg p-0.5">
          <button onClick={() => setProt({ ...prot, seqType: "aa" })} className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${prot.seqType === "aa" ? "bg-slate-700 text-slate-200" : "text-slate-500 hover:text-slate-300"}`}>Amino Acid</button>
          <button onClick={() => setProt({ ...prot, seqType: "dna" })} className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${prot.seqType === "dna" ? "bg-slate-700 text-slate-200" : "text-slate-500 hover:text-slate-300"}`}>DNA (CDS)</button>
        </div>
        <textarea value={prot.manualSeq} onChange={e => setProt({ ...prot, manualSeq: e.target.value })} placeholder={prot.seqType === "aa" ? "Paste AA sequence here..." : "Paste coding DNA here..."} className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors resize-none" />
      </div>
    )}
  </div>
);

export default function ProteinComparatorPage() {
  const [protA, setProtA] = useState<ProteinInput>({ mode: "uniprot", gene: "TP53", species: "human", manualSeq: "", seqType: "aa" });
  const [protB, setProtB] = useState<ProteinInput>({ mode: "manual", gene: "", species: "", manualSeq: "MEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPDDIEQWFTEDPGPDEAPRMPEAAPPVAPAPAAPTPAAPAPAPSWPLSSSVPSQKTYQGSYGFRLGFLHSGTAKSVTCTYSPALNKMFCQLAKTCPVQLWVDSTPPPGTRVRAMAIYKQSQHMTEVVRRCPHHERCSDSDGLAPPQHLIRVEGNLRVEYLDDRNTFRHSVVVPYEPPEVGSDCTTIHYNYMCNSSCMGGMNRRPILTIITLEDSSGNLLGRNSFEVRVCACPGRDRRTEEENLRKKGEPHHELPPGSTKRALPNNTSSSPQPKKKPLDGEYFTLQIRGRERFEMFRELNEALELKDAQAGKEPGGSRAHSSHLKSKKGQSTSRHKKLMFKTEGPDSD", seqType: "aa" });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dataA, setDataA] = useState<UniProtData | null>(null);
  const [dataB, setDataB] = useState<UniProtData | null>(null);
  const [alignedA, setAlignedA] = useState("");
  const [alignedB, setAlignedB] = useState("");
  const [identityPct, setIdentityPct] = useState(0);

  const [viewMode, setViewMode] = useState<"polarity" | "rasmol" | "hydro">("polarity");

  const handleCompare = async () => {
    setLoading(true);
    setError(null);
    setDataA(null);
    setDataB(null);

    try {
      let finalSeqA = "";
      let finalSeqB = "";
      let fetchedA: UniProtData | null = null;
      let fetchedB: UniProtData | null = null;

      // Process Protein A
      if (protA.mode === "uniprot") {
        fetchedA = await fetchUniProtData(protA.gene, protA.species);
        if (!fetchedA) throw new Error(`Could not find UniProt data for ${protA.gene} in ${protA.species}`);
        finalSeqA = fetchedA.sequence;
      } else {
        finalSeqA = protA.seqType === "dna" ? translateCDS(protA.manualSeq) : protA.manualSeq.replace(/\s/g, "").toUpperCase();
        fetchedA = { sequence: finalSeqA, subcellularLocations: [], features: [], organism: "Manual", gene: "Manual A" };
      }

      // Process Protein B
      if (protB.mode === "uniprot") {
        fetchedB = await fetchUniProtData(protB.gene, protB.species);
        if (!fetchedB) throw new Error(`Could not find UniProt data for ${protB.gene} in ${protB.species}`);
        finalSeqB = fetchedB.sequence;
      } else {
        finalSeqB = protB.seqType === "dna" ? translateCDS(protB.manualSeq) : protB.manualSeq.replace(/\s/g, "").toUpperCase();
        fetchedB = { sequence: finalSeqB, subcellularLocations: [], features: [], organism: "Manual", gene: "Manual B" };
      }

      const alignment = alignSequences(finalSeqA, finalSeqB);
      
      setDataA(fetchedA);
      setDataB(fetchedB);
      setAlignedA(alignment.aligned1);
      setAlignedB(alignment.aligned2);
      setIdentityPct(alignment.identity);

    } catch (err: any) {
      setError(err.message || "An error occurred during comparison.");
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (data: UniProtData, input: ProteinInput) => {
    const speciesName = input.mode === "uniprot" ? input.species : "Manual";
    return `${data.gene} (${speciesName.charAt(0).toUpperCase() + speciesName.slice(1)}) - ${data.sequence.length} AA`;
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F19] text-slate-200 p-8 font-sans selection:bg-indigo-500/30 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-6">
        <Link href="/tools/protein-tools" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-4">
          <ChevronLeft size={16} /> Back to Protein Tools
        </Link>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <GitCompare className="text-indigo-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Protein Sequence Comparator</h1>
            <p className="text-slate-400 text-sm">Align and compare functional domains, PTMs, and properties</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputPanel prot={protA} setProt={setProtA} title="Protein A" />
          <InputPanel prot={protB} setProt={setProtB} title="Protein B" />
        </div>

        <button
          onClick={handleCompare}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <span className="animate-pulse">Analyzing...</span> : <><Play size={16} /> Compare Proteins</>}
        </button>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-start gap-3">
            <Info className="shrink-0 mt-0.5" size={16} />
            <p>{error}</p>
          </div>
        )}

        {dataA && dataB && alignedA && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/20 border border-indigo-500/20 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-white mb-2">{identityPct.toFixed(1)}% <span className="text-lg text-indigo-300 font-medium">Identity</span></div>
              <p className="text-sm text-indigo-200/60">Global alignment of {alignedA.length} positions</p>
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
                <h2 className="text-sm font-semibold flex items-center gap-2"><AlignLeft size={16} className="text-indigo-400" /> Sequence Alignment & Properties</h2>
                <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                  <button onClick={() => setViewMode("polarity")} className={`px-3 py-1 text-[10px] font-medium rounded-md transition-colors ${viewMode === "polarity" ? "bg-slate-800 text-slate-200" : "text-slate-500 hover:text-slate-300"}`}>Polarity</button>
                  <button onClick={() => setViewMode("rasmol")} className={`px-3 py-1 text-[10px] font-medium rounded-md transition-colors ${viewMode === "rasmol" ? "bg-slate-800 text-slate-200" : "text-slate-500 hover:text-slate-300"}`}>RasMol</button>
                  <button onClick={() => setViewMode("hydro")} className={`px-3 py-1 text-[10px] font-medium rounded-md transition-colors ${viewMode === "hydro" ? "bg-slate-800 text-slate-200" : "text-slate-500 hover:text-slate-300"}`}>Kyte-Doolittle</button>
                </div>
              </div>
              <div className="p-4 overflow-x-auto">
                <SequenceAlignmentDisplay 
                  seqA={alignedA} 
                  seqB={alignedB} 
                  nameA={getDisplayName(dataA, protA)} 
                  nameB={getDisplayName(dataB, protB)} 
                  mode={viewMode} 
                />
              </div>
              
              <div className="grid grid-cols-2 divide-x divide-slate-800 border-t border-slate-800 text-xs">
                <PropertyStats data={dataA} name={getDisplayName(dataA, protA)} />
                <PropertyStats data={dataB} name={getDisplayName(dataB, protB)} />
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden">
                 <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700/50">
                   <h2 className="text-sm font-semibold flex items-center gap-2"><Activity size={16} className="text-emerald-400" /> Secondary Structure</h2>
                 </div>
                  <div className="p-4 space-y-6">
                    <FeatureComparison 
                      dataA={dataA} 
                      dataB={dataB} 
                      alignedA={alignedA} 
                      alignedB={alignedB} 
                      featureTypes={["helix", "beta strand", "turn"]} 
                      nameA={getDisplayName(dataA, protA)} 
                      nameB={getDisplayName(dataB, protB)}
                    />
                 </div>
              </div>

              <div className="bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden">
                 <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700/50">
                   <h2 className="text-sm font-semibold flex items-center gap-2"><Settings2 size={16} className="text-pink-400" /> Post-Translational Modifications (PTMs)</h2>
                 </div>
                 <div className="p-4 space-y-6">
                    <FeatureComparison 
                      dataA={dataA} 
                      dataB={dataB} 
                      alignedA={alignedA} 
                      alignedB={alignedB} 
                      featureTypes={["modified residue", "glycosylation", "disulfide bond", "cross-link", "lipidation"]} 
                      nameA={getDisplayName(dataA, protA)} 
                      nameB={getDisplayName(dataB, protB)}
                    />
                 </div>
              </div>
              
              <div className="bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden">
                 <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700/50">
                   <h2 className="text-sm font-semibold flex items-center gap-2"><Database size={16} className="text-amber-400" /> Subcellular Localization (Topology)</h2>
                 </div>
                 <div className="p-4 space-y-6">
                    <FeatureComparison 
                      dataA={dataA} 
                      dataB={dataB} 
                      alignedA={alignedA} 
                      alignedB={alignedB} 
                      featureTypes={["cytoplasmic domain", "extracellular domain", "topological domain", "transmembrane", "intramembrane"]} 
                      nameA={getDisplayName(dataA, protA)} 
                      nameB={getDisplayName(dataB, protB)}
                    />
                 </div>
              </div>

              {/* 3D Viewers Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {dataA.accession ? (
                  <MolstarViewer accession={dataA.accession} label={getDisplayName(dataA, protA)} />
                ) : (
                  <div className="w-full h-48 bg-slate-900 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center text-slate-500 text-sm">
                    <span className="font-semibold text-slate-400 mb-1">{getDisplayName(dataA, protA)}</span>
                    3D structure not available for manual sequences.
                  </div>
                )}
                
                {dataB.accession ? (
                  <MolstarViewer accession={dataB.accession} label={getDisplayName(dataB, protB)} />
                ) : (
                  <div className="w-full h-48 bg-slate-900 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center text-slate-500 text-sm">
                    <span className="font-semibold text-slate-400 mb-1">{getDisplayName(dataB, protB)}</span>
                    3D structure not available for manual sequences.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

function PropertyStats({ data, name }: { data: UniProtData, name: string }) {
  const stats = calculateProperties(data.sequence);
  return (
    <div className="p-4 space-y-3">
      <h4 className="font-semibold text-slate-300 mb-2">{name}</h4>
      <div className="flex justify-between items-center"><span className="text-slate-500">GRAVY (Hydrophobicity)</span> <span className="font-mono text-slate-300">{stats.gravy}</span></div>
      <div className="flex justify-between items-center"><span className="text-slate-500">Net Charge</span> <span className="font-mono text-slate-300">{stats.charge > 0 ? `+${stats.charge}` : stats.charge}</span></div>
      <div className="flex justify-between items-center"><span className="text-slate-500">Polar Residues</span> <span className="font-mono text-slate-300">{stats.polarPct}%</span></div>
      <div className="flex justify-between items-center"><span className="text-slate-500">Non-polar Residues</span> <span className="font-mono text-slate-300">{stats.nonpolarPct}%</span></div>
    </div>
  );
}

function SequenceAlignmentDisplay({ seqA, seqB, nameA, nameB, mode }: { seqA: string, seqB: string, nameA: string, nameB: string, mode: string }) {
  const getColor = (aa: string) => {
    if (aa === "-") return "transparent";
    if (mode === "rasmol") return getRasMolColor(aa);
    if (mode === "polarity") return getPolarityColor(aa);
    if (mode === "hydro") {
      // Kyte-doolittle simple map: highly hydrophobic = blue, hydrophilic = red
      const polar = ["R","K","N","D","Q","E","H","P","Y","W","S","T"];
      const nonpolar = ["A","C","G","I","L","M","F","V"];
      if (polar.includes(aa.toUpperCase())) return "#ef4444";
      if (nonpolar.includes(aa.toUpperCase())) return "#3b82f6";
      return "#94a3b8";
    }
    return "transparent";
  };

  // Pre-calculate cumulative original AA counts for the ruler
  let aaCountA = 0;
  let aaCountB = 0;
  const positions = [];
  
  for (let i = 0; i < seqA.length; i++) {
    if (seqA[i] !== "-") aaCountA++;
    if (seqB[i] !== "-") aaCountB++;
    // Index based ONLY on Gene A (countA) per user request
    positions.push({ a: seqA[i], b: seqB[i], pos: aaCountA, countA: aaCountA, countB: aaCountB });
  }

  // Chunk into rows
  const COLS = 50; // Reduced to 50 to fit container without scroll
  const rows = [];
  for (let r = 0; r < Math.ceil(positions.length / COLS); r++) {
    const chunk = positions.slice(r * COLS, (r + 1) * COLS);
    
    // Row 1: Ruler
    const rulerRow = chunk.map((p, i) => {
      let label: React.ReactNode = "";
      if (p.a !== "-" && p.pos % 10 === 0) {
        label = <span className="absolute inset-x-0 text-center flex justify-center">{p.pos}</span>;
      } else if (p.a !== "-" && p.pos % 5 === 0) {
        label = <span className="absolute inset-x-0 text-center flex justify-center">·</span>;
      }
      
      return (
        <span key={i} className="relative inline-block text-center w-4 h-[14px] text-[11px] text-slate-400 font-medium flex-none shrink-0">
          {label}
        </span>
      );
    });

    // Row 2: Seq A
    const seqARow = chunk.map((p, i) => (
      <span key={i} className="inline-block text-center w-4 text-lg font-bold flex-none shrink-0" style={{ color: getColor(p.a) }} title={`${nameA} bp ${p.countA}`}>
        {p.a}
      </span>
    ));

    // Row 3: Match bar
    const matchRow = chunk.map((p, i) => (
      <span key={i} className="inline-block text-center w-4 text-sm text-slate-400 font-bold flex-none shrink-0">
        {(p.a === p.b && p.a !== "-") ? "|" : " "}
      </span>
    ));

    // Row 4: Seq B
    const seqBRow = chunk.map((p, i) => (
      <span key={i} className="inline-block text-center w-4 text-lg font-bold flex-none shrink-0" style={{ color: getColor(p.b) }} title={`${nameB} bp ${p.countB}`}>
        {p.b}
      </span>
    ));
    
    rows.push(
      <div key={r} className="flex flex-col font-mono mb-6 bg-slate-800/20 p-2 rounded-lg border border-slate-700/30 w-fit mx-auto">
        <div className="flex w-full mb-1 justify-center">{rulerRow}</div>
        <div className="flex w-full justify-center">{seqARow}</div>
        <div className="flex w-full my-[1px] justify-center">{matchRow}</div>
        <div className="flex w-full justify-center">{seqBRow}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 pb-4">
      <div className="flex items-center justify-center gap-6 text-[10px] text-slate-500 mb-4">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Top: {nameA}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Bottom: {nameB}</span>
      </div>
      <div className="flex flex-col w-full">
        {rows}
      </div>
    </div>
  );
}

// Map features to sequence position
function FeatureComparison({ dataA, dataB, alignedA, alignedB, featureTypes, nameA, nameB }: { dataA: UniProtData, dataB: UniProtData, alignedA: string, alignedB: string, featureTypes: string[], nameA: string, nameB: string }) {
  // Helper to map aligned sequence features
  const getMappedFeatures = (seq: string, alignedSeq: string, features: UniProtFeature[]) => {
    const relevant = features.filter(f => featureTypes.includes(f.type.toLowerCase()));
    
    // Map original sequence index to aligned sequence index
    const origToAligned = new Map<number, number>();
    let origIdx = 1;
    for (let i = 0; i < alignedSeq.length; i++) {
      if (alignedSeq[i] !== "-") {
        origToAligned.set(origIdx, i + 1);
        origIdx++;
      }
    }

    return relevant.map(f => {
      const start = f.location?.start?.value;
      const end = f.location?.end?.value;
      if (!start || !end) return null;
      
      const alignedStart = origToAligned.get(start);
      const alignedEnd = origToAligned.get(end);
      
      return { ...f, alignedStart, alignedEnd, start, end };
    }).filter(Boolean);
  };

  const featsA = getMappedFeatures(dataA.sequence, alignedA, dataA.features);
  const featsB = getMappedFeatures(dataB.sequence, alignedB, dataB.features);

  // Project features from template to target if target is manual and template has features
  const projectFeatures = (templateFeats: any[], alignedTemplate: string, alignedTarget: string) => {
    // Map aligned index to target original index
    const alignedToOrigTarget = new Map<number, number>();
    let targetIdx = 1;
    for (let i = 0; i < alignedTarget.length; i++) {
      if (alignedTarget[i] !== "-") {
        alignedToOrigTarget.set(i + 1, targetIdx);
        targetIdx++;
      }
    }

    return templateFeats.map(f => {
      if (!f.alignedStart || !f.alignedEnd) return null;
      const targetStart = alignedToOrigTarget.get(f.alignedStart);
      const targetEnd = alignedToOrigTarget.get(f.alignedEnd);
      
      // If the region aligns to a gap in the target, we can't project perfectly
      if (!targetStart || !targetEnd) return null;
      
      return {
        ...f,
        start: targetStart,
        end: targetEnd,
        description: f.description ? `${f.description} (Predicted by Homology)` : `Predicted by Homology`
      };
    }).filter(Boolean);
  };

  let displayFeatsA = featsA;
  let displayFeatsB = featsB;

  if (dataA.organism !== "Manual" && dataB.organism === "Manual" && featsA.length > 0 && featsB.length === 0) {
    displayFeatsB = projectFeatures(featsA, alignedA, alignedB);
  }
  if (dataB.organism !== "Manual" && dataA.organism === "Manual" && featsB.length > 0 && featsA.length === 0) {
    displayFeatsA = projectFeatures(featsB, alignedB, alignedA);
  }

  const hasA = displayFeatsA.length > 0;
  const hasB = displayFeatsB.length > 0;

  if (!hasA && !hasB) {
    return <p className="text-xs text-slate-600 italic">No annotated features found for these proteins.</p>;
  }

  const getFeatureColor = (type: string) => {
    const t = type.toLowerCase();
    // Secondary Structure
    if (t === "helix") return "#34d399"; // emerald-400
    if (t === "beta strand") return "#60a5fa"; // blue-400
    if (t === "turn") return "#f472b6"; // pink-400
    // PTMs
    if (t === "modified residue") return "#a78bfa"; // violet-400
    if (t === "glycosylation") return "#fbbf24"; // amber-400
    if (t === "disulfide bond") return "#f87171"; // red-400
    if (t === "cross-link") return "#fdba74"; // orange-300
    if (t === "lipidation") return "#fef08a"; // yellow-200
    // Localization / Topology
    if (t === "topological domain") return "#2dd4bf"; // teal-400
    if (t === "cytoplasmic domain") return "#38bdf8"; // sky-400
    if (t === "extracellular domain") return "#fb923c"; // orange-400
    if (t === "transmembrane") return "#4ade80"; // green-400
    if (t === "intramembrane") return "#e879f9"; // fuchsia-400
    
    return "#94a3b8"; // slate-400
  };

  const renderVisualBar = (feats: any[], alignedSeq: string) => {
    return (
      <div className="relative w-full h-3 bg-slate-800 rounded-sm overflow-hidden mb-2">
        {feats.map((f, i) => {
          if (!f.alignedStart || !f.alignedEnd) return null;
          const left = (f.alignedStart / alignedSeq.length) * 100;
          const width = Math.max(((f.alignedEnd - f.alignedStart + 1) / alignedSeq.length) * 100, 0.5);
          return (
            <div 
              key={i}
              className="absolute h-full opacity-80 hover:opacity-100 cursor-help transition-opacity" 
              style={{
                left: `${left}%`,
                width: `${width}%`,
                backgroundColor: getFeatureColor(f.type)
              }}
              title={`${f.type.replace(/_/g, " ")}: ${f.description || ''} [${f.start}-${f.end}]`}
            />
          );
        })}
      </div>
    );
  };

  const renderLegend = (feats: any[]) => {
    const uniqueTypes = Array.from(new Set(feats.map(f => f.type)));
    return (
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {uniqueTypes.map(t => (
          <div key={t} className="flex items-center gap-1 text-[9px] text-slate-400">
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: getFeatureColor(t) }}></span>
            <span className="capitalize">{t.replace(/_/g, " ")}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Shared Ruler */}
      <div className="flex justify-between text-[10px] text-slate-500 pb-1 border-b border-slate-700/50">
        <span>1</span>
        <span>Aligned Position</span>
        <span>{alignedA.length}</span>
      </div>

      <div>
        <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{nameA}</h4>
        {hasA ? (
          renderVisualBar(displayFeatsA, alignedA)
        ) : <p className="text-[11px] text-slate-600 italic h-3 flex items-center">None annotated.</p>}
      </div>

      <div>
        <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{nameB}</h4>
        {hasB ? (
           renderVisualBar(displayFeatsB, alignedB)
         ) : <p className="text-[11px] text-slate-600 italic h-3 flex items-center">None annotated.</p>}
      </div>
      
      {/* Unified Legend */}
      {(hasA || hasB) && (
        <div className="mt-2 pt-2 border-t border-slate-800/50">
          {renderLegend([...displayFeatsA, ...displayFeatsB])}
        </div>
      )}
    </div>
  );
}
