const fs = require('fs');
const path = require('path');

const mapPath = path.resolve(__dirname, '..', 'src/pages/map/data/map.json');

function readFileSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (e) { console.error('Cannot read', p, e.message); process.exit(1); }
}

const map = JSON.parse(readFileSafe(mapPath));

// Find OpenTelemetry application services
let services = null;
for (const region of map.regions || []) {
  for (const infra of region.infrastructures || []) {
    for (const app of infra.applications || []) {
      if ((app.name || '').toLowerCase().includes('opentelemetry')) {
        services = app.services;
        break;
      }
    }
    if (services) break;
  }
  if (services) break;
}

if (!services) {
  console.error('OpenTelemetry application services not found');
  process.exit(1);
}

// Target positions approximating the screenshot layout
const positionsById = {
  internet: { x: 40, y: 40 },
  loadgen: { x: 40, y: 220 },
  reactnative: { x: 40, y: 400 },

  'frontend-proxy': { x: 220, y: 120 },
  'flagd-ui': { x: 220, y: 260 },
  'image-provider': { x: 220, y: 440 },

  frontend: { x: 300, y: 40 },
  checkout: { x: 300, y: 180 },

  ad: { x: 380, y: 40 },
  currency: { x: 380, y: 180 },
  cart: { x: 380, y: 260 },

  cache: { x: 500, y: 100 },
  accounting: { x: 500, y: 220 },
  'fraud': { x: 500, y: 300 },
  payment: { x: 500, y: 360 },
  email: { x: 500, y: 420 },
  quote: { x: 500, y: 500 },

  flagd: { x: 600, y: 100 },
  'product-catalog': { x: 600, y: 420 },

  shipping: { x: 420, y: 420 },
  recommendation: { x: 520, y: 560 },

  database: { x: 720, y: 180 }
};

// Apply mapped positions if known; otherwise keep existing
for (const node of services) {
  const p = positionsById[node.id];
  if (p) node.position = { x: p.x, y: p.y };
}

fs.writeFileSync(mapPath, JSON.stringify(map, null, 2));
console.log('Applied explicit positions for', Object.keys(positionsById).length, 'services.');
