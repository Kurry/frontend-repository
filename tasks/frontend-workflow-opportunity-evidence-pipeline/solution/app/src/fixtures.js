export const initialProfile = {
  facts: [
    { id: 'f1', type: 'experience', text: 'Led a team of 5 engineers to deliver a scalable microservices architecture', metric: 'Reduced latency by 40%', date: '2021-2023' },
    { id: 'f2', type: 'experience', text: 'Architected and deployed a multi-region React frontend using Vite and Tailwind', metric: 'Improved LCP by 2.1s', date: '2023-Present' },
    { id: 'f3', type: 'experience', text: 'Managed quarterly OKRs and conducted performance reviews for cross-functional teams', metric: '100% retention', date: '2021-2023' },
    { id: 'f11', type: 'experience', text: 'Developed accessibility (a11y) compliant component library', metric: 'WCAG 2.1 AA certified', date: '2023' },
    { id: 'f13', type: 'experience', text: 'Created data visualization dashboards using D3.js', metric: 'Used by 50+ executives', date: '2022' }
  ],
  artifacts: [
    { id: 'a1', type: 'artifact', text: 'Architecture Decision Record: Microservices Migration' }
  ],
  skills: [
    { id: 's1', type: 'skill', text: 'React / Next.js' }
  ]
};

export const initialOpportunities = [
  {
    id: 'opp1',
    name: 'Senior Frontend Engineer at TechCorp',
    stage: 'discovered',
    deadline: '2024-05-15',
    brief: "We are looking for a Senior Frontend Engineer to lead our React architecture rewrite. You must have deep experience with Vite, Tailwind, and managing state across complex UIs. Mentorship of junior devs is a preferred responsibility. Hybrid role in SF.",
    requirements: [
      { id: 'r1_1', text: 'Lead React architecture rewrite', class: 'must-have', priority: 'high' }
    ],
    bindings: [],
    variants: [
        { id: 'v1', name: 'Main Branch', blocks: [] }
    ],
    activeVariantId: 'v1',
    snapshots: [],
    tasks: [
        { id: 't1', type: 'prep', date: '2024-05-10', title: 'Prepare portfolio' }
    ]
  },
  {
    id: 'opp4',
    name: 'Frontend Architect at DesignCo',
    stage: 'ready',
    deadline: '2024-05-10',
    brief: "DesignCo is seeking a Frontend Architect to build our next-generation a11y-compliant component library. Must have strong D3.js data visualization skills and a track record of web performance optimization. Fully remote.",
    requirements: [
      { id: 'r4_1', text: 'Build next-generation a11y-compliant component library', class: 'must-have', priority: 'high' },
      { id: 'r4_2', text: 'Strong D3.js data visualization skills', class: 'must-have', priority: 'high' },
      { id: 'r4_3', text: 'Track record of web performance optimization', class: 'must-have', priority: 'medium' }
    ],
    bindings: [
        { reqId: 'r4_1', evidenceId: 'f11', type: 'direct' },
        { reqId: 'r4_2', evidenceId: 'f13', type: 'direct' },
        { reqId: 'r4_3', evidenceId: 'f2', type: 'transferable' }
    ],
    variants: [
        {
            id: 'v1',
            name: 'Main Branch',
            blocks: [
                { id: 'pb1', text: 'Developed accessibility (a11y) compliant component library (WCAG 2.1 AA certified).', evidenceIds: ['f11'] },
                { id: 'pb2', text: 'Created data visualization dashboards using D3.js used by 50+ executives.', evidenceIds: ['f13'] }
            ]
        }
    ],
    activeVariantId: 'v1',
    snapshots: [],
    tasks: []
  }
];

export const stages = ['discovered', 'researching', 'tailoring', 'ready', 'submitted', 'screen', 'interview', 'offer', 'declined', 'withdrawn', 'archived'];
