import { Badge, Button, Group, Progress, Text, Tooltip } from '@mantine/core';
import { IconAlertTriangleFilled, IconCheck, IconCircleXFilled, IconClock, IconHelpCircle, IconMinus } from '@tabler/icons-react';
import type { CheckOutcome, FixCategory, GateResult, GateStatus, HeroState } from '../types';

export function HeroBanner({ state, compact = false }: { state: HeroState; compact?: boolean }) {
  return (
    <div className={`hero-banner hero-${state.startsWith('READY') ? 'ready' : state.startsWith('NOT') ? 'fixable' : 'risk'} ${compact ? 'hero-compact' : ''}`} data-hero-state={state}>
      {state.startsWith('READY') ? <IconCheck size={compact ? 15 : 18} /> : <IconAlertTriangleFilled size={compact ? 15 : 18} />}
      <span>{state}</span>
    </div>
  );
}

const statusIcons = {
  pass: <IconCheck size={13} />,
  fail: <IconCircleXFilled size={13} />,
  errored: <IconAlertTriangleFilled size={13} />,
  inconclusive: <IconHelpCircle size={13} />,
  missing: <IconMinus size={13} />,
};

export function StatusBadge({ status, label }: { status: GateStatus; label?: string }) {
  return <Badge className={`status-chip status-${status}`} leftSection={statusIcons[status]} variant="light">{label ?? status}</Badge>;
}

export function OutcomeBadge({ outcome }: { outcome: CheckOutcome }) {
  return (
    <Badge className={`outcome-chip outcome-${outcome}`} leftSection={outcome === 'pass' ? <IconCheck size={12} /> : outcome === 'fail' ? <IconCircleXFilled size={12} /> : <IconMinus size={12} />} variant="light">
      {outcome}
    </Badge>
  );
}

export function CategoryBadge({ category }: { category: FixCategory }) {
  return <Badge className={`category-chip category-${category.toLowerCase().replaceAll('-', '')}`} variant="light">{category}</Badge>;
}

export function ReviewProgress({ count }: { count: number }) {
  return (
    <div className="review-progress" aria-label={`${count} of 5 reviewer steps complete`}>
      <Group justify="space-between" gap="xs"><Text size="xs" fw={650}>{count}/5 complete</Text><IconClock size={13} /></Group>
      <Progress value={(count / 5) * 100} size="xs" radius="xl" mt={5} />
    </div>
  );
}

export function ThresholdMeter({ gate }: { gate: GateResult }) {
  if (gate.name === 'Oracle') {
    const value = gate.score ?? 0;
    return (
      <div className="threshold" aria-label={`Oracle comprehensiveness ${value.toFixed(2)} against 0.90 bar`}>
        <Group justify="space-between"><Text size="xs" fw={700}>Comprehensiveness {value.toFixed(2)}</Text><Text size="xs">bar 0.90</Text></Group>
        <div className="threshold-track"><span className="threshold-marker marker-90" /><span className={`threshold-fill ${value >= 0.9 ? 'met' : 'missed'}`} style={{ width: `${Math.min(value * 100, 100)}%` }} /></div>
        <Text size="xs" c={value >= 0.9 ? 'teal.8' : 'red.7'}>{value >= 0.9 ? 'Above the required bar' : 'Below the required bar'}</Text>
      </div>
    );
  }
  if (gate.name.startsWith('Difficulty')) {
    const value = gate.score ?? 0;
    return (
      <div className="threshold" aria-label={`Difficulty score ${value.toFixed(2)} against 0.80 bar with ${gate.validTrials} valid trials`}>
        <Group justify="space-between"><Text size="xs" fw={700}>Score {value.toFixed(2)}</Text><Text size="xs">bar 0.80 · min 3 valid trials</Text></Group>
        <div className="threshold-track"><span className="threshold-marker marker-80" /><span className={`threshold-fill ${value >= 0.8 && gate.validTrials >= 3 ? 'met' : 'missed'}`} style={{ width: `${Math.min(value * 100, 100)}%` }} /></div>
        <Text size="xs" c={value >= 0.8 && gate.validTrials >= 3 ? 'teal.8' : 'orange.8'}>{gate.validTrials}/{gate.totalTrials} valid · {value >= 0.8 ? 'score met' : 'score missed'} · {gate.validTrials >= 3 ? 'evidence sufficient' : 'evidence insufficient'}</Text>
      </div>
    );
  }
  return null;
}

export function FlagBadge({ flag }: { flag: string }) {
  return (
    <Tooltip label={flag} withArrow>
      <Badge className="flag-badge" leftSection={<IconAlertTriangleFilled size={13} />} tabIndex={0} aria-label={`Stop early: ${flag}`}>Stop early</Badge>
    </Tooltip>
  );
}

export function EvidenceButton({ onClick, label = 'View evidence' }: { onClick: () => void; label?: string }) {
  return <Button variant="subtle" size="compact-sm" onClick={onClick}>{label}</Button>;
}
