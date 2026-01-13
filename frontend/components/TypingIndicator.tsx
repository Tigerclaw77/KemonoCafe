// frontend/components/TypingIndicator.tsx
"use client";

export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div
        className="
          inline-flex items-center gap-1
          rounded-full
          px-3 py-1.5
          bg-white
          border border-[rgba(180,200,255,0.35)]
          shadow-[0_4px_12px_rgba(0,0,0,0.15)]
        "
      >
        <span className="typing-dot delay-0" />
        <span className="typing-dot delay-1" />
        <span className="typing-dot delay-2" />
      </div>
    </div>
  );
}
