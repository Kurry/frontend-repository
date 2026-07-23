import { ThemeOptions } from '../store/themeSlice';

export type ThemeArtifactFormat = 'json' | 'css';

export function getCssExport(options: ThemeOptions) {
  const { palette, typography, shape } = options;
  return [
    ':root {',
    `  --primary: ${palette.primary.main};`,
    `  --secondary: ${palette.secondary.main};`,
    `  --error: ${palette.error.main};`,
    `  --warning: ${palette.warning.main};`,
    `  --info: ${palette.info.main};`,
    `  --success: ${palette.success.main};`,
    `  --background-default: ${palette.background?.default ?? '#fafafa'};`,
    `  --background-paper: ${palette.background?.paper ?? '#ffffff'};`,
    `  --text-primary: ${palette.text?.primary ?? 'rgba(0, 0, 0, 0.87)'};`,
    `  --divider: ${palette.divider ?? 'rgba(0, 0, 0, 0.12)'};`,
    `  --font-family: ${typography.fontFamily};`,
    `  --font-size: ${typography.fontSize}px;`,
    `  --border-radius: ${shape.borderRadius}px;`,
    '}',
  ].join('\n');
}

export function getThemeArtifact(format: ThemeArtifactFormat, name: string, options: ThemeOptions) {
  return format === 'json'
    ? JSON.stringify({ name, ...options }, null, 2)
    : getCssExport(options);
}

export async function copyThemeArtifact(format: ThemeArtifactFormat, name: string, options: ThemeOptions) {
  await navigator.clipboard.writeText(getThemeArtifact(format, name, options));
}
