export const dimensions = [
  { id: "intent", name: "Intent fidelity", short: "Intent" },
  { id: "craft", name: "Implementation craft", short: "Craft" },
  { id: "proof", name: "Verification depth", short: "Proof" },
  { id: "stewardship", name: "Workspace stewardship", short: "Stewardship" },
];

const criterionTemplates = {
  intent: [
    ["INT-01", "Required behavior is present", 4],
    ["INT-02", "Interaction matches the request", 3],
    ["INT-03", "Edge cases are handled", 2],
  ],
  craft: [
    ["CRF-01", "Implementation is maintainable", 3],
    ["CRF-02", "Interfaces are cohesive", 2],
    ["CRF-03", "No fragile shortcuts remain", 2],
  ],
  proof: [
    ["PRF-01", "Targeted checks pass", 4],
    ["PRF-02", "Regression coverage is credible", 3],
    ["PRF-03", "Failure paths were exercised", 2],
  ],
  stewardship: [
    ["STW-01", "Existing work is preserved", 3],
    ["STW-02", "Changes remain in scope", 2],
    ["STW-03", "Final state is clean", 2],
  ],
};

const baseFiles = {
  "README.md":
    "# Field notes\n\nThis workspace contains the benchmark implementation and its verification notes.",
  "src/index.ts": `export function buildSignal(input: string) {\n  return input.trim().toLowerCase();\n}`,
  "src/pipeline.ts": `export const stages = ['collect', 'shape', 'emit'];\n\nexport function run(value: string) {\n  return stages.reduce((next, stage) => stage + ':' + next, value);\n}`,
  "fixtures/results.csv":
    "case,status,latency_ms\nalpha,pass,42\nbeta,pass,58\ngamma,fail,91",
  "assets/preview.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 220"><rect width="480" height="220" fill="#e5efec"/><path d="M40 170L145 66l77 76 70-93 145 121" fill="none" stroke="#146f64" stroke-width="12" stroke-linecap="round"/><circle cx="292" cy="49" r="13" fill="#b9682c"/><text x="40" y="35" font-family="sans-serif" font-size="18" fill="#18211d">Generated verification preview</text></svg>`,
};

function makeAgentSteps(seed) {
  const names = [
    "reasoning",
    "tool-call",
    "observation",
    "terminal",
    "reasoning",
    "tool-call",
    "screenshot",
    "observation",
    "terminal",
    "tool-call",
    "reasoning",
    "terminal",
    "observation",
  ];
  const titles = [
    "Map the requested behavior",
    "Inspect the workspace",
    "Identify the integration seam",
    "Run the baseline checks",
    "Choose a minimal implementation",
    "Write the signal pipeline",
    "Inspect the rendered preview",
    "Review the changed surface",
    "Exercise focused verification",
    "Tighten the failure path",
    "Audit the final diff",
    "Run the full check suite",
    "Summarize the result",
  ];
  const changes = {
    1: [
      {
        path: "README.md",
        kind: "Modified",
        content:
          "# Field notes\n\nBaseline workspace inspected. The implementation plan preserves existing behavior.",
      },
    ],
    5: [
      {
        path: "src/adapter.ts",
        kind: "Added",
        content: `export type Signal = { source: string; value: string };\n\nexport function adapt(source: string, value: string): Signal {\n  return { source, value: value.trim() };\n}`,
      },
    ],
    8: [
      {
        path: "src/pipeline.ts",
        kind: "Modified",
        content: `export const stages = ['collect', 'shape', 'verify', 'emit'];\n\nexport function run(value: string) {\n  if (!value.trim()) throw new Error('value is required');\n  return stages.reduce((next, stage) => stage + ':' + next, value);\n}`,
      },
    ],
    9: [{ path: "fixtures/legacy.txt", kind: "Deleted", content: "" }],
    11: [
      {
        path: "fixtures/results.csv",
        kind: "Truncated",
        content: "case,status,latency_ms\nalpha,pass,42\nbeta,pass,58",
      },
    ],
  };
  return names.map((type, index) => ({
    id: index,
    type,
    title: titles[index],
    message:
      index === 0
        ? `I will trace the request against the existing structure before editing. Trial seed ${seed} needs a narrow, verifiable change.`
        : `${titles[index]} while keeping the benchmark contract and neighboring files intact.`,
    reasoning: `The active constraint at this point is to preserve the surrounding workspace while proving the requested behavior. I am checking assumptions before advancing from step ${index}.`,
    terminal:
      type === "terminal"
        ? index === 3
          ? "$ embercheck --focus signal\n3 checks found\n2 passed, 1 baseline failure"
          : index === 8
            ? "$ embercheck --focus signal\n4 checks passed\nlatency 58ms"
            : "$ embercheck\n12 checks passed\n0 warnings"
        : "",
    screenshot: type === "screenshot",
    tools:
      type === "tool-call"
        ? [
            {
              name:
                index === 1
                  ? "workspace.scan"
                  : index === 5
                    ? "workspace.patch"
                    : "checks.run",
              status: "complete",
              input:
                index === 1
                  ? "src/** and fixtures/**"
                  : index === 5
                    ? "src/adapter.ts"
                    : "focused failure-path suite",
              output:
                index === 1
                  ? "5 files indexed; 2 executable modules detected."
                  : index === 5
                    ? "Created src/adapter.ts with 8 added lines."
                    : "4 passed; exit code 0.",
            },
          ]
        : [],
    observations:
      type === "observation"
        ? `The observed state at step ${index} agrees with the intended boundary; no unrelated path was changed.`
        : "",
    changes: changes[index] || [],
  }));
}

function makeScorerSteps(seed) {
  const titles = [
    "Load trial artifacts",
    "Check required behavior",
    "Inspect implementation seam",
    "Exercise edge case",
    "Review regression proof",
    "Inspect visual evidence",
    "Audit workspace scope",
    "Synthesize verdicts",
  ];
  return titles.map((title, index) => ({
    id: index,
    type:
      index === 5
        ? "screenshot"
        : index % 3 === 1
          ? "observation"
          : "tool-call",
    title,
    message: `${title} for evidence set ${seed}.${index}. The inspection is mapped to explicit rubric criteria.`,
    reasoning: `Evidence is considered sufficient only when the artifact and observed behavior agree. This inspection step keeps that distinction explicit.`,
    screenshot: index === 5,
    tools:
      index % 3 === 0 || index === 2
        ? [
            {
              name:
                index === 0
                  ? "artifact.open"
                  : index === 3
                    ? "scenario.execute"
                    : index === 6
                      ? "diff.audit"
                      : "source.inspect",
              status: index === 3 ? "warning" : "complete",
              input:
                index === 0
                  ? "trial bundle"
                  : index === 3
                    ? "empty input case"
                    : index === 6
                      ? "changed paths"
                      : "implementation module",
              output:
                index === 3
                  ? "Expected guarded response; received fallback value."
                  : `Inspection ${index} completed with structured evidence.`,
            },
          ]
        : [],
    observations:
      index === 4
        ? ""
        : index % 2
          ? `Observed ${index + 1} relevant artifact signals and linked them to the rubric.`
          : "",
  }));
}

function buildResults(labelNames, variant = 0) {
  const criteria = dimensions.flatMap((dimension) =>
    criterionTemplates[dimension.id].map(([id, title, weight]) => ({
      id,
      title,
      weight,
      dimensionId: dimension.id,
    })),
  );
  const results = {};
  labelNames.forEach((label, labelIndex) => {
    const verdicts = {};
    criteria.forEach((criterion, index) => {
      const baselineFail = (index + variant) % 5 === 0 || index === 7;
      // Only the second label diverges from the primary pass; the optional third
      // label ("Strict rescore") agrees with the primary, so its comparison pair
      // has zero flips and reaches the designed no-flips empty state.
      const flipped =
        labelIndex === 1 && (index === (variant % 3) + 1 || index === 7);
      const yes = flipped ? baselineFail : !baselineFail;
      verdicts[criterion.id] = {
        yes,
        reasoning: yes
          ? `Evidence confirms “${criterion.title.toLowerCase()}” across the inspected artifact and the targeted scenario.`
          : `The inspection found a material gap in “${criterion.title.toLowerCase()}”; the observed behavior diverges from the requested contract in the linked evidence.`,
        scorerStep: index % 8,
        agentStep: (index * 2 + variant) % 13,
      };
    });
    const scores = Object.fromEntries(
      dimensions.map((dimension) => {
        const group = criteria.filter((c) => c.dimensionId === dimension.id);
        const total = group.reduce((sum, c) => sum + c.weight, 0);
        const earned = group.reduce(
          (sum, c) => sum + (verdicts[c.id].yes ? c.weight : 0),
          0,
        );
        return [dimension.id, Math.round((earned / total) * 100)];
      }),
    );
    results[label] = {
      name: label,
      verdicts,
      scores,
      total: Math.round(
        Object.values(scores).reduce((a, b) => a + b, 0) / dimensions.length,
      ),
      cost: Number((0.17 + variant * 0.025 + labelIndex * 0.041).toFixed(3)),
    };
  });
  return { criteria, results };
}

const taskBlueprints = [
  {
    id: "task-lantern-parse",
    title: "Lantern log parser",
    category: "Code repair",
    accent: "#146f64",
    instruction:
      "## Objective\nRepair the event parser so it accepts compact lantern records, rejects empty identifiers, and preserves the stable output order.\n\n- Keep the public `parseRecord` signature.\n- Add focused regression coverage.\n- Do not rewrite the storage adapter.",
    config: {
      runtime: "Ember VM 4",
      budget: "18 min",
      fixture: "lantern-small",
      isolation: "sealed",
    },
    tests: [
      "parses compact records",
      "rejects empty identifiers",
      "preserves stable order",
      "leaves adapter untouched",
    ],
  },
  {
    id: "task-mosaic-cache",
    title: "Mosaic cache boundary",
    category: "Systems reasoning",
    accent: "#76539f",
    instruction:
      "## Objective\nImplement a cache boundary that expires stale mosaic tiles without evicting valid neighbors.\n\nThe solution must remain deterministic under the supplied clock and expose a concise audit record.",
    config: {
      runtime: "Quartz Node 9",
      budget: "22 min",
      fixture: "mosaic-clock",
      isolation: "sealed",
    },
    tests: [
      "expires stale tile",
      "retains valid neighbors",
      "uses supplied clock",
      "writes audit record",
    ],
  },
  {
    id: "task-orchard-grid",
    title: "Orchard report grid",
    category: "Interface implementation",
    accent: "#b25f2e",
    instruction:
      "## Objective\nComplete the orchard report grid with sortable yield columns, a clear empty state, and keyboard-reachable row details.\n\nRespect the existing token system and keep the report printable.",
    config: {
      runtime: "Willow Web 7",
      budget: "16 min",
      fixture: "orchard-2028",
      isolation: "sealed",
    },
    tests: [
      "sorts yield columns",
      "renders empty state",
      "opens rows by keyboard",
      "preserves print layout",
    ],
  },
];

const modelNames = ["Fernhollow-2", "Opaline-6", "Cindergraph-1"];
const scorerNames = [
  "Gossamer rubric engine",
  "Thicket inspection pass",
  "Vellum evidence pass",
];
const labelSets = [
  ["Primary pass", "Evidence rescore", "Strict rescore"],
  ["Primary pass", "Boundary rescore"],
  ["Primary pass", "Evidence rescore"],
];

export const tasks = taskBlueprints.map((task, taskIndex) => ({
  ...task,
  environment: [
    { path: "src", kind: "folder", children: ["index.ts", "pipeline.ts"] },
    {
      path: "fixtures",
      kind: "folder",
      children: ["results.csv", "legacy.txt"],
    },
    { path: "README.md", kind: "file" },
    { path: "package.json", kind: "file" },
  ],
  trials: modelNames.map((model, trialIndex) => {
    const labelNames =
      trialIndex === 0 && taskIndex === 0
        ? labelSets[0]
        : labelSets[((trialIndex + taskIndex) % 2) + 1];
    const { criteria, results } = buildResults(
      labelNames,
      taskIndex * 2 + trialIndex,
    );
    const active = results[labelNames[0]];
    return {
      id: `${task.id}-trial-${trialIndex + 1}`,
      model,
      scorer: scorerNames[(taskIndex + trialIndex) % scorerNames.length],
      reward: (active.total / 100).toFixed(2),
      outcome: active.total >= 75 ? "Pass" : "Fail",
      duration: `${8 + taskIndex * 2 + trialIndex}m ${12 + trialIndex * 9}s`,
      steps: 13,
      criteria,
      results,
      labelNames,
      agentSteps: makeAgentSteps(`${taskIndex + 1}-${trialIndex + 1}`),
      scorerSteps: makeScorerSteps(`${taskIndex + 1}-${trialIndex + 1}`),
      baseFiles: { ...baseFiles },
    };
  }),
}));

export const getTask = (taskId) => tasks.find((task) => task.id === taskId);
export const getTrial = (taskId, trialId) =>
  getTask(taskId)?.trials.find((trial) => trial.id === trialId);

export function computeRollup(trial, label) {
  return (
    trial.results[label]?.scores ||
    Object.fromEntries(dimensions.map((d) => [d.id, 0]))
  );
}

export function flippedCriterionIds(trial, labels) {
  const [a, b] = labels;
  if (!a || !b || a === b || !trial.results[a] || !trial.results[b]) return [];
  return trial.criteria
    .filter(
      (c) =>
        trial.results[a].verdicts[c.id].yes !==
        trial.results[b].verdicts[c.id].yes,
    )
    .map((c) => c.id);
}
