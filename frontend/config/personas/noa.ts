// personas/noa.ts
import type { Persona } from "./index";
import {
  NOA_SYSTEM_PROMPT,
  NOA_PROFILE_BIO,
} from "../noaPersonality";

export const noaPersona: Persona = {
  id: "noa",
  systemPrompt: NOA_SYSTEM_PROMPT,
  profileBio: NOA_PROFILE_BIO,
};
