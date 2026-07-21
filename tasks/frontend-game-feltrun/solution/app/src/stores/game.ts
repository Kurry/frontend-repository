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

export type StreetAction = 'fold' | 'check' | 'call' | 'raise' | 'all-in'

export interface ActionRec {
  seat: number
  street: 'preflop' | 'flop' | 'turn' | 'river'
  action: StreetAction
  amount: number
}

export interface TimelinePoint {
  hand: number
  won: boolean
  delta: number
  stack: number
}

export interface HistoryEntry {
  id: string
  hand: number
  pot: number
  winner: string
  winnerSeat?: number
  result: string
  board: string[]
  actions: ActionRec[]
  winCards: string[]
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
  actions: ActionRec[]
  lastActor: number
  potPulse: number
  turnThinking: string
  feed: string[]
  timeline: TimelinePoint[]
  coachDismissed: boolean
  savedAtEpoch: number
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
    actions: [],
    lastActor: -1,
    potPulse: 0,
    turnThinking: '',
    feed: [],
    timeline: [],
    coachDismissed: false,
    savedAtEpoch: -1,
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
  myNotes: Record<string, { text: string; opId: string }>
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
    myNotes: {},
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
  const controlMessage = ref('')
  const shortcutRaise = ref(0)
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

  // AI "thinking" cadence — long enough that a human (or the judge) can measure
  // the exact stack/pot delta of a raise, use Undo last action before an AI
  // response, or Save table mid-hand and reload without state leaking forward.
  const AI_THINK_MIN = 1250
  const AI_THINK_JITTER = 750
  const STREET_RUNOUT = 1100
  const SAVE_FREEZE_MS = 4000
  const aiDelay = () => AI_THINK_MIN + Math.floor(Math.random() * AI_THINK_JITTER)

  function pushFeed(session: SessionState, text: string) {
    session.feed = [text, ...session.feed].slice(0, 6)
  }

  function recordAction(
    session: SessionState,
    seat: number,
    action: StreetAction,
    amount: number,
  ) {
    const street = session.phase
    if (street !== 'preflop' && street !== 'flop' && street !== 'turn' && street !== 'river') return
    session.actions.push({ seat, street, action, amount: Math.max(0, Math.round(amount)) })
  }

