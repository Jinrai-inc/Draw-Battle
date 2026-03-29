const sharp = require('sharp');
const path = require('path');

const SIZE = 1024;

const svgIcon = `
<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0a2e"/>
      <stop offset="50%" stop-color="#050518"/>
      <stop offset="100%" stop-color="#0d0d35"/>
    </linearGradient>
    <linearGradient id="swordBlade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#00ddff"/>
      <stop offset="40%" stop-color="#aaffff"/>
      <stop offset="100%" stop-color="#00bbee"/>
    </linearGradient>
    <linearGradient id="pencilBody" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#cc33ff"/>
      <stop offset="50%" stop-color="#ee66ff"/>
      <stop offset="100%" stop-color="#aa22dd"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="outerGlow">
      <feGaussianBlur in="SourceGraphic" stdDeviation="20"/>
    </filter>
    <filter id="sparkGlow">
      <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <radialGradient id="centerLight" cx="50%" cy="42%" r="35%">
      <stop offset="0%" stop-color="#00ffff" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <clipPath id="rounded">
      <rect width="${SIZE}" height="${SIZE}" rx="220" ry="220"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)" rx="220" ry="220"/>

  <!-- Grid -->
  <g opacity="0.06" clip-path="url(#rounded)">
    ${Array.from({length: 17}, (_, i) => `<line x1="${i * 64}" y1="0" x2="${i * 64}" y2="${SIZE}" stroke="#00ffff" stroke-width="0.5"/>`).join('')}
    ${Array.from({length: 17}, (_, i) => `<line x1="0" y1="${i * 64}" x2="${SIZE}" y2="${i * 64}" stroke="#00ffff" stroke-width="0.5"/>`).join('')}
  </g>

  <rect width="${SIZE}" height="${SIZE}" fill="url(#centerLight)" clip-path="url(#rounded)"/>

  <!-- Outer glow for sword -->
  <g filter="url(#outerGlow)" transform="translate(512,420) rotate(-30)">
    <rect x="-18" y="-280" width="36" height="400" fill="#00ffff" rx="8"/>
  </g>
  <!-- Outer glow for pencil -->
  <g filter="url(#outerGlow)" transform="translate(512,420) rotate(30)">
    <rect x="-18" y="-280" width="36" height="400" fill="#cc33ff" rx="8"/>
  </g>

  <!-- SWORD (left, rotated -30deg) -->
  <g transform="translate(512,420) rotate(-30)" filter="url(#glow)">
    <!-- Blade -->
    <polygon points="-16,-280 16,-280 20,-60 -20,-60" fill="url(#swordBlade)"/>
    <!-- Blade tip -->
    <polygon points="-16,-280 16,-280 0,-330" fill="#ccffff"/>
    <!-- Blade center line -->
    <line x1="0" y1="-320" x2="0" y2="-60" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
    <!-- Guard -->
    <ellipse cx="0" cy="-55" rx="55" ry="12" fill="#00aacc"/>
    <ellipse cx="0" cy="-58" rx="55" ry="10" fill="#00ddee"/>
    <!-- Handle -->
    <rect x="-10" y="-48" width="20" height="100" rx="5" fill="#005566"/>
    <!-- Handle wrap -->
    <g stroke="#00aaaa" stroke-width="2" opacity="0.6">
      <line x1="-10" y1="-30" x2="10" y2="-20"/>
      <line x1="-10" y1="-10" x2="10" y2="0"/>
      <line x1="-10" y1="10" x2="10" y2="20"/>
      <line x1="-10" y1="30" x2="10" y2="40"/>
    </g>
    <!-- Pommel -->
    <circle cx="0" cy="60" r="14" fill="#00bbcc"/>
  </g>

  <!-- PENCIL (right, rotated +30deg) -->
  <g transform="translate(512,420) rotate(30)" filter="url(#glow)">
    <!-- Body -->
    <polygon points="-16,-220 16,-220 20,-40 -20,-40" fill="url(#pencilBody)"/>
    <!-- Wood/Tip -->
    <polygon points="-16,-220 16,-220 0,-280" fill="#ffcc88"/>
    <!-- Graphite point -->
    <polygon points="-5,-260 5,-260 0,-290" fill="#333"/>
    <!-- Body stripes -->
    <rect x="-18" y="-180" width="36" height="8" rx="2" fill="rgba(255,255,255,0.2)"/>
    <rect x="-19" y="-130" width="38" height="8" rx="2" fill="rgba(255,255,255,0.2)"/>
    <rect x="-20" y="-80" width="40" height="8" rx="2" fill="rgba(255,255,255,0.2)"/>
    <!-- Ferrule -->
    <rect x="-21" y="-45" width="42" height="14" rx="3" fill="#ddaa33"/>
    <rect x="-21" y="-42" width="42" height="3" fill="#aa7722"/>
    <!-- Eraser -->
    <rect x="-20" y="-32" width="40" height="50" rx="8" fill="#ff6688"/>
    <!-- Eraser highlight -->
    <rect x="-12" y="-28" width="10" height="40" rx="4" fill="rgba(255,255,255,0.2)"/>
  </g>

  <!-- Clash spark at intersection -->
  <g filter="url(#sparkGlow)">
    <circle cx="512" cy="320" r="30" fill="white" opacity="0.95"/>
    <circle cx="512" cy="320" r="18" fill="white"/>
  </g>
  <!-- Spark rays -->
  <g stroke="white" stroke-width="3.5" opacity="0.8" stroke-linecap="round" filter="url(#glow)">
    <line x1="512" y1="280" x2="512" y2="255"/>
    <line x1="545" y1="298" x2="568" y2="282"/>
    <line x1="479" y1="298" x2="456" y2="282"/>
    <line x1="550" y1="335" x2="575" y2="345"/>
    <line x1="474" y1="335" x2="449" y2="345"/>
    <line x1="530" y1="360" x2="540" y2="378"/>
    <line x1="494" y1="360" x2="484" y2="378"/>
  </g>

  <!-- Small sparks -->
  <g fill="white" opacity="0.6">
    <circle cx="570" cy="275" r="4"/>
    <circle cx="450" cy="278" r="3.5"/>
    <circle cx="580" cy="350" r="3"/>
    <circle cx="440" cy="348" r="3"/>
  </g>

  <!-- Title "DRAW" + "BATTLE" -->
  <g filter="url(#glow)">
    <text x="512" y="785" text-anchor="middle" font-family="Arial Black, Impact, Helvetica, sans-serif" font-weight="900" font-size="100" fill="#00ffff" letter-spacing="12">DRAW</text>
    <text x="512" y="880" text-anchor="middle" font-family="Arial Black, Impact, Helvetica, sans-serif" font-weight="900" font-size="85" fill="#cc66ff" letter-spacing="10">BATTLE</text>
  </g>

  <!-- Corner brackets -->
  <g stroke="#00ffff" stroke-width="3" opacity="0.3" fill="none" stroke-linecap="round">
    <polyline points="260,85 85,85 85,260"/>
    <polyline points="764,85 939,85 939,260"/>
    <polyline points="260,939 85,939 85,764"/>
    <polyline points="764,939 939,939 939,764"/>
  </g>

  <!-- Scanlines -->
  <g opacity="0.025" clip-path="url(#rounded)">
    ${Array.from({length: 256}, (_, i) => `<rect x="0" y="${i * 4}" width="${SIZE}" height="2" fill="#fff"/>`).join('')}
  </g>
</svg>
`;

async function generateIcons() {
  const iconBuffer = Buffer.from(svgIcon);

  await sharp(iconBuffer)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(__dirname, '..', 'assets', 'icon.png'));

  await sharp(iconBuffer)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(__dirname, '..', 'ios', 'DrawBattle', 'Images.xcassets', 'AppIcon.appiconset', 'App-Icon-1024x1024@1x.png'));

  await sharp(iconBuffer)
    .resize(48, 48)
    .png()
    .toFile(path.join(__dirname, '..', 'assets', 'favicon.png'));

  console.log('Icons generated successfully!');
}

generateIcons().catch(console.error);
