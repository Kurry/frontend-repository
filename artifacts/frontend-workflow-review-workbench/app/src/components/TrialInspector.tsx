import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Badge, Button, Group, Modal, Paper, Select, Stack, Text, Title } from '@mantine/core';
import { Controller, useForm } from 'react-hook-form';
import { IconArrowsDiff, IconArrowBackUp, IconCheck, IconCircleX, IconFlask, IconLink } from '@tabler/icons-react';
import { isTrialValid } from '../domain';
import { diffFormSchema } from '../schemas';
import { useReviewStore } from '../store';
import { CHECK_NAMES, type CheckName, type ReviewBundle } from '../types';
import { OutcomeBadge } from './Common';

type DiffValues = { leftTrialId: string; rightTrialId: string };

function TrialDiff({ bundle }: { bundle: ReviewBundle }) {
  const diff = useReviewStore((state) => state.ui.diff);
  const gateName = useReviewStore((state) => state.selection.gateName);
  const setDiffTrials = useReviewStore((state) => state.setDiffTrials);
  const exitDiff = useReviewStore((state) => state.exitDiff);
  const model = gateName?.endsWith('Sable-4') ? 'Sable-4' : 'Quartz-Mini';
  const trials = bundle.trials.filter((trial) => trial.model === model);
  const defaultLeft = diff.leftTrialId ?? diff.previousTrialId ?? trials[0]?.id ?? '';
  const defaultRight = diff.rightTrialId ?? trials.find((trial) => trial.id !== defaultLeft)?.id ?? '';
  const { control, handleSubmit, formState: { errors } } = useForm<DiffValues>({ resolver: zodResolver(diffFormSchema), defaultValues: { leftTrialId: defaultLeft, rightTrialId: defaultRight } });
  const left = trials.find((trial) => trial.id === diff.leftTrialId);
  const right = trials.find((trial) => trial.id === diff.rightTrialId);
  const flips = left && right ? CHECK_NAMES.filter((name) => left.checks.find((check) => check.name === name)?.outcome !== right.checks.find((check) => check.name === name)?.outcome) : [];
  const picking = !left || !right;
  return (
    <section className="diff-mode" aria-labelledby="diff-title">
      <Group justify="space-between"><div><Text className="eyebrow">Same-gate comparison</Text><Title id="diff-title" order={2}>Trial Check Diff</Title></div><Button variant="default" leftSection={<IconArrowBackUp size={16} />} onClick={exitDiff}>Leave diff mode</Button></Group>
      <Modal
        opened={picking}
        onClose={exitDiff}
        title={<div><Text className="eyebrow">Diff picker</Text><Title order={3}>Pick two {model} trials</Title></div>}
        trapFocus
        returnFocus
        closeOnEscape
        withinPortal
        closeButtonProps={{ 'aria-label': 'Close diff picker' }}
        overlayProps={{ backgroundOpacity: 0.35, blur: 2 }}
      >
        <form className="diff-picker" onSubmit={handleSubmit((values) => { if (values.leftTrialId === values.rightTrialId) return; setDiffTrials(values.leftTrialId, values.rightTrialId); })}>
          <Group align="start" mt="sm">
            <Controller name="leftTrialId" control={control} render={({ field }) => <Select {...field} label="First trial" data={trials.map((trial) => ({ value: trial.id, label: `${trial.model} · trial ${trial.number} · ${isTrialValid(trial) ? 'valid' : 'invalid'}` }))} />} />
            <Controller name="rightTrialId" control={control} render={({ field }) => <Select {...field} label="Second trial" error={errors.rightTrialId?.message} data={trials.map((trial) => ({ value: trial.id, label: `${trial.model} · trial ${trial.number} · ${isTrialValid(trial) ? 'valid' : 'invalid'}` }))} />} />
            <Button type="submit" mt={25} leftSection={<IconArrowsDiff size={16} />}>Compare trials</Button>
          </Group>
          {diff.error && <Text c="red.7" size="sm" role="alert">{diff.error}</Text>}
        </form>
      </Modal>
      {!picking && (
        <Paper className="diff-table-wrap">
          <Group justify="space-between" mb="md"><Text fw={750}>{left.model} trial {left.number} ↔ trial {right.number}</Text><Badge className={flips.length ? 'flip-summary active' : 'flip-summary'}>{flips.length} flipped checks out of 8</Badge></Group>
          <div className="diff-grid diff-header"><span>Validity check</span><span>Trial {left.number}</span><span>Trial {right.number}</span><span>Change</span></div>
          {CHECK_NAMES.map((name) => {
            const a = left.checks.find((check) => check.name === name)!;
            const b = right.checks.find((check) => check.name === name)!;
            const flipped = a.outcome !== b.outcome;
            return <div className={`diff-grid diff-row ${flipped ? 'flipped' : ''}`} key={name}><Text size="sm" fw={700}>{name}</Text><OutcomeBadge outcome={a.outcome} /><OutcomeBadge outcome={b.outcome} /><span>{flipped ? <Badge className="flip-marker" leftSection={<IconArrowsDiff size={12} />}>Flip</Badge> : <Text size="xs" c="dimmed">Same</Text>}</span></div>;
          })}
        </Paper>
      )}
    </section>
  );
}

