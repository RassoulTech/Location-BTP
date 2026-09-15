import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db";
import { roles, sessions, userRoles, users } from "@/db/schema";
import { permissionsOfRole, type Permission, type RoleSlug } from "@/lib/permissions";

/* ==========================================================
   Sessions (CDC §11, §43).

   Le cookie porte un jeton aleatoire de 32 octets. En base on
   ne stocke que son SHA-256 : si la table fuite, les jetons
   ne sont pas rejouables. Chaque session est revocable
   individuellement.
   ========================================================== */

const COOKIE = "ndiobeen_session";
const DURATION_DAYS = 30;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  roles: RoleSlug[];
  permissions: Permission[];
};

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + DURATION_DAYS * 86_400_000);

  const head = await headers();
  await db.insert(sessions).values({
    userId,
    tokenHash: hash(token),
    expiresAt,
    ipAddress: head.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: head.get("user-agent")?.slice(0, 500) ?? null,
  });

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  /* Menage opportuniste des sessions expirees. */
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, hash(token)));
  jar.delete(COOKIE);
}

/**
 * L'utilisateur de la requete en cours, ou null.
 * `cache` de React : une seule lecture par requete, meme si
 * plusieurs composants la demandent.
 */
export const currentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      isActive: users.isActive,
      roleSlug: roles.slug,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .leftJoin(userRoles, eq(userRoles.userId, users.id))
    .leftJoin(roles, eq(roles.id, userRoles.roleId))
    .where(and(eq(sessions.tokenHash, hash(token)), gt(sessions.expiresAt, new Date())));

  const first = rows[0];
  if (!first || !first.isActive) return null;

  const slugs = [...new Set(
    rows.map((r) => r.roleSlug).filter((s): s is RoleSlug => Boolean(s)),
  )];

  const perms = new Set<Permission>();
  for (const slug of slugs) for (const p of permissionsOfRole(slug)) perms.add(p);

  return {
    id: first.id,
    email: first.email,
    firstName: first.firstName,
    lastName: first.lastName,
    phone: first.phone,
    roles: slugs,
    permissions: [...perms],
  };
});
