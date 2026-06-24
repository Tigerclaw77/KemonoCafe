// personas/naomi.ts
import type { Persona } from "./index";
import {
  NAOMI_SYSTEM_PROMPT,
  NAOMI_PROFILE_BIO,
} from "../naomiPersonality";

export const naomiPersona: Persona = {
  id: "naomi",
  systemPrompt: NAOMI_SYSTEM_PROMPT,
  profileBio: NAOMI_PROFILE_BIO,
};
