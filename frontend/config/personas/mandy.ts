// personas/mandy.ts
import type { Persona } from "./index";
import {
  MANDY_SYSTEM_PROMPT,
  MANDY_PROFILE_BIO,
} from "../mandyPersonality";

export const mandyPersona: Persona = {
  id: "mandy",
  systemPrompt: MANDY_SYSTEM_PROMPT,
  profileBio: MANDY_PROFILE_BIO,
};
