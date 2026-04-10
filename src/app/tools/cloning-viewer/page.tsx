"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import { useSequenceStore } from "@/components/cloning/useSequenceStore";
import SequenceViewer from "@/components/cloning/SequenceViewer";
import PlasmidMap from "@/components/cloning/PlasmidMap";
import SequenceModal from "@/components/cloning/SequenceModal";
import FeatureModal from "@/components/cloning/FeatureModal";
import TranslationChoiceModal from "@/components/cloning/TranslationChoiceModal";
import { 
  Download, 
  Copy, 
  Settings, 
  Info, 
  Plus,
  Scissors,
  Share2,
  FileCode,
  Undo,
  Upload,
  Globe,
  PlusCircle,
  Search,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CloningViewerPage() {
  const store = useSequenceStore();
  const [isSeqModalOpen, setIsSeqModalOpen] = React.useState(false);
  const [isFeatureModalOpen, setIsFeatureModalOpen] = React.useState(false);
  const [isTranslateModalOpen, setIsTranslateModalOpen] = React.useState(false);

  const handleCreateProject = (name: string, seq: string, circular: boolean) => {
    store.importSequence(name, seq);
    if (store.circular !== circular) store.toggleCircular();
  };

  const handleManualStart = () => {
    if (store.selection) {
      store.setManualTranslationStart(Math.min(store.selection.start, store.selection.end));
    }
  };

  const handleCopyComplement = () => {
    if (store.selection) {
      const start = Math.min(store.selection.start, store.selection.end);
      const end = Math.max(store.selection.start, store.selection.end);
      const subComp = store.complement.slice(start, end + 1);
      store.copyToClipboard(subComp);
      alert("Complement sequence copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200">
      <Navbar />
      
      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-500 mb-2">
              <Scissors size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">Molecular Editor</span>
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Cloning <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Viewer</span>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full font-mono">v1.0-beta</span>
            </h1>
            <p className="text-slate-400 mt-2 max-w-2xl">
              Professional-grade sequence visualization and annotation tool. 
              Upload sequences, identify features, and plan your restriction cloning with ease.
            </p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setIsSeqModalOpen(true)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl transition-all border border-slate-700 font-bold"
            >
              <PlusCircle size={18} className="text-cyan-400" /> New Project
            </button>
            <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl transition-all border border-slate-700">
              <Download size={18} /> Export
            </button>
            <button className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:opacity-90 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-cyan-500/20 transition-all">
              <Share2 size={18} /> share
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Workspace */}
          <div className="lg:col-span-3 space-y-6">
            {/* Editor Container */}
            <section className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl">
              <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${store.circular ? 'bg-indigo-500' : 'bg-green-500'}`}></span>
                    <span className="font-mono text-sm font-bold text-slate-300">{store.name}</span>
                  </div>
                  <div className="h-4 w-px bg-slate-800"></div>
                  <span className="text-xs text-slate-500 font-mono">{store.sequence.length.toLocaleString()} bp</span>
                  <div className="h-4 w-px bg-slate-800"></div>
                  <span className="text-xs text-slate-500 font-mono italic">{store.circular ? 'Circular' : 'Linear'}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400" />
                    <input 
                      type="text" 
                      placeholder="Search DNA..."
                      value={store.searchQuery}
                      onChange={(e) => store.setSearchQuery(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs font-mono text-white outline-none focus:border-cyan-500/50 w-48 transition-all"
                    />
                  </div>
                  <div className="h-4 w-px bg-slate-800"></div>
                  <button 
                    onClick={store.toggleAminoAcids}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      store.showAminoAcids 
                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' 
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Translations
                  </button>
                  <button 
                    onClick={store.toggleCircular}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      store.circular 
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Circularize
                  </button>
                  <button 
                    onClick={() => {
                      if (store.translationMode !== 'off') store.setTranslationMode('off');
                      else setIsTranslateModalOpen(true);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      store.translationMode !== 'off' 
                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' 
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {store.translationMode === 'off' ? 'Translations' : `Translation (${store.translationMode})`}
                  </button>
                </div>
              </div>

              {/* Manual Translation Mode Banner */}
              <AnimatePresence>
                {store.translationMode === 'manual' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-purple-900/20 border-b border-purple-500/30 px-6 py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 text-purple-300 text-xs font-bold">
                       <MousePointer2 size={16} />
                       {store.manualTranslationStart === null 
                          ? "Step 1: Select a base in the editor below to set the translation start position"
                          : `Start set at BP ${store.manualTranslationStart + 1}. You can change it by clicking elsewhere.`}
                    </div>
                    {store.manualTranslationStart !== null && (
                       <button 
                        onClick={() => store.setTranslationMode('manual')} // Just refresh
                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                       >
                         <CheckCircle2 size={14} /> Finish Selection
                       </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-6">
                <SequenceViewer 
                  sequence={store.sequence}
                  complement={store.complement}
                  annotations={store.annotations}
                  selection={store.selection}
                  onSelectionChange={(sel) => {
                    store.setSelection(sel);
                    if (store.translationMode === 'manual' && sel) {
                      store.setManualTranslationStart(Math.min(sel.start, sel.end));
                    }
                  }}
                  showComplement={store.showComplement}
                  showAminoAcids={store.showAminoAcids}
                  translateRange={store.translateRange}
                  searchQuery={store.searchQuery}
                  orfTranslations={store.orfTranslations}
                  AA_COLORS={store.AA_COLORS}
                />
              </div>

              {/* Selection Bar */}
              {store.selection && (
                <motion.div 
                  initial={{ y: 50 }}
                  animate={{ y: 0 }}
                  className="bg-slate-800 px-6 py-3 flex items-center justify-between border-t border-slate-700"
                >
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Selection</span>
                      <span className="text-sm font-mono text-cyan-400">
                        {Math.min(store.selection.start, store.selection.end) + 1} - {Math.max(store.selection.start, store.selection.end) + 1} 
                        ({Math.abs(store.selection.end - store.selection.start) + 1} bp)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => store.copyToClipboard(store.selectedSequence)}
                        className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      >
                        <Copy size={14} /> Copy
                      </button>
                      <button 
                        onClick={handleCopyComplement}
                        className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      >
                        <Undo size={14} className="rotate-180" /> Copy Complement
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => store.setSelection(null)}
                    className="text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-widest"
                  >
                    Clear
                  </button>
                </motion.div>
              )}
            </section>

            {/* Bottom Actions/Tabs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <FileCode size={20} className="text-purple-400" />
                    Project Metadata
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm py-2 border-b border-slate-800/50">
                      <span className="text-slate-500">Total Bases</span>
                      <span className="font-mono">{store.sequence.length.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-slate-800/50">
                      <span className="text-slate-500">GC Content</span>
                      <span className="font-mono text-cyan-400">{store.gcContent}%</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-slate-800/50">
                      <span className="text-slate-500">Melting Temp (Tm)</span>
                      <span className="font-mono">72.4°C</span>
                    </div>
                  </div>
               </div>

               <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Info size={20} className="text-cyan-400" />
                    Simulation Tools
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={store.findRestrictionSites}
                      className="bg-slate-800 hover:bg-slate-700 p-3 rounded-xl text-xs font-bold flex flex-col items-center gap-2 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-all">
                        <Scissors size={16} className="text-red-400" />
                      </div>
                      Scan Enzymes
                    </button>
                    <button className="bg-slate-800 hover:bg-slate-700 p-3 rounded-xl text-xs font-bold flex flex-col items-center gap-2 transition-all">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center">
                        <Globe size={16} className="text-cyan-400" />
                      </div>
                      BLAST Search
                    </button>
                  </div>
               </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <PlasmidMap 
              sequenceLength={store.sequence.length}
              annotations={store.annotations}
              name={store.name}
              circular={store.circular}
            />

            <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center justify-between">
                Annotations
                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">{store.annotations.length}</span>
              </h3>
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {store.annotations.map(ann => (
                  <div 
                    key={ann.id}
                    className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 p-3 rounded-xl transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white truncate">{ann.label}</span>
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ background: ann.color, boxShadow: `0 0 10px ${ann.color}44` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500">{ann.start}..{ann.end}</span>
                      <span className="text-[10px] font-bold text-slate-600 uppercase group-hover:text-slate-400">{ann.type}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setIsFeatureModalOpen(true)}
                className="w-full mt-6 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold py-3 rounded-xl transition-all border border-slate-700"
              >
                <Plus size={14} /> New Manual Feature
              </button>
            </section>
          </aside>
        </div>
      </main>

      <SequenceModal 
        isOpen={isSeqModalOpen}
        onClose={() => setIsSeqModalOpen(false)}
        onSave={handleCreateProject}
      />

      <FeatureModal 
        isOpen={isFeatureModalOpen}
        onClose={() => setIsFeatureModalOpen(false)}
        onAdd={store.addAnnotation}
        maxLen={store.sequence.length}
      />

      <TranslationChoiceModal 
        isOpen={isTranslateModalOpen}
        onClose={() => setIsTranslateModalOpen(false)}
        onSelect={(mode) => {
          store.setTranslationMode(mode);
          if (mode === 'manual') store.setManualTranslationStart(null);
        }}
      />
    </div>
  );
}
