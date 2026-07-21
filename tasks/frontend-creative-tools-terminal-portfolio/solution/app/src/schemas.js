import * as v from 'valibot';

// Closed enums shared by the theme signal, WebMCP validation, and the
// PortfolioDocument / Profile schemas so every consumer agrees on the same
// valid values. Owned here (schema layer) to avoid a store<->schema cycle.
export const THEMES = ['dark', 'light', 'retro', 'glass'];
export const STATUSES = ['shipped', 'wip', 'archived'];

// API-shaped field contracts. The record a form creates IS the would-be
// request body, and Export / Import validate through these same schemas.

export const ProjectSchema = v.object({
  name: v.pipe(
    v.string(),
    v.minLength(1, 'Name is required. Enter a project title (1 to 80 characters).'),
    v.maxLength(80, 'Name must be at most 80 characters.'),
  ),
  slug: v.pipe(
    v.string(),
    v.minLength(1, 'Slug is required. Use a lowercase URL-safe id.'),
    v.maxLength(48, 'Slug must be at most 48 characters.'),
    v.regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must use lowercase letters and digits separated by single hyphens (pattern ^[a-z0-9]+(?:-[a-z0-9]+)*$).',
    ),
  ),
  summary: v.pipe(
    v.string(),
    v.minLength(1, 'Summary is required. Add a one-line case-study blurb (1 to 280 characters).'),
    v.maxLength(280, 'Summary must be at most 280 characters.'),
  ),
  status: v.picklist(STATUSES, 'Status must be one of shipped, wip, archived.'),
  tags: v.pipe(
    v.array(
      v.pipe(
        v.string(),
        v.minLength(1, 'Each tag must be 1 to 24 characters.'),
        v.maxLength(24, 'Each tag must be at most 24 characters.'),
      ),
    ),
    v.maxLength(5, 'A project may have at most 5 tags.'),
  ),
  year: v.pipe(
    v.number(),
    v.integer('Year must be a whole number.'),
    v.minValue(2000, 'Year must be between 2000 and 2100.'),
    v.maxValue(2100, 'Year must be between 2000 and 2100.'),
  ),
  featured: v.boolean(),
  // Optional display-only field (not part of the strict contract); kept so the
  // board/detail can show a project category without breaking round-trips.
  type: v.optional(v.string()),
});

export const IdentitySchema = v.object({
  displayName: v.pipe(
    v.string(),
    v.minLength(1, 'Display name is required. Enter the name shown on /about (1 to 60 characters).'),
    v.maxLength(60, 'Display name must be at most 60 characters.'),
  ),
  email: v.pipe(
    v.string(),
    v.minLength(1, 'Email is required.'),
    v.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email must look like name@domain.tld with an @ and a dot in the domain.'),
  ),
  location: v.pipe(
    v.string(),
    v.minLength(1, 'Location is required. Enter a city / region (1 to 80 characters).'),
    v.maxLength(80, 'Location must be at most 80 characters.'),
  ),
  tagline: v.optional(
    v.pipe(v.string(), v.maxLength(120, 'Tagline must be at most 120 characters.')),
  ),
});

export const SkillSchema = v.object({
  name: v.pipe(
    v.string(),
    v.minLength(1, 'Skill name is required (1 to 40 characters).'),
    v.maxLength(40, 'Skill name must be at most 40 characters.'),
  ),
  proficiency: v.pipe(
    v.number(),
    v.integer('Proficiency must be a whole number.'),
    v.minValue(0, 'Proficiency must be between 0 and 100.'),
    v.maxValue(100, 'Proficiency must be between 0 and 100.'),
  ),
});
