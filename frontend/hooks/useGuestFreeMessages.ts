import { useCallback } from "react";
import { getLocalTodayStr } from "../utils/chatUtils";

const GUEST_FREE_KEY = "kemonoCafe_guest_free_v2";
const GUEST_FREE_TOTAL = 6;

type GuestFreePayload = {
  date: string;
  remaining: number;
};

function readGuestFree(): number {
  const today = getLocalTodayStr();
  const raw = window.localStorage.getItem(GUEST_FREE_KEY);

  if (!raw) return GUEST_FREE_TOTAL;

  try {
    const payload = JSON.parse(raw) as GuestFreePayload;

    if (payload.date !== today) return GUEST_FREE_TOTAL;
    if (typeof payload.remaining !== "number") return GUEST_FREE_TOTAL;

    return Math.max(Math.min(payload.remaining, GUEST_FREE_TOTAL), 0);
  } catch {
    return GUEST_FREE_TOTAL;
  }
}

function writeGuestFree(value: number) {
  const payload: GuestFreePayload = {
    date: getLocalTodayStr(),
    remaining: value,
  };

  window.localStorage.setItem(GUEST_FREE_KEY, JSON.stringify(payload));
}

export function useGuestFreeMessages(isGuest: boolean, authChecked: boolean) {
  const guestFreeRemaining =
    authChecked && isGuest ? readGuestFree() : null;

  const updateGuestFreeRemaining = useCallback((value: number) => {
    const clamped = Math.max(Math.min(value, GUEST_FREE_TOTAL), 0);
    writeGuestFree(clamped);
  }, []);

  return {
    guestFreeRemaining,
    updateGuestFreeRemaining,
    GUEST_FREE_TOTAL,
  };
}
