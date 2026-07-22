import { create } from 'zustand';
import type { AppState } from './types';
import { getInitialPlan } from './fixture';

export const useStore = create<AppState>((set, get) => ({
  ...getInitialPlan(),
  init: () => set({}),

  dragPreview: null,

  moveBadge: (badgeId, hookId, slotNumber) => {
    set((state) => {
      const bIdx = state.badges.findIndex(b => b.id === badgeId);
      if (bIdx === -1) return state;

      const newBadges = [...state.badges];
      const oldBadge = newBadges[bIdx];
      const isMero = badgeId === 'BADGE-27';

      if (hookId === 'HOOK-MR' && slotNumber === 7 && isMero) {
         for (let i=0; i<newBadges.length; i++) {
             if (newBadges[i].hookId === 'HOOK-MR' && newBadges[i].slotNumber !== null && newBadges[i].slotNumber! >= 7) {
                 newBadges[i].slotNumber! += 1;
                 newBadges[i].backMark = `M–R/${String(newBadges[i].slotNumber).padStart(2, '0')}`;
             }
         }
      }

      newBadges[bIdx] = {
          ...oldBadge,
          status: 'filed',
          hookId,
          slotNumber,
          overflowOrdinal: null,
          backMark: `${hookId.replace('HOOK-', '').replace('GL', 'G–L').replace('MR', 'M–R')}/${String(slotNumber).padStart(2, '0')}`
      };

      const newIssues = state.issues.map(iss =>
          iss.id === 'ISSUE-05' && isMero ? { ...iss, status: 'resolved' as const } : iss
      );

      let newRedirects = state.profile.redirects;
      let newSteps = state.profile.routeSteps;
      let newComp = state.profile.predictedCompletion;
      if (isMero && hookId === 'HOOK-MR') {
          newRedirects = 0;
          newSteps = 48;
          newComp = "2035-05-17T09:23:50.000Z";
      }

      return {
          badges: newBadges,
          issues: newIssues,
          profile: {
              ...state.profile,
              redirects: newRedirects,
              routeSteps: newSteps,
              predictedCompletion: newComp
          },
          dragPreview: null
      };
    });
  },

  previewBadgeMove: (badgeId, hookId, slotNumber) => {
      set({ dragPreview: { badgeId, hookId, slotNumber } });
  },

  cancelPreview: () => set({ dragPreview: null }),

  confirmPreview: () => {
      const { dragPreview, moveBadge } = get();
      if (dragPreview) {
          moveBadge(dragPreview.badgeId, dragPreview.hookId, dragPreview.slotNumber);
      }
  },

  setSelection: (sel) => set({ selection: sel }),

  setBrush: (brush) => set({ arrivalBrush: brush }),

  stepRehearsal: () => {
      set(state => {
         return {
             rehearsal: { ...state.rehearsal, status: 'running' }
         };
      });
  },

  resetRehearsal: () => {
      set(state => ({ rehearsal: { ...state.rehearsal, status: 'ready', cursor: 0, mark: null } }));
  },

  undoEvent: () => {},
  redoEvent: () => {},

  addComment: (text, anchors) => {
      set(state => ({
          comments: [...state.comments, {
              id: `COMMENT-${String(state.comments.length + 1).padStart(2, '0')}`,
              text,
              actorId: 'Sol',
              logicalTime: new Date().toISOString(),
              anchors
          }]
      }));
  },

  loadPlan: (plan) => set({ ...plan }),
  approvePlan: (status, note) => {
      set({ approval: { status, note } });
  }
}));
