"use client";

import React, { useState } from "react";
import { X, Save, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, seq: string, circular: boolean) => void;
  initialName?: string;
  initialSeq?: string;
  initialCircular?: boolean;
}

export default function SequenceModal({
  isOpen,
  onClose,
  onSave,
  initialName = "",
  initialSeq = "",
  initialCircular = false
}: SequenceModalProps) {
  const [name, setName] = useState(initialName);
  const [seq, setSeq] = useState(initialSeq);
  const [circular, setCircular] = useState(initialCircular);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
        >
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Copy size={20} className="text-cyan-400" />
              New Sequence Project
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Project Name</label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. pUC19_Clone_01"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500/50 transition-all font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">DNA Sequence (Plain Text)</label>
              <textarea 
                value={seq}
                onChange={(e) => setSeq(e.target.value)}
                rows={8}
                placeholder="Paste your DNA sequence here..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500/50 transition-all font-mono text-sm resize-none"
              />
              <p className="text-[10px] text-slate-600">Non-DNA characters will be automatically filtered or replaced with 'N'.</p>
            </div>

            <div className="flex items-center gap-6">
               <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Topology</div>
               <div className="flex gap-2">
                  <button 
                    onClick={() => setCircular(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${!circular ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                  >
                    Linear
                  </button>
                  <button 
                    onClick={() => setCircular(true)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${circular ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                  >
                    Circular
                  </button>
               </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-950/50 border-t border-slate-800 flex justify-end gap-3">
             <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-500 hover:text-white transition-colors">Cancel</button>
             <button 
               onClick={() => {
                 if (name && seq) {
                    onSave(name, seq, circular);
                    onClose();
                 }
               }}
               className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:opacity-90 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
             >
               <Save size={18} /> Create Project
             </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
