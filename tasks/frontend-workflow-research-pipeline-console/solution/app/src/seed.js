const now = Date.now();
const isoAgo = (mins) => new Date(now - mins * 60_000).toISOString();

const phase = (key, status, dataset, model, cluster, extra = {}) => ({
  key,
  title: key === 'data' ? 'Data generation' : key === 'fineTune' ? 'Fine-tuning' : 'Evaluation',
  status,
  dataset,
  model,
  cluster,
  count: extra.count ?? (key === 'fineTune' ? 6 : 12),
  current: extra.current ?? (status === 'Complete' ? (extra.count ?? (key === 'fineTune' ? 6 : 12)) : 0),
  paused: false,
  attempt: extra.attempt ?? 1,
  maxAttempts: extra.maxAttempts ?? 3,
  retryRemaining: extra.retryRemaining ?? 0,
  autoRetry: extra.autoRetry ?? false,
  startedAt: extra.startedAt ?? (status === 'Pending' || status === 'Skipped' ? null : isoAgo(20)),
  completedAt: extra.completedAt ?? (status === 'Complete' ? isoAgo(12) : null),
  output: extra.output ?? (status === 'Complete' ? `${key === 'data' ? 'dataset' : key === 'fineTune' ? 'checkpoint' : 'report'}://${dataset.toLowerCase().replace(/\s/g, '-')}` : null),
  loss: extra.loss ?? (key === 'fineTune' ? [{ epoch: 1, loss: 1.22 }, { epoch: 2, loss: .86 }] : []),
  scores: extra.scores ?? [],
  cost: extra.cost ?? 0,
  errorCategory: extra.errorCategory,
  errorSummary: extra.errorSummary,
});

const events = (id, specs) => specs.map((s, index) => ({
  id: `${id}-e${index + 1}`,
  phase: s[0], status: s[1], message: s[2], timestamp: isoAgo(s[3] ?? 15 - index),
}));

export const seedDatasets = [
  { id: 'ds-1', name: 'Helix-12K', tasks: 12480, runId: 'run-1027', config: '12 trials · atlas-mini · aurora', distribution: [{ type: 'Plan', value: 42 }, { type: 'Tool', value: 34 }, { type: 'Verify', value: 24 }] },
  { id: 'ds-2', name: 'Glyph-8K', tasks: 8320, runId: 'run-1031', config: '10 trials · ember-1b · basalt', distribution: [{ type: 'Plan', value: 30 }, { type: 'Tool', value: 48 }, { type: 'Verify', value: 22 }] },
  { id: 'ds-3', name: 'Orbit-6K', tasks: 6150, runId: 'run-1034', config: '9 trials · quartz-3b · cinder', distribution: [{ type: 'Plan', value: 36 }, { type: 'Tool', value: 28 }, { type: 'Verify', value: 36 }] },
  { id: 'ds-4', name: 'Mosaic-4K', tasks: 4410, runId: 'run-1038', config: '8 trials · atlas-mini · aurora', distribution: [{ type: 'Plan', value: 24 }, { type: 'Tool', value: 52 }, { type: 'Verify', value: 24 }] },
  { id: 'ds-5', name: 'Prism-9K', tasks: 9050, runId: 'run-1036', config: '14 trials · ember-1b · basalt', distribution: [{ type: 'Plan', value: 44 }, { type: 'Tool', value: 22 }, { type: 'Verify', value: 34 }] },
  { id: 'ds-6', name: 'Nova-Synth', tasks: 386, runId: 'run-1042', config: '16 trials · lumen-2b · cinder', distribution: [{ type: 'Plan', value: 38 }, { type: 'Tool', value: 40 }, { type: 'Verify', value: 22 }] },
  { id: 'ds-7', name: 'Echo-3K', tasks: 3180, runId: 'run-0990', config: '7 trials · quartz-3b · basalt · archived', distribution: [{ type: 'Plan', value: 31 }, { type: 'Tool', value: 36 }, { type: 'Verify', value: 33 }] },
];

