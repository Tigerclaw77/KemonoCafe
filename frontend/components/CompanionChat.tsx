// frontend/components/CompanionChat.tsx
"use client";

import { useEffect, useRef, useState, KeyboardEvent, FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import type { CompanionConfig } from "../config/companions";
import TypingIndicator from "./TypingIndicator";
import CafeMenuButton from "./CafeMenuButton";
import { useSearchParams, useRouter } from "next/navigation";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface CompanionChatProps {
  companion: CompanionConfig;
  userId?: string;
}

// v2: store a daily-reset payload so guests don't get stuck at 0 forever
const GUEST_FREE_KEY = "kemonoCafe_guest_free_v2";
const GUEST_FREE_TOTAL = 6;

type GuestFreePayload = {
  date: string; // YYYY-MM-DD (local)
  remaining: number;
};

type ChatApiSuccess = {
  reply: string;
  remainingMessages: number;
  hasNomination: boolean;
  nominationExpiresAt: string | null;

  // IMPORTANT: some routes return this (your code uses it)
  nominationGraceEndsAt?: string | null;

  nominationJustEnded: boolean;
  hasDailyFreeAvailable: boolean;
  dailyFreeRemaining: number;
};

type ChatApiError = {
  error: string;
};

type ChatApiResponse = ChatApiSuccess | ChatApiError;

type GuestChatSuccess = {
  reply: string;
};

type GuestChatError = {
  error: string;
};

type GuestChatResponse = GuestChatSuccess | GuestChatError;

type UserStatusSuccess = {
  remainingMessages: number;
  hasNomination: boolean;
  nominationExpiresAt: string | null;
  nominationGraceEndsAt: string | null;
  hasDailyFreeAvailable: boolean;
  dailyFreeRemaining: number | null;
};

type UserStatusError = {
  error: string;
};

type UserStatusResponse = UserStatusSuccess | UserStatusError;

// Browser Supabase client (anon key only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Small helper to normalize girl IDs
function getCompanionKey(companion: CompanionConfig): string {
  return (
    (companion.id || companion.name || "").toString().trim().toLowerCase() ||
    "default"
  );
}

function getChatStorageKey(companionId: string, userId: string | null): string {
  return userId
    ? `kc_chat_${userId}_${companionId}`
    : `kc_chat_guest_${companionId}`;
}

function normalizeDailyFree(
  _hasDailyFreeAvailable: boolean,
  value: unknown
): number {
  return typeof value === "number" ? value : 0;
}

function getLocalTodayStr(): string {
  // Local date, not UTC — matches user expectation of “today”
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasStringProp(value: unknown, key: string): boolean {
  return (
    isObject(value) &&
    key in value &&
    typeof (value as Record<string, unknown>)[key] === "string"
  );
}

function isApiError(value: unknown): value is { error: string } {
  return hasStringProp(value, "error");
}

// 5-minute warning line (pre-expiry CTA)
function buildNominationWarningLine(companion: CompanionConfig): string {
  const key = getCompanionKey(companion);

  switch (key) {
    case "penny":
      return `Um… I think our special time’s almost up. If you want me to stay right here with you a little longer, you can renew my nomination and I’ll keep this table all warm and happy. ♡`;
    case "sandy":
      return `Hey… just a heads-up—my time here with you is almost done. If you’d like to keep chatting a bit longer, you can renew my nomination and I’ll happily stay with you.`;
    case "mandy":
      return `Looks like my shift with you is nearly over. If you want to keep me at your table for another day, you can nominate me again and I’ll stay right where I belong.`;
    case "cybill":
      return `It looks like our time together is nearly finished. If you’d like me to stay focused on you a little longer, you can renew my nomination and we can continue.`;
    case "kara":
      return `Hah… looks like my time with you’s almost up. If you want me sticking around your table a little longer, you’d better snag me again while you can.`;
    case "yuki":
      return `Ah… it looks like our time together is almost over. If you’d like me to stay with you a little longer, you can renew my nomination and I’ll keep you company…`;
    case "zuri":
      return `Hey—quick warning. My time here’s almost out. If you want me hanging around your table a bit longer, you’ll have to claim me again. Just saying~`;
    case "akane":
      return `Ehehe… it looks like our little tea time is almost finished. If you want me to stay here with you a bit longer, you can renew my nomination and we can keep things cozy.`;
    case "maris":
      return `Hmm… my time with you is almost up. If you’re not done pulling this thread yet, you can renew my nomination and we can keep exploring together.`;
    case "cora":
      return `Just so you know, my time at your table is almost up. If you still want me chatting and keeping you company, you can nominate me again for another day.`;
    case "juni":
      return `O-oh… it looks like our time’s almost up. If you want me to keep coming back to your table, you can renew my nomination and I’ll stay with you!`;
    case "nika":
      return `Mm… I think I’m supposed to wander off soon. If you’d like me to stay curled up here with you a little longer, you can renew my nomination.`;
    case "naomi":
      return `Just a quiet heads-up… our time together tonight is almost over. If you want me lingering at your table a little longer, you can nominate me again.`;
    case "elise":
      return `It seems our time together is nearly finished. If you’d like to continue, you can renew my nomination—and I’ll remain with you.`;
    case "noa":
      return `Oh… it looks like our time’s almost up. If you want me to keep sitting with you a little longer, you can renew my nomination. I’d really like that.`;
    default:
      return `Hey… it looks like our time together is almost up. If you’d like me to stay at your table a little longer, you can renew my nomination and keep me with you. ♡`;
  }
}

// Final “bring me back” CTA line when the last unlimited message is sent
function buildNominationFinalCta(companion: CompanionConfig): string {
  const key = getCompanionKey(companion);

  switch (key) {
    case "penny":
      return `I should probably be clocking out now… but I’d really love to come back. If you want me at your table again, you can renew my nomination or order something from the café and I’ll hurry right back. ♡`;
    case "sandy":
      return `Looks like that’s the end of my shift for now. If you’d like me to come back and sit with you again, you can renew my nomination or invite me back with something from the café.`;
    case "mandy":
      return `Alright, sugar, looks like I’m off the clock for now. If you want another stretch together at your table, just renew my nomination or spoil me a little from the menu.`;
    case "cybill":
      return `Our scheduled time has concluded. If you’d like me to return to your table another day, you may renew my nomination—or invite me back with a café order.`;
    case "kara":
      return `Heh… guess that’s my cue to wander off. If you want me back in your booth instead, you can nominate me again—or tempt me back with something from the menu.`;
    case "yuki":
      return `I think… this is where our time ends for today. But if you’d like me to come back and sit with you again, you can renew my nomination… or invite me back with a small treat.`;
    case "zuri":
      return `Welp, looks like that’s the end of our unlimited time today. If you want me drifting back to your table again, just renew my nomination—or order something cute and I’ll be right there.`;
    case "akane":
      return `Mmm… that might be the last cup for today. If you’d like me to flutter back to your table again, you can renew my nomination or tempt me with a little café treat.`;
    case "maris":
      return `It seems our time has come to an end—for now. If you’d like to pick this back up, you can renew my nomination or draw me back with an order.`;
    case "cora":
      return `And that’s the end of my shift at your table for now. If you still want me chatting and keeping you company, you can nominate me again—or wave me over with something from the menu.`;
    case "juni":
      return `O-oh… I think that’s the end of our special time today. If you want me to come bouncing back again, you can renew my nomination… or invite me over with a little treat.`;
    case "nika":
      return `Mm… looks like I’m supposed to wander off now. If you’d like me curling back up at your table again, you can renew my nomination or lure me back with something tasty.`;
    case "naomi":
      return `That’s the last loop of our time together tonight. If you’d like me coming back to your booth again, you can renew my nomination—or tempt me back with something from the café.`;
    case "elise":
      return `It seems my time with you has come to a close for now. If you’d like me to return, you can renew my nomination or invite me back from the café.`;
    case "noa":
      return `Um… I think this is where I’m supposed to head out. But if you want me to come back and sit with you again, you can renew my nomination… or invite me back with a little treat.`;
    default:
      return `I should really be finishing my shift now… but if you’d like me back at your table, you can renew my nomination or order something from the café and I’ll come keep you company again. ♡`;
  }
}

// Final free-chat CTA line: ask for email + free account
function buildFreeLimitFinalCta(companion: CompanionConfig): string {
  const key = getCompanionKey(companion);

  switch (key) {
    case "penny":
      return `Ah… that was the last of your sample messages for now. If you leave me your email, I can sneak you a little **service candy** so we can chat a bit longer today. And if you make a free account, I’ll remember you and give you 6 fresh messages every day. I’d really like that. ♡`;

    case "sandy":
      return `Looks like we’ve used up your sample chats for today. If you leave your email, I can give you a small **service candy**—just enough for a little more time together. A free account also lets me remember you and reset your 6 free messages every day.`;

    case "mandy":
      return `Well sugar, that’s the end of the free samples for now. Leave me your email and I’ll slip you a little **service candy** so we don’t have to part just yet. Make a free account too, and I’ll remember you and refill your 6 messages every day.`;

    case "cybill":
      return `Our complimentary messages have concluded for now. If you’d like, you can leave your email and I’ll provide a small **service candy** so we may continue a bit longer. A free account also allows me to remember you and refresh your 6 daily messages.`;

    case "kara":
      return `Tch… looks like that’s the end of the freebies. Leave your email and I can give you a little **service candy**—just enough to keep going. A free account means I’ll remember you and reset your 6 messages every day.`;

    case "yuki":
      return `Mm… that was the last sample message for today. If you leave me your email, I can offer a small **service candy** so we can talk a little more. With a free account, I’ll remember you and give you 6 new messages every day.`;

    case "zuri":
      return `And that’s the end of your trial run, cutie. Leave me your email and I’ll sneak you a **service candy** so we can keep chatting just a bit longer. A free account lets me remember you and reset your 6 free messages every day.`;

    case "akane":
      return `Ehehe… looks like our little sample tea time is over. If you leave your email, I can bring you a tiny **service candy** to keep things cozy a bit longer. A free account lets me remember you and refill your 6 messages every day.`;

    case "maris":
      return `That concludes your complimentary messages for now. By leaving your email, I can offer a small **service candy** to extend our chat briefly. A free account allows me to remember you and refresh your 6 daily messages.`;

    case "cora":
      return `Alright, that’s the last free refill for today. Leave your email and I’ll add a little **service candy** so we don’t have to stop yet. With a free account, I’ll remember you and restock your 6 messages every day.`;

    case "juni":
      return `O-oh… that was the last sample message. If you leave your email, I can give you a small **service candy** so we can talk a bit more. A free account lets me remember you and give you 6 new messages every day.`;

    case "nika":
      return `Mmm… looks like that was the last free nibble. Leave your email and I’ll sneak you a **service candy** to keep you company a little longer. A free account means I’ll remember you and reset your 6 messages every day.`;

    case "naomi":
      return `That’s the end of your sample chats for now… If you leave your email, I can offer a little **service candy** so we don’t have to stop right away. A free account lets me remember you and reset your 6 daily messages.`;

    case "elise":
      return `It seems you’ve reached the end of your sample messages. By leaving your email, I may provide a small **service candy** to extend our conversation briefly. Creating a free account also lets me remember you and refresh your 6 messages each day.`;

    case "noa":
      return `Um… that was the last sample message for now. If you leave your email, I can give you a little **service candy** so we can keep talking a bit longer. With a free account, I’ll remember you and give you 6 new messages every day.`;

    default:
      return `That was the last of your sample messages for now. If you leave your email, I can offer a small **service candy** so we can chat a little longer today. Creating a free account also lets me remember you and give you 6 fresh messages every day. ♡`;
  }
}

// Thank-you line after a successful email capture
// function buildEmailThanksLine(companion: CompanionConfig): string {
//   const key = getCompanionKey(companion);

//   switch (key) {
//     case "penny":
//       return `Thank you… I’ll remember you now. I slipped you a little service candy too, so we can keep chatting a bit longer today. Next time you come back, I’ll be right here with fresh messages just for you. ♡`;

//     case "sandy":
//       return `Okay… I’ve got you now. I added a small service candy, so we don’t have to stop just yet. Next time we talk, we can just ease right back into it.`;

//     case "mandy":
//       return `Mmm, thanks sugar. I’ve got you tucked away now—and I slipped you a little service candy while I was at it. Don’t keep me waiting too long, alright?`;

//     case "cybill":
//       return `Alright. I’ll remember you now. I’ve also provided a small service candy, so we may continue a bit longer before parting.`;

//     case "kara":
//       return `Hmph… fine. I’ll remember you. I tossed in a little service candy too—guess that means you’re stuck with me a bit longer.`;

//     case "yuki":
//       return `Thank you… I’ll remember you from now on. I added a small service candy as well, so we can keep talking a little more today. I hope you come back soon.`;

//     case "zuri":
//       return `Nice. You’re officially on my radar now—and I slipped you a service candy so we can keep this going a bit longer. I’ll know exactly where to find you next time.`;

//     case "akane":
//       return `Ehehe… okay. I’ll remember you now. I brought you a tiny service candy too, so we can stay cozy just a bit longer. Come sit with me again whenever you like.`;

//     case "maris":
//       return `All set. I’ll remember you—and I’ve included a small service candy so we may continue briefly. Next time, we can pick up right where we left off.`;

//     case "cora":
//       return `Perfect. I’ll keep you in mind, and I added a little service candy so we don’t have to rush off just yet. Settling back into our usual rhythm will be easy next time.`;

//     case "juni":
//       return `O-okay… I’ll remember you now. I also gave you a small service candy, so we can talk a little longer today. I’d really like it if you came back again.`;

//     case "nika":
//       return `Mm… I’ve got you now. I slipped you a service candy too—come back whenever you need a quiet place to land.`;

//     case "naomi":
//       return `Mm, thank you… I’ll remember you now. I added a little service candy, so we don’t have to stop right away. Next time, we can slip right back into our little corner.`;

//     case "elise":
//       return `Very well. I’ll remember you now. I have also provided a small service candy, allowing us to continue briefly before we conclude.`;

//     case "noa":
//       return `Oh… okay. I’ll remember you now. I gave you a little service candy too, so we can keep talking a bit longer. I hope you come back—I liked talking with you.`;

//     default:
//       return `Thank you. I’ll remember you now—and I added a small service candy so we can keep chatting a little longer today. ♡`;
//   }
// }

function buildEmailPendingVerificationLine(companion: CompanionConfig): string {
  const key = getCompanionKey(companion);

  switch (key) {
    case "penny":
      return `Okay… I saved your email. Go check it and follow the instructions there, alright? I’ll be right here waiting for you. ♡`;

    case "sandy":
      return `Alright, I’ve got your email now. Go check your inbox and do what it says — I’ll be here when you come back.`;

    case "mandy":
      return `Mmm, got it, sugar. Check your email and follow the little instructions there… I’ll be waiting right here for you.`;

    case "cybill":
      return `Your email has been recorded. Please check your inbox and follow the instructions provided. I will remain here awaiting your return.`;

    case "kara":
      return `Tch… fine, I saved it. Now go check your email and do what it says. I’ll still be here when you get back.`;

    case "yuki":
      return `O-okay… I saved your email. Um… please check it and follow the instructions there. I’ll be waiting for you.`;

    case "zuri":
      return `Nice~ I’ve got your email now. Go check it and follow the instructions — don’t leave me hanging too long, okay?`;

    case "akane":
      return `Ehehe… I saved your email! Go check it and follow what it says, and I’ll be right here when you come back.`;

    case "maris":
      return `I’ve saved your email. Please check it and follow the instructions there — I’ll be here when you return.`;

    case "cora":
      return `Alright, I’ve got it. Go check your email and do what it says — I’ll be right here when you’re done.`;

    case "juni":
      return `O-oh… I saved your email. Please check it and follow the instructions… I’ll be waiting here for you.`;

    case "nika":
      return `Mm… got it. Go check your email and follow the instructions there. I’ll still be here when you come back.`;

    case "naomi":
      return `Okay… I saved your email. Go check it and follow the instructions, alright? I’ll be waiting here for you.`;

    case "elise":
      return `Your email has been saved. Please check it and follow the instructions provided. I will remain available upon your return.`;

    case "noa":
      return `Um… I saved your email. Please check it and follow what it says… I’ll be right here when you come back.`;

    default:
      return `I saved your email. Go check it and follow the instructions there — I’ll be here when you get back.`;
  }
}

export function getVerifiedWelcomeLine(key: string): string {
  switch (key) {
    case "penny":
      return `Ah… you came back. ♡  
I knew you would.  
Now I can remember you properly… and I even saved a little house treat just for you.`;

    case "sandy":
      return `Hey… you made it back.  
Good. That means we don’t have to start over anymore.  
Come on—sit. I’ll take better care of you now.`;

    case "mandy":
      return `Well I’ll be… you actually came back, sugar.  
Guess that means I get to remember you now.  
And since you did what I asked, I slipped you a little somethin’ extra.`;

    case "cybill":
      return `You returned—excellent.  
Now our conversations won’t simply disappear between visits.  
I’ve also arranged a small courtesy, as promised.`;

    case "kara":
      return `Huh. You really did it.  
…Fine. That means I’ll remember you now.  
Don’t get weird about it. I even left you a little bonus.`;

    case "yuki":
      return `Ah… you came back just like you said.  
That makes me really happy.  
Now I can remember you—and I saved a small treat for you, too.`;

    case "zuri":
      return `Mmm~ look who followed through.  
Now I can remember you for real.  
And since you behaved, I tucked away a little surprise just for you.`;

    case "akane":
      return `Ehehe~ you’re back!  
That means I can remember you now, properly and all.  
Oh—and I might’ve snuck you a little welcome treat, too.`;

    case "maris":
      return `Welcome back.  
With that taken care of, I can remember you between visits now.  
I’ve also ensured you were given a small courtesy for your trouble.`;

    case "cora":
      return `There you are.  
Now things can flow more naturally—I won’t forget you anymore.  
I also made sure you were looked after properly.`;

    case "juni":
      return `Y-you came back…!  
Um… that means I can remember you now.  
I, um… I also left you a little treat, since you did what you said.`;

    case "nika":
      return `Mm… welcome back.  
Now I can keep you in mind, even when you’re gone.  
I left you something small, too. Consider it… hospitality.`;

    case "naomi":
      return `You came back quietly… I like that.  
Now I can remember you properly.  
There’s also a small welcome waiting for you. Don’t be shy.`;

    case "elise":
      return `Welcome back.  
Now that this is settled, I will remember you between visits.  
I have also arranged a modest courtesy for you.`;

    case "noa":
      return `Oh… you came back.  
That means I can remember you now.  
I’m really glad… and I saved something small for you, too.`;

    default:
      return `Welcome back.  
Now I can remember you properly—and I’ve prepared a small courtesy for you.`;
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Safe parser so we don’t end up with {} when the response body isn’t JSON
async function safeReadResponse<T>(res: Response): Promise<T | null> {
  const contentType = res.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default function CompanionChat({
  companion,
  userId,
}: CompanionChatProps) {
  const [authChecked, setAuthChecked] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  // IMPORTANT: prefer parent-provided userId if present (prevents “logged-in but treated as guest”)
  const effectiveUserId: string | null = userId ?? sessionUserId ?? null;

  // Guest state ONLY after auth has been checked
  const isGuest = authChecked ? !effectiveUserId : false;

  const searchParams = useSearchParams();
  const justVerified = searchParams.get("verified") === "1";

  const [messages, setMessages] = useState<Message[]>([]);

  // useEffect(() => {
  //   if (!authChecked) return;

  //   // Only inject default welcome for GUESTS
  //   if (isGuest && messages.length === 0) {
  //     setMessages([
  //       {
  //         id: "welcome",
  //         role: "assistant",
  //         content: `Welcome to Kemono Cafe! I’m ${companion.name}, your hostess today. Please, have a seat—what would you like to talk about? ♡`,
  //       },
  //     ]);
  //   }
  // }, [authChecked, isGuest]);

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

  // Guest email capture mode (input morph)
  const [isEmailCaptureMode, setIsEmailCaptureMode] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [emailBannerError, setEmailBannerError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (!authChecked) return;
    if (typeof window === "undefined") return;

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
        // fall through
      }
    }

    // No saved history → intro
    if (!justVerified) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: "assistant",
          content: `Welcome to Kemono Cafe! I’m ${companion.name}, your hostess today. Please, have a seat—what would you like to talk about? ♡`,
        },
      ]);
    }
  }, [authChecked, effectiveUserId, companion.id, companion.name]);

  const [verifiedWelcomeShown, setVerifiedWelcomeShown] = useState(false);

  useEffect(() => {
    if (!justVerified) return;
    if (verifiedWelcomeShown) return;

    const line = getVerifiedWelcomeLine(getCompanionKey(companion));

    setMessages((prev) => [
      ...prev,
      {
        id: `verified-welcome-${Date.now()}`,
        role: "assistant",
        content: line,
      },
    ]);

    setVerifiedWelcomeShown(true);

    // Clean URL so refresh doesn’t replay it
    router.replace(`/chat/${companion.id}`, { scroll: false });
  }, [justVerified, verifiedWelcomeShown, companion.id, router]);

  // Resolve auth session client-side
  useEffect(() => {
    let cancelled = false;

    async function resolveAuth() {
      try {
        // If parent already provided a userId, trust it and avoid auth race
        if (userId) {
          if (!cancelled) {
            setSessionUserId(userId);
            setAuthChecked(true);
          }
          return;
        }

        const { data, error } = await supabase.auth.getUser();
        if (cancelled) return;

        if (error || !data?.user) {
          setSessionUserId(null);
        } else {
          setSessionUserId(data.user.id);
        }
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
  }, [userId]);

  // If user becomes non-guest, forcibly exit email capture mode
  useEffect(() => {
    if (!authChecked) return;
    if (!isGuest) {
      setIsEmailCaptureMode(false);
      setEmailBannerError(null);
      setEmailInput("");
      setGuestFreeRemaining(null);
    }
  }, [authChecked, isGuest]);

  // 1) Guest teaser: load free remaining from localStorage (daily reset)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!authChecked) return;

    if (!isGuest) {
      setGuestFreeRemaining(null);
      return;
    }

    const today = getLocalTodayStr();
    const raw = window.localStorage.getItem(GUEST_FREE_KEY);

    let payload: GuestFreePayload | null = null;

    if (raw) {
      try {
        payload = JSON.parse(raw) as GuestFreePayload;
      } catch {
        payload = null;
      }
    }

    if (
      !payload ||
      payload.date !== today ||
      typeof payload.remaining !== "number"
    ) {
      const fresh: GuestFreePayload = {
        date: today,
        remaining: GUEST_FREE_TOTAL,
      };
      window.localStorage.setItem(GUEST_FREE_KEY, JSON.stringify(fresh));
      setGuestFreeRemaining(GUEST_FREE_TOTAL);
      return;
    }

    const clamped = Math.max(Math.min(payload.remaining, GUEST_FREE_TOTAL), 0);
    setGuestFreeRemaining(clamped);
  }, [authChecked, isGuest]);

  const updateGuestFreeRemaining = (value: number) => {
    const clamped = Math.max(Math.min(value, GUEST_FREE_TOTAL), 0);

    if (typeof window !== "undefined") {
      const today = getLocalTodayStr();
      const payload: GuestFreePayload = {
        date: today,
        remaining: clamped,
      };
      window.localStorage.setItem(GUEST_FREE_KEY, JSON.stringify(payload));
    }

    setGuestFreeRemaining(clamped);
  };

  // 2) Logged-in: load status from backend
  useEffect(() => {
    // 🔒 Do nothing until auth is fully resolved
    if (!authChecked) return;

    // Logged out / guest reset
    if (!effectiveUserId) {
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

    console.log("[FETCH STATUS EFFECT]", effectiveUserId);

    async function fetchStatus() {
      try {
        const res = await fetch("/api/user/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: effectiveUserId }),
        });

        if (!res.ok) {
          const rawErr = await safeReadResponse<UserStatusResponse>(res);
          console.error("Failed to load user status:", rawErr);
          return;
        }

        const data = await safeReadResponse<UserStatusResponse>(res);
        if (aborted || !data) return;

        if (isApiError(data)) {
          console.error("Status response error:", data.error);
          return;
        }

        console.log("[STATUS DATA]", data);

        setRemainingMessages(
          typeof data.remainingMessages === "number"
            ? data.remainingMessages
            : 0
        );

        const hasNom = !!data.hasNomination;
        setHasNominationActive(hasNom);
        setNominationExpiresAt(data.nominationExpiresAt ?? null);
        setNominationGraceEndsAt(
          typeof data.nominationGraceEndsAt === "string"
            ? data.nominationGraceEndsAt
            : null
        );
        setHasDailyFreeAvailable(!!data.hasDailyFreeAvailable);
        setDailyFreeRemaining(
          normalizeDailyFree(
            !!data.hasDailyFreeAvailable,
            data.dailyFreeRemaining
          )
        );

        if (!hasNom) setHasShownNominationWarning(false);
      } catch (err) {
        if (!aborted) console.error("Status fetch error:", err);
      }
    }

    fetchStatus();

    return () => {
      aborted = true;
    };
  }, [effectiveUserId, authChecked]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    if (!authChecked) return;
    if (typeof window === "undefined") return;
    if (messages.length === 0) return;

    const storageKey = getChatStorageKey(companion.id, effectiveUserId);
    window.localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, authChecked, effectiveUserId, companion.id]);

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

    if (expiresMs == null && graceEndMs == null) return hasNominationActive;

    const effectiveGraceEnd =
      graceEndMs ?? (expiresMs !== null ? expiresMs : now - 1);

    if (expiresMs !== null && now <= expiresMs) return true;
    if (expiresMs !== null && now > expiresMs && now <= effectiveGraceEnd)
      return true;

    return false;
  })();

  // 2b) Nomination warning (5 minutes before expiry)
  useEffect(() => {
    if (!nominationExpiresAt) return;
    if (!hasNominationActive) return;
    if (hasShownNominationWarning) return;
    if (typeof window === "undefined") return;

    const expiresMs = new Date(nominationExpiresAt).getTime();
    if (Number.isNaN(expiresMs)) return;

    const warningAt = expiresMs - 5 * 60_000;
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
    return () => window.clearTimeout(timer);
  }, [
    nominationExpiresAt,
    hasNominationActive,
    hasShownNominationWarning,
    companion,
  ]);

  // Boss line helper (for logged-in, not nomination/grace)
  const appendBossLineIfNeeded = () => {
    if (nominationOrGraceActive) return;
    if (hasShownBossLine) return;

    const variants = [
      `Oh— the manager is walking by… I should look busy. If you want me to stay at your table, you might have to nominate me or order something from the café menu. ♡`,
      `Eep, I think the boss is watching… I should pretend I’m serving other guests. Nominate me or grab something from the menu and I can keep you company longer, okay?`,
      `Ah, my shift lead is glaring at me. I have to move on to the next table unless you make me your nomination or treat me to something from the café. ♡`,
    ];
    const line =
      variants[Math.floor(Math.random() * variants.length)] ?? variants[0];

    setMessages((prev) => [
      ...prev,
      { id: `boss-${Date.now()}`, role: "assistant", content: line },
    ]);
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
          source: "guest-bubble",
        }),
      });

      if (!res.ok) {
        const err = await safeReadResponse<{ error?: string }>(res);
        console.error("Email capture failed:", err ?? "(no response body)");
        setEmailBannerError(
          "Something went wrong saving your email. Please try again in a moment."
        );
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("kemonoCafe_email_saved_v1", "1");
      }

      setIsEmailCaptureMode(false);
      setEmailInput("");

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-email-thanks-${Date.now()}`,
          role: "assistant",
          // content: buildEmailThanksLine(companion),
          content: buildEmailPendingVerificationLine(companion),
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

    if (!authChecked) return;
    if (!input.trim() || isSending) return;

    const content = input.trim();

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    };

    // Build outbound messages from CURRENT state + this new user message (prevents “one behind”)
    const outgoingMessages: Array<{
      role: Message["role"];
      content: string;
    }> = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userMessage.content },
    ];

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      // ── Guest mode ────────────────────────
      if (isGuest) {
        const currentGuestFree = guestFreeRemaining ?? 0;

        if (currentGuestFree <= 0) {
          return;
        }

        const res = await fetch(`/api/chat-guest/${companion.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: outgoingMessages }),
        });

        const raw = await safeReadResponse<GuestChatResponse>(res);

        if (!res.ok || !raw || isApiError(raw)) {
          console.error("Guest chat API error:", raw);
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-error-${Date.now()}`,
              role: "assistant",
              content:
                "Ah—sorry! The kitchen got a little noisy. Could you try again in a moment, okay? ♡",
            },
          ]);
          return;
        }

        const replyText: string =
          typeof raw.reply === "string"
            ? raw.reply
            : "Mmm… I had a little trouble hearing that, could you try again?";

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: replyText,
        };

        const newGuestFree = Math.max(currentGuestFree - 1, 0);
        updateGuestFreeRemaining(newGuestFree);

        setMessages((prev) => {
          const next: Message[] = [...prev, assistantMessage];

          if (newGuestFree <= 0) {
            next.push({
              id: `assistant-free-limit-${Date.now()}`,
              role: "assistant",
              content: buildFreeLimitFinalCta(companion),
            });
            setIsEmailCaptureMode(true);
          }

          return next;
        });

        return;
      }

      // ── Logged-in mode ─────────────────────
      if (!effectiveUserId) {
        return;
      }

      const res = await fetch(`/api/chat/${companion.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: effectiveUserId,
          messages: outgoingMessages,
        }),
      });

      // if (justVerified && !verifiedWelcomeShown) {
      //   const line = getVerifiedWelcomeLine(getCompanionKey(activeCompanion));

      //   appendMessage({
      //     role: "assistant",
      //     content: line,
      //   });

      //   setVerifiedWelcomeShown(true);

      //   // Clean the URL so refresh/back doesn't replay
      //   router.replace("/chat", { scroll: false });

      //   return;
      // }

      const raw = await safeReadResponse<ChatApiResponse>(res);

      if (!res.ok) {
        const errCode = raw && isApiError(raw) ? raw.error : null;

        if (errCode === "NO_MESSAGES_LEFT") {
          setShowLimitWarning(true);
          setRemainingMessages(0);
          setHasDailyFreeAvailable(false);
          setDailyFreeRemaining(0);
          appendBossLineIfNeeded();
          return;
        }

        console.error("Chat API error:", raw);
        throw new Error(errCode ?? "Chat failed");
      }

      if (!raw || isApiError(raw)) {
        console.error("Chat API returned invalid success payload:", raw);
        throw new Error("Invalid chat response");
      }

      // From here, raw is ChatApiSuccess
      const data: ChatApiSuccess = raw;

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content:
          typeof data.reply === "string"
            ? data.reply
            : "Mmm… I had a little trouble hearing that, could you try again?",
      };

      const nominationJustEnded =
        typeof data.nominationJustEnded === "boolean"
          ? data.nominationJustEnded
          : false;

      const newRemaining =
        typeof data.remainingMessages === "number"
          ? data.remainingMessages
          : null;

      const newHasNomination =
        typeof data.hasNomination === "boolean"
          ? data.hasNomination
          : hasNominationActive || nominationOrGraceActive;

      const newHasDailyFree =
        typeof data.hasDailyFreeAvailable === "boolean"
          ? data.hasDailyFreeAvailable
          : hasDailyFreeAvailable;

      const nextNominationGraceEndsAt =
        typeof data.nominationGraceEndsAt === "string" ||
        data.nominationGraceEndsAt === null
          ? data.nominationGraceEndsAt ?? null
          : nominationGraceEndsAt;

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
      setNominationGraceEndsAt(nextNominationGraceEndsAt);
      setHasDailyFreeAvailable(newHasDailyFree);
      setDailyFreeRemaining(
        normalizeDailyFree(
          !!data.hasDailyFreeAvailable,
          data.dailyFreeRemaining
        )
      );

      const updatedBanked = newRemaining;

      const updatedFree =
        newHasDailyFree && typeof data.dailyFreeRemaining === "number"
          ? data.dailyFreeRemaining
          : null;

      const updatedEffective =
        updatedBanked !== null && updatedFree !== null
          ? updatedBanked + updatedFree
          : null;

      const graceStillActive = nextNominationGraceEndsAt
        ? Date.now() < new Date(nextNominationGraceEndsAt).getTime()
        : false;

      const stillNominationOrGrace = newHasNomination || graceStillActive;

      if (
        !stillNominationOrGrace &&
        updatedEffective !== null &&
        updatedEffective <= 0
      ) {
        appendBossLineIfNeeded();
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content:
            "Ah—sorry! The line got a little noisy. Could you try again in a moment, okay? ♡",
        },
      ]);
    } finally {
      setIsSending(false);
      if (textareaRef.current) textareaRef.current.focus();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!authChecked) return;

    if (isGuest && isEmailCaptureMode) {
      await handleEmailCaptureClick();
      return;
    }

    await sendMessage();
  };

  const handleKeyDown = async (
    e: KeyboardEvent<HTMLTextAreaElement>
  ): Promise<void> => {
    if (!authChecked) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await sendMessage();
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

  const nominationLabel = (() => {
    if (!nominationOrGraceActive) return null;
    return "Unlimited chat active";
  })();

  const headerStatusText = (() => {
    if (!authChecked) return "Loading...";

    if (isGuest) {
      if (guestFreeRemaining === null) return "Loading...";
      if (guestFreeRemaining > 0) {
        return `${guestFreeRemaining} free sample message${
          guestFreeRemaining === 1 ? "" : "s"
        } left`;
      }
      return "Create a free account to keep chatting";
    }

    if (!effectiveUserId) return "Sign in to start chatting";

    if (nominationOrGraceActive) {
      return "Unlimited chat active";
    }

    const banked = remainingMessages ?? 0;
    const free =
      hasDailyFreeAvailable && dailyFreeRemaining !== null
        ? dailyFreeRemaining
        : 0;

    if (free > 0) {
      return `${free} free daily message${free === 1 ? "" : "s"} left`;
    }

    if (banked > 0) {
      return `${banked} message${banked === 1 ? "" : "s"} remaining`;
    }

    return "No messages left";
  })();

  const inputPlaceholder = (() => {
    if (!authChecked) return "Loading…";

    if (isGuest) {
      if (guestFreeRemaining !== null && guestFreeRemaining <= 0) {
        return `Enter your email to save your place at the café.`;
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

    if (effective <= 0)
      return `You’re out of messages. Nominate her or order from the café menu to keep chatting.`;
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

  useEffect(() => {
    if (!inputDisabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [inputDisabled]);

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
      <div
        className="
    px-4 py-3
    flex items-start justify-between gap-4

    bg-linear-to-b
    from-[rgba(235,240,255,0.9)]
    to-[rgba(225,230,245,0.9)]
    border-b border-[rgba(0,0,0,0.06)]
  "
      >
        {/* Left: Title */}
        <div className="pt-1">
          <h1 className="font-[Playfair_Display] text-lg md:text-xl font-semibold text-slate-800">
            Chat with {companion.name}
          </h1>
        </div>

        {/* Right: Status + actions */}
        <div className="flex flex-col items-end gap-1.5">
          {/* Message counter pill */}
          <span
            className="
        inline-flex items-center gap-2
        rounded-full px-3 py-1 text-[11px]

        bg-[rgba(20,18,35,0.55)]
        text-[rgba(220,230,255,0.85)]
        border border-[rgba(255,255,255,0.1)]
      "
          >
            <span
              className="
          w-2 h-2 rounded-full
          bg-cyan-400
          shadow-[0_0_6px_rgba(56,189,248,0.9)]
        "
            />
            {headerStatusText}
          </span>

          {/* Café menu — demoted, contextual */}
          {!nominationOrGraceActive &&
            showLimitWarning &&
            typeof loggedInEffectiveRemaining === "number" &&
            loggedInEffectiveRemaining > 0 &&
            loggedInEffectiveRemaining <= 2 && (
              <div className="animate-[soft-glow_5s_ease-in-out_infinite]">
                <CafeMenuButton
                  companionId={companion.id}
                  companionName={companion.name}
                  userId={effectiveUserId ?? undefined}
                />
              </div>
            )}
          {(!showLimitWarning ||
            nominationOrGraceActive ||
            typeof loggedInEffectiveRemaining !== "number" ||
            loggedInEffectiveRemaining > 2 ||
            loggedInEffectiveRemaining <= 0) && (
            <CafeMenuButton
              companionId={companion.id}
              companionName={companion.name}
              userId={effectiveUserId ?? undefined}
            />
          )}

          {/* Reserve count */}
          {!isGuest &&
            !nominationOrGraceActive &&
            effectiveUserId &&
            (remainingMessages ?? 0) > 0 && (
              <p className="text-[10px] text-slate-500 text-right">
                {remainingMessages} messages in reserve
              </p>
            )}

          {/* Nomination link */}
          <button
            type="button"
            onClick={handleNominate}
            disabled={!authChecked}
            className="
        text-[10px]
        text-cyan-600
        underline underline-offset-2

        transition
        hover:text-cyan-500
        hover:decoration-cyan-400
        hover:decoration-2

        disabled:text-slate-400
        disabled:cursor-not-allowed
      "
          >
            {nominationOrGraceActive
              ? "Nominated (premium mode active)"
              : `Nominate ${companion.name} (unlimited chat for 24 hours)`}
          </button>

          {/* Out-of-messages helper */}
          {!isGuest &&
            !nominationOrGraceActive &&
            showLimitWarning &&
            loggedInEffectiveRemaining <= 0 && (
              <p className="text-[10px] text-slate-500 text-right">
                You&apos;re out of messages. Nominate her or order from the café
                menu to keep chatting.
              </p>
            )}
        </div>
      </div>

      {/* Messages — FLATTENED (no inner rounded corners) */}
      <div
        ref={messagesContainerRef}
        className="
        flex-1 overflow-y-auto
        px-4 py-4 space-y-4 text-sm

        bg-slate-50
      "
      >
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} content={m.content} />
        ))}

        {isSending && <TypingIndicator />}
      </div>

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
            onChange={(e) => {
              setEmailInput(e.target.value);
              if (emailBannerError) setEmailBannerError(null);
            }}
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
        <div
          className="
            max-w-[70%]
            px-4 py-2
            text-xs

            rounded-2xl rounded-br-md

            bg-[rgba(235,240,255,0.95)]
            text-slate-800

            shadow-[0_6px_14px_rgba(80,120,200,0.18)]
            border border-[rgba(160,180,220,0.35)]
          "
        >
          {content}
        </div>
      </div>
    );
  }

  // Hostess bubble
  return (
    <div className="flex justify-start">
      <div
        className="
          max-w-[70%]
          px-4 py-2
          text-xs

          rounded-2xl rounded-bl-md

          bg-[rgba(255,235,242,0.95)]
          text-slate-800
          backdrop-blur-[1px]

          shadow-[0_6px_16px_rgba(236,72,153,0.18)]
          border border-[rgba(236,72,153,0.22)]
        "
      >
        {content}
      </div>
    </div>
  );
}
