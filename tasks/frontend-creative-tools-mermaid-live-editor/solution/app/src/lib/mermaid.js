import mermaid from 'mermaid';
import { store } from './state.svelte.js';

// Sample diagrams shown in the "Sample Diagrams" picker. The keys are the
// visible button labels; ids are the stable browse destinations and match the
// closed diagramType enum of the MermaidSession contract. Each source is real
// Mermaid syntax and renders as a distinct diagram type.
export const SAMPLE_DIAGRAMS = [
  {
    id: 'flowchart',
    label: 'Flowchart',
    diagramType: 'flowchart',
    code: `flowchart TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[Car]`
  },
  {
    id: 'class',
    label: 'Class',
    diagramType: 'class',
    code: `classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    class Duck{
      +String beakColor
      +swim()
      +quack()
    }
    class Fish{
      -int sizeInFeet
      -canEat()
    }
    class Zebra{
      +bool is_wild
      +run()
    }`
  },
  {
    id: 'sequence',
    label: 'Sequence',
    diagramType: 'sequence',
    code: `sequenceDiagram
    Alice->>John: Hello John, how are you?
    John-->>Alice: Great!
    Alice-)John: See you later!`
  },
  {
    id: 'entity-relationship',
    label: 'Entity Relationship',
    diagramType: 'entity-relationship',
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`
  },
  {
    id: 'state',
    label: 'State',
    diagramType: 'state',
    code: `stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`
  },
  {
    id: 'mindmap',
    label: 'Mindmap',
    diagramType: 'mindmap',
    code: `mindmap
  root((mindmap))
    Origins
      Long history
      Popularisation
    Research
      On effectiveness
      On features
    Tools
      Mermaid
      Live editor`
  },
  {
    id: 'pie',
    label: 'Pie',
    diagramType: 'pie',
    code: `pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15`
  },
  {
    id: 'gantt',
    label: 'Gantt',
    diagramType: 'gantt',
    code: `gantt
    title A Gantt Diagram
    dateFormat YYYY-MM-DD
    section Section
    A task :a1, 2014-01-01, 30d
    Another task :after a1, 20d`
  }
];

export const DIAGRAM_TYPE_LABELS = Object.fromEntries(
  SAMPLE_DIAGRAMS.map((s) => [s.id, s.label])
);

export const DEFAULT_CODE = SAMPLE_DIAGRAMS[0].code;
export const DEFAULT_CONFIG = JSON.stringify({ theme: 'default' }, null, 2);

// Map mermaid's internal parse type names onto the closed diagramType enum.
const PARSED_TYPE_MAP = {
  flowchart: 'flowchart',
  'flowchart-v2': 'flowchart',
  'flowchart-elk': 'flowchart',
  flow: 'flowchart',
  class: 'class',
  classDiagram: 'class',
  sequence: 'sequence',
  er: 'entity-relationship',
  state: 'state',
  stateDiagram: 'state',
  'stateDiagram-v2': 'state',
  mindmap: 'mindmap',
  pie: 'pie',
  gantt: 'gantt'
};

// Detect the diagram type from the source's first line. Deterministic, and
// always returns a value from the closed diagramType enum (or undefined).
export const detectDiagramType = (code) => {
  const firstLine = (String(code).trim().split(/\r?\n/, 1)[0] || '').trim();
  if (/^(flowchart|graph)\b/.test(firstLine)) return 'flowchart';
  if (/^classDiagram\b/.test(firstLine)) return 'class';
  if (/^sequenceDiagram\b/.test(firstLine)) return 'sequence';
  if (/^erDiagram\b/.test(firstLine)) return 'entity-relationship';
  if (/^stateDiagram\b/.test(firstLine)) return 'state';
  if (/^mindmap\b/.test(firstLine)) return 'mindmap';
  if (/^pie\b/.test(firstLine)) return 'pie';
  if (/^gantt\b/.test(firstLine)) return 'gantt';
  return undefined;
};

let initialized = false;

// The rendered diagram's palette comes from the last VALID Mermaid Config
// document (theme key included) — nothing overrides it, so a config theme
// edit is always visible in the render. The header theme toggle keeps the
// config document in sync through applyMermaidTheme().
const ensureInit = () => {
  let configObj = { theme: 'default' };
  try {
    if (store && store.lastValidMermaid) {
      configObj = JSON.parse(store.lastValidMermaid);
    }
  } catch {
    configObj = { theme: 'default' };
  }
  mermaid.initialize({
    ...configObj,
    // The app's safety/logging invariants always win: the Config document is
    // passthrough-validated (it models the full Mermaid initialize payload),
    // so a logLevel/securityLevel/startOnLoad key inside it must not defeat
    // them and let parse-error flows emit console noise. Theme and every
    // render-affecting key in the config still apply via the spread above.
    startOnLoad: false,
    securityLevel: 'loose',
    logLevel: 'fatal'
  });
  initialized = true;
};

let renderSeq = 0;

// Parse the source to detect syntax errors without touching the DOM.
// Throws on invalid syntax. On success, diagramType is mermaid's parsed
// type mapped onto the closed diagramType enum — mermaid's own detection
// ignores leading %% comment lines, so it stays correct even when the
// first source line is a comment (undefined when mermaid reports a type
// the closed enum does not cover).
export const parse = async (code) => {
  if (!initialized) ensureInit();
  const result = await mermaid.parse(code, { suppressErrors: false });
  const raw = result ? result.diagramType : undefined;
  return { diagramType: raw ? PARSED_TYPE_MAP[raw] : undefined };
};

// Render the diagram source into an <svg>. Returns the svg markup string.
export const render = async (code) => {
  ensureInit();
  const id = `graph-${++renderSeq}`;
  const { svg } = await mermaid.render(id, code);
  return svg;
};