export const seedRuns = [
  {
    id: 'run-1027', label: 'Helix foundation', createdAt: isoAgo(180), cost: 18.42,
    config: { jobType: 'Fine-tune', dataset: 'Helix-12K', model: 'atlas-mini', count: 6, cluster: 'aurora', autoEvaluate: true },
    phases: [phase('data', 'Complete', 'Helix-12K', 'atlas-mini', 'aurora', { count: 12 }), phase('fineTune', 'Complete', 'Helix-12K', 'quill-2b-ft-1027', 'aurora', { count: 6 }), phase('evaluation', 'Complete', 'Helix-12K', 'quill-2b-ft-1027', 'aurora', { count: 3, scores: [.81, .84, .83] })],
    events: events('1027', [['data','Running','Generation started',180],['data','Complete','12,480 tasks generated',150],['fineTune','Running','Training started',145],['fineTune','Complete','Checkpoint quill-2b-ft-1027 saved',110],['evaluation','Running','Automatic evaluation triggered',109],['evaluation','Complete','Evaluation completed',100]]),
  },
  {
    id: 'run-1031', label: 'Glyph tool study', createdAt: isoAgo(150), cost: 14.78,
    config: { jobType: 'Fine-tune', dataset: 'Glyph-8K', model: 'ember-1b', count: 5, cluster: 'basalt', autoEvaluate: true },
    phases: [phase('data','Complete','Glyph-8K','ember-1b','basalt',{count:10}), phase('fineTune','Complete','Glyph-8K','ember-ft-1031','basalt',{count:5}), phase('evaluation','Complete','Glyph-8K','ember-ft-1031','basalt',{count:3,scores:[.77,.79,.80]})],
    events: events('1031', [['data','Complete','Dataset materialized',140],['fineTune','Running','Training started',120],['fineTune','Complete','Checkpoint saved',95],['evaluation','Running','Automatic evaluation triggered',94],['evaluation','Complete','Evaluation completed',86]]),
  },
  {
    id: 'run-1034', label: 'Orbit reasoning tune', createdAt: isoAgo(70), cost: 9.31,
    config: { jobType: 'Fine-tune', dataset: 'Orbit-6K', model: 'quartz-3b', count: 7, cluster: 'cinder', autoEvaluate: true },
    phases: [phase('data','Complete','Orbit-6K','quartz-3b','cinder',{count:9}), phase('fineTune','Running','Orbit-6K','quartz-ft-1034','cinder',{count:7,current:2,loss:[{epoch:1,loss:1.34},{epoch:2,loss:.96}]}), phase('evaluation','Pending','Orbit-6K','quartz-ft-1034','cinder',{count:3})],
    events: events('1034', [['data','Complete','Generation complete',60],['fineTune','Running','Fine-tune allocated to cinder',25]]),
  },
  {
    id: 'run-1036', label: 'Prism benchmark pass', createdAt: isoAgo(60), cost: 12.64,
    config: { jobType: 'Evaluate', dataset: 'Prism-9K', model: 'lumen-ft-0998', count: 6, cluster: 'basalt', benchmark: 'Cartographer', repetitions: 6 },
    phases: [phase('data','Complete','Prism-9K','lumen-2b','basalt',{count:14}), phase('fineTune','Complete','Prism-9K','lumen-ft-0998','basalt',{count:5}), phase('evaluation','Running','Prism-9K','lumen-ft-0998','basalt',{count:6,current:2,scores:[.72,.75]})],
    events: events('1036', [['data','Complete','Dataset available',160],['fineTune','Complete','Checkpoint available',80],['evaluation','Running','Six-trial evaluation started',10]]),
  },
  {
    id: 'run-1038', label: 'Mosaic recovery test', createdAt: isoAgo(45), cost: 6.28,
    config: { jobType: 'Fine-tune', dataset: 'Mosaic-4K', model: 'atlas-mini', count: 8, cluster: 'aurora', autoEvaluate: false },
    phases: [phase('data','Complete','Mosaic-4K','atlas-mini','aurora',{count:8}), phase('fineTune','Failed','Mosaic-4K','mosaic-ft-1038','aurora',{count:8,current:3,attempt:3,maxAttempts:3,retryRemaining:8,autoRetry:true,errorCategory:'Worker preemption',errorSummary:'Training worker lost after epoch 3; checkpoint retained.'}), phase('evaluation','Pending','Mosaic-4K','mosaic-ft-1038','aurora',{count:3})],
    events: events('1038', [['data','Complete','Generation complete',40],['fineTune','Running','Training attempt 1 started',30],['fineTune','Failed','Worker preempted; checkpoint saved',4],['fineTune','Failed','Retry budget entering backoff',1]]),
  },
  {
    id: 'run-1042', label: 'Nova data forge', createdAt: isoAgo(12), cost: 2.18,
    config: { jobType: 'Data generation', dataset: 'Nova-Synth', model: 'lumen-2b', count: 16, cluster: 'cinder' },
    phases: [phase('data','Running','Nova-Synth','lumen-2b','cinder',{count:16,current:386}), phase('fineTune','Pending','Nova-Synth','lumen-2b','cinder',{count:6}), phase('evaluation','Pending','Nova-Synth','lumen-2b','cinder',{count:3})],
    events: events('1042', [['data','Running','Generation started on cinder',12]]),
  },
  {
    id: 'run-1044', label: 'Ledger queued study', createdAt: isoAgo(3), cost: 0,
    config: { jobType: 'Evaluate', dataset: 'Helix-12K', model: 'quill-2b-ft-1027', count: 4, cluster: 'basalt', benchmark: 'Ledger', repetitions: 4 },
    phases: [phase('data','Skipped','Helix-12K','quill-2b-ft-1027','basalt',{count:12}), phase('fineTune','Skipped','Helix-12K','quill-2b-ft-1027','basalt',{count:6}), phase('evaluation','Pending','Helix-12K','quill-2b-ft-1027','basalt',{count:4})],
    events: events('1044', [['evaluation','Pending','Queued behind active basalt job',3]]),
  },
];

