import type { Ingredient } from '../types';

export const generateSeedData = (): Ingredient[] => {
  const data: Ingredient[] = [];
  const statuses: Ingredient['status'][] = ['draft', 'ready', 'changed', 'archived', 'conflict'];

  for (let i = 1; i <= 100; i++) {
    const isConflict = i % 10 === 0;
    const status = isConflict ? 'conflict' : statuses[i % 4];

    data.push({
      id: `ing-${i}`,
      name: `Ingredient ${i}`,
      quantity: Math.floor(Math.random() * 100) + 1,
      unit: 'g',
      caloriesPerUnit: Math.floor(Math.random() * 50) + 1,
      proteinPerUnit: Math.floor(Math.random() * 20),
      carbsPerUnit: Math.floor(Math.random() * 20),
      fatPerUnit: Math.floor(Math.random() * 20),
      status: status,
      recoveryBoardState: isConflict ? {
        isFailed: true,
        reason: 'Missing valid quantity or macro mismatch',
      } : undefined
    });
  }
  return data;
};

export const calculateDerivedStats = (records: Ingredient[]) => {
  const stats = {
    totalIngredients: records.length,
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    statusCounts: {
      draft: 0,
      ready: 0,
      changed: 0,
      archived: 0,
      conflict: 0
    }
  };

  records.forEach(r => {
    stats.totalCalories += r.quantity * r.caloriesPerUnit;
    stats.totalProtein += r.quantity * r.proteinPerUnit;
    stats.totalCarbs += r.quantity * r.carbsPerUnit;
    stats.totalFat += r.quantity * r.fatPerUnit;
    stats.statusCounts[r.status] = (stats.statusCounts[r.status] || 0) + 1;
  });

  return stats;
};
