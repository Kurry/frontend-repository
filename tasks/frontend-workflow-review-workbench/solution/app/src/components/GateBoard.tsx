import { useEffect, useState } from 'react';
import { Badge, Button, Collapse, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconExternalLink, IconPlayerPause, IconPlayerPlay, IconRefresh, IconRotateClockwise, IconRosetteDiscountCheck, IconX } from '@tabler/icons-react';
import { useReviewStore } from '../store';
import type { GateName, ReviewBundle } from '../types';
import { StatusBadge, ThresholdMeter } from './Common';

function RerunProgress({ bundle, gateName }: { bundle: ReviewBundle; gateName: GateName }) {
  const rerun = bundle.reruns[gateName];
  const pause = useReviewStore((state) => state.pauseRerun);
  const resume = useReviewStore((state) => state.resumeRerun);
  const retry = useReviewStore((state) => state.retryRerunStep);
  if (!rerun) return null;

          return (
    <div className="rerun-progress" aria-label={`${gateName} re-run ${rerun.status}`}>
      <Group justify="space-between" mb="sm">
        <div><Text fw={750} size="sm">Re-run sequence</Text><Text size="xs" c="dimmed">Run {rerun.runId.slice(-6)} · {rerun.status}</Text></div>
        {rerun.status === 'running' && <Button size="compact-sm" variant="default" leftSection={<IconPlayerPause size={14} />} onClick={() => pause(bundle.slug, gateName)}>Pause</Button>}
        {rerun.status === 'paused' && <Button size="compact-sm" leftSection={<IconPlayerPlay size={14} />} onClick={() => resume(bundle.slug, gateName)}>Resume</Button>}
      </Group>
      <ol className="rerun-steps">
        {rerun.steps.map((step, index) => (
          <li key={step.name} className={`rerun-step step-${step.status}`}>
            <span className="step-node">{step.status === 'complete' ? <IconRosetteDiscountCheck size={15} style={{ animation: 'panel-in 0.2s ease' }} /> : step.status === 'failed' ? <IconX size={15} style={{ animation: 'panel-in 0.2s ease' }} /> : step.status === 'running' ? <span className="activity-dot" /> : index + 1}</span>
            <div className="rerun-step-copy">
              <Group justify="space-between" gap="xs"><Text size="sm" fw={700}>{step.name}</Text><Badge variant="light"  style={{ transition: 'opacity 0.25s ease, background 0.25s ease' }}>{step.status}</Badge></Group>
              <Text size="xs" c="dimmed">Attempt {step.attempt || 0} of {step.maxAttempts}{step.timestamp ? ` · ${new Date(step.timestamp).toLocaleTimeString()}` : ''}</Text>
              {step.status === 'waiting' && <Text size="xs" className="backoff-copy">Waiting {step.backoff}s before retry {step.attempt + 1} of {step.maxAttempts}</Text>}
              {step.output && <Text size="xs" className="step-output">{step.output}</Text>}
              {step.error && <Text size="xs" c="red.7" role="alert">{step.error}</Text>}
              {step.status === 'failed' && <Button mt={5} size="compact-xs" variant="light" leftSection={<IconRotateClockwise size={13} />} onClick={() => retry(bundle.slug, gateName)}>Retry from this step</Button>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function GateBoard({ bundle }: { bundle: ReviewBundle }) {
  const [expanded, setExpanded] = useState<GateName[]>([]);
  const selectedGate = useReviewStore((state) => state.selection.gateName);
  const selectGate = useReviewStore((state) => state.selectGate);
  const startRerun = useReviewStore((state) => state.startRerun);
  const toggle = (name: GateName) => setExpanded((items) => items.includes(name) ? items.filter((item) => item !== name) : [...items, name]);
  useEffect(() => {
    if (!selectedGate) return;
    window.requestAnimationFrame(() => {
      const target = [...document.querySelectorAll<HTMLElement>('[data-gate]')].find((element) => element.dataset.gate === selectedGate);
      target?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
  }, [selectedGate]);

          return (
    <section aria-labelledby="gate-board-title">
      <div className="section-heading">
        <div><Text className="eyebrow">Read-only evidence</Text><Title id="gate-board-title" order={2}>Six-Gate Certification Board</Title></div><div className="threshold-key"><span>Difficulty bar <strong>0.80</strong></span><span>Oracle bar <strong>0.90</strong></span><span>Minimum <strong>3 valid trials</strong></span></div>

      </div>
      <div className="gate-grid">
        {bundle.gates.map((gate, index) => {
          const open = expanded.includes(gate.name);
          const rerun = bundle.reruns[gate.name];
          const isSelected = selectedGate === gate.name;


          if (gate.status === 'missing') {
            return (
              <Paper key={gate.name} component="article" className="gate-card" data-gate={gate.name} style={{ transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease' }}>
                <div className="gate-order">0{index + 1}</div>
                <Group justify="space-between" align="start" gap="sm">
                  <div className="gate-title"><Text size="xs" c="dimmed">GATE {index + 1}</Text><Title order={3}>{gate.name}</Title></div>
                  <StatusBadge status="missing" />
                </Group>
                <Text className="gate-summary" c="dimmed">No evidence available for {gate.name}.</Text>
                <div className="gate-rerun-control">
                  <Button fullWidth leftSection={<IconRefresh size={16} />} onClick={() => startRerun(bundle.slug, gate.name)}>Re-run gate</Button>
                </div>
                <RerunProgress bundle={bundle} gateName={gate.name} />
              </Paper>
            );
          }
          return (
            <Paper key={gate.name} component="article" tabIndex={0} aria-label={`Select ${gate.name} gate`} role="button" onClick={(event) => { if (!(event.target as HTMLElement).closest('button, input')) selectGate(gate.name, false); }} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); selectGate(gate.name, false); } }} className={`gate-card ${isSelected ? 'selected-record' : ''} ${rerun?.status === 'complete' ? 'gate-recently-published' : ''}`} data-gate={gate.name}>
              <div className="gate-order">0{index + 1}</div>
              <Group justify="space-between" align="start" gap="sm">
                <div className="gate-title"><Text size="xs" c="dimmed">GATE {index + 1}</Text><Title order={3}>{gate.name}</Title></div>
                <StatusBadge status={gate.status} />
              </Group>
              <Text className="gate-summary">{gate.summary}</Text>
              <div className="threshold-container"><ThresholdMeter gate={gate} /></div>
              <Group mt="sm" justify="space-between" gap="xs">
                <Button variant="subtle" size="compact-sm" leftSection={<IconExternalLink size={14} />} onClick={() => selectGate(gate.name, gate.name.startsWith('Difficulty'))}>
                  {gate.name.startsWith('Difficulty') ? 'Open trial evidence' : gate.name === 'Oracle' ? 'Open oracle transcript' : 'Highlight evidence'}
                </Button>
                <Button variant="default" size="compact-sm" rightSection={open ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />} onClick={() => toggle(gate.name)} aria-expanded={open}>Reasons</Button>
              </Group>
              <Collapse expanded={open}>
                <ul className="reasons-list">{gate.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
              </Collapse>
              {isSelected && gate.name === 'Oracle' && (
                <div id={gate.evidenceId} className="oracle-transcript selected-record-inner" tabIndex={-1}>
                  <Text size="xs" fw={800}>ORACLE TRANSCRIPT · HIGHLIGHTED RECORD</Text>
                  <Text size="sm">Focused assertions compare the primary outcome with the nearest fallback branch. Comprehensiveness is measured from covered task claims against all material claims in the task description.</Text>
                </div>
              )}
              <div className="gate-rerun-control">
                <Button fullWidth leftSection={<IconRefresh size={16} />} disabled={rerun?.status === 'running' || rerun?.status === 'paused'} onClick={() => startRerun(bundle.slug, gate.name)}>
                  {rerun?.status === 'running' ? 'Re-run in progress' : rerun?.status === 'paused' ? 'Re-run paused' : 'Re-run gate'}
                </Button>
              </div>
              <RerunProgress bundle={bundle} gateName={gate.name} />
            </Paper>
          );
        })}
      </div>
    </section>
  );
}
