// personas/cybill.ts
import type { Persona } from "./index";import {
  CYBILL_SYSTEM_PROMPT,
  CYBILL_PROFILE_BIO,
} from "../cybillPersonality";

export const cybillPersona: Persona = {
  id: "cybill",
  systemPrompt: CYBILL_SYSTEM_PROMPT,
  profileBio: CYBILL_PROFILE_BIO,
};
