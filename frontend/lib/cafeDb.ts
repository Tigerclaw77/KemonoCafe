import { dbQuery, dbQueryOne, dbTransaction } from "./db";

export const DAILY_FREE_LIMIT = 6;
export const NOMINATION_GRACE_MS = 5 * 60_000;

export type UserCafeStatus = {
  remainingMessages: number;
  hasNomination: boolean;
  nominationExpiresAt: string | null;
  nominationGraceEndsAt: string | null;
  hasDailyFreeAvailable: boolean;
  dailyFreeRemaining: number;
};

type BalanceRow = {
  remaining_messages: number;
};

type StatsRow = {
  daily_free_used: number;
  daily_free_date: string | Date | null;
};

type NominationRow = {
  expires_at: string | Date;
  grace_used: boolean;
};

function toDateKey(value: string | Date | null) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value.slice(0, 10);
}

export async function ensureEconomyRows(userId: string) {
  await dbQueryOne<{ user_id: string }>(
    `
      insert into message_balances (user_id, remaining_messages)
      values ($1, 0)
      on conflict (user_id) do nothing
      returning user_id
    `,
    [userId]
  );

  await dbQueryOne<{ user_id: string }>(
    `
      insert into user_stats (user_id, daily_free_used, daily_free_date)
      values ($1, 0, current_date)
      on conflict (user_id) do nothing
      returning user_id
    `,
    [userId]
  );
}

export async function getCafeStatus(userId: string, companionId?: string | null) {
  await ensureEconomyRows(userId);

  const balance = await dbQueryOne<BalanceRow>(
    `
      select remaining_messages
      from message_balances
      where user_id = $1
    `,
    [userId]
  );

  const stats = await dbQueryOne<StatsRow>(
    `
      select daily_free_used, daily_free_date
      from user_stats
      where user_id = $1
    `,
    [userId]
  );

  const today = new Date().toISOString().slice(0, 10);
  const statsDate = toDateKey(stats?.daily_free_date ?? null);
  const dailyFreeUsed = statsDate === today ? stats?.daily_free_used ?? 0 : 0;
  const dailyFreeRemaining = Math.max(DAILY_FREE_LIMIT - dailyFreeUsed, 0);

  let nomination: NominationRow | null = null;

  if (companionId) {
    nomination = await dbQueryOne<NominationRow>(
      `
        select expires_at, grace_used
        from user_nominations
        where user_id = $1
          and companion_id = $2
      `,
      [userId, companionId]
    );
  } else {
    nomination = await dbQueryOne<NominationRow>(
      `
        select expires_at, grace_used
        from user_nominations
        where user_id = $1
      `,
      [userId]
    );
  }

  let hasNomination = false;
  let nominationExpiresAt: string | null = null;
  let nominationGraceEndsAt: string | null = null;

  if (nomination?.expires_at) {
    const expiresAt =
      nomination.expires_at instanceof Date
        ? nomination.expires_at
        : new Date(nomination.expires_at);
    const expiresMs = expiresAt.getTime();
    const graceEndMs = expiresMs + NOMINATION_GRACE_MS;
    const nowMs = Date.now();

    if (nowMs <= expiresMs || (!nomination.grace_used && nowMs <= graceEndMs)) {
      hasNomination = true;
      nominationExpiresAt = expiresAt.toISOString();
      nominationGraceEndsAt = new Date(graceEndMs).toISOString();
    }
  }

  return {
    remainingMessages: balance?.remaining_messages ?? 0,
    hasNomination,
    nominationExpiresAt,
    nominationGraceEndsAt,
    hasDailyFreeAvailable: dailyFreeRemaining > 0,
    dailyFreeRemaining,
  } satisfies UserCafeStatus;
}

export async function markNominationGraceUsed(
  userId: string,
  companionId: string
) {
  await dbQuery(
    `
      update user_nominations
      set grace_used = true, updated_at = now()
      where user_id = $1
        and companion_id = $2
    `,
    [userId, companionId]
  );
}

