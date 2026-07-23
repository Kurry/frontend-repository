// Built-in theme catalog + closed token enums for the daisyUI theme studio.

export const COLOR_KEYS = [
  '--color-base-100', '--color-base-200', '--color-base-300', '--color-base-content',
  '--color-primary', '--color-primary-content',
  '--color-secondary', '--color-secondary-content',
  '--color-accent', '--color-accent-content',
  '--color-neutral', '--color-neutral-content',
  '--color-info', '--color-info-content',
  '--color-success', '--color-success-content',
  '--color-warning', '--color-warning-content',
  '--color-error', '--color-error-content',
];

export const BASE_KEYS = COLOR_KEYS.slice(0, 4);
export const SEMANTIC_NAMES = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];

export const RADIUS_VALUES = ['0rem', '0.25rem', '0.5rem', '1rem', '2rem'];
export const RADIUS_GROUPS = ['box', 'field', 'selector'];
export const SIZE_VALUES = ['xs', 'sm', 'md', 'lg', 'xl'];
export const SIZE_KINDS = ['field', 'selector'];
export const BORDER_VALUES = ['0.5px', '1px', '1.5px', '2px'];

export const FIELD_HEIGHT = { xs: '1.9rem', sm: '2.15rem', md: '2.5rem', lg: '2.9rem', xl: '3.4rem' };
export const SELECTOR_SIZE = { xs: '0.9rem', sm: '1.05rem', md: '1.25rem', lg: '1.5rem', xl: '1.75rem' };

