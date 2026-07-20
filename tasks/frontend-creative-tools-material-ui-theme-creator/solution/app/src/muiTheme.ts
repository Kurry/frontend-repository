import { createTheme, type Theme } from '@mui/material/styles';
import type { ThemeOptions } from './domain';

// Build a live MUI theme from the store's ThemeOptions. `type` maps to MUI's
// palette `mode` (MUI v6). The previewed components + sample sites all consume
// this so they reflect the live options at all times.
export function buildMuiTheme(o: ThemeOptions): Theme {
  const p = o.palette;
  return createTheme({
    palette: {
      mode: p.type,
      primary: { main: p.primary.main },
      secondary: { main: p.secondary.main },
      error: { main: p.error.main },
      warning: { main: p.warning.main },
      info: { main: p.info.main },
      success: { main: p.success.main },
      background: {
        default: p.background?.default,
        paper: p.background?.paper
      },
      text: {
        primary: p.text?.primary,
        secondary: p.text?.secondary
      },
      divider: p.divider
    },
    typography: {
      fontFamily: `${o.typography?.fontFamily ?? 'Roboto'}, Roboto, system-ui, sans-serif`,
      fontSize: o.typography?.fontSize ?? 14
    },
    shape: { borderRadius: o.shape.borderRadius }
  });
}
