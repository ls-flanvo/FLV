import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('./public/screenshots', { recursive: true });

// Screenshot branded 390x844 (iPhone size)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">
  <!-- Sfondo -->
  <rect width="390" height="844" fill="#0B0B0B"/>

  <!-- Navbar -->
  <rect width="390" height="56" fill="#111111"/>
  <text x="20" y="36" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="20" font-weight="700" fill="#ffffff" letter-spacing="-1">Flanvo</text>

  <!-- Hero text -->
  <text x="20" y="130" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="38" font-weight="800" fill="#ffffff" letter-spacing="-2">Il tuo</text>
  <text x="20" y="175" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="38" font-weight="800" fill="#ffffff" letter-spacing="-2">aeroporto,</text>
  <text x="20" y="220" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="38" font-weight="800" fill="#00D1B2" letter-spacing="-2">condiviso.</text>

  <!-- Subtitle -->
  <text x="20" y="262" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="15" fill="#A1A1AA">Risparmia fino al 78% rispetto ai taxi privati.</text>

  <!-- CTA Button -->
  <rect x="20" y="290" width="170" height="48" rx="14" fill="#00D1B2"/>
  <text x="105" y="320" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="15" font-weight="700" fill="#0B0B0B">Inizia gratis</text>

  <!-- Card prenotazione -->
  <rect x="20" y="380" width="350" height="160" rx="16" fill="#1A1A1A" stroke="#2A2A2A" stroke-width="1"/>
  <rect x="36" y="398" width="40" height="40" rx="10" fill="#00D1B2" opacity="0.12"/>
  <text x="56" y="424" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="18" fill="#00D1B2">F</text>
  <text x="88" y="414" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="14" font-weight="700" fill="#ffffff">AZ1234</text>
  <text x="88" y="432" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="12" fill="#71717A">Catania — Milano</text>
  <text x="36" y="468" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="12" fill="#71717A">Destinazione</text>
  <text x="36" y="486" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="13" font-weight="600" fill="#ffffff">Via Roma 14, Milano</text>
  <text x="260" y="482" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="22" font-weight="800" fill="#00D1B2">18.50</text>
  <text x="335" y="482" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="12" fill="#71717A">euro</text>
  <rect x="36" y="498" width="318" height="1" fill="#2A2A2A"/>
  <text x="36" y="524" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="12" fill="#00D1B2">3 passeggeri nel gruppo</text>

  <!-- Stats row -->
  <text x="20" y="586" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="26" font-weight="800" fill="#00D1B2">78%</text>
  <text x="20" y="606" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="11" fill="#71717A">risparmio medio</text>
  <text x="150" y="586" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="26" font-weight="800" fill="#ffffff">500+</text>
  <text x="150" y="606" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="11" fill="#71717A">viaggiatori</text>
  <text x="280" y="586" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="26" font-weight="800" fill="#ffffff">4.9</text>
  <text x="280" y="606" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="11" fill="#71717A">valutazione</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile('./public/screenshots/booking.png');
console.log('Screenshot generato: public/screenshots/booking.png');
