const fs = require('fs');
const path = require('path');

const mapPath = path.resolve(__dirname, '..', 'src/pages/map/data/map.json');
const svcPath = path.resolve(__dirname, '..', 'src/pages/service-map-3d.page.tsx');

function readFileSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (e) { console.error('Cannot read', p, e.message); process.exit(1); }
}

const map = JSON.parse(readFileSafe(mapPath));
const ts = readFileSafe(svcPath);

const start = ts.indexOf('const initialNodes');
if (start === -1) { console.error('initialNodes not found'); process.exit(1); }
const end = ts.indexOf('];', start);
if (end === -1) { console.error('initialNodes terminator not found'); process.exit(1); }
const block = ts.slice(start, end + 2);

// Extract all node literals inside initialNodes
const nodeLits = [...block.matchAll(/\{\s*id:\s*'([^']+)'[\s\S]*?type:\s*'([^']+)'[\s\S]*?position:\s*\{\s*x:\s*([0-9]+),\s*y:\s*([0-9]+)\s*\}[\s\S]*?data:\s*\{([\s\S]*?)\}\s*\}/g)];

function matchField(src, key) {
  const re = new RegExp(key + ":\\s*(?:`([^`]*)`|'([^']*)'|\"([^\"]*)\")");
  const m = src.match(re);
  return m ? (m[1] || m[2] || m[3]) : undefined;
}

function parseMetrics(src) {
  const m = src.match(/metrics:\s*\{([\s\S]*?)\}/);
  if (!m) return undefined;
  const obj = m[1];
  const get = (k) => {
    const re = new RegExp(k + ":\\s*(?:`([^`]*)`|'([^']*)'|\"([^\"]*)\")");
    const mm = obj.match(re);
    return mm ? (mm[1] || mm[2] || mm[3]) : undefined;
  };
  const out = {};
  ['avg','min','max','count'].forEach(k => { const v = get(k); if (typeof v !== 'undefined') out[k] = v; });
  return out;
}

const services = nodeLits.map((m) => {
  const id = m[1];
  const nodeType = m[2];
  const x = Number(m[3]);
  const y = Number(m[4]);
  const dataSrc = m[5];
  const name = matchField(dataSrc, 'name');
  const type = matchField(dataSrc, 'type');
  const status = matchField(dataSrc, 'status');
  const zone = matchField(dataSrc, 'zone');
  const metrics = parseMetrics(dataSrc) || {};

  return {
    id,
    name: name || id,
    type: 'service3d',
    position: { x, y },
    data: {
      name: name || id,
      type: type || 'api',
      status: status || 'healthy',
      zone: zone || 'svc',
      metrics
    },
    operations: [],
    groupSize: { width: 200, height: 300 },
    groupPosition: { x: 0, y: 0 }
  };
});

let replaced = false;
for (const region of map.regions || []) {
  for (const infra of region.infrastructures || []) {
    for (const app of infra.applications || []) {
      if ((app.name || '').toLowerCase().includes('opentelemetry')) {
        app.services = services;
        replaced = true;
      }
    }
  }
}

if (!replaced) {
  console.error('OpenTelemetry application not found');
  process.exit(1);
}

fs.writeFileSync(mapPath, JSON.stringify(map, null, 2));
console.log('Replaced OpenTelemetry services (node-style) with', services.length, 'entries');
