// Verify that all regions, infrastructures, applications, services, and operations have ids
// Usage: node scripts/verify-map-ids.js

const fs = require('fs');
const path = require('path');

const MAP_PATH = path.resolve(__dirname, '../src/pages/map/data/map.json');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function main() {
  const map = readJson(MAP_PATH);
  const missing = {
    regions: [],
    infrastructures: [],
    applications: [],
    services: [],
    operations: []
  };
  const ids = new Set();
  let duplicateCount = 0;

  if (!Array.isArray(map.regions)) {
    console.error('map.json missing regions array');
    process.exit(1);
  }

  map.regions.forEach((region, rIdx) => {
    if (!region || typeof region.id !== 'string' || !region.id) missing.regions.push(rIdx);
    else if (ids.has(region.id)) duplicateCount++; else ids.add(region.id);

    const infraList = Array.isArray(region.infrastructures) ? region.infrastructures : [];
    infraList.forEach((infra, iIdx) => {
      if (!infra || typeof infra.id !== 'string' || !infra.id) missing.infrastructures.push(`${rIdx}:${iIdx}`);
      else if (ids.has(infra.id)) duplicateCount++; else ids.add(infra.id);

      const appList = Array.isArray(infra.applications) ? infra.applications : [];
      appList.forEach((app, aIdx) => {
        if (!app || typeof app.id !== 'string' || !app.id) missing.applications.push(`${rIdx}:${iIdx}:${aIdx}`);
        else if (ids.has(app.id)) duplicateCount++; else ids.add(app.id);

        const svcList = Array.isArray(app.services) ? app.services : [];
        svcList.forEach((svc, sIdx) => {
          if (!svc || typeof svc.id !== 'string' || !svc.id) missing.services.push(`${rIdx}:${iIdx}:${aIdx}:${sIdx}`);
          else if (ids.has(svc.id)) duplicateCount++; else ids.add(svc.id);

          const opList = Array.isArray(svc.operations) ? svc.operations : [];
          opList.forEach((op, oIdx) => {
            if (!op || typeof op.id !== 'string' || !op.id) missing.operations.push(`${rIdx}:${iIdx}:${aIdx}:${sIdx}:${oIdx}`);
            else if (ids.has(op.id)) duplicateCount++; else ids.add(op.id);
          });
        });
      });
    });
  });

  const summary = {
    totalIds: ids.size,
    duplicates: duplicateCount,
    missing
  };
  console.log(JSON.stringify(summary, null, 2));
}

main();


