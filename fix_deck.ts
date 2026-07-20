import * as fs from 'fs';
let content = fs.readFileSync('tasks/frontend-game-dare-night/solution/app/src/components/App.svelte', 'utf-8');

// Ensure selecting "Wild" intensity weights it properly (3x Wild for Spicy, lots for Wild)
// In the current logic:
// Spicy: ...mildCards, ...spicyCards x2, ...wildCards x3
// Wild: ...mildCards, ...spicyCards x2, ...wildCards x5

const deckLogic = `
  // ============ DECK ============
  function buildDeck(): Card[] {
    let filtered = allCards.filter(card => selectedCategories.includes(card.category));
    let mildCards = filtered.filter(c => c.intensity === 'Mild');
    let spicyCards = filtered.filter(c => c.intensity === 'Spicy');
    let wildCards = filtered.filter(c => c.intensity === 'Wild');

    let result: Card[];
    if (selectedIntensity === 'Spicy') {
      result = [...mildCards, ...spicyCards, ...spicyCards, ...wildCards, ...wildCards, ...wildCards];
    } else if (selectedIntensity === 'Wild') {
      result = [...mildCards, ...spicyCards, ...spicyCards, ...wildCards, ...wildCards, ...wildCards, ...wildCards, ...wildCards];
    } else {
      result = [...mildCards, ...mildCards, ...spicyCards, ...wildCards];
    }

    // In edge case where no cards match (e.g. they add only one card of a filtered out intensity)
    if (result.length === 0) {
       result = [...filtered];
    }

    return shuffleArray(result);
  }
`;
// The logic seems correct, let's verify if there's any other issue in deck building
