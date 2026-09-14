import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db";
import { roles, rolePermissions, permissions, sessions, userRoles, users } from "@/db/schema";
import type { Permission } from "@/lib/permissions";

/* ==========================================================
   Sessions (CDC §11, §43)

   Le cookie ne porte qu'un jeton aleatoire ; seul son SHA-256 est
   stocke. Une fuite de la table ne permet donc pas de se connecter.
   Les sessions sont revocables une par une cote serveur.
   ========================================================== */

const COOKIE = "btp_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 jours

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: "active" | "disabled";
  roles: string[];
  permissions: Set<Permission>;
};

export async function createSession(userId: string, meta?: {
  ipAddress?: string | null; userAgent?: string | null;
}): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + MAX_AGE_SECONDS * 1000);

  await db.insert(sessions).values({
    userId,
    tokenHash: sha256(token),
    expiresAt,
    ipAddress: meta?.ipAddress ?? null,
    userAgent: meta?.userAgent?.slice(0, 300) ?? null,
  });

  // Menage opportuniste des sessions expirees.
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
  jar.delete(COOKIE);
}

/**
 * Utilisateur de la requete courante, avec ses permissions resolues.
 * Memoise par requete : plusieurs appels ne font qu'une lecture.
 */
export const currentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  const [row] = await db
    .select({
      id: users.id, email: users.email, firstName: users.firstName,
      lastName: users.lastName, status: users.status,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!row || row.status !== "active") return null;

  const granted = await db
    .select({ roleSlug: roles.slug, permissionSlug: permissions.slug })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(eq(userRoles.userId, row.id));

  return {
    ...row,
    roles: [...new Set(granted.map((g) => g.roleSlug))],
    permissions: new Set(
      granted.map((g) => g.permissionSlug).filter(Boolean) as Permission[],
    ),
  };
});
