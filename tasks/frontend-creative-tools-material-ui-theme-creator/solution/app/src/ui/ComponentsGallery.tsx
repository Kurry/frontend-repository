import React, { useMemo, useState } from 'react';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import Slider from '@mui/material/Slider';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import MuiAccordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import { useStore } from '../store';
import { MuiThemed } from './MuiThemed';
import { Icon } from './primitives';

interface Section {
  id: string;
  title: string;
  render: () => React.ReactNode;
}

const SECTIONS: Section[] = [
  { id: 'buttons', title: 'Buttons', render: () => (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <Button variant="contained">Contained</Button>
      <Button variant="outlined" color="secondary">Outlined</Button>
      <Button variant="text">Text</Button>
      <Button variant="contained" disabled>Disabled</Button>
    </Stack>
  ) },
  { id: 'accordion', title: 'Accordion', render: () => (
    <MuiAccordion>
      <AccordionSummary expandIcon={<span className="material-symbols-outlined">expand_more</span>}>Panel One</AccordionSummary>
      <AccordionDetails>Themed accordion content that follows the live palette.</AccordionDetails>
    </MuiAccordion>
  ) },
  { id: 'appbar', title: 'App Bar', render: () => (
    <AppBar position="static" color="primary"><Toolbar variant="dense"><Typography variant="subtitle1">Themed App Bar</Typography></Toolbar></AppBar>
  ) },
  { id: 'avatar', title: 'Avatar', render: () => (
    <Stack direction="row" spacing={1}><Avatar>A</Avatar><Avatar sx={{ bgcolor: 'secondary.main' }}>B</Avatar><Avatar sx={{ bgcolor: 'primary.main' }}>C</Avatar></Stack>
  ) },
  { id: 'badge', title: 'Badge', render: () => (
    <Stack direction="row" spacing={3}><Badge badgeContent={4} color="primary"><Icon name="mail" /></Badge><Badge badgeContent={9} color="secondary"><Icon name="notifications" /></Badge></Stack>
  ) },
  { id: 'card', title: 'Card', render: () => (
    <Card sx={{ maxWidth: 320 }}><CardContent><Typography variant="h6">Card Title</Typography><Typography variant="body2" color="text.secondary">Supporting text within a themed card surface.</Typography></CardContent></Card>
  ) },
  { id: 'checkboxes', title: 'Checkboxes', render: () => (
    <Stack direction="row"><Checkbox defaultChecked /><Checkbox /><Checkbox defaultChecked color="secondary" /><Checkbox disabled /></Stack>
  ) },
  { id: 'chip', title: 'Chip', render: () => (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap><Chip label="Primary" color="primary" /><Chip label="Secondary" color="secondary" /><Chip label="Outlined" variant="outlined" /></Stack>
  ) },
  { id: 'list', title: 'List', render: () => (
    <List dense><ListItemButton><ListItemText primary="Inbox" secondary="12 messages" /></ListItemButton><ListItemButton selected><ListItemText primary="Starred" /></ListItemButton></List>
  ) },
  { id: 'select', title: 'Select', render: () => (
    <TextField select size="small" label="Select" defaultValue="a" SelectProps={{ native: true }}><option value="a">Option A</option><option value="b">Option B</option></TextField>
  ) },
  { id: 'slider', title: 'Slider', render: () => (
    <Box sx={{ width: 240 }}><Slider defaultValue={40} /><Slider defaultValue={60} color="secondary" /></Box>
  ) },
  { id: 'stepper', title: 'Stepper', render: () => (
    <Stepper activeStep={1} alternativeLabel><Step><StepLabel>Palette</StepLabel></Step><Step><StepLabel>Typography</StepLabel></Step><Step><StepLabel>Export</StepLabel></Step></Stepper>
  ) },
  { id: 'switch', title: 'Switch', render: () => (
    <Stack direction="row"><Switch defaultChecked /><Switch /><Switch defaultChecked color="secondary" /><Switch disabled /></Stack>
  ) },
  { id: 'tabs', title: 'Tabs', render: () => (
    <Tabs value={0}><Tab label="Overview" /><Tab label="Details" /><Tab label="Activity" /></Tabs>
  ) },
  { id: 'textfield', title: 'TextField', render: () => (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap><TextField label="Standard" size="small" /><TextField label="Filled" variant="filled" size="small" /><TextField label="Error" size="small" error helperText="Required" /></Stack>
  ) },
  { id: 'tooltip', title: 'Tooltip', render: () => (
    <Tooltip title="Themed tooltip"><Button variant="outlined">Hover Me</Button></Tooltip>
  ) },
  { id: 'typography', title: 'Typography', render: () => (
    <Stack><Typography variant="h4">Heading 4</Typography><Typography variant="body1">Body text renders in the theme font family and size.</Typography><Typography variant="caption" color="text.secondary">Caption text</Typography></Stack>
  ) }
];

export function ComponentsGallery() {
  const options = useStore((s) => s.options);
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () => SECTIONS.filter((s) => s.title.toLowerCase().includes(query.trim().toLowerCase())),
    [query]
  );

  const jump = (id: string) => {
    if (window.location.hash !== `#comp-${id}`) window.history.replaceState(null, '', `#comp-${id}`);
    document.getElementById(`comp-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
      <aside className="bg-shell-1 rounded-xl border border-shell-border p-3 h-max lg:sticky lg:top-2">
        <div className="flex items-center gap-2 bg-shell-2 rounded-md px-2 py-1.5 mb-2 border border-shell-border">
          <Icon name="search" style={{ fontSize: 16 }} className="text-shell-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Filter components"
            placeholder="Filter components"
            className="bg-transparent text-xs text-shell-text outline-none flex-1"
          />
        </div>
        <nav aria-label="Component sections" className="flex flex-col gap-0.5 max-h-[60vh] overflow-auto scrollbar-thin">
          {filtered.map((s) => (
            <button key={s.id} type="button" onClick={() => jump(s.id)} className="row-wash text-left text-xs text-shell-muted px-2 py-1.5 rounded">
              {s.title}
            </button>
          ))}
          {filtered.length === 0 && <p className="text-xs text-shell-muted px-2 py-2">No components match your filter.</p>}
        </nav>
      </aside>

      <div className="min-w-0">
        <MuiThemed options={options}>
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map((s) => (
              <section key={s.id} id={`comp-${s.id}`} style={{ scrollMarginTop: 12 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                      <Typography variant="h6">{s.title}</Typography>
                      <button type="button" className="inert-link text-xs" style={{ color: 'inherit', opacity: 0.7 }} onClick={(e) => e.preventDefault()}>
                        Docs
                      </button>
                    </Stack>
                    {s.render()}
                  </CardContent>
                </Card>
              </section>
            ))}
            {filtered.length === 0 && <Typography color="text.secondary">No components match your filter.</Typography>}
          </Box>
        </MuiThemed>
      </div>
    </div>
  );
}

export const COMPONENT_SECTIONS = SECTIONS.map((s) => ({ id: s.id, title: s.title }));
