import { ThemeOptions } from '../store/themeSlice';

export function toEditorSource(options: ThemeOptions): string {
  const p = options.palette;
  const t = options.typography || {};
  const borderRadius = options.shape?.borderRadius ?? 4;

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
  lines.push(`  shape: { borderRadius: ${borderRadius} },`);
  lines.push("};");
  lines.push("");
  return lines.join("\n");
}

export function parseEditorSource(src: string, defaultThemeOptions: ThemeOptions): ThemeOptions {
  if (!src || typeof src !== 'string') throw new Error('empty');
  const declStart = src.match(/(?:export\s+)?const\s+themeOptions\s*:\s*ThemeOptions\s*=\s*\{/);
  const declEnd = src.indexOf('};');
  if (!declStart || declEnd < declStart.index!) {
    throw new Error('invalid ThemeOptions declaration');
  }
  // Field extraction runs against the declaration region only, so trailing
  // content after `};` (comments are intentionally tolerated) can never
  // contribute stray tokens to the parsed options.
  const decl = src.slice(declStart.index!, declEnd + 2);

  const typeMatch = decl.match(/type:\s*['"](light|dark)['"]/);
  const bgDefault = decl.match(/background:\s*\{[\s\S]*?default:\s*['"]([^'"]+)['"]/);
  const bgPaper = decl.match(/background:\s*\{[\s\S]*?paper:\s*['"]([^'"]+)['"]/);
  const textPrimary = decl.match(/text:\s*\{[\s\S]*?primary:\s*['"]([^'"]+)['"]/);
  const textSecondary = decl.match(/text:\s*\{[\s\S]*?secondary:\s*['"]([^'"]+)['"]/);
  const textDisabled = decl.match(/text:\s*\{[\s\S]*?disabled:\s*['"]([^'"]+)['"]/);
  const textHint = decl.match(/text:\s*\{[\s\S]*?hint:\s*['"]([^'"]+)['"]/);
  const divider = decl.match(/divider:\s*['"]([^'"]+)['"]/);
  const fontFamily = decl.match(/fontFamily:\s*['"]([^'"]+)['"]/);
  const fontSize = decl.match(/fontSize:\s*(\d+)/);
  const buttonTransform = decl.match(/button:\s*\{[\s\S]*?textTransform:\s*['"]([^'"]+)['"]/);
  const spacing = decl.match(/\bspacing:\s*(\d+)/);
  const borderRadius = decl.match(/shape:\s*\{[\s\S]*?borderRadius:\s*(\d+)/);

  if (!typeMatch) throw new Error('palette.type is required');
  if (!fontFamily) throw new Error('typography.fontFamily is required');
  if (!fontSize || Number(fontSize[1]) < 8 || Number(fontSize[1]) > 24) {
    throw new Error('typography.fontSize must be between 8 and 24');
  }
  if (borderRadius && (Number(borderRadius[1]) < 0 || Number(borderRadius[1]) > 24)) {
    throw new Error('shape.borderRadius must be between 0 and 24');
  }

  const o = JSON.parse(JSON.stringify(defaultThemeOptions)) as ThemeOptions;

  if (typeMatch) o.palette.type = typeMatch[1] as 'light'|'dark';

  // Static literal patterns (never built from interpolated strings) for the
  // fixed intent/channel vocabulary.
  const intentBlockPatterns = {
    primary: /primary:\s*\{([^}]*)\}/,
    secondary: /secondary:\s*\{([^}]*)\}/,
    error: /error:\s*\{([^}]*)\}/,
    warning: /warning:\s*\{([^}]*)\}/,
    info: /info:\s*\{([^}]*)\}/,
    success: /success:\s*\{([^}]*)\}/,
  } as const;
  const channelPatterns = {
    main: /main:\s*['"]([^'"]+)['"]/,
    light: /light:\s*['"]([^'"]+)['"]/,
    dark: /dark:\s*['"]([^'"]+)['"]/,
    contrastText: /contrastText:\s*['"]([^'"]+)['"]/,
  } as const;
  for (const intent of Object.keys(intentBlockPatterns) as (keyof typeof intentBlockPatterns)[]) {
    const block = decl.match(intentBlockPatterns[intent])?.[1];
    if (!block) throw new Error(`palette.${intent} is required`);
    for (const channel of Object.keys(channelPatterns) as (keyof typeof channelPatterns)[]) {
      const value = block.match(channelPatterns[channel])?.[1];
      if (!value || !/^#[0-9a-fA-F]{6}$/.test(value)) {
        throw new Error(`palette.${intent}.${channel} must be #RRGGBB`);
      }
      o.palette[intent][channel] = value;
    }
  }

  if (bgDefault) o.palette.background = { ...o.palette.background, default: bgDefault[1] } as any;
  if (bgPaper) o.palette.background = { ...o.palette.background, paper: bgPaper[1] } as any;
  if (textPrimary || textSecondary || textDisabled || textHint) {
    o.palette.text = {
      primary: textPrimary?.[1] ?? o.palette.text?.primary ?? '#212121',
      secondary: textSecondary?.[1] ?? o.palette.text?.secondary ?? '#757575',
      disabled: textDisabled?.[1] ?? o.palette.text?.disabled,
      hint: textHint?.[1] ?? o.palette.text?.hint,
    };
  }
  if (divider) o.palette.divider = divider[1];

  if (fontFamily) o.typography.fontFamily = fontFamily[1];
  if (fontSize) o.typography.fontSize = Number(fontSize[1]);
  if (buttonTransform) {
    o.typography.button = { textTransform: buttonTransform[1] };
  }
  if (spacing) o.spacing = Number(spacing[1]);
  o.shape = { borderRadius: borderRadius ? Number(borderRadius[1]) : (o.shape?.borderRadius ?? 4) };

  return o;
}
