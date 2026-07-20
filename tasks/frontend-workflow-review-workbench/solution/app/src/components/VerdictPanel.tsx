import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Badge, Button, Group, Paper, Radio, Stack, Switch, Text, Textarea, Title } from '@mantine/core';
import { Controller, useForm } from 'react-hook-form';
import { IconAlertCircle, IconCheck, IconLockOpen, IconShieldCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { deriveConstraint } from '../domain';
import { recommendationFormSchema, recommendationRequestSchema } from '../schemas';
import { useReviewStore } from '../store';
import { RECOMMENDATIONS, type Recommendation, type ReviewBundle } from '../types';

type VerdictValues = { recommendation: Recommendation | null; overrideEnabled: boolean; overrideJustification: string };

export default function VerdictPanel({ bundle }: { bundle: ReviewBundle }) {
  const saveRecommendation = useReviewStore((state) => state.saveRecommendation);
  const setOverrideEnabled = useReviewStore((state) => state.setOverrideEnabled);
  const constraint = deriveConstraint(bundle);
  const { control, handleSubmit, reset, watch, setError, clearErrors, formState: { errors, isSubmitting } } = useForm<VerdictValues>({
    resolver: zodResolver(recommendationFormSchema),
    defaultValues: { recommendation: bundle.recommendation, overrideEnabled: bundle.overrideEnabled, overrideJustification: bundle.overrideJustification ?? '' },
    mode: 'onChange',
  });
  useEffect(() => reset({ recommendation: bundle.recommendation, overrideEnabled: bundle.overrideEnabled, overrideJustification: bundle.overrideJustification ?? '' }), [bundle.recommendation, bundle.overrideEnabled, bundle.overrideJustification, reset]);
  const recommendation = watch('recommendation');
  const overrideEnabled = watch('overrideEnabled');
  const justification = watch('overrideJustification');
  const outside = !!recommendation && !constraint.allowed.includes(recommendation);
  const justificationInvalid = outside && (justification.trim().length < 20 || justification.trim().length > 2000);
  const canSave = !!recommendation && (!outside || (overrideEnabled && !justificationInvalid));

  const submit = (values: VerdictValues) => {
    if (!values.recommendation) {
      setError('recommendation', { message: 'recommendation is required.' });
      return;
    }
    const outOfSet = !constraint.allowed.includes(values.recommendation);
    const body = { recommendation: values.recommendation, overrideJustification: outOfSet ? values.overrideJustification : null };
    const parsed = recommendationRequestSchema.safeParse(body);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) setError(issue.path[0] as keyof VerdictValues, { message: issue.message });
      return;
    }
    const result = saveRecommendation(bundle.slug, parsed.data.recommendation, parsed.data.overrideJustification, values.overrideEnabled);
    if (!result.ok) {
      if (result.error?.startsWith('overrideJustification')) setError('overrideJustification', { message: result.error });
      else setError('recommendation', { message: result.error });
      return;
    }
    notifications.show({ title: 'Recommendation recorded', message: parsed.data.recommendation, color: 'teal', icon: <IconCheck size={16} /> });
  };

  return (
    <section aria-labelledby="verdict-title">
      <div className="section-heading"><div><Text className="eyebrow">Ordered constraint rules</Text><Title id="verdict-title" order={2}>Constrained Verdict</Title><Text size="sm" c="dimmed">Choose from the live allowed set or document an explicit override.</Text></div><Group>{bundle.recommendation && <Badge size="lg" variant="light" leftSection={<IconShieldCheck size={15} />}>Current: {bundle.recommendation}</Badge>}{bundle.overrideJustification && <Badge size="lg" color="orange">Override</Badge>}</Group></div>
      <div className="verdict-grid">
        <Paper component="form" className="verdict-form" onSubmit={handleSubmit(submit)} style={{ transition: 'opacity 0.2s ease, transform 0.2s ease' }}>
          <Controller name="recommendation" control={control} render={({ field }) => (
            <Radio.Group value={field.value ?? ''} onChange={(value) => { clearErrors('recommendation'); field.onChange(value as Recommendation); }} label="Recommendation" description="Disabled choices require Override constraint." error={errors.recommendation?.message} required>
              <Stack mt="sm" gap="sm">
                {RECOMMENDATIONS.map((value) => {
                  const allowed = constraint.allowed.includes(value);
                  const disabled = !allowed && !overrideEnabled;
                  return <label key={value}  style={{ transition: 'opacity 0.2s ease, background 0.2s ease, border-color 0.2s ease, transform 0.16s ease' }}><Radio value={value} disabled={disabled} /><span><Text fw={800}>{value}</Text><Text size="xs" c="dimmed">{allowed ? 'Allowed by the current highest-priority rule.' : overrideEnabled ? 'Outside the allowed set; justification required.' : 'Locked by the current constraint.'}</Text></span>{allowed ? <Badge color="teal" variant="light">Allowed</Badge> : <Badge color="gray" variant="outline">Override only</Badge>}</label>;
                })}
              </Stack>
            </Radio.Group>
          )} />
          <Controller name="overrideEnabled" control={control} render={({ field }) => (
            <Switch mt="lg" checked={field.value} onChange={(event) => { const enabled = event.currentTarget.checked; field.onChange(enabled); setOverrideEnabled(bundle.slug, enabled); if (!enabled && recommendation && !constraint.allowed.includes(recommendation)) { reset({ recommendation: null, overrideEnabled: false, overrideJustification: '' }); clearErrors('recommendation'); clearErrors('overrideJustification'); saveRecommendation(bundle.slug, null, null, false); } }} label="Override constraint" description="Unlock out-of-set recommendations and require a written justification." thumbIcon={field.value ? <IconLockOpen size={12} /> : undefined} />
          )} />
          {overrideEnabled && outside && (
            <Controller name="overrideJustification" control={control} render={({ field }) => (
              <Textarea {...field} mt="md" minRows={4} maxRows={8} label="overrideJustification" description="Required for an out-of-set recommendation; 20–2000 trimmed characters." error={errors.overrideJustification?.message ?? (justificationInvalid ? 'overrideJustification must contain between 20 and 2000 characters.' : undefined)} aria-describedby="override-justification-help" />
            )} />
          )}
          {bundle.overrideJustification && <Alert mt="md" color="orange" icon={<IconAlertCircle size={17} />} title="Saved override justification"><Text size="sm">{bundle.overrideJustification}</Text></Alert>}
          <Group mt="lg" justify="space-between"><Text size="xs" c="dimmed">Save emits the same recommendation / overrideJustification body used by Review Package JSON.</Text><Button type="submit" disabled={!canSave || isSubmitting}>Save recommendation</Button></Group>
        </Paper>
        <Paper className="constraint-panel" component="aside" aria-label="Constraint explanation">
          <div className="constraint-icon"><IconShieldCheck size={24} /></div>
          <Text className="eyebrow">ACTIVE RULE · {constraint.rule.replaceAll('-', ' ')}</Text>
          <Title order={3}>Why these choices are allowed</Title>
          <Text mt="sm">{constraint.explanation}</Text>
          <Text fw={750} mt="lg" size="sm">Currently allowed</Text>
          <Group mt="xs">{constraint.allowed.map((item) => <Badge key={item} color="teal" variant="light">{item}</Badge>)}</Group>
        </Paper>
      </div>
    </section>
  );
}
