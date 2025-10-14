// Normalize map.json: ensure global-unique ids and normalize service schema
// Usage: node scripts/normalize-map.js

const fs = require('fs');
const path = require('path');

const MAP_PATH = path.resolve(__dirname, '../src/pages/map/data/map.json');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
}

function slug(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function uid(parts, used) {
  const base = parts.filter(Boolean).map(slug).join(':');
  let id = base || 'id';
  let n = 1;
  while (used.has(id)) {
    n += 1;
    id = `${base}:${n}`;
  }
  used.add(id);
  return id;
}

function ensurePosition(obj) {
  if (!obj.position || typeof obj.position.x !== 'number' || typeof obj.position.y !== 'number') {
    obj.position = { x: 24, y: 24 };
  }
}

function ensureGroup(obj) {
  if (!obj.groupSize || typeof obj.groupSize.width !== 'number' || typeof obj.groupSize.height !== 'number') {
    obj.groupSize = { width: 560, height: 300 };
  }
  if (!obj.groupPosition || typeof obj.groupPosition.x !== 'number' || typeof obj.groupPosition.y !== 'number') {
    obj.groupPosition = { x: 0, y: 0 };
  }
}

function normalizeService(service) {
  // Normalize service basic fields
  if (!service.type) service.type = 'api';
  if (!service.status) service.status = 'healthy';
  if (!service.zone) service.zone = 'default';
  if (!service.metrics) service.metrics = {};
  if (!service.metrics.avg) service.metrics.avg = '10.00 ms';
  if (!service.metrics.min) service.metrics.min = '1.00 ms';
  if (!service.metrics.max) service.metrics.max = '50.00 ms';
  if (typeof service.metrics.count !== 'number') {
    // pick a sensible traffic count between 50 and 500
    service.metrics.count = Math.floor(50 + Math.random() * 451);
  }
  if (!Array.isArray(service.targets)) service.targets = [];
  if (!Array.isArray(service.operations)) service.operations = [];
}

function normalizeOperation(op) {
  if (!op.method) op.method = 'GET';
  if (!op.path) op.path = '/';
  if (typeof op.avg_latency_ms !== 'number') op.avg_latency_ms = 100;
  if (typeof op.p95_ms !== 'number') op.p95_ms = 180;
  if (!op.status) op.status = 'ok';
  ensurePosition(op);
}

function main() {
  const map = readJson(MAP_PATH);
  const used = new Set();

  if (!Array.isArray(map.regions)) {
    console.error('map.json missing regions array');
    process.exit(1);
  }

  map.regions.forEach((region, rIdx) => {
    // region id
    region.id = uid(['region', region.name || rIdx], used);
    ensureGroup(region);

    if (!Array.isArray(region.infrastructures)) region.infrastructures = [];
    region.infrastructures.forEach((infra, iIdx) => {
      infra.id = uid(['infra', region.name || rIdx, infra.name || iIdx], used);
      ensurePosition(infra);
      ensureGroup(infra);

      if (!Array.isArray(infra.applications)) infra.applications = [];
      infra.applications.forEach((app, aIdx) => {
        app.id = uid(['app', region.name || rIdx, infra.name || iIdx, app.name || aIdx], used);
        ensurePosition(app);
        ensureGroup(app);

        if (!Array.isArray(app.services)) app.services = [];
        app.services.forEach((svc, sIdx) => {
          // If wrapped service object has nested "data", flatten if necessary (support both shapes)
          // Ensure required schema at service level
          normalizeService(svc);
          svc.id = uid(['svc', region.name || rIdx, infra.name || iIdx, app.name || aIdx, svc.name || sIdx], used);
          ensurePosition(svc);
          ensureGroup(svc);

          // targets standardization (kept only to derive operation fields); will be removed after ops filled
          svc.targets = (svc.targets || []).map((t, tIdx) => ({
            id: String(t.id || uid(['target', svc.name || sIdx, tIdx], used)),
            label: t.label || 'HTTP'
          }));

          // operations normalization
          svc.operations = (svc.operations || []).map((op, oIdx) => {
            normalizeOperation(op);
            op.id = uid(['op', svc.name || sIdx, op.method, op.path || oIdx], used);
            // Derive type and targetServiceId from first available target
            const firstTarget = Array.isArray(svc.targets) && svc.targets.length > 0 ? svc.targets[0] : null;
            if (!op.type) {
              const label = (firstTarget && String(firstTarget.label || '').toLowerCase()) || '';
              op.type = label.includes('grpc') ? 'gRPC' : 'HTTP';
            }
            if (!op.targetServiceId) {
              op.targetServiceId = (firstTarget && String(firstTarget.id)) || '';
            }
            return op;
          });

          // Remove targets field as requested
          if (typeof svc.targets !== 'undefined') {
            delete svc.targets;
          }
        });
      });
    });
  });

  writeJson(MAP_PATH, map);
  console.log('normalize-map: map.json normalized successfully.');
}

main();


