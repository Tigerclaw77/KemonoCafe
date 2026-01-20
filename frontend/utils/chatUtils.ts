export function getChatStorageKey(
  companionId: string,
  userId: string | null
): string {
  return userId
    ? `kc_chat_${userId}_${companionId}`
    : `kc_chat_guest_${companionId}`;
}

export function normalizeDailyFree(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

export function getLocalTodayStr(): string {
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

export function isApiError(value: unknown): value is { error: string } {
  return hasStringProp(value, "error");
}

export async function safeReadResponse<T>(
  res: Response
): Promise<T | null> {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;

  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
