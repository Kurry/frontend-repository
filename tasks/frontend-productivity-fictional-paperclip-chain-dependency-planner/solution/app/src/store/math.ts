import type { Task, Clip, Schedule, Issue } from './schema';

export function calculateSchedule(tasks: Task[], clips: Clip[], planStartStr: string, reviewGateStr: string): { schedule: Schedule, issues: Issue[] } {
  const planStart = new Date(planStartStr).getTime();
  const reviewGate = new Date(reviewGateStr).getTime();

  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  const revAdj = new Map<string, string[]>();

  tasks.forEach(t => {
    adj.set(t.id, []);
    revAdj.set(t.id, []);
    inDegree.set(t.id, 0);
  });

  clips.filter(c => c.status === 'committed' && c.sourceTaskId && c.targetTaskId).forEach(c => {
    adj.get(c.sourceTaskId!)!.push(c.targetTaskId!);
    revAdj.get(c.targetTaskId!)!.push(c.sourceTaskId!);
    inDegree.set(c.targetTaskId!, inDegree.get(c.targetTaskId!)! + 1);
  });

  const queue: string[] = [];
  tasks.forEach(t => {
    if (inDegree.get(t.id) === 0) queue.push(t.id);
  });
  queue.sort();

  const topoOrder: string[] = [];
  while(queue.length > 0) {
    queue.sort();
    const u = queue.shift()!;
    topoOrder.push(u);
    for (const v of adj.get(u) || []) {
      inDegree.set(v, inDegree.get(v)! - 1);
      if (inDegree.get(v) === 0) {
        queue.push(v);
      }
    }
  }

  const earliestStart = new Map<string, number>();
  const earliestFinish = new Map<string, number>();

  for (const id of topoOrder) {
    const task = tasks.find(t => t.id === id)!;
    let es = planStart;
    for (const p of revAdj.get(id) || []) {
      if (earliestFinish.has(p)) {
        es = Math.max(es, earliestFinish.get(p)!);
      }
    }
    earliestStart.set(id, es);
    earliestFinish.set(id, es + task.durationMinutes * 60000);
  }

  const projectFinish = Math.max(planStart, ...Array.from(earliestFinish.values()));

  const latestStart = new Map<string, number>();
  const latestFinish = new Map<string, number>();

  const revTopo = [...topoOrder].reverse();
  for (const id of revTopo) {
    const task = tasks.find(t => t.id === id)!;
    let lf = projectFinish;
    for (const s of adj.get(id) || []) {
      if (latestStart.has(s)) {
        lf = Math.min(lf, latestStart.get(s)!);
      }
    }
    latestFinish.set(id, lf);
    latestStart.set(id, lf - task.durationMinutes * 60000);
  }

  const slack = new Map<string, number>();
  const criticalIds: string[] = [];
  for (const id of topoOrder) {
    const ls = latestStart.get(id)!;
    const es = earliestStart.get(id)!;
    const sl = Math.round((ls - es) / 60000);
    slack.set(id, sl);
    if (sl === 0) {
      criticalIds.push(id);
    }
  }

  criticalIds.sort((a, b) => {
    const esA = earliestStart.get(a)!;
    const esB = earliestStart.get(b)!;
    if (esA !== esB) return esA - esB;
    return a.localeCompare(b);
  });

  const reviewBufferMinutes = Math.round((reviewGate - projectFinish) / 60000);
  const issues: Issue[] = [];

  const intervals = topoOrder.map(id => {
    const task = tasks.find(t => t.id === id)!;
    const predecessors = revAdj.get(id) || [];
    const issueIds: string[] = [];

    if (task.requiredPredecessorIds) {
      for (const reqId of task.requiredPredecessorIds) {
        if (!predecessors.includes(reqId)) {
          const issueId = `ISSUE-${id}-${reqId}`;
          issueIds.push(issueId);
          issues.push({
            id: issueId,
            type: 'missing-required-predecessor',
            taskId: id,
            resolved: false
          });
        }
      }
    }

    return {
      taskId: id,
      start: new Date(earliestStart.get(id)!).toISOString(),
      finish: new Date(earliestFinish.get(id)!).toISOString(),
      durationMinutes: task.durationMinutes,
      predecessorIds: predecessors,
      successorIds: adj.get(id) || [],
      slackMinutes: slack.get(id)!,
      critical: slack.get(id)! === 0,
      issueIds
    };
  });

  intervals.sort((a, b) => {
    const timeA = new Date(a.start).getTime();
    const timeB = new Date(b.start).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return a.taskId.localeCompare(b.taskId);
  });

  return {
    schedule: {
      intervals,
      criticalTaskIds: criticalIds,
      finish: new Date(projectFinish).toISOString(),
      reviewBufferMinutes
    },
    issues
  };
}

export function routeClip(sourceId: string, targetId: string, tasks: Task[]): { kind: 'direct' | 'over' | 'under', points: {x: number, y: number}[] } | null {
  const source = tasks.find(t => t.id === sourceId);
  const target = tasks.find(t => t.id === targetId);
  if (!source || !target) return null;

  const sx = source.x + 180;
  const sy = source.y + 52;

  const tx = target.x;
  const ty = target.y + 52;

  const clearance = 12;
  const intersectsTask = (x: number, y: number) => {
    for (const t of tasks) {
      if (t.id === source.id || t.id === target.id) continue;
      const left = t.x - clearance;
      const right = t.x + 180 + clearance;
      const top = t.y - clearance;
      const bottom = t.y + 104 + clearance;
      if (x > left && x < right && y > top && y < bottom) return true;
    }
    return false;
  };

  const p1 = { x: sx + 24, y: sy };
  const p4 = { x: tx - 24, y: ty };

  const directPath = [
    {x: sx, y: sy},
    p1,
    {x: p1.x, y: ty},
    p4,
    {x: tx, y: ty}
  ];

  let collision = false;
  for (const pt of directPath) {
    if (intersectsTask(pt.x, pt.y)) collision = true;
  }

  if (!collision) return { kind: 'direct', points: directPath };

  const overPath = [
    {x: sx, y: sy},
    {x: sx + 24, y: sy},
    {x: sx + 24, y: source.y - clearance - 24},
    {x: tx - 24, y: source.y - clearance - 24},
    {x: tx - 24, y: ty},
    {x: tx, y: ty}
  ];
  return { kind: 'over', points: overPath };
}
