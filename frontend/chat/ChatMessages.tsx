"use client";

import { useEffect, useRef } from "react";
import ChatBubble from "./ChatBubble";
import TypingIndicator from "../components/TypingIndicator";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatMessagesProps {
  messages: Message[];
  isSending: boolean;
}

export default function ChatMessages({
  messages,
  isSending,
}: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [messages.length, isSending]);

  return (
    <div
      ref={containerRef}
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
  );
}
