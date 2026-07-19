import { useState } from "react";
import { useAtom } from "jotai";
import type { Habit } from "../types";
import { updateHabitAtom, toggleCompletionAtom, stepCompletionAtom, deleteHabitAtom, addToastAtom } from "../store";
import { todayKey, getDayCount, isDayComplete, calcStreak } from "../utils/helpers";
import FlameIcon from "./FlameIcon";
import WeeklyGrid from "./WeeklyGrid";

interface HabitCardProps {
  habit: Habit;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDragEnd?: () => void;
  onOpenHeatmap?: (id: string) => void;
}

export default function HabitCard({ habit, onDragStart, onDragOver, onDragEnd, onOpenHeatmap }: HabitCardProps) {
  const [, updateHabit] = useAtom(updateHabitAtom);
  const [, toggleComplete] = useAtom(toggleCompletionAtom);
  const [, stepComplete] = useAtom(stepCompletionAtom);
  const [, deleteHabit] = useAtom(deleteHabitAtom);
  const [, addToast] = useAtom(addToastAtom);
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(habit.name);
  const [editReminder, setEditReminder] = useState(habit.reminder);

  const today = todayKey();
  const count = getDayCount(habit, today);
  const done = isDayComplete(habit, today);
  const streak = calcStreak(habit);

  const handleToggle = () => {
    if (habit.targetType === "once") {
      toggleComplete(habit.id, today);
      if (!done) addToast("✓ Checked in!", "success");
    }
  };

  const handleStep = (delta: number) => {
    stepComplete(habit.id, today, delta);
    const newCount = Math.max(0, Math.min(habit.targetCount, count + delta));
    if (newCount >= habit.targetCount && count < habit.targetCount) {
      addToast("🎯 Daily target reached!", "success");
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

  const cardClass = `habit-row bg-[#FFFFFF] rounded-lg transition-all ${
    habit.paused ? "habit-card-paused" : "shadow-sm hover:shadow-md"
  }`;

  return (
    <div
      className={cardClass}
      draggable={!editing}
      onDragStart={(e) => onDragStart?.(e, habit.id)}
      onDragOver={(e) => onDragOver?.(e, habit.id)}
      onDragEnd={onDragEnd}
      data-habit-card
      data-habit-id={habit.id}
      data-habit-paused={habit.paused}
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
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
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
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                <circle cx="9" cy="4" r="1.5" />
                <circle cx="9" cy="9" r="1.5" />
                <circle cx="9" cy="14" r="1.5" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-[#E2E8F0] py-1 z-20 min-w-[140px]">
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
              className="px-3 py-1 bg-[#0F9D74] text-white text-xs font-medium rounded-lg hover:bg-[#0B7D5C] transition-colors"
              data-action="save-edit"
            >
              Save
            </button>
            <button
              onClick={() => { setEditing(false); setEditName(habit.name); setEditReminder(habit.reminder); }}
              className="px-3 py-1 border border-[#E2E8F0] text-[#64748B] text-xs rounded-lg hover:bg-[#F4F7F6] transition-colors"
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
                className={`complete-btn flex-shrink-0 px-3 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                  done
                    ? "bg-[#0F9D74] text-white"
                    : "border-2 border-[#E2E8F0] text-[#1B2430] hover:border-[#0F9D74] hover:text-[#0F9D74]"
                }`}
                aria-pressed={done}
                data-action="toggle-complete"
              >
                {done ? "✓ Done" : "Complete"}
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleStep(-1)}
                  className="stepper-btn rounded-lg border border-[#E2E8F0] text-[#475569] hover:border-[#EF4444] hover:text-[#EF4444] flex items-center justify-center font-bold transition-colors"
                  aria-label="Decrease count"
                  disabled={count <= 0}
                  data-action="step-dec"
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
                      className={`h-full rounded-full transition-all ${
                        done ? "bg-[#0F9D74]" : "bg-[#0F9D74]/50"
                      }`}
                      style={{ width: `${Math.min(100, (count / habit.targetCount) * 100)}%` }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleStep(1)}
                  className="stepper-btn rounded-lg bg-[#0F9D74] text-white hover:bg-[#0B7D5C] flex items-center justify-center font-bold transition-colors"
                  aria-label="Increase count"
                  disabled={count >= habit.targetCount}
                  data-action="step-inc"
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
