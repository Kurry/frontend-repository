export type BookingStatus = 'active' | 'held' | 'confirmed' | 'canceled';
export type WaitlistStatus = 'waiting' | 'offered' | 'booked' | 'declined' | 'expired' | 'withdrawn';
export type OfferStatus = 'offered' | 'accepted' | 'declined' | 'expired' | 'withdrawn';

export interface Booking {
  id: string;
  serviceId: string;
  participantToken: string;
  benchId: string;
  serviceStartMinute: number;
  serviceEndMinute: number;
  setupMinutes: number;
  cleanupMinutes: number;
  facilitatorClaims: string[];
  toolClaims: string[];
  locked: boolean;
  flexStartMin: number;
  flexStartMax: number;
  status: BookingStatus;
  sourceRequestId: string | null;
  revision: number;
}

export interface WaitlistRequest {
  id: string;
  participantToken: string;
  serviceId: string;
  durationMinutes: number;
  setupMinutes: number;
  cleanupMinutes: number;
  windowStartMinute: number;
  windowEndMinute: number;
  acceptableBenchIds: string[];
  requiredFacilitator: string;
  requiredTool: string;
  priority: number;
  joinedLogicalMinute: number;
  status: WaitlistStatus;
  offerId: string | null;
}

export interface Event {
  actor: string;
  operation: string;
  request: any;
  reads: any;
  writes: any;
  beforeHash: string;
  afterHash: string;
  inverseRelation?: string;
  replayRelation?: string;
  branch: string;
  approvalEffect?: string;
  logicalMinute: number;
}

export interface Offer {
  id: string;
  requestId: string;
  bookingId: string;
  issuedMinute: number;
  expiresAtMinute: number;
  status: OfferStatus;
}

export const INITIAL_FIXTURE = {
  scheduleId: 'LANTERN-PRINT-DAY-01',
  date: '2027-04-17',
  timezone: 'America/Detroit',
  offset: 'UTC-04:00',
  operatingWindowStart: 0,
  operatingWindowEnd: 480, // 09:00 - 17:00
  logicalMinute: 100, // Starts at 100 before we do anything
  revision: 43,

  benches: ['BENCH-A', 'BENCH-B', 'BENCH-C'],
  facilitators: ['FAC-IVO', 'FAC-MIA', 'FAC-LEO', 'FAC-SAM'],
  tools: ['ROLLER-01', 'ROLLER-02', 'CUTTER-01', 'PRESS-01', 'DRYER-01'],
  services: ['SVC-TWO-COLOR', 'SVC-INTRO', 'SVC-EXPERT', 'SVC-QUICK', 'SVC-LONG', 'SVC-FLEX'],

  bookings: [
    {
      id: 'BK-12',
      serviceId: 'SVC-EXPERT',
      participantToken: 'PT-ANON',
      benchId: 'BENCH-C',
      serviceStartMinute: 270, // 13:30
      serviceEndMinute: 300, // 14:00
      setupMinutes: 0,
      cleanupMinutes: 0,
      facilitatorClaims: ['FAC-IVO'],
      toolClaims: ['CUTTER-01'],
      locked: false,
      flexStartMin: 270,
      flexStartMax: 300,
      status: 'active',
      sourceRequestId: null,
      revision: 40
    } as Booking,
    {
      id: 'BK-14',
      serviceId: 'SVC-TWO-COLOR',
      participantToken: 'PT-TOMB',
      benchId: 'BENCH-B',
      serviceStartMinute: 240, // 13:00
      serviceEndMinute: 285, // 13:45
      setupMinutes: 5,
      cleanupMinutes: 15,
      facilitatorClaims: [],
      toolClaims: [],
      locked: false,
      flexStartMin: 240,
      flexStartMax: 240,
      status: 'canceled',
      sourceRequestId: null,
      revision: 41
    } as Booking,
    // Add dummy active bookings to reach 17 active bookings as requested
  ],
  waitlist: [
    {
      id: 'WL-07',
      participantToken: 'PT-LARK',
      serviceId: 'SVC-TWO-COLOR',
      durationMinutes: 45,
      setupMinutes: 5,
      cleanupMinutes: 15,
      windowStartMinute: 220,
      windowEndMinute: 330,
      acceptableBenchIds: ['BENCH-A', 'BENCH-B'],
      requiredFacilitator: 'FAC-IVO',
      requiredTool: 'ROLLER-02',
      priority: 4,
      joinedLogicalMinute: 62,
      status: 'waiting',
      offerId: null
    } as WaitlistRequest,
    // Add dummy waitlists to reach 7 active waitlist requests
  ],
  offers: [] as Offer[],
  events: [] as Event[],
  notes: {} as Record<string, string>,
};

// Fill up to 17 active bookings (BK-01 to BK-17 skipping BK-12 and BK-14)
for (let i = 1; i <= 17; i++) {
  if (i === 12 || i === 14) continue;
  INITIAL_FIXTURE.bookings.push({
    id: `BK-${i.toString().padStart(2, '0')}`,
    serviceId: 'SVC-INTRO',
    participantToken: `PT-DUMMY-${i}`,
    benchId: 'BENCH-A',
    serviceStartMinute: 0,
    serviceEndMinute: 30,
    setupMinutes: 0,
    cleanupMinutes: 0,
    facilitatorClaims: [],
    toolClaims: [],
    locked: true,
    flexStartMin: 0,
    flexStartMax: 0,
    status: 'active',
    sourceRequestId: null,
    revision: i
  } as Booking);
}

// Fill up to 7 waitlist requests
for (let i = 1; i <= 7; i++) {
  if (i === 7) continue;
  INITIAL_FIXTURE.waitlist.push({
    id: `WL-${i.toString().padStart(2, '0')}`,
    participantToken: `PT-DUMMY-WL-${i}`,
    serviceId: 'SVC-INTRO',
    durationMinutes: 30,
    setupMinutes: 0,
    cleanupMinutes: 0,
    windowStartMinute: 0,
    windowEndMinute: 480,
    acceptableBenchIds: ['BENCH-A'],
    requiredFacilitator: 'FAC-MIA',
    requiredTool: 'ROLLER-01',
    priority: 1,
    joinedLogicalMinute: i,
    status: 'waiting',
    offerId: null
  } as WaitlistRequest);
}
