// Card, deck, hand-evaluation and equity utilities.

export type Suit = '♠' | '♥' | '♦' | '♣'
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A'

export interface Card {
  rank: Rank
  suit: Suit
}

export const SUITS: Suit[] = ['♠', '♥', '♦', '♣']
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']
export const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
}

export function isRed(suit: Suit): boolean {
  return suit === '♥' || suit === '♦'
}

export function cardKey(card: Card): string {
  return card.rank + card.suit
}

export function parseCard(key: string): Card {
  return { rank: key[0] as Rank, suit: key.slice(1) as Suit }
}

export function createDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit })
    }
  }
  return deck
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// ====== Hand evaluation ======

export type HandType =
  | 'High card'
  | 'One pair'
  | 'Two pair'
  | 'Three of a kind'
  | 'Straight'
  | 'Flush'
  | 'Full house'
  | 'Four of a kind'
  | 'Straight flush'
  | 'Royal flush'

export interface HandResult {
  handType: HandType
  rank: number
  kickers: number[]
  bestCards: Card[]
}

function getCombinations(cards: Card[], k: number): Card[][] {
  if (k === 0) return [[]]
  if (cards.length < k) return []
  const [first, ...rest] = cards
  const withFirst = getCombinations(rest, k - 1).map(c => [first, ...c])
  const withoutFirst = getCombinations(rest, k)
  return [...withFirst, ...withoutFirst]
}

function evaluate5Cards(cards: Card[]): HandResult {
  const ranks = cards.map(c => RANK_VALUES[c.rank]).sort((a, b) => b - a)
  const suits = cards.map(c => c.suit)

  const isFlush = suits.every(s => s === suits[0])

  const uniqueRanks = [...new Set(ranks)].sort((a, b) => b - a)
  let isStraight = false
  let straightHigh = 0

  if (uniqueRanks.length === 5) {
    if (uniqueRanks[0] - uniqueRanks[4] === 4) {
      isStraight = true
      straightHigh = uniqueRanks[0]
    }
    if (uniqueRanks[0] === 14 && uniqueRanks[1] === 5 && uniqueRanks[2] === 4 && uniqueRanks[3] === 3 && uniqueRanks[4] === 2) {
      isStraight = true
      straightHigh = 5
    }
  }

  const rankCounts: Record<number, number> = {}
  for (const r of ranks) {
    rankCounts[r] = (rankCounts[r] || 0) + 1
  }

  const countEntries = Object.entries(rankCounts)
    .map(([rank, count]) => ({ rank: parseInt(rank), count }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank)

  if (isFlush && isStraight) {
    if (straightHigh === 14) {
      return { handType: 'Royal flush', rank: 9, kickers: [14], bestCards: cards }
    }
    return { handType: 'Straight flush', rank: 8, kickers: [straightHigh], bestCards: cards }
  }

  if (countEntries[0].count === 4) {
    const kickers = countEntries.filter(e => e.count === 1).map(e => e.rank)
    return { handType: 'Four of a kind', rank: 7, kickers: [countEntries[0].rank, ...kickers], bestCards: cards }
  }

  if (countEntries[0].count === 3 && countEntries[1]?.count === 2) {
    return { handType: 'Full house', rank: 6, kickers: [countEntries[0].rank, countEntries[1].rank], bestCards: cards }
  }

  if (isFlush) {
    return { handType: 'Flush', rank: 5, kickers: ranks, bestCards: cards }
  }

  if (isStraight) {
    return { handType: 'Straight', rank: 4, kickers: [straightHigh], bestCards: cards }
  }

  if (countEntries[0].count === 3) {
    const kickers = countEntries.filter(e => e.count === 1).map(e => e.rank).sort((a, b) => b - a)
    return { handType: 'Three of a kind', rank: 3, kickers: [countEntries[0].rank, ...kickers], bestCards: cards }
  }

  if (countEntries[0].count === 2 && countEntries[1]?.count === 2) {
    const pairs = [countEntries[0].rank, countEntries[1].rank].sort((a, b) => b - a)
    const kicker = countEntries.find(e => e.count === 1)?.rank || 0
    return { handType: 'Two pair', rank: 2, kickers: [...pairs, kicker], bestCards: cards }
  }

  if (countEntries[0].count === 2) {
    const kickers = countEntries.filter(e => e.count === 1).map(e => e.rank).sort((a, b) => b - a)
    return { handType: 'One pair', rank: 1, kickers: [countEntries[0].rank, ...kickers], bestCards: cards }
  }

  return { handType: 'High card', rank: 0, kickers: ranks, bestCards: cards }
}

export function evaluateHand(holeCards: Card[], communityCards: Card[]): HandResult {
  const allCards = [...holeCards, ...communityCards]
  if (allCards.length < 5) {
    const ranks = allCards.map(c => RANK_VALUES[c.rank]).sort((a, b) => b - a)
    return { handType: 'High card', rank: 0, kickers: ranks, bestCards: allCards }
  }

  const combinations = getCombinations(allCards, 5)
  let bestResult: HandResult | null = null

  for (const combo of combinations) {
    const result = evaluate5Cards(combo)
    if (!bestResult || compareHands(result, bestResult) > 0) {
      bestResult = result
    }
  }

  return bestResult!
}

// Compare two hand results: >0 if a wins, <0 if b wins, 0 if tie.
export function compareHands(a: HandResult, b: HandResult): number {
  if (a.rank !== b.rank) return a.rank - b.rank
  for (let i = 0; i < Math.max(a.kickers.length, b.kickers.length); i++) {
    const ak = a.kickers[i] || 0
    const bk = b.kickers[i] || 0
    if (ak !== bk) return ak - bk
  }
  return 0
}

// ====== Equity estimation (Monte Carlo) ======

export function estimateEquity(
  holeCards: Card[],
  communityCards: Card[],
  numOpponents: number,
  iterations = 300,
): number {
  if (holeCards.length !== 2) return 0

  const allCards = [...holeCards, ...communityCards]
  const usedCards = new Set(allCards.map(cardKey))

  let wins = 0
  let ties = 0

  const remainingDeck = createDeck().filter(c => !usedCards.has(cardKey(c)))

  for (let iter = 0; iter < iterations; iter++) {
    const shuffled = shuffleDeck(remainingDeck)
    let deckIdx = 0

    const simCommunity = [...communityCards]
    while (simCommunity.length < 5 && deckIdx < shuffled.length) {
      simCommunity.push(shuffled[deckIdx++])
    }

    const myHand = evaluateHand(holeCards, simCommunity)

    let myWins = true
    let isTie = false

    for (let opp = 0; opp < numOpponents; opp++) {
      if (deckIdx + 1 >= shuffled.length) break
      const oppHole = [shuffled[deckIdx++], shuffled[deckIdx++]]
      const oppHand = evaluateHand(oppHole, simCommunity)

      const cmp = compareHands(myHand, oppHand)
      if (cmp < 0) {
        myWins = false
        isTie = false
        break
      } else if (cmp === 0) {
        isTie = true
      }
    }

    if (myWins && !isTie) wins++
    else if (isTie) ties++
  }

  return ((wins + ties * 0.5) / iterations) * 100
}
