import { useState, useRef } from "react";
import { useAtom } from "jotai";
import { updateHabitAtom, deleteHabitAtom, toggleCompletionAtom, stepCompletionAtom, addToastAtom } from "../store";
import type { Habit } from "../types";
import { todayKey, getDayCount, isDayComplete, calcStreak } from "../utils/helpers";
import WeeklyGrid from "./WeeklyGrid";
import FlameIcon from "./FlameIcon";
import confetti from "canvas-confetti";

interface HabitCardProps {
  habit: Habit;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onOpenHeatmap?: (id: string) => void;
}

export default function HabitCard({ habit, onDragStart, onDragOver, onDragEnd, onOpenHeatmap }: HabitCardProps) {
  const [, updateHabit] = useAtom(updateHabitAtom);
  const [, deleteHabit] = useAtom(deleteHabitAtom);
  const [, toggleComplete] = useAtom(toggleCompletionAtom);
  const [, stepComplete] = useAtom(stepCompletionAtom);
  const [, addToast] = useAtom(addToastAtom);
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(habit.name);
  const [editReminder, setEditReminder] = useState(habit.reminder);
  const cardRef = useRef<HTMLDivElement>(null);

  const today = todayKey();
  const count = getDayCount(habit, today);
  const done = isDayComplete(habit, today);
  const streak = calcStreak(habit);

  const triggerConfetti = (rect: DOMRect) => {
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x, y },
      colors: ["#0F9D74", "#FFB020", "#FF6B20"],
    });
  };

  const handleToggle = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (habit.targetType === "once") {
      toggleComplete(habit.id, today);
      if (!done) {
        addToast("✓ Checked in!", "success");
        const newStreak = streak + 1;
        if (newStreak === 7 || newStreak === 30) {
          const rect = cardRef.current?.getBoundingClientRect();
          if (rect) triggerConfetti(rect);
        }
      }
    }
  };

  const handleStep = (e: React.MouseEvent | React.KeyboardEvent | undefined, delta: number) => {
    stepComplete(habit.id, today, delta);
    const newCount = Math.max(0, Math.min(habit.targetCount, count + delta));
    if (newCount >= habit.targetCount && count < habit.targetCount) {
      addToast("🎯 Daily target reached!", "success");
      const newStreak = streak + 1;
      if (newStreak === 7 || newStreak === 30) {
        const rect = cardRef.current?.getBoundingClientRect();
        if (rect) triggerConfetti(rect);
      }
    }
  };

  const handlePause = () => {
    updateHabit(habit.id, { paused: !habit.paused });
    addToast(habit.paused ? "Habit resumed" : "Habit paused", "info");
    setShowMenu(false);
  };

  const handleDelete = () => {
    deleteHabit(habit.id);
    addToast("Habit deleted", "info");
    setShowMenu(false);
  };

  const handleSaveEdit = () => {
    if (editName.trim()) {
      updateHabit(habit.id, { name: editName.trim(), reminder: editReminder.trim() });
      addToast("Habit updated", "success");
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!editing) {
      if (e.key === "c" || e.key === "C") {
        if (habit.targetType === "once") {
          handleToggle(e);
        } else {
          handleStep(e, 1);
        }
      }
    }
  };

  const cardClass = `habit-row bg-[#FFFFFF] rounded-[8px] transition-all focus:outline-none focus:ring-2 focus:ring-[#0F9D74] focus:ring-offset-2 ${
    habit.paused ? "habit-card-paused" : "shadow-sm hover:shadow-md"
  }`;

  return (
    <div
      ref={cardRef}
      className={cardClass}
      draggable={!editing}
      onDragStart={(e) => onDragStart?.(e, habit.id)}
      onDragOver={(e) => onDragOver?.(e, habit.id)}
      onDragEnd={onDragEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      data-habit-card
      data-habit-id={habit.id}
      data-habit-paused={habit.paused}
      aria-label={`${habit.name}, ${streak} day streak. Press C to complete.`}
    >
      <div className="p-3 md:p-4">
        {/* Top row: drag handle, icon, name, streak, menu */}
        <div className="flex items-center gap-2">
          {/* Drag handle */}
          <div
            className="cursor-grab text-[#94A3B8] hover:text-[#64748B] p-1"
            aria-label="Drag to reorder"
            title="Drag to reorder"
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3" r="1.5" />
              <circle cx="11" cy="3" r="1.5" />
              <circle cx="5" cy="8" r="1.5" />
              <circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="13" r="1.5" />
              <circle cx="11" cy="13" r="1.5" />
            </svg>
          </div>

          {/* Icon */}
          <span className="text-xl">{habit.icon}</span>

          {/* Name */}
          {editing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 px-2 py-1 rounded border border-[#0F9D74] text-sm font-semibold text-[#1B2430] outline-none"
              autoFocus
              data-field="edit-name"
            />
          ) : (
            <span className="flex-1 text-sm font-semibold text-[#1B2430] truncate">
              {habit.name}
              {habit.paused && (
                <span className="ml-2 text-xs text-[#64748B] bg-[#E2E8F0] px-1.5 py-0.5 rounded">
                  Paused
                </span>
              )}
            </span>
          )}

          {/* Streak flame */}
          <FlameIcon habit={habit} />

          {/* Menu button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-[#94A3B8] hover:text-[#1B2430] rounded transition-colors"
              aria-label="Habit options"
              data-action="menu-toggle"
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                <circle cx="9" cy="4" r="1.5" />
                <circle cx="9" cy="9" r="1.5" />
                <circle cx="9" cy="14" r="1.5" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-[8px] shadow-lg border border-[#E2E8F0] py-1 z-20 min-w-[140px]">
                <button
                  onClick={() => { setShowMenu(false); setEditing(true); }}
                  className="w-full text-left px-3 py-2 text-sm text-[#1B2430] hover:bg-[#F4F7F6] transition-colors"
                  data-action="edit"
                >
                  Edit
                </button>
                <button
                  onClick={handlePause}
                  className="w-full text-left px-3 py-2 text-sm text-[#1B2430] hover:bg-[#F4F7F6] transition-colors"
                  data-action="pause-resume"
                >
                  {habit.paused ? "Resume" : "Pause"}
                </button>
                {onOpenHeatmap && (
                  <button
                    onClick={() => { onOpenHeatmap(habit.id); setShowMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-[#1B2430] hover:bg-[#F4F7F6] transition-colors"
                    data-action="view-heatmap"
                  >
                    View Heatmap
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-3 py-2 text-sm text-[#EF4444] hover:bg-red-50 transition-colors"
                  data-action="delete"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reminder note */}
        {habit.reminder && !editing && (
          <p className="text-xs text-[#64748B] mt-1 ml-8">
            ⏰ {habit.reminder}
          </p>
        )}

        {/* Edit reminder */}
        {editing && (
          <div className="mt-2 ml-8">
            <input
              type="text"
              value={editReminder}
              onChange={(e) => setEditReminder(e.target.value)}
              placeholder="Remind me at (e.g. 7:00 AM)"
              className="w-full px-2 py-1 rounded border border-[#E2E8F0] text-xs text-[#1B2430] outline-none focus:border-[#0F9D74]"
              data-field="edit-reminder"
            />
          </div>
        )}

        {/* Edit buttons */}
        {editing && (
          <div className="flex gap-2 mt-2 ml-8">
            <button
              onClick={handleSaveEdit}
              className="px-3 py-1 bg-[#0F9D74] text-white text-xs font-medium rounded-[8px] hover:bg-[#0B7D5C] transition-colors"
              data-action="save-edit"
            >
              Save
            </button>
            <button
              onClick={() => { setEditing(false); setEditName(habit.name); setEditReminder(habit.reminder); }}
              className="px-3 py-1 border border-[#E2E8F0] text-[#64748B] text-xs rounded-[8px] hover:bg-[#F4F7F6] transition-colors"
              data-action="cancel-edit"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Action row */}
        {!editing && (
          <div className="flex items-center justify-between mt-3 ml-8 gap-4">
            {/* Weekly grid */}
            <WeeklyGrid habit={habit} />

            {/* Complete/Stepper control */}
            {habit.targetType === "once" ? (
              <button
                type="button"
                onClick={handleToggle}
                className={`complete-btn flex-shrink-0 px-3 rounded-[8px] flex items-center justify-center text-sm font-bold transition-all ${
                  done
                    ? "bg-[#0F9D74] text-white"
                    : "border-2 border-[#E2E8F0] text-[#1B2430] hover:border-[#0F9D74] hover:text-[#0F9D74]"
                }`}
                aria-pressed={done}
                data-action="toggle-complete"
                tabIndex={-1}
              >
                {done ? "✓ Done" : "Complete"}
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleStep(e, -1)}
                  className="stepper-btn rounded-[8px] border border-[#E2E8F0] text-[#475569] hover:border-[#EF4444] hover:text-[#EF4444] flex items-center justify-center font-bold transition-colors"
                  aria-label="Decrease count"
                  disabled={count <= 0}
                  data-action="step-dec"
                  tabIndex={-1}
                >
                  −
                </button>
                <div className="flex flex-col items-center min-w-[52px]">
                  <span className={`text-sm font-bold ${done ? "text-[#0F9D74]" : "text-[#1B2430]"}`}>
                    {count}/{habit.targetCount}
                  </span>
                  {/* Mini progress bar */}
                  <div className="w-12 h-1 rounded-full bg-[#E2E8F0] mt-0.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        done ? "bg-[#0F9D74]" : "bg-[#0F9D74]/50"
                      }`}
                      style={{ width: `${Math.min(100, (count / habit.targetCount) * 100)}%` }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleStep(e, 1)}
                  className="stepper-btn rounded-[8px] bg-[#0F9D74] text-white hover:bg-[#0B7D5C] flex items-center justify-center font-bold transition-colors"
                  aria-label="Increase count"
                  disabled={count >= habit.targetCount}
                  data-action="step-inc"
                  tabIndex={-1}
                >
                  +
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
