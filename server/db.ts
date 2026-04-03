import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const { Pool } = pg;

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  return databaseUrl;
}

function shouldUseSsl(databaseUrl: string): boolean {
  if (/sslmode=disable/i.test(databaseUrl)) {
    return false;
  }

  return !/localhost|127\.0\.0\.1/i.test(databaseUrl);
}

const databaseUrl = getDatabaseUrl();

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: shouldUseSsl(databaseUrl) ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool);
