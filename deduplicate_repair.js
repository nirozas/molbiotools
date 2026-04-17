const fs = require('fs');
const path = 'e:\\MolBioTools\\src\\components\\tools\\ToolHost.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

let firstOccur = -1;
let secondOccur = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('toolId === "gene-optimizer"')) {
        if (firstOccur === -1) {
            firstOccur = i;
        } else {
            secondOccur = i;
            break;
        }
    }
}

if (firstOccur !== -1 && secondOccur !== -1) {
    console.log(`Removing duplicated block between line ${firstOccur + 1} and ${secondOccur}`);
    const before = lines.slice(0, firstOccur);
    const after = lines.slice(secondOccur);
    fs.writeFileSync(path, before.join('\n') + '\n' + after.join('\n'));
    console.log("De-duplication Repair Success");
} else {
    console.log("Failed to locate duplicated blocks");
}
