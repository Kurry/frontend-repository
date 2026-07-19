export interface ProfileHeader {
  name: string;
  title: string;
  bio: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  linkLabel: string;
  linkUrl: string;
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

export interface HistorySnapshot {
  content: ContentState;
  timestamp: number;
  label: string;
}

export interface UndoRedoState {
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  current: HistorySnapshot;
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
