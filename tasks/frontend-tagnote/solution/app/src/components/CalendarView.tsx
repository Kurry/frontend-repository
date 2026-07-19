import { component$, $, useStore } from '@builder.io/qwik';
import type { Note } from '../types';
import { noteToDateKey, dateToKey } from '../utils';

interface CalendarViewProps {
  notes: Note[];
  activeDateFilter: string | null;
  onSelectDate: (dateKey: string | null) => void;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export const CalendarView = component$<CalendarViewProps>(
  ({ notes, activeDateFilter, onSelectDate }) => {
    const now = new Date();
    const calState = useStore({ year: now.getFullYear(), month: now.getMonth() });

    const noteCountMap = new Map<string, number>();
    for (const note of notes) {
      const key = noteToDateKey(note);
      noteCountMap.set(key, (noteCountMap.get(key) || 0) + 1);
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const daysInMonth = getDaysInMonth(calState.year, calState.month);
    const firstDay = getFirstDayOfMonth(calState.year, calState.month);

    const handlePrevMonth = $(() => {
      if (calState.month === 0) {
        calState.month = 11;
        calState.year--;
      } else {
        calState.month--;
      }
    });

    const handleNextMonth = $(() => {
      if (calState.month === 11) {
        calState.month = 0;
        calState.year++;
      } else {
        calState.month++;
      }
    });

    const handleDayClick = $((day: number) => {
      const date = new Date(calState.year, calState.month, day);
      const key = dateToKey(date);
      onSelectDate(activeDateFilter === key ? null : key);
    });

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const todayKey = dateToKey(now);

    return (
      <div class="rounded-[7px] bg-white p-4 shadow-sm">
        <div class="mb-4 flex items-center justify-between">
          <button
            onClick$={handlePrevMonth}
            class="rounded-full px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100"
          >
            ← Previous
          </button>
          <span class="text-[17px] font-semibold text-[var(--color-text-primary)]">
            {monthNames[calState.month]} {calState.year}
          </span>
          <button
            onClick$={handleNextMonth}
            class="rounded-full px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100"
          >
            Next →
          </button>
        </div>

        <div class="mb-2 grid grid-cols-7 text-center text-xs font-medium text-gray-400">
          {dayNames.map((d) => (
            <div key={d} class="py-1">
              {d}
            </div>
          ))}
        </div>

        <div class="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`e-${i}`} class="h-10" />;
            }
            const date = new Date(calState.year, calState.month, day);
            const key = dateToKey(date);
            const count = noteCountMap.get(key) || 0;
            const isToday = key === todayKey;
            const isActive = activeDateFilter === key;

            return (
              <button
                key={key}
                onClick$={() => handleDayClick(day)}
                aria-label={`${monthNames[calState.month]} ${day}, ${count} notes`}
                class={`relative flex h-10 flex-col items-center justify-center rounded-lg text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] ${
                  isActive
                    ? 'bg-[var(--color-accent)] font-semibold text-white'
                    : isToday
                      ? 'bg-gray-100 font-semibold text-[var(--color-text-primary)]'
                      : 'text-[var(--color-text-primary)] hover:bg-gray-50'
                }`}
              >
                <span>{day}</span>
                {count > 0 && (
                  <span
                    class={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                      isActive ? 'bg-white' : 'bg-[var(--color-accent)]'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);
