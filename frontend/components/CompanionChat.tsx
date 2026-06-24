// frontend/components/CompanionChat.tsx
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  KeyboardEvent,
  FormEvent,
} from "react";
import type { CompanionConfig } from "../config/companions";
import { useSearchParams, useRouter } from "next/navigation";
import type { PersonaId } from "../config/personas";
import { KEMONO_CAFE_PERSONA_LINES } from "../config/personas/kemonoCafePersonaLines";
import { getChatStorageKey } from "../utils/chatUtils";
import { useGuestFreeMessages } from "../hooks/useGuestFreeMessages";
import { useGuestChatController } from "../hooks/useGuestChatController";
import ChatMessages from "../chat/ChatMessages";
import { getHeaderStatusText } from "../utils/chatHeaderText";
import ChatHeader from "../chat/ChatHeader";
import { useChatSend } from "../hooks/useChatSend";
import { useChatSession, type ChatSessionState } from "../hooks/useChatSession";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface CompanionChatProps {
  companion: CompanionConfig;
  userId?: string;
}

async function fetchChatHistory(
  companionId: string,
  userId: string
): Promise<Message[] | null> {
  try {
    const res = await fetch(`/api/chat/${companionId}/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data?.ok || !Array.isArray(data.messages)) return null;

    return data.messages as Message[];
  } catch {
    return null;
  }
}

export default function CompanionChat({
  companion,
  userId,
}: CompanionChatProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ----- Stable persona lines (memo prevents needless rerenders) -----
  const personaLines = useMemo(() => {
    const personaId = companion.id as PersonaId;
    return (
      KEMONO_CAFE_PERSONA_LINES[personaId] ?? KEMONO_CAFE_PERSONA_LINES.default
    );
  }, [companion.id]);

  const justVerified = searchParams.get("verified") === "1";

  // ----- Core state -----
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  // ---- refs we previously “lost” during refactors ----
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const hasAttemptedSendRef = useRef(false);

  /**
   * ✅ Session + economy now live here (single source of truth)
   * Replaces: resolveAuth, status fetch, nomination/grace memo, nomination warning effect
   */
  const chatSession: ChatSessionState = useChatSession({
    userId,
    companionId: companion.id,
    personaLines,
    setMessages,
  });

  const {
    authChecked,
    effectiveUserId,
    isGuest,

    showLimitWarning,
    setShowLimitWarning,

    remainingMessages,
    setRemainingMessages,

    // Keep setters we actually use:
    setHasNominationActive,
    setNominationExpiresAt,
    setNominationGraceEndsAt,

    hasDailyFreeAvailable,
    setHasDailyFreeAvailable,

    dailyFreeRemaining,
    setDailyFreeRemaining,

    nominationOrGraceActive,
  } = chatSession;

  // Guest free counter storage hook
  const { guestFreeRemaining, updateGuestFreeRemaining } = useGuestFreeMessages(
    isGuest,
    authChecked
  );

  // Guest chat controller (email capture + guest sending)
  const {
    isEmailCaptureMode,
    emailInput,
    setEmailInput,
    isEmailSubmitting,
    emailBannerError,
    sendGuestMessage,
    submitEmail,
  } = useGuestChatController({
    companionId: companion.id,
    personaLines,
    guestFreeRemaining,
    updateGuestFreeRemaining,
  });

  // ----- Load history (server for logged-in, localStorage fallback) -----
  useEffect(() => {
    if (!authChecked) return;
    if (typeof window === "undefined") return;

    let cancelled = false;

    async function loadHistory() {
      // 1) Logged-in → try server history first
      if (effectiveUserId) {
        const history = await fetchChatHistory(companion.id, effectiveUserId);
        if (!cancelled && history && history.length > 0) {
          setMessages(history);
          return;
        }
      }

      // 2) Fallback → localStorage
      const storageKey = getChatStorageKey(companion.id, effectiveUserId);
      const raw = window.localStorage.getItem(storageKey);

      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Message[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            return;
          }
        } catch {
          // ignore
        }
      }

      // 3) Final fallback → generic welcome (but NOT if justVerified)
      if (!justVerified) {
        setMessages([
          {
            id: `welcome-${Date.now()}`,
            role: "assistant",
            content: `Welcome to Kemono Cafe! I’m ${companion.name}, your hostess today. Please, have a seat—what would you like to talk about? ♡`,
          },
        ]);
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [
    authChecked,
    effectiveUserId,
    companion.id,
    companion.name,
    justVerified,
  ]);

  // ----- Verified welcome injection (one-time) -----
  const [verifiedWelcomeShown, setVerifiedWelcomeShown] = useState(false);

  useEffect(() => {
    if (!justVerified) return;
    if (verifiedWelcomeShown) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `verified-welcome-${Date.now()}`,
        role: "assistant",
        content: personaLines.verifiedWelcome,
      },
    ]);

    setVerifiedWelcomeShown(true);

    // Clean URL so refresh doesn’t replay it
    router.replace(`/chat/${companion.id}`, { scroll: false });
  }, [
    justVerified,
    verifiedWelcomeShown,
    personaLines.verifiedWelcome,
    companion.id,
    router,
  ]);

  // ----- Persist messages to localStorage (guest + safety net) -----
  useEffect(() => {
    if (!authChecked) return;
    if (typeof window === "undefined") return;
    if (messages.length === 0) return;

    const storageKey = getChatStorageKey(companion.id, effectiveUserId);
    window.localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, authChecked, effectiveUserId, companion.id]);

  // ----- Logged-in send hook (guest sending is handled in this file) -----
  const { sendMessage } = useChatSend({
    companionId: companion.id,
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
  });

  const runGuestSend = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    // Mirrors the shape used by your guest controller
    const outgoingMessages = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: trimmed },
    ];

    // Optimistic user message for guest path (guest controller will append assistant)
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", content: trimmed },
    ]);

    setInput("");

    await sendGuestMessage(outgoingMessages, (newMessages) => {
      setMessages((prev) => [...prev, ...newMessages]);
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!authChecked) return;
    if (isSending) return;

    // Guest email capture submit
    if (isGuest && isEmailCaptureMode) {
      await submitEmail(companion.id);
      return;
    }

    const content = input.trim();
    if (!content) return;

    setIsSending(true);

    try {
      if (isGuest) {
        await runGuestSend(content);
      } else {
        await sendMessage(content);
        setInput("");
      }
    } finally {
      setIsSending(false);
      if (textareaRef.current) textareaRef.current.focus();
    }
  };

  const handleKeyDown = async (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!authChecked) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await handleSubmit(e as unknown as FormEvent);
    }
  };

  const handleNominate = async () => {
    if (!authChecked) return;

    if (!effectiveUserId) {
      alert(
        "Create a free account first so we can remember your nomination and message balance. ♡"
      );
      return;
    }

    if (nominationOrGraceActive) {
      alert(`${companion.name} is already your nomination. ♡`);
      return;
    }

    try {
      const res = await fetch("/api/nominate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: effectiveUserId,
          companionId: companion.id,
        }),
      });

      const data: { url?: string; error?: string } = await res.json();

      if (!res.ok || !data.url) {
        console.error("Nomination checkout error:", data);
        alert(data.error ?? "Could not start nomination.");
        return;
      }

      window.location.assign(data.url);
    } catch (err) {
      console.error("Nomination client error:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  const inputPlaceholder = (() => {
    if (!authChecked) return "Loading…";

    if (isGuest) {
      if (guestFreeRemaining !== null && guestFreeRemaining <= 0) {
        return "Enter your email to save your place at the café.";
      }
      return `Talk to ${companion.name}… (you have free sample messages)`;
    }

    if (!effectiveUserId) return `Sign in to talk to ${companion.name}…`;
    if (nominationOrGraceActive)
      return `Talk to ${companion.name} as long as you like...`;

    const banked = remainingMessages ?? 0;
    const free =
      hasDailyFreeAvailable && dailyFreeRemaining !== null
        ? dailyFreeRemaining
        : 0;
    const effective = banked + free;

    if (effective <= 0) {
      return "You’re out of messages. Nominate her or order from the café menu to keep chatting.";
    }

    return `Talk to ${companion.name}...`;
  })();

  const loggedInEffectiveRemaining =
    (remainingMessages ?? 0) +
    (hasDailyFreeAvailable && dailyFreeRemaining !== null
      ? dailyFreeRemaining
      : 0);

  const inputDisabled = !authChecked
    ? true
    : isGuest
    ? isSending || guestFreeRemaining === null
    : isSending ||
      !effectiveUserId ||
      (!nominationOrGraceActive && loggedInEffectiveRemaining <= 0);

  // Focus input when it becomes enabled
  useEffect(() => {
    if (!inputDisabled && textareaRef.current) textareaRef.current.focus();
  }, [inputDisabled]);

  const headerStatusText = getHeaderStatusText({
    authChecked,
    isGuest,
    guestFreeRemaining,
    effectiveUserId,
    nominationOrGraceActive,
    remainingMessages,
    hasDailyFreeAvailable,
    dailyFreeRemaining,
  });

  return (
    <div
      className="
        w-full
        flex flex-col
        h-[440px] md:h-[470px]

        rounded-2xl
        overflow-hidden
        bg-slate-50/95
        border border-[rgba(180,200,255,0.18)]
        shadow-[0_18px_40px_rgba(0,0,0,0.45)]
      "
    >
      {/* Header */}
      <ChatHeader
        companionName={companion.name}
        headerStatusText={headerStatusText}
        showLimitWarning={showLimitWarning}
        nominationOrGraceActive={nominationOrGraceActive}
        loggedInEffectiveRemaining={loggedInEffectiveRemaining}
        remainingMessages={remainingMessages}
        isGuest={isGuest}
        effectiveUserId={effectiveUserId}
        authChecked={authChecked}
        onNominate={handleNominate}
        companionId={companion.id}
      />

      <ChatMessages messages={messages} isSending={isSending} />

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="
          w-full
          rounded-xl
          px-4 py-3
          text-sm

          bg-[rgba(240,244,255,0.9)]
          border border-[rgba(180,200,255,0.45)]

          text-slate-800
          placeholder:text-slate-500

          outline-none
          focus:bg-white
          focus:border-cyan-400
          focus:ring-2 focus:ring-cyan-300/40
          transition
        "
      >
        {isGuest && isEmailCaptureMode ? (
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="you@example.com"
            disabled={isEmailSubmitting}
            className="
              w-full
              rounded-xl
              px-3 py-2
              text-sm

              bg-white
              border border-[rgba(180,200,255,0.35)]
              text-slate-800
              placeholder:text-slate-400

              outline-none
              focus:border-cyan-400
              focus:ring-2 focus:ring-cyan-300/40
            "
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder={inputPlaceholder}
            disabled={inputDisabled}
            className="
              w-full
              rounded-xl
              px-3 py-2
              resize-none
              text-sm

              bg-white
              border border-[rgba(180,200,255,0.35)]
              text-slate-800
              placeholder:text-slate-400

              outline-none
              focus:border-cyan-400
              focus:ring-2 focus:ring-cyan-300/40
            "
          />
        )}

        <div className="flex items-center justify-between">
          <p className="text-[10px] text-slate-500/80 max-w-[75%]">
            {isGuest
              ? guestFreeRemaining !== null && guestFreeRemaining <= 0
                ? "Enter your email to save your place and get 6 free messages every day."
                : "Guests get 6 free sample messages. Create a free account so we can remember you and unlock longer visits."
              : "Signed-in guests can get 6 free messages every day, unlock longer chats, and enjoy VIP discounts at the café."}
          </p>

          <button
            type="submit"
            disabled={
              inputDisabled ||
              (isGuest && isEmailCaptureMode
                ? !emailInput.trim()
                : !input.trim())
            }
            className="
              inline-flex items-center justify-center
              rounded-full
              px-4 py-1.5
              text-xs font-semibold

              bg-linear-to-b
              from-[rgba(220,235,255,0.95)]
              to-[rgba(170,200,240,0.9)]

              text-slate-800
              shadow-[0_6px_14px_rgba(120,160,220,0.35)]

              hover:brightness-105
              active:translate-y-px
              transition

              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            {isEmailSubmitting
              ? "Saving…"
              : isGuest && isEmailCaptureMode
              ? "Save"
              : isSending
              ? "Sending…"
              : "Send"}
          </button>
        </div>

        {isGuest && isEmailCaptureMode && emailBannerError && (
          <p className="mt-1 text-[10px] text-pink-600">{emailBannerError}</p>
        )}
      </form>
    </div>
  );
}
