// personas/cora.ts
import type { Persona } from "./index";
import {
  CORA_SYSTEM_PROMPT,
  CORA_PROFILE_BIO,
} from "../coraPersonality";

export const coraPersona: Persona = {
  id: "cora",
  systemPrompt: CORA_SYSTEM_PROMPT,
  profileBio: CORA_PROFILE_BIO,
};
