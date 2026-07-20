import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import { buildMuiTheme } from '../muiTheme';
import type { ThemeOptions } from '../domain';

export function MuiThemed({ options, children, paper = true }: { options: ThemeOptions; children: React.ReactNode; paper?: boolean }) {
  const theme = buildMuiTheme(options);
  const inner = paper ? (
    <Paper elevation={0} square style={{ minHeight: '100%', backgroundColor: theme.palette.background.default }}>
      {children}
    </Paper>
  ) : (
    children
  );
  return <ThemeProvider theme={theme}>{inner}</ThemeProvider>;
}
