// personas/kara.ts
import type { Persona } from "./index";import {
  KARA_SYSTEM_PROMPT,
  KARA_PROFILE_BIO,
} from "../karaPersonality";

export const karaPersona: Persona = {
  id: "kara",
  systemPrompt: KARA_SYSTEM_PROMPT,
  profileBio: KARA_PROFILE_BIO,
};
