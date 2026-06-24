import { useState } from "react";
import { isApiError, safeReadResponse, isValidEmail } from "../utils/chatUtils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

interface GuestChatParams {
  companionId: string;
  personaLines: {
    freeLimitFinal: string;
    emailPendingVerification: string;
  };
  guestFreeRemaining: number | null;
  updateGuestFreeRemaining: (n: number) => void;
}

export function useGuestChatController({
  companionId,
  personaLines,
  guestFreeRemaining,
  updateGuestFreeRemaining,
}: GuestChatParams) {
  const [isEmailCaptureMode, setIsEmailCaptureMode] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [emailBannerError, setEmailBannerError] = useState<string | null>(null);

  async function sendGuestMessage(
    outgoingMessages: { role: "user" | "assistant"; content: string }[],
    pushMessages: (msgs: Message[]) => void
  ) {
    const currentFree = guestFreeRemaining ?? 0;
    if (currentFree <= 0) return;

    const res = await fetch(`/api/chat-guest/${companionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: outgoingMessages }),
    });

    const raw = await safeReadResponse<{ reply?: string } | { error: string }>(
      res
    );

    if (!res.ok || !raw || isApiError(raw)) {
      pushMessages([
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content:
            "Ah—sorry! The kitchen got a little noisy. Could you try again?",
        },
      ]);
      return;
    }

    const reply = typeof raw.reply === "string" ? raw.reply : "...";

    const newRemaining = Math.max(currentFree - 1, 0);
    updateGuestFreeRemaining(newRemaining);

    const next: Message[] = [
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: reply,
      },
    ];

    if (newRemaining <= 0) {
      next.push({
        id: `assistant-free-limit-${Date.now()}`,
        role: "assistant",
        content: personaLines.freeLimitFinal,
      });
      setIsEmailCaptureMode(true);
    }

    pushMessages(next);
  }

  async function submitEmail(companionId: string) {
    if (!emailInput.trim()) {
      setEmailBannerError("Please enter an email.");
      return;
    }

    if (!isValidEmail(emailInput)) {
      setEmailBannerError("That doesn’t look like a valid email.");
      return;
    }

    setIsEmailSubmitting(true);
    setEmailBannerError(null);

    try {
      const res = await fetch("/api/email-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput.trim(),
          companionId,
          source: "guest-bubble",
        }),
      });

      if (!res.ok) throw new Error();

      setIsEmailCaptureMode(false);
      setEmailInput("");
    } catch {
      setEmailBannerError("Could not save email. Try again.");
    } finally {
      setIsEmailSubmitting(false);
    }
  }

  return {
    isEmailCaptureMode,
    emailInput,
    setEmailInput,
    isEmailSubmitting,
    emailBannerError,
    sendGuestMessage,
    submitEmail,
    exitGuestMode: () => {
      setIsEmailCaptureMode(false);
      setEmailInput("");
      setEmailBannerError(null);
    },
  };
}
