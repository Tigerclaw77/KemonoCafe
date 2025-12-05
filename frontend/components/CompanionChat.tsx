// frontend/components/CompanionChat.tsx
"use client";

import { useEffect, useRef, useState, KeyboardEvent, FormEvent } from "react";
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

// Small helper to normalize girl IDs
function getCompanionKey(companion: CompanionConfig): string {
  return (
    (companion.id || companion.name || "").toString().trim().toLowerCase() ||
    "default"
  );
}

// 5-minute warning line (pre-expiry CTA)
function buildNominationWarningLine(companion: CompanionConfig): string {
  const key = getCompanionKey(companion);

  switch (key) {
    case "penny":
      return `Um… it looks like our special time is almost up. If you want to keep me all to yourself a little longer, you can renew my nomination and I’ll stay right here with you. ♡`;
    case "sandy":
      return `Heads up—my time at your table’s almost done. If you still want me hanging out with you, you can rent me again and I’ll happily stay on shift just for you.`;
    case "mandy":
      return `Looks like my clock’s running out, sugar. If you’d like another full day with me at your table, you can nominate me again and I’ll be yours a little longer.`;
    case "cybill":
      return `It seems our designated time is nearly over. If you’d prefer I remain assigned to your table, you can renew my nomination and I’ll keep focusing on you.`;
    case "kara":
      return `Tch… looks like my shift with you is almost up. If you want me sticking around as your girl for another day, you’d better snag me again while you can.`;
    case "yuki":
      return `Ah… our time together is almost finished. If you’d like me to stay by your side a little longer, you can renew my nomination and I’ll keep you company.`;
    case "zuri":
      return `Quick warning: my nomination timer’s almost at zero. If you want me parked at your table for another day, you’ll need to tag me as yours again.`;
    case "rumi":
      return `Ehehe… our little tea time is almost over. If you want me to keep doting on you at this table, you can rent me again for another cozy day together.`;
    case "marin":
      return `Hmm… my shift with you is nearly done. If you’d like to keep this going, you can renew my nomination and I’ll stay on as your personal hostess.`;
    case "cora":
      return `Just so you know, my current slot at your table is almost up. If you still want me refilling your glass and chatting, you can grab me again for another day.`;
    case "juni":
      return `O-oh… the timer says our time’s almost up. If you want me to keep bouncing back to your table, you can rent me again and I’ll stick around.`;
    case "tana":
      return `Hmm, looks like I’m supposed to wander off soon. If you don’t want me drifting to another table, you can renew my nomination and I’ll curl up here with you again.`;
    case "naomi":
      return `Heads up, darling—our VIP time is almost spent. If you’d like me to keep circling back just for you, you can nominate me again and I’ll stick to your booth.`;
    default:
      return `Hey… it looks like our special time together is almost up. If you’d like me to stay at your table longer, you can renew my nomination and keep me all to yourself. ♡`;
  }
}

