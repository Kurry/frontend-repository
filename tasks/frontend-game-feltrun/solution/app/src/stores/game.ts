import { defineStore } from 'pinia'
import { reactive, ref, computed, watch } from 'vue'
import { z } from 'zod'
import type { Card, HandType } from '../utils/poker'
import {
  createDeck, shuffleDeck, evaluateHand, compareHands, estimateEquity,
  cardKey, parseCard, RANK_VALUES,
} from '../utils/poker'

export type PlayerStyle = 'Aggressive' | 'Tight' | 'Bluffer'
export type Phase = 'idle' | 'preflop' | 'flop' | 'turn' | 'river' | 'handOver'
export type Mode = 'tournament' | 'practice'

export interface Player {
  id: number
  name: string
  chips: number
  hole: Card[]
  isHuman: boolean
  style: PlayerStyle | null
  folded: boolean
  allIn: boolean
  bet: number
  committed: number
  acted: boolean
}

export interface HistoryEntry {
  id: string
  hand: number
  pot: number
  winner: string
  winnerSeat?: number
  result: string
}

export interface BadgeDef {
  id: string
  name: string
  description: string
}

export interface Toast {
  id: number
  title: string
  body: string
}

export interface CollabNote {
  id: string
  seq: number
  text: string
  author: 'You' | 'Peer'
}

export interface CollabOp {
  opId: string
  kind: 'add' | 'edit'
  noteId: string
  noteSeq: number
  text: string
  author: 'You' | 'Peer'
}

export const BLIND_LEVELS = [
  { level: 1, small: 5, big: 10 },
  { level: 2, small: 10, big: 20 },
  { level: 3, small: 20, big: 40 },
  { level: 4, small: 50, big: 100 },
  { level: 5, small: 100, big: 200 },
  { level: 6, small: 200, big: 400 },
  { level: 7, small: 500, big: 1000 },
]

export const BADGE_DEFS: BadgeDef[] = [
  { id: 'first-win', name: 'First win', description: 'Win your first hand of the session' },
  { id: 'bluff-win', name: 'First bluff win', description: 'Win a pot before showdown by making every opponent fold' },
  { id: 'big-pot', name: 'Big pot', description: 'Win a pot of 150 chips or more' },
  { id: 'three-wins', name: 'Three wins', description: 'Win 3 hands in one session' },
  { id: 'level-up', name: 'Level up', description: 'Reach blind level 2' },
  { id: 'felted', name: 'Felted an opponent', description: 'Reduce an opponent to 0 chips' },
  { id: 'comeback-kid', name: 'Comeback kid', description: 'Win a hand after a rebuy' },
  { id: 'all-in-win', name: 'All-in winner', description: 'Win a hand in which you were all-in' },
]

const STORAGE_KEY = 'feltrun-state-v2'
const STARTING_CHIPS = 1000
const deserializeCard = (card: string | Card): Card => typeof card === 'string' ? parseCard(card) : card

interface SessionState {
  difficulty: 'Easy' | 'Standard' | 'Hard'
  undoSnapshot: string | null
  savedTable: string | null
  players: Player[]
  deck: Card[]
  board: Card[]
  pot: number
  phase: Phase
  currentBet: number
  minRaiseInc: number
  turnIdx: number
  dealerIdx: number
  awaitingHuman: boolean
  revealed: boolean
  completedHands: number
  handsWon: number
  biggestPot: number
  rebuys: number
  history: HistoryEntry[]
  unlocked: string[]
  equity: number | null
  status: string
  winnerIds: number[]
  winCardKeys: string[]
  winLabel: string
  rebuyPending: boolean
  humanWentAllIn: boolean
  epoch: number
  historySeq: number
}

function newPlayers(): Player[] {
  return [
    { id: 0, name: 'You', chips: STARTING_CHIPS, hole: [], isHuman: true, style: null, folded: false, allIn: false, bet: 0, committed: 0, acted: false },
    { id: 1, name: 'Viper', chips: STARTING_CHIPS, hole: [], isHuman: false, style: 'Aggressive', folded: false, allIn: false, bet: 0, committed: 0, acted: false },
    { id: 2, name: 'Rock', chips: STARTING_CHIPS, hole: [], isHuman: false, style: 'Tight', folded: false, allIn: false, bet: 0, committed: 0, acted: false },
    { id: 3, name: 'Phantom', chips: STARTING_CHIPS, hole: [], isHuman: false, style: 'Bluffer', folded: false, allIn: false, bet: 0, committed: 0, acted: false },
  ]
}

function blankSession(): SessionState {
  return {
    difficulty: 'Standard',
    undoSnapshot: null,
    savedTable: null,
    players: newPlayers(),
    deck: [],
    board: [],
    pot: 0,
    phase: 'idle',
    currentBet: 0,
    minRaiseInc: 10,
    turnIdx: -1,
    dealerIdx: 3,
    awaitingHuman: false,
    revealed: false,
    completedHands: 0,
    handsWon: 0,
    biggestPot: 0,
    rebuys: 0,
    history: [],
    unlocked: [],
    equity: null,
    status: '',
    winnerIds: [],
    winCardKeys: [],
    winLabel: '',
    rebuyPending: false,
    humanWentAllIn: false,
    epoch: 0,
    historySeq: 0,
  }
}

interface CollabState {
  notes: CollabNote[]
  seq: number
  offline: boolean
  queued: CollabOp[]
  peerPending: CollabOp[]
  appliedIds: string[]
  pendingDelivery: boolean
  conflict: { noteId: string; mine: CollabOp; theirs: CollabOp } | null
  note: string
}

