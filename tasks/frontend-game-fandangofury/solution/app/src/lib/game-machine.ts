import { createMachine } from 'xstate';

export type GameScreen =
  | 'MAP'
  | 'COMBAT'
  | 'BOSS'
  | 'SHOP'
  | 'MASKS'
  | 'VICTORY'
  | 'DEFEAT'
  | 'RESET_CONFIRM'
  | 'HISTORY' | 'PAUSE' | 'EXPORT' | 'IMPORT' | 'SETTINGS';

export const gameMachine = createMachine({
  id: 'fandangoFury',
  initial: 'MAP',
  states: {
    MAP: {
      on: {
        START_STAGE: 'COMBAT',
        OPEN_SHOP: 'SHOP',
        OPEN_MASKS: 'MASKS',
        OPEN_HISTORY: 'HISTORY',
        OPEN_RESET: 'RESET_CONFIRM',
        OPEN_EXPORT: 'EXPORT',
        OPEN_IMPORT: 'IMPORT',
        OPEN_SETTINGS: 'SETTINGS',
      },
    },
    COMBAT: {
      on: {
        WAVE_COMPLETE: 'COMBAT',
        BOSS_START: 'BOSS',
        PLAYER_DEFEATED: 'DEFEAT',
        OPEN_SHOP: 'SHOP',
        OPEN_MASKS: 'MASKS',
        PAUSE: 'PAUSE',
        OPEN_HISTORY: 'HISTORY',
      },
    },
    BOSS: {
      on: {
        BOSS_DEFEATED: 'VICTORY',
        PLAYER_DEFEATED: 'DEFEAT',
        OPEN_HISTORY: 'HISTORY',
        PAUSE: 'PAUSE',
      },
    },
    SHOP: {
      on: {
        CLOSE_SHOP: 'MAP',
        SHOP_TO_COMBAT: 'COMBAT',
        OPEN_HISTORY: 'HISTORY',
      },
    },
    MASKS: {
      on: {
        CLOSE_MASKS: 'MAP',
        OPEN_HISTORY: 'HISTORY',
      },
    },
    VICTORY: {
      on: {
        CONTINUE: 'MAP',
        OPEN_HISTORY: 'HISTORY',
      },
    },
    DEFEAT: {
      on: {
        TRY_AGAIN: 'COMBAT',
        TO_MAP: 'MAP',
        OPEN_HISTORY: 'HISTORY',
      },
    },
    RESET_CONFIRM: {
      on: {
        CONFIRM_RESET: 'MAP',
        CANCEL_RESET: 'MAP',
      },
    },
    PAUSE: {
      on: {
        RESUME: 'COMBAT',
        RESUME_BOSS: 'BOSS',
        ABANDON: 'MAP',
        SAVE_CHECKPOINT: 'MAP',
      },
    },
    EXPORT: {
      on: { CLOSE_EXPORT: 'MAP' },
    },
    IMPORT: {
      on: { CLOSE_IMPORT: 'MAP' },
    },
    SETTINGS: {
      on: { CLOSE_SETTINGS: 'MAP' },
    },
    HISTORY: {
      on: {
        CLOSE_HISTORY: { target: 'MAP' },
        RESTORE_STATE: { target: 'MAP' },
      },
    },
  },
});
