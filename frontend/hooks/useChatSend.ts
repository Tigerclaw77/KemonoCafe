"use client";

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

type ChatApiSuccess = {
  reply: string;
  remainingMessages: number;
  hasNomination: boolean;
  nominationExpiresAt: string | null;
  nominationGraceEndsAt?: string | null;
  nominationJustEnded: boolean;
  hasDailyFreeAvailable: boolean;
  dailyFreeRemaining: number;
};

type ChatApiError = { error: string };
type ChatApiResponse = ChatApiSuccess | ChatApiError;

interface UseChatSendParams {
  companionId: string;

  personaLines: {
    nominationFinal: string;
    bossInterrupt: string[];
  };

  authChecked: boolean;
  isGuest: boolean;
  effectiveUserId: string | null;
  nominationOrGraceActive: boolean;

  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;

  setShowLimitWarning: (v: boolean) => void;

  remainingMessages: number | null;
  setRemainingMessages: (v: number | null) => void;

  setHasNominationActive: (v: boolean) => void;
  setNominationExpiresAt: (v: string | null) => void;
  setNominationGraceEndsAt: (v: string | null) => void;

  setHasDailyFreeAvailable: (v: boolean) => void;
  setDailyFreeRemaining: (v: number | null) => void;

  hasAttemptedSendRef: React.RefObject<boolean>;
}

export function useChatSend({
  companionId,
  personaLines,

  authChecked,
  isGuest,
  effectiveUserId,
  nominationOrGraceActive,

  messages,
  setMessages,

  setShowLimitWarning,

  remainingMessages,
  setRemainingMessages,

  setHasNominationActive,
  setNominationExpiresAt,
  setNominationGraceEndsAt,

  setHasDailyFreeAvailable,
  setDailyFreeRemaining,

  hasAttemptedSendRef,
}: UseChatSendParams) {
  const sendMessage = async (content: string) => {
    hasAttemptedSendRef.current = true;

    if (!authChecked) return;
    if (!content.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    };

    const outgoingMessages = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content },
    ];

    setMessages((prev) => [...prev, userMessage]);

    try {
      // ── Guest users are blocked here (handled elsewhere) ──
      if (isGuest || !effectiveUserId) {
        setShowLimitWarning(true);
        return;
      }

      const res = await fetch(`/api/chat/${companionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: effectiveUserId,
          messages: outgoingMessages,
        }),
      });

      const raw = await safeReadResponse<ChatApiResponse>(res);

      if (!res.ok || !raw || isApiError(raw)) {
        throw new Error("Chat API failed");
      }

      const data = raw as ChatApiSuccess;

      const newMessages: Message[] = [
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.reply,
        },
      ];

      if (data.nominationJustEnded) {
        newMessages.push({
          id: `assistant-nomination-ended-${Date.now()}`,
          role: "assistant",
          content: personaLines.nominationFinal,
        });
      }

      setMessages((prev) => [...prev, ...newMessages]);

      setRemainingMessages(data.remainingMessages);
      setHasNominationActive(data.hasNomination);
      setNominationExpiresAt(data.nominationExpiresAt ?? null);
      setNominationGraceEndsAt(data.nominationGraceEndsAt ?? null);
      setHasDailyFreeAvailable(!!data.hasDailyFreeAvailable);
      setDailyFreeRemaining(normalizeDailyFree(data.dailyFreeRemaining));

      if ((data.remainingMessages ?? 0) > 0) {
        setShowLimitWarning(false);
      }

      const graceStillActive = data.nominationGraceEndsAt
        ? Date.now() < new Date(data.nominationGraceEndsAt).getTime()
        : false;

      const effectiveRemaining =
        (data.remainingMessages ?? 0) + (data.dailyFreeRemaining ?? 0);

      if (
        hasAttemptedSendRef.current &&
        !data.hasNomination &&
        !graceStillActive &&
        effectiveRemaining <= 0
      ) {
        const line =
          personaLines.bossInterrupt?.[0] ??
          "Sorry—your session is paused for now.";

        setMessages((prev) => [
          ...prev,
          {
            id: `boss-${Date.now()}`,
            role: "assistant",
            content: line,
          },
        ]);

        setShowLimitWarning(true);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content:
            "Ah—sorry! The café got a bit noisy. Could you try again in a moment?",
        },
      ]);
    }
  };

  return { sendMessage };
}
