import { Pool, type PoolClient, type QueryResultRow } from "pg";

declare global {
  var __kemonoCafePool: Pool | undefined;
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return databaseUrl;
}

function shouldUseSsl(databaseUrl: string) {
  return !/localhost|127\.0\.0\.1/.test(databaseUrl);
}

export function getPool() {
  if (!globalThis.__kemonoCafePool) {
    const connectionString = getDatabaseUrl();

    globalThis.__kemonoCafePool = new Pool({
      connectionString,
      ssl: shouldUseSsl(connectionString)
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }

  return globalThis.__kemonoCafePool;
}

export async function dbQuery<T extends QueryResultRow>(
  text: string,
  params: unknown[] = []
) {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

export async function dbQueryOne<T extends QueryResultRow>(
  text: string,
  params: unknown[] = []
) {
  const rows = await dbQuery<T>(text, params);
  return rows[0] ?? null;
}

export async function dbTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
) {
  const client = await getPool().connect();

  try {
    await client.query("begin");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

export type AppUser = {
  id: string;
  email: string;
  display_name: string | null;
  user_context: string | null;
};

