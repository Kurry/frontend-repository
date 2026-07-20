import * as fs from 'fs';
let content = fs.readFileSync('tasks/frontend-game-dare-night/solution/app/src/components/App.svelte', 'utf-8');

const drawCardReplacement = `
  function drawCard(): Card | undefined {
    if (winner !== null) return undefined;

    if (deck.length === 0) {
      deck = buildDeck();
      drawnCards = [];
      reshuffleMessage = true;
      showToast('Deck reshuffled!', 'info');
      setTimeout(() => { reshuffleMessage = false; }, 2000);
    }

    let card: Card | undefined;
    if (lastDrawnCardId && deck.length > 1) {
      const idx = deck.findIndex(c => c.id !== lastDrawnCardId);
      if (idx >= 0) {
        card = deck.splice(idx, 1)[0];
      } else {
        card = deck.pop();
      }
    } else {
      card = deck.pop();
    }

    if (card) {
      currentCard = card;
      lastDrawnCardId = card.id;
      drawnCards = [...drawnCards, card];
      canUndo = false;
      startTimer();
    }
    return card;
  }
`;
content = content.replace(/function drawCard\(\): Card \| undefined \{[\s\S]*?return card;\n  \}/, drawCardReplacement);

fs.writeFileSync('tasks/frontend-game-dare-night/solution/app/src/components/App.svelte', content);
