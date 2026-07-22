export function generateFixtureData() {
  const venues = ['North Gate', 'South Gate'];
  const roles = ['Security', 'Medic', 'Guide', 'Info Desk', 'Runner', 'Stage Hand', 'Ticketing', 'VIP Host'];

  const initialVolunteers = [];
  for (let i = 1; i <= 18; i++) {
    initialVolunteers.push({
      id: `v${i}`,
      name: `Volunteer ${i}`,
      skills: [roles[(i-1) % 8], roles[i % 8]],
      availableHours: [8, 22],
      cap: 20
    });
  }

  const initialShifts = [];
  for (let i = 1; i <= 24; i++) {
    const start = 8 + (i % 3) * 4;
    initialShifts.push({
      id: `s${i}`,
      role: roles[(i-1) % 8],
      venue: venues[i % 2],
      time: `${start}:00 - ${start+4}:00`,
      startHour: start,
      endHour: start + 4
    });
  }

  const initialOwnership = {};
  for (let i = 1; i <= 20; i++) {
    initialOwnership[`s${i}`] = `v${i > 18 ? i - 18 : i}`;
  }

  // 4 shifts understaffed
  initialOwnership['s21'] = null;
  initialOwnership['s22'] = null;
  initialOwnership['s23'] = null;
  initialOwnership['s24'] = null;

  return { initialShifts, initialVolunteers, initialOwnership };
}
