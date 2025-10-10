const fs = require('fs');
const path = require('path');

const mapPath = path.resolve(__dirname, '../src/pages/map/data/map.json');

function gridLayout(count, startX, startY, cols, gapX, gapY) {
  const pos = [];
  for (let i = 0; i < count; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    pos.push({ x: startX + c * gapX, y: startY + r * gapY });
  }
  return pos;
}

function main() {
  const raw = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));

  if (!Array.isArray(raw.regions)) {
    console.error('map.json must be converted to regions schema first. Run: node scripts/convert-map.js');
    process.exit(1);
  }

  // Layout params (match infra-layer.tsx)
  const outerMarginX = 60;
  const outerMarginY = 60;
  const regionGapX = 40;
  const regionGapY = 60;
  const maxRegionCols = 3;

  const startX = 24;
  const startY = 24;
  const cellGapX = 220;
  const cellGapY = 280;

  let cursorX = outerMarginX;
  let cursorY = outerMarginY;
  let colIndex = 0;
  let rowMaxHeight = 0;

  for (const region of raw.regions) {
    const hosts = Array.isArray(region.infrastructures) ? region.infrastructures : [];

    const cols = Math.min(3, Math.max(1, hosts.length));
    const rows = Math.max(1, Math.ceil(hosts.length / cols));

    const blockW = 140;
    const blockH = 180;
    const groupW = startX * 2 + cols * blockW + (cols - 1) * (cellGapX - blockW);
    const groupH = startY * 2 + rows * blockH + (rows - 1) * (cellGapY - blockH) + 60;

    if (colIndex >= maxRegionCols) {
      colIndex = 0;
      cursorX = outerMarginX;
      cursorY += rowMaxHeight + regionGapY;
      rowMaxHeight = 0;
    }

    // write region position
    region.position = { x: cursorX, y: cursorY };

    // host positions within region
    const positions = gridLayout(hosts.length, startX, startY, cols, cellGapX, cellGapY);
    hosts.forEach((h, i) => {
      h.position = positions[i];
    });

    // advance cursor
    cursorX += groupW + regionGapX;
    rowMaxHeight = Math.max(rowMaxHeight, groupH);
    colIndex += 1;
  }

  fs.writeFileSync(mapPath, JSON.stringify(raw, null, 2));
  console.log('Positions computed and written to map.json');
}

main();


