import { signal } from '@preact/signals';

export const projects = signal([
  {
    name: "Signals",
    year: 2024,
    type: "Research Integrity Platform",
    summary: "Academic institutions use these dashboards to monitor research integrity. Tabbed navigation with sticky metrics and dynamic filtering.",
    tags: ["UX Design", "Dashboard", "Research"],
    status: "shipped",
    featured: true,
    slug: "signals-platform"
  },
  {
    name: "Anylyze",
    year: 2024,
    type: "Analytics Data Platform",
    summary: "Rebuilt visualization layer with three-tiered typography and five component states.",
    tags: ["Dashboard UX", "Data Viz", "SaaS"],
    status: "shipped",
    featured: true,
    slug: "anylyze-data"
  },
  {
    name: "LiveU",
    year: 2024,
    type: "Broadcasting Enterprise",
    summary: "120+ components for a global live video broadcasting platform.",
    tags: ["Design System", "Enterprise", "Broadcasting"],
    status: "shipped",
    featured: true,
    slug: "liveu-system"
  },
  {
    name: "TUIASI",
    year: 2023,
    type: "Education Platform",
    summary: "Four-week emergency rebuild; record admissions followed.",
    tags: ["Web Design", "Education UX", "Architecture"],
    status: "shipped",
    featured: false,
    slug: "tuiasi-redesign"
  },
  {
    name: "ResNet AI",
    year: 2023,
    type: "Hospitality Design System",
    summary: "Token-based consolidation of 1,300+ variants.",
    tags: ["Design System", "Hospitality"],
    status: "shipped",
    featured: false,
    slug: "resnet-ai"
  },
  {
    name: "Socyal",
    year: 2023,
    type: "HR Mobile Platform",
    summary: "Investor-ready mobile product; #3 Product of the Day.",
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

// Closed enum shared by the theme signal, WebMCP set_theme validation, and
// the PortfolioDocument/Profile schemas so every consumer agrees on the
// same four valid values.
export const THEMES = ['dark', 'light', 'retro', 'glass'];

export const theme = signal("dark"); // dark, light, retro, glass
export const mode = signal("cli"); // 'cli', 'board', 'config', 'export'

export const commandHistory = signal([]);
export const outputBuffer = signal([]);

// Boot sequence progress lives here (not as component-local state) so that
// closing and reopening the terminal — which unmounts/remounts Terminal —
// resumes the boot animation instead of leaving it stuck partway through.
export const bootStep = signal(0);
export const bootComplete = signal(false);

export const filters = signal({
  status: null, // 'shipped', 'wip', 'archived'
  tag: null,
  featured: null // true, false
});

export const sort = signal(null); // 'name-asc', 'name-desc'

// 'not_set', 'accepted', 'declined'
export const cookieConsent = signal('not_set');

// Named shell profiles (PortfolioDocument.profiles); none saved by default.
export const profiles = signal([]);
