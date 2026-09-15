"use server";

import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, roles, userRoles, users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, currentUser, destroySession } from "@/lib/auth/session";
import { fieldErrors, loginSchema, registerSchema } from "@/lib/validation";
import { failure, toActionState, type ActionState } from "./state";

/* ==========================================================
   Inscription, connexion, deconnexion.

   Deux principes tenus ici :
   - un echec de connexion ne dit JAMAIS si c'est l'adresse ou
     le mot de passe qui est faux, sinon le formulaire devient
     un outil pour savoir qui a un compte ;
   - une inscription cree le compte ET la fiche client, dans la
     meme transaction : pas de compte orphelin (CDC §34).
   ========================================================== */

/** Destination interne sure : on n'accepte jamais une URL externe. */
function safeNext(raw: FormDataEntryValue | null): string | null {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (!v.startsWith("/") || v.startsWith("//")) return null;
  return v;
}

export async function loginAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  let destination = "/espace";
  try {
    const parsed = loginSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) {
      return failure("Vérifiez les champs signalés.", fieldErrors(parsed.error));
    }

    const [user] = await db.select().from(users)
      .where(eq(users.email, parsed.data.email)).limit(1);

    /* Meme si le compte n'existe pas, on verifie un hachage
       factice : sans cela, la duree de la reponse revelerait
       l'existence de l'adresse. */
    const reference = user?.passwordHash
      ?? "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAA";
    const ok = await verifyPassword(parsed.data.password, reference);

    if (!user || !ok) {
      return failure("Adresse e-mail ou mot de passe incorrect.");
    }
    if (!user.isActive) {
      return failure("Ce compte est désactivé. Contactez la conciergerie.");
    }

    await db.update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));

    await createSession(user.id);

    /* Le personnel atterrit sur l'administration, le client sur
       son espace — sauf si une page precise etait demandee. */
    const asked = safeNext(form.get("suite"));
    const staffRows = await db.select({ slug: roles.slug })
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(eq(userRoles.userId, user.id));
    const isStaff = staffRows.some((r) => r.slug !== "client");
    destination = asked ?? (isStaff ? "/admin" : "/espace");
  } catch (err) {
    return toActionState(err);
  }

  /* `redirect` leve une exception de controle : elle doit rester
     hors du try, sinon elle serait avalee comme une erreur. */
  redirect(destination);
}

export async function registerAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const parsed = registerSchema.safeParse({
      firstName: form.get("firstName"),
      lastName: form.get("lastName"),
      email: form.get("email"),
      phone: form.get("phone"),
      companyName: form.get("companyName"),
      password: form.get("password"),
    });
    if (!parsed.success) {
      return failure("Vérifiez les champs signalés.", fieldErrors(parsed.error));
    }
    const input = parsed.data;

    const [existing] = await db.select({ id: users.id }).from(users)
      .where(eq(users.email, input.email)).limit(1);
    if (existing) {
      return failure(
        "Un compte existe déjà avec cette adresse. Connectez-vous, ou utilisez une autre adresse.",
        { email: "Adresse déjà utilisée." },
      );
    }

    const [clientRole] = await db.select().from(roles)
      .where(eq(roles.slug, "client")).limit(1);
    if (!clientRole) {
      return failure(
        "Les rôles ne sont pas encore initialisés sur cet environnement. " +
        "Lancez `npm run db:seed`.",
      );
    }

    const passwordHash = await hashPassword(input.password);

    const userId = await db.transaction(async (tx) => {
      const [created] = await tx.insert(users).values({
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
      }).returning({ id: users.id });

      await tx.insert(userRoles).values({ userId: created!.id, roleId: clientRole.id });

      /* La fiche client nait avec le compte : sans elle, le
         client ne pourrait rien reserver. */
      const counted = await tx.execute<{ n: number }>(sql`
        SELECT count(*)::int AS n FROM ${customers}
        WHERE created_at >= date_trunc('year', now())
      `);
      const n = (counted.rows as { n: number }[])[0]?.n ?? 0;

      await tx.insert(customers).values({
        reference: `CLI-${new Date().getFullYear()}-${String(n + 1).padStart(4, "0")}`,
        type: input.companyName ? "company" : "individual",
        userId: created!.id,
        companyName: input.companyName || null,
        contactFirstName: input.firstName,
        contactLastName: input.lastName,
        email: input.email,
        phone: input.phone,
      });

      return created!.id;
    });

    await createSession(userId);
  } catch (err) {
    return toActionState(err);
  }

  redirect("/espace");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

/** Utilisee par la barre de navigation du site public. */
export async function accountState() {
  const user = await currentUser();
  return {
    signedIn: Boolean(user),
    firstName: user?.firstName ?? null,
  };
}
