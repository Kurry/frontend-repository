import { useState, useCallback, useEffect } from "react";
import { useAtom } from "jotai";
import { habitsAtom, activeFilterAtom, reorderHabitsAtom, addToastAtom } from "./store";
import HabitCard from "./components/HabitCard";
import HabitForm from "./components/HabitForm";
import CategoryFilter from "./components/CategoryFilter";
import HeatmapView from "./components/HeatmapView";
import StatsView from "./components/StatsView";
import ImportExport from "./components/ImportExport";
import Toast from "./components/Toast";
import RecoveryBanner from "./components/RecoveryBanner";
import { useAutoAnimate } from "@formkit/auto-animate/react";

type ViewMode = "habits" | "stats" | "heatmap" | "import";

export default function App() {
  const [habits] = useAtom(habitsAtom);
  const [activeFilter] = useAtom(activeFilterAtom);
  const [, reorder] = useAtom(reorderHabitsAtom);
  const [, addToast] = useAtom(addToastAtom);
  const [view, setView] = useState<ViewMode>("habits");
  const [heatmapHabitId, setHeatmapHabitId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const [activeListRef] = useAutoAnimate<HTMLDivElement>();
  const [pausedListRef] = useAutoAnimate<HTMLDivElement>();

  useEffect(() => {
    const savedView = localStorage.getItem("loopdaily-last-view");
    if (savedView && ["habits", "stats", "import"].includes(savedView)) {
      setView(savedView as ViewMode);
    }
  }, []);

  const handleSetView = (newView: ViewMode) => {
    setView(newView);
    if (newView !== "heatmap") {
      localStorage.setItem("loopdaily-last-view", newView);
    }
  };

  // Filtered habits sorted by order
  const sortedHabits = [...habits].sort((a, b) => a.order - b.order);
  const filteredHabits = activeFilter
    ? sortedHabits.filter((h) => h.categoryId === activeFilter)
    : sortedHabits;

  // Separate active and paused
  const activeHabits = filteredHabits.filter((h) => !h.paused);
  const pausedHabits = filteredHabits.filter((h) => h.paused);

  // Drag and drop handlers
  const handleDragStart = useCallback(
    (e: React.DragEvent, id: string) => {
      setDragId(id);
      e.currentTarget.classList.add("dragging");
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, id: string) => {
      e.preventDefault();
      if (id !== dragId) {
        setDragOverId(id);
      }
    },
    [dragId]
  );

  const handleDragEnd = useCallback(() => {
    setDragId(null);
    setDragOverId(null);
    document.querySelectorAll(".dragging").forEach((el) => el.classList.remove("dragging"));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      if (!dragId || dragId === targetId) return;

      const fromIndex = sortedHabits.findIndex((h) => h.id === dragId);
      const toIndex = sortedHabits.findIndex((h) => h.id === targetId);

      if (fromIndex >= 0 && toIndex >= 0) {
        reorder(fromIndex, toIndex);
        addToast("Habits reordered", "info");
      }

      setDragId(null);
      setDragOverId(null);
    },
    [dragId, sortedHabits, reorder, addToast]
  );

  const openHeatmap = useCallback((id: string) => {
    setHeatmapHabitId(id);
    handleSetView("heatmap");
  }, []);

  const goHome = useCallback(() => {
    handleSetView("habits");
    setHeatmapHabitId(null);
  }, []);

  // Empty state
  const EmptyState = () => (
    <div className="text-center py-12 relative">
      <div className="absolute -top-4 right-4 bg-[#0F9D74] text-white text-xs px-3 py-2 rounded shadow-lg pointer-events-none after:content-[''] after:absolute after:bottom-full after:right-4 after:border-8 after:border-transparent after:border-b-[#0F9D74]">
        Try creating your first New Habit here! Once created, you can organize them with category chips, and Export as JSON from the Data tab.
      </div>
      <span className="text-5xl mb-4 block">🌱</span>
      <h3 className="text-lg font-bold text-[#1B2430] mb-2">No habits yet</h3>
      <p className="text-sm text-[#475569] mb-6 max-w-xs mx-auto">
        Start building good habits! Create your first habit to begin tracking your daily progress.
      </p>
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="btn-primary px-6 py-3 font-semibold relative"
        data-action="open-habit-form"
      >
        Create habit
        <div className="absolute -top-3 -right-3 w-4 h-4 rounded-full bg-[#FFB020] animate-ping" />
        <div className="absolute -top-3 -right-3 w-4 h-4 rounded-full bg-[#FFB020]" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F7F6]">
      {/* Header */}
      <header className="bg-[#FFFFFF] border-b border-[#E2E8F0] sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1
              className="text-xl md:text-2xl font-extrabold text-[#1B2430] cursor-pointer"
              onClick={goHome}
            >
              <span className="text-[#0F9D74]">Loop</span>Daily
            </h1>

            {/* Navigation tabs */}
            <nav className="flex items-center gap-1">
              <button
                type="button"
                onClick={goHome}
                aria-current={view === "habits" ? "page" : undefined}
                className={`btn-nav ${view === "habits" ? "btn-nav-active" : ""}`}
                data-nav="habits"
              >
                Habits
              </button>
              <button
                type="button"
                onClick={() => handleSetView("stats")}
                aria-current={view === "stats" ? "page" : undefined}
                className={`btn-nav ${view === "stats" ? "btn-nav-active" : ""}`}
                data-nav="stats"
              >
                Stats
              </button>
              <button
                type="button"
                onClick={() => handleSetView("import")}
                aria-current={view === "import" ? "page" : undefined}
                className={`btn-nav ${view === "import" ? "btn-nav-active" : ""}`}
                data-nav="import"
              >
                Data
              </button>
            </nav>
          </div>
        </div>
      </header>

      <RecoveryBanner />

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-4 md:py-6 space-y-4">
        {/* Habits view */}
        {view === "habits" && (
          <>
            {/* Category filter bar */}
            <CategoryFilter />

            {/* Habit cards */}
            {activeHabits.length === 0 && pausedHabits.length === 0 ? (
              showForm ? (
                <HabitForm onClose={() => setShowForm(false)} />
              ) : (
                <EmptyState />
              )
            ) : (
              <>
                {/* Active habits */}
                <div className="space-y-2" ref={activeListRef}>
                  {activeHabits.map((habit) => (
                    <div
                      key={habit.id}
                      className={dragOverId === habit.id ? "drag-over rounded-[8px]" : ""}
                      onDragOver={(e) => handleDragOver(e, habit.id)}
                      onDrop={(e) => handleDrop(e, habit.id)}
                    >
                      <HabitCard
                        habit={habit}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        onOpenHeatmap={openHeatmap}
                      />
                    </div>
                  ))}
                </div>

                {/* Paused habits section */}
                {pausedHabits.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-[#64748B] mb-2 px-1">
                      Paused Habits ({pausedHabits.length})
                    </h3>
                    <div className="space-y-2" ref={pausedListRef}>
                      {pausedHabits.map((habit) => (
                        <div
                          key={habit.id}
                          className={dragOverId === habit.id ? "drag-over rounded-[8px]" : ""}
                          onDragOver={(e) => handleDragOver(e, habit.id)}
                          onDrop={(e) => handleDrop(e, habit.id)}
                        >
                          <HabitCard
                            habit={habit}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                            onOpenHeatmap={openHeatmap}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* New habit button / form */}
            {habits.length > 0 && (
              <div className="mt-2">
                {showForm ? (
                  <div className="relative">
                    <HabitForm onClose={() => setShowForm(false)} />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="w-full min-h-12 py-3 border-2 border-dashed border-[#E2E8F0] rounded-[8px] text-sm font-medium text-[#475569] hover:border-[#0F9D74] hover:text-[#0F9D74] transition-colors"
                    data-action="open-habit-form"
                  >
                    + New habit
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Stats view */}
        {view === "stats" && <StatsView onBack={goHome} />}

        {/* Heatmap view */}
        {view === "heatmap" && heatmapHabitId && (
          <HeatmapView habitId={heatmapHabitId} onBack={goHome} />
        )}

        {/* Import / Export view */}
        {view === "import" && <ImportExport />}
      </main>

      {/* Toast notifications */}
      <Toast />
    </div>
  );
}
