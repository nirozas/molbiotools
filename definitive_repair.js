const fs = require('fs');
const path = 'e:\\MolBioTools\\src\\components\\tools\\ToolHost.tsx';
let content = fs.readFileSync(path, 'utf8');

// We will find the entire block from setGoStep(3) until the next motion.div (which is goResult)
const lines = content.split('\n');
let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('setGoStep(3)')) {
        startIndex = i + 1;
    }
    if (startIndex !== -1 && lines[i].includes('{goResult && (')) {
        endIndex = i;
        break;
    }
}

if (startIndex !== -1 && endIndex !== -1) {
    console.log(`Found Step 3 block from line ${startIndex + 1} to ${endIndex}`);
    
    const newStep3 = `
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
                                   <select value={goMode} onChange={e => setGoMode(e.target.value as any)} style={calcInputStyle}>
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
`;

    const before = lines.slice(0, startIndex - 1); // Up to setGoStep(3) button line
    // We already have </motion.div> )} on lines startIndex and startIndex+1? Let's check.
    // Actually setGoStep(3) is usually followed by its own component closing.
    
    // Safety check:
    before.push(lines[startIndex-1]); // The button line
    before.push('                    </motion.div>'); // Close the Step 2 motion.div
    before.push('                 )}'); // Close Step 2 block

    const after = lines.slice(endIndex);
    fs.writeFileSync(path, before.join('\n') + newStep3 + after.join('\n'));
    console.log("Definitive Repair Success");
} else {
    console.log("Failed to locate boundaries");
}
