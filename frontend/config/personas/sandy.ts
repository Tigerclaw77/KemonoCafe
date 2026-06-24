// personas/sandy.ts
import type { Persona } from "./index";import {
  SANDY_SYSTEM_PROMPT,
  SANDY_PROFILE_BIO,
} from "../sandyPersonality";

export const sandyPersona: Persona = {
  id: "sandy",
  systemPrompt: SANDY_SYSTEM_PROMPT,
  profileBio: SANDY_PROFILE_BIO,
};
