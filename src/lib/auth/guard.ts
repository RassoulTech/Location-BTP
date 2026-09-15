import "server-only";
import { redirect } from "next/navigation";
import { currentUser, type SessionUser } from "./session";
import { STAFF_ROLES, type Permission } from "@/lib/permissions";

/* ==========================================================
   Controle d'acces (CDC §44).

   Le Front-End n'est jamais une barriere. Toute page privee et
   toute action sensible commence par l'une de ces fonctions.
   ========================================================== */

export class UnauthenticatedError extends Error {
  constructor() {
    super("Vous devez être connecté pour effectuer cette opération.");
    this.name = "UnauthenticatedError";
  }
}

export class ForbiddenError extends Error {
  constructor(permission?: string) {
    super(
      permission
        ? `Vous n'avez pas la permission requise (${permission}).`
        : "Vous n'avez pas les droits nécessaires.",
    );
    this.name = "ForbiddenError";
  }
}

export function has(user: SessionUser, permission: Permission): boolean {
  return user.permissions.includes(permission);
}

export function hasAny(user: SessionUser, ...perms: Permission[]): boolean {
  return perms.some((p) => user.permissions.includes(p));
}

export function isStaff(user: SessionUser): boolean {
  return user.roles.some((r) => STAFF_ROLES.includes(r));
}

/* ---------- Pour les actions serveur : on leve ---------- */

export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) throw new UnauthenticatedError();
  return user;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!has(user, permission)) throw new ForbiddenError(permission);
  return user;
}

/* ---------- Pour les pages : on redirige ---------- */

export async function requireUserPage(returnTo?: string): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) {
    const suite = returnTo ? `?suite=${encodeURIComponent(returnTo)}` : "";
    redirect(`/connexion${suite}`);
  }
  return user;
}

export async function requirePermissionPage(
  permission: Permission, returnTo?: string,
): Promise<SessionUser> {
  const user = await requireUserPage(returnTo);
  if (!has(user, permission)) redirect("/acces-refuse");
  return user;
}
