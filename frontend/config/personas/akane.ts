// personas/akane.ts
import type { Persona } from "./index";
import {
  AKANE_SYSTEM_PROMPT,
  AKANE_PROFILE_BIO,
} from "../akanePersonality";

export const akanePersona: Persona = {
  id: "akane",
  systemPrompt: AKANE_SYSTEM_PROMPT,
  profileBio: AKANE_PROFILE_BIO,
};
