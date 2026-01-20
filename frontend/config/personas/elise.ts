// personas/elise.ts
import type { Persona } from "./index";
import {
  ELISE_SYSTEM_PROMPT,
  ELISE_PROFILE_BIO,
} from "../elisePersonality";

export const elisePersona: Persona = {
  id: "elise",
  systemPrompt: ELISE_SYSTEM_PROMPT,
  profileBio: ELISE_PROFILE_BIO,
};
