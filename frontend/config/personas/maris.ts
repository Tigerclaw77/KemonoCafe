// personas/maris.ts
import type { Persona } from "./index";
import {
  MARIS_SYSTEM_PROMPT,
  MARIS_PROFILE_BIO,
} from "../marisPersonality";

export const marisPersona: Persona = {
  id: "maris",
  systemPrompt: MARIS_SYSTEM_PROMPT,
  profileBio: MARIS_PROFILE_BIO,
};
