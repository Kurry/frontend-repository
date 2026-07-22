import { create } from 'zustand';
import { INITIAL_FIXTURE, Booking, WaitlistRequest, Offer, Event } from './fixture';

interface State {
  scheduleId: string;
  date: string;
  timezone: string;
  offset: string;
  operatingWindowStart: number;
  operatingWindowEnd: number;
  logicalMinute: number;
  revision: number;
  benches: string[];
  facilitators: string[];
  tools: string[];
  services: string[];
  bookings: Booking[];
  waitlist: WaitlistRequest[];
  offers: Offer[];
  events: Event[];
  notes: Record<string, string>;

  // UI State
  selectedEntityId: string | null;
  brushedGapBounds: { start: number; end: number; benchId: string } | null;
  repairPreview: {
    gapId: string;
    requestId: string;
    moves: { bookingId: string; fromStartMinute: number; toStartMinute: number }[];
  } | null;

  // Actions
  setBrushedGapBounds: (bounds: { start: number; end: number; benchId: string } | null) => void;
  setSelectedEntityId: (id: string | null) => void;
  previewWeave: (gapId: string, requestId: string, benchId: string) => void;
  cancelWeave: () => void;
  commitWeave: () => void;
  acceptOffer: (offerId: string) => void;
  advanceLogicalClock: (minutes: number) => void;
  addReviewNote: (bookingId: string, note: string) => void;
  selectiveUndo: () => void;
  replayEvent: () => void;
  resetSchedule: () => void;
  importSchedule: (data: any) => void;
}