export const seedTrials = [
  { model:'quill-2b-ft-1027', benchmark:'Switchboard', trials:[{id:'sw-001',score:.81,duration:42},{id:'sw-002',score:.84,duration:39},{id:'sw-003',score:.83,duration:44}] },
  { model:'quill-2b-ft-1027', benchmark:'Cartographer', trials:[{id:'ca-001',score:.75,duration:55},{id:'ca-002',score:.78,duration:51},{id:'ca-003',score:.77,duration:57}] },
  { model:'quill-2b-ft-1027', benchmark:'Ledger', trials:[{id:'le-001',score:.88,duration:31},{id:'le-002',score:.86,duration:34}] },
  { model:'ember-ft-1031', benchmark:'Switchboard', trials:[{id:'sw-101',score:.77,duration:31},{id:'sw-102',score:.79,duration:34},{id:'sw-103',score:.80,duration:32}] },
  { model:'ember-ft-1031', benchmark:'Cartographer', trials:[{id:'ca-101',score:.82,duration:46},{id:'ca-102',score:.80,duration:49},{id:'ca-103',score:.83,duration:43}] },
  { model:'ember-ft-1031', benchmark:'Ledger', trials:[{id:'le-101',score:.72,duration:28},{id:'le-102',score:.75,duration:30},{id:'le-103',score:.74,duration:29}] },
  { model:'lumen-ft-0998', benchmark:'Switchboard', trials:[{id:'sw-201',score:.85,duration:62},{id:'sw-202',score:.87,duration:65},{id:'sw-203',score:.84,duration:59}] },
  { model:'lumen-ft-0998', benchmark:'Cartographer', trials:[{id:'ca-201',score:.72,duration:71},{id:'ca-202',score:.75,duration:68}] },
  { model:'lumen-ft-0998', benchmark:'Ledger', trials:[{id:'le-201',score:.79,duration:49},{id:'le-202',score:.81,duration:47},{id:'le-203',score:.80,duration:51}] },
  { model:'quartz-ft-1019', benchmark:'Switchboard', trials:[{id:'sw-301',score:.73,duration:48},{id:'sw-302',score:.76,duration:44},{id:'sw-303',score:.74,duration:46}] },
  { model:'quartz-ft-1019', benchmark:'Cartographer', trials:[{id:'ca-301',score:.86,duration:69},{id:'ca-302',score:.84,duration:72},{id:'ca-303',score:.87,duration:68}] },
  { model:'quartz-ft-1019', benchmark:'Ledger', trials:[{id:'le-301',score:.76,duration:38},{id:'le-302',score:.78,duration:36},{id:'le-303',score:.77,duration:39}] },
];

export const baseModels = ['atlas-mini', 'ember-1b', 'lumen-2b', 'quartz-3b'];
