// frontend/hooks/useChatSession.ts
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  normalizeDailyFree,
  isApiError,
  safeReadResponse,
} from "../utils/chatUtils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type UserStatusSuccess = {
  remainingMessages: number;
  hasNomination: boolean;
  nominationExpiresAt: string | null;
  nominationGraceEndsAt: string | null;
  hasDailyFreeAvailable: boolean;
  dailyFreeRemaining: number | null;
};

type UserStatusError = { error: string };
type UserStatusResponse = UserStatusSuccess | UserStatusError;

export type ChatSessionState = {
  authChecked: boolean;
  effectiveUserId: string | null;
  isGuest: boolean;

  showLimitWarning: boolean;
  setShowLimitWarning: React.Dispatch<React.SetStateAction<boolean>>;

  remainingMessages: number | null;
  setRemainingMessages: React.Dispatch<React.SetStateAction<number | null>>;

  hasNominationActive: boolean;
  setHasNominationActive: React.Dispatch<React.SetStateAction<boolean>>;

  nominationExpiresAt: string | null;
  setNominationExpiresAt: React.Dispatch<React.SetStateAction<string | null>>;

  nominationGraceEndsAt: string | null;
  setNominationGraceEndsAt: React.Dispatch<React.SetStateAction<string | null>>;

  hasDailyFreeAvailable: boolean;
  setHasDailyFreeAvailable: React.Dispatch<React.SetStateAction<boolean>>;

  dailyFreeRemaining: number | null;
  setDailyFreeRemaining: React.Dispatch<React.SetStateAction<number | null>>;

  nominationOrGraceActive: boolean;
};

type UseChatSessionParams = {
  userId?: string;
  companionId: string;
  personaLines: {
    nominationWarning: string;
  };
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useChatSession({
  userId,
  companionId,
  personaLines,
  setMessages,
}: UseChatSessionParams): ChatSessionState {
  // ── Identity ─────────────────────────────────────────────
  const [authChecked, setAuthChecked] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  const effectiveUserId = userId ?? sessionUserId ?? null;
  const isGuest = authChecked ? !effectiveUserId : false;

  // ── Economy state ────────────────────────────────────────
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [remainingMessages, setRemainingMessages] = useState<number | null>(
    null
  );
  const [hasNominationActive, setHasNominationActive] = useState(false);
  const [nominationExpiresAt, setNominationExpiresAt] = useState<string | null>(
    null
  );
  const [nominationGraceEndsAt, setNominationGraceEndsAt] = useState<
    string | null
  >(null);
  const [hasDailyFreeAvailable, setHasDailyFreeAvailable] = useState(false);
  const [dailyFreeRemaining, setDailyFreeRemaining] = useState<number | null>(
    null
  );

  const hasLoadedStatusRef = useRef(false);
  const [hasShownNominationWarning, setHasShownNominationWarning] =
    useState(false);

  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNowTs(Date.now());
    }, 30_000); // update every 30s (cheap, sufficient)

    return () => clearInterval(interval);
  }, []);

  // ── Derived nomination/grace state ───────────────────────
  const nominationOrGraceActive = useMemo(() => {
    if (!nominationExpiresAt && !nominationGraceEndsAt) {
      return hasNominationActive;
    }

    if (
      nominationExpiresAt &&
      nowTs <= new Date(nominationExpiresAt).getTime()
    ) {
      return true;
    }

    if (
      nominationGraceEndsAt &&
      nowTs <= new Date(nominationGraceEndsAt).getTime()
    ) {
      return true;
    }

    return false;
  }, [nominationExpiresAt, nominationGraceEndsAt, hasNominationActive, nowTs]);

  // ── Resolve auth + handle logout reset (SINGLE SOURCE) ───
  useEffect(() => {
    let cancelled = false;

    async function resolveAuth() {
      try {
        if (userId) {
          if (!cancelled) {
            setSessionUserId(userId);
            setAuthChecked(true);
          }
          return;
        }

        const { data, error } = await supabase.auth.getUser();
        if (cancelled) return;

        const nextUserId = error || !data?.user ? null : data.user.id;

        // LOGOUT RESET — event driven
        if (sessionUserId && !nextUserId) {
          setRemainingMessages(null);
          setHasNominationActive(false);
          setNominationExpiresAt(null);
          setNominationGraceEndsAt(null);
          setHasDailyFreeAvailable(false);
          setDailyFreeRemaining(null);
          setShowLimitWarning(false);
          setHasShownNominationWarning(false);
          hasLoadedStatusRef.current = false;
        }

        setSessionUserId(nextUserId);
        setAuthChecked(true);
      } catch {
        if (!cancelled) {
          setSessionUserId(null);
          setAuthChecked(true);
        }
      }
    }

    resolveAuth();
    return () => {
      cancelled = true;
    };
  }, [userId, sessionUserId]);

  // ── Fetch user status once per login ─────────────────────
  useEffect(() => {
    if (!authChecked || !effectiveUserId) return;
    if (hasLoadedStatusRef.current) return;

    hasLoadedStatusRef.current = true;
    let aborted = false;

    async function fetchStatus() {
      try {
        const res = await fetch("/api/user/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: effectiveUserId }),
        });

        const data = await safeReadResponse<UserStatusResponse>(res);
        if (aborted || !data || isApiError(data)) return;

        setRemainingMessages(
          typeof data.remainingMessages === "number"
            ? data.remainingMessages
            : 0
        );
        setHasNominationActive(!!data.hasNomination);
        setNominationExpiresAt(data.nominationExpiresAt);
        setNominationGraceEndsAt(data.nominationGraceEndsAt);
        setHasDailyFreeAvailable(!!data.hasDailyFreeAvailable);
        setDailyFreeRemaining(normalizeDailyFree(data.dailyFreeRemaining));
      } catch (err) {
        console.error("Status fetch error:", err);
      }
    }

    fetchStatus();
    return () => {
      aborted = true;
    };
  }, [authChecked, effectiveUserId]);

  // ── Nomination warning injection ─────────────────────────
  useEffect(() => {
    if (
      !nominationExpiresAt ||
      !hasNominationActive ||
      hasShownNominationWarning
    )
      return;

    const expiresMs = new Date(nominationExpiresAt).getTime();
    if (Number.isNaN(expiresMs)) return;

    const delay = expiresMs - 5 * 60_000 - Date.now();

    const showWarning = () => {
      setMessages((prev) => [
        ...prev,
        {
          id: `nomination-warning-${Date.now()}`,
          role: "assistant",
          content: personaLines.nominationWarning,
        },
      ]);
      setHasShownNominationWarning(true);
    };

    if (delay <= 0) {
      showWarning();
      return;
    }

    const timer = window.setTimeout(showWarning, delay);
    return () => window.clearTimeout(timer);
  }, [
    nominationExpiresAt,
    hasNominationActive,
    hasShownNominationWarning,
    personaLines.nominationWarning,
    setMessages,
  ]);

  return {
    authChecked,
    effectiveUserId,
    isGuest,

    showLimitWarning,
    setShowLimitWarning,

    remainingMessages,
    setRemainingMessages,

    hasNominationActive,
    setHasNominationActive,

    nominationExpiresAt,
    setNominationExpiresAt,

    nominationGraceEndsAt,
    setNominationGraceEndsAt,

    hasDailyFreeAvailable,
    setHasDailyFreeAvailable,

    dailyFreeRemaining,
    setDailyFreeRemaining,

    nominationOrGraceActive,
  };
}
