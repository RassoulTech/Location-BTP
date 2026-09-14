/* ==========================================================
   Amorçage de reference (CDC §12, §13, §102)

   Cree UNIQUEMENT ce qui est structurel : roles, permissions,
   et les cles de parametres a renseigner.

   Aucune donnee commerciale n'est inventee ici : pas de machine,
   pas de tarif, pas de client, pas d'adresse. Les informations
   reelles de l'entreprise sont saisies dans l'administration.

   Idempotent : peut etre relance apres ajout d'une permission.

     npm run db:seed
   ========================================================== */
import { config } from "dotenv";
config({ path: ".env.local" });

import { eq, inArray } from "drizzle-orm";
import { db } from "../src/db";
import { permissions, rolePermissions, roles, settings } from "../src/db/schema";
import { PERMISSIONS, ROLES, permissionsOf, type RoleSlug } from "../src/lib/permissions";

/** Cles de parametres attendues, laissees vides tant qu'elles ne sont pas confirmees. */
const SETTING_KEYS: { key: string; label: string; description: string }[] = [
  { key: "company.legal_name", label: "Raison sociale", description: "Nom legal exact de l'entreprise" },
  { key: "company.ninea", label: "NINEA", description: "Numero d'identification national des entreprises" },
  { key: "company.rccm", label: "RCCM", description: "Registre du commerce et du credit mobilier" },
  { key: "company.address", label: "Adresse du siege", description: "Adresse postale complete" },
  { key: "company.phones", label: "Telephones", description: "Numeros de contact publics" },
  { key: "company.emails", label: "Adresses e-mail", description: "Contacts publics" },
  { key: "company.opening_hours", label: "Horaires", description: "Horaires d'ouverture reels" },
  { key: "company.service_areas", label: "Zones desservies", description: "Villes et zones de livraison reelles" },
  { key: "billing.vat_rate_bp", label: "Taux de TVA", description: "En points de base. 1800 = 18 %" },
  { key: "billing.currency", label: "Devise", description: "Code ISO. XOF pour le FCFA" },
  { key: "delivery.flat_fee", label: "Forfait de livraison", description: "Montant en FCFA, a confirmer" },
  { key: "rental.discount_week_bp", label: "Remise hebdomadaire", description: "A partir de 7 jours, en points de base" },
  { key: "rental.discount_month_bp", label: "Remise mensuelle", description: "A partir de 30 jours, en points de base" },
  { key: "rental.min_lead_days", label: "Delai minimum", description: "Nombre de jours avant le debut de location" },
];

async function main() {
  console.log("→ Permissions");
  const wanted = Object.entries(PERMISSIONS).map(([slug, description]) => {
    const [resource, action] = slug.split(".");
    return { slug, resource: resource!, action: action!, description };
  });
  for (const p of wanted) {
    await db.insert(permissions).values(p).onConflictDoUpdate({
      target: permissions.slug,
      set: { description: p.description, resource: p.resource, action: p.action },
    });
  }
  console.log(`  ${wanted.length} permissions synchronisees`);

  console.log("→ Roles");
  for (const [slug, def] of Object.entries(ROLES)) {
    await db.insert(roles).values({
      slug, name: def.name, description: def.description, isSystem: true,
    }).onConflictDoUpdate({
      target: roles.slug,
      set: { name: def.name, description: def.description, isSystem: true },
    });
  }

  const allRoles = await db.select().from(roles);
  const allPerms = await db.select().from(permissions);
  const permId = new Map(allPerms.map((p) => [p.slug, p.id]));

  for (const role of allRoles) {
    const slugs = permissionsOf(role.slug as RoleSlug);
    if (!slugs.length) continue;
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));
    await db.insert(rolePermissions).values(
      slugs.map((s) => ({ roleId: role.id, permissionId: permId.get(s)! })),
    );
    console.log(`  ${role.slug.padEnd(12)} ${slugs.length} permissions`);
  }

  console.log("→ Cles de parametres (valeurs laissees vides)");
  const existing = await db.select({ key: settings.key }).from(settings)
    .where(inArray(settings.key, SETTING_KEYS.map((s) => s.key)));
  const known = new Set(existing.map((e) => e.key));
  const missing = SETTING_KEYS.filter((s) => !known.has(s.key));
  if (missing.length) {
    await db.insert(settings).values(
      missing.map((s) => ({ key: s.key, label: s.label, description: s.description, value: null })),
    );
  }
  console.log(`  ${missing.length} cle(s) creee(s), ${known.size} deja presente(s)`);

  console.log("\nAmorçage termine. Aucune donnee commerciale n'a ete creee.");
  console.log("Les valeurs reelles de l'entreprise restent a saisir.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
