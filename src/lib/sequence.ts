import "server-only";
import { sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { Executor } from "@/db";

/* ==========================================================
   References lisibles (CLI-2026-0042, LOC-2026-0117...)

   Compte les lignes de l'annee en cours et ajoute 1. Suffisant
   ici parce que l'appel se fait toujours DANS une transaction,
   et que la colonne `reference` porte un index unique : deux
   ecritures simultanees ne peuvent pas produire le meme numero,
   la seconde echoue et est rejouee par l'appelant.
   ========================================================== */

export async function nextSequence(
  tx: Executor, table: PgTable, _prefix: string,
): Promise<number> {
  const rows = await tx.execute<{ n: number }>(sql`
    SELECT count(*)::int AS n FROM ${table}
    WHERE created_at >= date_trunc('year', now())
  `);
  return (rows.rows[0]?.n ?? 0) + 1;
}
