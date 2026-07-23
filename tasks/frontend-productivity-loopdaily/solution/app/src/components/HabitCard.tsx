import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { motion, useReducedMotion } from "motion/react";
import confetti from "canvas-confetti";
import {
  DotsSixVertical,
  PencilSimple,
  ChartBar,
  Pause as PauseIcon,
  Play as PlayIcon,
  Trash,
  Check,
  Plus,
  Minus,
} from "@phosphor-icons/react";
import {
  updateHabitAtom,
  toggleCompletionAtom,
  stepCompletionAtom,
  deleteHabitAtom,
} from "../store";
import type { Habit } from "../types";
import { getDayCount, isDayComplete, calcStreak, todayKey } from "../utils/helpers";
import WeeklyGrid from "./WeeklyGrid";
import FlameIcon, { flameTier } from "./FlameIcon";
import { toast } from "sonner";
import Modal from "./ui/modal";

interface HabitCardProps {
  habit: Habit;
  onOpenHeatmap: (id: string) => void;
  /** Pointer-down on the drag handle starts a pointer-driven reorder drag. */
  onDragHandlePointerDown?: (e: React.PointerEvent, habitId: string) => void;
  /** ArrowUp/ArrowDown on the drag handle moves the habit one slot. */
  onMoveByKey?: (habitId: string, direction: -1 | 1) => void;
}

const fireConfetti = (element: HTMLElement | null, tier: "bright" | "gold") => {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;
  const gold = tier === "gold";
  const colors = gold ? ["#FFB020", "#FFD34D", "#FF8C42"] : ["#FFB020", "#0F9D74", "#FFD34D"];
  // Two-stage burst: an immediate wide spray, then a softer trailing burst —
  // the extra beat beyond a minimum single pop.
  confetti({ particleCount: gold ? 90 : 60, spread: gold ? 90 : 70, startVelocity: 38, origin: { x, y }, colors, disableForReducedMotion: true, scalar: gold ? 1.1 : 1 });
  window.setTimeout(() => {
    confetti({ particleCount: gold ? 50 : 30, spread: 110, startVelocity: 22, origin: { x, y: y + 0.04 }, colors, disableForReducedMotion: true, ticks: 160 });
  }, 140);
};

