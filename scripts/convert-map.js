const fs = require('fs');
const path = require('path');

const mapPath = path.resolve(__dirname, '../src/pages/map/data/map.json');

function groupByRegion(infras) {
  const regionsMap = new Map();
  for (const h of infras) {
    const key = h.region || 'unknown';
    if (!regionsMap.has(key)) regionsMap.set(key, []);
    regionsMap.get(key).push(h);
  }
  return Array.from(regionsMap.entries()).map(([name, infrastructures]) => ({ name, infrastructures }));
}

function main() {
  const raw = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
  if (Array.isArray(raw.regions)) {
    console.log('map.json already has regions. Skipping.');
    return;
  }
  const infra = Array.isArray(raw.infrastructure) ? raw.infrastructure : [];
  const regions = groupByRegion(infra);
  const next = { ...raw, regions };
  fs.writeFileSync(mapPath, JSON.stringify(next, null, 2));
  console.log(`Converted map.json → regions: ${regions.length}`);
}

main();


