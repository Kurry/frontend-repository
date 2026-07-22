import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import { Highlight, themes } from "prism-react-renderer";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Cell,
  Column,
  Dialog,
  DialogTrigger,
  GridList,
  GridListItem,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Modal,
  ModalOverlay,
  Popover,
  Row,
  Select,
  SelectValue,
  Table,
  TableBody,
  TableHeader,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  TextArea,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "react-aria-components";
import {
  IconAdjustments,
  IconArrowLeft,
  IconArrowsDiff,
  IconBook2,
  IconBraces,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconClipboard,
  IconClock,
  IconCode,
  IconCommand,
  IconCopy,
  IconDownload,
  IconFile,
  IconFileSpreadsheet,
  IconFileText,
  IconFolder,
  IconGitBranch,
  IconHistory,
  IconInfoCircle,
  IconLayoutColumns,
  IconListDetails,
  IconPlayerPlay,
  IconArrowForwardUp,
  IconRobot,
  IconScale,
  IconSearch,
  IconSparkles,
  IconTerminal2,
  IconTrash,
  IconUpload,
  IconUserCheck,
  IconX,
  IconZoomCheck,
} from "@tabler/icons-react";
import { tasks, getTask, getTrial } from "./seed";
import {
  useReviewStore,
  currentContext,
  summaryCounts,
  buildReviewPackage,
  buildMemo,
  trialBadge,
  dimensions,
  computeRollup,
  flippedCriterionIds,
} from "./store";
import {
  adjudicationFormSchema,
  bulkSchema,
  reviewPackageBaseSchema,
  validateReviewPackage,
  flattenZodErrors,
  classifications,
  importDraftSchema,
} from "./schemas";
import { registerWebMCP } from "./webmcp";

const cx = (...parts) => parts.filter(Boolean).join(" ");
const iconSize = 17;

class HighlightBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  }
}

function StatusPill({ tone = "neutral", children, className = "" }) {
  const tones = {
    neutral: "border-line bg-white text-muted",
    positive: "border-positive/25 bg-positive-soft text-positive",
    negative: "border-negative/25 bg-negative-soft text-negative",
    warning: "border-warning/25 bg-warning-soft text-warning",
    accent: "border-accent/25 bg-accent-soft text-accent",
    purple: "border-[#76539f]/25 bg-[#eee7f5] text-[#68458f]",
  };
  return (
    <span className={cx("status-pill", tones[tone], className)}>
      {children}
    </span>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-9 place-items-center rounded-lg bg-ink text-paper shadow-sm">
        <IconGitBranch size={20} />
      </div>
      <div>
        <div className="text-[15px] font-extrabold tracking-tight">
          Traceframe
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[.16em] text-muted">
          Review workbench
        </div>
      </div>
    </div>
  );
}

