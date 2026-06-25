"use client";

import CafeMenuButton from "@/products/kemonoCafe/CafeMenuButton";

interface ChatHeaderProps {
  companionName: string;
  headerStatusText: string;
  showLimitWarning: boolean;
  nominationOrGraceActive: boolean;
  loggedInEffectiveRemaining: number;
  remainingMessages: number | null;
  isGuest: boolean;
  effectiveUserId: string | null;
  authChecked: boolean;
  onNominate: () => void;
  companionId: string;
}

const ChatHeader = ({
  companionName,
  headerStatusText,
  showLimitWarning,
  nominationOrGraceActive,
  loggedInEffectiveRemaining,
  remainingMessages,
  isGuest,
  effectiveUserId,
  authChecked,
  onNominate,
  companionId,
}: ChatHeaderProps) => {
  return (
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
          Chat with {companionName}
        </h1>
      </div>

      {/* Right: Status + actions */}
      <div className="flex flex-col items-end gap-1.5">
        {/* Status pill */}
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

        {/* Café menu button */}
        {!nominationOrGraceActive &&
        showLimitWarning &&
        loggedInEffectiveRemaining > 0 &&
        loggedInEffectiveRemaining <= 2 ? (
          <div className="animate-[soft-glow_5s_ease-in-out_infinite]">
            <CafeMenuButton
              companionId={companionId}
              companionName={companionName}
              userId={effectiveUserId ?? undefined}
            />
          </div>
        ) : (
          <CafeMenuButton
            companionId={companionId}
            companionName={companionName}
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

        {/* Nominate link */}
        <button
          type="button"
          onClick={onNominate}
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
            : `Nominate ${companionName} (unlimited chat for 24 hours)`}
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
  );
};

export default ChatHeader;
