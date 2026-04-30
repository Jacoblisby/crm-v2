import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://placeholder',
  },
  // Holder migration-fil-navne i `0001_xxx`-stil for at matche eksisterende
  migrations: {
    prefix: 'index',
  },
  verbose: true,
  strict: true,
} satisfies Config;
