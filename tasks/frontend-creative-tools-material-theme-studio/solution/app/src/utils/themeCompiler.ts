import { ThemeOptions } from '../store/themeSlice';

export function toEditorSource(options: ThemeOptions): string {
  const p = options.palette;
  const t = options.typography || {};
  const shape = options.shape || {};

  const lines: string[] = [];
  lines.push("import { ThemeOptions } from '@material-ui/core/styles';");
  lines.push("");
  lines.push("export const themeOptions: ThemeOptions = {");
  lines.push("  palette: {");
  lines.push(`    type: '${p.type}',`);
  lines.push("    primary: {");
  lines.push(`      main: '${p.primary.main}',`);
  lines.push(`      light: '${p.primary.light}',`);
  lines.push(`      dark: '${p.primary.dark}',`);
  lines.push(`      contrastText: '${p.primary.contrastText}',`);
  lines.push("    },");
  lines.push("    secondary: {");
  lines.push(`      main: '${p.secondary.main}',`);
  lines.push(`      light: '${p.secondary.light}',`);
  lines.push(`      dark: '${p.secondary.dark}',`);
  lines.push(`      contrastText: '${p.secondary.contrastText}',`);
  lines.push("    },");
  lines.push(`    error: { main: '${p.error.main}', light: '${p.error.light}', dark: '${p.error.dark}', contrastText: '${p.error.contrastText}' },`);
  lines.push(`    warning: { main: '${p.warning.main}', light: '${p.warning.light}', dark: '${p.warning.dark}', contrastText: '${p.warning.contrastText}' },`);
  lines.push(`    info: { main: '${p.info.main}', light: '${p.info.light}', dark: '${p.info.dark}', contrastText: '${p.info.contrastText}' },`);
  lines.push(`    success: { main: '${p.success.main}', light: '${p.success.light}', dark: '${p.success.dark}', contrastText: '${p.success.contrastText}' },`);
  if (p.background) {
      lines.push("    background: {");
      lines.push(`      default: '${p.background.default}',`);
      lines.push(`      paper: '${p.background.paper}',`);
      lines.push("    },");
  }
  if (p.text) {
      lines.push("    text: {");
      lines.push(`      primary: '${p.text.primary}',`);
      lines.push(`      secondary: '${p.text.secondary}',`);
      if (p.text.disabled) lines.push(`      disabled: '${p.text.disabled}',`);
      if (p.text.hint) lines.push(`      hint: '${p.text.hint}',`);
      lines.push("    },");
  }
  if (p.divider) {
      lines.push(`    divider: '${p.divider}',`);
  }
  lines.push("  },");
  lines.push("  typography: {");
  lines.push(`    fontFamily: '${t.fontFamily || 'Roboto, Helvetica, Arial, sans-serif'}',`);
  lines.push(`    fontSize: ${t.fontSize || 14},`);
  if (t.button && t.button.textTransform) {
    lines.push(`    button: { textTransform: '${t.button.textTransform}' },`);
  }
  lines.push("  },");
  if (options.spacing != null) {
    lines.push(`  spacing: ${options.spacing},`);
  }
  if (shape.borderRadius != null) {
    lines.push(`  shape: { borderRadius: ${shape.borderRadius} },`);
  }
  lines.push("};");
  lines.push("");
  return lines.join("\n");
}

export function parseEditorSource(src: string, defaultThemeOptions: ThemeOptions): ThemeOptions {
  if (!src || typeof src !== 'string') throw new Error('empty');

  const typeMatch = src.match(/type:\s*['"](light|dark)['"]/);
  const primaryMain = src.match(/primary:\s*\{[\s\S]*?main:\s*['"]([^'"]+)['"]/);
  const secondaryMain = src.match(/secondary:\s*\{[\s\S]*?main:\s*['"]([^'"]+)['"]/);
  const errorMain = src.match(/error:\s*\{[\s\S]*?main:\s*['"]([^'"]+)['"]/);
  const warningMain = src.match(/warning:\s*\{[\s\S]*?main:\s*['"]([^'"]+)['"]/);
  const infoMain = src.match(/info:\s*\{[\s\S]*?main:\s*['"]([^'"]+)['"]/);
  const successMain = src.match(/success:\s*\{[\s\S]*?main:\s*['"]([^'"]+)['"]/);
  const bgDefault = src.match(/background:\s*\{[\s\S]*?default:\s*['"]([^'"]+)['"]/);
  const bgPaper = src.match(/background:\s*\{[\s\S]*?paper:\s*['"]([^'"]+)['"]/);
  const fontFamily = src.match(/fontFamily:\s*['"]([^'"]+)['"]/);
  const fontSize = src.match(/fontSize:\s*(\d+)/);
  const buttonTransform = src.match(/button:\s*\{[\s\S]*?textTransform:\s*['"]([^'"]+)['"]/);
  const spacing = src.match(/\bspacing:\s*(\d+)/);
  const borderRadius = src.match(/shape:\s*\{[\s\S]*?borderRadius:\s*(\d+)/);

  const o = JSON.parse(JSON.stringify(defaultThemeOptions)) as ThemeOptions;

  if (typeMatch) o.palette.type = typeMatch[1] as 'light'|'dark';

  if (primaryMain) { o.palette.primary.main = primaryMain[1]; o.palette.primary.light = primaryMain[1]; o.palette.primary.dark = primaryMain[1]; o.palette.primary.contrastText = '#ffffff'; }
  if (secondaryMain) { o.palette.secondary.main = secondaryMain[1]; o.palette.secondary.light = secondaryMain[1]; o.palette.secondary.dark = secondaryMain[1]; o.palette.secondary.contrastText = '#ffffff'; }
  if (errorMain) { o.palette.error.main = errorMain[1]; o.palette.error.light = errorMain[1]; o.palette.error.dark = errorMain[1]; o.palette.error.contrastText = '#ffffff'; }
  if (warningMain) { o.palette.warning.main = warningMain[1]; o.palette.warning.light = warningMain[1]; o.palette.warning.dark = warningMain[1]; o.palette.warning.contrastText = '#ffffff'; }
  if (infoMain) { o.palette.info.main = infoMain[1]; o.palette.info.light = infoMain[1]; o.palette.info.dark = infoMain[1]; o.palette.info.contrastText = '#ffffff'; }
  if (successMain) { o.palette.success.main = successMain[1]; o.palette.success.light = successMain[1]; o.palette.success.dark = successMain[1]; o.palette.success.contrastText = '#ffffff'; }

  if (bgDefault) o.palette.background = { ...o.palette.background, default: bgDefault[1] } as any;
  if (bgPaper) o.palette.background = { ...o.palette.background, paper: bgPaper[1] } as any;

  if (fontFamily) o.typography.fontFamily = fontFamily[1];
  if (fontSize) o.typography.fontSize = Number(fontSize[1]);
  if (buttonTransform) {
    o.typography.button = { textTransform: buttonTransform[1] };
  }
  if (spacing) o.spacing = Number(spacing[1]);
  if (borderRadius) o.shape = { borderRadius: Number(borderRadius[1]) };

  return o;
}