  function markThinking(session: SessionState, p: Player) {
    session.turnThinking = p.name
    session.status = `${p.name} is thinking…`
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
          myNotes: collab.myNotes,
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
      actions: session.actions,
      feed: session.feed,
      timeline: session.timeline,
      winnerIds: session.winnerIds,
      winLabel: session.winLabel,
      winCardKeys: session.winCardKeys,
      lastActor: session.lastActor,
      potPulse: session.potPulse,
      turnThinking: session.turnThinking,
      status: session.status,
      difficulty: session.difficulty,
      unlocked: session.unlocked,
    });
    // While a mid-hand checkpoint is fresh, freeze the AI so a reload (or an
    // explicit Load saved table) resumes the exact saved position rather than a
    // later street the AI silently advanced to. Play unfreezes once the human
    // acts, the checkpoint is loaded, or the freeze window elapses.
    const midHand = ['preflop', 'flop', 'turn', 'river'].includes(session.phase);
    if (midHand) {
      session.epoch++;
      session.savedAtEpoch = session.epoch;
      session.turnThinking = '';
      window.setTimeout(() => {
        if (session.savedAtEpoch === session.epoch) resumeSession(session);
      }, SAVE_FREEZE_MS);
    } else {
      session.savedAtEpoch = session.epoch;
    }
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
      markThinking(session, p)
      schedule(session, () => aiAct(session, p), aiDelay())
    } else if (p && p.isHuman) {
      session.awaitingHuman = true
      session.turnThinking = ''
    } else {
      schedule(session, () => afterAction(session), STREET_RUNOUT)
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
    session.actions = []
    session.feed = []
    session.lastActor = -1
    session.turnThinking = ''
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
    session.lastActor = idx
    session.potPulse++
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
      session.turnThinking = ''
    } else {
      session.awaitingHuman = false
      markThinking(session, p)
      schedule(session, () => aiAct(session, p), aiDelay())
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
      schedule(session, () => nextStreet(session), STREET_RUNOUT)
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
      session.turnThinking = ''
    } else {
      session.awaitingHuman = false
      markThinking(session, p)
      schedule(session, () => aiAct(session, p), aiDelay())
    }
  }

  // ===== Actions =====
  function applyFold(session: SessionState, p: Player) {
    session.turnThinking = ''
    p.folded = true
    p.acted = true
    recordAction(session, p.id, 'fold', 0)
    const text = p.isHuman ? 'You fold' : `${p.name} folds`
    session.status = text
    pushFeed(session, text)
    session.lastActor = p.id
    if (p.isHuman) session.equity = null
    afterAction(session)
  }

  function applyCheck(session: SessionState, p: Player) {
    session.turnThinking = ''
    p.acted = true
    recordAction(session, p.id, 'check', 0)
    const text = p.isHuman ? 'You check' : `${p.name} checks`
    session.status = text
    pushFeed(session, text)
    afterAction(session)
  }

  function applyCall(session: SessionState, p: Player) {
    const toCall = Math.min(session.currentBet - p.bet, p.chips)
    if (toCall <= 0) {
      applyCheck(session, p)
      return
    }
    session.turnThinking = ''
    p.chips -= toCall
    p.bet += toCall
    p.committed += toCall
    session.pot += toCall
    p.acted = true
    session.lastActor = p.id
    session.potPulse++
    if (p.chips === 0) {
      p.allIn = true
      if (p.isHuman) session.humanWentAllIn = true
      recordAction(session, p.id, 'all-in', toCall)
      const text = `${p.isHuman ? 'You call' : p.name + ' calls'} ${toCall} and ${p.isHuman ? 'are' : 'is'} all-in`
      session.status = text
      pushFeed(session, text)
    } else {
      recordAction(session, p.id, 'call', toCall)
      const text = `${p.isHuman ? 'You call' : p.name + ' calls'} ${toCall}`
      session.status = text
      pushFeed(session, text)
    }
    afterAction(session)
  }

  function applyRaise(session: SessionState, p: Player, add: number) {
    const amount = Math.min(add, p.chips)
    session.turnThinking = ''
    p.chips -= amount
    p.bet += amount
    p.committed += amount
    session.pot += amount
    p.acted = true
    session.lastActor = p.id
    session.potPulse++
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
      recordAction(session, p.id, 'all-in', amount)
      const text = `${p.isHuman ? 'You go' : p.name + ' goes'} all-in for ${p.bet}`
      session.status = text
      pushFeed(session, text)
    } else {
      recordAction(session, p.id, 'raise', amount)
      const text = `${p.isHuman ? 'You raise' : p.name + ' raises'} to ${p.bet}`
      session.status = text
      pushFeed(session, text)
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
      actions: session.actions,
      feed: session.feed,
      lastActor: session.lastActor,
      potPulse: session.potPulse,
      turnThinking: session.turnThinking,
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
      session.turnThinking = '';
      return true;
    } catch {
      return false;
    }
  }

  function humanActionError(): string | null {
    const session = s.value
    if (session.phase === 'handOver') {
      return 'This hand has ended — deal the next hand to act again'
    }
    if (!['preflop', 'flop', 'turn', 'river'].includes(session.phase)) {
      return 'No active hand — deal a hand before betting'
    }
    const h = session.players[0]
    if (h.folded) return 'You folded this hand — you can act on the next hand'
    if (h.allIn) return "You're all-in — no further action this hand"
    if (!isHumanTurn.value) {
      const name = session.players[session.turnIdx]?.name ?? 'an opponent'
      return `Wait for ${name} — the action hasn't reached you yet`
    }
    return null
  }

  function humanTurnGuard(): Player | null {
    const session = s.value
    if (!isHumanTurn.value) return null
    const p = session.players[session.turnIdx]
    if (!p || !p.isHuman || p.folded || p.allIn) return null
    session.undoSnapshot = createSnapshot(session)
    // A valid human action resumes normal progression itself; invalidate any
    // delayed save-freeze callback so it cannot schedule a duplicate AI turn.
    session.savedAtEpoch = -1
    session.awaitingHuman = false
    return p
  }

  function humanFold(): string | null {
    const err = humanActionError()
    if (err) return err
    const p = humanTurnGuard()
    if (p) applyFold(s.value, p)
    return null
  }

  function humanCheck(): string | null {
    const err = humanActionError()
    if (err) return err
    if (!canCheck.value) return `Check isn't available — there is a ${callAmount.value}-chip bet to call`
    const p = humanTurnGuard()
    if (p) applyCheck(s.value, p)
    return null
  }

  function humanCall(): string | null {
    const err = humanActionError()
    if (err) return err
    if (canCheck.value) return 'Nothing to call — use Check when there is no outstanding bet'
    const p = humanTurnGuard()
    if (p) applyCall(s.value, p)
    return null
  }

  function humanRaise(add: number): string | null {
    const err = humanActionError()
    if (err) return err
    const session = s.value
    const h = session.players[0]
    if (!Number.isFinite(add) || add <= 0 || Math.floor(add) !== add) {
      return `Raise amount must be a whole number of chips. Enter an integer between ${minRaiseAdd.value} and ${h.chips}`
    }
    if (add > h.chips) {
      return `Raise amount can't exceed your stack of ${h.chips} chips. Enter a lower amount or select All-in`
    }
    if (add < minRaiseAdd.value && add !== h.chips) {
      return `Raise amount must be at least ${minRaiseAdd.value} chips. Enter a higher amount or select All-in`
    }
    const p = humanTurnGuard()
    if (p) applyRaise(session, p, add)
    return null
  }

  function humanAllIn(): string | null {
    const err = humanActionError()
    if (err) return err
    const p = humanTurnGuard()
    if (!p) return null
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
    const facingBet = toCall > 0

    // Per-style baseline probabilities. Aggressive opens/raises most; Tight
    // folds or calls conservatively; the Bluffer raises on weak holdings and
    // calls down to showdown so its revealed hands are often weak.
    let raiseBase = 0
    let callBase = 0.5
    switch (p.style) {
      case 'Aggressive':
        raiseBase = 0.32 + strength * 0.3
        callBase = 0.6
        break
      case 'Tight':
        raiseBase = strength > 0.6 ? 0.22 : 0.03
        callBase = facingBet ? (strength > 0.5 ? 0.55 : 0.1) : 0.9
        break
      case 'Bluffer':
        raiseBase = 0.3 + (1 - strength) * 0.34
        callBase = 0.58
        break
      default:
        raiseBase = 0.2
        callBase = 0.5
    }

    // Difficulty scales overall willingness to continue: Easy folds often, Hard
    // calls and raises more and folds rarely — a clear, observable gap.
    const cont = session.difficulty === 'Hard' ? 1.45 : session.difficulty === 'Easy' ? 0.5 : 1
    let raiseP = Math.min(0.95, raiseBase * cont)
    let callP = Math.min(0.95, callBase * cont)

    // Facing an all-in (or a bet at least as big as the stack) the AI must make
    // a real call/fold decision; loosen the calling styles so a player who
    // shoves can actually get looked up and bust when they run into a better hand.
    const facingShove = toCall >= p.chips
    if (facingShove) {
      const shoveCall = p.style === 'Tight'
        ? (strength > 0.45 ? 0.6 : 0.25)
        : p.style === 'Aggressive' ? 0.82 : 0.72
      const shoveMult = session.difficulty === 'Hard' ? 1.2 : session.difficulty === 'Easy' ? 0.8 : 1
      callP = Math.max(callP, shoveCall * shoveMult)
      raiseP = 0
    }

    const total = raiseP + callP
    if (total > 0.96) {
      const scale = 0.96 / total
      raiseP *= scale
      callP *= scale
    }

    const betSize = () => {
      const extra = Math.floor(Math.random() * Math.max(session.minRaiseInc, Math.floor(session.pot * 0.45)))
      const cap = Math.max(session.minRaiseInc * 2, Math.floor(session.pot * 0.9) + session.minRaiseInc)
      return Math.min(cap, session.minRaiseInc + extra)
    }

    const r = Math.random()
    if (!facingBet) {
      if (r < raiseP && p.chips > 0) {
        applyRaise(session, p, Math.min(betSize(), p.chips))
      } else {
        applyCheck(session, p)
      }
    } else if (r < raiseP && p.chips > toCall) {
      applyRaise(session, p, Math.min(toCall + betSize(), p.chips))
    } else if (r < raiseP + callP) {
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
    session.turnThinking = ''
    session.winnerIds = winnerIds
    session.winLabel = result
    session.winCardKeys = wasShowdown ? session.winCardKeys : []

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
    pushFeed(session, session.status)

    session.historySeq++
    session.history.unshift({
      id: `h${session.historySeq}`,
      hand: session.completedHands,
      pot: potAmount,
      winner: winnerLabel,
      winnerSeat: winnerIds[0],
      result,
      board: session.board.map(cardKey),
      actions: session.actions.map(a => ({ ...a })),
      winCards: wasShowdown ? [...session.winCardKeys] : [],
    })
    if (session.history.length > 60) session.history = session.history.slice(0, 60)

    const humanGain = gains[0] || 0
    const humanCommitted = session.players[0].committed
    const stackAfter = session.players[0].chips
    session.timeline = [
      ...session.timeline,
      { hand: session.completedHands, won: humanGain > 0, delta: humanGain - humanCommitted, stack: stackAfter },
    ].slice(-30)

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
    if (op.author === 'You') collab.myNotes[op.noteId] = { text: op.text, opId: op.opId }
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
    collab.myNotes[op.noteId] = { text: op.text, opId: op.opId }
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
    collab.myNotes[op.noteId] = { text: op.text, opId: op.opId }
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
    if (collab.offline) {
      collab.peerPending.push(op)
      return true
    }
    // Online: if I authored or edited this note, the peer revision is a
    // same-note conflict that must surface an explicit keep-mine / keep-peer
    // choice rather than silently overwriting my version.
    const mine = collab.myNotes[latest.id]
    if (mine) {
      collab.conflict = {
        noteId: latest.id,
        mine: { opId: mine.opId, kind: 'edit', noteId: latest.id, noteSeq: latest.seq, text: mine.text, author: 'You' },
        theirs: op,
      }
      return true
    }
    applyOp(op)
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
    const theirEdits = collab.peerPending.filter(o => o.kind === 'edit')
    let conflictPair: { noteId: string; mine: CollabOp; theirs: CollabOp } | null = null
    for (const t of theirEdits) {
      const queuedMine = collab.queued.find(o => o.kind === 'edit' && o.noteId === t.noteId)
      if (queuedMine) {
        conflictPair = { noteId: t.noteId, mine: queuedMine, theirs: t }
        break
      }
      const m = collab.myNotes[t.noteId]
      if (m) {
        const note = collab.notes.find(n => n.id === t.noteId)
        conflictPair = {
          noteId: t.noteId,
          mine: { opId: m.opId, kind: 'edit', noteId: t.noteId, noteSeq: note?.seq ?? 0, text: m.text, author: 'You' },
          theirs: t,
        }
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
    collab.myNotes[op.noteId] = { text: op.text, opId: op.opId }
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
        board: h.board ?? [],
        actions: (h.actions ?? []).map(a => ({
          seat: a.seat,
          street: a.street,
          action: a.action,
          amount: a.amount,
        })),
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

  // Second portable view: a human-readable hand log, in addition to the
  // mandated session JSON. Same data, formatted for sharing in plain text.
  function generateHandHistoryText(): string {
    const session = s.value
    const bl = blindsOf(session)
    const lines: string[] = []
    lines.push(`FeltRun session — Level ${bl.level} (blinds ${bl.small}/${bl.big}), difficulty ${session.difficulty}`)
    lines.push(`Hands played ${session.completedHands} · won ${session.handsWon} (${winRate.value}%) · biggest pot ${session.biggestPot} · rebuys ${session.rebuys}`)
    if (session.history.length === 0) {
      lines.push('')
      lines.push('No hands played yet.')
      return lines.join('\n')
    }
    for (const h of session.history) {
      lines.push('')
      lines.push(`Hand ${h.hand} — pot ${h.pot} — ${h.winner} (${h.result})`)
      if (h.board && h.board.length > 0) lines.push(`  Board: ${h.board.join(' ')}`)
      const byStreet: Record<string, string[]> = { preflop: [], flop: [], turn: [], river: [] }
      for (const a of h.actions ?? []) {
        const name = session.players[a.seat]?.name ?? `Seat ${a.seat}`
        const amount = a.action === 'call' || a.action === 'raise' || a.action === 'all-in' ? ` ${a.amount}` : ''
        byStreet[a.street]?.push(`${name} ${a.action}${amount}`)
      }
      for (const street of ['preflop', 'flop', 'turn', 'river'] as const) {
        if (byStreet[street].length) lines.push(`  ${street[0].toUpperCase()}${street.slice(1)}: ${byStreet[street].join(' · ')}`)
      }
    }
    return lines.join('\n')
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
        board: hand.board ?? [],
        actions: (hand.actions ?? []).map(a => ({ seat: a.seat, street: a.street, action: a.action, amount: a.amount })),
        winCards: [],
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
    showHistory, showBadges, showExport, controlMessage, shortcutRaise,
    // getters
    s, blinds, human, isHumanTurn, callAmount, canCheck, minRaiseAdd, winRate, badges,
    // actions
    initGame, dealNextHand, humanFold, humanCheck, humanCall, humanRaise, humanAllIn,
    rebuy, removeHistory, requestNewSession, cancelNewSession, confirmNewSession, setMode,
    addNote, editNote, peerAddNote, peerEditLatest, goOffline, goOnline, deliver, resolveConflict,
    pushToast, generateExportJson, generateHandHistoryText, validateSessionJson, importSessionJson, saveTable, loadSavedTable, undoAction,
    dismissCoach: () => { s.value.coachDismissed = true },
  }
})