export default function HabitCard({ habit, onOpenHeatmap, onDragHandlePointerDown, onMoveByKey }: HabitCardProps) {
  const [, updateHabit] = useAtom(updateHabitAtom);
  const [, toggleComplete] = useAtom(toggleCompletionAtom);
  const [, stepComplete] = useAtom(stepCompletionAtom);
  const [, deleteHabit] = useAtom(deleteHabitAtom);
  const prefersReduced = useReducedMotion();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(habit.name);
  const [editReminder, setEditReminder] = useState(habit.reminder);
  const [leaving, setLeaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pulse, setPulse] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const today = todayKey();
  const count = getDayCount(habit, today);
  const done = isDayComplete(habit, today);
  const currentStreak = calcStreak(habit);

  useEffect(() => {
    setEditName(habit.name);
    setEditReminder(habit.reminder);
  }, [habit.name, habit.reminder]);

  const celebrateIfMilestone = (beforeStreak: number, afterStreak: number) => {
    const crossed = (beforeStreak < 7 && afterStreak >= 7) || (beforeStreak < 30 && afterStreak >= 30);
    if (!crossed || prefersReduced) return;
    const tier = afterStreak >= 30 ? "gold" : "bright";
    fireConfetti(cardRef.current, tier);
    setPulse(true);
    window.setTimeout(() => setPulse(false), 720);
  };

  const handleToggle = () => {
    if (habit.targetType !== "once") return;
    const before = currentStreak;
    toggleComplete(habit.id, today);
    if (!done) {
      toast.success("Checked in — nice work!");
      const temp = { ...habit, completions: { ...habit.completions, [today]: 1 } };
      celebrateIfMilestone(before, calcStreak(temp));
    } else {
      toast.info("Check-in undone");
    }
  };

  const handleStep = (delta: number) => {
    const before = currentStreak;
    stepComplete(habit.id, today, delta);
    const newCount = Math.max(0, Math.min(habit.targetCount, count + delta));
    if (newCount >= habit.targetCount && count < habit.targetCount) {
      toast.success("Daily target reached!");
      const temp = { ...habit, completions: { ...habit.completions, [today]: newCount } };
      celebrateIfMilestone(before, calcStreak(temp));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editing) return;
    if (e.key === "c" || e.key === "C") {
      e.preventDefault();
      if (habit.targetType === "once") handleToggle();
      else handleStep(1);
    }
  };

  const beginLeave = (after: () => void) => {
    if (prefersReduced) {
      after();
      return;
    }
    setLeaving(true);
    window.setTimeout(after, 200);
  };

  const handlePause = () => {
    if (habit.paused) {
      updateHabit(habit.id, { paused: false });
      toast.success("Habit resumed");
    } else {
      beginLeave(() => {
        updateHabit(habit.id, { paused: true });
        toast.info("Habit paused — history kept");
      });
    }
  };

  const confirmDeleteHabit = () => {
    setConfirmDelete(false);
    beginLeave(() => {
      deleteHabit(habit.id);
      toast.info("Habit deleted");
    });
  };

  const handleSaveEdit = () => {
    const name = editName.trim();
    if (!name) return;
    updateHabit(habit.id, { name, reminder: editReminder.trim().slice(0, 40) });
    setEditing(false);
    toast.success("Habit updated");
  };

  const tier = flameTier(currentStreak);
  const fraction = habit.targetType === "count" ? count / habit.targetCount : done ? 1 : 0;

  return (
    <>
      <motion.div
        ref={cardRef}
        data-habit-card
        data-habit-id={habit.id}
        data-habit-paused={habit.paused}
        data-habit-count={count}
        data-habit-streak={currentStreak}
        tabIndex={0}
        role="group"
        aria-label={`${habit.name}, ${currentStreak} day streak${habit.paused ? ", paused" : ""}. Press C to check in.`}
        onKeyDown={handleKeyDown}
        layout
        initial={{ opacity: 0, scale: 0.96, y: 6 }}
        animate={leaving ? { opacity: 0, scale: 0.94, x: -12 } : { opacity: 1, scale: 1, y: 0, x: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className={`habit-row outline-none ${habit.paused ? "habit-card-paused" : ""} ${pulse ? "milestone-pulse" : ""}`}
      >
        <div className="p-3 md:p-4">
          <div className="flex items-center gap-2">
            {/* Drag handle: pointer drag reorders; ArrowUp/ArrowDown also move the habit */}
            <button
              type="button"
              className="drag-handle rounded-[8px] p-1"
              aria-label={`Drag to reorder ${habit.name}. Press arrow up or arrow down to move it.`}
              title="Drag to reorder"
              onPointerDown={(e) => onDragHandlePointerDown?.(e, habit.id)}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  e.stopPropagation();
                  onMoveByKey?.(habit.id, -1);
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  e.stopPropagation();
                  onMoveByKey?.(habit.id, 1);
                }
              }}
              data-action="drag-handle"
            >
              <DotsSixVertical size={18} weight="bold" aria-hidden="true" />
            </button>

            <span className="text-xl leading-none" aria-hidden="true">
              {habit.icon}
            </span>

            {editing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 min-w-0 px-2 py-1 rounded-[8px] border border-[#0F9D74] text-sm font-semibold text-[#1B2430] outline-none"
                autoFocus
                data-field="edit-name"
                aria-label="Edit habit name"
              />
            ) : (
              <span className="flex-1 min-w-0 flex items-center gap-2">
                <span className="truncate text-base font-bold text-[#1B2430]">{habit.name}</span>
                {habit.paused && (
                  <span className="shrink-0 rounded-[8px] bg-[#E2E8F0] px-2 py-0.5 text-[11px] font-semibold text-[#64748B]">
                    Paused
                  </span>
                )}
              </span>
            )}

            <FlameIcon habit={habit} />

            {!editing && (
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  className="btn-icon"
                  aria-label={`Edit ${habit.name}`}
                  title="Edit"
                  onClick={() => setEditing(true)}
                  data-action="edit"
                >
                  <PencilSimple size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  aria-label={`View heatmap for ${habit.name}`}
                  title="Heatmap"
                  onClick={() => onOpenHeatmap(habit.id)}
                  data-action="view-heatmap"
                >
                  <ChartBar size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  aria-label={habit.paused ? `Resume ${habit.name}` : `Pause ${habit.name}`}
                  title={habit.paused ? "Resume" : "Pause"}
                  onClick={handlePause}
                  data-action="pause-resume"
                >
                  {habit.paused ? <PlayIcon size={18} aria-hidden="true" /> : <PauseIcon size={18} aria-hidden="true" />}
                </button>
                <button
                  type="button"
                  className="btn-icon text-[#EF4444] hover:bg-[#FEF2F2] hover:text-[#EF4444]"
                  aria-label={`Delete ${habit.name}`}
                  title="Delete"
                  onClick={() => setConfirmDelete(true)}
                  data-action="delete"
                >
                  <Trash size={18} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          {habit.reminder && !editing && (
            <p className="mt-1 ml-9 text-xs text-[#64748B]">Remind me at {habit.reminder}</p>
          )}

          {editing && (
            <div className="mt-2 ml-9 space-y-2">
              <input
                type="text"
                value={editReminder}
                onChange={(e) => setEditReminder(e.target.value)}
                placeholder="Remind me at (e.g. 7:00 AM)"
                maxLength={40}
                className="w-full px-2 py-1 rounded-[8px] border border-[#E2E8F0] text-xs text-[#1B2430] outline-none focus:border-[#0F9D74]"
                data-field="edit-reminder"
                aria-label="Edit reminder"
              />
              <div className="flex gap-2">
                <button type="button" onClick={handleSaveEdit} className="btn-primary px-3 py-1.5 text-xs font-semibold" data-action="save-edit">
                  Save changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setEditName(habit.name);
                    setEditReminder(habit.reminder);
                  }}
                  className="btn-secondary px-3 py-1.5 text-xs font-medium"
                  data-action="cancel-edit"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!editing && (
            <div className="mt-3 ml-9 flex flex-wrap items-center justify-between gap-3">
              <WeeklyGrid habit={habit} />

              {habit.targetType === "once" ? (
                <button
                  type="button"
                  onClick={handleToggle}
                  aria-pressed={done}
                  data-action="toggle-complete"
                  className={`complete-btn inline-flex items-center justify-center gap-1.5 rounded-[8px] px-4 text-sm font-bold ${
                    done
                      ? "bg-[#0F9D74] text-white"
                      : "border-2 border-[#E2E8F0] bg-[#FFFFFF] text-[#1B2430] hover:border-[#0F9D74] hover:text-[#0F9D74]"
                  }`}
                >
                  {done ? <Check size={16} weight="bold" aria-hidden="true" /> : null}
                  {done ? "Done today" : "Complete"}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  {/* The steppers stay enabled at their bounds: a minus tap at zero
                      and a plus tap at target are visible no-ops (the store clamps),
                      so rapid repeated taps never dead-end on a disabled control. */}
                  <button
                    type="button"
                    onClick={() => handleStep(-1)}
                    aria-label="Decrease count by one"
                    data-action="step-dec"
                    className={`stepper-btn inline-flex items-center justify-center rounded-[8px] border border-[#E2E8F0] bg-[#FFFFFF] text-[#1B2430] hover:border-[#EF4444] hover:text-[#EF4444] ${
                      count <= 0 ? "stepper-btn-limit" : ""
                    }`}
                  >
                    <Minus size={16} weight="bold" aria-hidden="true" />
                  </button>
                  <div className="flex min-w-[64px] flex-col items-center">
                    <span
                      key={count}
                      className={`frac-pop text-sm font-bold tabular-nums ${done ? "text-[#0F9D74]" : "text-[#1B2430]"}`}
                      data-fraction
                      aria-live="polite"
                    >
                      {count}/{habit.targetCount}
                    </span>
                    <div className="mt-1 h-2 w-16 overflow-hidden rounded-[8px] bg-[#E2E8F0]">
                      <div
                        className={`progress-fill h-full rounded-[8px] ${done ? "bg-[#0F9D74]" : "bg-[#0F9D74]/60"}`}
                        style={{ width: `${Math.min(100, fraction * 100)}%` }}
                        data-progress-bar
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStep(1)}
                    aria-label="Increase count by one"
                    data-action="step-inc"
                    className={`stepper-btn inline-flex items-center justify-center rounded-[8px] bg-[#0F9D74] text-white hover:bg-[#0B7D5C] ${
                      count >= habit.targetCount ? "stepper-btn-limit" : ""
                    }`}
                  >
                    <Plus size={16} weight="bold" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Delete “${habit.name}”?`}
        description="This permanently removes the habit and all of its check-in history. This cannot be undone."
      >
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="btn-secondary px-4 py-2 text-sm font-medium"
            onClick={() => setConfirmDelete(false)}
            data-action="cancel-delete"
          >
            Keep habit
          </button>
          <button
            type="button"
            className="btn-danger px-4 py-2 text-sm font-semibold"
            onClick={confirmDeleteHabit}
            data-action="confirm-delete"
          >
            Delete habit
          </button>
        </div>
      </Modal>
    </>
  );
}
