// 28 commitments, 146 activity events, 12 calendar blocks, 4 goals, 8 interruptions, 3 split outcomes, 2 duplicated evidence candidates
// 40-hour next-week capacity budget

export const FIXTURE_HASH = "fixture-hash-93d8a2f1";

export const initialClock = {
  currentWeek: 6, // 6 fictional weeks
  lateCutoff: "2024-05-18T00:00:00Z"
};

export const generateFixtures = () => {
  const commitments = Array.from({ length: 28 }, (_, i) => ({
    id: `commit-${i+1}`,
    title: `Commitment ${i+1}`,
    plannedMinutes: 60 + (i % 4) * 30, // 60, 90, 120, 150
    plannedStart: `2024-05-1${(i % 7) + 1}T10:00:00Z`,
    plannedEnd: `2024-05-1${(i % 7) + 1}T11:00:00Z`,
    status: 'planned'
  }));

  const events = Array.from({ length: 146 }, (_, i) => ({
    id: `ev-${i+1}`,
    title: `Activity Event ${i+1}`,
    observedMinutes: 15 + (i % 4) * 15,
    timestamp: `2024-05-1${(i % 7) + 1}T10:30:00Z`
  }));

  // adding a late event
  events[145].timestamp = "2024-05-19T10:00:00Z";

  const blocks = Array.from({ length: 12 }, (_, i) => ({
    id: `block-${i+1}`,
    title: `Calendar Block ${i+1}`
  }));

  const goals = Array.from({ length: 4 }, (_, i) => ({
    id: `goal-${i+1}`,
    title: `Goal ${i+1}`
  }));

  const interruptions = Array.from({ length: 8 }, (_, i) => ({
    id: `int-${i+1}`,
    title: `Interruption ${i+1}`
  }));

  return {
    commitments,
    events,
    blocks,
    goals,
    interruptions,
    budgetHours: 40
  };
};
