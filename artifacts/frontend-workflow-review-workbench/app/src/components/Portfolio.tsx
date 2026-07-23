import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Badge, Button, Group, Paper, Select, Stack, Table, Text, Title, Tooltip } from '@mantine/core';
import { Controller, useForm } from 'react-hook-form';
import { IconAdjustments, IconArrowRight, IconFilterOff, IconPackage, IconSparkles } from '@tabler/icons-react';
import { deriveHero, completionCount, isBundled } from '../domain';
import { portfolioRollup } from '../exporters';
import { filterFormSchema } from '../schemas';
import { useReviewStore } from '../store';
import { GATE_NAMES, GATE_STATUSES, HERO_STATES, type GateName, type GateStatus, type HeroState } from '../types';
import { FlagBadge, HeroBanner, ReviewProgress, StatusBadge } from './Common';

type FilterValues = { heroState: HeroState | null; gateName: GateName | null; gateStatus: GateStatus | null };

export default function Portfolio() {
  const bundles = useReviewStore((state) => state.bundles);
  const filters = useReviewStore((state) => state.filters);
  const openBundle = useReviewStore((state) => state.openBundle);
  const selectGate = useReviewStore((state) => state.selectGate);
  const setHeroFilter = useReviewStore((state) => state.setHeroFilter);
  const setGateFilter = useReviewStore((state) => state.setGateFilter);
  const clearFilters = useReviewStore((state) => state.clearFilters);
  const rollup = useMemo(() => portfolioRollup(bundles), [bundles]);
  const { control, setValue } = useForm<FilterValues>({ resolver: zodResolver(filterFormSchema), defaultValues: filters });

  const visible = bundles.filter((bundle) => {
    if (filters.heroState && deriveHero(bundle) !== filters.heroState) return false;
    if (filters.gateName && filters.gateStatus) {
      if (bundle.gates.find((gate) => gate.name === filters.gateName)?.status !== filters.gateStatus) return false;
    }
    return true;
  });

  const clearAll = () => {
    setValue('heroState', null);
    setValue('gateName', null);
    setValue('gateStatus', null);
    clearFilters();
  };

  const openGate = (slug: string, gateName: GateName) => {
    openBundle(slug, 'Gate');
    selectGate(gateName, gateName.startsWith('Difficulty'));
  };

  return (
    <main className="portfolio-shell" id="portfolio-view">
      <div className="view-heading">
        <div>
          <Text className="eyebrow">Certification Queue</Text>
          <Title order={1}>Task Bundle Portfolio</Title>
          <Text c="dimmed" mt={5}>Twelve evidence-backed tasks awaiting benchmark certification.</Text>
        </div>
        <Badge variant="outline" size="lg" leftSection={<IconSparkles size={15} />}>Sable-4 Calibration Active</Badge>
      </div>

      <section className="rollup-grid" aria-label="Live portfolio rollup">
        <Paper className="rollup-card rollup-total"><Text size="xs">Total Bundles</Text><Text className="rollup-value">{rollup.totalBundles}</Text></Paper>
        <Paper className="rollup-card rollup-ready"><Text size="xs">Ready</Text><Text className="rollup-value">{rollup.readyCount}</Text></Paper>
        <Paper className="rollup-card rollup-fixable"><Text size="xs">Fixable</Text><Text className="rollup-value">{rollup.notReadyCount}</Text></Paper>
        <Paper className="rollup-card rollup-risk"><Text size="xs">At Risk</Text><Text className="rollup-value">{rollup.atRiskCount}</Text></Paper>
        <Paper className="rollup-card rollup-stop"><Text size="xs">Stop-Early</Text><Text className="rollup-value">{rollup.stopEarlyCount}</Text></Paper>
      </section>

      <Paper className="calibration-strip" component="section" aria-labelledby="calibration-title">
        <div className="calibration-heading">
          <div><Text id="calibration-title" fw={750}>Sable-4 Trial Validity</Text><Text size="xs" c="dimmed">Valid trials / total trials by bundle</Text></div>
          <div className="calibration-overall">
            <span>{rollup.sable4ValidityPercent.toFixed(1)}%</span>
            <Text size="xs">overall validity</Text>
            <div className="calibration-markers" aria-label="Calibration threshold markers">
              <span>Difficulty bar <strong>0.80</strong></span>
              <span>Oracle bar <strong>0.90</strong></span>
              <span>Minimum <strong>3 valid trials</strong></span>
            </div>
          </div>
        </div>
        <div className="calibration-cells">
          {bundles.map((bundle) => {
            const gate = bundle.gates.find((item) => item.name === 'Difficulty — Sable-4')!;
            return (
              <Tooltip key={bundle.slug} label={`${bundle.slug}: ${gate.validTrials}/${gate.totalTrials} valid Sable-4 trials`} withArrow>
                <button type="button" className="calibration-cell" onClick={() => openGate(bundle.slug, gate.name)} aria-label={`${bundle.slug}, ${gate.validTrials} of ${gate.totalTrials} valid Sable-4 trials`}>
                  <span className="calibration-short">{bundle.slug.split('-')[0]}</span>
                  <strong>{gate.validTrials}/{gate.totalTrials}</strong>
                </button>
              </Tooltip>
            );
          })}
        </div>
      </Paper>

      <Paper className="filter-bar" component="form" aria-label="Portfolio filters">
        <Group align="end" gap="sm" wrap="wrap">
          <IconAdjustments size={20} aria-hidden="true" />
          <Controller name="heroState" control={control} render={({ field }) => (
            <Select {...field} value={field.value} label="Hero state" placeholder="All hero states" data={HERO_STATES.map((value) => ({ value, label: value }))} clearable w={255} onChange={(value) => { field.onChange(value); setHeroFilter(value as HeroState | null); }} />
          )} />
          <Controller name="gateName" control={control} render={({ field }) => (
            <Select {...field} value={field.value} label="Gate" placeholder="Choose gate" data={GATE_NAMES.map((value) => ({ value, label: value }))} clearable w={235} onChange={(value) => { field.onChange(value); setGateFilter(value as GateName | null, filters.gateStatus); }} />
          )} />
          <Controller name="gateStatus" control={control} render={({ field }) => (
            <Select {...field} value={field.value} label="Status" placeholder="Choose status" data={GATE_STATUSES.map((value) => ({ value, label: value }))} clearable w={150} onChange={(value) => { field.onChange(value); setGateFilter(filters.gateName, value as GateStatus | null); }} />
          )} />
          <Button variant="default" leftSection={<IconFilterOff size={16} />} onClick={clearAll}>Clear filters</Button>
          <Text size="sm" c="dimmed" ml="auto">{visible.length} of {bundles.length} bundles</Text>
        </Group>
        {(filters.heroState || (filters.gateName && filters.gateStatus)) && (
          <Group mt="sm" gap="xs" aria-label="Active filters">
            <Text size="xs" fw={700}>ACTIVE</Text>
            {filters.heroState && <Badge className="filter-chip" rightSection={<button aria-label="Remove hero-state filter" onClick={() => { setValue('heroState', null); setHeroFilter(null); }}>×</button>}>{filters.heroState}</Badge>}
            {filters.gateName && filters.gateStatus && <Badge className="filter-chip" rightSection={<button aria-label="Remove gate-status filter" onClick={() => { setValue('gateName', null); setValue('gateStatus', null); setGateFilter(null, null); }}>×</button>}>{filters.gateName}: {filters.gateStatus}</Badge>}
          </Group>
        )}
      </Paper>

      {visible.length === 0 ? (
        <Paper className="empty-state">
          <IconFilterOff size={34} />
          <Title order={3}>No bundles match the active filters</Title>
          <Text>Nothing proves {filters.heroState ?? 'the selected hero state'}{filters.gateName && filters.gateStatus ? ` with ${filters.gateName} = ${filters.gateStatus}` : ''}.</Text>
          <Button onClick={clearAll}>Clear filters</Button>
        </Paper>
      ) : (
        <>
          <Paper className="portfolio-table-wrap">
            <Table striped highlightOnHover verticalSpacing="md" horizontalSpacing="md" aria-label="Review bundle portfolio">
              <Table.Thead><Table.Tr><Table.Th>Bundle</Table.Th><Table.Th>Verdict hero</Table.Th><Table.Th>Gate evidence</Table.Th><Table.Th>Flags</Table.Th><Table.Th>Review</Table.Th><Table.Th><span className="sr-only">Open</span></Table.Th></Table.Tr></Table.Thead>
              <Table.Tbody>
                {visible.map((bundle) => (
                  <Table.Tr key={bundle.slug} className="bundle-row" tabIndex={0} role="link" aria-label={`Open ${bundle.slug}`} onClick={() => openBundle(bundle.slug)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openBundle(bundle.slug); } }}>
                    <Table.Td><Text fw={750}>{bundle.slug}</Text><Text size="xs" c="dimmed" lineClamp={2}>{bundle.description}</Text></Table.Td>
                    <Table.Td><Stack gap={6}><HeroBanner state={deriveHero(bundle)} compact />{isBundled(bundle) && <Badge className="bundled-badge" leftSection={<IconPackage size={13} />}>Bundled</Badge>}</Stack></Table.Td>
                    <Table.Td><div className="gate-chip-row">{bundle.gates.map((gate, index) => <Tooltip key={gate.name} label={`${gate.name}: ${gate.status}`}><button className="gate-chip-button" aria-label={`${gate.name}: ${gate.status}; open evidence`} onClick={(event) => { event.stopPropagation(); openGate(bundle.slug, gate.name); }}><span>{index + 1}</span><StatusBadge status={gate.status} label={gate.name.replace('Difficulty — ', '')} /></button></Tooltip>)}</div></Table.Td>
                    <Table.Td><Stack gap={5}>{bundle.stopEarlyFlags.length ? bundle.stopEarlyFlags.map((flag) => <FlagBadge key={flag} flag={flag} />) : <Text size="xs" c="dimmed">None</Text>}</Stack></Table.Td>
                    <Table.Td><ReviewProgress count={completionCount(bundle)} /></Table.Td>
                    <Table.Td><IconArrowRight size={18} /></Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>

          <div className="portfolio-cards" aria-label="Review bundle portfolio cards">
            {visible.map((bundle) => (
              <Paper key={bundle.slug} component="button" className="bundle-card" onClick={() => openBundle(bundle.slug)}>
                <Group justify="space-between"><Text fw={800}>{bundle.slug}</Text><IconArrowRight size={18} /></Group>
                <HeroBanner state={deriveHero(bundle)} compact />
                <div className="mobile-gates">{bundle.gates.map((gate, index) => <Tooltip key={gate.name} label={gate.name}><span><StatusBadge status={gate.status} label={`${index + 1}`} /></span></Tooltip>)}</div>
                <Group justify="space-between">{bundle.stopEarlyFlags[0] ? <FlagBadge flag={bundle.stopEarlyFlags[0]} /> : <span />}{isBundled(bundle) && <Badge className="bundled-badge">Bundled</Badge>}</Group>
                <ReviewProgress count={completionCount(bundle)} />
              </Paper>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
