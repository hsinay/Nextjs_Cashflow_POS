/**
 * Exports all rows from public PostgreSQL tables into fixtures/db/*.json
 * for local snapshots (excluding _prisma_migrations).
 *
 * Uses DIRECT_URL when set (recommended for Neon), else DATABASE_URL.
 * Loads .env then .env.local from the project root (does not override existing env).
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';

/** Project root (npm scripts run with cwd = repo root). */
const ROOT = process.cwd();
const OUT_DIR = join(ROOT, 'fixtures', 'db');

function loadEnvFiles() {
  for (const name of ['.env', '.env.local']) {
    const p = join(ROOT, name);
    if (!existsSync(p)) continue;
    const raw = readFileSync(p, 'utf8');
    for (let line of raw.split(/\r?\n/)) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

function jsonSafe(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'bigint') return value.toString();
  if (Buffer.isBuffer(value)) return value.toString('base64');
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (typeof value === 'object') {
    const v = value as Record<string, unknown> & { toFixed?: () => string };
    if (typeof v.toFixed === 'function') return String(value);
    if (value.constructor === Object) {
      const o: Record<string, unknown> = {};
      for (const [k, ve] of Object.entries(value as Record<string, unknown>)) {
        o[k] = jsonSafe(ve);
      }
      return o;
    }
  }
  return value;
}

async function main() {
  loadEnvFiles();

  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) {
    console.error('Missing DATABASE_URL (or DIRECT_URL). Set in .env / .env.local.');
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: { db: { url } },
  });

  mkdirSync(OUT_DIR, { recursive: true });

  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
    ORDER BY tablename
  `;

  const manifest: {
    exportedAt: string;
    tables: { name: string; rows: number; file: string }[];
  } = {
    exportedAt: new Date().toISOString(),
    tables: [],
  };

  for (const { tablename } of tables) {
    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM ${quoteIdent(tablename)}`,
    );
    const serialized = rows.map((row) => {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row)) {
        out[k] = jsonSafe(v);
      }
      return out;
    });

    const file = `${tablename}.json`;
    writeFileSync(join(OUT_DIR, file), JSON.stringify(serialized, null, 2), 'utf8');
    manifest.tables.push({ name: tablename, rows: serialized.length, file });
    console.log(`Wrote ${file} (${serialized.length} rows)`);
  }

  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`\nDone. Output: ${OUT_DIR}`);
  console.log(`Manifest: manifest.json (${manifest.tables.length} tables)`);

  await prisma.$disconnect();
}

/** Quote a PostgreSQL identifier (names from pg_catalog only). */
function quoteIdent(ident: string): string {
  return `"${ident.replace(/"/g, '""')}"`;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
