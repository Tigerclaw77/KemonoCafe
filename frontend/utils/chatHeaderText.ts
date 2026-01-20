export function getHeaderStatusText({
  authChecked,
  isGuest,
  guestFreeRemaining,
  effectiveUserId,
  nominationOrGraceActive,
  remainingMessages,
  hasDailyFreeAvailable,
  dailyFreeRemaining,
}: {
  authChecked: boolean;
  isGuest: boolean;
  guestFreeRemaining: number | null;
  effectiveUserId: string | null;
  nominationOrGraceActive: boolean;
  remainingMessages: number | null;
  hasDailyFreeAvailable: boolean;
  dailyFreeRemaining: number | null;
}) {
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
  if (nominationOrGraceActive) return "Unlimited chat active";

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
}
