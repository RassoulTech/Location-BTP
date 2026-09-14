"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers, roles, userRoles, users } from "@/db/schema";
import { hashPassword, passwordIssue, verifyPassword } from "@/lib/auth/password";
import { createSession, currentUser, destroySession } from "@/lib/auth/session";
import { logActivity } from "@/lib/audit";
import { buildReference } from "@/lib/format";
import { fieldErrors, loginSchema, registerSchema } from "@/lib/validation";
import { nextSequence } from "@/lib/sequence";
import { failure, toActionState, type ActionState } from "./state";

async function requestMeta() {
  const h = await headers();
  return {
    ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: h.get("user-agent"),
  };
}

export async function loginAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!parsed.success) {
    return failure("Verifiez les champs.", fieldErrors(parsed.error));
  }

  try {
    const [user] = await db.select().from(users)
      .where(eq(users.email, parsed.data.email)).limit(1);

    // Message identique dans les deux cas : on ne revele pas l'existence du compte.
    const valid = await verifyPassword(parsed.data.password, user?.passwordHash ?? null);
    if (!user || !valid) return failure("Adresse e-mail ou mot de passe incorrect.");

    if (user.status !== "active") {
      return failure("Ce compte est desactive. Contactez l'administrateur.");
    }

    const meta = await requestMeta();
    await createSession(user.id, meta);
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  } catch (err) {
    return toActionState(err);
  }

  const suite = String(form.get("suite") ?? "");
  redirect(suite.startsWith("/") ? suite : "/espace");
}

export async function registerAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    firstName: form.get("firstName"),
    lastName: form.get("lastName"),
    email: form.get("email"),
    phone: form.get("phone"),
    companyName: form.get("companyName"),
    password: form.get("password"),
  });
  if (!parsed.success) {
    return failure("Verifiez les champs.", fieldErrors(parsed.error));
  }

  const pwdIssue = passwordIssue(parsed.data.password);
  if (pwdIssue) return failure(pwdIssue, { password: pwdIssue });

  try {
    const [existing] = await db.select({ id: users.id }).from(users)
      .where(eq(users.email, parsed.data.email)).limit(1);
    if (existing) {
      return failure("Un compte existe deja avec cette adresse.", {
        email: "Adresse deja utilisee.",
      });
    }

    const [clientRole] = await db.select().from(roles).where(eq(roles.slug, "client")).limit(1);
    if (!clientRole) {
      return failure("Les roles ne sont pas encore charges. Lancez `npm run db:seed`.");
    }

    const passwordHash = await hashPassword(parsed.data.password);

    const userId = await db.transaction(async (tx) => {
      const [created] = await tx.insert(users).values({
        email: parsed.data.email,
        passwordHash,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone,
      }).returning({ id: users.id });

      await tx.insert(userRoles).values({ userId: created!.id, roleId: clientRole.id });

      // Chaque inscription cree aussi la fiche client correspondante.
      const nextSeq = await nextSequence(tx, customers, "CLI");
      await tx.insert(customers).values({
        reference: buildReference("CLI", nextSeq),
        type: parsed.data.companyName ? "company" : "individual",
        userId: created!.id,
        companyName: parsed.data.companyName || null,
        contactFirstName: parsed.data.firstName,
        contactLastName: parsed.data.lastName,
        email: parsed.data.email,
        phone: parsed.data.phone,
      });

      return created!.id;
    });

    const meta = await requestMeta();
    await createSession(userId, meta);
    await logActivity({
      actor: null, action: "user.register", entityType: "users", entityId: userId,
      after: { email: parsed.data.email }, ipAddress: meta.ipAddress,
    });
  } catch (err) {
    return toActionState(err);
  }

  redirect("/espace");
}

export async function logoutAction(): Promise<void> {
  const user = await currentUser();
  if (user) {
    await logActivity({ actor: user, action: "user.logout", entityType: "users", entityId: user.id });
  }
  await destroySession();
  redirect("/");
}
