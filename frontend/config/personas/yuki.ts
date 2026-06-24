// personas/yuki.ts
import type { Persona } from "./index";
import {
  YUKI_SYSTEM_PROMPT,
  YUKI_PROFILE_BIO,
} from "../yukiPersonality";

export const yukiPersona: Persona = {
  id: "yuki",
  systemPrompt: YUKI_SYSTEM_PROMPT,
  profileBio: YUKI_PROFILE_BIO,
};
