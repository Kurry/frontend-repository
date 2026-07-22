import type { FlavorComponent, ComponentStatus } from './schema';

export const seedRecords = (): FlavorComponent[] => {
  const records: FlavorComponent[] = [];
  const statuses: ComponentStatus[] = ["draft", "ready", "changed", "archived"];

  for (let i = 1; i <= 100; i++) {
    const status = statuses[i % statuses.length];
    records.push({
      id: `comp-${i.toString().padStart(3, '0')}`,
      name: `Flavor Component ${i}`,
      status: status,
      branched_from: null,
      profile: {
        sweetness: (i * 7) % 11,
        acidity: (i * 3) % 11,
        saltiness: (i * 5) % 11,
        bitterness: (i * 2) % 11,
        umami: (i * 11) % 11,
      },
      notes: i % 10 === 0 ? "Needs review" : "",
    });
  }
  return records;
};
