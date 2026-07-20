import { useState } from 'react';
import { Button, Checkbox, Collapse, Group, Paper, Text, Title, Tooltip } from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconExternalLink, IconListCheck } from '@tabler/icons-react';
import { useReviewStore } from '../store';
import type { ReviewBundle } from '../types';
import { CategoryBadge } from './Common';

export default function FixList({ bundle }: { bundle: ReviewBundle }) {
  const [expanded, setExpanded] = useState<string[]>([]);
  const toggleFix = useReviewStore((state) => state.toggleFix);
  const selectGate = useReviewStore((state) => state.selectGate);
  if (!bundle.fixItems.length) {
    return (
      <section aria-labelledby="fix-list-title">
        <div className="section-heading"><div><Text className="eyebrow">Ordered remediation</Text><Title id="fix-list-title" order={2}>Fix List</Title></div></div>
        <Paper className="empty-state compact-empty"><IconListCheck size={34} /><Title order={3}>No fixes are required</Title><Text>All current evidence is certification-ready; new gate evidence would populate this region if remediation became necessary.</Text></Paper>
      </section>
    );
  }
  return (
    <section aria-labelledby="fix-list-title">
      <div className="section-heading"><div><Text className="eyebrow">Ordered remediation</Text><Title id="fix-list-title" order={2}>Fix List</Title><Text size="sm" c="dimmed">Resolve items in stable severity order; recommendation constraints update immediately.</Text></div><Text size="sm" fw={700}>{bundle.fixItems.filter((item) => item.resolved).length}/{bundle.fixItems.length} resolved</Text></div>
      <ol className="fix-list">
        {bundle.fixItems.map((item, index) => {
          const open = expanded.includes(item.id);
          return (
            <Paper component="li" key={item.id} className={`fix-item${item.resolved ? ' resolved' : ''}`} style={{ transition: 'opacity 0.25s ease, background 0.25s ease, transform 0.18s ease' }}>
              <div className="fix-position">{index + 1}</div>
              <Checkbox checked={item.resolved} onChange={(event) => toggleFix(bundle.slug, item.id, event.currentTarget.checked)} aria-label={`${item.resolved ? 'Unresolve' : 'Resolve'} ${item.title}`} />
              <div className="fix-content">
                <Group gap="xs" wrap="nowrap"><CategoryBadge category={item.category} /><Tooltip label={item.title} disabled={item.title.length <= 80}><Text className="fix-title" fw={750}>{item.title}</Text></Tooltip></Group>
                <Text className="fix-detail" size="sm">{item.detail}</Text>
                <Text size="sm"><strong>Remediation:</strong> {item.remediation}</Text>
                <Group mt="xs" gap="xs">
                  <Button size="compact-sm" variant="subtle" leftSection={<IconExternalLink size={14} />} onClick={() => selectGate(item.evidence.gateName, item.evidence.kind === 'trial')}>Open backing evidence</Button>
                  <Button size="compact-sm" variant="default" rightSection={open ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />} onClick={() => setExpanded((items) => items.includes(item.id) ? items.filter((id) => id !== item.id) : [...items, item.id])}>{open ? 'Hide full detail' : 'Expand detail'}</Button>
                </Group>
                <Collapse expanded={open}><div className="fix-expanded"><Text size="xs" fw={800}>FULL ITEM TITLE</Text><Text size="sm">{item.title}</Text><Text size="xs" fw={800} mt="xs">EVIDENCE CONTEXT</Text><Text size="sm">This remediation traces to {item.evidence.gateName}; gate evidence remains read-only and must be refreshed through a re-run.</Text></div></Collapse>
              </div>
            </Paper>
          );
        })}
      </ol>
    </section>
  );
}
