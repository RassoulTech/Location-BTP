/* ==========================================================
   Cree (ou promeut) un compte super administrateur.

     npx tsx scripts/create-admin.ts <email> <prenom> <nom> <mot-de-passe>

   A lancer une seule fois apres `npm run db:seed`. Le mot de passe
   est hache avec scrypt : il n'est jamais stocke en clair.
   ========================================================== */
import { config } from "dotenv";
config({ path: ".env.local" });

import { and, eq } from "drizzle-orm";
import { closePool, db } from "../src/db";
import { roles, userRoles, users } from "../src/db/schema";
import { hashPassword, passwordIssue } from "../src/lib/auth/password";

const [email, firstName, lastName, password] = process.argv.slice(2);

if (!email || !firstName || !lastName || !password) {
  console.error(
    "Usage : npx tsx scripts/create-admin.ts <email> <prenom> <nom> <mot-de-passe>",
  );
  process.exit(1);
}

const issue = passwordIssue(password);
if (issue) {
  console.error(`Mot de passe refuse : ${issue}`);
  process.exit(1);
}

const [role] = await db.select().from(roles).where(eq(roles.slug, "super_admin")).limit(1);
if (!role) {
  console.error("Role super_admin introuvable. Lancez d'abord : npm run db:seed");
  process.exit(1);
}

const normalized = email.trim().toLowerCase();
const passwordHash = await hashPassword(password);

const [existing] = await db.select().from(users).where(eq(users.email, normalized)).limit(1);

const userId = existing
  ? (await db.update(users)
      .set({ passwordHash, firstName, lastName, status: "active", updatedAt: new Date() })
      .where(eq(users.id, existing.id))
      .returning({ id: users.id }))[0]!.id
  : (await db.insert(users)
      .values({ email: normalized, passwordHash, firstName, lastName })
      .returning({ id: users.id }))[0]!.id;

const [link] = await db.select().from(userRoles)
  .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, role.id))).limit(1);

if (!link) await db.insert(userRoles).values({ userId, roleId: role.id });

console.log(
  existing
    ? `Compte ${normalized} mis a jour et promu super administrateur.`
    : `Super administrateur ${normalized} cree.`,
);
console.log("Connectez-vous sur /connexion puis ouvrez /admin.");

await closePool();
