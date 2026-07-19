import { useState, useRef } from "react";
import { useAtom } from "jotai";
import { addHabitAtom, categoriesAtom, addToastAtom } from "../store";
import { EMOJI_PALETTE } from "../types";

interface HabitFormProps {
  onClose?: () => void;
}

export default function HabitForm({ onClose }: HabitFormProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [targetType, setTargetType] = useState<"once" | "count">("once");
  const [targetCount, setTargetCount] = useState(1);
  const [categoryId, setCategoryId] = useState<string>("");
  const [reminder, setReminder] = useState("");
  const [nameError, setNameError] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const [, addHabit] = useAtom(addHabitAtom);
  const [categories] = useAtom(categoriesAtom);
  const [, addToast] = useAtom(addToastAtom);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(true);
      formRef.current?.classList.add("shake");
      setTimeout(() => formRef.current?.classList.remove("shake"), 500);
      return;
    }

    addHabit({
      name: trimmed,
      icon,
      targetType,
      targetCount: targetType === "count" ? Math.max(1, targetCount) : 1,
      categoryId: categoryId || null,
      reminder: reminder.trim(),
      paused: false,
    });

    addToast(`"${trimmed}" added!`, "success");

    // Reset form
    setName("");
    setIcon("🎯");
    setTargetType("once");
    setTargetCount(1);
    setCategoryId("");
    setReminder("");
    setNameError(false);

    if (onClose) onClose();
  };

  return (
    <div ref={formRef} className="bg-[#FFFFFF] rounded-lg p-4 md:p-6" data-habit-form>
      <h2 className="text-lg font-bold text-[#1B2430] mb-4">New Habit</h2>
      <form onSubmit={handleSubmit} className="space-y-4" data-habit-form-el>
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-[#64748B] mb-1">Habit Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError && e.target.value.trim()) setNameError(false);
            }}
            placeholder="e.g. Morning Run"
            className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors ${
              nameError
                ? "border-[#EF4444] bg-red-50"
                : "border-[#E2E8F0] focus:border-[#0F9D74]"
            } text-[#1B2430] placeholder:text-[#94A3B8] outline-none`}
            aria-label="Habit name"
            aria-invalid={nameError}
            data-field="name"
          />
          {nameError && (
            <p className="text-[#EF4444] text-xs mt-1" role="alert">
              Please enter a habit name.
            </p>
          )}
        </div>

        {/* Icon picker */}
        <div>
          <label className="block text-sm font-medium text-[#64748B] mb-1">Icon</label>
          <div className="flex flex-wrap gap-1.5">
            {EMOJI_PALETTE.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setIcon(e)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                  icon === e
                    ? "bg-[#0F9D74] ring-2 ring-[#0F9D74] scale-110"
                    : "bg-[#F4F7F6] hover:bg-[#E2E8F0]"
                }`}
                aria-label={`Select emoji ${e}`}
                data-field="icon"
                data-value={e}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Target type */}
        <div>
          <label className="block text-sm font-medium text-[#64748B] mb-1">Target</label>
          <div className="flex gap-3 items-center flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="targetType"
                value="once"
                checked={targetType === "once"}
                onChange={() => setTargetType("once")}
                className="accent-[#0F9D74]"
                data-field="target-type"
                data-value="once"
              />
              <span className="text-sm text-[#1B2430]">Once a day</span>
            </label>
            <label className="flex items-center gap-2 cursor-center">
              <input
                type="radio"
                name="targetType"
                value="count"
                checked={targetType === "count"}
                onChange={() => setTargetType("count")}
                className="accent-[#0F9D74]"
                data-field="target-type"
                data-value="count"
              />
              <span className="text-sm text-[#1B2430]">Daily count:</span>
              {targetType === "count" && (
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={targetCount}
                  onChange={(e) => setTargetCount(parseInt(e.target.value, 10) || 1)}
                  className="w-16 px-2 py-1 rounded-lg border border-[#E2E8F0] text-sm text-[#1B2430] outline-none focus:border-[#0F9D74]"
                  aria-label="Daily target count"
                  data-field="target-count"
                />
              )}
            </label>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-[#64748B] mb-1">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#1B2430] outline-none focus:border-[#0F9D74] bg-white"
            aria-label="Category"
            data-field="category"
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Reminder */}
        <div>
          <label className="block text-sm font-medium text-[#64748B] mb-1">Remind me at (optional)</label>
          <input
            type="text"
            value={reminder}
            onChange={(e) => setReminder(e.target.value)}
            placeholder="e.g. 7:00 AM"
            className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#1B2430] placeholder:text-[#94A3B8] outline-none focus:border-[#0F9D74]"
            aria-label="Reminder time"
            data-field="reminder"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="btn-primary flex-1 font-semibold text-sm"
            data-action="submit-habit"
          >
            Create habit
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-4 font-medium text-sm"
              data-action="cancel-habit"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
