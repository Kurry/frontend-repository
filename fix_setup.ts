import * as fs from 'fs';
let content = fs.readFileSync('tasks/frontend-game-dare-night/solution/app/src/components/SetupScreen.svelte', 'utf-8');

const newProps = `
    onShowDeleteConfirm: (id: string | null) => void;
    onExportJSON: () => void;
    onImportJSON: (data: any) => void;
    onResumeSession: () => void;
    hasSavedSession: boolean;
`;
content = content.replace("    onShowDeleteConfirm: (id: string | null) => void;", newProps);

const destructuredProps = `
    onShowDeleteConfirm,
    onExportJSON,
    onImportJSON,
    onResumeSession,
    hasSavedSession,
`;
content = content.replace("    onShowDeleteConfirm,", destructuredProps);

const uiControls = `
    <!-- Session Controls -->
    <div class="bg-white rounded-xl p-6 mb-6 shadow-lg">
      <div class="flex flex-wrap gap-3 items-center justify-center">
        {#if hasSavedSession}
          <button
            class="px-4 py-2 rounded-full bg-white text-sm font-medium border-2 border-black hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            onclick={onResumeSession}
          >
            Resume Saved Session
          </button>
        {/if}
        <button
          class="px-4 py-2 rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-md"
          style="background-color: #222; color: white;"
          onclick={onExportJSON}
        >
          Export Session
        </button>

        <label class="px-4 py-2 rounded-full bg-white text-sm font-medium border-2 border-black hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 cursor-pointer inline-flex items-center">
          Import Session
          <input
            type="file"
            accept=".json,application/json"
            class="hidden"
            onchange={(e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (re) => {
                  try {
                    const data = JSON.parse(re.target?.result as string);
                    onImportJSON(data);
                  } catch(err) {
                    onImportJSON(null);
                  }
                  // Reset input so the same file can be selected again
                  (e.target as HTMLInputElement).value = '';
                };
                reader.readAsText(file);
              }
            }}
          />
        </label>
      </div>
    </div>
`;
content = content.replace("<!-- Player Setup -->", uiControls + "\n    <!-- Player Setup -->");

// win-target readout
content = content.replace(
  '<p class="inline-block rounded-full px-3 py-1 text-sm"',
  '<p class="inline-block rounded-full px-3 py-1 text-sm font-bold mb-2">First to 10</p>\n      <br/>\n      <p class="inline-block rounded-full px-3 py-1 text-sm"'
);

// accessibility aria-pressed
content = content.replace(
  'aria-pressed={isCatSelected(cat)}',
  'aria-pressed={isCatSelected(cat)}\n            aria-label={cat}'
);
content = content.replace(
  'aria-pressed={selectedIntensity === intensity}',
  'aria-pressed={selectedIntensity === intensity}\n            aria-label={intensity}'
);
// focus indicator (add focus-visible to relevant classes)
content = content.replace(/focus:ring-black/g, "focus-visible:ring-black focus:outline-none");
content = content.replace(/focus:border-black/g, "focus-visible:border-black focus:outline-none");
content = content.replace(/focus:ring-gray-300/g, "focus-visible:ring-gray-300 focus:outline-none");
content = content.replace(/focus:ring-gray-400/g, "focus-visible:ring-gray-400 focus:outline-none");
content = content.replace(/focus:ring-offset-2/g, "focus-visible:ring-offset-2 focus:outline-none");
// Live region for errors
content = content.replace(
  'role="alert">{playerError}</p>',
  'role="alert" aria-live="assertive">{playerError}</p>'
);
content = content.replace(
  'role="alert">{categoryError}</p>',
  'role="alert" aria-live="assertive">{categoryError}</p>'
);


fs.writeFileSync('tasks/frontend-game-dare-night/solution/app/src/components/SetupScreen.svelte', content);
