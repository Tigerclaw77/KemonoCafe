import { cookies } from "next/headers";
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from "crypto";
import { promisify } from "util";
import { dbQueryOne, type AppUser } from "./db";

const scrypt = promisify(scryptCallback);

const SESSION_COOKIE = "kc_session";
const SESSION_DAYS = 30;
const PASSWORD_KEY_LENGTH = 64;

type UserWithPassword = AppUser & {
  password_hash: string;
  password_salt: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function hashPassword(password: string, salt: string) {
  const derived = (await scrypt(
    password,
    salt,
    PASSWORD_KEY_LENGTH
  )) as Buffer;

  return derived.toString("hex");
}

export async function createPasswordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const passwordHash = await hashPassword(password, salt);
  return { passwordHash, passwordSalt: salt };
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
  passwordSalt: string
) {
  const candidateHash = await hashPassword(password, passwordSalt);
  const candidate = Buffer.from(candidateHash, "hex");
  const stored = Buffer.from(passwordHash, "hex");

  if (candidate.length !== stored.length) return false;

  return timingSafeEqual(candidate, stored);
}

export async function findUserByEmail(email: string) {
  return dbQueryOne<UserWithPassword>(
    `
      select id, email, display_name, user_context, password_hash, password_salt
      from users
      where email = $1
    `,
    [normalizeEmail(email)]
  );
}

export async function findUserById(userId: string) {
  return dbQueryOne<AppUser>(
    `
      select id, email, display_name, user_context
      from users
      where id = $1
    `,
    [userId]
  );
}

export async function createUserAccount({
  email,
  password,
  displayName,
  userContext,
}: {
  email: string;
  password: string;
  displayName?: string | null;
  userContext?: string | null;
}) {
  const normalizedEmail = normalizeEmail(email);
  const { passwordHash, passwordSalt } = await createPasswordHash(password);

  return dbQueryOne<AppUser>(
    `
      insert into users (email, password_hash, password_salt, display_name, user_context)
      values ($1, $2, $3, $4, $5)
      returning id, email, display_name, user_context
    `,
    [
      normalizedEmail,
      passwordHash,
      passwordSalt,
      displayName || null,
      userContext || null,
    ]
  );
}

export async function ensureUserDefaults(userId: string) {
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

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  );

  await dbQueryOne<{ id: string }>(
    `
      insert into user_sessions (user_id, token_hash, expires_at)
      values ($1, $2, $3)
      returning id
    `,
    [userId, tokenHash, expiresAt.toISOString()]
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await dbQueryOne<{ id: string }>(
      `
        delete from user_sessions
        where token_hash = $1
        returning id
      `,
      [hashToken(token)]
    );
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  return dbQueryOne<AppUser>(
    `
      select users.id, users.email, users.display_name, users.user_context
      from user_sessions
      join users on users.id = user_sessions.user_id
      where user_sessions.token_hash = $1
        and user_sessions.expires_at > now()
      limit 1
    `,
    [hashToken(token)]
  );
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  return user;
}

