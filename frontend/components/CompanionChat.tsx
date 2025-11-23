// frontend/components/CompanionChat.tsx

"use client";

import { useEffect, useRef, useState, KeyboardEvent, FormEvent } from "react";
import type { CompanionConfig } from "../config/companions";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface CompanionChatProps {
  companion: CompanionConfig;
}

export default function CompanionChat({ companion }: CompanionChatProps) {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      content: `Welcome to Kemono Cafe! I’m ${companion.name}, your hostess today. Please, have a seat—what would you like to talk about? ♡`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messagesLeft, setMessagesLeft] = useState<number>(0);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [hasShownBossLine, setHasShownBossLine] = useState(false);

  // nomination = premium mode (unlimited until 3AM local)
  const [hasNominationActive, setHasNominationActive] = useState(false);

  const storageKey = `kemonoCafe_messages_${companion.id}`;
  const nominationKey = `kemonoCafe_nomination_${companion.id}`; // stores ISO expiry

  // refs for UX
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Message balance
    const stored = window.localStorage.getItem(storageKey);
    if (stored === null) {
      window.localStorage.setItem(storageKey, "5");
      setMessagesLeft(5);
    } else {
      setMessagesLeft(Number(stored) || 0);
    }

    // Nomination: check if we have an unexpired nomination
    const storedNom = window.localStorage.getItem(nominationKey);
    if (storedNom) {
      const expiresAt = new Date(storedNom);
      if (!Number.isNaN(expiresAt.getTime()) && Date.now() < expiresAt.getTime()) {
        setHasNominationActive(true);
      } else {
        // expired – clear it
        window.localStorage.removeItem(nominationKey);
        setHasNominationActive(false);
      }
    }
  }, [storageKey, nominationKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = () => {
      const stored = window.localStorage.getItem(storageKey);
      setMessagesLeft(Number(stored || "0"));
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [storageKey]);

  const persistMessagesLeft = (value: number) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, String(value));
    }
    setMessagesLeft(value);
  };

  // Boss line: only when *not* nominated and they actually hit 0
  const appendBossLineIfNeeded = (nextBalance: number) => {
    if (hasNominationActive) return;
    if (nextBalance > 0 || hasShownBossLine) return;

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

  // Keep the chat scrolled to the bottom, but only inside the chat box,
  // not the whole page.
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages.length]);

  const sendMessage = async () => {
    if (!input.trim() || isSending) return;

    // Only enforce limits if not nominated
    if (!hasNominationActive && messagesLeft <= 0) {
      setShowLimitWarning(true);
      appendBossLineIfNeeded(messagesLeft);
      return;
    }

    const content = input.trim();

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    const prevBalance = messagesLeft;
    let nextBalance = messagesLeft;

    // If not in premium mode, consume a message
    if (!hasNominationActive) {
      nextBalance = messagesLeft - 1;
      persistMessagesLeft(nextBalance);
    }

    try {
      const res = await fetch(`/api/chat/${companion.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessage.content },
          ],
          companionId: companion.id,
        }),
      });

      if (!res.ok) throw new Error("Chat API error");

      const data = await res.json();
      const replyText: string =
        data.reply ??
        "Mmm… I had a little trouble hearing that, could you try again?";

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: replyText,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If this reply brought us to 0 and we're not nominated, add the boss line as a free extra
      if (!hasNominationActive) {
        appendBossLineIfNeeded(nextBalance);
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
      // refund on error if we consumed a message
      if (!hasNominationActive) {
        persistMessagesLeft(prevBalance);
      }
    } finally {
      setIsSending(false);
      // keep the input focused after send
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
    if (typeof window === "undefined") return;

    if (hasNominationActive) {
      alert(
        `${companion.name} is already your nomination. You can chat freely until the café closes at 3:00 AM. ♡`
      );
      return;
    }

    // Compute next 3AM local
    const now = new Date();
    const expires = new Date(now);
    expires.setHours(3, 0, 0, 0);
    if (now >= expires) {
      // if it's past 3AM already, use next day
      expires.setDate(expires.getDate() + 1);
    }

    window.localStorage.setItem(nominationKey, expires.toISOString());
    setHasNominationActive(true);
    setShowLimitWarning(false);

    const nominationMessage: Message = {
      id: `nomination-${Date.now()}`,
      role: "assistant",
      content: `Ehehe… you made *me* your nomination for tonight? That means we can talk as much as we want until the café closes at 3:00 AM. I’ll stay right here with you. ♡`,
    };
    setMessages((prev) => [...prev, nominationMessage]);
  };

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
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 border border-sky-100 text-[11px] text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {hasNominationActive
              ? "Unlimited chat until 3:00 AM"
              : `${messagesLeft} message${
                  messagesLeft === 1 ? "" : "s"
                } left`}
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
          {!hasNominationActive && showLimitWarning && messagesLeft <= 0 && (
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
          placeholder={
            hasNominationActive
              ? `Talk to ${companion.name} as long as you like...`
              : messagesLeft > 0
              ? `Talk to ${companion.name}...`
              : `You’re out of messages. Nominate her or order from the café menu to keep chatting.`
          }
          disabled={isSending || (!hasNominationActive && messagesLeft <= 0)}
        />
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-slate-400">
            Without nomination, each message uses 1 point. Nominations and café
            items keep the conversation going.
          </p>
          <button
            type="submit"
            disabled={
              isSending || !input.trim() || (!hasNominationActive && messagesLeft <= 0)
            }
            className="inline-flex items-center justify-center rounded-full bg-pink-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-600 transition-colors"
          >
            {isSending ? "Sending…" : "Send"}
          </button>
        </div>
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
