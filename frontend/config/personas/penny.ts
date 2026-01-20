// personas/penny.ts
import type { Persona } from "./index";
import {
  PENNY_SYSTEM_PROMPT,
  PENNY_PROFILE_BIO,
} from "../pennyPersonality";

export const pennyPersona: Persona = {
  id: "penny",
  systemPrompt: PENNY_SYSTEM_PROMPT,
  profileBio: PENNY_PROFILE_BIO,
};
