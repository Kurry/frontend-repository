import mermaid from 'mermaid';
import { store } from './state.svelte.js';

// Sample diagrams shown in the "Sample Diagrams" picker. The keys are the
// visible button labels; ids are the stable browse destinations. Each source is
// real Mermaid syntax and renders as a distinct diagram type.
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
    diagramType: 'classDiagram',
    code: `classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    class Duck{
      +String beakColor
      +swim()
      +quack()
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
    diagramType: 'er',
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`
  },
  {
    id: 'state',
    label: 'State',
    diagramType: 'stateDiagram',
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
      On features`
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

export const DEFAULT_CODE = SAMPLE_DIAGRAMS[0].code;
export const DEFAULT_CONFIG = JSON.stringify({ theme: 'default' }, null, 2);

let initialized = false;
const ensureInit = (mermaidTheme) => {
  let configObj = { theme: mermaidTheme || 'default' };
  try {
    if (store && store.lastValidMermaid) {
      configObj = JSON.parse(store.lastValidMermaid);
      if (mermaidTheme) {
        configObj.theme = mermaidTheme;
      }
    }
  } catch (e) {
    // fallback
  }

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    ...configObj
  });
  initialized = true;
};

let renderSeq = 0;

// Parse the source to detect syntax errors and the diagram type without
// touching the DOM. Throws on invalid syntax.
export const parse = async (code) => {
  if (!initialized) ensureInit();
  const result = await mermaid.parse(code, { suppressErrors: false });
  return { diagramType: result ? result.diagramType : undefined };
};

// Render the diagram source into an <svg>. Returns the svg markup string.
export const render = async (code, mermaidTheme) => {
  ensureInit(mermaidTheme);
  const id = `graph-${++renderSeq}`;
  const { svg } = await mermaid.render(id, code);
  return svg;
};
