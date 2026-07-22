export const INITIAL_GUESTS = Array.from({ length: 36 }, (_, i) => ({
  id: `guest-${i + 1}`,
  name: `Guest ${i + 1}`,
  rsvp: i < 28 ? 'confirmed' : i < 33 ? 'tentative' : 'declined',
  mobility: i % 9 === 0 ? 'wheelchair' : 'none',
  dietary: i % 6 === 0 ? 'vegan' : i % 8 === 0 ? 'gluten-free' : 'none',
  groupId: `group-${Math.floor(i / 7) + 1}`,
}));

export const INITIAL_RELATIONSHIPS = [
  { id: 'rel-1', guest1: 'guest-1', guest2: 'guest-2', type: 'together' },
  { id: 'rel-2', guest1: 'guest-3', guest2: 'guest-4', type: 'near' },
  { id: 'rel-3', guest1: 'guest-5', guest2: 'guest-6', type: 'apart' },
  { id: 'rel-4', guest1: 'guest-7', guest2: 'guest-8', type: 'together' },
  { id: 'rel-5', guest1: 'guest-9', guest2: 'guest-10', type: 'near' },
  { id: 'rel-6', guest1: 'guest-11', guest2: 'guest-12', type: 'apart' },
  { id: 'rel-7', guest1: 'guest-13', guest2: 'guest-14', type: 'together' },
];
