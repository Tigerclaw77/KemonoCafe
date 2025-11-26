// frontend/components/CompanionChat.tsx

"use client";

import {
  useEffect,
  useRef,
  useState,
  KeyboardEvent,
  FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import type { CompanionConfig } from "../config/companions";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface CompanionChatProps {
  companion: CompanionConfig;
  userId?: string;
}

const GUEST_FREE_KEY = "kemonoCafe_guest_free_remaining_v1";
const GUEST_FREE_TOTAL = 6;

export default function CompanionChat({
  companion,
  userId,
}: CompanionChatProps) {
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      content: `Welcome to Kemono Cafe! I’m ${companion.name}, your hostess today. Please, have a seat—what would you like to talk about? ♡`,
    },
  ]);

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Logged-in economy state
  const [remainingMessages, setRemainingMessages] = useState<number | null>(
    null
  );
  const [hasNominationActive, setHasNominationActive] = useState(false);
  const [nominationExpiresAt, setNominationExpiresAt] = useState<string | null>(
    null
  );
  const [hasDailyFreeAvailable, setHasDailyFreeAvailable] = useState(false);
  const [dailyFreeRemaining, setDailyFreeRemaining] = useState<number | null>(
    null
  );

  // Guest teaser state (no account)
  const [guestFreeRemaining, setGuestFreeRemaining] = useState<number | null>(
    null
  );

  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [hasShownBossLine, setHasShownBossLine] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const isGuest = !userId;

  // ─────────────────────────────────────────
  // 1) Guest teaser: load free remaining from localStorage
  // ─────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!isGuest) {
      // Logged-in user, guest teaser not relevant
      setGuestFreeRemaining(null);
      return;
    }

    const stored = window.localStorage.getItem(GUEST_FREE_KEY);
    if (stored === null) {
      window.localStorage.setItem(GUEST_FREE_KEY, String(GUEST_FREE_TOTAL));
      setGuestFreeRemaining(GUEST_FREE_TOTAL);
    } else {
      const value = Number(stored);
      setGuestFreeRemaining(Number.isFinite(value) ? value : 0);
    }
  }, [isGuest]);

  const updateGuestFreeRemaining = (value: number) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(GUEST_FREE_KEY, String(value));
    }
    setGuestFreeRemaining(value);
  };

  // ─────────────────────────────────────────
  // 2) Logged-in: load status from backend
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!userId) {
      setRemainingMessages(null);
      setHasNominationActive(false);
      setNominationExpiresAt(null);
      setHasDailyFreeAvailable(false);
      setDailyFreeRemaining(null);
      return;
    }

    let aborted = false;

    async function fetchStatus() {
      try {
        const res = await fetch("/api/user/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        if (!res.ok) {
          console.error("Failed to load user status");
          return;
        }

        const data = await res.json();
        if (aborted) return;

        setRemainingMessages(
          typeof data.remainingMessages === "number"
            ? data.remainingMessages
            : 0
        );
        setHasNominationActive(!!data.hasNomination);
        setNominationExpiresAt(data.nominationExpiresAt ?? null);
        setHasDailyFreeAvailable(!!data.hasDailyFreeAvailable);
        setDailyFreeRemaining(
          typeof data.dailyFreeRemaining === "number"
            ? data.dailyFreeRemaining
            : null
        );
      } catch (err) {
        if (!aborted) {
          console.error("Status fetch error:", err);
        }
      }
    }

    fetchStatus();

    return () => {
      aborted = true;
    };
  }, [userId]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages.length]);

  // Boss line helper (for logged-in, not nomination)
  const appendBossLineIfNeeded = () => {
    if (hasNominationActive) return;
    if (hasShownBossLine) return;

    const variants = [
      `Oh— the manager is walking by… I should look busy. If you want me to stay at your table, you might have to nominate me or order something from the café. ♡`,
      `Eep, I think the boss is watching… I should pretend I’m serving other guests. Nominate me or grab something from the menu and I can keep you company longer, okay?`,
      `Ah, my shift lead is glaring at me. I have to move on to the next table unless you make me your nomination or treat me to something from the café. ♡`,
    ];
    const line =
      variants[Math.floor(Math.random() * variants.length)] ?? variants[0];

    const bossMessage: Message = {
      id: `boss-${Date.now()}`,
      role: "assistant",
      content: line,
    };

    setMessages((prev) => [...prev, bossMessage]);
    setHasShownBossLine(true);
    setShowLimitWarning(true);
  };

  // ─────────────────────────────────────────
  // 3) Send message – guest vs logged-in
  // ─────────────────────────────────────────
  const sendMessage = async () => {
    setErrorText(null);

    if (!input.trim() || isSending) return;

    const content = input.trim();

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      // ── Guest mode ────────────────────────
      if (isGuest) {
        const currentGuestFree = guestFreeRemaining ?? 0;

        if (currentGuestFree <= 0) {
          setErrorText(
            "Your 6 free sample messages are used up. Create a free account to get 6 messages every day and unlock the full café menu. ♡"
          );
          setIsSending(false);
          return;
        }

        const res = await fetch(`/api/chat-guest/${companion.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              ...messages.map((m) => ({ role: m.role, content: m.content })),
              { role: "user", content: userMessage.content },
            ],
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("Guest chat API error:", data);
          const fallback: Message = {
            id: `assistant-error-${Date.now()}`,
            role: "assistant",
            content:
              "Ah—sorry! The line got a little noisy. Could you try again in a moment, okay? ♡",
          };
          setMessages((prev) => [...prev, fallback]);
          setIsSending(false);
          return;
        }

        const replyText: string =
          data.reply ??
          "Mmm… I had a little trouble hearing that, could you try again?";

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: replyText,
        };

        const newGuestFree = Math.max(currentGuestFree - 1, 0);
        updateGuestFreeRemaining(newGuestFree);

        setMessages((prev) => [...prev, assistantMessage]);

        if (newGuestFree <= 0) {
          setErrorText(
            "That was your last free sample message. Create a free account to keep chatting and get 6 messages every day. ♡"
          );
        }

        return;
      }

      // ── Logged-in mode ─────────────────────
      if (!userId) {
        setErrorText("You need to sign in to chat with her. ♡");
        setIsSending(false);
        return;
      }

      // Soft guard: if we *know* there is no nomination, no bank, and no daily free
      if (
        !hasNominationActive &&
        remainingMessages !== null &&
        remainingMessages <= 0 &&
        !hasDailyFreeAvailable
      ) {
        setShowLimitWarning(true);
        appendBossLineIfNeeded();
        setIsSending(false);
        return;
      }

      const res = await fetch(`/api/chat/${companion.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessage.content },
          ],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Chat API error:", data);

        if (data?.error === "NO_MESSAGES_LEFT") {
          setShowLimitWarning(true);
          setRemainingMessages(0);
          setHasDailyFreeAvailable(false);
          setDailyFreeRemaining(0);
          appendBossLineIfNeeded();
          setIsSending(false);
          return;
        }

        if (data?.error === "UNAUTHENTICATED") {
          setErrorText("Please sign in to continue chatting. ♡");
          setIsSending(false);
          return;
        }

        const fallback: Message = {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content:
            "Ah—sorry! The line got a little noisy. Could you try again in a moment, okay? ♡",
        };
        setMessages((prev) => [...prev, fallback]);
        setIsSending(false);
        return;
      }

      const replyText: string =
        data.reply ??
        "Mmm… I had a little trouble hearing that, could you try again?";

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: replyText,
      };

      const newRemaining =
        typeof data.remainingMessages === "number"
          ? data.remainingMessages
          : remainingMessages ?? 0;
      const newHasNomination =
        typeof data.hasNomination === "boolean"
          ? data.hasNomination
          : hasNominationActive;
      const newHasDailyFree =
        typeof data.hasDailyFreeAvailable === "boolean"
          ? data.hasDailyFreeAvailable
          : hasDailyFreeAvailable;
      const newDailyFreeRemaining =
        typeof data.dailyFreeRemaining === "number"
          ? data.dailyFreeRemaining
          : dailyFreeRemaining;

      setMessages((prev) => [...prev, assistantMessage]);
      setRemainingMessages(newRemaining);
      setHasNominationActive(newHasNomination);
      setNominationExpiresAt(data.nominationExpiresAt ?? nominationExpiresAt);
      setHasDailyFreeAvailable(newHasDailyFree);
      setDailyFreeRemaining(newDailyFreeRemaining);

      if (!newHasNomination && newRemaining <= 0 && !newHasDailyFree) {
        appendBossLineIfNeeded();
      }
    } catch (err) {
      console.error(err);
      const fallback: Message = {
        id: `assistant-error-${Date.now()}`,
        role: "assistant",
        content:
          "Ah—sorry! The line got a little noisy. Could you try again in a moment, okay? ♡",
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setIsSending(false);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await sendMessage();
  };

  const handleKeyDown = async (
    e: KeyboardEvent<HTMLTextAreaElement>
  ): Promise<void> => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await sendMessage();
    }
  };

  const handleNominate = () => {
    if (!userId) {
      alert(
        "Create a free account first so we can remember your nomination and message balance. ♡"
      );
      return;
    }

    if (hasNominationActive) {
      alert(
        `${companion.name} is already your nomination. You can chat freely until the café closes at 3:00 AM. ♡`
      );
      return;
    }

    router.push("/menu");
  };

  const nominationLabel = (() => {
    if (!hasNominationActive) return null;
    if (!nominationExpiresAt) return "Unlimited chat active";

    const dt = new Date(nominationExpiresAt);
    if (Number.isNaN(dt.getTime())) return "Unlimited chat active";

    const hours = dt.getHours().toString().padStart(2, "0");
    const mins = dt.getMinutes().toString().padStart(2, "0");
    return `Unlimited chat until ${hours}:${mins}`;
  })();

  const headerStatusText = (() => {
    if (isGuest) {
      if (guestFreeRemaining === null) return "Loading...";
      if (guestFreeRemaining > 0) {
        return `${guestFreeRemaining} free sample message${
          guestFreeRemaining === 1 ? "" : "s"
        } left`;
      }
      return "Create a free account to keep chatting";
    }

    if (!userId) return "Sign in to start chatting";

    if (hasNominationActive) {
      return nominationLabel ?? "Unlimited chat active";
    }

    if (remainingMessages !== null && remainingMessages > 0) {
      return `${remainingMessages} message${
        remainingMessages === 1 ? "" : "s"
      } left`;
    }

    if (hasDailyFreeAvailable) {
      if (dailyFreeRemaining !== null) {
        return `${dailyFreeRemaining} free message${
          dailyFreeRemaining === 1 ? "" : "s"
        } available today`;
      }
      return "Free messages available today";
    }

    return "No messages left";
  })();

  const inputPlaceholder = (() => {
    if (isGuest) {
      if (guestFreeRemaining !== null && guestFreeRemaining <= 0) {
        return `You’ve used your 6 free sample messages. Create a free account to keep chatting and get 6 messages every day.`;
      }
      return `Talk to ${companion.name}… (you have free sample messages)`;
    }

    if (!userId) {
      return `Sign in to talk to ${companion.name}…`;
    }

    if (hasNominationActive) {
      return `Talk to ${companion.name} as long as you like...`;
    }

    if (
      remainingMessages !== null &&
      remainingMessages <= 0 &&
      !hasDailyFreeAvailable
    ) {
      return `You’re out of messages. Nominate her or order from the café menu to keep chatting.`;
    }

    return `Talk to ${companion.name}...`;
  })();

  const inputDisabled = isGuest
    ? isSending ||
      guestFreeRemaining === null ||
      guestFreeRemaining <= 0
    : isSending ||
      !userId ||
      (!hasNominationActive &&
        remainingMessages !== null &&
        remainingMessages <= 0 &&
        !hasDailyFreeAvailable);

  return (
    <div className="w-full rounded-2xl border border-sky-100 bg-white/95 backdrop-blur-sm shadow-sm flex flex-col h-[440px] md:h-[470px]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-sky-100 flex items-center justify-between gap-3 bg-sky-50/70">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Chat with {companion.name}
          </h2>
          <p className="text-[11px] text-slate-500">
            Cozy, light-hearted conversation. G–PG, flirty but sweet.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="inline-flex items-center gap-1 rounded-full bg_WHITE px-3 py-1 border border-sky-100 text-[11px] text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {headerStatusText}
          </span>
          <button
            type="button"
            onClick={handleNominate}
            className="text-[10px] underline underline-offset-2 text-sky-700 disabled:text-slate-400"
          >
            {hasNominationActive
              ? "Nominated (premium mode active)"
              : `Nominate ${companion.name} (unlimited until 3 AM)`}
          </button>
          {!isGuest &&
            !hasNominationActive &&
            showLimitWarning &&
            (remainingMessages ?? 0) <= 0 &&
            !hasDailyFreeAvailable && (
              <p className="text-[10px] text-pink-600 text-right">
                You&apos;re out of messages. Nominate her or order from the café
                menu to keep chatting. ♡
              </p>
            )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm bg-slate-50/70"
      >
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} content={m.content} />
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-sky-100 px-4 py-3 flex flex-col gap-2 bg-white"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          className="w-full text-sm rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-300 resize-none text-slate-800 placeholder:text-slate-400"
          placeholder={inputPlaceholder}
          disabled={inputDisabled}
        />
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-slate-400">
            Guests get 6 free sample messages. Create a free account to get 6
            messages every day, save your balance, and nominate your favorite
            girl.
          </p>
          <button
            type="submit"
            disabled={inputDisabled || !input.trim()}
            className="inline-flex items-center justify-center rounded-full bg-pink-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-600 transition-colors"
          >
            {isSending ? "Sending…" : "Send"}
          </button>
        </div>
        {errorText && (
          <p className="mt-1 text-[10px] text-pink-600">{errorText}</p>
        )}
      </form>
    </div>
  );
}

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
}

function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%] rounded-2xl rounded-br-sm bg-pink-500 text-white px-3 py-2 text-xs shadow-sm">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[70%] rounded-2xl rounded-bl-sm bg-white text-slate-800 px-3 py-2 text-xs shadow-sm border border-sky-100">
        {content}
      </div>
    </div>
  );
}
