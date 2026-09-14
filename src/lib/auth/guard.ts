import "server-only";
import { redirect } from "next/navigation";
import { currentUser, type SessionUser } from "./session";
import type { Permission } from "@/lib/permissions";

/* ==========================================================
   Gardes d'acces (CDC §44)

   Toute action serveur et toute page privee commence par un de
   ces appels. Le middleware ne fait qu'aiguiller : il ne sert
   jamais de barriere, et masquer un bouton ne protege rien.
   ========================================================== */

export class ForbiddenError extends Error {
  constructor(permission?: string) {
    super(
      permission
        ? `Vous n'avez pas la permission requise (${permission}).`
        : "Vous n'avez pas acces a cette ressource.",
    );
    this.name = "ForbiddenError";
  }
}

export class UnauthenticatedError extends Error {
  constructor() {
    super("Vous devez etre connecte.");
    this.name = "UnauthenticatedError";
  }
}

/** Pour les pages : redirige vers la connexion si absent. */
export async function requireUserPage(returnTo?: string): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) {
    redirect(`/connexion${returnTo ? `?suite=${encodeURIComponent(returnTo)}` : ""}`);
  }
  return user;
}

/** Pour les actions serveur : leve plutot que de rediriger. */
export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) throw new UnauthenticatedError();
  return user;
}

export function has(user: SessionUser, permission: Permission): boolean {
  return user.permissions.has(permission);
}

export function hasAny(user: SessionUser, ...perms: Permission[]): boolean {
  return perms.some((p) => user.permissions.has(p));
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.permissions.has(permission)) throw new ForbiddenError(permission);
  return user;
}

export async function requirePermissionPage(
  permission: Permission, returnTo?: string,
): Promise<SessionUser> {
  const user = await requireUserPage(returnTo);
  if (!user.permissions.has(permission)) redirect("/acces-refuse");
  return user;
}

/** true si l'utilisateur voit l'espace d'administration. */
export function isStaff(user: SessionUser): boolean {
  return user.roles.some((r) => r !== "client");
}
