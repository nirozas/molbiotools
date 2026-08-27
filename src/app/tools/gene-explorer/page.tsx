"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Search, Database, Copy, Check, Download, AlertCircle, Loader2 } from "lucide-react";

interface Transcript {
  id: string;
  display_name: string;
  biotype: string;
  length: number;
  is_canonical?: boolean;
}

interface GeneInfo {
  id: string;
  display_name: string;
  description: string;
  species: string;
  biotype: string;
  seq_region_name: string;
  start: number;
  end: number;
  strand: number;
  transcripts: Transcript[];
}

type SequenceType = "genomic" | "cdna" | "mrna" | "cds" | "protein";

export default function GeneExplorer() {
  const [query, setQuery] = useState("");
  const [species, setSpecies] = useState("homo_sapiens");
  const [gene, setGene] = useState<GeneInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string | null>(null);
  const [selectedSeqType, setSelectedSeqType] = useState<SequenceType>("mrna");
  
  const [filterBiotype, setFilterBiotype] = useState<string>("all");
  const [filterMinSize, setFilterMinSize] = useState<number>(0);

  const [sequenceData, setSequenceData] = useState<string | null>(null);
  const [isSeqLoading, setIsSeqLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [proteinColorMode, setProteinColorMode] = useState<"none" | "rasmol" | "polarity" | "hydrophobicity">("none");

  const SPECIES_OPTIONS = [
    { id: "homo_sapiens", name: "Human (Homo sapiens)" },
    { id: "mus_musculus", name: "Mouse (Mus musculus)" },
    { id: "danio_rerio", name: "Zebrafish (Danio rerio)" },
    { id: "drosophila_melanogaster", name: "Fruit Fly (D. melanogaster)" },
    { id: "caenorhabditis_elegans", name: "C. elegans" },
    { id: "saccharomyces_cerevisiae", name: "Yeast (S. cerevisiae)" }
  ];

  // Helper to colorize an amino acid
  const getAAColor = (aa: string) => {
    if (proteinColorMode === "none") return "text-emerald-400";
    
    const char = aa.toUpperCase();
    
    if (proteinColorMode === "rasmol") {
      // RasMol standard colors
      if (['D', 'E'].includes(char)) return "text-red-500";
      if (['C', 'M'].includes(char)) return "text-yellow-400";
      if (['K', 'R'].includes(char)) return "text-blue-500";
      if (['S', 'T'].includes(char)) return "text-orange-500";
      if (['F', 'Y', 'W'].includes(char)) return "text-purple-400";
      if (['N', 'Q'].includes(char)) return "text-cyan-400";
      if (['G'].includes(char)) return "text-slate-300";
      if (['L', 'V', 'I'].includes(char)) return "text-green-500";
      if (['A'].includes(char)) return "text-slate-400";
      if (['P'].includes(char)) return "text-pink-400";
      if (['H'].includes(char)) return "text-sky-300";
      return "text-emerald-400";
    }
    
    if (proteinColorMode === "polarity") {
      if (['R', 'H', 'K', 'D', 'E'].includes(char)) return "text-blue-500"; // Charged
      if (['S', 'T', 'N', 'Q', 'Y', 'C', 'G'].includes(char)) return "text-emerald-400"; // Polar Uncharged
      return "text-yellow-500"; // Nonpolar
    }
    
    if (proteinColorMode === "hydrophobicity") {
      if (['A', 'I', 'L', 'M', 'F', 'W', 'V', 'C'].includes(char)) return "text-red-400"; // Hydrophobic
      if (['R', 'N', 'D', 'E', 'Q', 'K'].includes(char)) return "text-blue-400"; // Hydrophilic
      return "text-slate-400"; // Neutral/Intermediate
    }
    
    return "text-emerald-400";
  };

  const renderProteinSequence = (seq: string) => {
    const cleanSeq = seq.replace(/\s/g, '');
    let result = [];
    
    for (let i = 0; i < cleanSeq.length; i++) {
      const aa = cleanSeq[i];
      result.push(
        <span key={i} className={getAAColor(aa)}>{aa}</span>
      );
      
      // Add space every 10 chars
      if ((i + 1) % 10 === 0 && (i + 1) % 60 !== 0) {
        result.push(<span key={`s${i}`}> </span>);
      }
      
      // Add newline every 60 chars
      if ((i + 1) % 60 === 0) {
        result.push(<br key={`br${i}`} />);
      }
    }
    return result;
  };

  const searchGene = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setGene(null);
    setSequenceData(null);
    setSelectedTranscriptId(null);

    try {
      // 1. Lookup the symbol to get the Ensembl ID and Transcripts
      const res = await fetch(`https://rest.ensembl.org/lookup/symbol/${species}/${query.trim()}?expand=1`, {
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        if (res.status === 400 || res.status === 404) {
          throw new Error(`Gene '${query}' not found in ${species.replace('_', ' ')}. Please check the spelling or try a different species.`);
        }
        throw new Error("Failed to fetch data from Ensembl API.");
      }

      const data = await res.json();
      
      const transcripts: Transcript[] = (data.Transcript || []).map((t: any) => ({
        id: t.id,
        display_name: t.display_name,
        biotype: t.biotype,
        length: t.length,
        is_canonical: t.is_canonical
      }));

      // Sort transcripts: canonical first, then by length descending
      transcripts.sort((a, b) => {
        if (a.is_canonical && !b.is_canonical) return -1;
        if (!a.is_canonical && b.is_canonical) return 1;
        return b.length - a.length;
      });

      setGene({
        id: data.id,
        display_name: data.display_name,
        description: data.description?.split(" [")[0] || "No description available",
        species,
        biotype: data.biotype,
        seq_region_name: data.seq_region_name,
        start: data.start,
        end: data.end,
        strand: data.strand,
        transcripts
      });

      // Auto-select the first transcript
      if (transcripts.length > 0) {
        setSelectedTranscriptId(transcripts[0].id);
        fetchSequence(transcripts[0].id, "mrna");
      } else {
        fetchSequence(data.id, "genomic"); // If no transcripts, just get genomic
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSequence = async (id: string, type: SequenceType) => {
    setIsSeqLoading(true);
    setSequenceData(null);
    setSelectedSeqType(type);
    if (type !== "genomic") {
      setSelectedTranscriptId(id);
    }

    // Determine the exact ID to use (gene ID for genomic, transcript ID for cdna/cds/protein)
    const targetId = type === "genomic" ? (gene?.id || id) : id;
    
    // mRNA uses the cDNA endpoint, then we replace T with U
    const apiType = type === "mrna" ? "cdna" : type;

    try {
      const res = await fetch(`https://rest.ensembl.org/sequence/id/${targetId}?type=${apiType}`, {
        headers: { "Content-Type": "text/plain" }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch ${type} sequence for ${targetId}`);
      }

      let seq = await res.text();
      
      if (type === "mrna") {
        seq = seq.replace(/T/g, 'U').replace(/t/g, 'u');
      }
      
      setSequenceData(seq);
    } catch (err: any) {
      setError(`Sequence Error: ${err.message}`);
    } finally {
      setIsSeqLoading(false);
    }
  };

  const copySequence = () => {
    if (sequenceData) {
      navigator.clipboard.writeText(sequenceData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Format sequence into blocks of 10 for readability, 60 per line
  const formatSequence = (seq: string) => {
    const cleanSeq = seq.replace(/\s/g, '');
    let formatted = '';
    for (let i = 0; i < cleanSeq.length; i += 60) {
      const line = cleanSeq.substring(i, i + 60);
      let spacedLine = '';
      for (let j = 0; j < line.length; j += 10) {
        spacedLine += line.substring(j, j + 10) + ' ';
      }
      formatted += spacedLine.trim() + '\n';
    }
    return formatted;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen text-slate-200">
      <div className="w-full space-y-6">
        
        <Link href="/tools/dna" className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300">
          <ChevronLeft size={16} className="mr-1" /> Back to DNA Tools
        </Link>

        <header className="mb-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Database className="text-blue-500" />
            Ensembl Gene & Isoform Explorer
          </h1>
          <p className="text-slate-400 mt-2">
            Search for a gene to instantly fetch its full genomic DNA, all known transcripts (cDNA), and coding sequences (CDS).
          </p>
        </header>

        {/* Search Bar */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg">
          <form onSubmit={searchGene} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Gene Symbol or ID</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. BRCA1, TP53, ENSG00000012048"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  required
                />
              </div>
            </div>
            <div className="md:w-64">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Species</label>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              >
                {SPECIES_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </div>
            <div className="md:w-32 flex items-end">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Search"}
              </button>
            </div>
          </form>
          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-2 text-red-400 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Results View */}
        {gene && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Sidebar: Gene Info & Transcripts */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h2 className="text-xl font-bold text-white mb-1">{gene.display_name}</h2>
                <p className="text-xs text-blue-400 font-mono mb-3">{gene.id}</p>
                <p className="text-sm text-slate-300 mb-4 pb-4 border-b border-slate-700 leading-relaxed">
                  {gene.description}
                </p>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Location:</span>
                    <span className="text-slate-300 font-mono">Chr{gene.seq_region_name}:{gene.start.toLocaleString()}-{gene.end.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Strand:</span>
                    <span className="text-slate-300">{gene.strand > 0 ? "Forward (+)" : "Reverse (-)"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Type:</span>
                    <span className="text-slate-300">{gene.biotype.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 max-h-[500px] overflow-y-auto">
                <div className="sticky top-0 bg-slate-800 pb-2 mb-3 border-b border-slate-700 z-10">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-1 flex justify-between items-center">
                    Transcripts ({gene.transcripts.length})
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-tight mb-3">
                    Multiple transcripts exist due to <strong>Alternative Splicing</strong>. The <strong>Canonical</strong> transcript is typically the most conserved or highly expressed.
                  </p>
                  <div className="flex gap-2">
                    <select 
                      className="flex-1 bg-slate-900 border border-slate-700 rounded text-xs px-2 py-1.5 text-slate-300 focus:border-blue-500 outline-none"
                      value={filterBiotype}
                      onChange={(e) => setFilterBiotype(e.target.value)}
                    >
                      <option value="all">All Biotypes</option>
                      {Array.from(new Set(gene.transcripts.map(t => t.biotype))).map(b => (
                        <option key={b} value={b}>{b.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                    <div className="flex-1 relative">
                      <input 
                        type="number" 
                        placeholder="Min Size (bp)"
                        value={filterMinSize || ''}
                        className="w-full bg-slate-900 border border-slate-700 rounded text-xs px-2 py-1.5 text-slate-300 focus:border-blue-500 outline-none"
                        onChange={(e) => setFilterMinSize(parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {gene.transcripts
                    .filter(t => filterBiotype === "all" || t.biotype === filterBiotype)
                    .filter(t => filterMinSize === 0 || t.length >= filterMinSize)
                    .map(t => (
                    <button
                      key={t.id}
                      onClick={() => fetchSequence(t.id, selectedSeqType === "genomic" ? "cdna" : selectedSeqType)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedTranscriptId === t.id && selectedSeqType !== "genomic"
                          ? "bg-blue-900/30 border-blue-500/50" 
                          : "bg-slate-900/50 border-transparent hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-sm text-white">{t.display_name}</span>
                        {t.is_canonical === 1 || t.is_canonical === true ? (
                          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0">Canonical</span>
                        ) : null}
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>{t.id}</span>
                        <span>{t.length.toLocaleString()} bp</span>
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase mt-1 tracking-wider">
                        {t.biotype.replace(/_/g, ' ')}
                      </div>
                    </button>
                  ))}
                  
                  {gene.transcripts.filter(t => filterBiotype === "all" || t.biotype === filterBiotype).filter(t => filterMinSize === 0 || t.length >= filterMinSize).length === 0 && (
                    <div className="text-center text-xs text-slate-500 py-4">
                      No transcripts match your filters.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Area: Sequence Viewer */}
            <div className="lg:col-span-3">
              <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden h-full flex flex-col">
                
                {/* Sequence Type Tabs */}
                <div className="flex gap-2 border-b border-slate-700 bg-slate-850 overflow-x-auto p-2">
                  <button 
                    onClick={() => fetchSequence(gene.id, "genomic")}
                    className={`shrink-0 px-4 md:px-6 py-3 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap ${selectedSeqType === "genomic" ? "border-b-2 border-blue-500 text-blue-400 bg-blue-500/10" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`}
                  >
                    Genomic DNA
                  </button>
                  <button 
                    onClick={() => {
                      if (selectedTranscriptId) fetchSequence(selectedTranscriptId, "cdna");
                      else if (gene.transcripts.length) fetchSequence(gene.transcripts[0].id, "cdna");
                    }}
                    disabled={!selectedTranscriptId && gene.transcripts.length === 0}
                    className={`shrink-0 px-4 md:px-6 py-3 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap ${selectedSeqType === "cdna" ? "border-b-2 border-blue-500 text-blue-400 bg-blue-500/10" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-50"}`}
                  >
                    cDNA
                  </button>
                  <button 
                    onClick={() => {
                      if (selectedTranscriptId) fetchSequence(selectedTranscriptId, "mrna");
                      else if (gene.transcripts.length) fetchSequence(gene.transcripts[0].id, "mrna");
                    }}
                    disabled={!selectedTranscriptId && gene.transcripts.length === 0}
                    className={`shrink-0 px-4 md:px-6 py-3 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap ${selectedSeqType === "mrna" ? "border-b-2 border-blue-500 text-blue-400 bg-blue-500/10" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-50"}`}
                  >
                    mRNA
                  </button>
                  <button 
                    onClick={() => {
                      if (selectedTranscriptId) fetchSequence(selectedTranscriptId, "cds");
                      else if (gene.transcripts.length) fetchSequence(gene.transcripts[0].id, "cds");
                    }}
                    disabled={!selectedTranscriptId && gene.transcripts.length === 0}
                    className={`shrink-0 px-4 md:px-6 py-3 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap ${selectedSeqType === "cds" ? "border-b-2 border-blue-500 text-blue-400 bg-blue-500/10" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-50"}`}
                  >
                    CDS
                  </button>
                  <button 
                    onClick={() => {
                      if (selectedTranscriptId) fetchSequence(selectedTranscriptId, "protein");
                      else if (gene.transcripts.length) fetchSequence(gene.transcripts[0].id, "protein");
                    }}
                    disabled={!selectedTranscriptId && gene.transcripts.length === 0}
                    className={`shrink-0 px-4 md:px-6 py-3 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap ${selectedSeqType === "protein" ? "border-b-2 border-blue-500 text-blue-400 bg-blue-500/10" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-50"}`}
                  >
                    Protein (AA)
                  </button>
                </div>

                {/* Toolbar */}
                <div className="px-4 py-2 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
                  <div className="text-xs text-slate-400">
                    {selectedSeqType === "genomic" 
                      ? `Showing full genomic region for ${gene.display_name}` 
                      : `Showing ${selectedSeqType.toUpperCase()} for transcript ${selectedTranscriptId}`
                    }
                  </div>
                  <button 
                    onClick={copySequence}
                    disabled={!sequenceData || isSeqLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs font-medium text-white transition-colors disabled:opacity-50"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copied ? "Copied!" : "Copy Sequence"}
                  </button>
                </div>

                {/* Sequence Block */}
                <div className="p-4 flex-1 relative min-h-[400px] flex flex-col gap-4">
                  {isSeqLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-800/50 backdrop-blur-sm z-10">
                      <Loader2 size={32} className="animate-spin mb-3 text-blue-500" />
                      <p>Fetching sequence from Ensembl...</p>
                    </div>
                  ) : sequenceData ? (
                    <>
                      {/* Statistics Panel */}
                      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-300">
                        <h4 className="font-semibold text-slate-100 mb-2 uppercase tracking-wider">Sequence Statistics</h4>
                        {selectedSeqType !== "protein" ? (
                          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                            <div className="bg-slate-800 p-2 rounded border border-slate-700">
                              <span className="block text-slate-500 mb-1">Length</span>
                              <span className="font-mono text-white">{sequenceData.replace(/\s/g, '').length.toLocaleString()} bp</span>
                            </div>
                            <div className="bg-slate-800 p-2 rounded border border-slate-700">
                              <span className="block text-slate-500 mb-1">GC Content</span>
                              <span className="font-mono text-emerald-400">
                                {(((sequenceData.match(/[GCgc]/g) || []).length / sequenceData.replace(/\s/g, '').length) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="bg-slate-800 p-2 rounded border border-slate-700">
                              <span className="block text-slate-500 mb-1">% A</span>
                              <span className="font-mono text-blue-400">{(((sequenceData.match(/[Aa]/g) || []).length / sequenceData.replace(/\s/g, '').length) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="bg-slate-800 p-2 rounded border border-slate-700">
                              <span className="block text-slate-500 mb-1">{selectedSeqType === "mrna" ? "% U" : "% T"}</span>
                              <span className="font-mono text-rose-400">{(((sequenceData.match(/[TtuU]/g) || []).length / sequenceData.replace(/\s/g, '').length) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="bg-slate-800 p-2 rounded border border-slate-700">
                              <span className="block text-slate-500 mb-1">% G</span>
                              <span className="font-mono text-amber-400">{(((sequenceData.match(/[Gg]/g) || []).length / sequenceData.replace(/\s/g, '').length) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="bg-slate-800 p-2 rounded border border-slate-700">
                              <span className="block text-slate-500 mb-1">% C</span>
                              <span className="font-mono text-cyan-400">{(((sequenceData.match(/[Cc]/g) || []).length / sequenceData.replace(/\s/g, '').length) * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div className="bg-slate-800 p-2 rounded border border-slate-700">
                              <span className="block text-slate-500 mb-1">Length</span>
                              <span className="font-mono text-white">{sequenceData.replace(/\s/g, '').length.toLocaleString()} AA</span>
                            </div>
                            <div className="bg-slate-800 p-2 rounded border border-slate-700">
                              <span className="block text-slate-500 mb-1">Hydrophobic (A,I,L,M,F,W,V)</span>
                              <span className="font-mono text-rose-400">
                                {(((sequenceData.match(/[AILMFWVailmfwv]/g) || []).length / sequenceData.replace(/\s/g, '').length) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="bg-slate-800 p-2 rounded border border-slate-700">
                              <span className="block text-slate-500 mb-1">Polar (N,C,Q,S,T,Y)</span>
                              <span className="font-mono text-emerald-400">
                                {(((sequenceData.match(/[NCQSTYncqsty]/g) || []).length / sequenceData.replace(/\s/g, '').length) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="bg-slate-800 p-2 rounded border border-slate-700">
                              <span className="block text-slate-500 mb-1">Charged (+/-)</span>
                              <span className="font-mono text-blue-400">
                                {(((sequenceData.match(/[RHKDErhkde]/g) || []).length / sequenceData.replace(/\s/g, '').length) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Protein Color Toolbar */}
                      {selectedSeqType === "protein" && (
                        <div className="flex gap-2 mb-2 items-center text-xs">
                          <span className="text-slate-400 font-semibold uppercase tracking-wider mr-2">Color Scheme:</span>
                          <button 
                            onClick={() => setProteinColorMode("none")}
                            className={`px-3 py-1.5 rounded border transition-colors ${proteinColorMode === "none" ? "bg-slate-700 text-white border-slate-500" : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"}`}
                          >
                            Default
                          </button>
                          <button 
                            onClick={() => setProteinColorMode("rasmol")}
                            className={`px-3 py-1.5 rounded border transition-colors ${proteinColorMode === "rasmol" ? "bg-slate-700 text-white border-slate-500" : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"}`}
                          >
                            RasMol
                          </button>
                          <button 
                            onClick={() => setProteinColorMode("polarity")}
                            className={`px-3 py-1.5 rounded border transition-colors ${proteinColorMode === "polarity" ? "bg-slate-700 text-white border-slate-500" : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"}`}
                          >
                            Polarity
                          </button>
                          <button 
                            onClick={() => setProteinColorMode("hydrophobicity")}
                            className={`px-3 py-1.5 rounded border transition-colors ${proteinColorMode === "hydrophobicity" ? "bg-slate-700 text-white border-slate-500" : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"}`}
                          >
                            Hydrophobicity
                          </button>
                        </div>
                      )}

                      <div className="font-mono text-sm leading-relaxed tracking-wider break-all bg-slate-900 p-4 rounded-lg h-full overflow-y-auto max-h-[600px] border border-slate-700">
                        {selectedSeqType === "protein" 
                          ? <div className="whitespace-pre-wrap">{renderProteinSequence(sequenceData)}</div>
                          : <pre className="whitespace-pre-wrap text-blue-300">{formatSequence(sequenceData)}</pre>
                        }
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                      No sequence data available.
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
