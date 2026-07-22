import { createStore, produce } from "solid-js/store";

// Mock data generators for 80 source units
const generateSourceUnits = () => {
  return Array.from({ length: 80 }).map((_, i) => ({
    id: `unit_${i + 1}`,
    sourceText: i % 5 === 0 ? `Welcome, {name}! You have {count, plural, one {# message} other {# messages}}` : `This is a sample string ${i + 1} with a {placeholder}.`,
    ast: [
      { type: "text", value: i % 5 === 0 ? "Welcome, " : `This is a sample string ${i + 1} with a ` },
      ...(i % 5 === 0
        ? [
            { type: "placeholder", name: "name", varType: "string" },
            { type: "text", value: "! You have " },
            {
              type: "plural",
              name: "count",
              categories: {
                one: [{ type: "text", value: "1 message" }],
                other: [{ type: "placeholder", name: "count", varType: "number" }, { type: "text", value: " messages" }]
              }
            }
          ]
        : [{ type: "placeholder", name: "placeholder", varType: "string" }, { type: "text", value: "." }]
      )
    ],
    meaning: `Meaning of unit ${i + 1}`,
    description: `Description of unit ${i + 1}`,
    screen: `screen_${(i % 12) + 1}`,
    sourceRevision: 1
  }));
};

const initialLocales = ["fr-FR", "de-DE", "ja-JP"];

const initialTerminology = [
  { id: "term_1", allowed: ["Fixture Notes", "Fixture"], forbidden: ["HN"], pos: "noun" }
];

const generateTargetRevisions = (units) => {
  const targets = {};
  units.forEach(unit => {
    targets[unit.id] = {};
    initialLocales.forEach(locale => {
      targets[unit.id][locale] = {
        draft: null,
        reviewed: null, // latest reviewed
        approved: null, // latest approved
        history: [], // lineage
        fallbackStatus: "source", // "source", "fixture", "missing", "draft", "in-review", "approved", "invalid"
        termBindings: []
      };

      // Seed some random initial states
      if (Math.random() > 0.5) {
        targets[unit.id][locale].draft = {
          ast: [...unit.ast],
          text: unit.sourceText + ` (${locale})`,
          isInvalid: false
        };
        targets[unit.id][locale].fallbackStatus = "draft";
      }
    });
  });
  return targets;
};

const units = generateSourceUnits();
const targetRevisions = generateTargetRevisions(units);

export const [store, setStore] = createStore({
  sourceUnits: units,
  targetRevisions,
  terminology: initialTerminology,
  packageStatus: {
    "fr-FR": "idle",
    "de-DE": "idle",
    "ja-JP": "idle"
  },
  activeUnitId: units[0].id,
  activeLocale: "fr-FR",
  historyEvents: [],
});

export const updateDraftAst = (unitId, locale, newAst) => {
  setStore(produce(state => {
    const target = state.targetRevisions[unitId][locale];
    if (!target.draft) {
      target.draft = { text: "", isInvalid: false };
    }
    target.draft.ast = newAst;
    // VERY simplistic stringify
    target.draft.text = JSON.stringify(newAst);
    target.draft.isInvalid = false; // Add real validation later
    target.fallbackStatus = "draft";
  }));
};

export const markInvalid = (unitId, locale, error) => {
  setStore(produce(state => {
    const target = state.targetRevisions[unitId][locale];
    if (target.draft) {
      target.draft.isInvalid = true;
      target.draft.error = error;
      target.fallbackStatus = "parser-invalid";
    }
  }));
};

export const submitReview = (unitId, locale) => {
  setStore(produce(state => {
    const target = state.targetRevisions[unitId][locale];
    if (target.draft && !target.draft.isInvalid) {
      target.reviewed = { ...target.draft, timestamp: Date.now() };
      target.history.push({ type: "review", data: target.reviewed });
      target.fallbackStatus = "in-review";
    }
  }));
};

export const approve = (unitId, locale) => {
  setStore(produce(state => {
    const target = state.targetRevisions[unitId][locale];
    if (target.reviewed) {
      target.approved = { ...target.reviewed, timestamp: Date.now() };
      target.history.push({ type: "approve", data: target.approved });
      target.fallbackStatus = "approved";
    }
  }));
};

export const packageLocale = (locale) => {
  setStore(produce(state => {
    if (state.packageStatus[locale] === "idle") {
       state.packageStatus[locale] = "failed"; // First run deterministically fails
       state.historyEvents.push(`Packaging failed for ${locale}`);
    } else if (state.packageStatus[locale] === "failed") {
       state.packageStatus[locale] = "success";
       state.historyEvents.push(`Packaging success for ${locale}`);
    }
  }));
};

export const bindTerm = (unitId, locale, termId, spanStart, spanEnd) => {
  setStore(produce(state => {
     state.targetRevisions[unitId][locale].termBindings.push({ termId, spanStart, spanEnd });
  }));
};

export const exportRelease = () => {
   // Canonical JSON generation mock
   const payload = {
     schemaVersion: "localization-release/v1",
     exportedAt: new Date().toISOString(),
     sourceUnits: store.sourceUnits,
     targetRevisions: store.targetRevisions,
     packageStatus: store.packageStatus
   };
   return JSON.stringify(payload);
};
