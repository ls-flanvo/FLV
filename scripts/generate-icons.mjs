import sharp from 'sharp';
import { mkdirSync } from 'fs';

// SVG sorgente — sfondo nero, "Flanvo" bianco (stile Uber)
// Per le icone piccole sotto 96px usiamo solo la "F"
function makeSvgWordmark(size) {
  const r = Math.round(size * 0.22); // border radius
  const fontSize = Math.round(size * 0.28);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#000000"/>
  <text
    x="${size / 2}"
    y="${size * 0.62}"
    text-anchor="middle"
    font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
    font-size="${fontSize}"
    font-weight="800"
    fill="#ffffff"
    letter-spacing="${-fontSize * 0.04}"
  >Flanvo</text>
</svg>`;
}

function makeSvgF(size) {
  const r = Math.round(size * 0.22);
  const fontSize = Math.round(size * 0.58);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#000000"/>
  <text
    x="${size / 2}"
    y="${size * 0.72}"
    text-anchor="middle"
    font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
    font-size="${fontSize}"
    font-weight="800"
    fill="#ffffff"
  >F</text>
</svg>`;
}

const icons = [
  { size: 72,  svg: makeSvgF },
  { size: 96,  svg: makeSvgF },
  { size: 128, svg: makeSvgWordmark },
  { size: 144, svg: makeSvgWordmark },
  { size: 152, svg: makeSvgWordmark },
  { size: 192, svg: makeSvgWordmark },
  { size: 384, svg: makeSvgWordmark },
  { size: 512, svg: makeSvgWordmark },
];

mkdirSync('./public/icons', { recursive: true });

for (const { size, svg } of icons) {
  const svgBuffer = Buffer.from(svg(size));
  const outPath = `./public/icons/icon-${size}x${size}.png`;
  await sharp(svgBuffer).png().toFile(outPath);
  console.log(`✓ ${outPath}`);
}

console.log('\nTutte le icone generate!');
