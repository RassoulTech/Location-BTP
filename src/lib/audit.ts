import "server-only";
import { db, type Executor } from "@/db";
import { activityLogs } from "@/db/schema";
import type { SessionUser } from "@/lib/auth/session";

/* ==========================================================
   Journal d'activite (CDC §40, §95)

   Qui, quoi, quand, sur quelle ressource, etat avant et apres.
   A ecrire dans la meme transaction que l'operation decrite —
   passez `tx` quand vous etes dans une transaction, sinon le
   journal peut mentir en cas d'echec partiel.
   ========================================================== */

export async function logActivity(params: {
  actor: SessionUser | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
  tx?: Executor;
}): Promise<void> {
  const exec = params.tx ?? db;
  await exec.insert(activityLogs).values({
    actorId: params.actor?.id ?? null,
    actorLabel: params.actor
      ? `${params.actor.firstName} ${params.actor.lastName} <${params.actor.email}>`
      : null,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId ?? null,
    before: (params.before ?? null) as never,
    after: (params.after ?? null) as never,
    ipAddress: params.ipAddress ?? null,
  });
}