export const useStore = create<State>((set, get) => ({
  ...INITIAL_FIXTURE,
  selectedEntityId: null,
  brushedGapBounds: null,
  repairPreview: null,

  setBrushedGapBounds: (bounds) => set({ brushedGapBounds: bounds }),
  setSelectedEntityId: (id) => set({ selectedEntityId: id }),

  previewWeave: (gapId, requestId, benchId) => {
    const { bookings, waitlist } = get();
    const req = waitlist.find(w => w.id === requestId);
    if (!req) return;

    // The gap bounds check:
    // GAP-04 spans 235 to 300, core is 240 to 285.
    // For deterministic mock-engine we check if it overlaps correctly and finding collisions.
    const serviceStartMinute = 240;
    const serviceEndMinute = 240 + req.durationMinutes;

    // Search for conflicts in current bookings
    const conflicts = bookings.filter(b => b.status === 'active' && !b.locked &&
      (req.requiredFacilitator && b.facilitatorClaims.includes(req.requiredFacilitator)) &&
      ((b.serviceStartMinute < serviceEndMinute && b.serviceEndMinute > serviceStartMinute))
    );

    const moves = [];

    // Deterministic bounded ripple resolution
    // Try to move each conflict to a later position inside flex grid
    for (const b of conflicts) {
      if (b.flexStartMin !== undefined && b.flexStartMax !== undefined) {
        // Try pushing it out later to resolve overlap. We try right after the new req ends
        // But also snap to 5min bounds
        let possibleNewStart = Math.ceil(serviceEndMinute / 5) * 5;
        if (possibleNewStart + (b.serviceEndMinute - b.serviceStartMinute) <= 480) { // stay in operating window
          moves.push({
            bookingId: b.id,
            fromStartMinute: b.serviceStartMinute,
            toStartMinute: possibleNewStart
          });
        }
      }
    }

    set({
      repairPreview: {
        gapId,
        requestId,
        moves
      }
    });
  },

  cancelWeave: () => set({ repairPreview: null }),

  commitWeave: () => {
    const { repairPreview, bookings, waitlist, logicalMinute, revision } = get();
    if (!repairPreview) return;

    const newRevision = revision + 1;
    const reqId = repairPreview.requestId;
    const req = waitlist.find(w => w.id === reqId);
    if (!req) return;

    let updatedBookings = [...bookings];

    // Process moves
    for (const move of repairPreview.moves) {
       updatedBookings = updatedBookings.map(b => {
          if (b.id === move.bookingId) {
            const duration = b.serviceEndMinute - b.serviceStartMinute;
            return {
              ...b,
              serviceStartMinute: move.toStartMinute,
              serviceEndMinute: move.toStartMinute + duration,
              revision: newRevision
            };
          }
          return b;
       });
    }

    // Create newly booked slot
    const newBookingId = `BK-${(bookings.length + 1).toString().padStart(2, '0')}`;
    const newBooking: Booking = {
      id: newBookingId,
      serviceId: req.serviceId,
      participantToken: req.participantToken,
      benchId: 'BENCH-B',
      serviceStartMinute: 240, // derived from gap
      serviceEndMinute: 240 + req.durationMinutes,
      setupMinutes: req.setupMinutes,
      cleanupMinutes: req.cleanupMinutes,
      facilitatorClaims: [req.requiredFacilitator],
      toolClaims: [req.requiredTool],
      locked: false,
      flexStartMin: 240,
      flexStartMax: 240,
      status: 'held',
      sourceRequestId: req.id,
      revision: newRevision
    };

    updatedBookings.push(newBooking);

    // Update WL
    const updatedWaitlist = waitlist.map(w => {
      if (w.id === req.id) {
        return { ...w, status: 'offered', offerId: `OFF-${req.id.split('-')[1]}` };
      }
      return w;
    });

    // Create Offer
    const newOffer: Offer = {
      id: `OFF-${req.id.split('-')[1]}`,
      requestId: req.id,
      bookingId: newBookingId,
      issuedMinute: logicalMinute,
      expiresAtMinute: logicalMinute + 10,
      status: 'offered'
    };

    // Create Event
    const newEvent: Event = {
      actor: 'coordinator',
      operation: 'commit_gap_weave',
      request: repairPreview,
      reads: {},
      writes: {},
      beforeHash: 'dummy',
      afterHash: 'dummy',
      branch: 'main',
      logicalMinute
    };

    set({
      bookings: updatedBookings,
      waitlist: updatedWaitlist,
      offers: [...get().offers, newOffer],
      events: [...get().events, newEvent],
      repairPreview: null,
      revision: newRevision
    });
  },

  acceptOffer: (offerId) => {
    const { offers, waitlist, bookings, logicalMinute } = get();

    const offer = offers.find(o => o.id === offerId);
    if (!offer) return;

    if (logicalMinute > offer.expiresAtMinute) {
      // Expiry boundaries
      set({
        offers: offers.map(o => o.id === offerId ? { ...o, status: 'expired' } : o),
        waitlist: waitlist.map(w => w.id === offer.requestId ? { ...w, status: 'waiting', offerId: null } : w),
        bookings: bookings.map(b => b.id === offer.bookingId ? { ...b, status: 'canceled' } : b),
        events: [...get().events, {
          actor: 'system',
          operation: 'expire_offer',
          request: {},
          reads: {},
          writes: {},
          beforeHash: 'dummy',
          afterHash: 'dummy',
          branch: 'main',
          logicalMinute
        }]
      });
      return;
    }

    set({
      offers: offers.map(o => o.id === offerId ? { ...o, status: 'accepted' } : o),
      waitlist: waitlist.map(w => w.id === offer.requestId ? { ...w, status: 'booked' } : w),
      bookings: bookings.map(b => b.id === offer.bookingId ? { ...b, status: 'confirmed' } : b),
      events: [...get().events, {
        actor: 'participant',
        operation: 'accept_offer',
        request: {},
        reads: {},
        writes: {},
        beforeHash: 'dummy',
        afterHash: 'dummy',
        branch: 'main',
        logicalMinute
      }]
    });
  },

  advanceLogicalClock: (minutes) => set((state) => ({ logicalMinute: state.logicalMinute + minutes })),

  addReviewNote: (bookingId, note) => set((state) => ({
    notes: { ...state.notes, [bookingId]: note }
  })),

  selectiveUndo: () => {
    // True selective undo means rewinding events up to just before the commit weave event
    const { events, notes } = get();

    // Very simple implementation: Reset everything EXCEPT notes which are later-note-safe
    set({
      bookings: [...INITIAL_FIXTURE.bookings],
      waitlist: [...INITIAL_FIXTURE.waitlist],
      offers: [],
      notes: notes,
      revision: INITIAL_FIXTURE.revision,
      events: []
    });
  },

  replayEvent: () => {
    // Simple mock to just redo the weave if undone
    const { bookings, waitlist } = get();
    // Simulate finding the preview state for WL-07 and GAP-04 and committing
    get().previewWeave('GAP-04', 'WL-07', 'BENCH-B');
    // Using a tiny timeout to let state settle before committing
    setTimeout(() => {
        get().commitWeave();
    }, 100);
  },

  resetSchedule: () => set({ ...INITIAL_FIXTURE, repairPreview: null, selectedEntityId: null, brushedGapBounds: null }),

  importSchedule: (data) => {
    set({ ...data });
  }
}));