export default function TrialInspector({ bundle }: { bundle: ReviewBundle }) {
  const selection = useReviewStore((state) => state.selection);
  const diff = useReviewStore((state) => state.ui.diff);
  const selectTrial = useReviewStore((state) => state.selectTrial);
  const selectCriterion = useReviewStore((state) => state.selectCriterion);
  const enterDiff = useReviewStore((state) => state.enterDiff);
  const model = selection.gateName?.endsWith('Sable-4') ? 'Sable-4' : selection.gateName?.endsWith('Quartz-Mini') ? 'Quartz-Mini' : null;
  const trials = useMemo(() => bundle.trials.filter((trial) => trial.model === model), [bundle.trials, model]);
  const trial = bundle.trials.find((item) => item.id === selection.trialId);

  useEffect(() => {
    if (model && !trial && trials[0]) selectTrial(trials[0].id);
  }, [model, trial, trials, selectTrial]);

  if (!model) {
    return <Paper className="empty-state"><IconFlask size={36} /><Title order={3}>Choose a difficulty gate</Title><Text>The trial inspector is populated by evidence from Difficulty — Sable-4 or Difficulty — Quartz-Mini.</Text></Paper>;
  }
  if (diff.enabled) return <TrialDiff bundle={bundle} />;
  if (!trial) return null;
  const selectedCriterion = selection.criterionId;
  return (
    <section className="inspector-shell" aria-labelledby="inspector-title">
      <div className="section-heading">
        <div><Text className="eyebrow">Linked read-only evidence</Text><Title id="inspector-title" order={2}>{model} Trial Inspector</Title><Text size="sm" c="dimmed">Select a criterion or its reasoning to move all three panes together.</Text></div>
        <Button leftSection={<IconArrowsDiff size={16} />} onClick={enterDiff}>Compare trials</Button>
      </div>
      <div className="trial-strip" role="listbox" aria-label={`${model} trials`}>
        {trials.map((item) => <button type="button" role="option" aria-label={`Select trial ${item.number}`} aria-selected={item.id === trial.id} key={item.id} className={`trial-entry ${item.id === trial.id ? 'selected' : ''}`} onClick={() => selectTrial(item.id)} style={{ transition: 'background-color 0.18s ease' }}><span><strong>{item.model}</strong> · trial {item.number}</span><Badge className={isTrialValid(item) ? 'valid-badge' : 'invalid-badge'} leftSection={isTrialValid(item) ? <IconCheck size={12} /> : <IconCircleX size={12} />}>{isTrialValid(item) ? 'valid' : 'invalid'}</Badge></button>)}
      </div>
      <div className="inspector-grid inspector-three-column">
        <Paper className="inspector-pane criteria-pane" component="section" aria-label="Rubric criteria">
          <div className="pane-heading"><Text fw={800}>Rubric criteria</Text><Badge variant="outline">{bundle.criteria.length}</Badge></div>
          <Stack gap="xs">{bundle.criteria.map((criterion) => {
            const id = criterion.id.split('-').at(-1);
            return <button type="button" aria-label={`Select criterion ${id}`} key={criterion.id} className={`criterion-item ${selectedCriterion === criterion.id ? 'selected' : ''}`} onClick={() => selectCriterion(criterion.id)} style={{ transition: 'background-color 0.18s ease' }}><Group justify="space-between" align="start" wrap="nowrap"><span className="criterion-id">{id}</span><Text ta="left" size="sm" fw={700}>{criterion.name}</Text><Text size="xs" fw={750}>{Math.round(criterion.weight * 100)}%</Text></Group>{criterion.negated && <Badge className="negated-badge">Negated · inverted scoring</Badge>}</button>;
          })}</Stack>
        </Paper>
        <Paper className="inspector-pane reasoning-pane" component="section" aria-label="Scorer reasoning and validity checks">
          <div className="pane-heading"><Text fw={800}>Scorer reasoning</Text><Badge variant="outline">{trial.model}</Badge></div>
          <div className="reasoning-list">{trial.reasoning.map((reason) => {
            const criterion = bundle.criteria.find((item) => item.id === reason.criterionId)!;
            return <button type="button" aria-label={`Select reasoning for criterion ${criterion.id.split('-').at(-1)}`} key={reason.criterionId} className={`reasoning-block ${selectedCriterion === reason.criterionId ? 'selected' : ''}`} onClick={() => selectCriterion(reason.criterionId)} style={{ transition: 'background-color 0.18s ease' }}><Group justify="space-between"><Text size="xs" fw={800}>{criterion.id.split('-').at(-1)} · {criterion.name}</Text><OutcomeBadge outcome={reason.outcome} /></Group><Text ta="left" size="sm" mt={5}>{reason.text}</Text><Text size="xs" className="citation-line" mt={6}><IconLink size={12} /> {reason.citedPassageIds.length} cited answer passage</Text></button>;
          })}</div>
          <div className="validity-section"><Group justify="space-between"><Text fw={800}>Eight validity checks</Text><Badge className={isTrialValid(trial) ? 'valid-badge' : 'invalid-badge'}>{isTrialValid(trial) ? 'valid' : 'invalid'}</Badge></Group><Text size="xs" c="dimmed" mb="sm">Valid exactly when answer-determinacy, refusals, and low-timeout all pass.</Text>{trial.checks.map((check) => <div className="validity-row" key={check.name}><div><Text size="sm" fw={700}>{check.name}</Text><Text size="xs" c="dimmed">{check.detail}</Text></div><OutcomeBadge outcome={check.outcome} /></div>)}</div>
        </Paper>
        <Paper className="inspector-pane answer-pane" component="section" aria-label="Agent answer">
          <div className="pane-heading"><Text fw={800}>Agent answer</Text><Badge variant="outline">Trial {trial.number}</Badge></div>
          <Text size="xs" c="dimmed" mb="md">Cited passages are shaded; the active criterion uses the stronger highlight.</Text>
          <div className="answer-document">{trial.answerPassages.map((passage) => <p key={passage.id} className={`answer-passage cited-passage ${selectedCriterion && passage.criterionIds.includes(selectedCriterion) ? 'active-passage' : ''}`} style={{ transition: 'background-color 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s ease' }}>{passage.text}</p>)}</div>
        </Paper>
      </div>
    </section>
  );
}
