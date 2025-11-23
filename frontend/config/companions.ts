// frontend/config/companions.ts

import {
  PENNY_SYSTEM_PROMPT,
  PENNY_PROFILE_BIO,
} from "./pennyPersonality";
import {
  SANDY_SYSTEM_PROMPT,
  SANDY_PROFILE_BIO,
} from "./sandyPersonality";

// NEW: bring in the full set of character IDs
import type { CharacterId } from "./index";

// Instead of: export type CompanionId = "penny" | "sandy";
export type CompanionId = CharacterId;

export type CompanionConfig = {
  id: CompanionId;
  name: string;
  emoji: string;
  avatarSrc: string;     // main image used in chat/profile
  imageSrc: string;      // used on homepage cards (can be same as avatarSrc)
  title: string;         // e.g. "Cheerful Barista"
  shortDescription: string;
  accentColor: string;
  systemPrompt: string;  // AI-only prompt
  profileBio: string;    // user-facing bio for modal
};

// We only have *explicit* configs for Penny and Sandy for now;
// the others (Mandy, Yuki, etc.) will be mapped from CHARACTERS_BY_ID.
const COMPANIONS: CompanionConfig[] = [
  {
    id: "penny",
    name: "Penny",
    emoji: "🦊",
    avatarSrc: "/penny.png",
    imageSrc: "/penny.png",
    title: "Cheerful Barista",
    shortDescription:
      "Bright, bubbly fennec maid who keeps your cup topped up and your mood a little lighter.",
    accentColor: "#38bdf8", // sky-400
    systemPrompt: PENNY_SYSTEM_PROMPT,
    profileBio: PENNY_PROFILE_BIO,
  },
  {
    id: "sandy",
    name: "Sandy",
    emoji: "🦊", // placeholder, change later
    avatarSrc: "/sandy.png",
    imageSrc: "/sandy.png",
    title: "Calm Sweetheart",
    shortDescription:
      "Sun-warmed sand fox girl who turns late nights into soft, cozy conversations.",
    accentColor: "#a855f7", // purple-500
    systemPrompt: SANDY_SYSTEM_PROMPT,
    profileBio: SANDY_PROFILE_BIO,
  },
];

export const companions = COMPANIONS; // used on the homepage

export function getCompanionById(id: string): CompanionConfig | null {
  return COMPANIONS.find((c) => c.id === id) || null;
}

export function getAllCompanions(): CompanionConfig[] {
  return COMPANIONS;
}