function AppHeader() {
  const view = useReviewStore((s) => s.view);
  const openOverlay = useReviewStore((s) => s.openOverlay);
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1680px] items-center justify-between px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <StatusPill tone="accent">
            <span className="size-1.5 rounded-full bg-accent" />3 seeded tasks
          </StatusPill>
          {view === "review" && (
            <Button
              className="app-command-button control hidden sm:inline-flex"
              onPress={() => openOverlay("palette")}
              aria-label="Open command palette"
            >
              <IconCommand size={iconSize} /> Commands{" "}
              <kbd className="rounded border border-line bg-white px-1.5 py-0.5 font-mono text-[10px] text-muted">
                ⌘K
              </kbd>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function Breadcrumb({ items }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-muted"
    >
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 && (
            <IconChevronRight size={13} className="shrink-0 text-[#a8aea9]" />
          )}
          {item.onPress ? (
            <Button
              className="focus-ring truncate rounded px-1 py-0.5 hover:text-ink"
              onPress={item.onPress}
            >
              {item.label}
            </Button>
          ) : (
            <span className="truncate text-ink">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

function TaskList() {
  const selectTask = useReviewStore((s) => s.selectTask);
  return (
    <main className="mx-auto max-w-[1450px] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.16em] text-accent">
            <IconSparkles size={15} /> Benchmark register
          </div>
          <h1 className="text-3xl font-black tracking-[-.035em] sm:text-4xl">
            Agent benchmark trials
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Inspect task definitions, compare scoring passes, trace evidence,
            and produce a reviewer-owned adjudication package.
          </p>
        </div>
        <div className="panel grid grid-cols-3 divide-x divide-line overflow-hidden">
          {[
            ["03", "Tasks"],
            ["09", "Trials"],
            ["108", "Criteria"],
          ].map(([value, label]) => (
            <div key={label} className="px-5 py-3 text-center">
              <div className="font-mono text-xl font-extrabold">{value}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ul
        aria-label="Benchmark tasks"
        className="grid list-none gap-4 lg:grid-cols-3"
      >
        {tasks.map((task) => (
          <li key={task.id} className="contents">
            <button
              type="button"
              aria-label={`Open task ${task.title}`}
              className="focus-ring group panel hover-wash w-full cursor-pointer overflow-hidden text-left outline-none transition hover:-translate-y-0.5 hover:shadow-md"
              onClick={() => selectTask(task.id)}
            >
              <div className="h-1.5" style={{ background: task.accent }} />
            <div className="p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="grid size-10 place-items-center rounded-lg border border-line bg-white">
                  <IconBook2 size={20} style={{ color: task.accent }} />
                </div>
                <StatusPill>{task.category}</StatusPill>
              </div>
              <div className="mb-1 font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
                {task.id}
              </div>
              <h2 className="text-xl font-extrabold tracking-tight">
                {task.title}
              </h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                {task.instruction
                  .replace(/[#`]/g, "")
                  .split("\n")
                  .filter(Boolean)
                  .slice(1)
                  .join(" ")}
              </p>
              <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                <div className="flex items-center gap-4 text-xs font-semibold text-muted">
                  <span>3 trials</span>
                  <span>{task.tests.length} tests</span>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-bold text-accent">
                  Open task{" "}
                  <IconChevronRight
                    size={16}
                    className="transition group-hover:translate-x-0.5"
                  />
                </span>
              </div>
            </div>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}

function TrialTable({ task }) {
  const openTrial = useReviewStore((s) => s.openTrial);
  const trialState = useReviewStore((s) => s.trialState);
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <h2 className="text-base font-extrabold">Trial register</h2>
          <p className="text-xs text-muted">
            Select a trial to open the split review workspace.
          </p>
        </div>
        <StatusPill tone="accent">3 trials</StatusPill>
      </div>
      <div className="overflow-x-auto">
        <table
          aria-label={`Trials for ${task.title}`}
          className="min-w-[800px] w-full text-left text-sm"
        >
          <thead className="border-b border-line bg-black/[.018] text-[10px] uppercase tracking-[.1em] text-muted">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-bold">
                Model
              </th>
              <th scope="col" className="px-3 py-2.5 font-bold">
                Reward
              </th>
              <th scope="col" className="px-3 py-2.5 font-bold">
                Outcome
              </th>
              <th scope="col" className="px-3 py-2.5 font-bold">
                Duration
              </th>
              <th scope="col" className="px-3 py-2.5 font-bold">
                Steps
              </th>
              <th scope="col" className="px-3 py-2.5 font-bold">
                Adjudication
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-bold">
                Open
              </th>
            </tr>
          </thead>
          <tbody>
            {task.trials.map((trial) => {
              const badge = trialBadge(trial.id, {
                ...useReviewStore.getState(),
                trialState,
              });
              return (
                <tr
                  key={trial.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open review workspace for trial ${trial.model}`}
                  onClick={() => openTrial(trial.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openTrial(trial.id);
                    }
                  }}
                  className="focus-ring hover-wash cursor-pointer border-b border-line/80 outline-none last:border-0"
                >
                  <td className="px-4 py-3">
                    <div className="font-bold">{trial.model}</div>
                    <div className="mt-0.5 text-xs text-muted">
                      {trial.scorer}
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono font-bold">
                    {trial.reward}
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill
                      tone={trial.outcome === "Pass" ? "positive" : "negative"}
                    >
                      {trial.outcome === "Pass" ? (
                        <IconCheck size={12} />
                      ) : (
                        <IconX size={12} />
                      )}
                      {trial.outcome}
                    </StatusPill>
                  </td>
                  <td className="px-3 py-3 text-muted">{trial.duration}</td>
                  <td className="px-3 py-3 font-mono text-muted">
                    {trial.steps}
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill tone={badge.tone}>{badge.text}</StatusPill>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 font-bold text-accent">
                      Review <IconChevronRight size={15} />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DefinitionTree({ task }) {
  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-sm font-extrabold">Environment tree</h2>
      </div>
      <div className="py-2 font-mono text-xs">
        {task.environment.map((node) => (
          <div key={node.path}>
            <div className="hover-wash flex items-center gap-2 px-4 py-1.5">
              {node.kind === "folder" ? (
                <IconFolder size={15} className="text-warning" />
              ) : (
                <IconFile size={15} className="text-muted" />
              )}
              {node.path}
            </div>
            {node.children?.map((child) => (
              <div
                key={child}
                className="hover-wash flex items-center gap-2 py-1.5 pl-9 pr-4 text-muted"
              >
                <IconFile size={14} />
                {child}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskDetail() {
  const taskId = useReviewStore((s) => s.activeTaskId);
  const backToTasks = useReviewStore((s) => s.backToTasks);
  const task = getTask(taskId);
  return (
    <main className="mx-auto max-w-[1450px] px-4 py-6 sm:px-6">
      <Breadcrumb
        items={[
          { label: "Tasks", onPress: backToTasks },
          { label: task.title },
        ]}
      />
      <div className="mt-6 mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-1 font-mono text-xs font-bold uppercase tracking-wider text-muted">
            {task.id}
          </div>
          <h1 className="text-3xl font-black tracking-tight">{task.title}</h1>
          <p className="mt-2 text-sm text-muted">
            {task.category} · 3 trial candidates · sealed benchmark environment
          </p>
        </div>
        <Button className="control" onPress={backToTasks}>
          <IconArrowLeft size={iconSize} />
          All tasks
        </Button>
      </div>
      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,.7fr)]">
        <section className="panel p-5">
          <div className="mb-3 flex items-center gap-2">
            <IconListDetails size={19} className="text-accent" />
            <h2 className="text-base font-extrabold">Task definition</h2>
          </div>
          <div className="rich-text text-sm">
            <ReactMarkdown>{task.instruction}</ReactMarkdown>
          </div>
        </section>
        <div className="grid gap-4">
          <section className="panel p-4">
            <h2 className="mb-3 text-sm font-extrabold">Run configuration</h2>
            <dl className="grid grid-cols-2 gap-3">
              {Object.entries(task.config).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-muted">
                    {key}
                  </dt>
                  <dd className="mt-1 font-mono text-xs font-semibold">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <DefinitionTree task={task} />
        </div>
      </div>
      <section className="panel mb-6 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-extrabold">Test listing</h2>
          <StatusPill tone="positive">
            <IconCheck size={12} />
            {task.tests.length} named tests
          </StatusPill>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {task.tests.map((test, index) => (
            <div
              key={test}
              className="flex items-center gap-2 rounded-md border border-line bg-white p-2.5 text-xs font-semibold"
            >
              <span className="grid size-5 shrink-0 place-items-center rounded bg-positive-soft font-mono text-[10px] font-bold text-positive">
                {index + 1}
              </span>
              {test}
            </div>
          ))}
        </div>
      </section>
      <TrialTable task={task} />
    </main>
  );
}

function ToolPanel({ tool, panelKey }) {
  const open = useReviewStore((s) => !!s.disclosure[panelKey]);
  const toggle = useReviewStore((s) => s.toggleDisclosure);
  return (
    <div className="overflow-hidden rounded-md border border-line bg-white">
      <Button
        className="focus-ring flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-black/[.025]"
        onPress={() => toggle(panelKey)}
        aria-expanded={open}
      >
        <IconChevronRight
          size={14}
          className={cx(
            "shrink-0 transition-transform duration-200",
            open && "rotate-90",
          )}
        />
        <span className="font-mono font-bold">{tool.name}</span>
        <StatusPill
          tone={tool.status === "complete" ? "positive" : "warning"}
          className="ml-auto"
        >
          {tool.status}
        </StatusPill>
      </Button>
      <div
        className={cx(
          "grid transition-[grid-template-rows] duration-200",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <dl className="border-t border-line px-3 py-2 text-xs">
            <dt className="mb-1 font-bold text-muted">Input summary</dt>
            <dd className="mb-3 font-mono text-[11px]">{tool.input}</dd>
            <dt className="mb-1 font-bold text-muted">Output</dt>
            <dd className="whitespace-pre-wrap rounded bg-[#17211d] p-2.5 font-mono text-[11px] leading-5 text-[#d6e5dd]">
              {tool.output}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}

function ScreenshotFrame({
  label = "Generated verification preview from the active file",
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className="relative grid aspect-[16/7] place-items-center overflow-hidden rounded-md border border-dashed border-accent/40 bg-[linear-gradient(135deg,#edf5f2_25%,#f8faf8_25%,#f8faf8_50%,#edf5f2_50%,#edf5f2_75%,#f8faf8_75%)] bg-[length:20px_20px]"
    >
      <div className="rounded-lg border border-line bg-paper/95 px-5 py-4 text-center shadow-sm">
        <IconZoomCheck size={24} className="mx-auto mb-2 text-accent" />
        <div className="text-xs font-bold">Captured inspection frame</div>
        <div className="mt-1 text-[11px] text-muted">
          Visual evidence · 1280 × 720
        </div>
      </div>
    </div>
  );
}

function StepDetail({ pane, step, trial }) {
  const open = useReviewStore(
    (s) => !!s.disclosure[`${trial.id}-${pane}-${step.id}-reasoning`],
  );
  const toggle = useReviewStore((s) => s.toggleDisclosure);
  const reasoningKey = `${trial.id}-${pane}-${step.id}-reasoning`;
  return (
    <div className="min-w-0 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[.12em] text-muted">
            {pane} step {String(step.id + 1).padStart(2, "0")}
          </div>
          <h3 className="text-sm font-extrabold">{step.title}</h3>
        </div>
        <StatusPill tone="accent">{step.type}</StatusPill>
      </div>
      <p className="text-sm leading-6 text-[#424d46]">{step.message}</p>
      <div className="overflow-hidden rounded-md border border-line bg-white">
        <Button
          className="focus-ring flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold hover:bg-black/[.025]"
          onPress={() => toggle(reasoningKey)}
          aria-expanded={open}
        >
          <IconChevronRight
            size={14}
            className={cx(
              "transition-transform duration-200",
              open && "rotate-90",
            )}
          />
          Reasoning region
          <span className="ml-auto text-[10px] font-semibold text-muted">
            {open ? "Collapse" : "Expand"}
          </span>
        </Button>
        <div
          className={cx(
            "grid transition-[grid-template-rows] duration-200",
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            <p className="border-t border-line px-3 py-3 text-xs leading-5 text-muted">
              {step.reasoning}
            </p>
          </div>
        </div>
      </div>
      {step.tools?.map((tool, index) => (
        <ToolPanel
          key={tool.name}
          tool={tool}
          panelKey={`${trial.id}-${pane}-${step.id}-tool-${index}`}
        />
      ))}
      {step.observations && (
        <div className="rounded-md border border-[#cfd8d3] bg-[#f1f5f2] p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-muted">
            <IconInfoCircle size={13} />
            Observation
          </div>
          <p className="text-xs leading-5">{step.observations}</p>
        </div>
      )}
      {(step.screenshot || pane === "scorer") && (
        <ScreenshotFrame
          label={`${pane} trajectory step ${step.id + 1} inspection screenshot frame`}
        />
      )}
    </div>
  );
}

function Timeline({ pane, steps, trial, activeStep, linkedStep }) {
  const setStep = useReviewStore((s) => s.setStep);
  const refs = useRef({});
  useEffect(() => {
    refs.current[activeStep]?.scrollIntoView({
      block: "nearest",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [activeStep]);
  const move = (direction) => {
    const currentIndex = Math.max(0, steps.findIndex((step) => step.id === activeStep));
    const nextIndex = direction === "home"
      ? 0
      : direction === "end"
        ? steps.length - 1
        : Math.max(0, Math.min(steps.length - 1, currentIndex + direction));
    const nextId = steps[nextIndex].id;
    setStep(pane, nextId);
    requestAnimationFrame(() => refs.current[nextId]?.focus());
  };
  const onKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      move("home");
    } else if (event.key === "End") {
      event.preventDefault();
      move("end");
    }
  };
  const icons = {
    reasoning: IconSparkles,
    "tool-call": IconCode,
    observation: IconZoomCheck,
    terminal: IconTerminal2,
    screenshot: IconLayoutColumns,
  };
  return (
    <div
      role="listbox"
      aria-label={`${pane} trajectory steps`}
      aria-activedescendant={`${trial.id}-${pane}-step-${activeStep}`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="focus-ring scroll-thin max-h-[420px] min-h-[250px] overflow-y-auto border-r border-line bg-white/60 outline-none min-[1025px]:max-h-[520px]"
    >
      {steps.map((step) => {
        const StepIcon = icons[step.type] || IconCode;
        const active = activeStep === step.id;
        const linked = linkedStep === step.id;
        return (
          <button
            key={step.id}
            ref={(node) => {
              refs.current[step.id] = node;
            }}
            id={`${trial.id}-${pane}-step-${step.id}`}
            role="option"
            aria-selected={active}
            aria-current={active ? "step" : undefined}
            onClick={() => setStep(pane, step.id)}
            className={cx(
              "hover-wash relative flex w-full items-start gap-2.5 border-b border-line/80 px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
              active && "bg-accent-soft/70",
              linked && "linked-step ring-1 ring-inset ring-accent",
            )}
          >
            <span
              className={cx(
                "mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border font-mono text-[9px] font-bold",
                active
                  ? "border-accent bg-accent text-white"
                  : "border-line bg-white text-muted",
              )}
            >
              <StepIcon size={13} />
            </span>
            <span className="min-w-0">
              <span className="mb-0.5 flex items-center gap-1.5">
                <span className="font-mono text-[9px] font-bold text-muted">
                  {String(step.id + 1).padStart(2, "0")}
                </span>
                <span className="truncate text-xs font-bold">{step.title}</span>
              </span>
              <span className="line-clamp-1 text-[10px] leading-4 text-muted">
                {step.message}
              </span>
            </span>
            {linked && (
              <span
                className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-accent"
                title="Linked evidence"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function fileSnapshot(trial, stepIndex) {
  const files = Object.fromEntries(
    Object.entries(trial.baseFiles).map(([path, content]) => [
      path,
      { path, content, kind: null },
    ]),
  );
  for (const step of trial.agentSteps) {
    if (step.id > stepIndex) break;
    for (const change of step.changes || []) files[change.path] = { ...change };
  }
  return Object.values(files).sort((a, b) => a.path.localeCompare(b.path));
}

function FileBadge({ kind }) {
  if (!kind) return null;
  const tones = {
    Added: "positive",
    Modified: "warning",
    Deleted: "negative",
    Truncated: "purple",
  };
  return <StatusPill tone={tones[kind]}>{kind}</StatusPill>;
}

function CodeBlock({ content, language = "typescript", filePath }) {
  const [copied, setCopied] = useState(false);
  const safeCode = typeof content === "string" ? content : String(content ?? "");
  const safeLanguage = [
    "typescript",
    "tsx",
    "javascript",
    "jsx",
    "json",
    "bash",
    "markup",
    "css",
  ].includes(language)
    ? language
    : "typescript";
  const copy = async () => {
    await copyText(safeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  const plain = (
    <pre className="scroll-thin max-h-64 overflow-auto p-3 font-mono text-[11px] leading-5 text-[#d6e5dd]">
      {safeCode}
    </pre>
  );
  return (
    <div className="overflow-hidden rounded-md border border-[#283831] bg-[#17211d]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#a7b9b0]">
        <span>
          {safeLanguage} · {filePath}
        </span>
        <button
          type="button"
          className="focus-ring inline-flex items-center gap-1 rounded px-2 py-1 text-[#d8e7df] hover:bg-white/10"
          onClick={copy}
        >
          {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
          {copied ? "Copied code" : "Copy"}
        </button>
      </div>
      <HighlightBoundary fallback={plain}>
        <Highlight
          theme={themes.nightOwl}
          code={safeCode}
          language={safeLanguage}
        >
          {({ tokens, getLineProps, getTokenProps }) => (
            <pre className="scroll-thin max-h-64 overflow-auto p-3 font-mono text-[11px] leading-5 text-[#d6e5dd]">
              {tokens.map((line, i) => {
                const lineProps = getLineProps({ line });
                delete lineProps.key;
                return (
                  <div key={i} {...lineProps}>
                    <span className="mr-4 inline-block w-4 select-none text-right text-white/25">
                      {i + 1}
                    </span>
                    {line.map((token, key) => {
                      const tokenProps = getTokenProps({ token });
                      delete tokenProps.key;
                      return <span key={key} {...tokenProps} />;
                    })}
                  </div>
                );
              })}
            </pre>
          )}
        </Highlight>
      </HighlightBoundary>
    </div>
  );
}

function FileRenderer({ file }) {
  if (!file)
    return (
      <div className="grid min-h-32 place-items-center text-xs text-muted">
        Select a file to inspect its active-step contents.
      </div>
    );
  if (file.kind === "Deleted")
    return (
      <div className="grid min-h-32 place-items-center rounded-md border border-dashed border-negative/30 bg-negative-soft/40 text-center">
        <div>
          <IconTrash className="mx-auto mb-2 text-negative" size={23} />
          <div className="text-xs font-bold text-negative">
            Deleted at this step
          </div>
          <div className="mt-1 text-[11px] text-muted">
            The file no longer has renderable contents.
          </div>
        </div>
      </div>
    );
  const ext = file.path.split(".").pop();
  if (ext === "md")
    return (
      <div className="rich-text max-h-64 overflow-auto rounded-md border border-line bg-white p-4 text-xs">
        <ReactMarkdown>{file.content}</ReactMarkdown>
      </div>
    );
  if (ext === "csv") {
    const [header, ...rows] = file.content
      .split("\n")
      .map((line) => line.split(","));
    return (
      <div className="scroll-thin max-h-64 overflow-auto rounded-md border border-line">
        <table className="w-full min-w-[360px] border-collapse text-xs">
          <thead className="sticky top-0 bg-[#edf2ef]">
            <tr>
              {header.map((cell) => (
                <th
                  key={cell}
                  className="border-b border-r border-line px-3 py-2 text-left font-bold last:border-r-0"
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, i) => (
                  <td
                    key={i}
                    className="border-b border-r border-line px-3 py-2 font-mono last:border-r-0"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (ext === "svg")
    return (
      <div className="grid min-h-40 place-items-center rounded-md border border-line bg-white p-3">
        <img
          alt="Generated verification preview from the active file"
          className="max-h-48 max-w-full object-contain"
          src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(file.content)}`}
        />
      </div>
    );
  const codeLanguage =
    ext === "ts" || ext === "tsx"
      ? "typescript"
      : ext === "js" || ext === "jsx"
        ? "jsx"
        : ext === "json"
          ? "json"
          : "typescript";
  return (
    <CodeBlock
      content={file.content}
      language={codeLanguage}
      filePath={file.path}
    />
  );
}

function AgentFiles({ trial, stepIndex }) {
  const files = useMemo(
    () => fileSnapshot(trial, stepIndex),
    [trial, stepIndex],
  );
  const selectedPath = useReviewStore((s) => s.fileSelection[trial.id]);
  const selectFile = useReviewStore((s) => s.selectFile);
  const selected =
    files.find((file) => file.path === selectedPath) ||
    files.find((file) => file.kind) ||
    files[0];
  return (
    <section className="border-t border-line">
      <div className="grid min-h-[230px] grid-cols-[minmax(130px,34%)_1fr]">
        <div className="scroll-thin max-h-[300px] overflow-auto border-r border-line bg-white/60 py-2">
          <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-muted">
            Evolving file tree
          </div>
          {files.map((file) => (
            <button
              key={file.path}
              onClick={() => selectFile(trial.id, file.path)}
              className={cx(
                "hover-wash focus-ring flex w-full items-center gap-2 px-3 py-1.5 text-left",
                selected.path === file.path && "bg-accent-soft",
              )}
            >
              <IconFile size={14} className="shrink-0 text-muted" />
              <span
                className={cx(
                  "min-w-0 flex-1 truncate font-mono text-[10px]",
                  file.kind === "Deleted" && "line-through text-muted",
                )}
              >
                {file.path}
              </span>
              <FileBadge kind={file.kind} />
            </button>
          ))}
        </div>
        <div className="min-w-0 p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="truncate font-mono text-[10px] font-bold">
              {selected.path}
            </span>
            <FileBadge kind={selected.kind} />
          </div>
          <FileRenderer file={selected} />
        </div>
      </div>
    </section>
  );
}

function TerminalStream({ trial, step }) {
  const key = `${trial.id}-${step.id}`;
  const length = step.terminal ? step.terminal.length : 0;
  const [visible, setVisible] = useState(0);
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    if (!step.terminal) return undefined;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      setVisible(length);
      setComplete(true);
      return undefined;
    }
    setVisible(0);
    setComplete(false);
    const timer = setInterval(() => {
      setVisible((value) => {
        const next = Math.min(length, value + 2);
        if (next >= length) {
          clearInterval(timer);
          setComplete(true);
        }
        return next;
      });
    }, 45);
    return () => clearInterval(timer);
    // Re-stream whenever the active terminal step changes.
  }, [key, step.terminal, length]);
  if (!step.terminal) return null;
  return (
    <section className="border-t border-line bg-[#121b17] text-[#d6e6dd]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider">
          <IconTerminal2 size={14} />
          Active-step terminal
        </div>
        <StatusPill tone={complete ? "positive" : "warning"}>
          {!complete && (
            <span className="stream-dot size-1.5 rounded-full bg-warning" />
          )}
          {complete ? "Complete" : "Streaming"}
        </StatusPill>
      </div>
      <pre className="scroll-thin min-h-24 max-h-40 overflow-auto whitespace-pre-wrap p-3 font-mono text-[11px] leading-5">
        {step.terminal.slice(0, visible)}
        {!complete && <span className="stream-dot">▋</span>}
      </pre>
    </section>
  );
}

function TrajectoryPane({ pane, trial, ui, hidden }) {
  const focused = ui.focusedPane === pane;
  const steps = trial[`${pane}Steps`];
  const activeIndex = ui[`${pane}Step`];
  const active = steps[activeIndex];
  const setFocused = useReviewStore((s) => s.setFocusedPane);
  const selectedVerdict = ui.selectedCriterion
    ? trial.results[ui.activeLabel].verdicts[ui.selectedCriterion]
    : null;
  const linkedStep = selectedVerdict ? selectedVerdict[`${pane}Step`] : null;
  return (
    <section
      aria-label={`${pane} trajectory`}
      className={cx(
        "trajectory-pane min-w-0 overflow-hidden bg-paper transition duration-200",
        hidden && "hidden min-[1025px]:block",
        pane === "agent" &&
          "min-[1025px]:border-r-2 min-[1025px]:border-[#aeb7b1]",
        focused && "ring-2 ring-inset ring-accent/60",
      )}
      onClick={() => setFocused(pane)}
    >
      <header
        className={cx(
          "flex h-12 items-center justify-between border-b border-line px-3",
          focused ? "bg-accent-soft/70" : "bg-black/[.018]",
        )}
      >
        <div className="flex items-center gap-2">
          {pane === "agent" ? <IconRobot size={18} /> : <IconScale size={18} />}
          <h2 className="text-sm font-extrabold">
            {pane === "agent" ? "Agent trajectory" : "Scorer trajectory"}
          </h2>
          {focused && <StatusPill tone="accent">Focused</StatusPill>}
        </div>
        <span className="font-mono text-[10px] font-bold text-muted">
          {activeIndex + 1} / {steps.length}
        </span>
      </header>
      <div className="grid grid-cols-[minmax(135px,38%)_1fr]">
        <Timeline
          pane={pane}
          steps={steps}
          trial={trial}
          activeStep={activeIndex}
          linkedStep={linkedStep}
        />
        <div className="scroll-thin max-h-[420px] overflow-y-auto p-3 min-[1025px]:max-h-[520px]">
          <StepDetail pane={pane} step={active} trial={trial} />
        </div>
      </div>
      {pane === "agent" && (
        <>
          <AgentFiles trial={trial} stepIndex={activeIndex} />
          <TerminalStream
            key={`${trial.id}-${active.id}`}
            trial={trial}
            step={active}
          />
        </>
      )}
    </section>
  );
}

function LabelSelect({
  label,
  value,
  items,
  onChange,
  ariaLabel,
  className = "",
  isInvalid = false,
  errorMessageId,
}) {
  return (
    <Select
      aria-label={ariaLabel || label}
      selectedKey={value || null}
      onSelectionChange={(key) => onChange(String(key))}
      className={className}
      isInvalid={isInvalid}
      aria-describedby={errorMessageId}
    >
      <Label className="label">{label}</Label>
      <Button className="field focus-ring flex items-center justify-between gap-2 text-left">
        <SelectValue className="truncate" />
        <IconChevronDown size={15} className="shrink-0 text-muted" />
      </Button>
      <Popover
        className="z-[80] min-w-[var(--trigger-width)] overflow-auto rounded-md border border-line bg-paper p-1 shadow-xl"
        placement="bottom start"
      >
        <ListBox
          items={items.map((item) => ({ id: item, name: item }))}
          className="outline-none"
        >
          {(item) => (
            <ListBoxItem
              id={item.id}
              textValue={item.name}
              className="focus-ring cursor-pointer rounded px-3 py-2 text-sm outline-none hover:bg-accent-soft data-[selected]:bg-accent-soft data-[selected]:font-bold"
            >
              {item.name}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </Select>
  );
}

function Rollup({ trial, label }) {
  const scores = computeRollup(trial, label);
  return (
    <div
      aria-label="Dimension rollup scores"
      className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
    >
      {dimensions.map((dimension) => (
        <div
          key={dimension.id}
          className="overflow-hidden rounded-md border border-line bg-white"
        >
          <div className="flex items-center justify-between px-3 pt-2 text-[10px] font-bold uppercase tracking-wider">
            <span className="truncate text-muted">{dimension.short}</span>
            <span className="font-mono text-ink">{scores[dimension.id]}%</span>
          </div>
          <div className="mx-3 my-2 h-1.5 overflow-hidden rounded-full bg-[#e1e4e1]">
            <div
              className={cx(
                "h-full rounded-full transition-[width] duration-300",
                scores[dimension.id] >= 75
                  ? "bg-positive"
                  : scores[dimension.id] >= 50
                    ? "bg-warning"
                    : "bg-negative",
              )}
              style={{ width: `${scores[dimension.id]}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ComparisonStrip({ trial, ui }) {
  const setComparedLabel = useReviewStore((s) => s.setComparedLabel);
  const a = trial.results[ui.comparedLabels[0]];
  const b = trial.results[ui.comparedLabels[1]];
  const deltas = dimensions.map((d) => ({
    ...d,
    value: b.scores[d.id] - a.scores[d.id],
  }));
  const totalDelta = b.total - a.total;
  const Delta = ({ value }) => (
    <span
      className={cx(
        "font-mono text-xs font-extrabold",
        value > 0
          ? "text-positive"
          : value < 0
            ? "text-negative"
            : "text-muted",
      )}
    >
      {value > 0 ? "+" : ""}
      {value}
    </span>
  );
  return (
    <section className="rounded-lg border border-line bg-[#f7f6f2] p-3">
      <div className="mb-3 flex items-center gap-2 text-xs font-extrabold">
        <IconArrowsDiff size={17} className="text-accent" />
        Compare labels
        <span className="ml-auto text-[10px] font-semibold text-muted">
          Delta: second minus first
        </span>
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(150px,1fr)_auto_minmax(150px,1fr)_2fr]">
        <LabelSelect
          label="First label"
          value={ui.comparedLabels[0]}
          items={trial.labelNames}
          onChange={(value) => setComparedLabel(0, value)}
        />
        <div className="hidden items-end pb-2 lg:flex">
          <IconChevronRight size={16} />
        </div>
        <LabelSelect
          label="Second label"
          value={ui.comparedLabels[1]}
          items={trial.labelNames}
          onChange={(value) => setComparedLabel(1, value)}
        />
        <div className="grid grid-cols-5 gap-1.5">
          {deltas.map((d) => (
            <div
              key={d.id}
              className="flex flex-col justify-end rounded border border-line bg-white px-2 py-1.5"
            >
              <span className="truncate text-[9px] font-bold uppercase tracking-wider text-muted">
                {d.short}
              </span>
              <Delta value={d.value} />
            </div>
          ))}
          <div className="flex flex-col justify-end rounded border border-accent/25 bg-accent-soft px-2 py-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-accent">
              Total
            </span>
            <Delta value={totalDelta} />
          </div>
        </div>
      </div>
    </section>
  );
}

function AdjudicationDialog({
  criterion,
  trial,
  ui,
  triggerClass = "control min-h-11 px-3 text-xs sm:h-8 sm:min-h-8 sm:px-2",
}) {
  const record = ui.adjudications.find(
    (item) => item.criterionId === criterion.id,
  );
  const recordAdjudications = useReviewStore((s) => s.recordAdjudications);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(adjudicationFormSchema),
    defaultValues: {
      criterionId: criterion.id,
      classification: record?.classification || "",
      rationale: record?.rationale || "",
      evidenceStepIds: record?.evidenceStepIds || [],
    },
  });
  useEffect(() => {
    if (open)
      reset({
        criterionId: criterion.id,
        classification: record?.classification || "",
        rationale: record?.rationale || "",
        evidenceStepIds: record?.evidenceStepIds || [],
      });
  }, [open, criterion.id, record, reset]);
  const submit = handleSubmit((values) => {
    const maxIndex =
      Math.max(trial.agentSteps.length, trial.scorerSteps.length) - 1;
    if (
      values.evidenceStepIds?.some(
        (id) => !Number.isInteger(id) || id < 0 || id > maxIndex,
      )
    ) {
      setError("evidenceStepIds", {
        message: `evidenceStepIds entries must exist between 0 and ${maxIndex}`,
      });
      return;
    }
    const body = {
      criterionId: criterion.id,
      classification: values.classification,
      rationale: values.rationale.trim(),
      reviewedAt: new Date().toISOString(),
      ...(values.evidenceStepIds?.length
        ? { evidenceStepIds: values.evidenceStepIds }
        : {}),
    };
    recordAdjudications(
      [body],
      record ? "Replaced adjudication" : "Recorded adjudication",
    );
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  });
  return (
    <DialogTrigger
      isOpen={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) window.setTimeout(() => triggerRef.current?.focus(), 0);
      }}
    >
      <Button ref={triggerRef} className={triggerClass}>
        {record ? "Re-adjudicate" : "Adjudicate criterion"}
      </Button>
      <ModalOverlay
        isDismissable
        className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#101814]/50 p-4 backdrop-blur-[2px] data-[entering]:animate-in data-[exiting]:animate-out"
      >
        <Modal className="pop-panel w-full max-w-xl rounded-xl border border-line bg-paper shadow-2xl">
          <Dialog
            aria-label={`Adjudicate ${criterion.id}`}
            className="outline-none"
          >
            <form onSubmit={submit}>
              <div className="flex items-start justify-between border-b border-line px-5 py-4">
                <div>
                  <div className="mb-1 font-mono text-xs font-bold text-accent">
                    {criterion.id}
                  </div>
                  <h2 className="text-lg font-extrabold">
                    Adjudicate criterion
                  </h2>
                  <p className="mt-1 text-xs text-muted">{criterion.title}</p>
                </div>
                <Button
                  slot="close"
                  className="control control-quiet size-9 p-0"
                  aria-label="Close adjudication form"
                >
                  <IconX size={18} />
                </Button>
              </div>
              <div className="space-y-4 p-5">
                <Controller
                  name="classification"
                  control={control}
                  render={({ field }) => (
                    <LabelSelect
                      label="Classification"
                      value={field.value}
                      items={classifications}
                      onChange={field.onChange}
                      ariaLabel="classification"
                      isInvalid={!!errors.classification}
                      errorMessageId="classification-error"
                    />
                  )}
                />
                {errors.classification && (
                  <p id="classification-error" className="error" role="alert">
                    classification: {errors.classification.message}
                  </p>
                )}
                <Controller
                  name="rationale"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      className="w-full"
                      isInvalid={!!errors.rationale}
                    >
                      <Label className="label">Rationale</Label>
                      <TextArea
                        {...field}
                        className="field min-h-32 resize-y py-2"
                        aria-invalid={!!errors.rationale}
                        aria-describedby={
                          errors.rationale ? "rationale-error" : undefined
                        }
                        placeholder="Explain why this is an agent bug, rubric bug, or scorer error (20–2000 characters)."
                      />
                    </TextField>
                  )}
                />
                {errors.rationale && (
                  <p id="rationale-error" className="error" role="alert">
                    rationale: {errors.rationale.message}
                  </p>
                )}
                <Controller
                  name="evidenceStepIds"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      className="w-full"
                      isInvalid={!!errors.evidenceStepIds}
                    >
                      <Label className="label">
                        Evidence step ids{" "}
                        <span className="normal-case tracking-normal text-muted">
                          (optional, comma-separated)
                        </span>
                      </Label>
                      <Input
                        className="field font-mono"
                        aria-invalid={!!errors.evidenceStepIds}
                        aria-describedby={
                          errors.evidenceStepIds
                            ? "evidenceStepIds-error"
                            : undefined
                        }
                        value={
                          Array.isArray(field.value)
                            ? field.value.join(", ")
                            : ""
                        }
                        onChange={(event) => {
                          const raw = event.target.value;
                          field.onChange(
                            raw.trim() === ""
                              ? []
                              : raw.split(",").map((part) => {
                                  const clean = part.trim();
                                  return /^\d+$/.test(clean)
                                    ? Number(clean)
                                    : -1;
                                }),
                          );
                        }}
                        placeholder="2, 5, 8"
                      />
                    </TextField>
                  )}
                />
                {errors.evidenceStepIds && (
                  <p id="evidenceStepIds-error" className="error" role="alert">
                    evidenceStepIds: {errors.evidenceStepIds.message}
                  </p>
                )}
                <p className="text-[11px] leading-5 text-muted">
                  Submitting creates the review-service adjudication body with
                  criterionId, classification, rationale, reviewedAt, and
                  optional evidenceStepIds.
                </p>
              </div>
              <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
                <Button slot="close" className="control">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isDisabled={isSubmitting}
                  className="control control-primary"
                >
                  {record ? "Replace adjudication" : "Record adjudication"}
                </Button>
              </div>
            </form>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}

function CriterionTable({ trial, ui }) {
  const selectCriterion = useReviewStore((s) => s.selectCriterion);
  const jumpEvidence = useReviewStore((s) => s.jumpEvidence);
  const selectFlip = useReviewStore((s) => s.selectFlip);
  const density = useReviewStore((s) => s.density);
  const flips = flippedCriterionIds(trial, ui.comparedLabels);
  const flipKey = flips.join("|");
  const [exitingIds, setExitingIds] = useState([]);
  const previousFlipsOnly = useRef(ui.flipsOnly);
  const previousTrialId = useRef(trial.id);
  useEffect(() => {
    if (previousTrialId.current !== trial.id) {
      previousTrialId.current = trial.id;
      setExitingIds([]);
      previousFlipsOnly.current = ui.flipsOnly;
      return undefined;
    }
    if (previousFlipsOnly.current === ui.flipsOnly) return undefined;
    previousFlipsOnly.current = ui.flipsOnly;
    if (ui.flipsOnly) {
      const flipSet = new Set(flipKey.split("|").filter(Boolean));
      const leaving = trial.criteria
        .filter((criterion) => !flipSet.has(criterion.id))
        .map((criterion) => criterion.id);
      setExitingIds(leaving);
      const timer = window.setTimeout(() => setExitingIds([]), 220);
      return () => window.clearTimeout(timer);
    }
    setExitingIds([]);
    return undefined;
  }, [ui.flipsOnly, flipKey, trial.criteria, trial.id]);
  const visibleCriteria = trial.criteria.filter((criterion) => {
    if (!ui.flipsOnly) return true;
    return flips.includes(criterion.id) || exitingIds.includes(criterion.id);
  });
  const verdicts = trial.results[ui.activeLabel].verdicts;
  if (ui.flipsOnly && !flips.length && !exitingIds.length)
    return (
      <div className="grid min-h-52 place-items-center rounded-lg border border-dashed border-line bg-white p-8 text-center">
        <div>
          <IconArrowsDiff className="mx-auto mb-3 text-muted" size={28} />
          <h3 className="font-extrabold">No criteria flipped</h3>
          <p className="mt-1 max-w-md text-sm text-muted">
            The selected comparison labels agree on every criterion. Clear the
            filter to return to the full verdict register.
          </p>
          <Button
            className="control mt-4"
            onPress={useReviewStore.getState().clearFlips}
          >
            Clear flips-only filter
          </Button>
        </div>
      </div>
    );
  return (
    <div className={cx("space-y-3", density === "comfortable" && "space-y-4")}>
      {dimensions.map((dimension) => {
        const criteria = visibleCriteria.filter(
          (c) => c.dimensionId === dimension.id,
        );
        if (!criteria.length) return null;
        return (
          <section
            key={dimension.id}
            className="overflow-hidden rounded-lg border border-line bg-white"
          >
            <div className="flex items-center justify-between border-b border-line bg-[#f2f3ef] px-3 py-2">
              <h3 className="text-xs font-extrabold">{dimension.name}</h3>
              <span className="font-mono text-[10px] font-bold text-muted">
                {criteria.filter((c) => !exitingIds.includes(c.id)).length}{" "}
                criteria
              </span>
            </div>
            <div className="overflow-x-auto">
              <table
                aria-label={`${dimension.name} verdicts`}
                className="verdict-table w-full text-left"
              >
                <thead className="border-b border-line text-[9px] font-bold uppercase tracking-[.1em] text-muted">
                  <tr>
                    <th scope="col" className="w-10 px-2 py-2">
                      Pick
                    </th>
                    <th scope="col" className="min-w-[9rem] px-2 py-2 sm:w-56">
                      Criterion
                    </th>
                    <th scope="col" className="w-16 px-2 py-2">
                      Weight
                    </th>
                    <th scope="col" className="w-20 px-2 py-2">
                      Verdict
                    </th>
                    <th scope="col" className="min-w-[12rem] px-2 py-2">
                      Scorer reasoning
                    </th>
                    <th scope="col" className="w-28 px-2 py-2">
                      Evidence
                    </th>
                    <th scope="col" className="w-40 px-2 py-2">
                      Review
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {criteria.map((criterion) => {
                    const verdict = verdicts[criterion.id];
                    const flipped = flips.includes(criterion.id);
                    const selected = ui.selectedCriterion === criterion.id;
                    const adjudication = ui.adjudications.find(
                      (record) => record.criterionId === criterion.id,
                    );
                    const canAdjudicate = flipped || !verdict.yes;
                    const exiting = exitingIds.includes(criterion.id);
                    return (
                      <tr
                        key={criterion.id}
                        tabIndex={0}
                        role="button"
                        aria-pressed={selected}
                        aria-label={`Select criterion ${criterion.id} ${criterion.title}`}
                        onClick={() => selectCriterion(criterion.id)}
                        onKeyDown={(event) => {
                          if (
                            (event.key === "Enter" || event.key === " ") &&
                            event.target === event.currentTarget
                          ) {
                            event.preventDefault();
                            selectCriterion(criterion.id);
                          }
                        }}
                        className={cx(
                          "hover-wash focus-ring cursor-pointer border-b border-line/70 outline-none last:border-0",
                          density === "comfortable" ? "[&>td]:py-3" : "[&>td]:py-2",
                          selected &&
                            "bg-accent-soft/70 ring-1 ring-inset ring-accent",
                          exiting
                            ? "row-exit pointer-events-none"
                            : ui.flipsOnly && flipped
                              ? "row-enter"
                              : null,
                        )}
                      >
                        <td
                          className="px-2 py-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {ui.flipsOnly && flipped ? (
                            <input
                              type="checkbox"
                              aria-label={`Select ${criterion.id} for bulk adjudication`}
                              checked={ui.selectedFlips.includes(criterion.id)}
                              onChange={() => selectFlip(criterion.id)}
                              className="focus-ring size-4 rounded accent-accent"
                            />
                          ) : (
                            <span className="block size-5" />
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-muted">
                              {criterion.id}
                            </span>
                            {flipped && (
                              <StatusPill tone="purple">Flipped</StatusPill>
                            )}
                          </div>
                          <div className="mt-0.5 truncate text-xs font-bold">
                            {criterion.title}
                          </div>
                        </td>
                        <td className="px-2 py-2 font-mono text-xs">
                          {criterion.weight}
                        </td>
                        <td className="px-2 py-2">
                          <StatusPill
                            tone={verdict.yes ? "positive" : "negative"}
                          >
                            {verdict.yes ? (
                              <IconCheck size={11} />
                            ) : (
                              <IconX size={11} />
                            )}
                            {verdict.yes ? "Yes" : "No"}
                          </StatusPill>
                        </td>
                        <td className="px-2 py-2">
                          <p
                            className={cx(
                              "text-xs leading-5 text-[#4b554f]",
                              !selected && "line-clamp-1",
                            )}
                            title={verdict.reasoning}
                          >
                            {verdict.reasoning}
                          </p>
                        </td>
                        <td
                          className="px-2 py-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            className="focus-ring inline-flex items-center gap-1 rounded text-xs font-bold text-accent hover:underline"
                            onPress={() => jumpEvidence(criterion.id)}
                          >
                            Scorer {verdict.scorerStep + 1}
                            <IconChevronRight size={13} />
                          </Button>
                        </td>
                        <td
                          className="px-2 py-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {adjudication ? (
                            <div className="flex items-center justify-between gap-1">
                              <StatusPill
                                tone={
                                  adjudication.classification === "agent-bug"
                                    ? "negative"
                                    : adjudication.classification ===
                                        "rubric-bug"
                                      ? "purple"
                                      : "warning"
                                }
                              >
                                {adjudication.classification}
                              </StatusPill>
                              {canAdjudicate && (
                                <AdjudicationDialog
                                  criterion={criterion}
                                  trial={trial}
                                  ui={ui}
                                  triggerClass="focus-ring rounded px-1.5 py-1 text-[10px] font-bold text-muted hover:bg-black/5"
                                />
                              )}
                            </div>
                          ) : canAdjudicate ? (
                            <AdjudicationDialog
                              criterion={criterion}
                              trial={trial}
                              ui={ui}
                            />
                          ) : (
                            <span className="text-[10px] text-muted">
                              Not required
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function BulkBar({ trial, ui }) {
  const recordAdjudications = useReviewStore((s) => s.recordAdjudications);
  const clearSelection = useReviewStore((s) => s.clearFlipSelection);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bulkSchema),
    defaultValues: { classification: "", rationale: "" },
  });
  if (!ui.flipsOnly || !ui.selectedFlips.length) return null;
  const submit = handleSubmit((values) => {
    const now = new Date().toISOString();
    const records = ui.selectedFlips.map((criterionId) => ({
      criterionId,
      classification: values.classification,
      rationale: values.rationale.trim(),
      reviewedAt: now,
    }));
    recordAdjudications(records, `Bulk applied ${values.classification}`);
    reset();
  });
  return (
    <form
      onSubmit={submit}
      className="sticky bottom-3 z-20 rounded-lg border border-accent/30 bg-[#e5f1ed]/95 p-3 shadow-xl backdrop-blur"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-extrabold">
          {ui.selectedFlips.length} flipped criteria selected
        </div>
        <Button
          className="control control-quiet h-8 min-h-8 px-2 text-xs"
          onPress={clearSelection}
        >
          Clear selection
        </Button>
      </div>
      <div className="grid items-end gap-3 lg:grid-cols-[220px_1fr_auto]">
        <div>
          <Controller
            name="classification"
            control={control}
            render={({ field }) => (
              <LabelSelect
                label="Classification"
                value={field.value}
                items={classifications}
                onChange={field.onChange}
                ariaLabel="classification"
                isInvalid={!!errors.classification}
                errorMessageId="bulk-classification-error"
              />
            )}
          />
          {errors.classification && (
            <p id="bulk-classification-error" className="error" role="alert">
              classification: {errors.classification.message}
            </p>
          )}
        </div>
        <div>
          <Controller
            name="rationale"
            control={control}
            render={({ field }) => (
              <TextField isInvalid={!!errors.rationale}>
                <Label className="label">Shared rationale</Label>
                <Input
                  {...field}
                  className="field"
                  aria-invalid={!!errors.rationale}
                  aria-describedby={errors.rationale ? "bulk-rationale-error" : undefined}
                  placeholder="Explain the selected criteria (20–2000 characters)."
                />
              </TextField>
            )}
          />
          {errors.rationale && (
            <p id="bulk-rationale-error" className="error" role="alert">
              rationale: {errors.rationale.message}
            </p>
          )}
        </div>
        <Button type="submit" className="control control-primary">
          Apply classification to selected
        </Button>
      </div>
    </form>
  );
}

function AdjudicationSummary({ records }) {
  const counts = summaryCounts(records);
  const activityFeed = useReviewStore((s) => s.activityFeed);
  const styles = {
    "agent-bug": "border-negative/20 bg-negative-soft text-negative",
    "rubric-bug": "border-[#76539f]/20 bg-[#eee7f5] text-[#68458f]",
    "scorer-error": "border-warning/20 bg-warning-soft text-warning",
  };
  return (
    <section className="panel p-3">
      <div className="mb-3 flex items-center gap-2">
        <IconUserCheck size={17} className="text-accent" />
        <h3 className="text-xs font-extrabold">Adjudication summary</h3>
        <StatusPill className="ml-auto">{records.length} recorded</StatusPill>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {classifications.map((classification) => (
          <div
            key={classification}
            className={cx(
              "rounded-md border px-3 py-2",
              styles[classification],
            )}
          >
            <div
              className="count-pop font-mono text-xl font-extrabold"
              key={`${classification}-${counts[classification]}`}
            >
              {counts[classification]}
            </div>
            <div className="truncate text-[10px] font-bold">
              {classification}
            </div>
          </div>
        ))}
      </div>
      {records.length === 0 && (
        <p className="mt-3 text-[11px] leading-5 text-muted">
          No adjudications recorded yet. Open Adjudicate criterion on a flipped or
          failed row to classify it as agent-bug, rubric-bug, or scorer-error.
        </p>
      )}
      <div className="mt-3 border-t border-line pt-3">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-muted">
          <IconClock size={13} />
          Review activity
        </div>
        {activityFeed.length === 0 ? (
          <p className="text-[11px] text-muted">
            Mutations appear here with timestamps after you adjudicate, import,
            undo, or redo.
          </p>
        ) : (
          <ul className="max-h-36 space-y-1.5 overflow-auto">
            {activityFeed.slice(0, 6).map((item) => (
              <li
                key={item.id}
                className="rounded border border-line bg-white px-2 py-1.5 text-[11px]"
              >
                <div className="font-bold">{item.label}</div>
                <div className="text-muted">{item.detail}</div>
                <time className="font-mono text-[10px] text-muted">
                  {new Date(item.at).toLocaleTimeString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function VerdictWorkspace({ trial, ui }) {
  const setActiveLabel = useReviewStore((s) => s.setActiveLabel);
  const toggleFlips = useReviewStore((s) => s.toggleFlips);
  const flips = flippedCriterionIds(trial, ui.comparedLabels);
  return (
    <section
      id="verdict-table"
      className="border-t-2 border-[#aeb7b1] bg-canvas p-3 sm:p-4"
    >
      <div className="mx-auto max-w-[1640px]">
        <div className="mb-4 grid gap-3 xl:grid-cols-[1fr_330px]">
          <div className="space-y-3">
            <div className="panel p-3">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <IconScale size={18} className="text-accent" />
                    <h2 className="text-base font-extrabold">
                      Verdict register
                    </h2>
                  </div>
                  <p className="text-xs text-muted">
                    Weighted decisions linked to scorer and agent evidence.
                  </p>
                </div>
                <div className="w-full sm:w-56">
                  <LabelSelect
                    label="Active scoring label"
                    value={ui.activeLabel}
                    items={trial.labelNames}
                    onChange={setActiveLabel}
                  />
                </div>
              </div>
              <Rollup trial={trial} label={ui.activeLabel} />
            </div>
            <ComparisonStrip trial={trial} ui={ui} />
          </div>
          <div className="space-y-3">
            <AdjudicationSummary records={ui.adjudications} />
            <div className="panel p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-extrabold">
                    Comparison filter
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted">
                    {flips.length} flipped criteria
                  </div>
                </div>
                <ToggleButton
                  id="coachmark-flips"
                  isSelected={ui.flipsOnly}
                  onChange={toggleFlips}
                  className="control min-h-11 data-[selected]:border-[#76539f] data-[selected]:bg-[#eee7f5] data-[selected]:text-[#68458f] sm:min-h-9"
                >
                  <IconAdjustments size={16} />
                  Flips only
                </ToggleButton>
              </div>
              <p className="text-[11px] leading-5 text-muted">
                When enabled, check flipped rows to apply one classification in
                bulk.
              </p>
            </div>
          </div>
        </div>
        <div
          className="verdict-crossfade transition-opacity duration-200"
          key={ui.activeLabel}
        >
          <CriterionTable trial={trial} ui={ui} />
        </div>
        <BulkBar trial={trial} ui={ui} />
      </div>
    </section>
  );
}

function WorkspaceChrome({ task, trial, ui }) {
  const backToTask = useReviewStore((s) => s.backToTask);
  const undo = useReviewStore((s) => s.undo);
  const redo = useReviewStore((s) => s.redo);
  const openOverlay = useReviewStore((s) => s.openOverlay);
  const density = useReviewStore((s) => s.density);
  const setDensity = useReviewStore((s) => s.setDensity);
  const openCheatsheet = useReviewStore((s) => s.openCheatsheet);
  const badge = trialBadge(trial.id);
  return (
    <div className="border-b border-line bg-paper px-3 py-3 sm:px-5">
      <div className="mx-auto flex max-w-[1640px] flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Breadcrumb
            items={[
              {
                label: "Tasks",
                onPress: useReviewStore.getState().backToTasks,
              },
              { label: task.title, onPress: backToTask },
              { label: trial.model },
            ]}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              className="control min-h-11 sm:min-h-9"
              onPress={undo}
              isDisabled={!ui.undo.length}
              aria-label="Undo adjudication mutation"
            >
              <IconHistory size={iconSize} />
              Undo
            </Button>
            <Button
              className="control min-h-11 sm:min-h-9"
              onPress={redo}
              isDisabled={!ui.redo.length}
              aria-label="Redo adjudication mutation"
            >
              <IconArrowForwardUp size={iconSize} />
              Redo
            </Button>
            <Button
              className="control min-h-11 sm:min-h-9"
              onPress={() =>
                setDensity(density === "dense" ? "comfortable" : "dense")
              }
              aria-label="Toggle verdict and timeline density"
            >
              <IconLayoutColumns size={iconSize} />
              {density === "dense" ? "Comfortable density" : "Dense density"}
            </Button>
            <Button
              className="control min-h-11 sm:min-h-9"
              onPress={openCheatsheet}
            >
              <IconCommand size={iconSize} />
              Keyboard cheatsheet
            </Button>
            <Button
              className="control min-h-11 sm:min-h-9"
              onPress={() => openOverlay("import")}
            >
              <IconUpload size={iconSize} />
              Import review package
            </Button>
            <Button
              id="coachmark-export"
              className="control control-primary min-h-11 sm:min-h-9"
              onPress={() => openOverlay("export")}
            >
              <IconDownload size={iconSize} />
              Export review package
            </Button>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
                {trial.id}
              </span>
              <StatusPill tone={badge.tone}>{badge.text}</StatusPill>
            </div>
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">
              {trial.model}{" "}
              <span className="font-normal text-muted">on {task.title}</span>
            </h1>
          </div>
          <div className="flex gap-4 text-xs">
            <div>
              <span className="label mb-0">Reward</span>
              <span className="font-mono font-extrabold">{trial.reward}</span>
            </div>
            <div>
              <span className="label mb-0">Duration</span>
              <span className="font-semibold">{trial.duration}</span>
            </div>
            <div>
              <span className="label mb-0">Scorer</span>
              <span className="font-semibold">{trial.scorer}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaneSwitcher({ ui }) {
  const setFocusedPane = useReviewStore((s) => s.setFocusedPane);
  return (
    <div className="border-b border-line bg-[#edece6] px-3 py-2 min-[1025px]:hidden">
      <ToggleButtonGroup
        aria-label="Focused trajectory pane"
        selectionMode="single"
        selectedKeys={new Set([ui.focusedPane])}
        onSelectionChange={(keys) =>
          setFocusedPane([...keys][0] || ui.focusedPane)
        }
        className="mx-auto grid max-w-md grid-cols-2 rounded-lg border border-line bg-paper p-1"
      >
        <ToggleButton
          id="agent"
          className="focus-ring flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-bold data-[selected]:bg-accent data-[selected]:text-white"
        >
          <IconRobot size={16} />
          Agent trajectory
        </ToggleButton>
        <ToggleButton
          id="scorer"
          className="focus-ring flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-bold data-[selected]:bg-accent data-[selected]:text-white"
        >
          <IconScale size={16} />
          Scorer trajectory
        </ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
}

function ExportDrawer({ trial, ui }) {
  const open = useReviewStore((s) => s.overlays.export);
  const close = useReviewStore((s) => s.closeOverlay);
  const tab = useReviewStore((s) => s.exportTab);
  const setTab = useReviewStore((s) => s.setExportTab);
  const setAnnouncement = useReviewStore((s) => s.setAnnouncement);
  const openPrintMemo = useReviewStore((s) => s.openPrintMemo);
  const [copied, setCopied] = useState(false);
  const [copyNotice, setCopyNotice] = useState("");
  const packageText = useMemo(
    () =>
      JSON.stringify(buildReviewPackage(useReviewStore.getState()), null, 2),
    [
      trial.id,
      ui.activeLabel,
      ui.comparedLabels.join("|"),
      JSON.stringify(ui.adjudications),
    ],
  );
  const memoText = useMemo(
    () => buildMemo(useReviewStore.getState()),
    [
      trial.id,
      ui.activeLabel,
      ui.comparedLabels.join("|"),
      JSON.stringify(ui.adjudications),
    ],
  );
  const activeText = tab === "json" ? packageText : memoText;
  const copy = async () => {
    await copyText(activeText);
    const notice =
      tab === "json"
        ? "Review package JSON copied to clipboard"
        : "Review memo Markdown copied to clipboard";
    setCopied(true);
    setCopyNotice(`${notice} ${Date.now()}`);
    setAnnouncement(`${notice} ${Date.now()}`);
    setTimeout(() => {
      setCopied(false);
      setCopyNotice("");
    }, 1800);
  };
  const download = () => {
    const blob = new Blob([activeText], {
      type: tab === "json" ? "application/json" : "text/markdown",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${trial.id}-review.${tab === "json" ? "json" : "md"}`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <ModalOverlay
      isOpen={open}
      onOpenChange={(value) => !value && close("export")}
      isDismissable
      className="fixed inset-0 z-50 flex justify-end bg-[#101814]/45 backdrop-blur-[2px] data-[entering]:animate-in data-[exiting]:animate-out"
    >
      <Modal className="drawer-panel h-full w-full max-w-2xl overflow-hidden border-l border-line bg-paper shadow-2xl data-[entering]:opacity-100">
        <Dialog
          aria-label="Export review package"
          className="flex h-full flex-col outline-none"
        >
          <div className="flex items-start justify-between border-b border-line px-4 py-4 sm:px-5">
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs font-bold text-accent">
                <IconBraces size={16} />
                Reviewer artifact
              </div>
              <h2 className="text-xl font-extrabold">Export review package</h2>
              <p className="mt-1 text-xs text-muted">
                Live from the active label, comparison, and adjudication state.
              </p>
            </div>
            <Button
              className="control control-quiet size-11 p-0 sm:size-9"
              onPress={() => close("export")}
              aria-label="Close export drawer"
            >
              <IconX size={19} />
            </Button>
          </div>
          <Tabs
            selectedKey={tab}
            onSelectionChange={(key) => setTab(String(key))}
            className="flex min-h-0 flex-1 flex-col"
          >
            <TabList
              aria-label="Export format"
              className="flex border-b border-line px-4 sm:px-5"
            >
              <Tab
                id="json"
                className="focus-ring cursor-pointer border-b-2 border-transparent px-3 py-3 text-xs font-bold outline-none data-[selected]:border-accent data-[selected]:text-accent"
              >
                Review Package JSON
              </Tab>
              <Tab
                id="memo"
                className="focus-ring cursor-pointer border-b-2 border-transparent px-3 py-3 text-xs font-bold outline-none data-[selected]:border-accent data-[selected]:text-accent"
              >
                Review Memo Markdown
              </Tab>
            </TabList>
            <TabPanel
              id="json"
              className="scroll-thin min-h-0 flex-1 overflow-auto p-4 outline-none sm:p-5"
            >
              <pre className="min-h-full whitespace-pre-wrap break-words rounded-lg border border-[#2e3d36] bg-[#15201b] p-4 font-mono text-xs leading-5 text-[#dbe9e1] sm:text-[12px]">
                {packageText}
              </pre>
            </TabPanel>
            <TabPanel
              id="memo"
              className="scroll-thin min-h-0 flex-1 overflow-auto p-4 outline-none sm:p-5"
            >
              <div className="rich-text min-h-full rounded-lg border border-line bg-white p-5 text-sm">
                <ReactMarkdown>{memoText}</ReactMarkdown>
              </div>
            </TabPanel>
          </Tabs>
          <div className="space-y-2 border-t border-line px-4 py-3 sm:px-5">
            {copyNotice && (
              <p
                className="rounded-md border border-positive/30 bg-positive-soft px-3 py-2 text-xs font-bold text-positive"
                role="status"
                aria-live="polite"
              >
                {copyNotice.replace(/\s\d+$/, "")}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-muted">
                {ui.adjudications.length} adjudication
                {ui.adjudications.length === 1 ? "" : "s"} included
              </div>
              <div className="flex flex-wrap gap-2">
                <Button className="control min-h-11 sm:min-h-9" onPress={copy}>
                  {copied ? (
                    <IconCheck size={iconSize} />
                  ) : (
                    <IconClipboard size={iconSize} />
                  )}
                  {copied ? (tab === "json" ? "Copied review package" : "Copied review memo") : "Copy"}
                </Button>
                <Button
                  className="control min-h-11 sm:min-h-9"
                  onPress={openPrintMemo}
                >
                  <IconFileText size={iconSize} />
                  Print memo
                </Button>
                <Button
                  className="control control-primary min-h-11 sm:min-h-9"
                  onPress={download}
                >
                  <IconDownload size={iconSize} />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

function ImportSurface({ task, trial }) {
  const open = useReviewStore((s) => s.overlays.import);
  const close = useReviewStore((s) => s.closeOverlay);
  const draft = useReviewStore((s) => s.importDraft);
  const setDraft = useReviewStore((s) => s.setImportDraft);
  const importErrors = useReviewStore((s) => s.importErrors);
  const setImportErrors = useReviewStore((s) => s.setImportErrors);
  const replace = useReviewStore((s) => s.replaceAdjudications);
  const setAnnouncement = useReviewStore((s) => s.setAnnouncement);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(importDraftSchema),
    defaultValues: { json: draft },
  });
  useEffect(() => {
    if (open) reset({ json: draft });
  }, [open, draft, reset]);
  const submit = handleSubmit(({ json }) => {
    let parsed;
    try {
      parsed = JSON.parse(json);
    } catch (error) {
      setImportErrors([`document: malformed JSON (${error.message})`]);
      return;
    }
    const result = validateReviewPackage(parsed, task, trial);
    if (!result.success) {
      setImportErrors(flattenZodErrors(result.error));
      return;
    }
    replace(result.data.adjudications);
    setImportErrors([]);
    setAnnouncement(
      `Imported ${result.data.adjudications.length} adjudications successfully from Review Package JSON ${Date.now()}`,
    );
    close("import");
  });
  return (
    <ModalOverlay
      isOpen={open}
      onOpenChange={(value) => !value && close("import")}
      isDismissable
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#101814]/50 p-3 backdrop-blur-[2px]"
    >
      <Modal className="pop-panel w-full max-w-3xl rounded-xl border border-line bg-paper shadow-2xl">
        <Dialog aria-label="Import review package" className="outline-none">
          <form onSubmit={submit}>
            <div className="flex items-start justify-between border-b border-line px-4 py-4 sm:px-5">
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs font-bold text-accent">
                  <IconUpload size={16} />
                  Review package
                </div>
                <h2 className="text-xl font-extrabold">
                  Import review package
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Paste one review-package/v1 JSON object for this open trial.
                </p>
              </div>
              <Button
                className="control control-quiet size-9 p-0"
                onPress={() => close("import")}
                aria-label="Close import surface"
              >
                <IconX size={19} />
              </Button>
            </div>
            <div className="p-4 sm:p-5">
              <Controller
                name="json"
                control={control}
                render={({ field }) => (
                  <TextField>
                    <Label className="label">Review Package JSON</Label>
                    <TextArea
                      {...field}
                      onChange={(event) => {
                        field.onChange(event);
                        setDraft(event.target.value);
                      }}
                      className="field scroll-thin min-h-[300px] resize-y py-3 font-mono text-[11px] leading-5"
                      placeholder={
                        '{\n  "schemaVersion": "review-package/v1",\n  ...\n}'
                      }
                    />
                  </TextField>
                )}
              />
              {errors.json && (
                <p className="error" role="alert">
                  document: {errors.json.message}
                </p>
              )}
              {importErrors.length > 0 && (
                <div
                  className="mt-3 rounded-md border border-negative/25 bg-negative-soft p-3"
                  role="alert"
                >
                  <div className="mb-1 text-xs font-extrabold text-negative">
                    Import validation failed
                  </div>
                  <ul className="list-disc space-y-1 pl-4 text-xs text-negative">
                    {importErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-line px-4 py-4 sm:px-5">
              <Button className="control" onPress={() => close("import")}>
                Cancel
              </Button>
              <Button type="submit" className="control control-primary">
                Import review package
              </Button>
            </div>
          </form>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

function CommandPalette({ task, trial, ui }) {
  const open = useReviewStore((s) => s.overlays.palette);
  const close = useReviewStore((s) => s.closeOverlay);
  const openOverlay = useReviewStore((s) => s.openOverlay);
  const openTrial = useReviewStore((s) => s.openTrial);
  const undo = useReviewStore((s) => s.undo);
  const redo = useReviewStore((s) => s.redo);
  const toggleFlips = useReviewStore((s) => s.toggleFlips);
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const onEscape = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      close("palette");
    };
    window.addEventListener("keydown", onEscape, true);
    return () => window.removeEventListener("keydown", onEscape, true);
  }, [open, close]);
  const actions = [
    ...task.trials.map((item) => ({
      id: `trial-${item.id}`,
      label: `Jump to trial · ${item.model}`,
      hint: item.id,
      icon: IconRobot,
      action: () => openTrial(item.id),
    })),
    {
      id: "export",
      label: "Export review package",
      hint: "Open live artifact preview",
      icon: IconDownload,
      action: () => {
        close("palette");
        openOverlay("export");
      },
    },
    {
      id: "import",
      label: "Import review package",
      hint: "Replace adjudications from JSON",
      icon: IconUpload,
      action: () => {
        close("palette");
        openOverlay("import");
      },
    },
    {
      id: "undo",
      label: "Undo adjudication mutation",
      hint: ui.undo.length ? ui.undo.at(-1).label : "Nothing to undo",
      icon: IconHistory,
      disabled: !ui.undo.length,
      action: undo,
    },
    {
      id: "redo",
      label: "Redo adjudication mutation",
      hint: ui.redo.length ? ui.redo.at(-1).label : "Nothing to redo",
      icon: IconArrowForwardUp,
      disabled: !ui.redo.length,
      action: redo,
    },
    {
      id: "flips",
      label: "Toggle flips-only",
      hint: ui.flipsOnly ? "Currently enabled" : "Currently disabled",
      icon: IconAdjustments,
      action: toggleFlips,
    },
  ];
  const shown = actions.filter((action) =>
    `${action.label} ${action.hint}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const run = (action) => {
    if (action.disabled) return;
    action.action();
    close("palette");
  };
  return (
    <ModalOverlay
      isOpen={open}
      onOpenChange={(value) => !value && close("palette")}
      isDismissable
      className="fixed inset-0 z-[70] flex items-start justify-center bg-[#101814]/55 px-3 pt-[10vh] backdrop-blur-[3px]"
    >
      <Modal className="pop-panel w-full max-w-xl overflow-hidden rounded-xl border border-line bg-paper shadow-2xl">
        <Dialog aria-label="Command palette" className="outline-none">
          <div className="flex items-center gap-3 border-b border-line px-4">
            <IconSearch size={20} className="text-muted" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search commands and trials…"
              className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none"
              aria-label="Search commands"
            />
            <kbd className="rounded border border-line bg-white px-1.5 py-0.5 font-mono text-[10px] text-muted">
              Esc
            </kbd>
          </div>
          <div className="scroll-thin max-h-[55vh] overflow-auto p-2">
            {shown.length ? (
              <GridList
                aria-label="Command results"
                items={shown}
                className="outline-none"
              >
                {(action) => {
                  const ActionIcon = action.icon;
                  return (
                    <GridListItem
                      textValue={action.label}
                      isDisabled={action.disabled}
                      onAction={() => run(action)}
                      className="focus-ring hover-wash flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-md border border-line bg-white">
                        <ActionIcon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold">
                          {action.label}
                        </span>
                        <span className="block truncate text-[11px] text-muted">
                          {action.hint}
                        </span>
                      </span>
                      <IconChevronRight size={16} className="text-muted" />
                    </GridListItem>
                  );
                }}
              </GridList>
            ) : (
              <div className="p-8 text-center text-sm text-muted">
                No command matches “{query}”.
              </div>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[10px] font-semibold text-muted">
            <span>↑↓ navigate · Enter choose · Esc close</span>
            <span>{trial.model}</span>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

function CoachmarksTour() {
  const open = useReviewStore((s) => s.coachmarksOpen);
  const step = useReviewStore((s) => s.coachmarksStep);
  const setStep = useReviewStore((s) => s.setCoachmarksStep);
  const dismiss = useReviewStore((s) => s.dismissCoachmarks);
  const steps = [
    {
      title: "Verdict register",
      body: "Select criteria, follow evidence links, and adjudicate flipped or failed rows here.",
      target: "#verdict-table",
    },
    {
      title: "Export review package",
      body: "Export Review Package JSON or Memo anytime from the chrome Export control.",
      target: "#coachmark-export",
    },
    {
      title: "Flips only filter",
      body: "Narrow the register to flipped criteria, then bulk-apply a shared classification.",
      target: "#coachmark-flips",
    },
  ];
  if (!open) return null;
  const current = steps[step] || steps[0];
  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      <div className="pointer-events-auto absolute bottom-4 left-1/2 w-[min(420px,calc(100%-1.5rem))] -translate-x-1/2 rounded-xl border border-line bg-paper p-4 shadow-2xl">
        <div className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-accent">
          Coachmarks · {step + 1}/{steps.length}
        </div>
        <h2 className="text-base font-extrabold">{current.title}</h2>
        <p className="mt-1 text-sm text-muted">{current.body}</p>
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <Button className="control min-h-11 sm:min-h-9" onPress={dismiss}>
            Dismiss tour
          </Button>
          {step < steps.length - 1 ? (
            <Button
              className="control control-primary min-h-11 sm:min-h-9"
              onPress={() => {
                setStep(step + 1);
                document
                  .querySelector(steps[step + 1].target)
                  ?.scrollIntoView({ block: "center", behavior: "smooth" });
              }}
            >
              Next tip
            </Button>
          ) : (
            <Button
              className="control control-primary min-h-11 sm:min-h-9"
              onPress={dismiss}
            >
              Start reviewing
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function KeyboardCheatsheet() {
  const open = useReviewStore((s) => s.overlays.cheatsheet);
  const close = useReviewStore((s) => s.closeCheatsheet);
  return (
    <ModalOverlay
      isOpen={open}
      onOpenChange={(value) => !value && close()}
      isDismissable
      className="fixed inset-0 z-50 grid place-items-center bg-[#101814]/45 p-4"
    >
      <Modal className="pop-panel w-full max-w-md rounded-xl border border-line bg-paper shadow-2xl">
        <Dialog aria-label="Keyboard cheatsheet" className="outline-none">
          <div className="flex items-start justify-between border-b border-line px-4 py-3">
            <div>
              <h2 className="text-lg font-extrabold">Keyboard cheatsheet</h2>
              <p className="text-xs text-muted">
                Shortcuts for trajectory scrubbing and review mutations.
              </p>
            </div>
            <Button
              className="control control-quiet size-11 p-0 sm:size-9"
              onPress={close}
              aria-label="Close keyboard cheatsheet"
            >
              <IconX size={18} />
            </Button>
          </div>
          <ul className="space-y-2 p-4 text-sm">
            <li>
              <span className="font-mono text-xs font-bold">↑ ↓ ← →</span> —
              Scrub the focused trajectory timeline
            </li>
            <li>
              <span className="font-mono text-xs font-bold">Home / End</span> —
              Jump to first or last step
            </li>
            <li>
              <span className="font-mono text-xs font-bold">Ctrl/Cmd+K</span> —
              Open the command palette
            </li>
            <li>
              <span className="font-mono text-xs font-bold">Ctrl/Cmd+Z</span> —
              Undo adjudication mutation
            </li>
            <li>
              <span className="font-mono text-xs font-bold">
                Ctrl/Cmd+Shift+Z
              </span>{" "}
              — Redo adjudication mutation
            </li>
            <li>
              <span className="font-mono text-xs font-bold">Esc</span> — Close
              overlays and return focus to the opener
            </li>
          </ul>
          <div className="border-t border-line px-4 py-3 text-right">
            <Button className="control min-h-11 sm:min-h-9" onPress={close}>
              Dismiss cheatsheet
            </Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

function PrintMemoView({ trial }) {
  const open = useReviewStore((s) => s.overlays.print);
  const close = useReviewStore((s) => s.closePrintMemo);
  const memoText = useMemo(
    () => buildMemo(useReviewStore.getState()),
    [trial.id, open],
  );
  return (
    <ModalOverlay
      isOpen={open}
      onOpenChange={(value) => !value && close()}
      isDismissable
      className="fixed inset-0 z-[70] grid place-items-center bg-[#101814]/5 p-4"
    >
      <Modal className="pop-panel max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl border border-line bg-white shadow-2xl">
        <Dialog aria-label="Print-friendly review memo" className="outline-none">
          <div className="flex items-center justify-between border-b border-line px-4 py-3 print:hidden">
            <h2 className="text-lg font-extrabold">Print-friendly memo</h2>
            <div className="flex gap-2">
              <Button
                className="control control-primary min-h-11 sm:min-h-9"
                onPress={() => window.print()}
              >
                Print
              </Button>
              <Button
                className="control min-h-11 sm:min-h-9"
                onPress={close}
                aria-label="Close print memo"
              >
                Close
              </Button>
            </div>
          </div>
          <div className="scroll-thin max-h-[75vh] overflow-auto p-6 print:max-h-none print:overflow-visible">
            <article className="rich-text print-memo mx-auto max-w-[720px] text-[15px] leading-7 text-ink">
              <ReactMarkdown>{memoText}</ReactMarkdown>
            </article>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

function ReviewWorkspace() {
  const state = useReviewStore();
  const { task, trial, ui } = currentContext(state);
  const density = useReviewStore((s) => s.density);
  useEffect(() => {
    const handler = (event) => {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        state.openOverlay("palette");
      }
      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) state.redo();
        else state.undo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.openOverlay, state.undo, state.redo]);
  if (!task || !trial || !ui) return null;
  return (
    <main
      className={cx(
        "min-w-0",
        density === "comfortable" && "density-comfortable",
      )}
    >
      <WorkspaceChrome task={task} trial={trial} ui={ui} />
      <PaneSwitcher ui={ui} />
      <div className="mx-auto grid max-w-[1680px] grid-cols-1 border-x border-line min-[1025px]:grid-cols-2">
        <TrajectoryPane
          pane="agent"
          trial={trial}
          ui={ui}
          hidden={ui.focusedPane !== "agent"}
        />
        <TrajectoryPane
          pane="scorer"
          trial={trial}
          ui={ui}
          hidden={ui.focusedPane !== "scorer"}
        />
      </div>
      <div id="verdict-table-anchor">
        <VerdictWorkspace trial={trial} ui={ui} />
      </div>
      <ExportDrawer trial={trial} ui={ui} />
      <ImportSurface task={task} trial={trial} />
      <CommandPalette task={task} trial={trial} ui={ui} />
      <KeyboardCheatsheet />
      <PrintMemoView trial={trial} />
      <CoachmarksTour />
    </main>
  );
}

export default function App() {
  const view = useReviewStore((s) => s.view);
  const announcement = useReviewStore((s) => s.announcement);
  const setAnnouncement = useReviewStore((s) => s.setAnnouncement);
  useEffect(() => registerWebMCP(), []);
  useEffect(() => {
    if (!announcement) return undefined;
    const timer = window.setTimeout(() => setAnnouncement(""), 2200);
    return () => window.clearTimeout(timer);
  }, [announcement, setAnnouncement]);
  return (
    <>
      <AppHeader />
      {view === "tasks" ? (
        <TaskList />
      ) : view === "task" ? (
        <TaskDetail />
      ) : (
        <ReviewWorkspace />
      )}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-3 left-1/2 z-[100] -translate-x-1/2"
      >
        <span
          className={cx(
            "rounded-full bg-ink px-4 py-2 text-xs font-bold text-white shadow-lg transition",
            announcement ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          {announcement ? announcement.replace(/\s\d+$/, "") : ""}
        </span>
      </div>
    </>
  );
}
