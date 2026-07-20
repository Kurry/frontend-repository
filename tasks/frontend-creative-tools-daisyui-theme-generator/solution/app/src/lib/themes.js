import { colorKeys } from './schema.js';

export const builtinNames = [
  'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate', 'synthwave', 'retro',
  'cyberpunk', 'valentine', 'halloween', 'garden', 'forest', 'aqua', 'lofi', 'pastel',
  'fantasy', 'wireframe', 'black', 'luxury', 'dracula', 'cmyk', 'autumn', 'business',
  'acid', 'lemonade', 'night', 'coffee', 'winter', 'dim', 'nord', 'sunset', 'caramellatte', 'abyss', 'silk',
];

const palettes = {
  light: ['#ffffff','#f2f2f2','#e5e6e6','#1f2937','#4b28d7','#ffffff','#f22c92','#ffffff','#08c8b5','#083344','#09090b','#ffffff','#15afe5','#06283d','#05ca91','#052e24','#ffb600','#3b2500','#fa5f78','#3a0711'],
  dark: ['#1d232a','#191e24','#15191e','#f2f7fa','#7480ff','#0b1020','#ff6eb4','#2b0b1c','#00d3bb','#042f2e','#09090b','#ffffff','#00bafe','#042f49','#00d390','#022c22','#fcb700','#422006','#ff637d','#4c0519'],
  cupcake: ['#faf7f5','#efeae6','#e7e2df','#291334','#65c3c8','#102a2b','#ef9fbc','#3c1727','#eeaf3a','#332002','#291334','#f9f7fa','#62b6e7','#082f49','#87d8a4','#133822','#e8bf73','#3a2403','#e98999','#3e1119'],
  bumblebee: ['#ffffff','#f8f8f8','#eeeeee','#18181b','#f9d72f','#2d2600','#e0a82e','#291c00','#18181b','#ffffff','#18181b','#ffffff','#0ca5e9','#082f49','#20b486','#042f2e','#ffb800','#412800','#f43f5e','#4c0519'],
  emerald: ['#ffffff','#f1f5f4','#e4ece9','#1f2937','#66cc8a','#073719','#377cfb','#ffffff','#f68067','#3d1008','#333c4d','#ffffff','#2094f3','#ffffff','#009485','#ffffff','#ff9900','#321d00','#ff5724','#ffffff'],
  corporate: ['#ffffff','#f3f5f7','#e5e9ed','#181a2a','#4b6bfb','#ffffff','#7b92b2','#101827','#67cba0','#052e21','#181a2a','#ffffff','#1c92f2','#ffffff','#00a96e','#ffffff','#f7a900','#382300','#ff5861','#ffffff'],
  synthwave: ['#1a103d','#160d35','#110a2a','#f9f7fd','#e779c1','#350b2b','#58c7f3','#062a3a','#f3cc30','#362d00','#221551','#f8f2ff','#56d8e4','#062d32','#75d9a3','#0a3420','#f5d36a','#3a2b00','#ed5e70','#3e0911'],
  retro: ['#ece3ca','#dfd6ba','#d2c8aa','#282425','#ef9995','#401315','#a4cbb4','#163126','#d2a24c','#392600','#2d2b29','#f7f1df','#4aa8c0','#092f38','#6eaa78','#13331b','#e7b759','#402900','#e2706a','#45110e'],
  cyberpunk: ['#fff248','#f7e934','#eadc20','#211b00','#ff7598','#450616','#75d1f0','#073444','#c07eec','#300942','#201047','#ffffff','#2ad7ff','#003342','#00d8a7','#00372c','#ffcf35','#3c2b00','#ff4365','#4c0519'],
  valentine: ['#fae7f4','#f4d8eb','#ecc7e1','#632c3b','#e96d7b','#3e0b12','#a991f7','#241456','#88dbdd','#083839','#3d4451','#ffffff','#2094f3','#ffffff','#009485','#ffffff','#ff9900','#321d00','#ff5724','#ffffff'],
  halloween: ['#212121','#1b1b1b','#151515','#f5f3f0','#f28c18','#331700','#6d3a9c','#ffffff','#51a800','#102f00','#171717','#ffffff','#00a6e8','#062c3a','#00b876','#002e20','#f7b000','#3c2800','#ef4545','#420707'],
  garden: ['#e9e7e7','#ddd9d9','#cfcbcb','#241f20','#e96383','#3d0a17','#ec9f68','#411c06','#80b7a2','#14382b','#3e5b52','#ffffff','#40aee0','#062e42','#5ebd91','#093923','#f2ad4b','#3d2600','#e65355','#430a0a'],
  forest: ['#171d17','#121712','#0d110d','#e8f1e8','#1eb854','#032e12','#1d9bf0','#052c45','#f39019','#3c1f00','#0b130d','#eaffef','#45b7e8','#062e42','#18b67a','#032d1e','#edac22','#3d2800','#e84e55','#42090d'],
  aqua: ['#0f1729','#0b1322','#07101b','#dff8ff','#09d5e5','#03353b','#9468fa','#1f0d4d','#f7d244','#372c00','#16254c','#ffffff','#26b7ef','#062d43','#06cf9a','#013528','#ffb91e','#3b2700','#fb6175','#47070f'],
  lofi: ['#ffffff','#f4f4f4','#e7e7e7','#111111','#0d0d0d','#ffffff','#1f1f1f','#ffffff','#333333','#ffffff','#050505','#ffffff','#2b92c9','#ffffff','#24825a','#ffffff','#b67a10','#ffffff','#bf3141','#ffffff'],
  pastel: ['#ffffff','#f5f5f5','#e8e8e8','#252525','#d1c1d7','#2f2533','#f6cbd1','#3a2327','#b4e9d6','#193b2f','#70acc7','#0a2e3e','#9fd9ee','#143444','#9fe0c6','#173a2d','#f7d8a1','#3a2b12','#efb3ba','#3e1e22'],
};

