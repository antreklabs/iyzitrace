const fs = require('fs');
const path = require('path');

const mapPath = path.resolve(__dirname, '..', 'src/pages/map/data/map.json');
const svcPath = path.resolve(__dirname, '..', 'src/pages/service-map-3d.page.tsx');

function readFileSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (e) { console.error('Cannot read', p, e.message); process.exit(1); }
}

const map = JSON.parse(readFileSafe(mapPath));
const ts = readFileSafe(svcPath);

// Extract initialEdges block
const start = ts.indexOf('const initialEdges');
if (start === -1) { console.error('initialEdges not found'); process.exit(1); }
const end = ts.indexOf('];', start);
if (end === -1) { console.error('initialEdges terminator not found'); process.exit(1); }
const block = ts.slice(start, end + 2);

// Parse edges like: { id: 'e1', source: 'internet', target: 'frontend-proxy', type: 'smoothstep', animated: true, label: 'HTTP' },
const edgeRegex = /\{\s*id:\s*'([^']+)'\s*,\s*source:\s*'([^']+)'\s*,\s*target:\s*'([^']+)'[\s\S]*?label:\s*'([^']+)'\s*\}/g;
const edges = [];
let m;
while ((m = edgeRegex.exec(block)) !== null) {
  edges.push({ id: m[1], source: m[2], target: m[3], label: m[4] });
}

if (edges.length === 0) {
  console.error('No edges parsed from initialEdges');
  process.exit(1);
}

// Build mapping: source -> [{id,label}, ...]
const targetsBySource = {};
edges.forEach(e => {
  if (!targetsBySource[e.source]) targetsBySource[e.source] = [];
  targetsBySource[e.source].push({ id: e.target, label: e.label });
});

// Find OpenTelemetry app services and fill targets arrays
let updated = 0;
for (const region of map.regions || []) {
  for (const infra of region.infrastructures || []) {
    for (const app of infra.applications || []) {
      if ((app.name || '').toLowerCase().includes('opentelemetry')) {
        for (const svc of app.services || []) {
          const t = targetsBySource[svc.id];
          if (t) {
            svc.targets = t;
            updated++;
          } else {
            // ensure array exists even if empty
            if (!Array.isArray(svc.targets)) svc.targets = [];
          }
        }
      }
    }
  }
}

fs.writeFileSync(mapPath, JSON.stringify(map, null, 2));
console.log('Updated targets for', updated, 'services based on initialEdges.');
