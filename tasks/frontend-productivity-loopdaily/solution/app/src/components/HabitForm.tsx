import { useRef } from "react";
import { useAtom } from "jotai";
import { addHabitAtom, categoriesAtom } from "../store";
import { EMOJI_PALETTE } from "../types";
import { toast } from "sonner";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const habitSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Name must be 80 characters or fewer"),
  icon: z.string().refine((val) => EMOJI_PALETTE.includes(val as any), {
    message: "Invalid icon",
  }),
  targetType: z.enum(["once", "count"]),
  targetCount: z.number().int().min(1).max(100),
  categoryId: z.string().nullable().optional(),
  reminder: z.string().trim().max(40, "Reminder must be 40 characters or fewer").optional().default(""),
}).refine(data => {
  if (data.targetType === "once" && data.targetCount !== 1) return false;
  return true;
}, {
  message: "Target count must be 1 when target is once",
  path: ["targetCount"],
});

type HabitFormValues = z.infer<typeof habitSchema>;

interface HabitFormProps {
  onClose?: () => void;
}

export default function HabitForm({ onClose }: HabitFormProps) {
  const formRef = useRef<HTMLDivElement>(null);

  const [, addHabit] = useAtom(addHabitAtom);
  const [categories] = useAtom(categoriesAtom);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<HabitFormValues>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: "",
      icon: "🎯",
      targetType: "once",
      targetCount: 1,
      categoryId: "",
      reminder: "",
    },
  });

  const targetType = watch("targetType");
  const icon = watch("icon");

  const onSubmit = (data: HabitFormValues) => {
    addHabit({
      name: data.name,
      icon: data.icon,
      targetType: data.targetType,
      targetCount: data.targetType === "count" ? data.targetCount : 1,
      categoryId: data.categoryId || null,
      reminder: data.reminder || "",
      paused: false,
    });

    toast.success(`"${data.name}" added!`);

    reset();
    if (onClose) onClose();
  };

  const onError = () => {
    formRef.current?.classList.add("shake");
    setTimeout(() => formRef.current?.classList.remove("shake"), 500);
  };

  return (
    <div ref={formRef} className="bg-[#FFFFFF] rounded-lg p-4 md:p-6" data-habit-form>
      <h2 className="text-lg font-bold text-[#1B2430] mb-4">New Habit</h2>
      <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4" data-habit-form-el>
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-[#64748B] mb-1">Habit Name</label>
          <input
            type="text"
            {...register("name")}
            placeholder="e.g. Morning Run"
            className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors ${
              errors.name
                ? "border-[#EF4444] bg-red-50"
                : "border-[#E2E8F0] focus:border-[#0F9D74]"
            } text-[#1B2430] placeholder:text-[#94A3B8] outline-none`}
            aria-label="Habit name"
            aria-invalid={!!errors.name}
            data-field="name"
          />
          {errors.name && (
            <p className="text-[#EF4444] text-xs mt-1" role="alert">
              {errors.name.message}
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
                onClick={() => setValue("icon", e)}
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
          {errors.icon && (
            <p className="text-[#EF4444] text-xs mt-1" role="alert">
              {errors.icon.message}
            </p>
          )}
        </div>

        {/* Target type */}
        <div>
          <label className="block text-sm font-medium text-[#64748B] mb-1">Target</label>
          <div className="flex gap-3 items-center flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="once"
                {...register("targetType")}
                onChange={() => {
                  setValue("targetType", "once");
                  setValue("targetCount", 1);
                }}
                className="accent-[#0F9D74]"
                data-field="target-type"
                data-value="once"
              />
              <span className="text-sm text-[#1B2430]">Once a day</span>
            </label>
            <label className="flex items-center gap-2 cursor-center">
              <input
                type="radio"
                value="count"
                {...register("targetType")}
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
                  {...register("targetCount", { valueAsNumber: true })}
                  className="w-16 px-2 py-1 rounded-lg border border-[#E2E8F0] text-sm text-[#1B2430] outline-none focus:border-[#0F9D74]"
                  aria-label="Daily target count"
                  data-field="target-count"
                />
              )}
            </label>
          </div>
          {errors.targetCount && (
            <p className="text-[#EF4444] text-xs mt-1" role="alert">
              {errors.targetCount.message}
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-[#64748B] mb-1">Category</label>
          <select
            {...register("categoryId")}
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
            {...register("reminder")}
            placeholder="e.g. 7:00 AM"
            className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#1B2430] placeholder:text-[#94A3B8] outline-none focus:border-[#0F9D74]"
            aria-label="Reminder time"
            data-field="reminder"
          />
          {errors.reminder && (
            <p className="text-[#EF4444] text-xs mt-1" role="alert">
              {errors.reminder.message}
            </p>
          )}
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
              onClick={() => { reset(); onClose(); }}
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
