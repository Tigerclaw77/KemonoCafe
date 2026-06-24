// frontend/components/NominationBanner.tsx
"use client";

interface NominationBannerProps {
  companionName: string;
  onNominate: () => void;
  disabled?: boolean;
}

export default function NominationBanner({
  companionName,
  onNominate,
  disabled,
}: NominationBannerProps) {
  return (
    <div
      className="
        mx-4 my-3
        rounded-xl
        px-4 py-3

        bg-gradient-to-r
        from-[rgba(56,189,248,0.12)]
        to-[rgba(236,72,153,0.12)]

        border border-[rgba(180,200,255,0.35)]
        shadow-[0_10px_24px_rgba(0,0,0,0.35)]

        flex items-center justify-between gap-4
      "
    >
      <p className="text-sm text-slate-800">
        Enjoying your time with <span className="font-semibold">{companionName}</span>?  
        Nominate her for uninterrupted conversation.
      </p>

      <button
        onClick={onNominate}
        disabled={disabled}
        className="
          shrink-0
          rounded-full
          px-4 py-1.5
          text-xs font-semibold
          text-white

          bg-gradient-to-b
          from-pink-400
          to-pink-500

          shadow-[0_6px_16px_rgba(236,72,153,0.4)]
          hover:brightness-105
          transition

          disabled:opacity-50
          disabled:cursor-not-allowed
        "
      >
        Nominate (24h)
      </button>
    </div>
  );
}
