// Quick test to verify our unescaping function works correctly
const { unescapeSVG, sanitizeSVG } = require('./src/utils/svgUtils.ts');

const escapedSVG = `<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" width=\"100\" height=\"100\">\n  <!-- House body -->\n  <rect x=\"30\" y=\"40\" width=\"40\" height=\"50\" fill=\"#FFD700\" stroke=\"#000\" stroke-width=\"1\" />\n  <!-- Roof -->\n  <polygon points=\"25,40 50,0 75,40\" fill=\"#808080\" stroke=\"#000\" stroke-width=\"1\" />\n  <!-- Door -->\n  <rect x=\"45\" y=\"50\" width=\"10\" height=\"20\" fill=\"#222\" stroke=\"#000\" stroke-width=\"1\" />\n  <!-- Window -->\n  <rect x=\"35\" y=\"50\" width=\"10\" height=\"15\" fill=\"#4499FF\" stroke=\"#000\" stroke-width=\"1\" />\n  <!-- Tree trunk -->\n  <rect x=\"60\" y=\"40\" width=\"5\" height=\"30\" fill=\"#8B4513\" stroke=\"#000\" stroke-width=\"1\" />\n  <!-- Tree leaves -->\n  <circle cx=\"60\" cy=\"20\" r=\"15\" fill=\"#228B22\" stroke=\"#000\" stroke-width=\"1\" />\n</svg>`;

console.log('Original escaped SVG:');
console.log(escapedSVG);
console.log('\nUnescaped SVG:');
console.log(unescapeSVG(escapedSVG));
console.log('\nSanitized SVG:');
console.log(sanitizeSVG(escapedSVG));
