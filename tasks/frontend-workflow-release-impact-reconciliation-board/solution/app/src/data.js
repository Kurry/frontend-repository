export const SEED_DATA = {
  releases: [
    { id: 'rel-1', name: 'Sprint 42', date: '2026-06-01T00:00:00Z' },
    { id: 'rel-2', name: 'Sprint 43', date: '2026-06-15T00:00:00Z' },
  ],
  entries: [
    { id: 'e-1', releaseId: 'rel-1', title: 'New onboarding flow', body: '', changeType: 'feature', sourceUrl: '', status: 'unreviewed', tags: [] },
    { id: 'e-2', releaseId: 'rel-1', title: 'Fix navigation bug', body: '', changeType: 'fix', sourceUrl: '', status: 'unreviewed', tags: [] },
    { id: 'e-3', releaseId: 'rel-1', title: 'Updated color palette', body: '', changeType: 'improvement', sourceUrl: '', status: 'unreviewed', tags: [] },
    { id: 'e-4', releaseId: 'rel-1', title: 'Remove legacy API', body: '', changeType: 'breaking', sourceUrl: '', status: 'unreviewed', tags: [] },
    { id: 'e-5', releaseId: 'rel-1', title: 'Security patch in auth', body: '', changeType: 'security', sourceUrl: '', status: 'unreviewed', tags: [] },
    { id: 'e-6', releaseId: 'rel-2', title: 'Duplicate onboarding entry', body: '', changeType: 'feature', sourceUrl: '', status: 'duplicate_candidate', tags: [] },
    { id: 'e-7', releaseId: 'rel-2', title: 'Dashboard redesign', body: '', changeType: 'feature', sourceUrl: '', status: 'unreviewed', tags: [] },
    { id: 'e-8', releaseId: 'rel-2', title: 'Faster data loading', body: '', changeType: 'improvement', sourceUrl: '', status: 'unreviewed', tags: [] },
    { id: 'e-9', releaseId: 'rel-2', title: 'Deprecate old widgets', body: '', changeType: 'deprecated', sourceUrl: '', status: 'unreviewed', tags: [] },
    { id: 'e-10', releaseId: 'rel-2', title: 'Fix typo in settings', body: '', changeType: 'fix', sourceUrl: '', status: 'unreviewed', tags: [] },
    { id: 'e-11', releaseId: 'rel-2', title: 'Add dark mode', body: '', changeType: 'feature', sourceUrl: '', status: 'unreviewed', tags: [] },
    { id: 'e-12', releaseId: 'rel-2', title: 'Minor UI tweaks', body: '', changeType: 'improvement', sourceUrl: '', status: 'unreviewed', tags: [] },
  ],
  surfaces: [
    { id: 's-1', name: 'Web App' },
    { id: 's-2', name: 'Mobile App' },
    { id: 's-3', name: 'Marketing Site' },
    { id: 's-4', name: 'API Docs' },
    { id: 's-5', name: 'Admin Dashboard' }
  ]
};
