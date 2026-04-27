import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

// Logo Flanvo SVG (bolt/F shape, sfondo scuro)
const svgTemplate = (size) => {
  const s = size;
  const pad = Math.round(s * 0.12);
  const w = s - pad * 2;
  const h = s - pad * 2;

  // Punti proporzionali al viewBox 270x350
  const pts = [
    [0, 0],
    [270, 0],
    [150, 160],
    [270, 160],
    [0, 350],
    [110, 190],
    [-20, 190],
  ];

  const scaleX = w / 290;
  const scaleY = h / 350;

  const scaled = pts.map(([x, y]) => [
    Math.round(pad + (x + 10) * scaleX),
    Math.round(pad + y * scaleY),
  ]);

  const points = scaled.map(([x, y]) => `${x},${y}`).join(' ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" rx="${Math.round(s * 0.18)}" fill="#0a0a0a"/>
  <polygon points="${points}" fill="#00C2B5"/>
</svg>`;
};

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const dir = './public/icons';

if (!existsSync(dir)) await mkdir(dir, { recursive: true });

for (const size of sizes) {
  const svg = Buffer.from(svgTemplate(size));
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(`${dir}/icon-${size}x${size}.png`);
  console.log(`✅ icon-${size}x${size}.png`);
}

console.log('\n🎉 Tutte le icone generate in public/icons/');
