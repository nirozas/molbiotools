"use client";

import React, { useState } from "react";
import { X, Plus, Tags } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Annotation } from "./useSequenceStore";

interface FeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (ann: Omit<Annotation, "id">) => void;
  maxLen: number;
}

export default function FeatureModal({
  isOpen,
  onClose,
  onAdd,
  maxLen
}: FeatureModalProps) {
  const [label, setLabel] = useState("");
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [type, setType] = useState<Annotation["type"]>("misc");
  const [strand, setStrand] = useState<Annotation["strand"]>("+");
  const [color, setColor] = useState("#00d4ff");

  if (!isOpen) return null;

  const colors = ["#00d4ff", "#10b981", "#8b5cf6", "#f59e0b", "#f43f5e", "#ec4899", "#3b82f6"];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
        >
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Tags size={20} className="text-purple-400" />
              Add Manual Feature
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Label Name</label>
              <input 
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. GFP_Expression_Cassette"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white outline-none focus:border-purple-500/50 transition-all text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Start Position</label>
                <input 
                  type="number"
                  value={start}
                  onChange={(e) => setStart(parseInt(e.target.value))}
                  min={1}
                  max={maxLen}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white outline-none focus:border-purple-500/50 transition-all text-sm font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">End Position</label>
                <input 
                  type="number"
                  value={end}
                  onChange={(e) => setEnd(parseInt(e.target.value))}
                  min={1}
                  max={maxLen}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white outline-none focus:border-purple-500/50 transition-all text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Type</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white outline-none focus:border-purple-500/50 transition-all text-sm"
                >
                  <option value="cds">CDS</option>
                  <option value="gene">Gene</option>
                  <option value="promoter">Promoter</option>
                  <option value="primer">Primer</option>
                  <option value="misc">Miscellaneous</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Strand</label>
                <select 
                  value={strand}
                  onChange={(e) => setStrand(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white outline-none focus:border-purple-500/50 transition-all text-sm"
                >
                  <option value="+">Forward (+)</option>
                  <option value="-">Reverse (-)</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Feature Color</label>
              <div className="flex gap-2">
                {colors.map(c => (
                  <button 
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-lg transition-transform ${color === c ? 'scale-110 border-2 border-white' : 'hover:scale-105'}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-950/50 border-t border-slate-800 flex justify-end gap-3">
             <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-500 hover:text-white transition-colors">Cancel</button>
             <button 
               onClick={() => {
                 if (label && start && end) {
                    onAdd({
                      label,
                      start: start - 1, // Store 0-indexed
                      end: end - 1,
                      type,
                      strand,
                      color
                    });
                    onClose();
                 }
               }}
               className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2"
             >
               <Plus size={18} /> Add Feature
             </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
