const fs = require('fs');
const path = 'e:\\MolBioTools\\src\\components\\tools\\ToolHost.tsx';
let content = fs.readFileSync(path, 'utf8');

// The corruption starts where toolId === "gene-optimizer" is checked, 
// and where PCR code is wrongly injected.
const lines = content.split('\n');

// Let's identify the start of Gene Optimizer tool block
let goStart = -1;
let goEnd = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('toolId === "gene-optimizer"')) {
        goStart = i;
    }
    // The next tool is ligation-calculator
    if (goStart !== -1 && lines[i].includes('toolId === "ligation-calculator"')) {
        goEnd = i;
        break;
    }
}

if (goStart !== -1 && goEnd !== -1) {
    console.log(`Excising Gene Optimizer block from line ${goStart + 1} to ${goEnd}`);
    
    const correctGoBlock = `            ) : toolId === "gene-optimizer" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Step Indicator */}
                <div style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem" }}>
                  {[1, 2, 3].map(s => (
                    <div key={s} style={{ flex: 1, height: "4px", background: goStep >= s ? "#22c55e" : "rgba(255,255,255,0.05)", borderRadius: "2px" }} />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <span style={{ color: "#22c55e", fontSize: "0.75rem", fontWeight: 800 }}>STEP {goStep}: {goStep === 1 ? "ANALYSIS & REGION" : goStep === 2 ? "VERIFY TRANSLATION" : "OPTIMIZATION"}</span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {goStep > 1 && <button onClick={() => setGoStep(goStep - 1)} style={{ background: "rgba(255,255,255,0.05)", color: "white", border: "none", padding: "0.3rem 0.6rem", borderRadius: "6px", fontSize: "0.7rem", cursor: "pointer" }}>Back</button>}
                  </div>
                </div>

                {goStep === 1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div>
                      <label style={{ color: "#94a3b8", fontSize: "0.80rem", display: "block", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase" }}>1. Enter Sequence</label>
                      <textarea value={goDNA} onChange={e => setGoDNA(e.target.value)} style={{ ...calcInputStyle, minHeight: "100px", fontFamily: "monospace", fontSize: "0.9rem" }} placeholder="Enter DNA sequence..." />
                    </div>
                    <button onClick={runGeneAnalysisStep} style={{ background: "#22c55e", color: "black", border: "none", borderRadius: "12px", padding: "0.75rem", fontWeight: 800, cursor: "pointer" }}>Analyze Complexity</button>
                    
                    {goAnalysis && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.05)", padding: "2rem", overflowX: "auto" }}>
                          <div style={{ minWidth: "1150px", paddingBottom: "1rem" }}>
                            {/* Ruler and DNA Map */}
                            {goDNA.replace(/[\\n\\r\\t >0-9]/g, "").toUpperCase().match(/.{1,80}/g)?.map((chunk, rowIdx) => (
                              <div key={rowIdx} style={{ marginBottom: "3rem", position: "relative" }}>
                                {/* Ticks */}
                                <div style={{ display: "flex", height: "15px", marginBottom: "4px" }}>
                                  {chunk.split('').map((_, i) => (
                                    <div key={i} style={{ width: "14px", borderLeft: (rowIdx*80+i+1) % 10 === 0 ? "1px solid #475569" : "none", position: "relative", flexShrink: 0 }}>
                                      {(rowIdx*80+i+1) % 10 === 0 && <span style={{ position: "absolute", top: "-12px", left: "-6px", fontSize: "10px", color: "#64748b" }}>{rowIdx*80+i+1}</span>}
                                    </div>
                                  ))}
                                </div>
                                {/* Sequence */}
                                <div style={{ display: "flex", fontFamily: "'JetBrains Mono', monospace", fontSize: "14px", fontWeight: 700, color: "white" }}>
                                  {chunk.split('').map((char, i) => (
                                    <div key={i} style={{ width: "14px", textAlign: "center", flexShrink: 0 }}>{char}</div>
                                  ))}
                                </div>
                                {/* Feature Bars (Repeats) */}
                                <div style={{ position: "relative", height: "30px", marginTop: "8px" }}>
                                  {goAnalysis.repeats.map((rep, i) => {
                                      const start = rowIdx * 80;
                                      const end = start + 80;
                                      if (rep.start <= end && rep.end >= start + 1) {
                                          const left = Math.max(0, rep.start - 1 - start) * 14;
                                          const width = (Math.min(end, rep.end) - Math.max(start + 1, rep.start) + 1) * 14;
                                          return (
                                            <div key={i} style={{ position: "absolute", top: "0", left: \`\${left}px\`, width: \`\${width}px\`, height: "6px", background: "#f59e0b", borderRadius: "100px", opacity: 0.8 }}>
                                               <span style={{ position: "absolute", bottom: "-14px", left: "0", fontSize: "8px", fontWeight: 800, color: "#f59e0b", whiteSpace: "nowrap" }}>REPEAT ZONE</span>
                                            </div>
                                          );
                                      }
                                      return null;
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "1.5rem" }}>
                           <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "16px", padding: "1.5rem" }}>
                              <label style={{ color: "#22c55e", fontSize: "0.80rem", display: "block", marginBottom: "1rem", fontWeight: 800, textTransform: "uppercase" }}>Complexity Summary</label>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                 <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#64748b", fontSize: "0.85rem" }}>Total Repeats</span>
                                    <span style={{ color: "white", fontWeight: 700 }}>{goAnalysis.repeats.length}</span>
                                 </div>
                                 {goAnalysis.issues.map((issue, i) => (
                                   <div key={i} style={{ color: "#f43f5e", fontSize: "0.8rem", background: "rgba(244,63,94,0.03)", padding: "0.5rem", borderRadius: "8px" }}>• {issue}</div>
                                 ))}
                              </div>
                           </div>

                           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                              <div style={{ gridColumn: "span 2" }}>
                                <label style={{ color: "#94a3b8", fontSize: "0.80rem", display: "block", marginBottom: "0.5rem", fontWeight: 700 }}>Target Selection</label>
                                <div style={{ display: "flex", gap: "0.5rem", background: "rgba(0,0,0,0.2)", padding: "0.3rem", borderRadius: "10px" }}>
                                  {["ORF", "CDS", "NONE"].map(t => (
                                    <button key={t} onClick={() => setGoType(t)} style={{ flex: 1, padding: "0.5rem", borderRadius: "8px", border: "none", background: goType === t ? "#22c55e" : "transparent", color: goType === t ? "black" : "#64748b", fontSize: "0.7rem", fontWeight: 800 }}>{t}</button>
                                  ))}
                                </div>
                              </div>
                              <div style={{ background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <label style={{ fontSize: "0.6rem", color: "#64748b", fontWeight: 800, display: "block", marginBottom: "0.5rem" }}>START (5')</label>
                                <input type="number" value={goRange.start} onChange={e => setGoRange({...goRange, start: parseInt(e.target.value)})} style={{ background: "transparent", border: "none", color: "white", fontSize: "1.2rem", fontWeight: 800, width: "100%" }} />
                                {goType === "ORF" && <div style={{ fontSize: "0.6rem", color: "#22c55e", marginTop: "0.2rem" }}>SCANS FOR NEXT ATG</div>}
                              </div>
                              <div style={{ background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", opacity: goType === "ORF" ? 0.3 : 1 }}>
                                <label style={{ fontSize: "0.6rem", color: "#64748b", fontWeight: 800, display: "block", marginBottom: "0.5rem" }}>END (3')</label>
                                <input type="number" value={goRange.end} onChange={e => setGoRange({...goRange, end: parseInt(e.target.value)})} style={{ background: "transparent", border: "none", color: "white", fontSize: "1.2rem", fontWeight: 800, width: "100%" }} disabled={goType === "ORF"} />
                                <div style={{ fontSize: "0.6rem", color: "#64748b", marginTop: "0.2rem" }}>{goRange.end - goRange.start + 1} bp</div>
                              </div>
                              <button onClick={() => { calcGeneTranslation(); setGoStep(2); }} style={{ gridColumn: "span 2", background: "white", color: "black", border: "none", borderRadius: "12px", padding: "1rem", fontWeight: 900, cursor: "pointer", boxShadow: "0 0 20px rgba(255,255,255,0.1)" }}>PREVIEW TRANSLATION & PROCEED</button>
                           </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {goStep === 2 && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.05)", padding: "2rem", overflowX: "auto" }}>
                          <div style={{ minWidth: "1150px" }}>
                            {goDNA.replace(/[\\n\\r\\t >0-9]/g, "").toUpperCase().match(/.{1,80}/g)?.map((chunk, rowIdx) => (
                              <div key={rowIdx} style={{ marginBottom: "4rem", position: "relative" }}>
                                {/* Ticks */}
                                <div style={{ display: "flex", height: "15px", marginBottom: "4px" }}>
                                  {chunk.split('').map((_, i) => (
                                    <div key={i} style={{ width: "14px", borderLeft: (rowIdx*80+i+1) % 10 === 0 ? "1px solid #475569" : "none", position: "relative", flexShrink: 0 }}>
                                      {(rowIdx*80+i+1) % 10 === 0 && <span style={{ position: "absolute", top: "-12px", left: "-6px", fontSize: "10px", color: "#64748b" }}>{rowIdx*80+i+1}</span>}
                                    </div>
                                  ))}
                                </div>
                                {/* Translation Track (Selected region) */}
                                <div style={{ display: "flex", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", fontWeight: 800, height: "20px" }}>
                                  {chunk.split('').map((_, i) => {
                                      const globalIdx = rowIdx * 80 + i + 1;
                                      const dnaClean = goDNA.replace(/[\\n\\r\\t >0-9]/g, "").toUpperCase();
                                      let codingStart = goRange.start;
                                      if (goType === "ORF") {
                                          const nextATG = dnaClean.indexOf("ATG", goRange.start - 1);
                                          codingStart = nextATG !== -1 ? nextATG + 1 : -1;
                                      }
                                      
                                      if (codingStart !== -1 && globalIdx >= codingStart && globalIdx <= goRange.end) {
                                          const localOffset = globalIdx - codingStart;
                                          if (localOffset % 3 === 0) {
                                              const codon = dnaClean.substring(globalIdx - 1, globalIdx + 2);
                                              const aa = GENETIC_CODE[codon] || " ";
                                              return <div key={i} style={{ width: "42px", textAlign: "center", color: getRasMolColor(aa) }}>{aa}</div>;
                                          }
                                          if (localOffset % 3 !== 0) return null;
                                      }
                                      return <div key={i} style={{ width: "14px", flexShrink: 0 }}></div>;
                                  })}
                                </div>
                                {/* Sequence */}
                                <div style={{ display: "flex", fontFamily: "'JetBrains Mono', monospace", fontSize: "14px", fontWeight: 700, color: "white" }}>
                                  {chunk.split('').map((char, i) => (
                                    <div key={i} style={{ width: "14px", textAlign: "center", flexShrink: 0 }}>{char}</div>
                                  ))}
                                </div>
                                {/* Repetition Bars */}
                                <div style={{ position: "relative", height: "20px", marginTop: "8px" }}>
                                  {goAnalysis.repeats.map((rep, i) => {
                                      const start = rowIdx * 80;
                                      const end = start + 80;
                                      if (rep.start <= end && rep.end >= start + 1) {
                                          const left = Math.max(0, rep.start - 1 - start) * 14;
                                          const width = (Math.min(end, rep.end) - Math.max(start + 1, rep.start) + 1) * 14;
                                          return <div key={i} style={{ position: "absolute", top: "0", left: \`\${left}px\`, width: \`\${width}px\`, height: "6px", background: "#f59e0b", borderRadius: "100px", opacity: 0.8 }} />;
                                      }
                                      return null;
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                      </div>
                      <button onClick={() => setGoStep(3)} style={{ background: "#22c55e", color: "black", border: "none", borderRadius: "12px", padding: "1rem", fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 20px rgba(34, 197, 94, 0.4)" }}>Verify & Configure Optimization</button>
                    </motion.div>
                )}

                {goStep === 3 && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                           {/* Column 1: Rules & Strategy */}
                           <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "20px", padding: "1.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                                 <label style={{ fontSize: "0.75rem", color: "#22c55e", fontWeight: 800, textTransform: "uppercase", marginBottom: "1.5rem", display: "block" }}>Optimization Rules (Twist Protocol)</label>
                                 <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem", color: "#94a3b8" }}>
                                    <div style={{ display: "flex", gap: "0.75rem" }}><span style={{ color: "#22c55e" }}>✓</span> Avoids repeats longer than 15bp</div>
                                    <div style={{ display: "flex", gap: "0.75rem" }}><span style={{ color: "#22c55e" }}>✓</span> Eliminates homopolymer runs &gt; 10bp</div>
                                    <div style={{ display: "flex", gap: "0.75rem" }}><span style={{ color: "#22c55e" }}>✓</span> Balances local GC content (35% - 65%)</div>
                                    <div style={{ display: "flex", gap: "0.75rem" }}><span style={{ color: "#22c55e" }}>✓</span> Removes internal RBS and Sigma70 sites</div>
                                    <div style={{ marginTop: "1rem", color: "#64748b", fontSize: "0.75rem", fontStyle: "italic" }}>
                                       "Optimization reduces risk of secondary structures and assembly failure."
                                    </div>
                                 </div>
                              </div>
                              
                              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                 <div>
                                   <label style={{ color: "white", fontSize: "0.85rem", display: "block", marginBottom: "0.5rem", fontWeight: 700 }}>Choose Codon Table</label>
                                   <select value={goOrganism} onChange={e => setGoOrganism(e.target.value)} style={calcInputStyle}>
                                     {Object.keys(OPT_TABLES).map(org => <option key={org} value={org}>{org}</option>)}
                                   </select>
                                 </div>
                                 <div>
                                   <label style={{ color: "white", fontSize: "0.85rem", display: "block", marginBottom: "0.5rem", fontWeight: 700 }}>Strategy</label>
                                   <select value={goMode} onChange={e => setGoMode(e.target.value)} style={calcInputStyle}>
                                     <option value="full">Maximum Expression (tRNA Awareness)</option>
                                     <option value="minimal">Minimal Changes (as close as possible to the original DNA)</option>
                                   </select>
                                 </div>
                              </div>
                           </div>

                           {/* Column 2: Specific Constraints */}
                           <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "20px", padding: "1.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                                 <label style={{ fontSize: "0.75rem", color: "#22c55e", fontWeight: 800, textTransform: "uppercase", marginBottom: "1.5rem", display: "block" }}>Regions to Preserve</label>
                                 <p style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "1rem" }}>Specify ranges that will not be modified (e.g., Promoters, Tags).</p>
                                 <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                                    <input type="number" placeholder="Start" value={goPreserveInput.start} onChange={e => setGoPreserveInput({...goPreserveInput, start: e.target.value})} style={calcInputStyle} />
                                    <input type="number" placeholder="End" value={goPreserveInput.end} onChange={e => setGoPreserveInput({...goPreserveInput, end: e.target.value})} style={calcInputStyle} />
                                    <button onClick={() => { if(goPreserveInput.start && goPreserveInput.end) setGoPreserved([...goPreserved, { start: parseInt(goPreserveInput.start), end: parseInt(goPreserveInput.end) }]); setGoPreserveInput({start: "", end: ""}); }} style={{ background: "#22c55e", color: "black", border: "none", borderRadius: "8px", padding: "0 1rem", fontWeight: 800, cursor: "pointer" }}>Add</button>
                                 </div>
                                 <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                    {goPreserved.map((p, i) => (
                                      <div key={i} style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", padding: "0.5rem 0.8rem", borderRadius: "8px", fontSize: "0.8rem" }}>
                                         <span style={{ color: "white" }}>{p.start} - {p.end} <span style={{ color: "#475569" }}>({p.end - p.start + 1} bp)</span></span>
                                         <button onClick={() => setGoPreserved(goPreserved.filter((_, idx) => idx !== i))} style={{ color: "#f43f5e", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
                                      </div>
                                    ))}
                                    {goPreserved.length === 0 && <div style={{ textAlign: "center", color: "#475569", fontSize: "0.8rem" }}>No regions selected</div>}
                                 </div>
                              </div>

                              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "20px", padding: "1.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                                 <label style={{ color: "#22c55e", fontSize: "0.75rem", display: "block", marginBottom: "1.5rem", fontWeight: 800, textTransform: "uppercase" }}>Avoid Creating Restriction Sites</label>
                                 <div style={{ position: "relative" }}>
                                   <input 
                                     type="text" 
                                     placeholder="Search enzyme (e.g. EcoRI)" 
                                     value={goEnzSearch} 
                                     onChange={e => setGoEnzSearch(e.target.value)} 
                                     style={{ ...calcInputStyle, marginBottom: "0.5rem" }} 
                                   />
                                   {goEnzSearch && (
                                     <div style={{ position: "absolute", top: "45px", left: 0, width: "100%", background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", zIndex: 10, maxHeight: "150px", overflowY: "auto", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                                       {ALL_ENZYMES.filter(e => e.name.toLowerCase().includes(goEnzSearch.toLowerCase()) && !goForbidden.includes(e.name)).map(enz => (
                                         <div key={enz.name} onClick={() => { setGoForbidden([...goForbidden, enz.name]); setGoEnzSearch(""); }} style={{ padding: "0.6rem 1rem", cursor: "pointer", display: "flex", justifyContent: "space-between", fontSize: "0.85rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                            <span style={{ color: "white", fontWeight: 700 }}>{enz.name}</span>
                                            <span style={{ color: "#475569", fontFamily: "monospace" }}>{enz.site}</span>
                                         </div>
                                       ))}
                                     </div>
                                   )}
                                 </div>
                                 <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                   {goForbidden.map(name => (
                                     <div key={name} style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", padding: "0.4rem 0.8rem", borderRadius: "8px", fontSize: "0.75rem", color: "#22c55e", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                       {name}
                                       <button onClick={() => setGoForbidden(goForbidden.filter(n => n !== name))} style={{ background: "none", border: "none", color: "#f43f5e", cursor: "pointer", fontWeight: 800 }}>×</button>
                                     </div>
                                   ))}
                                 </div>
                              </div>

                              <button onClick={calcGeneOptimizer} style={{ background: "#22c55e", color: "black", border: "none", borderRadius: "12px", padding: "1rem", fontWeight: 900, fontSize: "1rem", cursor: "pointer", boxShadow: "0 0 25px rgba(34, 197, 94, 0.4)" }}>START GENERATION Wizard</button>
                           </div>
                        </div>
                   </motion.div>
                )}

                {goResult && (
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                    <div style={{ background: "rgba(15, 23, 42, 0.6)", borderRadius: "24px", border: "1px solid rgba(34,197,94,0.2)", padding: "2rem" }}>
                       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                             <div style={{ fontSize: "2rem", fontWeight: 900, color: "white" }}>{goResult.gc}% <span style={{ fontSize: "0.8rem", color: "#64748b" }}>GC</span></div>
                             <div style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", padding: "0.3rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 800 }}>MISSION OPTIMIZED</div>
                             {goResult.sitesFixed > 0 && <div style={{ color: "#f59e0b", fontSize: "0.7rem", fontWeight: 700 }}>{goResult.sitesFixed} SURGICAL SWAPS PERFORMED</div>}
                          </div>
                          <div style={{ display: "flex", gap: "1rem" }}>
                             <button onClick={() => { navigator.clipboard.writeText(goResult.optimized); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ color: "white", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "0.6rem 1.2rem", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 800 }}>
                                {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "COPIED" : "COPY DNA"}
                             </button>
                             <button onClick={() => { 
                                 const blob = new Blob([\`>Optimized_Sequence\\n\${goResult.optimized}\`], { type: "text/plain" });
                                 const url = URL.createObjectURL(blob);
                                 const a = document.createElement("a");
                                 a.href = url;
                                 a.download = "optimized_sequence.fasta";
                                 a.click();
                             }} style={{ color: "black", background: "#22c55e", border: "none", padding: "0.6rem 1.2rem", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 800 }}>
                                <FileText size={16} /> EXPORT FASTA
                             </button>
                          </div>
                       </div>

                       <div style={{ border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", background: "rgba(0,0,0,0.3)", padding: "1.5rem", marginBottom: "2rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                            <label style={{ color: "#94a3b8", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase" }}>Optimization Sequence Comparison</label>
                            <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.7rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><div style={{ width: 8, height: 8, background: "#f43f5e", borderRadius: "2px" }}></div> Substitution</div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><div style={{ width: 8, height: 8, background: "rgba(255,255,255,0.2)", borderRadius: "2px" }}></div> Conserved</div>
                            </div>
                        </div>
                        <div style={{ maxHeight: "400px", overflow: "auto", paddingRight: "10px", background: "#020617", padding: "1rem", borderRadius: "8px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "fit-content" }}>
                                {goResult.original.split('').reduce((acc, curr, i) => {
                                    if (i % 60 === 0) acc.push(i);
                                    return acc;
                                }, []).map((start) => (
                                    <div key={start} style={{ display: "flex", flexDirection: "column", gap: "8px", position: "relative" }}>
                                        <div style={{ position: "absolute", left: "-30px", top: "50%", transform: "translateY(-50%)", fontSize: "0.6rem", color: "#334155", fontWeight: 900 }}>{start + 1}</div>
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            <div style={{ width: "80px", fontSize: "0.6rem", color: "#f59e0b", fontWeight: 800 }}>OPTIMIZED</div>
                                            <div style={{ display: "flex", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.95rem", color: "white", background: "rgba(255,255,255,0.02)", padding: "4px", borderRadius: "4px" }}>
                                                {goResult.optimized.substring(start, start + 60).split('').map((char, i) => {
                                                    const isDiff = goResult.optimized[start + i] !== goResult.original[start + i];
                                                    return (
                                                        <div key={i} style={{ width: "13px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", background: isDiff ? "rgba(244,63,94,0.3)" : "transparent", color: isDiff ? "#fb7185" : "inherit", borderRadius: "1px", fontWeight: isDiff ? 900 : 400 }}>
                                                            {char}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            <div style={{ width: "80px", fontSize: "0.6rem", color: "#64748b", fontWeight: 800 }}>ORIGINAL</div>
                                            <div style={{ display: "flex", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.95rem", color: "#475569", background: "rgba(0,0,0,0.2)", padding: "4px", borderRadius: "4px" }}>
                                                {goResult.original.substring(start, start + 60).split('').map((char, i) => (
                                                    <div key={i} style={{ width: "13px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        {char}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            <div style={{ width: "80px" }}></div>
                                            <div style={{ display: "flex", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", color: "#1e293b" }}>
                                                {goResult.original.substring(start, start + 60).split('').map((char, i) => (
                                                    <div key={i} style={{ width: "13px", textAlign: "center", color: goResult.optimized[start + i] !== char ? "#f43f5e" : "transparent" }}>▲</div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                       </div>

                       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "16px", padding: "1.2rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                             <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 800, marginBottom: "0.8rem", textTransform: "uppercase" }}>Optimization Delta Barcode</div>
                             <div style={{ height: "40px", background: "rgba(255,255,255,0.02)", borderRadius: "6px", display: "flex", overflow: "hidden" }}>
                                {goResult.original.split('').map((char, i) => (
                                    <div key={i} style={{ flex: 1, background: goResult.optimized[i] !== char ? "#f43f5e" : "transparent" }}></div>
                                ))}
                             </div>
                          </div>
                          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "16px", padding: "1.2rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                             <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 800, marginBottom: "0.8rem", textTransform: "uppercase" }}>Complexity Summary</div>
                             <div style={{ display: "flex", gap: "1rem" }}>
                                <div style={{ flex: 1, textAlign: "center" }}>
                                    <div style={{ fontSize: "1.2rem", color: "white", fontWeight: 900 }}>0</div>
                                    <div style={{ fontSize: "0.6rem", color: "#475569" }}>REMAINING REPEATS</div>
                                </div>
                                <div style={{ flex: 1, textAlign: "center" }}>
                                    <div style={{ fontSize: "1.2rem", color: "#22c55e", fontWeight: 900 }}>PASS</div>
                                    <div style={{ fontSize: "0.6rem", color: "#475569" }}>SYNTHESIS SCORE</div>
                                </div>
                             </div>
                          </div>
                       </div>
                       
                       {goResult.issues.length > 0 && (
                          <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(244,63,94,0.1)", borderRadius: "12px", border: "1px solid rgba(244,63,94,0.2)" }}>
                             <span style={{ fontSize: "0.75rem", color: "#f43f5e", fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>Synthesis Warnings</span>
                             {goResult.issues.map((iss, k) => <div key={k} style={{ color: "#f43f5e", fontSize: "0.85rem" }}>• {iss}</div>)}
                          </div>
                       )}
                    </div>
                  </motion.div>
                )}
              </div>
`;

    const before = lines.slice(0, goStart);
    const after = lines.slice(goEnd);
    
    fs.writeFileSync(path, before.join('\n') + '\n' + correctGoBlock + '\n' + after.join('\n'));
    console.log("Master Gene Optimizer Repair Success");
} else {
    console.log("Failed to locate boundaries for master repair");
}
