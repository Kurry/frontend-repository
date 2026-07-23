import { useEffect, useMemo, useState } from 'react';
import { ActionIcon, Badge, Button, Group, Kbd, Modal, Paper, Stack, Text, TextInput, Title, Tooltip } from '@mantine/core';
import { IconCommand, IconMoon, IconSun, IconX } from '@tabler/icons-react';
import { deriveConstraint, deriveHero } from '../domain';
import { useReviewStore } from '../store';
import { GATE_NAMES, type ReviewBundle } from '../types';

export function DarkModeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('theme-dark'));
  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', dark);
  }, [dark]);
  return (
    <Tooltip label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
      <ActionIcon variant="default" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setDark((value) => !value)}>
        {dark ? <IconSun size={16} /> : <IconMoon size={16} />}
      </ActionIcon>
    </Tooltip>
  );
}

export function ReviewerPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const openBundle = useReviewStore((state) => state.openBundle);
  const selectGate = useReviewStore((state) => state.selectGate);
  const selectTrial = useReviewStore((state) => state.selectTrial);
  const selectCriterion = useReviewStore((state) => state.selectCriterion);
  const setWorkspacePanel = useReviewStore((state) => state.setWorkspacePanel);
  const bundles = useReviewStore((state) => state.bundles);
  const slug = useReviewStore((state) => state.selection.bundleSlug);
  const bundle = bundles.find((item) => item.slug === slug) ?? bundles[0];
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const actions = useMemo(() => {
    if (!bundle) return [];
    const items = [
      { id: 'portfolio', label: 'Open portfolio', run: () => useReviewStore.getState().openPortfolio() },
      { id: 'gate-board', label: 'Open gate board', run: () => { openBundle(bundle.slug, 'Gate'); } },
      { id: 'audit', label: 'Open trial inspector', run: () => { openBundle(bundle.slug, 'Audit'); selectGate('Difficulty — Sable-4', true); } },
      ...GATE_NAMES.map((gate) => ({ id: `gate-${gate}`, label: `Jump to gate · ${gate}`, run: () => { openBundle(bundle.slug, 'Gate'); selectGate(gate); } })),
      ...bundle.trials.slice(0, 8).map((trial) => ({ id: trial.id, label: `Select trial · ${trial.model} #${trial.number}`, run: () => { openBundle(bundle.slug, 'Audit'); selectGate(trial.model === 'Sable-4' ? 'Difficulty — Sable-4' : 'Difficulty — Quartz-Mini', true); selectTrial(trial.id); } })),
      ...bundle.criteria.map((criterion) => ({ id: criterion.id, label: `Select criterion · ${criterion.id.split('-').at(-1)} ${criterion.name}`, run: () => { openBundle(bundle.slug, 'Audit'); selectCriterion(criterion.id); } })),
      { id: 'timeline', label: 'Open event timeline', run: () => setWorkspacePanel('Timeline') },
    ];
    const needle = query.trim().toLowerCase();
    return needle ? items.filter((item) => item.label.toLowerCase().includes(needle)) : items;
  }, [bundle, openBundle, query, selectCriterion, selectGate, selectTrial, setWorkspacePanel]);
  return (
    <>
      <Tooltip label="Reviewer keyboard palette">
        <Button variant="default" leftSection={<IconCommand size={14} />} onClick={() => setOpen(true)} aria-label="Open reviewer keyboard palette">
          Palette <Kbd size="xs">⌘K</Kbd>
        </Button>
      </Tooltip>
      <Modal opened={open} onClose={() => setOpen(false)} title={<div><Text className="eyebrow">Keyboard palette</Text><Title order={3}>Jump across gates, trials, and criteria</Title></div>} trapFocus returnFocus closeOnEscape withinPortal>
        <TextInput autoFocus label="Filter shortcuts" placeholder="gate, trial, criterion…" value={query} onChange={(event) => setQuery(event.currentTarget.value)} mb="md" />
        <Stack gap="xs" className="palette-list" aria-label="Reviewer palette actions">
          {actions.map((action) => (
            <button type="button" key={action.id} className="palette-item" onClick={() => { action.run(); setOpen(false); setQuery(''); }}>
              {action.label}
            </button>
          ))}
        </Stack>
      </Modal>
    </>
  );
}

export function ReviewDuration({ bundle }: { bundle: ReviewBundle }) {
  const sessionActions = bundle.timeline.filter((item) => item.kind !== 'evidence').length;
  const activeMinutes = sessionActions ? Math.max(1, Math.ceil(sessionActions / 3)) : 0;
  const label = activeMinutes ? `${activeMinutes} min active` : 'not started';
  return <Badge variant="light" leftSection={<span aria-hidden="true">⏱</span>} aria-label={`Review duration ${label}, estimated from session timeline activity`}>Review duration · {label}</Badge>;
}

export function DependencyMinimap({ bundle }: { bundle: ReviewBundle }) {
  const hero = deriveHero(bundle);
  const constraint = deriveConstraint(bundle);
  const unresolved = bundle.fixItems.filter((item) => !item.resolved);
  return (
    <Paper className="dependency-minimap" aria-label="Gate to fix-item to recommendation dependency mini-map">
      <Text className="eyebrow">Live dependency chain</Text>
      <div className="minimap-row">
        {bundle.gates.map((gate) => (
          <span key={gate.name} className={`minimap-node status-${gate.status}`} title={`${gate.name}: ${gate.status}`}>{gate.name.split('—').at(-1)?.trim() ?? gate.name}</span>
        ))}
      </div>
      <Text size="xs" mt={6}>→ {unresolved.length} open fix items ({unresolved.map((item) => item.category).join(', ') || 'none'})</Text>
      <Text size="xs">→ Allowed: {constraint.allowed.join(' · ')} · Hero: {hero}</Text>
    </Paper>
  );
}

export function Coachmarks() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <aside className="coachmarks" aria-label="Review loop coachmarks">
      <Group justify="space-between" mb="xs">
        <Text fw={800}>Review loop tour</Text>
        <ActionIcon variant="subtle" aria-label="Dismiss coachmarks" onClick={() => setOpen(false)}><IconX size={14} /></ActionIcon>
      </Group>
      <ol>
        <li>Start on the portfolio and open a bundle row.</li>
        <li>Re-run a non-passing gate from the gate board.</li>
        <li>Export the certification package when the session is ready.</li>
      </ol>
      <Button size="xs" variant="light" onClick={() => setOpen(false)}>Dismiss tour</Button>
    </aside>
  );
}
