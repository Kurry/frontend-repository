import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Badge, Button, Checkbox, Group, Paper, Text, Textarea, Title } from '@mantine/core';
import { Controller, useForm } from 'react-hook-form';
import { IconArrowLeft, IconCheck, IconChevronRight, IconClock, IconLock, IconNotes, IconPackage, IconRoute, IconShieldCheck } from '@tabler/icons-react';
import { deriveHero, completionCount } from '../domain';
import { notesFormSchema } from '../schemas';
import { useReviewStore } from '../store';
import { REVIEWER_STEPS, type ReviewerStepName, type ReviewBundle, type WorkspacePanel } from '../types';
import { FlagBadge, HeroBanner } from './Common';
import { DependencyMinimap, ReviewDuration } from './InnovationExtras';
import FixList from './FixList';
import GateBoard from './GateBoard';
import ReviewSummary from './ReviewSummary';
import Timeline from './Timeline';
import TrialInspector from './TrialInspector';
import VerdictPanel from './VerdictPanel';

function Breadcrumb({ bundle }: { bundle: ReviewBundle }) {
  const selection = useReviewStore((state) => state.selection);
  const navigate = useReviewStore((state) => state.breadcrumbNavigate);
  const trial = bundle.trials.find((item) => item.id === selection.trialId);
  const criterion = bundle.criteria.find((item) => item.id === selection.criterionId);
  const segments = [
    { label: 'Portfolio', action: () => navigate('portfolio') },
    { label: bundle.slug, action: () => navigate('bundle') },
    ...(selection.gateName ? [{ label: selection.gateName, action: () => navigate('gate') }] : []),
    ...(trial ? [{ label: `Trial ${trial.number}`, action: () => navigate('trial') }] : []),
    ...(criterion ? [{ label: criterion.id.split('-').at(-1)!, action: () => {} }] : []),
  ];
  return (
    <nav className="breadcrumb" aria-label="Review selection breadcrumb">
      {segments.map((segment, index) => (
        <span key={`${segment.label}-${index}`}>
          <a
            href={`#${segment.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
            className="breadcrumb-link"
            onClick={(event) => { event.preventDefault(); segment.action(); }}
            aria-current={index === segments.length - 1 ? 'page' : undefined}
          >
            {segment.label}
          </a>
          {index < segments.length - 1 && <IconChevronRight size={13} aria-hidden="true" />}
        </span>
      ))}
    </nav>
  );
}

function StepControls({ bundle, stepName, locked }: { bundle: ReviewBundle; stepName: ReviewerStepName; locked: boolean }) {
  const step = bundle.reviewerSteps.find((item) => item.name === stepName)!;
  const setNotes = useReviewStore((state) => state.setStepNotes);
  const setDone = useReviewStore((state) => state.setStepDone);
  const { control, reset, formState: { errors } } = useForm<{ notes: string }>({ resolver: zodResolver(notesFormSchema), defaultValues: { notes: step.notes }, mode: 'onChange' });
  useEffect(() => reset({ notes: step.notes }), [step.notes, reset]);
  if (stepName === 'Bundle') return (
    <Paper className="step-controls">
      <div><Text fw={800}>Bundle reviewer checkpoint</Text><Text size="xs" c="dimmed">This done state is controlled by Complete bundling after Verdict is complete and a recommendation is recorded.</Text></div>
      <Checkbox checked={step.done} disabled label="Mark Bundle done" description={locked ? 'Bundle is locked until every earlier reviewer step is done.' : step.done ? 'The certification bundle has been completed.' : 'Use Complete bundling in the review summary.'} />
    </Paper>
  );
  return (
    <Paper className="step-controls" component="form">
      <div><Text fw={800}>{stepName} reviewer checkpoint</Text><Text size="xs" c="dimmed">Notes persist for this in-memory review session and appear in the summary and export.</Text></div>
      <Controller name="notes" control={control} render={({ field }) => <Textarea {...field} disabled={locked} label={`${stepName} step notes`} placeholder={`Record ${stepName.toLowerCase()} observations…`} minRows={2} error={errors.notes?.message} onBlur={(event) => { field.onBlur(); setNotes(bundle.slug, stepName, event.currentTarget.value); }} />} />
      <Checkbox checked={step.done} disabled={locked} onChange={(event) => setDone(bundle.slug, stepName, event.currentTarget.checked)} label={`Mark ${stepName} done`} description={step.done ? 'Unmarking re-locks every later step while preserving notes.' : 'Completing this checkpoint unlocks the next reviewer step.'} />
    </Paper>
  );
}

function LockedStep({ stepName, blockedBy }: { stepName: ReviewerStepName; blockedBy: ReviewerStepName }) {
  return <Paper className="locked-step panel-enter"><div className="lock-icon"><IconLock size={25} /></div><Title order={2}>{stepName} is locked</Title><Text>Finish the {blockedBy} step first. Notes and completion controls for {stepName} remain unavailable until every earlier step is done.</Text></Paper>;
}

export default function Workspace() {
  const slug = useReviewStore((state) => state.selection.bundleSlug);
  const bundle = useReviewStore((state) => state.bundles.find((item) => item.slug === slug));
  const panel = useReviewStore((state) => state.ui.workspacePanel);
  const setPanel = useReviewStore((state) => state.setWorkspacePanel);
  const openPortfolio = useReviewStore((state) => state.openPortfolio);
  if (!bundle) return null;
  const activeStep = REVIEWER_STEPS.includes(panel as ReviewerStepName) ? panel as ReviewerStepName : null;
  const activeIndex = activeStep ? REVIEWER_STEPS.indexOf(activeStep) : -1;
  const firstIncompleteBefore = activeIndex > 0 ? bundle.reviewerSteps.slice(0, activeIndex).find((step) => !step.done)?.name : undefined;
  const locked = !!firstIncompleteBefore;

  const renderPanel = () => {
    if (panel === 'Timeline') return <Timeline bundle={bundle} />;
    // Gate board and trial inspector stay reachable for evidence / re-run; step completion controls remain locked below.
    if (activeStep && locked && panel !== 'Audit' && panel !== 'Gate') return <LockedStep stepName={activeStep} blockedBy={firstIncompleteBefore!} />;
    if (panel === 'Resolve') return <FixList bundle={bundle} />;
    if (panel === 'Gate') return <GateBoard bundle={bundle} />;
    if (panel === 'Audit') return <TrialInspector bundle={bundle} />;
    if (panel === 'Verdict') return <VerdictPanel bundle={bundle} />;
    if (panel === 'Bundle') return <ReviewSummary bundle={bundle} />;
    return null;
  };

  return (
    <main className="workspace-shell" id="bundle-workspace">
      <header className="workspace-header">
        <div className="workspace-title-line">
          <Button variant="subtle" size="compact-sm" leftSection={<IconArrowLeft size={15} />} onClick={openPortfolio}>Portfolio</Button>
          <div><Text className="eyebrow">TASK BUNDLE</Text><Title order={1}>{bundle.slug}</Title><Text size="sm" c="dimmed">{bundle.description}</Text></div>
          <div className="workspace-status"><HeroBanner state={deriveHero(bundle)} />{bundle.recommendation ? <Badge size="lg" leftSection={<IconShieldCheck size={15} />}>{bundle.recommendation}</Badge> : <Badge variant="outline" size="lg">Recommendation unset</Badge>}{bundle.overrideJustification && <Badge size="lg" color="orange">Override</Badge>}</div>
        </div>
        <Group mt="md" gap="xs">{bundle.stopEarlyFlags.map((flag) => <FlagBadge key={flag} flag={flag} />)}<Badge variant="outline">{completionCount(bundle)} of 5 reviewer steps complete</Badge>{bundle.reviewerSteps.at(-1)?.done && <Badge className="bundled-badge" leftSection={<IconPackage size={13} />}>Bundled</Badge>}<ReviewDuration bundle={bundle} /></Group>
        <Breadcrumb bundle={bundle} />
        <DependencyMinimap bundle={bundle} />
      </header>
      <div className="workspace-layout">
        <aside className="step-rail" aria-label="Reviewer steps">
          <div className="step-rail-heading"><IconRoute size={19} /><Text fw={800}>Reviewer flow</Text></div>
          <div className="step-buttons">
            {bundle.reviewerSteps.map((step, index) => {
              const stepLocked = bundle.reviewerSteps.slice(0, index).some((item) => !item.done);
              const isActive = panel === step.name;
              return <button type="button" key={step.name} style={{ transition: 'transform 0.18s ease' }} className={`step-button ${step.done ? 'done' : ''} ${stepLocked ? 'locked' : ''} ${isActive ? 'active' : ''}`} onClick={() => setPanel(step.name)} aria-current={isActive ? 'step' : undefined}><span className="step-index">{step.done ? <IconCheck size={15} /> : stepLocked ? <IconLock size={13} /> : index + 1}</span><span><strong>{step.name}</strong><small>{step.done ? 'Done' : stepLocked ? 'Locked' : 'Available'}</small></span></button>;
            })}
          </div>
          <button type="button" className={`step-button timeline-button ${panel === 'Timeline' ? 'active' : ''}`} onClick={() => setPanel('Timeline')}><span className="step-index"><IconClock size={15} /></span><span><strong>Timeline</strong><small>{bundle.timeline.length} events</small></span></button>
          <Paper className="rail-note"><IconNotes size={17} /><Text size="xs">Session state resets on page reload. Export the package to preserve a certification.</Text></Paper>
        </aside>
        <section className="workspace-main">
          <div className="panel-enter" key={panel}>{renderPanel()}</div>
          {activeStep && <StepControls bundle={bundle} stepName={activeStep} locked={locked} />}
        </section>
      </div>
    </main>
  );
}
