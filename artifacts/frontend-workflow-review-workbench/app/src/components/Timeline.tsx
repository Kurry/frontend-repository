import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Badge, Button, Group, Paper, Select, Text, Title } from '@mantine/core';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { IconActivity, IconClock, IconFilterOff } from '@tabler/icons-react';
import { useReviewStore } from '../store';
import { GATE_STATUSES, type GateStatus, type ReviewBundle } from '../types';
import { StatusBadge } from './Common';

const timelineFilterSchema = z.object({ kind: z.string().nullable() });

export default function Timeline({ bundle }: { bundle: ReviewBundle }) {
  const activeKind = useReviewStore((state) => state.ui.timelineKind);
  const setTimelineKind = useReviewStore((state) => state.setTimelineKind);
  const setWorkspacePanel = useReviewStore((state) => state.setWorkspacePanel);
  const selectGate = useReviewStore((state) => state.selectGate);
  const kinds = ['evidence', 're-run', 're-run-step', 'gate-status', 'fix-item', 'recommendation', 'reviewer-step', 'bundling'];
  const events = activeKind ? bundle.timeline.filter((item) => item.kind === activeKind) : bundle.timeline;
  const { control, reset, setValue } = useForm<{ kind: string | null }>({ resolver: zodResolver(timelineFilterSchema), defaultValues: { kind: activeKind } });
  useEffect(() => { reset({ kind: activeKind }); }, [activeKind, reset]);
  const clearKind = () => { setValue('kind', null); setTimelineKind(null); };
  const jumpToEvent = (kind: string, label: string) => {
    if (kind === 'gate-status' || kind === 're-run' || kind === 're-run-step') {
      const gate = bundle.gates.find((item) => label.includes(item.name));
      if (gate) { selectGate(gate.name); setWorkspacePanel('Gate'); return; }
    }
    if (kind === 'fix-item') { setWorkspacePanel('Resolve'); return; }
    if (kind === 'recommendation') { setWorkspacePanel('Verdict'); return; }
    if (kind === 'bundling' || kind === 'reviewer-step') { setWorkspacePanel('Bundle'); }
  };
  return (
    <section aria-labelledby="timeline-title">
      <div className="section-heading">
        <div><Text className="eyebrow">Ordered session log</Text><Title id="timeline-title" order={2}>Event Timeline</Title><Text size="sm" c="dimmed">Newest events appear first without reloading. Jump controls scrub to the related workspace surface.</Text></div>
        <Group gap="xs">
          <Controller name="kind" control={control} render={({ field }) => <Select {...field} value={field.value} label="Event kind" placeholder="All event kinds" clearable data={kinds.map((kind) => ({ value: kind, label: kind }))} onChange={(value) => { field.onChange(value); setTimelineKind(value || null); }} w={220} />} />
          {activeKind && <Button mt={24} variant="default" leftSection={<IconFilterOff size={14} />} onClick={clearKind}>Clear event filter</Button>}
        </Group>
      </div>
      {!events.length ? <Paper className="empty-state compact-empty"><IconActivity size={34} /><Title order={3}>No events for this kind</Title><Text>Run a gate, resolve a fix, save a recommendation, or clear the event-kind filter to populate this timeline.</Text><Button mt="md" variant="light" onClick={clearKind}>Clear event filter</Button></Paper> : <ol className="timeline-list">{events.map((item) => { const status = item.kind === 'gate-status' ? GATE_STATUSES.find((value) => item.label.endsWith(value)) : undefined; return <Paper component="li" key={item.id} className="timeline-item"><div className="timeline-node"><IconClock size={15} /></div><div><Group gap="xs" wrap="wrap"><Badge variant="light" className={`event-kind event-${item.kind}`}>{item.kind}</Badge>{status && <span className="timeline-status"><StatusBadge status={status as GateStatus} /></span>}<Button size="compact-xs" variant="subtle" onClick={() => jumpToEvent(item.kind, item.label)} aria-label={`Jump to workspace for ${item.label}`}>Jump</Button></Group><Text fw={700} mt={5}>{item.label}</Text><Text size="xs" c="dimmed">{new Date(item.timestamp).toLocaleString()}</Text></div></Paper>; })}</ol>}
    </section>
  );
}
