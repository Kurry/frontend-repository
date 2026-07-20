import { zodResolver } from '@hookform/resolvers/zod';
import { Badge, Paper, Select, Text, Title } from '@mantine/core';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { IconActivity, IconClock } from '@tabler/icons-react';
import { useReviewStore } from '../store';
import { GATE_STATUSES, type GateStatus, type ReviewBundle } from '../types';
import { StatusBadge } from './Common';

const timelineFilterSchema = z.object({ kind: z.string().nullable() });

export default function Timeline({ bundle }: { bundle: ReviewBundle }) {
  const activeKind = useReviewStore((state) => state.ui.timelineKind);
  const setTimelineKind = useReviewStore((state) => state.setTimelineKind);
  const kinds = ['evidence', 're-run', 're-run-step', 'gate-status', 'fix-item', 'recommendation', 'reviewer-step', 'bundling'];
  const events = activeKind ? bundle.timeline.filter((item) => item.kind === activeKind) : bundle.timeline;
  const { control } = useForm<{ kind: string | null }>({ resolver: zodResolver(timelineFilterSchema), defaultValues: { kind: activeKind } });
  return (
    <section aria-labelledby="timeline-title">
      <div className="section-heading"><div><Text className="eyebrow">Ordered session log</Text><Title id="timeline-title" order={2}>Event Timeline</Title><Text size="sm" c="dimmed">Newest events appear first without reloading.</Text></div><Controller name="kind" control={control} render={({ field }) => <Select {...field} value={field.value} label="Event kind" placeholder="All event kinds" clearable data={kinds.map((kind) => ({ value: kind, label: kind }))} onChange={(value) => { field.onChange(value); setTimelineKind(value || null); }} w={220} />} /></div>
      {!events.length ? <Paper className="empty-state compact-empty"><IconActivity size={34} /><Title order={3}>No events for this kind</Title><Text>Run a gate, resolve a fix, save a recommendation, or clear the event-kind filter to populate this timeline.</Text></Paper> : <ol className="timeline-list">{events.map((item) => { const status = item.kind === 'gate-status' ? GATE_STATUSES.find((value) => item.label.endsWith(value)) : undefined; return <Paper component="li" key={item.id} className="timeline-item"><div className="timeline-node"><IconClock size={15} /></div><div><Badge variant="light" className={`event-kind event-${item.kind}`}>{item.kind}</Badge>{status && <span className="timeline-status"><StatusBadge status={status as GateStatus} /></span>}<Text fw={700} mt={5}>{item.label}</Text><Text size="xs" c="dimmed">{new Date(item.timestamp).toLocaleString()}</Text></div></Paper>; })}</ol>}
    </section>
  );
}
