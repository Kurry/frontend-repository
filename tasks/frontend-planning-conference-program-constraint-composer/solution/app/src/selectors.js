import { isOverlapping, timeToMinutes } from './utils.js';

export const selectConflicts = (state) => {
  const conflicts = [];
  const { placements, sessions } = state;

  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const p1 = placements[i];
      const p2 = placements[j];

      if (p1.day !== p2.day) continue;

      const s1 = sessions.find(s => s.id === p1.sessionId);
      const s2 = sessions.find(s => s.id === p2.sessionId);

      if (!s1 || !s2) continue;

      const overlap = isOverlapping(p1.startTime, s1.duration, p2.startTime, s2.duration);
      if (overlap) {
        if (p1.roomId === p2.roomId) {
          conflicts.push({ type: 'room', p1, p2, message: `Room double booking` });
        }
        const sharedSpeakers = s1.speakerIds.filter(id => s2.speakerIds.includes(id));
        if (sharedSpeakers.length > 0) {
          conflicts.push({ type: 'speaker', p1, p2, message: `Speaker overlap: ${sharedSpeakers.join(', ')}` });
        }
        const sharedResources = s1.resourceIds.filter(id => s2.resourceIds.includes(id));
        if (sharedResources.length > 0) {
          conflicts.push({ type: 'resource', p1, p2, message: `Resource overlap: ${sharedResources.join(', ')}` });
        }
      }
    }
  }

  return conflicts;
};

export const selectCohortStats = (state) => {
  const { placements, sessions, cohorts, rooms } = state;
  const stats = cohorts.map(c => ({ ...c, served: 0, unserved: 0 }));

  placements.forEach(p => {
    const session = sessions.find(s => s.id === p.sessionId);
    const room = rooms.find(r => r.id === p.roomId);
    if (!session || !room) return;

    const interestedCohorts = stats.filter(c => c.interestIds.includes(session.id));
    const totalDemand = interestedCohorts.reduce((sum, c) => sum + c.size, 0);

    if (totalDemand > room.capacity) {
      const scale = room.capacity / totalDemand;
      interestedCohorts.forEach(c => {
         c.served += Math.floor(c.size * scale);
         c.unserved += (c.size - Math.floor(c.size * scale));
      });
    } else {
      interestedCohorts.forEach(c => {
         c.served += c.size;
      });
    }
  });

  return stats;
};