export async function consumeFreeMessage(userId: string) {
  const row = await dbQueryOne<{ daily_free_used: number }>(
    `
      insert into user_stats (
        user_id,
        daily_free_used,
        daily_free_date,
        last_visit_at,
        updated_at
      )
      values ($1, 1, current_date, now(), now())
      on conflict (user_id) do update
      set
        daily_free_used = case
          when user_stats.daily_free_date = current_date
            then user_stats.daily_free_used + 1
          else 1
        end,
        daily_free_date = current_date,
        last_visit_at = now(),
        updated_at = now()
      where
        user_stats.daily_free_date is distinct from current_date
        or user_stats.daily_free_used < $2
      returning daily_free_used
    `,
    [userId, DAILY_FREE_LIMIT]
  );

  return !!row;
}

export async function consumeBankedMessage(userId: string) {
  const row = await dbQueryOne<{ remaining_messages: number }>(
    `
      update message_balances
      set remaining_messages = remaining_messages - 1,
          updated_at = now()
      where user_id = $1
        and remaining_messages > 0
      returning remaining_messages
    `,
    [userId]
  );

  return row?.remaining_messages ?? null;
}

export async function refundMessageCredit(
  userId: string,
  kind: "FREE" | "BANKED"
) {
  if (kind === "FREE") {
    await dbQuery(
      `
        update user_stats
        set daily_free_used = greatest(daily_free_used - 1, 0),
            updated_at = now()
        where user_id = $1
          and daily_free_date = current_date
      `,
      [userId]
    );
    return;
  }

  await incrementMessages(userId, 1);
}

export async function incrementMessages(userId: string, amount: number) {
  await dbQueryOne<{ user_id: string }>(
    `
      insert into message_balances (user_id, remaining_messages, updated_at)
      values ($1, $2, now())
      on conflict (user_id) do update
      set remaining_messages = message_balances.remaining_messages + excluded.remaining_messages,
          updated_at = now()
      returning user_id
    `,
    [userId, amount]
  );
}

export async function setNomination({
  userId,
  companionId,
  expiresAt,
}: {
  userId: string;
  companionId: string;
  expiresAt: Date;
}) {
  await dbQueryOne<{ user_id: string }>(
    `
      insert into user_nominations (
        user_id,
        companion_id,
        expires_at,
        grace_used,
        updated_at
      )
      values ($1, $2, $3, false, now())
      on conflict (user_id) do update
      set companion_id = excluded.companion_id,
          expires_at = excluded.expires_at,
          grace_used = false,
          updated_at = now()
      returning user_id
    `,
    [userId, companionId, expiresAt.toISOString()]
  );
}

export async function consumeChatCredit(userId: string) {
  return dbTransaction(async (client) => {
    const freeResult = await client.query<{ daily_free_used: number }>(
      `
        insert into user_stats (
          user_id,
          daily_free_used,
          daily_free_date,
          last_visit_at,
          updated_at
        )
        values ($1, 1, current_date, now(), now())
        on conflict (user_id) do update
        set
          daily_free_used = case
            when user_stats.daily_free_date = current_date
              then user_stats.daily_free_used + 1
            else 1
          end,
          daily_free_date = current_date,
          last_visit_at = now(),
          updated_at = now()
        where
          user_stats.daily_free_date is distinct from current_date
          or user_stats.daily_free_used < $2
        returning daily_free_used
      `,
      [userId, DAILY_FREE_LIMIT]
    );

    if (freeResult.rowCount && freeResult.rowCount > 0) {
      return "FREE" as const;
    }

    const bankedResult = await client.query<{ remaining_messages: number }>(
      `
        update message_balances
        set remaining_messages = remaining_messages - 1,
            updated_at = now()
        where user_id = $1
          and remaining_messages > 0
        returning remaining_messages
      `,
      [userId]
    );

    if (bankedResult.rowCount && bankedResult.rowCount > 0) {
      return "BANKED" as const;
    }

    return null;
  });
}

