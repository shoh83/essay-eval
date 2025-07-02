// src/lib/db.ts
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('Missing NEON_DATABASE_URL');
}

export const db = neon(process.env.DATABASE_URL);
