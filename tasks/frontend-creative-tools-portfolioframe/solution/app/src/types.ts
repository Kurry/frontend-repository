export interface ProfileHeader {
  name: string;
  title: string;
  bio: string;
}

export type ProjectStatus = 'shipped' | 'wip' | 'concept';

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  linkLabel: string;
  linkUrl: string;
  status: ProjectStatus;
  featured: boolean;
}

export interface Skill {
  id: string;
  label: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
}

export interface ContactLink {
  id: string;
  label: string;
  url: string;
}

export interface ContactInfo {
  email: string;
  location: string;
  links: ContactLink[];
}

export type ThemeName = 'sunrise' | 'slate' | 'forest' | 'blossom';
export type DensityMode = 'compact' | 'spacious';
export type SectionKey = 'header' | 'projects' | 'skills' | 'testimonials' | 'contact';

export interface SectionVisibility {
  header: boolean;
  projects: boolean;
  skills: boolean;
  testimonials: boolean;
  contact: boolean;
}

export interface ContentState {
  profile: ProfileHeader;
  projects: Project[];
  skills: Skill[];
  testimonials: Testimonial[];
  contact: ContactInfo;
}

export interface PortfolioState {
  content: ContentState;
  sectionOrder: SectionKey[];
  sectionVisibility: SectionVisibility;
  theme: ThemeName;
  density: DensityMode;
  drafts: DraftEntry[];
  selectedProjects: string[];
}

export interface DraftEntry {
  name: string;
  timestamp: number;
  content: ContentState;
  sectionOrder: SectionKey[];
  sectionVisibility: SectionVisibility;
  theme: ThemeName;
  density: DensityMode;
}

/**
 * A history snapshot captures every user-visible facet of the builder —
 * content AND layout (section order, visibility, theme, density) — so Undo,
 * Redo, and branch restore reproduce the exact visible state.
 */
export interface HistorySnapshot {
  content: ContentState;
  sectionOrder: SectionKey[];
  sectionVisibility: SectionVisibility;
  theme: ThemeName;
  density: DensityMode;
  timestamp: number;
  label: string;
}

/**
 * An abandoned redo timeline preserved as a selectable branch when a new
 * change is made after Undo, instead of being silently discarded.
 */
export interface HistoryBranch {
  id: string;
  label: string;
  createdAt: number;
  chain: HistorySnapshot[]; // chain[0] is nearest to the fork point; last is the branch tip
}

export const SECTION_LABELS: Record<SectionKey, string> = {
  header: 'Profile Header',
  projects: 'Projects',
  skills: 'Skills',
  testimonials: 'Testimonials',
  contact: 'Contact',
};

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
