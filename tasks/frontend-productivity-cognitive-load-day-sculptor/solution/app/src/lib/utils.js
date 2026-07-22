import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Convert slot index (0-47) to HH:MM (15-min intervals from 08:00)
export function slotToTime(slotIndex) {
  const totalMinutes = 8 * 60 + slotIndex * 15;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function calculateDemand(blocks, tasks, slotIndex) {
  const block = blocks.find(b => slotIndex >= b.start && slotIndex < b.start + b.duration);
  if (!block) return 0;

  const task = tasks.find(t => t.id === block.taskId);
  let demand = task ? task.load : 0;

  // Add context switch cost if previous slot has a different task block
  if (slotIndex > 0) {
    const prevBlock = blocks.find(b => slotIndex - 1 >= b.start && slotIndex - 1 < b.start + b.duration);
    if (prevBlock && prevBlock.taskId !== block.taskId) {
      demand += 2; // Fixed context switch cost
    }
  }

  return demand;
}

export function propagateDependencies(blocks, tasks, changedBlockId, newStart) {
  const blockMap = new Map(blocks.map(b => [b.id, { ...b }]));
  const taskMap = new Map(tasks.map(t => [t.id, t]));

  let changed = blockMap.get(changedBlockId);
  if (changed) {
    changed.start = newStart;
  }

  // Simple topological traversal based on dependencies
  let updated = true;
  while(updated) {
    updated = false;
    for (const [id, block] of blockMap.entries()) {
      const task = taskMap.get(block.taskId);
      if (!task || task.deps.length === 0) continue;

      let maxDepEnd = 0;
      for (const depId of task.deps) {
        // find blocks of the dependency task
        for (const [depBlockId, depBlock] of blockMap.entries()) {
           if (depBlock.taskId === depId) {
             const end = depBlock.start + depBlock.duration;
             if (end > maxDepEnd) {
               maxDepEnd = end;
             }
           }
        }
      }

      if (block.start < maxDepEnd && !block.locked) {
        block.start = maxDepEnd;
        updated = true;
      }
    }
  }

  return Array.from(blockMap.values());
}

export function checkConflicts(blocks, tasks, appointments, breaks) {
  let conflicts = [];

  // 1. Overlaps between blocks
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const b1 = blocks[i];
      const b2 = blocks[j];
      if (b1.start < b2.start + b2.duration && b1.start + b1.duration > b2.start) {
        conflicts.push(`Overlap between ${b1.taskId} and ${b2.taskId}`);
      }
    }
  }

  // 2. Overlaps with appointments
  for (const b of blocks) {
    for (const a of appointments) {
      if (b.start < a.start + a.duration && b.start + b.duration > a.start) {
        conflicts.push(`Block ${b.taskId} overlaps appointment ${a.title}`);
      }
    }
  }

  // 3. Dependencies
  const blockMap = new Map(blocks.map(b => [b.id, b]));
  for (const block of blocks) {
    const task = tasks.find(t => t.id === block.taskId);
    if (!task) continue;

    for (const depId of task.deps) {
      const depBlocks = blocks.filter(b => b.taskId === depId);
      for (const db of depBlocks) {
        if (block.start < db.start + db.duration) {
          conflicts.push(`Dependency violation: ${task.title} starts before ${depId} finishes`);
        }
      }
    }
  }

  // 4. Deadlines
  for (const block of blocks) {
    const task = tasks.find(t => t.id === block.taskId);
    if (task && block.start + block.duration > task.deadline) {
      const missed = block.start + block.duration - task.deadline;
      conflicts.push(`Deadline crossed: ${task.title} by ${missed * 15} minutes`);
    }
  }

  return conflicts;
}

export function generateICS(blocks, tasks, appointments, breaks) {
  let ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cognitive Load Day Sculptor//EN"
  ];

  const formatTime = (slot) => {
    const date = new Date();
    date.setHours(8, 0, 0, 0);
    date.setMinutes(date.getMinutes() + slot * 15);
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  for (const b of blocks) {
    const task = tasks.find(t => t.id === b.taskId);
    if (!task) continue;
    ics.push("BEGIN:VEVENT");
    ics.push(`UID:${b.id}@day-sculptor`);
    ics.push(`DTSTART:${formatTime(b.start)}`);
    ics.push(`DTEND:${formatTime(b.start + b.duration)}`);
    ics.push(`SUMMARY:${task.title}`);
    ics.push("END:VEVENT");
  }

  for (const a of appointments) {
    ics.push("BEGIN:VEVENT");
    ics.push(`UID:${a.id}@day-sculptor`);
    ics.push(`DTSTART:${formatTime(a.start)}`);
    ics.push(`DTEND:${formatTime(a.start + a.duration)}`);
    ics.push(`SUMMARY:${a.title}`);
    ics.push("END:VEVENT");
  }

  ics.push("END:VCALENDAR");
  return ics.join("\r\n");
}
