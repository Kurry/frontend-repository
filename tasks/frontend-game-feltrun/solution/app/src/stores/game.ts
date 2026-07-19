import { defineStore } from 'pinia'
import { reactive, ref, computed, watch } from 'vue'
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

interface SessionState {
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
  function saveState() {
    if (!loaded) return
    try {
      const t = tournament
      const payload = {
        mode: mode.value,
        tournament: {
          players: t.players.map(p => ({ ...p, hole: p.hole.map(cardKey) })),
          deck: t.deck.map(cardKey),
          board: t.board.map(cardKey),
          pot: t.pot,
          phase: t.phase,
          currentBet: t.currentBet,
          minRaiseInc: t.minRaiseInc,
          turnIdx: t.turnIdx,
          dealerIdx: t.dealerIdx,
          awaitingHuman: t.awaitingHuman,
          revealed: t.revealed,
          completedHands: t.completedHands,
          handsWon: t.handsWon,
          biggestPot: t.biggestPot,
          rebuys: t.rebuys,
          history: t.history,
          unlocked: t.unlocked,
          equity: t.equity,
          status: t.status,
          winnerIds: t.winnerIds,
          winCardKeys: t.winCardKeys,
          winLabel: t.winLabel,
          rebuyPending: t.rebuyPending,
          humanWentAllIn: t.humanWentAllIn,
          historySeq: t.historySeq,
        },
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
      const data = JSON.parse(raw)
      const t = data.tournament
      if (t && Array.isArray(t.players) && t.players.length === 4) {
        tournament.players = t.players.map((p: any, i: number) => ({
          ...newPlayers()[i],
          ...p,
          hole: Array.isArray(p.hole) ? p.hole.map(parseCard) : [],
        }))
        tournament.deck = (t.deck || []).map(parseCard)
        tournament.board = (t.board || []).map(parseCard)
        tournament.pot = t.pot || 0
        tournament.phase = t.phase || 'idle'
        tournament.currentBet = t.currentBet || 0
        tournament.minRaiseInc = t.minRaiseInc || 10
        tournament.turnIdx = t.turnIdx ?? -1
        tournament.dealerIdx = t.dealerIdx ?? 3
        tournament.awaitingHuman = !!t.awaitingHuman
        tournament.revealed = !!t.revealed
        tournament.completedHands = t.completedHands || 0
        tournament.handsWon = t.handsWon || 0
        tournament.biggestPot = t.biggestPot || 0
        tournament.rebuys = t.rebuys || 0
        tournament.history = Array.isArray(t.history) ? t.history : []
        tournament.unlocked = Array.isArray(t.unlocked) ? t.unlocked : []
        tournament.equity = typeof t.equity === 'number' ? t.equity : null
        tournament.status = t.status || ''
        tournament.winnerIds = Array.isArray(t.winnerIds) ? t.winnerIds : []
        tournament.winCardKeys = Array.isArray(t.winCardKeys) ? t.winCardKeys : []
        tournament.winLabel = t.winLabel || ''
        tournament.rebuyPending = !!t.rebuyPending
        tournament.humanWentAllIn = !!t.humanWentAllIn
        tournament.historySeq = t.historySeq || 0
      }
      const c = data.collab
      if (c && Array.isArray(c.notes)) {
        collab.notes = c.notes
        collab.seq = c.seq || 0
        collab.offline = !!c.offline
        collab.queued = Array.isArray(c.queued) ? c.queued : []
        collab.peerPending = Array.isArray(c.peerPending) ? c.peerPending : []
        collab.appliedIds = Array.isArray(c.appliedIds) ? c.appliedIds : []
        collab.pendingDelivery = !!c.pendingDelivery
        collab.conflict = c.conflict || null
      }
      if (data.mode === 'practice') {
        // Practice progress never persists — return to the tournament table.
        mode.value = 'tournament'
      }
      return true
    } catch {
      return false
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

  watch([tournament, collab, mode], () => saveState(), { deep: true })

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
  function humanTurnGuard(): Player | null {
    const session = s.value
    if (!isHumanTurn.value) return null
    const p = session.players[session.turnIdx]
    if (!p || !p.isHuman || p.folded || p.allIn) return null
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
    const toCall = Math.min(session.currentBet - p.bet, p.chips)
    const strength = handStrength(session, p)
    let raiseP = 0
    let callP = 0.5

    switch (p.style) {
      case 'Aggressive':
        raiseP = 0.42 + strength * 0.35
        callP = 0.45
        break
      case 'Tight':
        raiseP = strength > 0.55 ? 0.3 : 0.04
        callP = toCall === 0 ? 0.92 : (strength > 0.4 ? 0.6 : 0.16)
        break
      case 'Bluffer':
        raiseP = 0.24 + (1 - strength) * 0.28
        callP = 0.4
        break
      default:
        break
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

  return {
    // state
    tournament, practice, collab, mode, toasts, confirmOpen, drawerOpen,
    showHistory, showBadges,
    // getters
    s, blinds, human, isHumanTurn, callAmount, canCheck, minRaiseAdd, winRate, badges,
    // actions
    initGame, dealNextHand, humanFold, humanCheck, humanCall, humanRaise, humanAllIn,
    rebuy, removeHistory, requestNewSession, cancelNewSession, confirmNewSession, setMode,
    addNote, editNote, peerAddNote, peerEditLatest, goOffline, goOnline, deliver, resolveConflict,
    pushToast,
  }
})
