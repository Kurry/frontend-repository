import { create } from 'zustand';
import { AppState, Message, Report, DuplicateCandidate, Note, QueuePacket, TokenBucket, RoleEvidence } from './types';
import { generateSeedMessages, seedReports, seedDuplicateCandidates, initialTokenBucket } from './fixture';

export const useAppStore = create<AppState>((set, get) => ({
  workspaces: ['WS-01', 'WS-02', 'WS-03', 'WS-04'],
  activeWorkspaceId: 'WS-01',
  threads: generateSeedMessages(),
  reports: seedReports,
  notes: [],
  duplicateCandidates: seedDuplicateCandidates,
  queue: [],
  tokenBucket: initialTokenBucket,
  logicalTime: 0,

  updateContextWindow: (reportId: string, startSeq: number, endSeq: number, promotedRequiredIds: string[]) => {
    set((state) => {
      const reportIndex = state.reports.findIndex(r => r.id === reportId);
      if (reportIndex === -1) return state;

      const report = state.reports[reportIndex];
      const thread = state.threads.filter(m => m.threadId === report.threadId);

      const intervalMessages = thread.filter(m => m.sequence >= startSeq && m.sequence <= endSeq);
      const includedMessageIds = intervalMessages.map(m => m.id);

      for (const id of promotedRequiredIds) {
        if (!includedMessageIds.includes(id)) {
          includedMessageIds.push(id);
        }
      }

      const requiredRolesList: { role: RoleEvidence['role']; expectedId: string }[] = [
        { role: 'target', expectedId: 'MSG-17' },
        { role: 'root', expectedId: 'MSG-01' },
        { role: 'parent', expectedId: 'MSG-13' },
        { role: 'preceding-sibling', expectedId: 'MSG-15' },
        { role: 'following-sibling', expectedId: 'MSG-18' },
        { role: 'referenced', expectedId: 'MSG-10' },
      ];

      const newRequiredRoles: RoleEvidence[] = requiredRolesList.map(req => {
        const satisfied = includedMessageIds.includes(req.expectedId);
        let source: RoleEvidence['source'] = 'pinned';
        if (intervalMessages.some(m => m.id === req.expectedId)) {
          source = 'interval';
        } else if (promotedRequiredIds.includes(req.expectedId)) {
          source = 'promoted';
        }
        return {
          role: req.role,
          messageId: req.expectedId,
          satisfied,
          source
        };
      });

      const satisfiedCount = newRequiredRoles.filter(r => r.satisfied).length;

      const newReport = {
        ...report,
        contextWindow: {
          ...report.contextWindow!,
          startSequence: startSeq,
          endSequence: endSeq,
          includedMessageIds,
          promotedRequiredIds,
          requiredRoles: newRequiredRoles,
          completenessNumerator: satisfiedCount,
          completenessDenominator: 6,
          revision: report.contextWindow!.revision + 1
        },
        revision: report.revision + 1
      };

      const newReports = [...state.reports];
      newReports[reportIndex] = newReport;

      const newDuplicateCandidates = state.duplicateCandidates.map(dc => {
        if (dc.aReportId === 'RP-03' && dc.bReportId === 'RP-07') {
          const rp03 = state.reports.find(r => r.id === 'RP-03')!;
          const rp03Ids = new Set(rp03.contextWindow?.includedMessageIds || []);
          const rp07Ids = new Set(includedMessageIds);

          const intersection = Array.from(rp03Ids).filter(x => rp07Ids.has(x));
          const union = Array.from(new Set([...Array.from(rp03Ids), ...Array.from(rp07Ids)]));

          const jNum = intersection.length;
          const jDen = union.length;
          const jPct = (jNum / jDen) * 100;

          return {
            ...dc,
            intersectionIds: intersection,
            unionIds: union,
            jaccardNumerator: jNum,
            jaccardDenominator: jDen,
            jaccardPercent: Number(jPct.toFixed(2)),
            eligibility: jPct >= dc.thresholdPercent ? 'eligible' : 'below',
            revision: dc.revision + 1
          };
        }
        return dc;
      });

      return {
        ...state,
        reports: newReports,
        duplicateCandidates: newDuplicateCandidates,
      };
    });
  },

  advanceLogicalTime: (amount: number) => {
    set((state) => {
      const newTime = state.logicalTime + amount;
      let newThreads = state.threads;

      // Tombstone trigger
      if (newTime >= 50 && state.logicalTime < 50) {
        newThreads = state.threads.map(m => {
          if (m.id === 'MSG-14') {
            return {
              ...m,
              status: 'tombstone',
              text: null,
              deletion: { eventId: 'evt-tombstone', reason: 'author-removed', logicalTime: newTime }
            };
          }
          return m;
        });
      }

      // Queue refill trigger
      let newTokenBucket = { ...state.tokenBucket };
      if (newTime - newTokenBucket.lastRefillLogicalTime >= newTokenBucket.refillEverySeconds) {
        newTokenBucket = {
          ...newTokenBucket,
          tokens: newTokenBucket.capacity,
          lastRefillLogicalTime: newTime
        };
      }

      return {
        ...state,
        logicalTime: newTime,
        threads: newThreads,
        tokenBucket: newTokenBucket
      };
    });
  }
}));
