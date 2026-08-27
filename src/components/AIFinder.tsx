"use client";

import React, { useState } from 'react';
import { Search, ExternalLink, ArrowRight, Loader2, Bot, Sparkles, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface AIResponse {
  internalTools: { name: string, url: string }[];
  externalTools: { name: string, url: string }[];
  message: string;
  isMissingFeature: boolean;
}

export default function AIFinder() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/ai-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch AI response');
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message || "I'm having trouble connecting to my AI brain right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-16 relative z-20">
      {/* Decorative Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[24px] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
      
      <div className="relative bg-[#0B0F19]/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30 text-indigo-400 mb-1">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-200">AI Tool Finder</h2>
            <p className="text-slate-400 text-sm mt-1">Describe what you want to do, and I'll find the right tool for you.</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative flex flex-col">
          <div className="absolute left-5 top-5 text-slate-500 pointer-events-none z-10">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (prompt.trim() && !loading) {
                  const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
                  handleSearch(syntheticEvent);
                }
              }
            }}
            placeholder="e.g., I need to compare two protein structures..."
            style={{ paddingLeft: '3.5rem', paddingTop: '1.25rem' }}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pr-28 pb-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm md:text-base resize-none"
            rows={4}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="absolute right-3 bottom-3 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
          >
            Find
          </button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          {result && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              className="mt-6 pt-6 border-t border-slate-800 space-y-6 overflow-hidden"
            >
              <div className="flex flex-col items-center text-center gap-4 mb-8">
                <motion.div 
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="relative w-16 h-16 rounded-full mb-4 flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_40px_rgba(139,92,246,0.6)] border-2 border-white/20 z-10"
                >
                  <Bot size={34} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                  
                  {/* Glowing orbital rings for a 3D tech effect */}
                  <motion.div 
                    animate={{ rotateZ: 360, rotateX: 60 }}
                    transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                    className="absolute inset-[-12px] rounded-full border-t-2 border-l-2 border-indigo-300/60"
                  />
                  <motion.div 
                    animate={{ rotateZ: -360, rotateY: 60 }}
                    transition={{ repeat: Infinity, duration: 14, ease: "linear" }}
                    className="absolute inset-[-20px] rounded-full border-b-2 border-r-2 border-pink-400/50"
                  />
                </motion.div>
                <p className="text-slate-200 text-sm md:text-base font-medium leading-relaxed max-w-2xl mt-4">
                  {result.message}
                </p>
              </div>

              <div className="flex flex-col items-center gap-6 w-full max-w-3xl mx-auto">
                {result.internalTools.length > 0 && (
                  <div className="w-full space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 text-center">Recommended Tools</h4>
                    <div className="flex flex-col gap-3">
                      {result.internalTools.map((tool, idx) => (
                        <Link key={idx} href={tool.url} className="flex items-center justify-between p-5 md:p-6 rounded-2xl bg-indigo-600/10 border-2 border-indigo-500/30 hover:bg-indigo-600/20 hover:border-indigo-400 transition-all group shadow-[0_0_20px_rgba(99,102,241,0.1)] hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                          <div className="flex flex-col text-left gap-1">
                            <span className="text-indigo-300 font-bold text-lg md:text-xl">{tool.name}</span>
                            <span className="text-indigo-200/50 text-xs hidden md:block uppercase tracking-wider">{tool.url}</span>
                          </div>
                          <div className="bg-indigo-500/20 p-3 rounded-full text-indigo-300 group-hover:scale-110 group-hover:bg-indigo-500/40 transition-all">
                            <ArrowRight size={24} />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {result.externalTools.length > 0 && (
                  <div className="w-full space-y-4 mt-4">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 text-center">External Platforms</h4>
                    <div className="flex flex-col gap-3">
                      {result.externalTools.map((tool, idx) => (
                        <a key={idx} href={tool.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 md:p-5 rounded-2xl bg-slate-800/40 border-2 border-slate-700/50 hover:bg-slate-800 hover:border-slate-500 transition-all group">
                          <span className="text-slate-300 font-bold text-base md:text-lg">{tool.name}</span>
                          <ExternalLink size={20} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {result.isMissingFeature && (
                <div className="mt-8 p-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/30 rounded-2xl flex flex-col items-center text-center gap-3 w-full max-w-2xl mx-auto shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
                  </div>
                  <h4 className="text-emerald-300 text-lg font-bold">Feature Request Automatically Logged!</h4>
                  <p className="text-emerald-400/80 text-sm md:text-base leading-relaxed">It looks like we don't have this tool built yet. Our AI has securely sent a request to the developer team so they can build it for you.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
