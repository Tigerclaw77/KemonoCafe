// personas/juni.ts
import type { Persona } from "./index";
import {
  JUNI_SYSTEM_PROMPT,
  JUNI_PROFILE_BIO,
} from "../juniPersonality";

export const juniPersona: Persona = {
  id: "juni",
  systemPrompt: JUNI_SYSTEM_PROMPT,
  profileBio: JUNI_PROFILE_BIO,
};
