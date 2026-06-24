// frontend/config/app-config/appProfile.ts
// Declarative definition of WHAT this app is

export type PersonaSourceMode =
  | "catalog"        // selectable from a character catalog
  | "fixed";         // single, fixed persona (no selector)

export type InteractionMode =
  | "limited-chat"   // KemonoCafe-style gated interaction
  | "full-chat"      // Aijin-style unrestricted chat
  | "one-way";       // influencer / broadcast mode

export type ProgressEngine =
  | "none"           // no relationship progression
  | "nomination"    // time-based access (KemonoCafe)
  | "intimacy";     // growth-based relationship (Aijin)

export interface AppProfile {
  /** How personas are chosen */
  personaSource: PersonaSourceMode;

  /** How interactive the experience is */
  interactionMode: InteractionMode;

  /** Whether relationships evolve over time */
  progressEngine: ProgressEngine;

  /** Whether the app supports multiple parallel relationships */
  allowMultipleActivePersonas: boolean;
}

/**
 * KemonoCafe profile
 * - Many characters available
 * - One active at a time
 * - Limited chat unless nominated
 * - No long-term intimacy growth
 */
// export const appProfile: AppProfile = {
//   personaSource: "catalog",
//   interactionMode: "limited-chat",
//   progressEngine: "nomination",
//   allowMultipleActivePersonas: false,
// };

/**
 * Aijin profile
 * - Many characters available
 * - Multiple active companions allowed
 * - Full, unrestricted chat
 * - Long-term intimacy growth with persistent relationships
 */
export const appProfile = {
  personaSource: "catalog",
  interactionMode: "full-chat",
  progressEngine: "intimacy",
  allowMultipleActivePersonas: true,
};
