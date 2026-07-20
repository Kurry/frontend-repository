import { signal } from '@preact/signals';

export const projects = signal([
  {
    name: "Signals",
    year: 2024,
    type: "Research Integrity Platform",
    desc: "Academic institutions use these dashboards to monitor research integrity. Tabbed navigation with sticky metrics and dynamic filtering.",
    tags: ["UX Design", "Dashboard", "Research"],
    status: "shipped",
    featured: true,
    slug: "signals-platform"
  },
  {
    name: "Anylyze",
    year: 2024,
    type: "Analytics Data Platform",
    desc: "Rebuilt visualization layer with three-tiered typography and five component states.",
    tags: ["Dashboard UX", "Data Viz", "SaaS"],
    status: "shipped",
    featured: true,
    slug: "anylyze-data"
  },
  {
    name: "LiveU",
    year: 2024,
    type: "Broadcasting Enterprise",
    desc: "120+ components for a global live video broadcasting platform.",
    tags: ["Design System", "Enterprise", "Broadcasting"],
    status: "shipped",
    featured: true,
    slug: "liveu-system"
  },
  {
    name: "TUIASI",
    year: 2023,
    type: "Education Platform",
    desc: "Four-week emergency rebuild; record admissions followed.",
    tags: ["Web Design", "Education UX", "Architecture"],
    status: "shipped",
    featured: false,
    slug: "tuiasi-redesign"
  },
  {
    name: "ResNet AI",
    year: 2023,
    type: "Hospitality Design System",
    desc: "Token-based consolidation of 1,300+ variants.",
    tags: ["Design System", "Hospitality"],
    status: "shipped",
    featured: false,
    slug: "resnet-ai"
  },
  {
    name: "Socyal",
    year: 2023,
    type: "HR Mobile Platform",
    desc: "Investor-ready mobile product; #3 Product of the Day.",
    tags: ["Product Design", "Mobile UX", "Product Hunt"],
    status: "shipped",
    featured: false,
    slug: "socyal-hr"
  }
]);

export const skills = signal([
  { name: 'Design Systems', prof: 98 },
  { name: 'UX/UI', prof: 95 },
  { name: 'Data Visualization', prof: 90 },
  { name: 'Figma Mastery', prof: 95 },
  { name: 'Prototyping', prof: 85 }
]);

export const identity = signal({
  name: "Your Name",
  role: "Product Designer & Design Systems Lead",
  location: "Your City, Country",
  email: "hello@example.com",
  phone: "+1 (555) 000-0000",
  agencyName: "Design Studio",
  agencyUrl: "designstudio.example",
  about: "I turn complexity into clarity. Whether it's an enterprise dashboard or a consumer mobile app, I'm always asking the same question: \"Does this remove friction?\" Complexity is fine. Confusion is the problem."
});

export const theme = signal("dark"); // dark, light, retro, glass
export const mode = signal("cli"); // 'cli', 'board', 'config', 'export'

export const commandHistory = signal([]);
export const autocompleteState = signal("");
export const outputBuffer = signal([]);

export const filters = signal({
  status: null, // 'shipped', 'wip', 'archived'
  tag: null,
  featured: null // true, false
});

export const sort = signal(null); // 'name-asc', 'name-desc'

// 'not_set', 'accepted', 'declined'
export const cookieConsent = signal('not_set');
