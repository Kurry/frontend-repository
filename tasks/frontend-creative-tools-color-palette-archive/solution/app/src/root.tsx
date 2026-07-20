import { component$, useContextProvider, useStore, useStyles$ } from '@builder.io/qwik';
import { QwikCityProvider, RouterOutlet } from '@builder.io/qwik-city';
import { GlobalStoreContext } from './store';
import type { AppState } from './store/types';
import { seedPalettes } from './utils/seed';
import globalStyles from './global.css?inline';
import '@fontsource/abril-fatface';
import '@fontsource/ibm-plex-mono/300.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/400-italic.css';
import '@fontsource/libre-baskerville/400.css';
import '@fontsource/libre-baskerville/700.css';
import '@fontsource/libre-baskerville/400-italic.css';
import '@fontsource/pinyon-script';

export default component$(() => {
  useStyles$(globalStyles);

  const state = useStore<AppState>({
    palettes: [...seedPalettes],
    activeView: 'nomenclature',
    periodFilter: '',
    nameSort: 'name-asc',
    selectionId: null,
    multiSelect: [],
    undoStack: [],
    redoStack: [],
    visionSimulation: 'none',
    copyFeedback: null,
    exportPreviewText: '',
    exportDrawerOpen: false,
    exportFormat: 'json',
    importFeedback: null,
    searchText: '',
    tagFacet: null,
    archivedFacet: false,
    comparisonSelection: [],
    catalogSheetContent: null,
    popupDismissed: false,
  }, { deep: true });

  useContextProvider(GlobalStoreContext, state);

  return (
    <QwikCityProvider>
      <head>
        <meta charset="utf-8" />
        <title>Palette Library</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body lang="en" data-vision={state.visionSimulation}>
        <svg aria-hidden="true" style="position: absolute; width: 0; height: 0;">
          <defs>
            <filter id="protanopia-filter">
              <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0  0.558, 0.442, 0, 0, 0  0, 0.242, 0.758, 0, 0  0, 0, 0, 1, 0" />
            </filter>
            <filter id="deuteranopia-filter">
              <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0  0.7, 0.3, 0, 0, 0  0, 0.3, 0.7, 0, 0  0, 0, 0, 1, 0" />
            </filter>
            <filter id="tritanopia-filter">
              <feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0  0, 0.433, 0.567, 0, 0  0, 0.475, 0.525, 0, 0  0, 0, 0, 1, 0" />
            </filter>
          </defs>
        </svg>
        <RouterOutlet />
      </body>
    </QwikCityProvider>
  );
});
