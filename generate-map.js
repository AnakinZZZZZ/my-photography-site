// Script to generate worldmap.js from Natural Earth data
// Run with: node generate-map.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson';

console.log('Downloading Natural Earth 110m land data...');

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const geojson = JSON.parse(data);
      console.log('Features:', geojson.features.length);

      function toSVG(lng, lat) {
        const x = ((lng + 180) / 360 * 1000).toFixed(1);
        const y = ((90 - lat) / 180 * 500).toFixed(1);
        return x + ',' + y;
      }

      function ringToPath(ring) {
        // Keep enough detail for recognizable shapes
        const maxPoints = 100;
        const step = Math.max(1, Math.floor(ring.length / maxPoints));
        const points = [];
        for (let i = 0; i < ring.length; i += step) {
          points.push(toSVG(ring[i][0], ring[i][1]));
        }
        // Always include last point to close properly
        const last = toSVG(ring[ring.length - 1][0], ring[ring.length - 1][1]);
        if (points[points.length - 1] !== last) {
          points.push(last);
        }
        if (points.length < 3) return null;
        return 'M ' + points.join(' L ') + ' Z';
      }

      const paths = [];
      for (const feature of geojson.features) {
        const geom = feature.geometry;
        if (geom.type === 'Polygon') {
          for (const ring of geom.coordinates) {
            const p = ringToPath(ring);
            if (p) paths.push(p);
          }
        } else if (geom.type === 'MultiPolygon') {
          for (const polygon of geom.coordinates) {
            for (const ring of polygon) {
              const p = ringToPath(ring);
              if (p) paths.push(p);
            }
          }
        }
      }

      console.log('SVG paths generated:', paths.length);

      let js = '// ============================================================\n';
      js += '// World Map SVG Paths - Generated from Natural Earth 110m data\n';
      js += '// Equirectangular projection, viewBox 0 0 1000 500\n';
      js += '// Source: Natural Earth (public domain)\n';
      js += '// ============================================================\n\n';
      js += 'const WORLD_MAP_PATHS = [\n';
      paths.forEach((p, i) => {
        js += '  "' + p + '"';
        if (i < paths.length - 1) js += ',';
        js += '\n';
      });
      js += '];\n';

      const outPath = path.join(__dirname, 'js', 'worldmap.js');
      fs.writeFileSync(outPath, js, 'utf-8');
      console.log(`Written: ${outPath} (${js.length} bytes)`);
    } catch (e) {
      console.error('Parse error:', e.message);
    }
  });
}).on('error', (e) => {
  console.error('Request error:', e.message);
});
