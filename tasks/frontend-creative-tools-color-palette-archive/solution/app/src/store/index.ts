import { createContextId } from '@builder.io/qwik';
import type { AppState } from './types';

export const GlobalStoreContext = createContextId<AppState>('global-store');
