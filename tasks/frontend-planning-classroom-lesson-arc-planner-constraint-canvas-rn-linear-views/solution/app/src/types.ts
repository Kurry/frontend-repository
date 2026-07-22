export interface LessonBlock {
  id: string;
  title: string;
  description: string;
  status: "draft" | "ready" | "changed" | "archived" | "conflict" | "resolved";
  duration: number;
  lane: string;
}

export interface ClassroomLessonArcPlannerSession {
  schemaVersion: "v1";
  exportedAt: string;
  records: LessonBlock[];
  derived: { summary: Record<string, any> };
  history: any[];
}
