const fs = require('fs');
const path = 'e:\\MolBioTools\\src\\components\\tools\\ToolHost.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacement = `                 {goStep === 3 && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
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
                            </div>`;

const lines = content.split('\n');
let fixedLines = [];
let found = false;

for (let i = 0; i < lines.length; i++) {
    if (!found && lines[i].includes('setGoStep(3)')) {
       fixedLines.push(lines[i]); // button
       fixedLines.push(lines[i+1]); // </motion.div>
       fixedLines.push(lines[i+2]); // )}
       fixedLines.push('');
       fixedLines.push(replacement);
       found = true;
       // Skip until we see the "Choose Codon Table" part which is line 2778
       let skip = 3;
       while (i+skip < lines.length && !lines[i+skip].includes('Choose Codon Table')) {
           skip++;
       }
       i += (skip - 2); // Put counter back so we catch Choose Codon Table
    } else {
        fixedLines.push(lines[i]);
    }
}

if (found) {
    fs.writeFileSync(path, fixedLines.join('\n'));
    console.log("Repair success");
} else {
    console.log("Target not found - manual check needed");
}
