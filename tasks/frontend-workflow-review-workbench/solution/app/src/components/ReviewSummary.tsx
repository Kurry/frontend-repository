import { Badge, Button, Group, Paper, Table, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconClipboard, IconPackageExport } from '@tabler/icons-react';
import { bundleSummaryMarkdown } from '../exporters';
import { deriveHero, isBundled } from '../domain';
import { useReviewStore } from '../store';
import type { ReviewBundle } from '../types';
import { CategoryBadge, HeroBanner, StatusBadge } from './Common';

export default function ReviewSummary({ bundle }: { bundle: ReviewBundle }) {
  const completeBundling = useReviewStore((state) => state.completeBundling);
  const setAnnouncement = useReviewStore((state) => state.setAnnouncement);
  const canBundle = bundle.reviewerSteps.find((step) => step.name === 'Verdict')?.done && !!bundle.recommendation;
  const copy = async () => {
    await navigator.clipboard.writeText(bundleSummaryMarkdown(bundle));
    setAnnouncement('Review summary copied.');
    notifications.show({ title: 'Summary copied', message: 'The current review summary is on the clipboard.', color: 'teal', icon: <IconCheck size={16} /> });
  };
  return (
    <section aria-labelledby="summary-title">
      <div className="section-heading"><div><Text className="eyebrow">Live session document</Text><Title id="summary-title" order={2}>Review Summary</Title><Text size="sm" c="dimmed">Generated from current gates, fixes, verdict, and reviewer notes.</Text></div><Group><Button variant="default" leftSection={<IconClipboard size={16} />} onClick={copy}>Copy summary</Button><Button leftSection={<IconPackageExport size={16} />} disabled={!canBundle || isBundled(bundle)} onClick={() => { const result = completeBundling(bundle.slug); if (!result.ok) notifications.show({ color: 'red', title: 'Bundling blocked', message: result.error }); else { setAnnouncement('Bundling complete.'); notifications.show({ color: 'teal', title: 'Bundling complete', message: `${bundle.slug} is now marked Bundled.`, icon: <IconCheck size={16} /> }); } }}>{isBundled(bundle) ? 'Bundling complete' : 'Complete bundling'}</Button></Group></div>
      {!canBundle && <Paper className="locked-inline"><Text fw={700}>Complete Verdict and record a recommendation to enable Complete bundling.</Text></Paper>}
      <Paper className="summary-document">
        <div className="summary-header"><div><Text className="eyebrow">CERTIFICATION REVIEW · {bundle.slug}</Text><Title order={2}>{bundle.title}</Title></div>{isBundled(bundle) && <Badge className="bundled-badge">Bundled</Badge>}</div>
        <div className="summary-hero"><Text size="xs" fw={800}>VERDICT HERO</Text><HeroBanner state={deriveHero(bundle)} /></div>
        <div className="summary-recommendation">
          <Text size="xs" fw={800}>RECORDED RECOMMENDATION</Text>
          <Text size="xl" fw={850}>{bundle.recommendation ?? 'UNSET'}</Text>
          {bundle.overrideJustification && <div className="summary-override"><Badge color="orange">Override</Badge><Text size="sm">{bundle.overrideJustification}</Text></div>}
        </div>
        <section className="summary-section">
          <Title order={3}>Gates</Title>
          <div className="inner-table-scroll"><Table verticalSpacing="sm"><Table.Thead><Table.Tr><Table.Th>Gate</Table.Th><Table.Th>Status</Table.Th><Table.Th>Score</Table.Th><Table.Th>Trials</Table.Th><Table.Th>Summary</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{bundle.gates.map((gate) => <Table.Tr key={gate.name}><Table.Td fw={700}>{gate.name}</Table.Td><Table.Td><StatusBadge status={gate.status} /></Table.Td><Table.Td>{gate.score ?? '—'}</Table.Td><Table.Td>{gate.totalTrials ? `${gate.validTrials}/${gate.totalTrials}` : '—'}</Table.Td><Table.Td>{gate.summary}</Table.Td></Table.Tr>)}</Table.Tbody></Table></div>
        </section>
        <section className="summary-section">
          <Title order={3}>Ordered fix list</Title>
          {!bundle.fixItems.length ? <Text c="dimmed">No fixes are required.</Text> : <ol className="summary-fixes">{bundle.fixItems.map((item, index) => <li key={item.id}><span className={item.resolved ? 'summary-check done' : 'summary-check'}>{item.resolved ? '✓' : '○'}</span><CategoryBadge category={item.category} /><div><Text fw={750}>{index + 1}. {item.title}</Text><Text size="sm">{item.remediation}</Text></div></li>)}</ol>}
        </section>
        <section className="summary-section">
          <Title order={3}>Reviewer notes checklist</Title>
          <div className="summary-steps">{bundle.reviewerSteps.map((step, index) => <div key={step.name} className={step.done ? 'summary-step done' : 'summary-step'}><span>{step.done ? '✓' : index + 1}</span><div><Text fw={750}>{step.name} · {step.done ? 'Done' : 'Not done'}</Text><Text size="sm" c={step.notes ? undefined : 'dimmed'}>{step.notes || 'No reviewer note.'}</Text></div></div>)}</div>
        </section>
      </Paper>
    </section>
  );
}
