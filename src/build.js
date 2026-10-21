// Builds the two published files from src/:
//   ../index.html       the app (engine inlined, one self-contained file)
//   ../agent-mascot.js  the standalone <agent-mascot> web component
// Usage: node src/build.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(__dirname, 'app.html'), 'utf8');
const engine = fs.readFileSync(path.join(__dirname, 'engine.js'), 'utf8');
fs.writeFileSync(path.join(root, 'index.html'), app.replace('/*ENGINE*/', () => engine));
fs.writeFileSync(path.join(root, 'agent-mascot.js'), engine);
console.log('built index.html + agent-mascot.js');
