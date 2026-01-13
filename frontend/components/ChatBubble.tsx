// ChatBubble.tsx OR inline replacement
"use client";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export default function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`
          max-w-[80%]
          px-4 py-2.5
          text-sm leading-relaxed

          ${
            isUser
              ? `
                bg-slate-700
                text-slate-50
                rounded-xl
                shadow-[0_6px_16px_rgba(0,0,0,0.35)]
              `
              : `
                bg-white
                text-slate-800
                rounded-xl
                border border-[rgba(180,200,255,0.35)]
                shadow-[0_4px_12px_rgba(0,0,0,0.2)]
              `
          }
        `}
      >
        {content}
      </div>
    </div>
  );
}
