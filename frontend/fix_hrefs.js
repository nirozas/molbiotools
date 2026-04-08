const fs = require('fs');
let content = fs.readFileSync('src/data/categories.tsx', 'utf8');

content = content.replace(
  /\{ name: "([^"]+)", description: "([^"]+)", type: "internal", href: "#"((?:, badge: "[^"]+")?) \}/g,
  (match, name, desc, badgeStr) => {
    const route = "/tools/run/" + name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `{ name: "${name}", description: "${desc}", type: "internal", href: "${route}"${badgeStr} }`;
  }
);

content = content.replace(
  /\{ name: "([^"]+)", description: "([^"]+)", type: "python", href: "#"((?:, badge: "[^"]+")?) \}/g,
  (match, name, desc, badgeStr) => {
    const route = "/tools/run/" + name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `{ name: "${name}", description: "${desc}", type: "python", href: "${route}"${badgeStr} }`;
  }
);

content = content.replace(
  /\{ name: "([^"]+)", description: "([^"]+)", type: "r", href: "#"((?:, badge: "[^"]+")?) \}/g,
  (match, name, desc, badgeStr) => {
    const route = "/tools/run/" + name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `{ name: "${name}", description: "${desc}", type: "r", href: "${route}"${badgeStr} }`;
  }
);

fs.writeFileSync('src/data/categories.tsx', content);
console.log("Updated categories.tsx");
