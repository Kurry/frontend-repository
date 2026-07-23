import { useRef } from "react";
import { useAtom } from "jotai";
import { addHabitAtom, categoriesAtom } from "../store";
import { EMOJI_PALETTE } from "../types";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const habitSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "name must be non-empty")
    .max(80, "name must be 80 characters or fewer"),
  icon: z.string().refine((val) => EMOJI_PALETTE.includes(val as (typeof EMOJI_PALETTE)[number]), {
    message: "icon must be one of the fixed emoji palette",
  }),
  targetType: z.enum(["once", "count"]),
  targetCount: z
    .number()
    .int("targetCount must be an integer between 1 and 100")
    .min(1, "targetCount must be an integer between 1 and 100")
    .max(100, "targetCount must be an integer between 1 and 100"),
  categoryId: z.string().nullable().optional(),
  reminder: z
    .string()
    .trim()
    .max(40, "reminder must be 40 characters or fewer")
    .optional()
    .default(""),
}).refine(
  (data) => !(data.targetType === "once" && data.targetCount !== 1),
  {
    message: "targetCount must be 1 when targetType is once",
    path: ["targetCount"],
  }
);

type HabitFormValues = z.infer<typeof habitSchema>;

interface HabitFormProps {
  onClose?: () => void;
}

export default function HabitForm({ onClose }: HabitFormProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);

  const [, addHabit] = useAtom(addHabitAtom);
  const [categories] = useAtom(categoriesAtom);

  const {
    register,
    handleSubmit,
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
    // Guard against rapid double-activation of the submit control: exactly one
    // habit may be created per completed submit.
    if (submittingRef.current) return;
    submittingRef.current = true;
    window.setTimeout(() => {
      submittingRef.current = false;
    }, 600);

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
    const nodes: (HTMLElement | null)[] = [
      formRef.current,
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]') ?? null,
    ];
    nodes.forEach((n) => n?.classList.add("shake"));
    setTimeout(() => nodes.forEach((n) => n?.classList.remove("shake")), 700);
  };

  return (
    <div ref={formRef} className="bg-[#FFFFFF] rounded-[8px] p-4 md:p-6" data-habit-form>
      <h2 className="text-xl font-bold text-[#1B2430] mb-4">New habit</h2>
      <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4" noValidate data-habit-form-el>
        {/* Name */}
        <div>
          <label htmlFor="habit-name" className="block text-sm font-medium text-[#64748B] mb-1">
            Habit name
          </label>
          <input
            id="habit-name"
            type="text"
            {...register("name")}
            placeholder="e.g. Morning run"
            className={`w-full px-3 py-2 rounded-[8px] border text-sm transition-colors ${
              errors.name
                ? "border-[#EF4444] bg-red-50"
                : "border-[#E2E8F0] focus:border-[#0F9D74]"
            } text-[#1B2430] placeholder:text-[#94A3B8] outline-none`}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "habit-name-error" : undefined}
            data-field="name"
          />
          {errors.name && (
            <p id="habit-name-error" className="text-[#EF4444] text-xs mt-1" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Icon picker — fieldset/legend gives the group a programmatic label */}
        <fieldset className="border-0 p-0 m-0" aria-describedby={errors.icon ? "habit-icon-error" : undefined}>
          <legend className="block text-sm font-medium text-[#64748B] mb-1 p-0">Icon</legend>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Habit icon">
            {EMOJI_PALETTE.map((e) => (
              <button
                key={e}
                type="button"
                role="radio"
                aria-checked={icon === e}
                onClick={() => setValue("icon", e)}
                className={`w-9 h-9 rounded-[8px] flex items-center justify-center text-lg transition-all ${
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
            <p id="habit-icon-error" className="text-[#EF4444] text-xs mt-1" role="alert">
              {errors.icon.message}
            </p>
          )}
        </fieldset>

        {/* Target type — fieldset/legend labels the radio group */}
        <fieldset className="border-0 p-0 m-0">
          <legend className="block text-sm font-medium text-[#64748B] mb-1 p-0">Target</legend>
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
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="count"
                {...register("targetType")}
                className="accent-[#0F9D74]"
                data-field="target-type"
                data-value="count"
              />
              <span className="text-sm text-[#1B2430]">Daily count</span>
            </label>
            {targetType === "count" && (
              <span className="flex items-center gap-2">
                <label htmlFor="habit-target-count" className="text-sm font-medium text-[#64748B]">
                  Daily target count
                </label>
                <input
                  id="habit-target-count"
                  type="number"
                  min="1"
                  max="100"
                  {...register("targetCount", { valueAsNumber: true })}
                  className={`w-16 px-2 py-1 rounded-[8px] border text-sm text-[#1B2430] outline-none ${
                    errors.targetCount ? "border-[#EF4444] bg-red-50" : "border-[#E2E8F0] focus:border-[#0F9D74]"
                  }`}
                  aria-invalid={!!errors.targetCount}
                  aria-describedby={errors.targetCount ? "target-count-error" : undefined}
                  data-field="target-count"
                />
              </span>
            )}
          </div>
          {errors.targetCount && (
            <p id="target-count-error" className="text-[#EF4444] text-xs mt-1" role="alert">
              {errors.targetCount.message}
            </p>
          )}
        </fieldset>

        {/* Category */}
        <div>
          <label htmlFor="habit-category" className="block text-sm font-medium text-[#64748B] mb-1">
            Category
          </label>
          <select
            id="habit-category"
            {...register("categoryId")}
            className="w-full px-3 py-2 rounded-[8px] border border-[#E2E8F0] text-sm text-[#1B2430] outline-none focus:border-[#0F9D74] bg-white"
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
          <label htmlFor="habit-reminder" className="block text-sm font-medium text-[#64748B] mb-1">
            Remind me at (optional)
          </label>
          <input
            id="habit-reminder"
            type="text"
            {...register("reminder")}
            placeholder="e.g. 7:00 AM"
            className={`w-full px-3 py-2 rounded-[8px] border text-sm text-[#1B2430] placeholder:text-[#94A3B8] outline-none ${
              errors.reminder ? "border-[#EF4444] bg-red-50" : "border-[#E2E8F0] focus:border-[#0F9D74]"
            }`}
            aria-invalid={!!errors.reminder}
            aria-describedby={errors.reminder ? "habit-reminder-error" : undefined}
            data-field="reminder"
          />
          {errors.reminder && (
            <p id="habit-reminder-error" className="text-[#EF4444] text-xs mt-1" role="alert">
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
