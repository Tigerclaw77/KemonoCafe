// personas/nika.ts
import type { Persona } from "./index";import {
  NIKA_SYSTEM_PROMPT,
  NIKA_PROFILE_BIO,
} from "../nikaPersonality";

export const nikaPersona: Persona = {
  id: "nika",
  systemPrompt: NIKA_SYSTEM_PROMPT,
  profileBio: NIKA_PROFILE_BIO,
};
