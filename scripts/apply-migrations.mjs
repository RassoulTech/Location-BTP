/**
 * Applique les migrations drizzle via le pilote HTTP de Neon.
 * A utiliser quand `drizzle-kit migrate` ne peut pas ouvrir de WebSocket
 * (reseau d'entreprise, proxy). Meme resultat, meme journal.
 *
 *   node scripts/apply-migrations.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL manquant (.env.local)");

const sql = neon(process.env.DATABASE_URL);
const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8"));

await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
await sql`CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
  id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint
)`;
const applied = new Set(
  (await sql`SELECT hash FROM drizzle.__drizzle_migrations`).map((r) => r.hash),
);

for (const entry of journal.entries) {
  const file = readdirSync("drizzle").find((f) => f === `${entry.tag}.sql`);
  if (!file) throw new Error(`Fichier de migration introuvable : ${entry.tag}.sql`);
  const body = readFileSync(`drizzle/${file}`, "utf8");
  const hash = createHash("sha256").update(body).digest("hex");

  if (applied.has(hash)) {
    console.log(`= ${entry.tag} (deja appliquee)`);
    continue;
  }

  const statements = body
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !/^(--[^\n]*\n?)+$/.test(s));

  console.log(`→ ${entry.tag} — ${statements.length} instruction(s)`);
  for (const [i, stmt] of statements.entries()) {
    try {
      await sql.query(stmt);
    } catch (err) {
      console.error(`\n✗ ${entry.tag} instruction ${i + 1} :\n${stmt.slice(0, 300)}\n`);
      throw err;
    }
  }
  await sql`INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
            VALUES (${hash}, ${Date.now()})`;
  console.log(`✓ ${entry.tag}`);
}
console.log("\nMigrations a jour.");