const fallbackSets = [
  ['#ffffff','#f2f4f7','#e3e8ef','#1f2937','#5b5bd6','#ffffff','#db4b98','#ffffff','#16b8a6','#042f2e','#1f2937','#ffffff','#28a9e0','#062e42','#20b486','#042f2e','#f4ad22','#3c2800','#ef5a67','#42090d'],
  ['#20252c','#191e24','#12161b','#eef2f6','#7c73e6','#ffffff','#e06a9f','#ffffff','#20c9b1','#042f2e','#111827','#ffffff','#35b9e8','#062e42','#35c58a','#052e21','#f1b632','#3c2800','#f26173','#42090d'],
  ['#fffaf1','#f6eddf','#eadfce','#342a20','#aa6a35','#ffffff','#d88971','#ffffff','#76a997','#102e25','#332b27','#ffffff','#4ba3c3','#092f3e','#67a875','#15331c','#dca943','#3d2a06','#d65e5e','#3e0a0a'],
];

const darkNames = new Set([
  'dark', 'synthwave', 'halloween', 'forest', 'aqua', 'black', 'luxury', 'dracula',
  'business', 'night', 'coffee', 'dim', 'sunset', 'abyss',
]);

export function makeTheme(name, index = 0) {
  const values = palettes[name] || fallbackSets[index % fallbackSets.length];
  return {
    id: `builtin-${name}`,
    builtin: true,
    name,
    colors: Object.fromEntries(colorKeys.map((key, i) => [key, values[i]])),
    radius: {
      box: name === 'wireframe' ? '0rem' : name === 'cupcake' ? '1rem' : '0.5rem',
      field: name === 'wireframe' ? '0rem' : '0.25rem',
      selector: name === 'wireframe' ? '0rem' : '0.25rem',
    },
    size: { field: 'md', selector: 'md' },
    border: '1px',
    depth: 1,
    noise: 0,
    fontFamily: 'Outfit',
    options: {
      defaultTheme: name === 'light',
      defaultDarkTheme: name === 'dark',
      darkColorScheme: darkNames.has(name),
    },
    generatedAt: new Date(0).toISOString(),
  };
}

export const builtins = builtinNames.map(makeTheme);