// Final “bring me back” CTA line when the last unlimited message is sent
function buildNominationFinalCta(companion: CompanionConfig): string {
  const key = getCompanionKey(companion);

  switch (key) {
    case "penny":
      return `I should really be clocking out now… but I’d love to come back. If you want me at your table again, you can renew my nomination or treat me from the café menu and I’ll hurry back. ♡`;
    case "sandy":
      return `That’s about the end of my shift for this run. If you’d like me to swing back to your table for another full day, just rent me again or order something special for us.`;
    case "mandy":
      return `Alright, sugar, that’s me just about off the clock. If you want another round with me parked at your table, nominate me again or spoil me a little from the menu.`;
    case "cybill":
      return `Our scheduled session is officially concluded. If you’d like me reassigned to your table for another day, you can renew my nomination or invite me back with something from the café.`;
    case "kara":
      return `Looks like my time’s up—for now. If you want me back in your booth instead of wandering off, claim me again or tempt me back with something from the menu.`;
    case "yuki":
      return `I think… this is where my time with you ends for today. But if you’d like to see me at your table again, you can renew my nomination or invite me back with a small treat.`;
    case "zuri":
      return `Alright, that’s the last of my “unlimited” time with you today. If you want me back on duty at your table, just re-up my nomination or order something and I’ll drift back over.`;
    case "rumi":
      return `That might be the last pot of tea for this visit… If you want me to come flitting back to your table again, you can rent me again or tempt me with a little snack from the café.`;
    case "marin":
      return `It seems our reserved time is complete. If you’d like to keep me as your hostess on another day, you can renew my nomination or beckon me back with a little order.`;
    case "cora":
      return `And that’s the end of my current shift at your table. If you still want me topping off your drink and chatting, you can grab me again or wave me over with something from the menu.`;
    case "juni":
      return `I-I think that’s the last bit of my special time with you… If you’d like me to come bouncing back, you can rent me again or invite me with a tiny treat.`;
    case "tana":
      return `Looks like I’m supposed to scamper off now. If you want this little raccoon back in your seat, you can renew my nomination or lure me back with a tasty order.`;
    case "naomi":
      return `That’s the last lap of our VIP time for today, darling. If you want me looping back to your booth again, just nominate me once more or tempt me with something from the café.`;
    default:
      return `I should really be finishing my shift now… but if you’d like me back at your table, you can renew my nomination or treat me from the café menu and I’ll come keep you company again. ♡`;
  }
}

// Final free-chat CTA line: ask for email + free account
function buildFreeLimitFinalCta(companion: CompanionConfig): string {
  const key = getCompanionKey(companion);

  switch (key) {
    case "penny":
      return `Ah… that was the last of your sample messages for now. If you make a free account with your email, I can remember you, give you fresh free messages every day, and we can keep hanging out. I’ll keep it between us, okay? ♡`;
    case "sandy":
      return `Looks like we’ve used up your sample chats for today. If you’d like to keep talking, you can make a free account with your email—then I can remember you, refresh your 6 free messages every day, and open the door to longer visits and unlimited time.`;
    case "mandy":
      return `Well sugar, that’s the last of your free samples for now. If you toss me your email and make a free account, I can remember you, top you up with 6 fresh messages every day, and even unlock longer, unlimited shifts with me at your table.`;
    case "cybill":
      return `Our complimentary sample time is finished for now. If you’d like continued access, you can create a free account with your email. I’ll remember you, refresh your 6 free messages every day, and we can explore longer and even unlimited sessions together.`;
    case "kara":
      return `Tch… that’s the end of your free messages for this run. If you give the café your email and make a free account, I can actually remember you, get you 6 new messages every day, and you’ll unlock options for longer and unlimited time with me.`;
    case "yuki":
      return `Mm… that was the last of your sample messages for today. If you’d like me to remember you and keep chatting, you can create a free account with your email. I’ll see you again with 6 fresh messages every day… and we can open up longer, unlimited visits too.`;
    case "zuri":
      return `And that’s the end of your trial run for now. If you drop your email into a free account, I can remember you, refresh 6 free messages every day, and you’ll unlock more ways to keep me circling your table—even unlimited ones.`;
    case "rumi":
      return `Ehehe… our little sample tea time just ran out. If you’d like me to keep pouring, you can make a free account with your email. I’ll remember you, serve you 6 fresh messages every day, and we can unlock longer, even unlimited, visits together.`;
    case "marin":
      return `That concludes your complimentary messages for the moment. If you’d like to continue, you can create a free account with your email. I’ll remember you properly, refresh your 6 free messages every day, and we can arrange longer or unlimited reservations.`;
    case "cora":
      return `Alright, that’s the last of your free refills for today. If you share your email in a free account, I can remember you, restock you with 6 free messages every day, and unlock longer and unlimited hangouts at my table.`;
    case "juni":
      return `O-oh… that was your last sample message for now. If you want me to remember you and chat more, you can make a free account with your email. I’ll see you again with 6 new messages every day… and there are options for longer and unlimited time, too.`;
    case "tana":
      return `Mmm, looks like that was the last free nibble of our chat. If you start a free account with your email, the café can remember you, give you 6 fresh messages every day, and unlock longer, even unlimited, cuddle time at my table.`;
    case "naomi":
      return `And there goes the last of your sample laps, darling. If you want more, you can make a free account with your email so I can remember you, reset your 6 free messages every day, and open up the longer and unlimited VIP options with me.`;
    default:
      return `That was the last of your sample messages for now. If you’d like me to remember you, give you 6 fresh free messages every day, and unlock longer or unlimited chat, you can make a free account with your email. I’ll keep it between us. ♡`;
  }
}

