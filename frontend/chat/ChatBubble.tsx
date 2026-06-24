// frontend/components/chat/ChatBubble.tsx
"use client";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export default function ChatBubble({ role, content }: ChatBubbleProps) {
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