export const FONT_FAMILIES = [
  { id: 'outfit', contract: 'Outfit', label: 'Outfit', css: '"Outfit", ui-sans-serif, system-ui, sans-serif' },
  { id: 'system', contract: 'system-ui', label: 'System', css: 'ui-sans-serif, system-ui, "Segoe UI", Helvetica, sans-serif' },
  { id: 'serif', contract: 'serif', label: 'Serif', css: 'ui-serif, Georgia, "Times New Roman", serif' },
  { id: 'mono', contract: 'monospace', label: 'Mono', css: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace' },
];

export const BUILTIN_NAMES = [
  'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate', 'synthwave', 'retro',
  'cyberpunk', 'valentine', 'halloween', 'garden', 'forest', 'aqua', 'lofi', 'pastel',
  'fantasy', 'wireframe', 'black', 'luxury', 'dracula', 'cmyk', 'autumn', 'business',
  'acid', 'lemonade', 'night', 'coffee', 'winter', 'dim', 'nord', 'sunset', 'caramellatte', 'abyss', 'silk',
];

// Palette order matches COLOR_KEYS.
const PALETTES = {
  light: ['#ffffff', '#f2f2f2', '#e5e6e6', '#1f2937', '#4b28d7', '#ffffff', '#f22c92', '#ffffff', '#08c8b5', '#083344', '#09090b', '#ffffff', '#15afe5', '#06283d', '#05ca91', '#052e24', '#ffb600', '#3b2500', '#fa5f78', '#3a0711'],
  dark: ['#1d232a', '#191e24', '#15191e', '#f2f7fa', '#7480ff', '#0b1020', '#ff6eb4', '#2b0b1c', '#00d3bb', '#042f2e', '#09090b', '#ffffff', '#00bafe', '#042f49', '#00d390', '#022c22', '#fcb700', '#422006', '#ff637d', '#4c0519'],
  cupcake: ['#faf7f5', '#efeae6', '#e7e2df', '#291334', '#65c3c8', '#102a2b', '#ef9fbc', '#3c1727', '#eeaf3a', '#332002', '#291334', '#f9f7fa', '#62b6e7', '#082f49', '#87d8a4', '#133822', '#e8bf73', '#3a2403', '#e98999', '#3e1119'],
  bumblebee: ['#ffffff', '#f8f8f8', '#eeeeee', '#18181b', '#f9d72f', '#2d2600', '#e0a82e', '#291c00', '#18181b', '#ffffff', '#18181b', '#ffffff', '#0ca5e9', '#082f49', '#20b486', '#042f2e', '#ffb800', '#412800', '#f43f5e', '#4c0519'],
  emerald: ['#ffffff', '#f1f5f4', '#e4ece9', '#1f2937', '#66cc8a', '#073719', '#377cfb', '#ffffff', '#f68067', '#3d1008', '#333c4d', '#ffffff', '#2094f3', '#ffffff', '#009485', '#ffffff', '#ff9900', '#321d00', '#ff5724', '#ffffff'],
  corporate: ['#ffffff', '#f3f5f7', '#e5e9ed', '#181a2a', '#4b6bfb', '#ffffff', '#7b92b2', '#101827', '#67cba0', '#052e21', '#181a2a', '#ffffff', '#1c92f2', '#ffffff', '#00a96e', '#ffffff', '#f7a900', '#382300', '#ff5861', '#ffffff'],
  synthwave: ['#1a103d', '#160d35', '#110a2a', '#f9f7fd', '#e779c1', '#350b2b', '#58c7f3', '#062a3a', '#f3cc30', '#362d00', '#221551', '#f8f2ff', '#56d8e4', '#062d32', '#75d9a3', '#0a3420', '#f5d36a', '#3a2b00', '#ed5e70', '#3e0911'],
  retro: ['#ece3ca', '#dfd6ba', '#d2c8aa', '#282425', '#ef9995', '#401315', '#a4cbb4', '#163126', '#d2a24c', '#392600', '#2d2b29', '#f7f1df', '#4aa8c0', '#092f38', '#6eaa78', '#13331b', '#e7b759', '#402900', '#e2706a', '#45110e'],
  cyberpunk: ['#fff248', '#f7e934', '#eadc20', '#211b00', '#ff7598', '#450616', '#75d1f0', '#073444', '#c07eec', '#300942', '#201047', '#ffffff', '#2ad7ff', '#003342', '#00d8a7', '#00372c', '#ffcf35', '#3c2b00', '#ff4365', '#4c0519'],
  valentine: ['#fae7f4', '#f4d8eb', '#ecc7e1', '#632c3b', '#e96d7b', '#3e0b12', '#a991f7', '#241456', '#88dbdd', '#083839', '#3d4451', '#ffffff', '#2094f3', '#ffffff', '#009485', '#ffffff', '#ff9900', '#321d00', '#ff5724', '#ffffff'],
  halloween: ['#212121', '#1b1b1b', '#151515', '#f5f3f0', '#f28c18', '#331700', '#6d3a9c', '#ffffff', '#51a800', '#102f00', '#171717', '#ffffff', '#00a6e8', '#062c3a', '#00b876', '#002e20', '#f7b000', '#3c2800', '#ef4545', '#420707'],
  garden: ['#e9e7e7', '#ddd9d9', '#cfcbcb', '#241f20', '#e96383', '#3d0a17', '#ec9f68', '#411c06', '#80b7a2', '#14382b', '#3e5b52', '#ffffff', '#40aee0', '#062e42', '#5ebd91', '#093923', '#f2ad4b', '#3d2600', '#e65355', '#430a0a'],
  forest: ['#171d17', '#121712', '#0d110d', '#e8f1e8', '#1eb854', '#032e12', '#1d9bf0', '#052c45', '#f39019', '#3c1f00', '#0b130d', '#eaffef', '#45b7e8', '#062e42', '#18b67a', '#032d1e', '#edac22', '#3d2800', '#e84e55', '#42090d'],
  aqua: ['#0f1729', '#0b1322', '#07101b', '#dff8ff', '#09d5e5', '#03353b', '#9468fa', '#1f0d4d', '#f7d244', '#372c00', '#16254c', '#ffffff', '#26b7ef', '#062d43', '#06cf9a', '#013528', '#ffb91e', '#3b2700', '#fb6175', '#47070f'],
  lofi: ['#ffffff', '#f4f4f4', '#e7e7e7', '#111111', '#0d0d0d', '#ffffff', '#1f1f1f', '#ffffff', '#333333', '#ffffff', '#050505', '#ffffff', '#2b92c9', '#ffffff', '#24825a', '#ffffff', '#b67a10', '#ffffff', '#bf3141', '#ffffff'],
  pastel: ['#ffffff', '#f5f5f5', '#e8e8e8', '#252525', '#d1c1d7', '#2f2533', '#f6cbd1', '#3a2327', '#b4e9d6', '#193b2f', '#70acc7', '#0a2e3e', '#9fd9ee', '#143444', '#9fe0c6', '#173a2d', '#f7d8a1', '#3a2b12', '#efb3ba', '#3e1e22'],
  fantasy: ['#ffffff', '#f2f2f2', '#e5e6e6', '#1f2937', '#6e0b75', '#f4e7f5', '#d926a9', '#ffffff', '#fb923c', '#332002', '#1f2937', '#ffffff', '#007cf0', '#ffffff', '#00a96e', '#ffffff', '#f7a900', '#382300', '#ff5861', '#ffffff'],
  wireframe: ['#ffffff', '#f2f2f2', '#e5e6e6', '#1f2937', '#b8b8b8', '#18181b', '#b8b8b8', '#18181b', '#b8b8b8', '#18181b', '#c0c0c0', '#18181b', '#b8b8b8', '#18181b', '#b8b8b8', '#18181b', '#b8b8b8', '#18181b', '#b8b8b8', '#18181b'],
  black: ['#000000', '#0d0d0d', '#1a1a1a', '#ffffff', '#ffffff', '#000000', '#dddddd', '#000000', '#cccccc', '#000000', '#333333', '#ffffff', '#666666', '#ffffff', '#999999', '#ffffff', '#cfcfcf', '#000000', '#969696', '#000000'],
  luxury: ['#09090b', '#171618', '#2e2d2f', '#ffffff', '#c9a96a', '#211c10', '#8a6d57', '#f2e8dc', '#ea799c', '#2c1017', '#17161a', '#d3c6a4', '#0e6d94', '#dff3fb', '#00a96e', '#d6f7ec', '#f7a900', '#382300', '#ff5861', '#ffe9ec'],
  dracula: ['#282a36', '#242631', '#1e2029', '#f8f8f2', '#ff79c6', '#2b3145', '#bd93f9', '#2b3145', '#ffb86c', '#2b3145', '#3a3d4d', '#f8f8f2', '#8be9fd', '#2b3145', '#50fa7b', '#2b3145', '#f1fa8c', '#2b3145', '#ff5555', '#2b3145'],
  cmyk: ['#ffffff', '#f2f2f2', '#e6e6e6', '#1f2937', '#45aeee', '#ffffff', '#e8488a', '#ffffff', '#ffd200', '#1f2937', '#1f2937', '#ffffff', '#007cf0', '#ffffff', '#00a96e', '#ffffff', '#f7a900', '#382300', '#ff5861', '#ffffff'],
  autumn: ['#f7f0e8', '#efe6db', '#e3d6c6', '#41332a', '#855e42', '#f7ede2', '#d97941', '#ffffff', '#6d9773', '#16241d', '#41332a', '#f7f0e8', '#007cf0', '#ffffff', '#00a96e', '#ffffff', '#f7a900', '#382300', '#ff5861', '#ffffff'],
  business: ['#212631', '#1c212a', '#161a22', '#dde3ee', '#1d4ed8', '#ffffff', '#7d8cab', '#121826', '#c2a24b', '#1c1a12', '#2c333f', '#cfd6e4', '#0076c9', '#dff1fc', '#16a34a', '#e6f7ec', '#d97706', '#fdf1de', '#dc2626', '#fdecec'],
  acid: ['#eaeaea', '#e0e0e0', '#d3d3d3', '#1a1a1a', '#ff00f0', '#14031d', '#00e6e6', '#053338', '#ffe600', '#332e05', '#1f2937', '#ffffff', '#007cf0', '#ffffff', '#00a96e', '#ffffff', '#f7a900', '#382300', '#ff5861', '#ffffff'],
  lemonade: ['#fefce8', '#fdf4c8', '#faf0a8', '#373f2d', '#ea3d85', '#ffffff', '#f97316', '#ffffff', '#86cc2f', '#1f2937', '#262626', '#ffffff', '#0076c9', '#ffffff', '#16a34a', '#ffffff', '#d97706', '#ffffff', '#dc2626', '#ffffff'],
  night: ['#1a2333', '#131b29', '#0d1420', '#cdd6e4', '#38bdf8', '#082f49', '#818cf8', '#101738', '#f472b6', '#370f2a', '#233043', '#cdd6e4', '#0ea5e9', '#082f49', '#22c55e', '#052e16', '#f59e0b', '#451a03', '#ef4444', '#450a0a'],
  coffee: ['#231c19', '#1d1714', '#171210', '#f2e9e1', '#db924b', '#26160a', '#b67f4b', '#20160c', '#e8a554', '#2a1c0d', '#292420', '#e6dbd1', '#0076c9', '#dff1fc', '#16a34a', '#e6f7ec', '#d97706', '#fdf1de', '#dc2626', '#fdecec'],
  winter: ['#ffffff', '#f2f6fb', '#e3edf7', '#333c4d', '#047aff', '#effaff', '#8143e6', '#f3f0ff', '#16db93', '#11262c', '#2c3a47', '#ffffff', '#007cf0', '#ffffff', '#00a96e', '#ffffff', '#f7a900', '#382300', '#ff5861', '#ffffff'],
  dim: ['#191b21', '#14161b', '#0f1115', '#dee4ee', '#5b7bd5', '#eff4fb', '#c26bd1', '#fbeffa', '#f4a261', '#2f1c10', '#232936', '#d8dee9', '#4390ab', '#effaff', '#6da169', '#f1f7ee', '#c9903c', '#2c1f08', '#c95560', '#fbecee'],
  nord: ['#2e3440', '#3b4252', '#434c5e', '#eceff4', '#81a1c1', '#2e3440', '#88c0d0', '#2e3440', '#5e81ac', '#eceff4', '#4c566a', '#eceff4', '#88c0d0', '#2e3440', '#a3be8c', '#2e3440', '#ebcb8b', '#2e3440', '#bf616a', '#eceff4'],
  sunset: ['#1c2333', '#151b29', '#0f1420', '#f7d7b4', '#f0717a', '#1c1017', '#f2c14e', '#2a1c0d', '#86b6d6', '#101c26', '#2b3547', '#f7d7b4', '#f9b98d', '#23180b', '#95c78a', '#12211a', '#e9a16c', '#2b160a', '#d67782', '#26101a'],
  caramellatte: ['#fdf3e6', '#f8e7cf', '#f0d9b8', '#513d29', '#cf7443', '#2a1409', '#a85d2e', '#fdf3e6', '#7b9e6b', '#16241d', '#4c3a2d', '#f8e7cf', '#0076c9', '#ffffff', '#16a34a', '#ffffff', '#d97706', '#ffffff', '#dc2626', '#ffffff'],
  abyss: ['#030812', '#0a1120', '#101a30', '#d1deee', '#0ea5e9', '#041527', '#1e3a5f', '#cfe6ff', '#38bdf8', '#062338', '#141f33', '#c9d6e8', '#0369a1', '#d8f1ff', '#059669', '#d6f7ec', '#d97706', '#2a1602', '#dc2626', '#fde8e8'],
  silk: ['#efeae6', '#e4dcd5', '#d5c9bf', '#43372f', '#7f5f46', '#f7f0e9', '#b08d6e', '#241811', '#c7a17a', '#2c1e12', '#322822', '#e9dfd6', '#6b8ea3', '#f0f6fa', '#7d9b76', '#f2f7f0', '#c2a878', '#2b2210', '#a26769', '#f7ecec'],
};

const DARK_NAMES = new Set([
  'dark', 'synthwave', 'halloween', 'forest', 'aqua', 'black', 'luxury', 'dracula',
  'business', 'night', 'coffee', 'dim', 'sunset', 'abyss', 'nord',
]);

export function makeBuiltin(name) {
  const values = PALETTES[name];
  const wireframe = name === 'wireframe';
  return {
    id: `builtin-${name}`,
    builtin: true,
    name,
    colors: Object.fromEntries(COLOR_KEYS.map((key, i) => [key, values[i]])),
    radius: {
      box: wireframe ? '0rem' : name === 'cupcake' ? '1rem' : name === 'retro' ? '0.25rem' : '0.5rem',
      field: wireframe ? '0rem' : '0.25rem',
      selector: wireframe ? '0rem' : name === 'cupcake' ? '0.5rem' : '0.25rem',
    },
    size: { field: 'md', selector: 'md' },
    border: '1px',
    depth: 1,
    noise: name === 'forest' || name === 'halloween' || name === 'abyss' ? 1 : 0,
    fontFamily: 'outfit',
    options: {
      defaultTheme: name === 'light',
      defaultDarkTheme: name === 'dark',
      darkColorScheme: DARK_NAMES.has(name),
    },
    generatedAt: new Date(0).toISOString(),
  };
}

export const BUILTINS = BUILTIN_NAMES.map(makeBuiltin);

// Four most identifying colors for the row chips.
export const CHIP_KEYS = ['--color-primary', '--color-secondary', '--color-accent', '--color-neutral'];

export function chipHexes(theme) {
  return CHIP_KEYS.map((k) => theme.colors[k]);
}

export function prettyToken(key) {
  return key.replace(/^--color-/, '').split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
}
