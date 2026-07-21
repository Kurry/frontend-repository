import { z } from 'zod';

export const TaskUpsertSchema = z.object({
  title: z.string().trim().min(1, "title must be 1 to 120 characters").max(120, "title must be 1 to 120 characters"),
  status: z.enum(["todo", "in_progress", "done", "blocked"], {
    errorMap: () => ({ message: "status must be todo, in_progress, done, or blocked" })
  }),
  priority: z.enum(["low", "medium", "high", "urgent"], {
    errorMap: () => ({ message: "priority must be low, medium, high, or urgent" })
  }),
  dueDate: z.string().optional().nullable().refine(val => {
    if (!val) return true;
    return /^\d{4}-\d{2}-\d{2}$/.test(val);
  }, { message: "dueDate must be empty or YYYY-MM-DD" }),
  // parentId and tags are not typically collected in the simple UI form directly, but part of the API payload.
  // We'll validate them during store actions or full object validation.
});

export const TagUpsertSchema = z.object({
  name: z.string().trim().min(1, "name must be 1 to 40 characters").max(40, "name must be 1 to 40 characters"),
  color: z.enum([
    '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981',
    '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#F43F5E'
  ], {
    errorMap: () => ({ message: "color must be one of the allowed hex codes" })
  })
});