function blankCollab(): CollabState {
  return {
    notes: [],
    seq: 0,
    offline: false,
    queued: [],
    peerPending: [],
    appliedIds: [],
    pendingDelivery: false,
    conflict: null,
    note: '',
  }
}

export const useGameStore = defineStore('game', () => {
  const tournament = reactive<SessionState>(blankSession())
  const practice = reactive<SessionState>(blankSession())
  const collab = reactive<CollabState>(blankCollab())
  const mode = ref<Mode>('tournament')
  const toasts = ref<Toast[]>([])
  const confirmOpen = ref(false)
  const drawerOpen = ref(false)
  const showHistory = ref(false)
  const showBadges = ref(false)
  const showExport = ref(true)
  let toastSeq = 0
  let loaded = false

  const s = computed<SessionState>(() => (mode.value === 'tournament' ? tournament : practice))

  const blinds = computed(() => {
    if (mode.value === 'practice') return BLIND_LEVELS[0]
    const idx = Math.min(Math.floor(tournament.completedHands / 8), BLIND_LEVELS.length - 1)
    return BLIND_LEVELS[idx]
  })

  function blindsOf(session: SessionState) {
    if (session === practice) return BLIND_LEVELS[0]
    const idx = Math.min(Math.floor(session.completedHands / 8), BLIND_LEVELS.length - 1)
    return BLIND_LEVELS[idx]
  }

  const human = computed(() => s.value.players[0])
  const isHumanTurn = computed(() =>
    s.value.awaitingHuman &&
    ['preflop', 'flop', 'turn', 'river'].includes(s.value.phase) &&
    s.value.players[s.value.turnIdx]?.isHuman === true,
  )
  const callAmount = computed(() => {
    const h = s.value.players[0]
    return Math.min(Math.max(s.value.currentBet - h.bet, 0), h.chips)
  })
  const canCheck = computed(() => callAmount.value === 0)
  const minRaiseAdd = computed(() => {
    const h = s.value.players[0]
    return Math.min(callAmount.value + s.value.minRaiseInc, h.chips)
  })
  const winRate = computed(() => {
    const sess = s.value
    if (sess.completedHands === 0) return '0.0'
    return ((sess.handsWon / sess.completedHands) * 100).toFixed(1)
  })
  const badges = computed(() =>
    BADGE_DEFS.map(def => ({ ...def, unlocked: s.value.unlocked.includes(def.id) })),
  )

  // ===== Timers, guarded by session epoch =====
  function schedule(session: SessionState, fn: () => void, ms: number) {
    const epoch = session.epoch
    window.setTimeout(() => {
      if (session.epoch === epoch) fn()
    }, ms)
  }

  // ===== Persistence =====
  function serializeSession(session: SessionState) {
    return {
      ...session,
      players: session.players.map(player => ({ ...player, hole: player.hole.map(cardKey) })),
      deck: session.deck.map(cardKey),
      board: session.board.map(cardKey),
    }
  }

  function saveState() {
    if (!loaded) return
    try {
      const payload = {
        mode: mode.value,
        tournament: serializeSession(tournament),
        practice: serializeSession(practice),
        collab: {
          notes: collab.notes,
          seq: collab.seq,
          offline: collab.offline,
          queued: collab.queued,
          peerPending: collab.peerPending,
          appliedIds: collab.appliedIds,
          pendingDelivery: collab.pendingDelivery,
          conflict: collab.conflict,
        },
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // storage unavailable — continue without persistence
    }
  }

  function loadState(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return false
      const parsed = JSON.parse(raw)
      mode.value = parsed.mode || 'tournament'
      if (parsed.tournament) {
        parsed.tournament.epoch = tournament.epoch + 1
        Object.assign(tournament, parsed.tournament)
        tournament.players.forEach((p: Player) => p.hole = p.hole.map(deserializeCard))
        tournament.deck = tournament.deck.map(deserializeCard)
        tournament.board = tournament.board.map(deserializeCard)
      }
      if (parsed.practice) {
        parsed.practice.epoch = practice.epoch + 1
        Object.assign(practice, parsed.practice)
        practice.players.forEach((p: Player) => p.hole = p.hole.map(deserializeCard))
        practice.deck = practice.deck.map(deserializeCard)
        practice.board = practice.board.map(deserializeCard)
      }
      if (parsed.collab) {
        Object.assign(collab, blankCollab(), parsed.collab)
      }
      return true
    } catch {
      return false
    }
  }

  function saveTable() {
    const session = s.value;
    session.savedTable = JSON.stringify({
      players: session.players.map(p => ({ ...p, hole: p.hole.map(cardKey) })),
      deck: session.deck.map(cardKey),
      board: session.board.map(cardKey),
      pot: session.pot,
      phase: session.phase,
      currentBet: session.currentBet,
      minRaiseInc: session.minRaiseInc,
      turnIdx: session.turnIdx,
      dealerIdx: session.dealerIdx,
      revealed: session.revealed,
      equity: session.equity,
      awaitingHuman: session.awaitingHuman,
      humanWentAllIn: session.humanWentAllIn,
      completedHands: session.completedHands,
      handsWon: session.handsWon,
      biggestPot: session.biggestPot,
      rebuys: session.rebuys,
      rebuyPending: session.rebuyPending,
      history: session.history,
      historySeq: session.historySeq,
      winnerIds: session.winnerIds,
      winLabel: session.winLabel,
      winCardKeys: session.winCardKeys,
      status: session.status,
      difficulty: session.difficulty,
      unlocked: session.unlocked,
    });
    saveState();
  }

  function loadSavedTable() {
    const session = s.value;
    if (!session.savedTable) return false;
    try {
      const parsed = JSON.parse(session.savedTable);
      const nextEpoch = session.epoch + 1;
      Object.assign(session, parsed);
      session.epoch = nextEpoch;
      session.players.forEach((p: Player) => p.hole = p.hole.map(deserializeCard));
      session.deck = session.deck.map(deserializeCard);
      session.board = session.board.map(deserializeCard);
      session.undoSnapshot = null;
      resumeSession(session);
      return true;
    } catch (e) {
      console.error('Failed to load saved table', e);
      return false;
    }
  }

  function initGame() {
    loadState()
    loaded = true
    resumeSession(tournament)
    saveState()
  }

  function resumeSession(session: SessionState) {
    if (!['preflop', 'flop', 'turn', 'river'].includes(session.phase)) return
    if (session.players[0].hole.length === 2 && !session.players[0].folded) {
      refreshEquity(session)
    }
    const p = session.players[session.turnIdx]
    if (p && !p.isHuman && !p.folded && !p.allIn) {
      session.awaitingHuman = false
      schedule(session, () => aiAct(session, p), 500)
    } else if (p && p.isHuman) {
      session.awaitingHuman = true
    } else {
      schedule(session, () => afterAction(session), 400)
    }
  }

  watch([tournament, practice, collab, mode], () => saveState(), { deep: true })

  // ===== Toasts =====
  function pushToast(title: string, body: string) {
    const id = ++toastSeq
    toasts.value.push({ id, title, body })
    window.setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, 4200)
  }

  function unlockBadge(session: SessionState, id: string) {
    if (session.unlocked.includes(id)) return
    session.unlocked.push(id)
    const def = BADGE_DEFS.find(b => b.id === id)
    if (def) pushToast(`Badge earned — ${def.name}`, def.description)
  }

  // ===== Equity =====
  function refreshEquity(session: SessionState) {
    const h = session.players[0]
    if (h.hole.length !== 2 || h.folded) {
      session.equity = null
      return
    }
    const opponents = session.players.filter(p => !p.isHuman && !p.folded).length
    if (opponents === 0) {
      session.equity = 100
      return
    }
    const prev = session.equity
    const epoch = session.epoch
    const hole = [...h.hole]
    const board = [...session.board]
    window.setTimeout(() => {
      if (session.epoch !== epoch) return
      let value = estimateEquity(hole, board, opponents, 280)
      if (prev !== null && Math.abs(value - prev) < 0.15) {
        value = Math.min(99.9, value + 0.3)
      }
      session.equity = Math.round(value * 10) / 10
    }, 30)
  }

  // ===== Dealing =====
  function dealNextHand() {
    const session = s.value
    if (session.phase !== 'idle' && session.phase !== 'handOver') return
    const h = session.players[0]
    if (h.chips <= 0) {
      session.status = 'Your stack is empty — select Rebuy to keep playing'
      return
    }
    session.epoch++
    // Opponents that lost their stack quietly restock so the table stays full.
    session.players.forEach(p => {
      if (!p.isHuman && p.chips <= 0) p.chips = STARTING_CHIPS
    })
    session.revealed = false
    session.winnerIds = []
    session.winCardKeys = []
    session.winLabel = ''
    session.board = []
    session.pot = 0
    session.equity = null
    session.deck = shuffleDeck(createDeck())
    session.dealerIdx = (session.dealerIdx + 1) % 4
    session.players.forEach(p => {
      p.hole = [session.deck.pop()!, session.deck.pop()!]
      p.folded = false
      p.allIn = false
      p.bet = 0
      p.committed = 0
      p.acted = false
    })
    session.humanWentAllIn = false

    const bl = blindsOf(session)
    const sbIdx = (session.dealerIdx + 1) % 4
    const bbIdx = (session.dealerIdx + 2) % 4
    postBlind(session, sbIdx, bl.small)
    postBlind(session, bbIdx, bl.big)
    session.currentBet = bl.big
    session.minRaiseInc = bl.big
    session.phase = 'preflop'
    session.status = `Hand ${session.completedHands + 1} — blinds ${bl.small}/${bl.big} posted`
    refreshEquity(session)

    session.turnIdx = bbIdx
    afterAction(session, true)
  }

  function postBlind(session: SessionState, idx: number, amount: number) {
    const p = session.players[idx]
    const amt = Math.min(amount, p.chips)
    p.chips -= amt
    p.bet += amt
    p.committed += amt
    session.pot += amt
    if (p.chips === 0) {
      p.allIn = true
      if (p.isHuman) session.humanWentAllIn = true
    }
  }

  // ===== Turn engine =====
  function bettingComplete(session: SessionState): boolean {
    const actors = session.players.filter(p => !p.folded && !p.allIn)
    if (actors.length === 0) return true
    if (actors.length === 1) {
      const lone = actors[0]
      return lone.bet >= session.currentBet && lone.acted
    }
    return actors.every(p => p.acted && p.bet === session.currentBet)
  }

  function afterAction(session: SessionState, initial = false) {
    const inHand = session.players.filter(p => !p.folded)
    if (inHand.length === 1) {
      awardUncontested(session, inHand[0])
      return
    }
    if (!initial && bettingComplete(session)) {
      nextStreet(session)
      return
    }
    let idx = session.turnIdx
    let found = false
    for (let i = 0; i < 4; i++) {
      idx = (idx + 1) % 4
      const q = session.players[idx]
      if (!q.folded && !q.allIn) {
        found = true
        break
      }
    }
    if (!found) {
      nextStreet(session)
      return
    }
    session.turnIdx = idx
    const p = session.players[idx]
    if (p.isHuman) {
      session.awaitingHuman = true
    } else {
      session.awaitingHuman = false
      schedule(session, () => aiAct(session, p), 260 + Math.random() * 180)
    }
  }

  function nextStreet(session: SessionState) {
    session.undoSnapshot = null;
    session.players.forEach(p => {
      p.bet = 0
      p.acted = false
    })
    session.currentBet = 0
    session.minRaiseInc = blindsOf(session).big
    session.awaitingHuman = false

    if (session.phase === 'river') {
      resolveShowdown(session)
      return
    }

    if (session.phase === 'preflop') {
      session.board.push(session.deck.pop()!, session.deck.pop()!, session.deck.pop()!)
      session.phase = 'flop'
    } else if (session.phase === 'flop') {
      session.board.push(session.deck.pop()!)
      session.phase = 'turn'
    } else if (session.phase === 'turn') {
      session.board.push(session.deck.pop()!)
      session.phase = 'river'
    } else {
      return
    }
    refreshEquity(session)

    const actors = session.players.filter(p => !p.folded && !p.allIn)
    if (actors.length <= 1) {
      // No more betting possible — run out the remaining streets.
      schedule(session, () => nextStreet(session), 700)
      return
    }
    // First to act after the dealer.
    let idx = session.dealerIdx
    for (let i = 0; i < 4; i++) {
      idx = (idx + 1) % 4
      const q = session.players[idx]
      if (!q.folded && !q.allIn) break
    }
    session.turnIdx = idx
    const p = session.players[idx]
    if (p.isHuman) {
      session.awaitingHuman = true
    } else {
      schedule(session, () => aiAct(session, p), 260 + Math.random() * 180)
    }
  }

  // ===== Actions =====
  function applyFold(session: SessionState, p: Player) {
    p.folded = true
    p.acted = true
    session.status = `${p.name === 'You' ? 'You fold' : p.name + ' folds'}`
    if (p.isHuman) session.equity = null
    afterAction(session)
  }

  function applyCheck(session: SessionState, p: Player) {
    p.acted = true
    session.status = `${p.name === 'You' ? 'You check' : p.name + ' checks'}`
    afterAction(session)
  }

  function applyCall(session: SessionState, p: Player) {
    const toCall = Math.min(session.currentBet - p.bet, p.chips)
    if (toCall <= 0) {
      applyCheck(session, p)
      return
    }
    p.chips -= toCall
    p.bet += toCall
    p.committed += toCall
    session.pot += toCall
    p.acted = true
    if (p.chips === 0) {
      p.allIn = true
      if (p.isHuman) session.humanWentAllIn = true
      session.status = `${p.name === 'You' ? 'You call' : p.name + ' calls'} ${toCall} and ${p.isHuman ? 'are' : 'is'} all-in`
    } else {
      session.status = `${p.name === 'You' ? 'You call' : p.name + ' calls'} ${toCall}`
    }
    afterAction(session)
  }

  function applyRaise(session: SessionState, p: Player, add: number) {
    const amount = Math.min(add, p.chips)
    p.chips -= amount
    p.bet += amount
    p.committed += amount
    session.pot += amount
    p.acted = true
    const inc = p.bet - session.currentBet
    if (inc > 0) {
      if (inc >= session.minRaiseInc) session.minRaiseInc = inc
      session.currentBet = p.bet
      session.players.forEach(q => {
        if (q.id !== p.id && !q.folded && !q.allIn) q.acted = false
      })
    }
    if (p.chips === 0) {
      p.allIn = true
      if (p.isHuman) session.humanWentAllIn = true
      session.status = `${p.name === 'You' ? 'You go' : p.name + ' goes'} all-in for ${p.bet}`
    } else {
      session.status = `${p.name === 'You' ? 'You raise' : p.name + ' raises'} to ${p.bet}`
    }
    afterAction(session)
  }

  // ===== Human actions (guarded against stale or rapid input) =====
  function createSnapshot(session: SessionState): string {
    return JSON.stringify({
      players: session.players.map(p => ({ ...p, hole: p.hole.map(cardKey) })),
      deck: session.deck.map(cardKey),
      board: session.board.map(cardKey),
      pot: session.pot,
      phase: session.phase,
      currentBet: session.currentBet,
      minRaiseInc: session.minRaiseInc,
      turnIdx: session.turnIdx,
      dealerIdx: session.dealerIdx,
      revealed: session.revealed,
      equity: session.equity,
      awaitingHuman: session.awaitingHuman,
      status: session.status,
      difficulty: session.difficulty,
      humanWentAllIn: session.humanWentAllIn,
    });
  }

  function undoAction() {
    const session = s.value;
    if (!session.undoSnapshot || !['preflop', 'flop', 'turn', 'river'].includes(session.phase)) return false;
    try {
      const parsed = JSON.parse(session.undoSnapshot);
      const nextEpoch = session.epoch + 1;
      Object.assign(session, parsed);
      session.epoch = nextEpoch;
      session.players.forEach((p: Player) => p.hole = p.hole.map(deserializeCard));
      session.deck = session.deck.map(deserializeCard);
      session.board = session.board.map(deserializeCard);
      session.undoSnapshot = null;
      session.awaitingHuman = true; // Wait for human to act again
      return true;
    } catch (e) {
      console.error('Failed to undo', e);
      return false;
    }
  }

  function humanTurnGuard(): Player | null {
    const session = s.value
    if (!isHumanTurn.value) return null
    const p = session.players[session.turnIdx]
    if (!p || !p.isHuman || p.folded || p.allIn) return null
    session.undoSnapshot = createSnapshot(session)
    session.awaitingHuman = false
    return p
  }

  function humanFold() {
    const p = humanTurnGuard()
    if (p) applyFold(s.value, p)
  }

  function humanCheck() {
    if (!canCheck.value) return
    const p = humanTurnGuard()
    if (p) applyCheck(s.value, p)
  }

  function humanCall() {
    if (canCheck.value) return
    const p = humanTurnGuard()
    if (p) applyCall(s.value, p)
  }

  function humanRaise(add: number): string | null {
    const session = s.value
    if (!isHumanTurn.value) return null
    const h = session.players[0]
    if (!Number.isFinite(add) || add <= 0 || Math.floor(add) !== add) {
      return `Raise must be a whole number of chips. Enter an amount between ${minRaiseAdd.value} and ${h.chips}`
    }
    if (add > h.chips) {
      return `Raise can't exceed your stack of ${h.chips} chips. Enter a lower amount or select All-in`
    }
    if (add < minRaiseAdd.value && add !== h.chips) {
      return `Raise must be at least ${minRaiseAdd.value} chips. Enter a higher amount or select All-in`
    }
    const p = humanTurnGuard()
    if (p) applyRaise(session, p, add)
    return null
  }

  function humanAllIn() {
    const p = humanTurnGuard()
    if (!p) return
    if (p.chips <= callAmount.value || callAmount.value >= p.chips) {
      applyCall(s.value, p)
    } else {
      applyRaise(s.value, p, p.chips)
    }
  }

  // ===== AI =====
  function handStrength(session: SessionState, p: Player): number {
    if (p.hole.length !== 2) return 0.3
    if (session.board.length >= 3) {
      const result = evaluateHand(p.hole, session.board)
      return Math.min(1, (result.rank + (result.kickers[0] || 0) / 15) / 8)
    }
    const r1 = RANK_VALUES[p.hole[0].rank]
    const r2 = RANK_VALUES[p.hole[1].rank]
    const paired = p.hole[0].rank === p.hole[1].rank
    const suited = p.hole[0].suit === p.hole[1].suit
    return Math.min(1, (Math.max(r1, r2) / 14) * 0.45 + (Math.min(r1, r2) / 14) * 0.15 + (paired ? 0.3 : 0) + (suited ? 0.08 : 0))
  }

  function aiAct(session: SessionState, p: Player) {
    if (!['preflop', 'flop', 'turn', 'river'].includes(session.phase)) return
    if (session.players[session.turnIdx] !== p || p.folded || p.allIn) return
    session.undoSnapshot = null
    const toCall = Math.min(session.currentBet - p.bet, p.chips)
    const strength = handStrength(session, p)
    let raiseP = 0
    let callP = 0.5

    const diffMulti = session.difficulty === 'Hard' ? 1.2 : session.difficulty === 'Easy' ? 0.8 : 1.0;
    switch (p.style) {
      case 'Aggressive':
        raiseP = (0.42 + strength * 0.35) * diffMulti
        callP = 0.4 * diffMulti
        break
      case 'Tight':
        raiseP = (strength > 0.55 ? 0.3 : 0.04) * diffMulti
        callP = (toCall === 0 ? 0.92 : (strength > 0.4 ? 0.6 : 0.16)) * diffMulti
        break
      case 'Bluffer':
        raiseP = (0.24 + (1 - strength) * 0.28) * diffMulti
        callP = 0.4
        break
      default:
        break
    }

    const maxContinueProbability = session.difficulty === 'Hard' ? 0.94 : session.difficulty === 'Easy' ? 0.78 : 0.88
    const continueProbability = raiseP + callP
    if (continueProbability > maxContinueProbability) {
      const scale = maxContinueProbability / continueProbability
      raiseP *= scale
      callP *= scale
    }

    const r = Math.random()
    if (toCall === 0) {
      if (r < raiseP && p.chips > 0) {
        const extra = Math.floor(Math.random() * Math.max(session.pot * 0.5, session.minRaiseInc))
        const add = Math.min(session.minRaiseInc + extra, p.chips)
        applyRaise(session, p, add)
      } else {
        applyCheck(session, p)
      }
    } else if (r < raiseP && p.chips > toCall) {
      const extra = Math.floor(Math.random() * Math.max(session.pot * 0.4, session.minRaiseInc))
      const add = Math.min(toCall + session.minRaiseInc + extra, p.chips)
      applyRaise(session, p, add)
    } else if (r < raiseP + callP && (toCall <= p.chips)) {
      applyCall(session, p)
    } else {
      applyFold(session, p)
    }
  }

  // ===== Hand resolution =====
  function awardUncontested(session: SessionState, winner: Player) {
    const potAmount = session.pot
    winner.chips += potAmount
    session.pot = 0
    finalizeHand(session, [winner.id], 'Uncontested', potAmount, { [winner.id]: potAmount }, false)
  }

  function resolveShowdown(session: SessionState) {
    session.revealed = true
    const contenders = session.players.filter(p => !p.folded)
    const results = new Map(contenders.map(p => [p.id, evaluateHand(p.hole, session.board)]))

    // Side pots by committed layers.
    const levels = [...new Set(session.players.filter(p => p.committed > 0).map(p => p.committed))].sort((a, b) => a - b)
    const gains: Record<number, number> = {}
    let low = 0
    for (const level of levels) {
      let layerPot = 0
      for (const p of session.players) {
        layerPot += Math.max(0, Math.min(p.committed, level) - low)
      }
      const eligible = contenders.filter(p => p.committed >= level)
      if (eligible.length > 0 && layerPot > 0) {
        let best = eligible[0]
        for (const p of eligible) {
          if (compareHands(results.get(p.id)!, results.get(best.id)!) > 0) best = p
        }
        const tied = eligible.filter(p => compareHands(results.get(p.id)!, results.get(best.id)!) === 0)
        const share = Math.floor(layerPot / tied.length)
        let remainder = layerPot - share * tied.length
        for (const p of tied) {
          const got = share + (remainder > 0 ? 1 : 0)
          if (remainder > 0) remainder--
          p.chips += got
          gains[p.id] = (gains[p.id] || 0) + got
        }
      }
      low = level
    }

    // Overall best hand for the highlight.
    let best = contenders[0]
    for (const p of contenders) {
      if (compareHands(results.get(p.id)!, results.get(best.id)!) > 0) best = p
    }
    const bestResult = results.get(best.id)!
    const tiedTop = contenders.filter(p => compareHands(results.get(p.id)!, results.get(best.id)!) === 0)
    const potAmount = session.pot
    session.pot = 0
    session.winCardKeys = bestResult.bestCards.map(cardKey)
    finalizeHand(session, tiedTop.map(p => p.id), bestResult.handType, potAmount, gains, true)
  }

  function finalizeHand(
    session: SessionState,
    winnerIds: number[],
    result: HandType | 'Uncontested',
    potAmount: number,
    gains: Record<number, number>,
    wasShowdown: boolean,
  ) {
    session.completedHands++
    session.phase = 'handOver'
    session.awaitingHuman = false
    session.undoSnapshot = null
    session.winnerIds = winnerIds
    session.winLabel = result

    const names = winnerIds.map(id => session.players[id].name)
    const winnerLabel = names.join(' and ')
    if (winnerIds.length > 1) {
      session.status = `Split pot — ${winnerLabel} share ${potAmount} chips (${result})`
    } else if (winnerIds[0] === 0) {
      session.status = wasShowdown
        ? `You win ${potAmount} chips with ${result}`
        : `You win ${potAmount} chips — everyone else folded`
    } else {
      session.status = wasShowdown
        ? `${winnerLabel} wins ${potAmount} chips with ${result}`
        : `${winnerLabel} wins ${potAmount} chips — everyone else folded`
    }

    session.historySeq++
    session.history.unshift({
      id: `h${session.historySeq}`,
      hand: session.completedHands,
      pot: potAmount,
      winner: winnerLabel,
      winnerSeat: winnerIds[0],
      result,
    })
    if (session.history.length > 60) session.history = session.history.slice(0, 60)

    const humanGain = gains[0] || 0
    if (humanGain > 0) {
      session.handsWon++
      if (potAmount > session.biggestPot) session.biggestPot = potAmount
      unlockBadge(session, 'first-win')
      if (!wasShowdown) unlockBadge(session, 'bluff-win')
      if (potAmount >= 150) unlockBadge(session, 'big-pot')
      if (session.handsWon >= 3) unlockBadge(session, 'three-wins')
      if (session.rebuyPending) {
        unlockBadge(session, 'comeback-kid')
        session.rebuyPending = false
      }
      if (session.humanWentAllIn) unlockBadge(session, 'all-in-win')
    }
    if (session === tournament && blindsOf(session).level >= 2) unlockBadge(session, 'level-up')
    if (session.players.some(p => !p.isHuman && p.chips === 0)) unlockBadge(session, 'felted')
  }

  // ===== Rebuy / session reset =====
  function rebuy() {
    const session = s.value
    const h = session.players[0]
    if (h.chips > 0) return
    if (session.phase !== 'idle' && session.phase !== 'handOver') return
    h.chips = STARTING_CHIPS
    session.rebuys++
    session.rebuyPending = true
    session.status = `Rebuy complete — your stack is back to ${STARTING_CHIPS} chips`
    saveState()
  }

  function removeHistory(ids: string[]) {
    const session = s.value
    session.history = session.history.filter(entry => !ids.includes(entry.id))
  }

  function requestNewSession() {
    confirmOpen.value = true
  }

  function cancelNewSession() {
    confirmOpen.value = false
  }

  function confirmNewSession() {
    confirmOpen.value = false
    const session = s.value
    session.epoch++
    Object.assign(session, blankSession(), { epoch: session.epoch })
    session.status = 'Session reset — select Deal first hand to play'
    saveState()
  }

  function setMode(next: Mode) {
    if (mode.value === next) return
    if (next === 'practice') {
      practice.epoch++
      Object.assign(practice, blankSession(), { epoch: practice.epoch })
    } else {
      tournament.epoch++
      resumeSession(tournament)
    }
    mode.value = next
    drawerOpen.value = false
  }

  // ===== Collaboration scenario =====
  function nextOpId(author: 'You' | 'Peer'): string {
    collab.seq++
    return `${author.toLowerCase()}-${collab.seq}`
  }

  function applyOp(op: CollabOp) {
    if (collab.appliedIds.includes(op.opId)) return
    collab.appliedIds.push(op.opId)
    if (op.kind === 'add') {
      if (!collab.notes.some(n => n.id === op.noteId)) {
        collab.notes.push({ id: op.noteId, seq: op.noteSeq, text: op.text, author: op.author })
        collab.notes.sort((a, b) => a.seq - b.seq)
      }
    } else {
      const note = collab.notes.find(n => n.id === op.noteId)
      if (note) note.text = op.text
    }
  }

  function addNote(text: string): boolean {
    const trimmed = text.trim()
    if (!trimmed) return false
    collab.seq++
    const op: CollabOp = {
      opId: `you-${collab.seq}`,
      kind: 'add',
      noteId: `n${collab.seq}`,
      noteSeq: collab.seq,
      text: trimmed,
      author: 'You',
    }
    if (collab.offline) collab.queued.push(op)
    else applyOp(op)
    return true
  }

  function editNote(noteId: string, text: string): boolean {
    const trimmed = text.trim()
    const note = collab.notes.find(n => n.id === noteId)
    if (!trimmed || !note) return false
    const op: CollabOp = {
      opId: nextOpId('You'),
      kind: 'edit',
      noteId,
      noteSeq: note.seq,
      text: trimmed,
      author: 'You',
    }
    if (collab.offline) collab.queued.push(op)
    else applyOp(op)
    return true
  }

  function peerAddNote() {
    collab.seq++
    const op: CollabOp = {
      opId: `peer-${collab.seq}`,
      kind: 'add',
      noteId: `n${collab.seq}`,
      noteSeq: collab.seq,
      text: `Peer update ${collab.seq}`,
      author: 'Peer',
    }
    if (collab.offline) collab.peerPending.push(op)
    else applyOp(op)
  }

  function peerEditLatest(): boolean {
    // Prefer the note you edited while offline so a conflict is demonstrable;
    // otherwise the peer revises the most recent shared note.
    const queuedEdit = collab.offline ? [...collab.queued].reverse().find(o => o.kind === 'edit') : undefined
    const target = queuedEdit
      ? collab.notes.find(n => n.id === queuedEdit.noteId)
      : collab.notes[collab.notes.length - 1]
    const latest = target ?? collab.notes[collab.notes.length - 1]
    if (!latest) return false
    const op: CollabOp = {
      opId: nextOpId('Peer'),
      kind: 'edit',
      noteId: latest.id,
      noteSeq: latest.seq,
      text: `${latest.text} (peer revision)`,
      author: 'Peer',
    }
    if (collab.offline) collab.peerPending.push(op)
    else applyOp(op)
    return true
  }

  function goOffline() {
    if (collab.offline) return
    collab.offline = true
  }

  function goOnline() {
    if (!collab.offline) return
    collab.offline = false
    if (collab.queued.length > 0 || collab.peerPending.length > 0) {
      collab.pendingDelivery = true
    }
  }

  function deliver(order: 'mine' | 'peer') {
    if (!collab.pendingDelivery) return
    const mineEdits = collab.queued.filter(o => o.kind === 'edit')
    const theirEdits = collab.peerPending.filter(o => o.kind === 'edit')
    let conflictPair: { noteId: string; mine: CollabOp; theirs: CollabOp } | null = null
    for (const m of mineEdits) {
      const t = theirEdits.find(o => o.noteId === m.noteId)
      if (t) {
        conflictPair = { noteId: m.noteId, mine: m, theirs: t }
        break
      }
    }
    const conflictIds = conflictPair ? [conflictPair.mine.opId, conflictPair.theirs.opId] : []
    const batches = order === 'mine'
      ? [...collab.queued, ...collab.peerPending]
      : [...collab.peerPending, ...collab.queued]
    for (const op of batches) {
      if (conflictIds.includes(op.opId)) continue
      applyOp(op)
    }
    collab.queued = []
    collab.peerPending = []
    collab.pendingDelivery = false
    collab.conflict = conflictPair
  }

  function resolveConflict(keep: 'mine' | 'theirs') {
    if (!collab.conflict) return
    const op = keep === 'mine' ? collab.conflict.mine : collab.conflict.theirs
    applyOp(op)
    collab.conflict = null
  }
  
  
  function generateExportJson() {
    const session = s.value;
    const doc = {
      schemaVersion: 'feltrun-session-v1',
      session: {
        handsPlayed: session.completedHands,
        handsWon: session.handsWon,
        biggestPot: session.biggestPot,
        rebuys: session.rebuys,
        blindLevel: blindsOf(session).level,
        smallBlind: blindsOf(session).small,
        bigBlind: blindsOf(session).big,
        difficulty: session.difficulty || 'Standard',
        badges: badges.value.filter(b => b.unlocked).map(b => b.name)
      },
      stacks: session.players.map(p => ({
        seat: p.id,
        chips: p.chips,
        style: p.isHuman ? 'human' : p.style
      })),
      handHistory: session.history.map(h => ({
        handNumber: h.hand,
        pot: h.pot,
        winnerSeat: h.winnerSeat ?? session.players.find(player => h.winner.split(' and ').includes(player.name))?.id ?? 0,
        winnerName: h.winner,
        handType: h.result,
        board: [], // We don't store this in history yet
        actions: [] // Not stored in history yet
      })),
      inProgressHand: session.phase === 'idle' || session.phase === 'handOver' ? null : {
        street: session.phase,
        pot: session.pot,
        sideToAct: session.turnIdx,
        board: session.board.map(cardKey),
        holeCards: session.players[0].hole.map(cardKey)
      }
    };
    return JSON.stringify(doc, null, 2);
  }

  const cardCodeSchema = z.string().regex(/^[2-9TJQKA][♠♥♦♣]$/, 'must be a valid card code')
  const handHistorySchema = z.object({
    handNumber: z.number().int().positive(),
    pot: z.number().int().nonnegative(),
    winnerSeat: z.number().int().min(0).max(3),
    winnerName: z.string().min(1),
    handType: z.string().min(1),
    board: z.array(cardCodeSchema).max(5),
    actions: z.array(z.object({
      seat: z.number().int().min(0).max(3),
      street: z.enum(['preflop', 'flop', 'turn', 'river']),
      action: z.enum(['fold', 'check', 'call', 'raise', 'all-in']),
      amount: z.number().int().nonnegative(),
    })),
  })
  const sessionDocumentSchema = z.object({
    schemaVersion: z.literal('feltrun-session-v1'),
    session: z.object({
      handsPlayed: z.number().int().nonnegative(),
      handsWon: z.number().int().nonnegative(),
      biggestPot: z.number().int().nonnegative(),
      rebuys: z.number().int().nonnegative(),
      blindLevel: z.number().int().positive(),
      smallBlind: z.number().int().nonnegative(),
      bigBlind: z.number().int().nonnegative(),
      difficulty: z.enum(['Easy', 'Standard', 'Hard']),
      badges: z.array(z.string()),
    }),
    stacks: z.array(z.object({
      seat: z.number().int().min(0).max(3),
      chips: z.number().int().nonnegative(),
      style: z.enum(['human', 'Aggressive', 'Tight', 'Bluffer']),
    })).length(4).refine(stacks => new Set(stacks.map(stack => stack.seat)).size === 4, 'seat values must be unique'),
    handHistory: z.array(handHistorySchema),
    inProgressHand: z.object({
      street: z.enum(['preflop', 'flop', 'turn', 'river']),
      pot: z.number().int().nonnegative(),
      sideToAct: z.number().int().min(0).max(3),
      board: z.array(cardCodeSchema).max(5),
      holeCards: z.array(cardCodeSchema).length(2),
    }).nullable(),
  })

  type SessionDocument = z.infer<typeof sessionDocumentSchema>
  type SessionParseResult = { success: true; data: SessionDocument } | { success: false; error: string }

  function parseSessionJson(json: string): SessionParseResult {
    try {
      const validation = sessionDocumentSchema.safeParse(JSON.parse(json))
      if (!validation.success) {
        const issue = validation.error.issues[0]
        const field = issue.path.length ? issue.path.join('.') : 'session'
        return { success: false, error: `${field}: ${issue.message}` }
      }
      return { success: true, data: validation.data }
    } catch {
      return { success: false, error: 'session: invalid JSON format' }
    }
  }

  function validateSessionJson(json: string): { success: true } | { success: false; error: string } {
    const result = parseSessionJson(json)
    return result.success ? { success: true } : result
  }

  function importSessionJson(json: string): { success: true } | { success: false; error: string } {
    const validation = parseSessionJson(json)
    if (!validation.success) return validation

    try {
      const doc = validation.data
      const session = s.value
      const importedPlayers = newPlayers()
      for (const stack of doc.stacks) {
        const player = importedPlayers[stack.seat]
        player.chips = stack.chips
        player.style = stack.style === 'human' ? null : stack.style
        player.allIn = stack.chips === 0
      }

      const previousEpoch = session.epoch
      Object.assign(session, blankSession())
      session.epoch = previousEpoch + 1
      session.players = importedPlayers
      session.completedHands = doc.session.handsPlayed
      session.handsWon = doc.session.handsWon
      session.biggestPot = doc.session.biggestPot
      session.rebuys = doc.session.rebuys
      session.difficulty = doc.session.difficulty
      session.unlocked = BADGE_DEFS
        .filter(badge => doc.session.badges.includes(badge.name))
        .map(badge => badge.id)
      session.history = doc.handHistory.map((hand, index) => ({
        id: `imported-${hand.handNumber}-${index}`,
        hand: hand.handNumber,
        pot: hand.pot,
        winner: hand.winnerName,
        winnerSeat: hand.winnerSeat,
        result: hand.handType,
      }))
      session.historySeq = Math.max(0, ...doc.handHistory.map(hand => hand.handNumber))

      if (doc.inProgressHand) {
        const importedHand = doc.inProgressHand
        const knownCards = new Set([...importedHand.board, ...importedHand.holeCards])
        const remainingDeck = shuffleDeck(createDeck().filter(card => !knownCards.has(cardKey(card))))
        session.phase = importedHand.street
        session.pot = importedHand.pot
        session.turnIdx = importedHand.sideToAct
        session.board = importedHand.board.map(parseCard)
        session.players[0].hole = importedHand.holeCards.map(parseCard)
        for (const player of session.players.slice(1)) {
          player.hole = [remainingDeck.pop()!, remainingDeck.pop()!]
        }
        session.deck = remainingDeck
        session.minRaiseInc = doc.session.bigBlind
        session.awaitingHuman = importedHand.sideToAct === 0
        session.status = `Imported ${importedHand.street} hand`
        refreshEquity(session)
      }

      saveState()
      resumeSession(session)
      return { success: true }
    } catch (e) {
      return { success: false, error: 'session: invalid JSON format' }
    }
  }


  return {
    // state
    tournament, practice, collab, mode, toasts, confirmOpen, drawerOpen,
    showHistory, showBadges, showExport,
    // getters
    s, blinds, human, isHumanTurn, callAmount, canCheck, minRaiseAdd, winRate, badges,
    // actions
    initGame, dealNextHand, humanFold, humanCheck, humanCall, humanRaise, humanAllIn,
    rebuy, removeHistory, requestNewSession, cancelNewSession, confirmNewSession, setMode,
    addNote, editNote, peerAddNote, peerEditLatest, goOffline, goOnline, deliver, resolveConflict,
    pushToast, generateExportJson, validateSessionJson, importSessionJson, saveTable, loadSavedTable, undoAction,
  }
})
