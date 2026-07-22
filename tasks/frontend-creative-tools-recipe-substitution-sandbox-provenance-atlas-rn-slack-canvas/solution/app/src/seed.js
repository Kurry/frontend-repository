export const seedRecords = [
    { id: 'r1', name: 'All-Purpose Flour', quantity: '2 cups', substitute: 'Almond Flour', reason: 'Gluten-free', source: 'Internal Docs', status: 'ready', quarantine: false },
    { id: 'r2', name: 'Butter', quantity: '1/2 cup', substitute: 'Coconut Oil', reason: 'Dairy-free', source: 'Recipe Blog', status: 'draft', quarantine: false },
    { id: 'r3', name: 'Sugar', quantity: '1 cup', substitute: 'Honey', reason: 'Refined sugar free', source: 'Health Site', status: 'changed', quarantine: false },
    { id: 'r4', name: 'Milk', quantity: '1 cup', substitute: 'Almond Milk', reason: 'Dairy-free', source: 'Community', status: 'empty', quarantine: false },
    { id: 'r5', name: 'Eggs', quantity: '2', substitute: 'Flax Eggs', reason: 'Vegan', source: 'Internal Docs', status: 'archived', quarantine: false },
    { id: 'r6', name: 'Baking Powder', quantity: '1 tsp', substitute: 'Baking Soda + Cream of Tartar', reason: 'Out of stock', source: 'Old Recipe', status: 'ready', quarantine: false },
    { id: 'r7', name: 'Vanilla Extract', quantity: '1 tsp', substitute: 'Almond Extract', reason: 'Flavor profile', source: 'Chef Notes', status: 'ready', quarantine: true }
]
for (let i = 8; i <= 105; i++) {
    seedRecords.push({ id: `r${i}`, name: `Ingredient ${i}`, quantity: '1 unit', substitute: `Sub ${i}`, reason: 'Scale testing', source: 'Generated', status: 'ready', quarantine: false })
}
