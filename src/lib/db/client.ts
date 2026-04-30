/**
 * Drizzle DB-client.
 *
 * I produktion (Coolify): pegér på Postgres-instans i samme network.
 * I dev: pegér på lokal Postgres eller en delt staging-DB.
 *
 * DATABASE_URL formatet: postgres://user:pass@host:port/dbname
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // I bygge-tid eller test uden DB findes der ingen URL — lad være med at crashe.
  // Queries der rammer en ikke-eksisterende DB fejler tydeligt på første kald.
  console.warn('[db] DATABASE_URL ikke sat — DB-queries vil fejle indtil den er konfigureret.');
}

// Pool: Drizzle anbefaler max 1 connection per serverless-instans.
// På Vercel/Coolify Next.js kører vi long-lived processer, så vi kan tillade flere.
const queryClient = connectionString
  ? postgres(connectionString, {
      max: process.env.NODE_ENV === 'production' ? 10 : 5,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  : (null as unknown as ReturnType<typeof postgres>);

export const db = queryClient
  ? drizzle(queryClient, { schema, logger: process.env.NODE_ENV === 'development' })
  : (null as unknown as ReturnType<typeof drizzle<typeof schema>>);

export { schema };