// Thank-you line after a successful email capture
function buildEmailThanksLine(companion: CompanionConfig): string {
  const key = getCompanionKey(companion);

  switch (key) {
    case "penny":
      return `Thank you… I’ll remember you now. Next time you come back with your account, I’ll be waiting with fresh messages just for you. ♡`;
    case "sandy":
      return `Got it. I’ll remember you now, so our next chat can pick up right where we left off.`;
    case "mandy":
      return `Mmm, thanks sugar. I’ve got you tucked away in my memory now. Don’t be a stranger, alright?`;
    case "cybill":
      return `Acknowledged. I’ll keep your details on file so our future sessions are smoother and easier to resume.`;
    case "kara":
      return `Hmph… fine, I’ll remember you. Don’t make me regret it, okay?`;
    case "yuki":
      return `Thank you… I’ll remember you from now on. Let’s meet again soon, alright?`;
    case "zuri":
      return `Nice. I’ve got you marked down, so I can find my way back to your table again.`;
    case "rumi":
      return `Yay, I’ll remember you now~ Come see me again when you have a minute, okay?`;
    case "marin":
      return `All set. I’ll remember you, so next time we can skip the introductions and get straight to the good parts.`;
    case "cora":
      return `Perfect. I’ll keep you on my list, so it’ll be easy to settle back into our usual booth together.`;
    case "juni":
      return `O-okay… I’ll remember you now. I’ll be happy if you come back to talk more later.`;
    case "tana":
      return `Hehe, I’ve stashed you away safely. Come back anytime—you won’t be getting rid of me that easily now.`;
    case "naomi":
      return `Mm, thank you, darling. I’ll remember you now, so next time we can dive right back into our little VIP corner.`;
    default:
      return `Thank you. I’ll remember you now so we can keep building on our chats next time. ♡`;
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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
  const [nominationGraceEndsAt, setNominationGraceEndsAt] = useState<
    string | null
  >(null);
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

  // Nomination UX state: one pre-expiry warning
  const [hasShownNominationWarning, setHasShownNominationWarning] =
    useState(false);

  // Guest email capture banner (save our chat)
  const [showEmailBanner, setShowEmailBanner] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [emailBannerError, setEmailBannerError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const isGuest = !userId;

  // 1) Guest teaser: load free remaining from localStorage
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

  // 2) Logged-in: load status from backend
  useEffect(() => {
    if (!userId) {
      setRemainingMessages(null);
      setHasNominationActive(false);
      setNominationExpiresAt(null);
      setNominationGraceEndsAt(null);
      setHasDailyFreeAvailable(false);
      setDailyFreeRemaining(null);
      setShowLimitWarning(false);
      setHasShownBossLine(false);
      setHasShownNominationWarning(false);
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

        const hasNom = !!data.hasNomination;
        setHasNominationActive(hasNom);
        setNominationExpiresAt(data.nominationExpiresAt ?? null);
        setNominationGraceEndsAt(data.nominationGraceEndsAt ?? null);
        setHasDailyFreeAvailable(!!data.hasDailyFreeAvailable);
        setDailyFreeRemaining(
          typeof data.dailyFreeRemaining === "number"
            ? data.dailyFreeRemaining
            : null
        );

        if (!hasNom) {
          setHasShownNominationWarning(false);
        }
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

  // Derived: treat grace as "still unlimited" for UI/behavior
  const nominationOrGraceActive = (() => {
    if (!nominationExpiresAt && !nominationGraceEndsAt) {
      return hasNominationActive;
    }

    const now = Date.now();
    let expiresMs: number | null = null;
    let graceEndMs: number | null = null;

    if (nominationExpiresAt) {
      const t = new Date(nominationExpiresAt).getTime();
      if (!Number.isNaN(t)) expiresMs = t;
    }
    if (nominationGraceEndsAt) {
      const g = new Date(nominationGraceEndsAt).getTime();
      if (!Number.isNaN(g)) graceEndMs = g;
    }

    if (expiresMs == null && graceEndMs == null) {
      return hasNominationActive;
    }

    const effectiveGraceEnd =
      graceEndMs ?? (expiresMs !== null ? expiresMs : now - 1);

    if (expiresMs !== null && now <= expiresMs) return true;
    if (expiresMs !== null && now > expiresMs && now <= effectiveGraceEnd) {
      return true;
    }

    return false;
  })();

  // 2b) Nomination warning (5 minutes before expiry) – CTA only
  useEffect(() => {
    if (!nominationExpiresAt) return;
    if (!hasNominationActive) return;
    if (hasShownNominationWarning) return;
    if (typeof window === "undefined") return;

    const expiresMs = new Date(nominationExpiresAt).getTime();
    if (Number.isNaN(expiresMs)) return;

    const warningAt = expiresMs - 5 * 60_000; // 5 minutes before expiry
    const delay = warningAt - Date.now();

    const showWarning = () => {
      setMessages((prev) => [
        ...prev,
        {
          id: `nomination-warning-${Date.now()}`,
          role: "assistant",
          content: buildNominationWarningLine(companion),
        },
      ]);
      setHasShownNominationWarning(true);
    };

    if (delay <= 0) {
      showWarning();
      return;
    }

    const timer = window.setTimeout(showWarning, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    nominationExpiresAt,
    hasNominationActive,
    hasShownNominationWarning,
    companion,
  ]);

  // If we’ve already captured an email on this device, don’t show the banner again
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isGuest) return;

    const seen = window.localStorage.getItem("kemonoCafe_email_saved_v1");
    if (seen === "1") {
      setShowEmailBanner(false);
    }
  }, [isGuest]);

  // Boss line helper (for logged-in, not nomination/grace)
  const appendBossLineIfNeeded = () => {
    if (nominationOrGraceActive) return;
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

  // Email capture handler
  const handleEmailCaptureClick = async () => {
    if (!emailInput.trim()) {
      setEmailBannerError("Please enter an email so I can remember you. ♡");
      return;
    }
    const trimmed = emailInput.trim();
    if (!isValidEmail(trimmed)) {
      setEmailBannerError("That doesn’t look like a valid email address.");
      return;
    }

    setIsEmailSubmitting(true);
    setEmailBannerError(null);

    try {
      const res = await fetch("/api/email-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          companionId: companion.id,
          source: "guest-banner",
        }),
      });

      if (!res.ok) {
        console.error("Email capture failed:", await res.text());
        setEmailBannerError(
          "Something went wrong saving your email. Please try again in a moment."
        );
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("kemonoCafe_email_saved_v1", "1");
      }

      setShowEmailBanner(false);
      setEmailInput("");

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-email-thanks-${Date.now()}`,
          role: "assistant",
          content: buildEmailThanksLine(companion),
        },
      ]);
    } catch (err) {
      console.error("Email capture error:", err);
      setEmailBannerError(
        "I couldn’t save that just now. Can we try again in a bit?"
      );
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  // 3) Send message – guest vs logged-in
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

        // Add her reply, and if this was the last free message,
        // immediately add a second, personality-specific CTA line.
        setMessages((prev) => {
          const next: Message[] = [...prev, assistantMessage];

          if (newGuestFree <= 0) {
            next.push({
              id: `assistant-free-limit-${Date.now()}`,
              role: "assistant",
              content: buildFreeLimitFinalCta(companion),
            });
          }

          return next;
        });

        // Mid-conversation invite: when they’re halfway through samples, show the banner once
        if (newGuestFree === 3) {
          setShowEmailBanner(true);
        }

        if (newGuestFree <= 0) {
          setErrorText(
            "That was your last free sample message. Create a free account so we can remember you, give you 6 free messages every day, and unlock options for longer and unlimited time with your favorite girl."
          );
          setShowEmailBanner(true);
        }

        return;
      }

      // ── Logged-in mode ─────────────────────
      if (!userId) {
        setErrorText("You need to sign in to chat with her. ♡");
        setIsSending(false);
        return;
      }

      // Combine banked + daily free to decide if we’re out (when no nomination/grace)
      const banked = remainingMessages ?? 0;
      const free =
        hasDailyFreeAvailable && dailyFreeRemaining !== null
          ? dailyFreeRemaining
          : 0;
      const effectiveRemaining = banked + free;

      if (!nominationOrGraceActive && effectiveRemaining <= 0) {
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

      const nominationJustEnded =
        typeof data.nominationJustEnded === "boolean"
          ? data.nominationJustEnded
          : false;

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

      const newMessages: Message[] = [assistantMessage];

      if (nominationJustEnded) {
        newMessages.push({
          id: `assistant-nomination-ended-${Date.now()}`,
          role: "assistant",
          content: buildNominationFinalCta(companion),
        });
      }

      setMessages((prev) => [...prev, ...newMessages]);

      setRemainingMessages(newRemaining);
      setHasNominationActive(newHasNomination);
      setNominationExpiresAt(data.nominationExpiresAt ?? nominationExpiresAt);
      setNominationGraceEndsAt(
        data.nominationGraceEndsAt ?? nominationGraceEndsAt
      );
      setHasDailyFreeAvailable(newHasDailyFree);
      setDailyFreeRemaining(newDailyFreeRemaining);

      const updatedBanked = newRemaining;
      const updatedFree =
        newHasDailyFree && newDailyFreeRemaining !== null
          ? newDailyFreeRemaining
          : 0;
      const updatedEffective = updatedBanked + updatedFree;

      const stillNominationOrGrace =
        newHasNomination ||
        (nominationGraceEndsAt
          ? Date.now() < new Date(nominationGraceEndsAt).getTime()
          : false);

      if (!stillNominationOrGrace && updatedEffective <= 0) {
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

    if (nominationOrGraceActive) {
      alert(
        `${companion.name} is already your nomination. You can chat freely for now. ♡`
      );
      return;
    }

    router.push("/menu");
  };

  const nominationLabel = (() => {
    if (!nominationOrGraceActive) return null;
    return "Unlimited chat active";
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

    if (nominationOrGraceActive) {
      return nominationLabel ?? "Unlimited chat active";
    }

    const banked = remainingMessages ?? 0;
    const free =
      hasDailyFreeAvailable && dailyFreeRemaining !== null
        ? dailyFreeRemaining
        : 0;
    const effective = banked + free;

    if (effective > 0) {
      return `${effective} message${effective === 1 ? "" : "s"} left today`;
    }

    return "No messages left";
  })();

  const inputPlaceholder = (() => {
    if (isGuest) {
      if (guestFreeRemaining !== null && guestFreeRemaining <= 0) {
        return `Create a free account to keep chatting with her every day.`;
      }
      return `Talk to ${companion.name}… (you have free sample messages)`;
    }

    if (!userId) {
      return `Sign in to talk to ${companion.name}…`;
    }

    if (nominationOrGraceActive) {
      return `Talk to ${companion.name} as long as you like...`;
    }

    const banked = remainingMessages ?? 0;
    const free =
      hasDailyFreeAvailable && dailyFreeRemaining !== null
        ? dailyFreeRemaining
        : 0;
    const effective = banked + free;

    if (effective <= 0) {
      return `You’re out of messages. Nominate her or order from the café menu to keep chatting.`;
    }

    return `Talk to ${companion.name}...`;
  })();

  const loggedInEffectiveRemaining =
    (remainingMessages ?? 0) +
    (hasDailyFreeAvailable && dailyFreeRemaining !== null
      ? dailyFreeRemaining
      : 0);

  const inputDisabled = isGuest
    ? isSending || guestFreeRemaining === null || guestFreeRemaining <= 0
    : isSending ||
      !userId ||
      (!nominationOrGraceActive && loggedInEffectiveRemaining <= 0);

  // Auto-focus the chat box whenever it becomes available for typing
  useEffect(() => {
    if (!inputDisabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [inputDisabled]);

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
            {nominationOrGraceActive
              ? "Nominated (premium mode active)"
              : `Nominate ${companion.name} (unlimited until closing)`}
          </button>
          {!isGuest &&
            !nominationOrGraceActive &&
            showLimitWarning &&
            loggedInEffectiveRemaining <= 0 && (
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

      {/* Guest email capture banner (save our chat) */}
      {isGuest && showEmailBanner && (
        <div className="border-t border-sky-100 px-4 py-2 bg-sky-50/80 text-[11px] text-slate-700 flex flex-col md:flex-row gap-2 md:items-center justify-between">
          <p className="flex-1">
            <span className="font-semibold text-slate-800">
              {companion.name}
            </span>{" "}
            <span className="text-slate-700">
              says: “If you share your email, the café can remember you, give
              you 6 free messages every day, and unlock longer and unlimited
              visits with me. I won’t share it with anyone else.”
            </span>
          </p>
          <div className="flex gap-2 items-center mt-1 md:mt-0">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                if (emailBannerError) setEmailBannerError(null);
              }}
              placeholder="you@example.com"
              className="h-7 rounded-full border border-slate-300 bg-white px-2 text-[11px] text-slate-800 outline-none focus:ring-1 focus:ring-sky-300 focus:border-sky-300"
            />
            <button
              type="button"
              onClick={handleEmailCaptureClick}
              disabled={isEmailSubmitting || !emailInput.trim()}
              className="h-7 px-3 rounded-full bg-pink-500 text-[11px] text-white font-semibold shadow-sm disabled:opacity-50 hover:bg-pink-600 transition-colors"
            >
              {isEmailSubmitting ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowEmailBanner(false);
                setEmailBannerError(null);
              }}
              className="h-7 px-2 rounded-full text-[11px] text-slate-500 hover:text-slate-700"
            >
              Not now
            </button>
          </div>
          {emailBannerError && (
            <p className="mt-1 text-[10px] text-pink-600">
              {emailBannerError}
            </p>
          )}
        </div>
      )}

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
            {isGuest
              ? guestFreeRemaining !== null && guestFreeRemaining <= 0
                ? "When you create a free account, we remember you and your favorite hostess, give you 6 free messages every day, and open up the full café menu: extra message packs, limited-time unlimited chat through nominations, and a VIP tier with discounts on every visit."
                : "Guests get 6 free sample messages. Create a free account so we can remember you, give you 6 free messages every day, and unlock longer and unlimited chat options with VIP discounts."
              : "Signed-in guests can get 6 free messages every day, unlock longer and unlimited chats, and enjoy VIP discounts at the café."}
          </p>
          <button
            type="submit"
            disabled={inputDisabled || !input.trim()}
            className="inline-flex items-center justify-center rounded-full bg-pink-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-600 transition-colors"
          >
            {isSending ? "Sending…" : "Send"}
          </button>
        </div>
        {!isGuest && errorText && (
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
