export const INITIAL_FIXTURE = {
  schema: "fictional-offline-capsule-manifest/1.0",
  fixtureId: "fictional-shelf-1",
  timezone: "America/Detroit",
  logicalDate: "2026-10-05",
  readingRateWpm: 240,
  articles: [
    {
      articleId: "ART-01",
      title: "Morning Transit",
      authorToken: "auth-1",
      url: "https://fictional.com/morning-transit",
      tags: ["TAG-1", "TAG-2"],
      status: "available",
      hash: "hash-01",
      sections: [
        { sectionId: "SEC-01-01", heading: "Departure", order: 1, wordCount: 300, utf8Bytes: 1500, sha256: "sha-01-01" },
        { sectionId: "SEC-01-02", heading: "Platform", order: 2, wordCount: 400, utf8Bytes: 2000, sha256: "sha-01-02" }
      ]
    },
    {
      articleId: "ART-02",
      title: "Urban Ecology",
      authorToken: "auth-2",
      url: "https://fictional.com/urban-ecology",
      tags: ["TAG-3"],
      status: "available",
      hash: "hash-02",
      sections: [
        { sectionId: "SEC-02-01", heading: "Green Roofs", order: 1, wordCount: 500, utf8Bytes: 2500, sha256: "sha-02-01" },
        { sectionId: "SEC-02-02", heading: "Waterways", order: 2, wordCount: 600, utf8Bytes: 3000, sha256: "sha-02-02" }
      ]
    },
    {
      articleId: "ART-03",
      title: "Design Systems",
      authorToken: "auth-3",
      url: "https://fictional.com/design-systems",
      tags: ["TAG-2"],
      status: "available",
      hash: "hash-03",
      sections: [
        { sectionId: "SEC-03-01", heading: "Tokens", order: 1, wordCount: 400, utf8Bytes: 2000, sha256: "sha-03-01" },
        { sectionId: "SEC-03-02", heading: "Components", order: 2, wordCount: 440, utf8Bytes: 2200, sha256: "sha-03-02" }
      ]
    },
    {
      articleId: "ART-04",
      title: "Pocket Weather",
      authorToken: "auth-4",
      url: "https://fictional.com/pocket-weather",
      tags: ["TAG-4"],
      status: "available",
      hash: "hash-04",
      sections: [
        { sectionId: "SEC-04-01", heading: "Introduction", order: 1, wordCount: 200, utf8Bytes: 1000, sha256: "sha-04-01" },
        { sectionId: "SEC-04-02", heading: "Measurements", order: 2, wordCount: 300, utf8Bytes: 1500, sha256: "sha-04-02" },
        { sectionId: "SEC-04-03", heading: "Glass Lines", order: 3, wordCount: 520, utf8Bytes: 2200, sha256: "sha-04-03" },
        { sectionId: "SEC-04-04", heading: "Quiet Gauge", order: 4, wordCount: 610, utf8Bytes: 2700, sha256: "sha-04-04" },
        { sectionId: "SEC-04-05", heading: "Return Light", order: 5, wordCount: 430, utf8Bytes: 2300, sha256: "sha-04-05" },
        { sectionId: "SEC-04-06", heading: "After Rain", order: 6, wordCount: 1440, utf8Bytes: 4200, sha256: "sha-04-06" }
      ]
    },
    {
      articleId: "ART-05",
      title: "Local Coffee",
      authorToken: "auth-5",
      url: "https://fictional.com/local-coffee",
      tags: ["TAG-1"],
      status: "available",
      hash: "hash-05",
      sections: [
        { sectionId: "SEC-05-01", heading: "Roasts", order: 1, wordCount: 400, utf8Bytes: 2000, sha256: "sha-05-01" }
      ]
    },
    {
      articleId: "ART-06",
      title: "Architecture Walk",
      authorToken: "auth-1",
      url: "https://fictional.com/architecture-walk",
      tags: ["TAG-3"],
      status: "available",
      hash: "hash-06",
      sections: [
        { sectionId: "SEC-06-01", heading: "Historic", order: 1, wordCount: 600, utf8Bytes: 3000, sha256: "sha-06-01" }
      ]
    },
    {
      articleId: "ART-07",
      title: "Train Map",
      authorToken: "auth-2",
      url: "https://fictional.com/train-map",
      tags: ["TAG-2"],
      status: "available",
      hash: "hash-07",
      sections: [
        { sectionId: "SEC-07-01", heading: "Lines", order: 1, wordCount: 300, utf8Bytes: 1500, sha256: "sha-07-01" }
      ]
    },
    {
      articleId: "ART-08",
      title: "Sunset Views",
      authorToken: "auth-3",
      url: "https://fictional.com/sunset-views",
      tags: ["TAG-4"],
      status: "available",
      hash: "hash-08",
      sections: [
        { sectionId: "SEC-08-01", heading: "East Side", order: 1, wordCount: 500, utf8Bytes: 2500, sha256: "sha-08-01" }
      ]
    }
  ],
  branches: [
    { branchId: "BR-DRAFT", name: "Draft", baseBranchId: null as string | null },
    { branchId: "BR-COMMUTE", name: "Commute", baseBranchId: "BR-DRAFT" },
    { branchId: "BR-LONG", name: "Long Ride", baseBranchId: "BR-DRAFT" }
  ],
  capsules: [
    {
      capsuleId: "CAP-FICTIONAL-1",
      branchId: "BR-DRAFT",
      title: "Fictional Line",
      byteBudget: 24000,
      minuteBudget: 24,
      isApproved: false,
      entries: [
        {
          entryId: "ENTRY-01",
          capsuleId: "CAP-FICTIONAL-1",
          articleId: "ART-01",
          firstSectionId: "SEC-01-01",
          lastSectionId: "SEC-01-02",
          sectionIds: ["SEC-01-01", "SEC-01-02"],
          order: 1,
          wordCount: 700,
          utf8Bytes: 3500,
          estimatedMinutes: 3,
          fallbackStatus: "verified"
        },
        {
          entryId: "ENTRY-02",
          capsuleId: "CAP-FICTIONAL-1",
          articleId: "ART-02",
          firstSectionId: "SEC-02-01",
          lastSectionId: "SEC-02-02",
          sectionIds: ["SEC-02-01", "SEC-02-02"],
          order: 2,
          wordCount: 1100,
          utf8Bytes: 5500,
          estimatedMinutes: 5,
          fallbackStatus: "verified"
        },
        {
          entryId: "ENTRY-03",
          capsuleId: "CAP-FICTIONAL-1",
          articleId: "ART-03",
          firstSectionId: "SEC-03-01",
          lastSectionId: "SEC-03-02",
          sectionIds: ["SEC-03-01", "SEC-03-02"],
          order: 3,
          wordCount: 840,
          utf8Bytes: 4200,
          estimatedMinutes: 4,
          fallbackStatus: "verified"
        }
      ]
    }
  ],
  events: [
     {
        eventId: "EV-01",
        actorId: "Mira",
        branchId: "BR-DRAFT",
        type: "capsule.created",
        capsuleId: "CAP-FICTIONAL-1",
        logicalAt: "2026-10-05T08:00:00Z",
        details: {} as Record<string, any>
     }
  ],
  notes: [] as { noteId: string, entryId: string, content: string, actorId: string }[],
  actors: [
    { actorId: "Mira", name: "Mira" },
    { actorId: "Sol", name: "Sol" }
  ]
};
