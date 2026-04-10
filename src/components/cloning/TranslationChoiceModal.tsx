"use client";

import React from "react";
import { X, Cpu, MousePointer2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TranslationChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mode: 'auto' | 'manual') => void;
}

export default function TranslationChoiceModal({
  isOpen,
  onClose,
  onSelect,
}: TranslationChoiceModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
        >
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Translation Mode
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 gap-4">
             <button 
               onClick={() => {
                 onSelect('auto');
                 onClose();
               }}
               className="group flex items-start gap-4 p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-2xl transition-all text-left"
             >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-all">
                   <Cpu size={24} />
                </div>
                <div>
                   <div className="text-sm font-bold text-white mb-1">Automatic ORF Scanner</div>
                   <p className="text-xs text-slate-500 leading-relaxed">
                     Automatically scan the entire sequence for "ATG" start codons and translate until the next STOP.
                   </p>
                </div>
             </button>

             <button 
               onClick={() => {
                 onSelect('manual');
                 onClose();
               }}
               className="group flex items-start gap-4 p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 rounded-2xl transition-all text-left"
             >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-all">
                   <MousePointer2 size={24} />
                </div>
                <div>
                   <div className="text-sm font-bold text-white mb-1">Manual Start Position</div>
                   <p className="text-xs text-slate-500 leading-relaxed">
                     Select an exact nucleotide to start translation from. Useful for partial sequences or alternative start sites.
                   </p>
                </div>
             </button>
          </div>

          <div className="px-6 py-4 bg-slate-950/50 border-t border-slate-800 text-center">
             <p className="text-[10px] text-slate-600 italic">Advanced codon optimization features coming soon in v1.1</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
