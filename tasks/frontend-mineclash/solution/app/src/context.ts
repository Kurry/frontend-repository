import { createContextId } from '@builder.io/qwik';
import type { AppStore } from './types';

export const AppCtx = createContextId<AppStore>('mine-clash');
